package sn.uasz.uasz_maintenance_backend.entities;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "notifications")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Notification {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private Long utilisateurId;
    
    @Column(nullable = false)
    private String titre;
    
    @Column(columnDefinition = "TEXT")
    private String message;
    
    @Column(nullable = false)
    private String type; // INFO, SUCCESS, WARNING, ERROR
    
    @Column(nullable = false)
    private Boolean lu = false;
    
    @Column(nullable = false)
    private LocalDateTime dateCreation = LocalDateTime.now();
    
    private LocalDateTime dateLecture;
    
    // Référence optionnelle vers l'entité liée
    private String entityType; // PANNE, INTERVENTION, UTILISATEUR, etc.
    private Long entityId;
}
