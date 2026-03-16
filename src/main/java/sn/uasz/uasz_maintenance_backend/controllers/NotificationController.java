package sn.uasz.uasz_maintenance_backend.controllers;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import sn.uasz.uasz_maintenance_backend.dtos.NotificationCountDto;
import sn.uasz.uasz_maintenance_backend.dtos.NotificationDto;
import sn.uasz.uasz_maintenance_backend.entities.Utilisateur;
import sn.uasz.uasz_maintenance_backend.services.NotificationService;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@Tag(name = "Notifications", description = "Gestion des notifications utilisateur")
@CrossOrigin(origins = "*")
public class NotificationController {
    
    private final NotificationService notificationService;
    
    @GetMapping
    @Operation(summary = "Récupérer les notifications de l'utilisateur connecté")
    public ResponseEntity<List<NotificationDto>> getMyNotifications(Authentication authentication) {
        Utilisateur user = (Utilisateur) authentication.getPrincipal();
        List<NotificationDto> notifications = notificationService.getNotificationsByUserId(user.getId());
        return ResponseEntity.ok(notifications);
    }
    
    @GetMapping("/unread")
    @Operation(summary = "Récupérer les notifications non lues")
    public ResponseEntity<List<NotificationDto>> getUnreadNotifications(Authentication authentication) {
        Utilisateur user = (Utilisateur) authentication.getPrincipal();
        List<NotificationDto> notifications = notificationService.getUnreadNotificationsByUserId(user.getId());
        return ResponseEntity.ok(notifications);
    }
    
    @GetMapping("/count")
    @Operation(summary = "Compter les notifications non lues")
    public ResponseEntity<NotificationCountDto> getUnreadCount(Authentication authentication) {
        Utilisateur user = (Utilisateur) authentication.getPrincipal();
        Long count = notificationService.getUnreadCount(user.getId());
        return ResponseEntity.ok(new NotificationCountDto(count));
    }
    
    @PutMapping("/{id}/read")
    @Operation(summary = "Marquer une notification comme lue")
    public ResponseEntity<NotificationDto> markAsRead(@PathVariable Long id) {
        NotificationDto notification = notificationService.markAsRead(id);
        return ResponseEntity.ok(notification);
    }
    
    @PutMapping("/read-all")
    @Operation(summary = "Marquer toutes les notifications comme lues")
    public ResponseEntity<Void> markAllAsRead(Authentication authentication) {
        Utilisateur user = (Utilisateur) authentication.getPrincipal();
        notificationService.markAllAsRead(user.getId());
        return ResponseEntity.ok().build();
    }
    
    @DeleteMapping("/{id}")
    @Operation(summary = "Supprimer une notification")
    public ResponseEntity<Void> deleteNotification(@PathVariable Long id) {
        notificationService.deleteNotification(id);
        return ResponseEntity.ok().build();
    }
}
