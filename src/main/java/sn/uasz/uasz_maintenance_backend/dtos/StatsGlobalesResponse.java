package sn.uasz.uasz_maintenance_backend.dtos;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StatsGlobalesResponse {

    // ===== PANNES =====
    private long totalPannes;
    private long pannesOuvertes;
    private long pannesEnCours;
    private long pannesResolues;
    private long pannesAnnulees;

    // ===== INTERVENTIONS =====
    private long totalInterventions;
    private long interventionsPlanifiees;
    private long interventionsEnCours;
    private long interventionsTerminees;
    private long interventionsAnnulees;
}
