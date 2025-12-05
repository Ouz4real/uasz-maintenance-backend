// src/app/core/guards/auth.guard.ts

import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    // ✅ Token présent → accès autorisé
    return true;
  }

  // 🔴 Pas authentifié → redirection vers /login
  router.navigate(['/login'], { replaceUrl: true });
  return false;
};
