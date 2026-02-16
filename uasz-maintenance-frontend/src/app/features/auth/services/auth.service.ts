import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

export interface AuthResponse {
  token: string;
  type: string;
  userId: number;
  username: string;
  email: string;
  role: 'DEMANDEUR' | 'TECHNICIEN' | 'RESPONSABLE_MAINTENANCE' | 'SUPERVISEUR' | 'ADMIN';
}

export interface LoginRequest {
  usernameOrEmail: string;
  motDePasse: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);
  private readonly API_URL = 'http://localhost:8080/api/auth';

  login(payload: LoginRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.API_URL}/login`, payload)
      .pipe(
        tap((res) => {
          localStorage.setItem('auth_token', res.token);
          localStorage.setItem('auth_role', res.role);
          localStorage.setItem('auth_username', res.username);
          localStorage.setItem('auth_user_id', String(res.userId));
        })
      );
  }

  logout(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_role');
    localStorage.removeItem('auth_username');
    localStorage.removeItem('auth_user_id');
  }

  get token(): string | null {
    return localStorage.getItem('auth_token');
  }

  get role(): string | null {
    return localStorage.getItem('auth_role');
  }

  isAuthenticated(): boolean {
    return !!this.token;
  }
}
