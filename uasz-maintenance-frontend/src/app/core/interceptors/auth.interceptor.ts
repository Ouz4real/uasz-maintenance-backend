import { HttpInterceptorFn, HttpErrorResponse, HttpRequest, HttpHandlerFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { throwError, BehaviorSubject, Observable } from 'rxjs';
import { catchError, filter, switchMap, take } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

// Shared state pour éviter plusieurs refresh simultanés
let isRefreshing = false;
const refreshTokenSubject = new BehaviorSubject<string | null>(null);
const API_URL = environment.apiUrl + '/auth';

function addToken(req: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
  return req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
}

function handle401(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
  http: HttpClient,
  router: Router
): Observable<any> {
  if (isRefreshing) {
    return refreshTokenSubject.pipe(
      filter(t => t !== null),
      take(1),
      switchMap(t => next(addToken(req, t!)))
    );
  }

  isRefreshing = true;
  refreshTokenSubject.next(null);

  const refreshToken = localStorage.getItem('auth_refresh_token');
  if (!refreshToken) {
    isRefreshing = false;
    localStorage.clear();
    router.navigate(['/login'], { replaceUrl: true });
    return throwError(() => new Error('No refresh token'));
  }

  return http.post<{ token: string }>(`${API_URL}/refresh`, { refreshToken }).pipe(
    switchMap(res => {
      isRefreshing = false;
      localStorage.setItem('auth_token', res.token);
      refreshTokenSubject.next(res.token);
      return next(addToken(req, res.token));
    }),
    catchError(err => {
      isRefreshing = false;
      localStorage.clear();
      router.navigate(['/login'], { replaceUrl: true });
      return throwError(() => err);
    })
  );
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const http = inject(HttpClient);
  const router = inject(Router);

  const token = localStorage.getItem('auth_token');
  const authReq = token ? addToken(req, token) : req;

  return next(authReq).pipe(
    catchError(err => {
      if (err instanceof HttpErrorResponse && err.status === 401
          && !req.url.includes('/auth/')) {
        return handle401(req, next, http, router);
      }
      return throwError(() => err);
    })
  );
};
