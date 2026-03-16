import { Injectable, OnDestroy } from '@angular/core';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { Subject, Observable } from 'rxjs';
import { NotificationDto } from '../models/notification.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class WebSocketService implements OnDestroy {

  private client: Client | null = null;
  private subscriptions: Map<string, StompSubscription> = new Map();
  private notificationSubject = new Subject<NotificationDto>();

  connect(userId: number): void {
    if (this.client?.active) return;

    this.client = new Client({
      webSocketFactory: () => new SockJS(environment.wsUrl),
      reconnectDelay: 5000,
      onConnect: () => {
        this.subscribeToUserNotifications(userId);
      },
      onDisconnect: () => {
        this.subscriptions.clear();
      }
    });

    this.client.activate();
  }

  private subscribeToUserNotifications(userId: number): void {
    if (!this.client?.active) return;

    const topic = `/topic/notifications/${userId}`;
    if (this.subscriptions.has(topic)) return;

    const sub = this.client.subscribe(topic, (message: IMessage) => {
      try {
        const notification: NotificationDto = JSON.parse(message.body);
        this.notificationSubject.next(notification);
      } catch (e) {
        console.error('Erreur parsing notification WebSocket', e);
      }
    });

    this.subscriptions.set(topic, sub);
  }

  getNotifications$(): Observable<NotificationDto> {
    return this.notificationSubject.asObservable();
  }

  disconnect(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions.clear();
    this.client?.deactivate();
    this.client = null;
  }

  ngOnDestroy(): void {
    this.disconnect();
  }
}
