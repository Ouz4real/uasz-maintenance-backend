package sn.uasz.uasz_maintenance_backend.dtos;

import lombok.Data;
import sn.uasz.uasz_maintenance_backend.enums.Priorite;
import sn.uasz.uasz_maintenance_backend.enums.StatutPanne;

@Data
public class PanneRequest {

    private Long equipementId;
    private Long demandeurId;      // id de l’utilisateur demandeur

    private String code;
    private String titre;
    private String description;

    private Priorite priorite;     // optionnel → par défaut MOYENNE si null
    private StatutPanne statut;    // optionnel → par défaut OUVERTE si null

    private String signaleePar;    // optionnel (texte libre)
}
