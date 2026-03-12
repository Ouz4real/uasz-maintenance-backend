package sn.uasz.uasz_maintenance_backend.dtos;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDate;

@Data
@Builder
public class MaintenancePreventiveResponse {
    private Long id;
    private String equipementReference;
    private Long technicienId;
    private String frequence;
    private LocalDate prochaineDate;
    private String responsable;
    private String statut;
    private String description;
    
    // Champs de réalisation
    private LocalDate dateRealisee;
    private String rapport;
    private String piecesUtilisees;
    private String photoUrl;
    private String typeEquipement;
    private String technicienNom; // Pour affichage
}
