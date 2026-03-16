package sn.uasz.uasz_maintenance_backend.entities;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import sn.uasz.uasz_maintenance_backend.enums.StatutTache;

import java.time.LocalDateTime;

@Entity
@Table(name = "taches_intervention")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TacheIntervention {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 150)
    private String titre;

    @Column(length = 1000)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private StatutTache statut;

    // Pour afficher les tâches dans un ordre logique
    private Integer ordre;

    private LocalDateTime dateDebut;
    private LocalDateTime dateFin;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "intervention_id")
    @JsonIgnore
    private Intervention intervention;
}
