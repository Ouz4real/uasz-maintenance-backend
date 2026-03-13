import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface UtilisateurDto {
  id: number;
  username: string;
  email?: string;
  nom?: string;
  prenom?: string;
  telephone?: string;
  departement?: string;
  serviceUnite?: string;
  role: string;
  enabled?: boolean;
  createdAt?: string;
}

export interface CreateUtilisateurRequest {
  username: string;
  motDePasse: string | null; // null pour utiliser le mot de passe par défaut
  email?: string;
  nom?: string;
  prenom?: string;
  telephone?: string;
  departement?: string;
  serviceUnite?: string;
  role: string;
}

export interface UpdateUtilisateurRequest {
  email?: string;
  nom?: string;
  prenom?: string;
  telephone?: string;
  departement?: string;
  serviceUnite?: string;
  role?: string;
  enabled?: boolean;
}

export interface UpdateProfileRequest {
  nom?: string;
  prenom?: string;
  email?: string;
  telephone?: string;
  departement?: string;
  serviceUnite?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

@Injectable({ providedIn: 'root' })
export class UtilisateursService {
  private readonly apiRoot = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // Récupérer tous les utilisateurs
  getAll(): Observable<UtilisateurDto[]> {
    return this.http.get<UtilisateurDto[]>(`${this.apiRoot}/utilisateurs`);
  }

  // Récupérer par rôle
  getByRole(role: string): Observable<UtilisateurDto[]> {
    const params = new HttpParams().set('role', role);
    return this.http.get<UtilisateurDto[]>(`${this.apiRoot}/utilisateurs`, { params });
  }

  // Récupérer les techniciens avec stats
  getTechniciens(): Observable<UtilisateurDto[]> {
    return this.http.get<any[]>(`${this.apiRoot}/utilisateurs/techniciens/supervision`);
  }

  // Récupérer un utilisateur par ID
  getById(id: number): Observable<UtilisateurDto> {
    return this.http.get<UtilisateurDto>(`${this.apiRoot}/utilisateurs/${id}`);
  }

  // Créer un utilisateur
  create(request: CreateUtilisateurRequest): Observable<UtilisateurDto> {
    return this.http.post<UtilisateurDto>(`${this.apiRoot}/utilisateurs`, request);
  }

  // Mettre à jour un utilisateur
  update(id: number, request: UpdateUtilisateurRequest): Observable<UtilisateurDto> {
    return this.http.put<UtilisateurDto>(`${this.apiRoot}/utilisateurs/${id}`, request);
  }

  // Activer/Désactiver un utilisateur
  toggleEnabled(id: number, enabled: boolean): Observable<UtilisateurDto> {
    return this.http.patch<UtilisateurDto>(`${this.apiRoot}/utilisateurs/${id}/enabled`, { enabled });
  }

  // Supprimer un utilisateur
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiRoot}/utilisateurs/${id}`);
  }

  // Réinitialiser le mot de passe
  resetPassword(id: number, newPassword: string): Observable<void> {
    return this.http.post<void>(`${this.apiRoot}/utilisateurs/${id}/reset-password`, { newPassword });
  }

  // Récupérer le profil de l'utilisateur connecté
  getMyProfile(): Observable<UtilisateurDto> {
    return this.http.get<UtilisateurDto>(`${this.apiRoot}/utilisateurs/me`);
  }

  // Mettre à jour le profil de l'utilisateur connecté
  updateMyProfile(request: UpdateProfileRequest): Observable<UtilisateurDto> {
    return this.http.put<UtilisateurDto>(`${this.apiRoot}/utilisateurs/me`, request);
  }

  // Changer le mot de passe de l'utilisateur connecté
  changeMyPassword(request: ChangePasswordRequest): Observable<void> {
    return this.http.put<void>(`${this.apiRoot}/utilisateurs/me/password`, request);
  }
}
