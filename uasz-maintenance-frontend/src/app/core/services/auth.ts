// src/app/core/services/auth.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';

export interface LoginRequest {
  // contrat attendu par ton backend
  usernameOrEmail: string;
  motDePasse: string;
}

export interface LoginResponse {
  token: string;
  username: string;
  role: string; // ex: "DEMANDEUR", "TECHNICIEN", "RESPONSABLE", "SUPERVISEUR", "ADMINISTRATEUR", etc.
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = 'http://localhost:8080/api/auth'; // adapte si besoin

  constructor(private http: HttpClient, private router: Router) {}

  // === APPEL LOGIN AU BACKEND ===
  login(payload: LoginRequest): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.apiUrl}/login`, payload)
      .pipe(
        tap((res) => {
          console.log('✅ Réponse login backend :', res);

          const normalizedRole = this.normalizeRole(res.role);
          console.log('🔁 Rôle normalisé (avant stockage) =', normalizedRole);

          // on stocke déjà la version normalisée
          this.saveAuthData({
            ...res,
            role: normalizedRole,
          });
        })
      );
  }

  // === NORMALISATION DU RÔLE ===
  private normalizeRole(rawRole: string | null | undefined): string {
    const r = (rawRole || '').toUpperCase().trim();

    // ADMIN
    if (
      r === 'ADMIN' ||
      r === 'ADMINISTRATEUR' ||
      r === 'ROLE_ADMIN' ||
      r === 'ROLE_ADMINISTRATEUR'
    ) {
      return 'ADMIN';
    }

    // DEMANDEUR
    if (r === 'DEMANDEUR' || r === 'ROLE_DEMANDEUR') {
      return 'DEMANDEUR';
    }

    // TECHNICIEN
    if (r === 'TECHNICIEN' || r === 'ROLE_TECHNICIEN') {
      return 'TECHNICIEN';
    }

    // RESPONSABLE
    if (
      r === 'RESPONSABLE' ||
      r === 'RESPONSABLE_MAINTENANCE' ||
      r === 'ROLE_RESPONSABLE'
    ) {
      return 'RESPONSABLE';
    }

    // SUPERVISEUR
    if (r === 'SUPERVISEUR' || r === 'ROLE_SUPERVISEUR') {
      return 'SUPERVISEUR';
    }

    // Si inconnu → on retourne quand même pour logging
    return r;
  }

  // === SAUVEGARDE DANS LOCALSTORAGE ===
  private saveAuthData(res: LoginResponse): void {
    localStorage.setItem('auth_token', res.token);
    localStorage.setItem('auth_username', res.username);
    localStorage.setItem('auth_role', res.role); // déjà normalisé
  }

  // === UTILITAIRES ===
  getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  getRole(): string | null {
    return localStorage.getItem('auth_role');
  }

  getUsername(): string | null {
    return localStorage.getItem('auth_username');
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

// src/app/core/services/auth.ts

  logout(): void {
    // On nettoie tout
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_username');
    localStorage.removeItem('auth_role');

    // On renvoie vers /login et on remplace l'URL
    this.router.navigate(['/login'], { replaceUrl: true });
  }


  // === REDIRECTION PAR RÔLE (cette fois on renormalise toujours) ===
  redirectUserByRole(role: string): void {
    const r = this.normalizeRole(role); // 🔴 on repasse par normalizeRole ici
    console.log('➡️ redirectUserByRole() avec rôle normalisé =', r);

    switch (r) {
      case 'DEMANDEUR':
        this.router.navigate(['/dashboard/demandeur']);
        break;

      case 'TECHNICIEN':
        this.router.navigate(['/dashboard/technicien']);
        break;

      case 'RESPONSABLE':
        this.router.navigate(['/dashboard/responsable']);
        break;

      case 'SUPERVISEUR':
        this.router.navigate(['/dashboard/superviseur']);
        break;

      case 'ADMIN':
        this.router.navigate(['/dashboard/admin']);
        break;

      default:
        console.warn(
          '⚠️ Rôle non reconnu dans redirectUserByRole() → retour /login. Rôle reçu (après normalisation) :',
          r
        );
        this.router.navigate(['/login']);
        break;
    }
  }
}
