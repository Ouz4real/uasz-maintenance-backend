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

  private readonly apiRoot = environment.apiUrl + '/interventions';

  constructor(private http: HttpClient) {}

  // 🔹 Interventions en cours
  getInterventionsEnCoursTechnicien(technicienId: number) {
    return this.http.get<any[]>(
      `${this.apiRoot}/technicien/${technicienId}/en-cours`
    );
  }

  // 🔹 Dernières interventions
  getDernieresInterventionsTechnicien(technicienId: number) {
    return this.http.get<any[]>(
      `${this.apiRoot}/technicien/${technicienId}/recentes`
    );
  }

  // ✅ Stats d'un technicien (basées sur les PANNES, pas les interventions)
  getStatsByTechnicien(technicienId: number): Observable<StatsTechnicienResponse> {
    return this.http.get<StatsTechnicienResponse>(
      `${environment.apiUrl}/pannes/technicien/${technicienId}/stats`
    );
  }

  getById(id: number): Observable<InterventionDto> {
    return this.http.get<InterventionDto>(`${this.apiRoot}/${id}`);
  }

}
