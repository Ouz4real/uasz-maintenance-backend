// src/app/core/guards/auth.guard.ts
import { inject } from '@angular/core';
import { CanActivateChildFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateChildFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const isLoggedIn = authService.isAuthenticated();

  if (!isLoggedIn) {
    // 🔁 Si pas connecté → retour login
    router.navigate(['/login'], {
      queryParams: { returnUrl: state.url },
    });
    return false;
  }

  // ✅ Utilisateur connecté → on laisse passer
  return true;
};
