import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, interval } from 'rxjs';
import { tap, switchMap, startWith } from 'rxjs/operators';

export interface Notification {
  id: number;
  titre: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
  lu: boolean;
  dateCreation: string;
  dateLecture?: string;
  entityType?: string;
  entityId?: number;
}

export interface NotificationCount {
  count: number;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private apiUrl = 'http://localhost:8080/api/notifications';
  
  // BehaviorSubject pour le compteur de notifications non lues
  private unreadCountSubject = new BehaviorSubject<number>(0);
  public unreadCount$ = this.unreadCountSubject.asObservable();
  
  // BehaviorSubject pour la liste des notifications
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  public notifications$ = this.notificationsSubject.asObservable();
  
  constructor(private http: HttpClient) {
    // Polling toutes les 30 secondes pour mettre à jour le compteur
    this.startPolling();
  }
  
  private startPolling(): void {
    interval(30000) // 30 secondes
      .pipe(
        startWith(0),
        switchMap(() => this.getUnreadCount())
      )
      .subscribe({
        next: (response) => {
          this.unreadCountSubject.next(response.count);
        },
        error: (err) => {
          console.error('Erreur lors du polling des notifications:', err);
        }
      });
  }
  
  getNotifications(): Observable<Notification[]> {
    return this.http.get<Notification[]>(this.apiUrl).pipe(
      tap(notifications => this.notificationsSubject.next(notifications))
    );
  }
  
  getUnreadNotifications(): Observable<Notification[]> {
    return this.http.get<Notification[]>(`${this.apiUrl}/unread`);
  }
  
  getUnreadCount(): Observable<NotificationCount> {
    return this.http.get<NotificationCount>(`${this.apiUrl}/count`);
  }
  
  markAsRead(notificationId: number): Observable<Notification> {
    return this.http.put<Notification>(`${this.apiUrl}/${notificationId}/read`, {}).pipe(
      tap(() => {
        // Mettre à jour le compteur après avoir marqué comme lu
        this.refreshUnreadCount();
      })
    );
  }
  
  markAllAsRead(): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/read-all`, {}).pipe(
      tap(() => {
        // Réinitialiser le compteur
        this.unreadCountSubject.next(0);
        this.refreshNotifications();
      })
    );
  }
  
  deleteNotification(notificationId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${notificationId}`).pipe(
      tap(() => {
        this.refreshUnreadCount();
        this.refreshNotifications();
      })
    );
  }
  
  refreshUnreadCount(): void {
    this.getUnreadCount().subscribe({
      next: (response) => {
        this.unreadCountSubject.next(response.count);
      },
      error: (err) => {
        console.error('Erreur lors du rafraîchissement du compteur:', err);
      }
    });
  }
  
  refreshNotifications(): void {
    this.getNotifications().subscribe();
  }
  
  // Méthode utilitaire pour formater le temps relatif
  getRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays}j`;
    
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  }
  
  // Méthode pour obtenir l'icône selon le type
  getNotificationIcon(type: string): string {
    switch (type) {
      case 'SUCCESS': return 'check_circle';
      case 'WARNING': return 'warning';
      case 'ERROR': return 'error';
      default: return 'info';
    }
  }
  
  // Méthode pour obtenir la couleur selon le type
  getNotificationColor(type: string): string {
    switch (type) {
      case 'SUCCESS': return '#10b981';
      case 'WARNING': return '#f59e0b';
      case 'ERROR': return '#ef4444';
      default: return '#3b82f6';
    }
  }
}
