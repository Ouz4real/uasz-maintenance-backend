package sn.uasz.uasz_maintenance_backend.entities;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import sn.uasz.uasz_maintenance_backend.enums.Priorite;
import sn.uasz.uasz_maintenance_backend.enums.StatutInterventions;
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

    // ✅ supprimé : code

    @Column(nullable = false, length = 200)
    private String titre;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private LocalDateTime dateSignalement;

    @Column(name = "date_debut_intervention")
    private LocalDateTime dateDebutIntervention;

    @Column(name = "date_fin_intervention")
    private LocalDateTime dateFinIntervention;


    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Priorite priorite;

    @Enumerated(EnumType.STRING)
    @Column(name = "priorite_responsable", length = 20)
    private Priorite prioriteResponsable;


    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private StatutPanne statut;

    @Enumerated(EnumType.STRING)
    @Column(name = "statut_interventions", length = 20, nullable = false)
    private StatutInterventions statutInterventions = StatutInterventions.NON_DEMARREE;



    @Column(length = 150)
    private String signaleePar;

    @ManyToOne
    @JoinColumn(name = "equipement_id", nullable = true)
    private Equipement equipement;

    @Column(length = 100)
    private String typeEquipement;

    @Column(length = 150)
    private String lieu;

    // ✅ image persistée
    @Column(name = "image_path", length = 255)
    private String imagePath;

    // ✅ commentaire interne pour le responsable/technicien
    @Column(name = "commentaire_interne", columnDefinition = "TEXT")
    private String commentaireInterne;

    // ✅ note du technicien après intervention
    @Column(name = "note_technicien", columnDefinition = "TEXT")
    private String noteTechnicien;

    // ✅ pièces utilisées (format JSON ou texte simple)
    @Column(name = "pieces_utilisees", columnDefinition = "TEXT")
    private String piecesUtilisees;

    // ✅ raison du refus par le technicien
    @Column(name = "raison_refus", columnDefinition = "TEXT")
    private String raisonRefus;

    // ✅ date du refus
    @Column(name = "date_refus")
    private LocalDateTime dateRefus;

    // ✅ technicien qui a décliné (pour garder l'historique lors de la réaffectation)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "password"})
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "technicien_declinant_id", nullable = true)
    private Utilisateur technicienDeclinant;

    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "password"})
    @ManyToOne
    @JoinColumn(name = "demandeur_id")
    private Utilisateur demandeur;

    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "password"})
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "technicien_id", nullable = true)
    private Utilisateur technicien;

    @PrePersist
    public void prePersist() {
        if (this.statutInterventions == null) {
            this.statutInterventions = StatutInterventions.NON_DEMARREE;
        }
    }


}
