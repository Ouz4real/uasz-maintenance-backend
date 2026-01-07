package sn.uasz.uasz_maintenance_backend.entities;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity
@Table(name = "maintenances_preventives")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class MaintenancePreventive {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // exemple: "PC-001" ou référence d’item
    @Column(nullable = false)
    private String equipementReference;

    // tu peux stocker l'id du technicien (Utilisateur)
    private Long technicienId;

    @Column(nullable = false)
    private String frequence; // Mensuelle, Trimestrielle...

    @Column(nullable = false)
    private LocalDate prochaineDate;

    @Column(nullable = false)
    private String responsable;

    @Column(nullable = false)
    private String statut; // PLANIFIEE, EN_RETARD...

    @Column(nullable = false, length = 2000)
    private String description;
}
