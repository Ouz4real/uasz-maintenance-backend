package sn.uasz.uasz_maintenance_backend.entities;

import jakarta.persistence.*;
import lombok.*;
import sn.uasz.uasz_maintenance_backend.enums.Priorite;
import sn.uasz.uasz_maintenance_backend.enums.StatutPanne;

import java.time.LocalDateTime;

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
    private String code;

    @Column(nullable = false, length = 200)
    private String titre;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private LocalDateTime dateSignalement;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Priorite priorite;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private StatutPanne statut;

    @Column(length = 150)
    private String signaleePar;   // texte libre (ex: “Technicien labo info”)

    @ManyToOne
    @JoinColumn(name = "equipement_id", nullable = false)
    private Equipement equipement;

    // 🔹 nouveau : lien vers le vrai utilisateur demandeur
    @ManyToOne
    @JoinColumn(name = "demandeur_id")
    private Utilisateur demandeur;
}
