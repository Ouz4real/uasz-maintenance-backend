package sn.uasz.uasz_maintenance_backend.dtos;

import lombok.Builder;
import lombok.Data;
import lombok.Getter;
import lombok.Setter;
import sn.uasz.uasz_maintenance_backend.enums.Priorite;
import sn.uasz.uasz_maintenance_backend.enums.StatutPanne;

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

    private Long technicienId;
    private String technicienNom;
    private String technicienServiceUnite;

    private String imagePath;
}

