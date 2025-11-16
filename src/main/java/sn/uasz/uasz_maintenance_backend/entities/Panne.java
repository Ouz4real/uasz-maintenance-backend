package sn.uasz.uasz_maintenance_backend.entities;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import sn.uasz.uasz_maintenance_backend.enums.Priorite;
import sn.uasz.uasz_maintenance_backend.enums.StatutPanne;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "pannes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Panne {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String code; // ex: PAN-0001

    @Column(nullable = false, length = 255)
    private String titre; // ex: "Vidéo projecteur ne s’allume plus"

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private LocalDateTime dateSignalement;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Priorite priorite; // BASSE, MOYENNE, HAUTE, CRITIQUE

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private StatutPanne statut; // OUVERTE, EN_COURS, RESOLUE, ANNULEE

    // Qui a signalé la panne (on fera une entité Utilisateur plus tard)
    @Column(length = 100)
    private String signaleePar;

    @ManyToOne(optional = false)
    @JoinColumn(name = "equipement_id", nullable = false)
    private Equipement equipement;

    @OneToMany(mappedBy = "panne")
    @JsonIgnore // pour éviter les boucles JSON (panne -> interventions -> panne -> ...)
    private List<Intervention> interventions;
}
