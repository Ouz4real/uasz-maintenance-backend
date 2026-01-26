// interventions.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { StatsTechnicienResponse } from './stats-technicien-response';
import {Intervention} from './intervention';

export type StatutInterventionApi =
  | 'EN_COURS'
  | 'TERMINEE'
  | 'ANNULEE'
  | 'PLANIFIEE'
  | string;

export interface InterventionDto {
  id: number;
  statut?: StatutInterventionApi;

  // dates ISO
  dateDebut?: string | null;
  dateFin?: string | null;
  dateCreation?: string | null; // si ton backend l'expose, sinon inutile
  description?: string | null;   // ✅ AJOUTE
  type?: string | null;

  commentaire?: string | null;

  panne?: {
    id: number;
    titre?: string | null;
    lieu?: string | null;
  } | null;

  panneId?: number | null;

  // au cas où tu exposes direct
  titre?: string | null;
  lieu?: string | null;
}

@Injectable({ providedIn: 'root' })
export class InterventionsService {
  private readonly apiRoot = environment.apiUrl; // ex: http://localhost:8080/api
  private readonly baseUrl = `${this.apiRoot}/interventions`;

  constructor(private http: HttpClient) {}

  // ✅ Interventions en cours d'un technicien
  getInterventionsEnCoursByTechnicien(technicienId: number) {
    return this.http.get<Intervention[]>(
      `${this.baseUrl}/interventions/technicien/${technicienId}/en-cours`
    );
  }


  // ✅ 5 dernières interventions d'un technicien
  getRecentesByTechnicien(id: number): Observable<InterventionDto[]> {
    return this.http.get<InterventionDto[]>(
      `${this.baseUrl}/technicien/${id}/recentes`
    );
  }

  // ✅ Stats d'un technicien
  getStatsByTechnicien(technicienId: number): Observable<StatsTechnicienResponse> {
    return this.http.get<StatsTechnicienResponse>(
      `${this.baseUrl}/technicien/${technicienId}/stats`
    );
  }

  getById(id: number): Observable<InterventionDto> {
    return this.http.get<InterventionDto>(`${this.baseUrl}/${id}`);
  }

}
