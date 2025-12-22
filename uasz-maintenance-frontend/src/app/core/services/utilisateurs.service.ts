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
  role: string; // "TECHNICIEN"
  enabled?: boolean;
}

@Injectable({ providedIn: 'root' })
export class UtilisateursService {
  private readonly apiRoot = environment.apiUrl; // ex: http://localhost:8080/api

  constructor(private http: HttpClient) {}

  getByRole(role: string): Observable<UtilisateurDto[]> {
    const params = new HttpParams().set('role', role);
    return this.http.get<UtilisateurDto[]>(`${this.apiRoot}/utilisateurs`, { params });
  }

  getTechniciens(): Observable<UtilisateurDto[]> {
    const params = new HttpParams().set('role', 'TECHNICIEN');
    return this.http.get<UtilisateurDto[]>(`${this.apiRoot}/utilisateurs`, { params });
  }


}
