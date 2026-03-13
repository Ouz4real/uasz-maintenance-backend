package sn.uasz.uasz_maintenance_backend.services.impl;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import sn.uasz.uasz_maintenance_backend.dtos.NotificationDto;
import sn.uasz.uasz_maintenance_backend.entities.Notification;
import sn.uasz.uasz_maintenance_backend.repositories.NotificationRepository;
import sn.uasz.uasz_maintenance_backend.repositories.UtilisateurRepository;
import sn.uasz.uasz_maintenance_backend.services.NotificationService;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationServiceImpl implements NotificationService {
    
    private final NotificationRepository notificationRepository;
    @Getter
    private final UtilisateurRepository utilisateurRepository;
    
    @Override
    public List<NotificationDto> getNotificationsByUserId(Long userId) {
        return notificationRepository.findTop10ByUtilisateurIdOrderByDateCreationDesc(userId)
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }
    
    @Override
    public List<NotificationDto> getUnreadNotificationsByUserId(Long userId) {
        return notificationRepository.findUnreadByUserId(userId)
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }
    
    @Override
    public Long getUnreadCount(Long userId) {
        return notificationRepository.countUnreadByUserId(userId);
    }
    
    @Override
    @Transactional
    public NotificationDto markAsRead(Long notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Notification non trouvée"));
        
        notification.setLu(true);
        notification.setDateLecture(LocalDateTime.now());
        
        return toDto(notificationRepository.save(notification));
    }
    
    @Override
    @Transactional
    public void markAllAsRead(Long userId) {
        List<Notification> unreadNotifications = notificationRepository.findUnreadByUserId(userId);
        
        unreadNotifications.forEach(notification -> {
            notification.setLu(true);
            notification.setDateLecture(LocalDateTime.now());
        });
        
        notificationRepository.saveAll(unreadNotifications);
    }
    
    @Override
    @Transactional
    public Notification createNotification(Long userId, String titre, String message, String type, String entityType, Long entityId) {
        log.info("🔔 Création notification - userId: {}, titre: {}, type: {}, entityType: {}, entityId: {}", 
            userId, titre, type, entityType, entityId);
        
        Notification notification = new Notification();
        notification.setUtilisateurId(userId);
        notification.setTitre(titre);
        notification.setMessage(message);
        notification.setType(type);
        notification.setLu(false);
        notification.setDateCreation(LocalDateTime.now());
        notification.setEntityType(entityType);
        notification.setEntityId(entityId);
        
        Notification saved = notificationRepository.save(notification);
        log.info("✅ Notification sauvegardée avec ID: {}", saved.getId());
        
        return saved;
    }
    
    @Override
    @Transactional
    public void deleteNotification(Long notificationId) {
        notificationRepository.deleteById(notificationId);
    }
    
    private NotificationDto toDto(Notification notification) {
        NotificationDto dto = new NotificationDto();
        dto.setId(notification.getId());
        dto.setTitre(notification.getTitre());
        dto.setMessage(notification.getMessage());
        dto.setType(notification.getType());
        dto.setLu(notification.getLu());
        dto.setDateCreation(notification.getDateCreation());
        dto.setDateLecture(notification.getDateLecture());
        dto.setEntityType(notification.getEntityType());
        dto.setEntityId(notification.getEntityId());
        return dto;
    }
}
