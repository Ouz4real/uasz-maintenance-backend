package sn.uasz.uasz_maintenance_backend.dtos;

import lombok.Data;
import sn.uasz.uasz_maintenance_backend.enums.Priorite;
import sn.uasz.uasz_maintenance_backend.enums.StatutPanne;

@Data
public class PanneRequest {

    private Long equipementId;   // nullable si AUTRE
    private Long demandeurId;    // rempli depuis JWT dans le controller

    private String titre;
    private String description;

    private String typeEquipement; // ex: "IMPRIMANTE" ou "AUTRE: Videoprojecteur"
    private String lieu;           // ex: "Amphi 1"

    private Priorite priorite;     // BASSE/MOYENNE/HAUTE (si tu utilises Priorite comme urgence)
    private StatutPanne statut;    // OUVERTE/EN_COURS/RESOLUE

    private String signaleePar;
}
