import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService, Notification } from '../../../core/services/notification.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification-bell.component.html',
  styleUrls: ['./notification-bell.component.scss']
})
export class NotificationBellComponent implements OnInit, OnDestroy {
  @Input() themeColor: string = '#3b82f6'; // Couleur par défaut
  @Output() notificationClicked = new EventEmitter<Notification>();
  
  unreadCount = 0;
  notifications: Notification[] = [];
  showPanel = false;
  loading = false;
  
  private subscriptions: Subscription[] = [];
  
  constructor(public notificationService: NotificationService) {}
  
  ngOnInit(): void {
    // S'abonner au compteur de notifications non lues
    const countSub = this.notificationService.unreadCount$.subscribe(count => {
      this.unreadCount = count;
    });
    this.subscriptions.push(countSub);
    
    // S'abonner à la liste des notifications
    const notifSub = this.notificationService.notifications$.subscribe(notifications => {
      this.notifications = notifications;
    });
    this.subscriptions.push(notifSub);
    
    // Charger les notifications initiales
    this.loadNotifications();
  }
  
  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }
  
  togglePanel(): void {
    this.showPanel = !this.showPanel;
    if (this.showPanel) {
      this.loadNotifications();
    }
  }
  
  closePanel(): void {
    this.showPanel = false;
  }
  
  loadNotifications(): void {
    this.loading = true;
    this.notificationService.getNotifications().subscribe({
      next: () => {
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur chargement notifications:', err);
        this.loading = false;
      }
    });
  }
  
  markAsRead(notification: Notification, event: Event): void {
    event.stopPropagation();
    if (!notification.lu) {
      this.notificationService.markAsRead(notification.id).subscribe({
        next: () => {
          this.loadNotifications();
        },
        error: (err) => {
          console.error('Erreur marquage notification:', err);
        }
      });
    }
    
    // Gérer la redirection selon le type d'entité
    this.handleNotificationClick(notification);
  }
  
  handleNotificationClick(notification: Notification): void {
    // Fermer le panel
    this.closePanel();
    
    // Émettre l'événement pour que le parent gère la redirection
    this.notificationClicked.emit(notification);
  }
  
  markAllAsRead(): void {
    this.notificationService.markAllAsRead().subscribe({
      next: () => {
        this.loadNotifications();
      },
      error: (err) => {
        console.error('Erreur marquage toutes notifications:', err);
      }
    });
  }
  
  deleteNotification(notificationId: number, event: Event): void {
    event.stopPropagation();
    this.notificationService.deleteNotification(notificationId).subscribe({
      next: () => {
        this.loadNotifications();
      },
      error: (err) => {
        console.error('Erreur suppression notification:', err);
      }
    });
  }
  
  getRelativeTime(dateString: string): string {
    return this.notificationService.getRelativeTime(dateString);
  }
  
  getIcon(type: string): string {
    return this.notificationService.getNotificationIcon(type);
  }
  
  getColor(type: string): string {
    return this.notificationService.getNotificationColor(type);
  }
}
