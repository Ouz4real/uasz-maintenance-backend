package sn.uasz.uasz_maintenance_backend.dtos;

import lombok.Data;
import sn.uasz.uasz_maintenance_backend.enums.StatutIntervention;
import sn.uasz.uasz_maintenance_backend.enums.TypeIntervention;

import java.math.BigDecimal;

@Data
public class InterventionRequest {

    private Long panneId;
    private String titre;
    private String description;
    private TypeIntervention type;
    private StatutIntervention statut;   // ex : PLANIFIEE au début
    private String realiseePar;
    private BigDecimal cout;
    private Long technicienId;
}
