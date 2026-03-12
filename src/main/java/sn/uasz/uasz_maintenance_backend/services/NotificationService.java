package sn.uasz.uasz_maintenance_backend.services;

import sn.uasz.uasz_maintenance_backend.dtos.NotificationDto;
import sn.uasz.uasz_maintenance_backend.entities.Notification;

import java.util.List;

public interface NotificationService {
    
    List<NotificationDto> getNotificationsByUserId(Long userId);
    
    List<NotificationDto> getUnreadNotificationsByUserId(Long userId);
    
    Long getUnreadCount(Long userId);
    
    NotificationDto markAsRead(Long notificationId);
    
    void markAllAsRead(Long userId);
    
    Notification createNotification(Long userId, String titre, String message, String type, String entityType, Long entityId);
    
    void deleteNotification(Long notificationId);
}
