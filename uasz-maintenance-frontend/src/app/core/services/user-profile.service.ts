import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface UserProfile {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  telephone?: string;
  service?: string;
  departement?: string;
  role: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

@Injectable({
  providedIn: 'root',
})
export class UserProfileService {
  private apiUrl = environment.apiUrl + '/utilisateurs';

  constructor(private http: HttpClient) {}

  /** Récupère le profil de l'utilisateur connecté */
  getMyProfile(): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.apiUrl}/me`);
  }

  /** Met à jour le profil */
  updateMyProfile(payload: Partial<UserProfile>): Observable<UserProfile> {
    return this.http.put<UserProfile>(`${this.apiUrl}/me`, payload);
  }

  /** Change le mot de passe */
  changePassword(payload: ChangePasswordRequest): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/me/password`, payload);
  }
}
