import { Injectable } from '@angular/core';
import { BehaviorSubject, interval, Subscription } from 'rxjs';
import { switchMap, startWith, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { PannesService } from './pannes.service';
import { PannesResponsableService, PanneDto } from './pannes-responsable.service';
import { PanneApi } from '../models/panne.model';

@Injectable({
  providedIn: 'root'
})
export class DemandesPollingService {

  private readonly POLLING_INTERVAL = 15000;

  private demandesTechnicienSubject = new BehaviorSubject<PanneApi[]>([]);
  private demandesResponsableSubject = new BehaviorSubject<PanneDto[]>([]);
  private mesDemandesSubject = new BehaviorSubject<PanneApi[]>([]);

  public demandesTechnicien$ = this.demandesTechnicienSubject.asObservable();
  public demandesResponsable$ = this.demandesResponsableSubject.asObservable();
  public mesDemandes$ = this.mesDemandesSubject.asObservable();

  private currentUserId: number | null = null;
  private currentUserRole: string | null = null;

  // Stocker toutes les subscriptions pour pouvoir les unsubscribe
  private subscriptions: Subscription[] = [];

  constructor(
    private pannesService: PannesService,
    private pannesResponsableService: PannesResponsableService
  ) {}

  startPolling(userId: number, userRole: string): void {
    // Si déjà en polling pour le même utilisateur, ne pas redémarrer
    if (this.subscriptions.length > 0 && this.currentUserId === userId) {
      return;
    }

    // Arrêter tout polling existant avant d'en démarrer un nouveau
    this.stopPolling();

    this.currentUserId = userId;
    this.currentUserRole = userRole;

    console.log(`🔄 Démarrage du polling pour l'utilisateur ${userId} (${userRole})`);

    if (userRole === 'TECHNICIEN') {
      this.startTechnicienPolling(userId);
    } else if (userRole === 'RESPONSABLE_MAINTENANCE') {
      this.startResponsablePolling();
    }

    this.startMesDemandesPolling(userId);
  }

  stopPolling(): void {
    this.subscriptions.forEach(s => s.unsubscribe());
    this.subscriptions = [];
    this.currentUserId = null;
    this.currentUserRole = null;
    console.log('⏹️ Arrêt du polling');
  }

  private startTechnicienPolling(technicienId: number): void {
    const sub = interval(this.POLLING_INTERVAL)
      .pipe(
        startWith(0),
        switchMap(() => {
          if (this.currentUserId !== technicienId) return of([]);
          return this.pannesService.getPannesAffecteesAuTechnicien(technicienId).pipe(
            catchError(err => {
              console.error('Erreur polling interventions technicien:', err);
              return of([]);
            })
          );
        })
      )
      .subscribe(pannes => {
        if (this.currentUserId === technicienId) {
          this.demandesTechnicienSubject.next(pannes as PanneApi[]);
        }
      });
    this.subscriptions.push(sub);
  }

  private startResponsablePolling(): void {
    const sub = interval(this.POLLING_INTERVAL)
      .pipe(
        startWith(0),
        switchMap(() => {
          if (!this.currentUserId) return of([]);
          return this.pannesResponsableService.getAllPannes().pipe(
            catchError(err => {
              console.error('Erreur polling demandes responsable:', err);
              return of([]);
            })
          );
        })
      )
      .subscribe(pannes => {
        if (this.currentUserId) {
          this.demandesResponsableSubject.next(pannes as PanneDto[]);
        }
      });
    this.subscriptions.push(sub);
  }

  private startMesDemandesPolling(userId: number): void {
    const sub = interval(this.POLLING_INTERVAL)
      .pipe(
        startWith(0),
        switchMap(() => {
          if (this.currentUserId !== userId) return of([]);
          return this.pannesService.getMesPannes().pipe(
            catchError(err => {
              console.error('Erreur polling mes demandes:', err);
              return of([]);
            })
          );
        })
      )
      .subscribe(pannes => {
        if (this.currentUserId === userId) {
          this.mesDemandesSubject.next(pannes as PanneApi[]);
        }
      });
    this.subscriptions.push(sub);
  }

  refreshNow(): void {
    if (!this.currentUserId) return;

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
