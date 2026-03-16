// techniciens.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface TechnicienOptionDto {
  id: number;
  username: string;
  nom?: string | null;
  prenom?: string | null;
  serviceUnite?: string | null;
  role: string;
}



@Injectable({ providedIn: 'root' })
export class TechniciensService {
  private readonly apiRoot = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // ✅ LISTE DES TECHNICIENS
  getTechniciens(): Observable<TechnicienOptionDto[]> {
    return this.http.get<TechnicienOptionDto[]>(
      `${this.apiRoot}/utilisateurs`,
      { params: { role: 'TECHNICIEN' } }
    );
  }

  // ✅ DASHBOARD D’UN TECHNICIEN
  getTechnicienDashboard(technicienId: number) {
    return this.http.get<any>(
      `${this.apiRoot}/dashboard/technicien/${technicienId}`
    );
  }

}
