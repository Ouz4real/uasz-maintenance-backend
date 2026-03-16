package sn.uasz.uasz_maintenance_backend.dtos;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class SuperviseurDashboardResponse {

    private Long superviseurId;
    private String username;
    private String email;

    // Pannes
    private long totalPannes;
    private long pannesOuvertes;
    private long pannesEnCours;
    private long pannesResolues;
    private long pannesAnnulees;

    // Répartition par priorité
    private long pannesPrioriteHaute;
    private long pannesPrioriteMoyenne;
    private long pannesPrioriteBasse;

    // Indicateurs globaux sur les pannes
    private Double tempsMoyenResolutionMinutes;   // MTTR global
    private Long nombreEquipementsImpactes;       // nb d’équipements ayant au moins une panne

    // Interventions
    private long totalInterventions;
    private long interventionsPlanifiees;
    private long interventionsEnCours;
    private long interventionsTerminees;
    private long interventionsAnnulees;

    // Indicateur global sur les interventions
    private Double tempsMoyenRealisationMinutes;  // durée moyenne d'une intervention
}
