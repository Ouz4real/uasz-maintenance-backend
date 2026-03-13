import { Injectable } from '@angular/core';
import { BehaviorSubject, interval, Observable } from 'rxjs';
import { switchMap, startWith, tap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { PannesService } from './pannes.service';
import { PannesResponsableService, PanneDto } from './pannes-responsable.service';
import { PanneApi } from '../models/panne.model';

/**
 * Service de polling automatique pour les demandes/interventions
 * Rafraîchit automatiquement les données toutes les 15 secondes pour tous les utilisateurs
 */
@Injectable({
  providedIn: 'root'
})
export class DemandesPollingService {
  
  // Intervalle de polling en millisecondes (15 secondes)
  private readonly POLLING_INTERVAL = 15000;
  
  // BehaviorSubjects pour chaque type de données
  private demandesTechnicienSubject = new BehaviorSubject<PanneApi[]>([]);
  private demandesResponsableSubject = new BehaviorSubject<PanneDto[]>([]);
  private mesDemandesSubject = new BehaviorSubject<PanneApi[]>([]);
  
  // Observables publics
  public demandesTechnicien$ = this.demandesTechnicienSubject.asObservable();
  public demandesResponsable$ = this.demandesResponsableSubject.asObservable();
  public mesDemandes$ = this.mesDemandesSubject.asObservable();
  
  // ID de l'utilisateur connecté
  private currentUserId: number | null = null;
  private currentUserRole: string | null = null;
  
  // Flag pour savoir si le polling est actif
  private pollingActive = false;
  
  constructor(
    private pannesService: PannesService,
    private pannesResponsableService: PannesResponsableService
  ) {}
  
  /**
   * Démarre le polling automatique pour un utilisateur
   * @param userId ID de l'utilisateur connecté
   * @param userRole Rôle de l'utilisateur (TECHNICIEN, RESPONSABLE_MAINTENANCE, etc.)
   */
  startPolling(userId: number, userRole: string): void {
    if (this.pollingActive && this.currentUserId === userId) {
      // Déjà en cours de polling pour cet utilisateur
      return;
    }
    
    this.currentUserId = userId;
    this.currentUserRole = userRole;
    this.pollingActive = true;
    
    console.log(`🔄 Démarrage du polling automatique des demandes pour l'utilisateur ${userId} (${userRole})`);
    
    // Polling selon le rôle
    if (userRole === 'TECHNICIEN') {
      this.startTechnicienPolling(userId);
    } else if (userRole === 'RESPONSABLE_MAINTENANCE') {
      this.startResponsablePolling();
    }
    
    // Polling des "Mes demandes" pour tous les rôles
    this.startMesDemandesPolling(userId);
  }
  
  /**
   * Arrête le polling automatique
   */
  stopPolling(): void {
    this.pollingActive = false;
    this.currentUserId = null;
    this.currentUserRole = null;
    console.log('⏹️ Arrêt du polling automatique des demandes');
  }
  
  /**
   * Polling pour les interventions du technicien
   */
  private startTechnicienPolling(technicienId: number): void {
    interval(this.POLLING_INTERVAL)
      .pipe(
        startWith(0),
        switchMap(() => {
          if (!this.pollingActive || this.currentUserId !== technicienId) {
            return of([]);
          }
          return this.pannesService.getPannesAffecteesAuTechnicien(technicienId);
        }),
        catchError(err => {
          console.error('Erreur polling interventions technicien:', err);
          return of([]);
        })
      )
      .subscribe(pannes => {
        if (this.pollingActive && pannes.length >= 0) {
          this.demandesTechnicienSubject.next(pannes);
        }
      });
  }
  
  /**
   * Polling pour toutes les demandes (responsable)
   */
  private startResponsablePolling(): void {
    interval(this.POLLING_INTERVAL)
      .pipe(
        startWith(0),
        switchMap(() => {
          if (!this.pollingActive) {
            return of([]);
          }
          return this.pannesResponsableService.getAllPannes();
        }),
        catchError(err => {
          console.error('Erreur polling demandes responsable:', err);
          return of([]);
        })
      )
      .subscribe(pannes => {
        if (this.pollingActive && pannes.length >= 0) {
          this.demandesResponsableSubject.next(pannes);
        }
      });
  }
  
  /**
   * Polling pour "Mes demandes" (demandes créées par l'utilisateur)
   */
  private startMesDemandesPolling(userId: number): void {
    interval(this.POLLING_INTERVAL)
      .pipe(
        startWith(0),
        switchMap(() => {
          if (!this.pollingActive || this.currentUserId !== userId) {
            return of([]);
          }
          return this.pannesService.getMesPannes();
        }),
        catchError(err => {
          console.error('Erreur polling mes demandes:', err);
          return of([]);
        })
      )
      .subscribe(pannes => {
        if (this.pollingActive && pannes.length >= 0) {
          this.mesDemandesSubject.next(pannes);
        }
      });
  }
  
  /**
   * Force un rafraîchissement immédiat des données
   */
  refreshNow(): void {
    if (!this.pollingActive || !this.currentUserId) {
      return;
    }
    
    if (this.currentUserRole === 'TECHNICIEN') {
      this.pannesService.getPannesAffecteesAuTechnicien(this.currentUserId)
        .subscribe(pannes => this.demandesTechnicienSubject.next(pannes));
    } else if (this.currentUserRole === 'RESPONSABLE_MAINTENANCE') {
      this.pannesResponsableService.getAllPannes()
        .subscribe(pannes => this.demandesResponsableSubject.next(pannes));
    }
    
    this.pannesService.getMesPannes()
      .subscribe(pannes => this.mesDemandesSubject.next(pannes));
  }
}
