package sn.uasz.uasz_maintenance_backend.dtos;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class NotificationDto {
    private Long id;
    private String titre;
    private String message;
    private String type;
    private Boolean lu;
    private LocalDateTime dateCreation;
    private LocalDateTime dateLecture;
    private String entityType;
    private Long entityId;
}
