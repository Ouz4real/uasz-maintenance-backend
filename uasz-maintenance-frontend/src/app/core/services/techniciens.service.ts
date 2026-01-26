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
  private readonly apiRoot = environment.apiUrl; // ex: http://localhost:8080/api

  constructor(private http: HttpClient) {}

  getTechniciens(): Observable<TechnicienOptionDto[]> {
    return this.http.get<TechnicienOptionDto[]>(`${this.apiRoot}/utilisateurs`, {
      params: { role: 'TECHNICIEN' }
    });
  }

}
