package sn.uasz.uasz_maintenance_backend.dtos;

import lombok.Builder;
import lombok.Data;
import lombok.Getter;
import lombok.Setter;
import sn.uasz.uasz_maintenance_backend.enums.Priorite;
import sn.uasz.uasz_maintenance_backend.enums.StatutInterventions;
import sn.uasz.uasz_maintenance_backend.enums.StatutPanne;

import java.time.LocalDateTime;

@Builder
@Getter
@Setter
public class PanneResponse {

    private Long id;
    private String titre;
    private String lieu;
    private String typeEquipement;

    private String priorite;              // ✅ STRING
    private String prioriteResponsable;   // ✅ STRING
    private String statut;                // ✅ STRING
    private StatutInterventions statutInterventions;
    private Long technicienId;
    private String technicienNom;
    private String technicienServiceUnite;

    // ✅ AJOUT: Informations du demandeur
    private Long demandeurId;
    private DemandeurInfo demandeur;

    private String imagePath;
    private String imageResolutionPath;
    private String commentaireInterne;
    private String raisonRefus;
    private String dateRefus;  // Format ISO 8601

    // ✅ Dates importantes
    private LocalDateTime dateSignalement;
    private LocalDateTime dateDerniereRelance;
    
    // ✅ AJOUT: Informations du technicien qui a décliné
    private Long technicienDeclinantId;
    private String technicienDeclinantNom;

    // ✅ Classe interne pour les infos du demandeur
    @Builder
    @Getter
    @Setter
    public static class DemandeurInfo {
        private Long id;
        private String prenom;
        private String nom;
        private String username;
    }
}

