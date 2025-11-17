package sn.uasz.uasz_maintenance_backend.dtos;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ResponsableDashboardResponse {

    private Long responsableId;
    private String username;
    private String email;

    // Pannes
    private long totalPannes;
    private long pannesOuvertes;
    private long pannesEnCours;
    private long pannesResolues;
    private long pannesAnnulees;

    private long pannesSansIntervention;
    private long pannesOuvertesHautePriorite;

    // Interventions
    private long totalInterventions;
    private long interventionsPlanifiees;
    private long interventionsEnCours;
    private long interventionsTerminees;
    private long interventionsAnnulees;

    private long interventionsSansTechnicien;
}
