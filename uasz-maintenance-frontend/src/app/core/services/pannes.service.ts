import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PanneApi } from '../models/panne.model';

@Injectable({
  providedIn: 'root'
})
export class PannesService {

  private readonly apiUrl = environment.apiUrl + '/pannes';

  constructor(private http: HttpClient) {}

  /** 🔹 Toutes les pannes affectées au technicien (NON_DEMARREE + EN_COURS) */
  getPannesAffecteesAuTechnicien(technicienId: number): Observable<PanneApi[]> {
    return this.http.get<PanneApi[]>(
      `${this.apiUrl}/technicien/${technicienId}/affectees`
    );
  }

  /** 🔹 Pannes EN COURS (Interventions en cours – détails) */
  getEnCoursByTechnicien(technicienId: number): Observable<PanneApi[]> {
    return this.http.get<PanneApi[]>(
      `${this.apiUrl}/technicien/${technicienId}/en-cours`
    );
  }

  /** 🔹 Pannes TERMINÉES (Dernières interventions) */
  getRecentesByTechnicien(technicienId: number): Observable<PanneApi[]> {
    return this.http.get<PanneApi[]>(
      `${this.apiUrl}/technicien/${technicienId}/recentes`
    );
  }

  /** 🔹 Démarrer une intervention (passer de NON_DEMARREE à EN_COURS) */
  demarrerIntervention(panneId: number): Observable<any> {
    return this.http.patch<any>(
      `${this.apiUrl}/${panneId}/demarrer-intervention`,
      {}
    );
  }

  /** 🔹 Terminer une intervention (passer de EN_COURS à TERMINEE) */
  terminerIntervention(panneId: number, noteTechnicien: string, pieces: Array<{ nom: string; quantite: number }>): Observable<any> {
    return this.http.patch<any>(
      `${this.apiUrl}/${panneId}/terminer-intervention`,
      {
        noteTechnicien,
        pieces
      }
    );
  }

  /** 🔹 Marquer une panne comme résolue (responsable uniquement) */
  marquerPanneResolue(panneId: number, marquerResolue: boolean): Observable<any> {
    return this.http.patch<any>(
      `${this.apiUrl}/${panneId}/marquer-resolue`,
      { marquerResolue }
    );
  }

  /** 🔹 Statistiques du technicien */
  getStatsTechnicien(technicienId: number): Observable<any> {
    return this.http.get<any>(
      `${this.apiUrl}/technicien/${technicienId}/stats`
    );
  }

  /** 🔹 Mes pannes (pannes créées par l'utilisateur connecté) */
  getMesPannes(): Observable<PanneApi[]> {
    return this.http.get<PanneApi[]>(`${this.apiUrl}/mes-pannes`);
  }

  /** 🔹 Créer une panne (multipart/form-data) */
  createPanne(formData: FormData): Observable<PanneApi> {
    return this.http.post<PanneApi>(this.apiUrl, formData);
  }
}
