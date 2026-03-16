// src/app/core/services/superviseur-api.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { EquipementStatsDto } from '../models/equipement-stats.model';

export interface SuperviseurDashboardDto {
  superviseurId: number;
  username: string;
  email: string;

  // Pannes
  totalPannes: number;
  pannesOuvertes: number;
  pannesEnCours: number;
  pannesResolues: number;
  pannesAnnulees: number;

  // Répartition par priorité
  pannesPrioriteHaute: number;
  pannesPrioriteMoyenne: number;
  pannesPrioriteBasse: number;

  // Indicateurs globaux sur les pannes
  tempsMoyenResolutionMinutes: number | null;
  nombreEquipementsImpactes: number;

  // Interventions
  totalInterventions: number;
  interventionsPlanifiees: number;
  interventionsEnCours: number;
  interventionsTerminees: number;
  interventionsAnnulees: number;

  // Indicateur global sur les interventions
  tempsMoyenRealisationMinutes: number | null;
}

@Injectable({
  providedIn: 'root'
})
export class SuperviseurApiService {
  private baseUrl = 'http://localhost:8080/api/superviseurs';

  constructor(private http: HttpClient) {}

  /**
   * Récupère le dashboard du superviseur connecté
   */
  getMonDashboard(): Observable<SuperviseurDashboardDto> {
    return this.http.get<SuperviseurDashboardDto>(`${this.baseUrl}/mon-dashboard`);
  }

  /**
   * Récupère le dashboard du superviseur connecté avec filtrage par période
   */
  getMonDashboardByPeriode(dateDebut: string, dateFin: string): Observable<SuperviseurDashboardDto> {
    const params = { dateDebut, dateFin };
    return this.http.get<SuperviseurDashboardDto>(`${this.baseUrl}/mon-dashboard/periode`, { params });
  }

  /**
   * Récupère le dashboard d'un superviseur spécifique par ID
   */
  getDashboard(superviseurId: number): Observable<SuperviseurDashboardDto> {
    return this.http.get<SuperviseurDashboardDto>(`${this.baseUrl}/${superviseurId}/dashboard`);
  }

  /**
   * Récupère les statistiques des équipements
   */
  getEquipementStats(): Observable<EquipementStatsDto> {
    return this.http.get<EquipementStatsDto>(`${this.baseUrl}/equipements/stats`);
  }

  /**
   * Récupère les statistiques des équipements avec filtrage par période
   */
  getEquipementStatsByPeriode(dateDebut: string, dateFin: string): Observable<EquipementStatsDto> {
    const params = { dateDebut, dateFin };
    return this.http.get<EquipementStatsDto>(`${this.baseUrl}/equipements/stats/periode`, { params });
  }
}
