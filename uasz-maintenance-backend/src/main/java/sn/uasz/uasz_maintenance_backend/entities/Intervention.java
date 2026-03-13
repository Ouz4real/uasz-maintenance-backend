package sn.uasz.uasz_maintenance_backend.entities;

import jakarta.persistence.*;
import lombok.*;
import sn.uasz.uasz_maintenance_backend.enums.StatutIntervention;
import sn.uasz.uasz_maintenance_backend.enums.TypeIntervention;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "interventions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Intervention {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String titre;

    @Column(length = 1000)
    private String description;

    private LocalDateTime dateDebut;
    private LocalDateTime dateFin;

    @Enumerated(EnumType.STRING)
    private TypeIntervention type;

    @Enumerated(EnumType.STRING)
    private StatutIntervention statut;

    private String realiseePar;

    private BigDecimal cout;

    @ManyToOne
    @JoinColumn(name = "panne_id", nullable = false)
    private Panne panne;

    @OneToMany(mappedBy = "intervention", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<TacheIntervention> taches;

    // 🔹 NOUVEAU : technicien assigné (lié à Utilisateur)
    @ManyToOne
    @JoinColumn(name = "technicien_id")
    private Utilisateur technicien;
}
