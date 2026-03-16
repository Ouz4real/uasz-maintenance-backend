package sn.uasz.uasz_maintenance_backend.dtos;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import sn.uasz.uasz_maintenance_backend.enums.StatutIntervention;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StatsTechnicienResponse {

    private Long technicienId;
    private String technicienUsername;
    private String technicienEmail;

    // Nombre total d'interventions
    private long totalInterventions;

    // Détail par statut
    private long interventionsPlanifiees;
    private long interventionsEnCours;
    private long interventionsTerminees;
    private long interventionsAnnulees;
}
