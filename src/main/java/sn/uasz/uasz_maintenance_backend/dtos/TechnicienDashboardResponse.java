package sn.uasz.uasz_maintenance_backend.dtos;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class TechnicienDashboardResponse {

    private Long technicienId;
    private String username;
    private String email;

    private long totalInterventions;
    private long interventionsPlanifiees;
    private long interventionsEnCours;
    private long interventionsTerminees;
    private long interventionsAnnulees;

    /**
     * Dernière intervention affectée / commencée
     */
    private LocalDateTime derniereInterventionDebut;

    /**
     * Dernière intervention terminée
     */
    private LocalDateTime derniereInterventionTerminee;

    /**
     * Temps moyen de réalisation (en minutes) des interventions terminées
     */
    private Long tempsMoyenRealisationMinutes;
}
