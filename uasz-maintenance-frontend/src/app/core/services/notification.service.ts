import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, Subscription } from 'rxjs';
import { tap } from 'rxjs/operators';
import { WebSocketService } from './websocket.service';
import { environment } from '../../../environments/environment';

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

@Injectable({ providedIn: 'root' })
export class NotificationService implements OnDestroy {

  private apiUrl = environment.apiUrl + '/notifications';

  private unreadCountSubject = new BehaviorSubject<number>(0);
  public unreadCount$ = this.unreadCountSubject.asObservable();

  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  public notifications$ = this.notificationsSubject.asObservable();

  private wsSub?: Subscription;

  constructor(
    private http: HttpClient,
    private wsService: WebSocketService
  ) {}

  /** Appeler après login avec l'userId du JWT */
  initForUser(userId: number): void {
    // Chargement initial depuis l'API
    this.refreshNotifications();

    // Connexion WebSocket — les nouvelles notifs arrivent en push
    this.wsService.connect(userId);
    this.wsSub = this.wsService.getNotifications$().subscribe(notif => {
      const current = this.notificationsSubject.getValue();
      // Ajouter en tête de liste
      this.notificationsSubject.next([notif as unknown as Notification, ...current]);
      // Incrémenter le compteur plutôt que de recalculer depuis la liste locale
      this.unreadCountSubject.next(this.unreadCountSubject.getValue() + 1);
    });
  }

  getNotifications(): Observable<Notification[]> {
    return this.http.get<Notification[]>(this.apiUrl).pipe(
      tap(notifications => {
        this.notificationsSubject.next(notifications);
        // Compter depuis la liste complète reçue du backend
        this.unreadCountSubject.next(notifications.filter(n => !n.lu).length);
      })
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
      tap(() => this.refreshUnreadCount())
    );
  }

  markAllAsRead(): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/read-all`, {}).pipe(
      tap(() => {
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
      next: (response) => this.unreadCountSubject.next(response.count),
      error: (err) => console.error('Erreur compteur notifications:', err)
    });
  }

  refreshNotifications(): void {
    this.getNotifications().subscribe();
  }

  getRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const diffMs = Date.now() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays}j`;
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  }

  getNotificationIcon(type: string): string {
    switch (type) {
      case 'SUCCESS': return 'check_circle';
      case 'WARNING': return 'warning';
      case 'ERROR': return 'error';
      default: return 'info';
    }
  }

  getNotificationColor(type: string): string {
    switch (type) {
      case 'SUCCESS': return '#10b981';
      case 'WARNING': return '#f59e0b';
      case 'ERROR': return '#ef4444';
      default: return '#3b82f6';
    }
  }

  ngOnDestroy(): void {
    this.wsSub?.unsubscribe();
    this.wsService.disconnect();
  }
}
