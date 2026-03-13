package sn.uasz.uasz_maintenance_backend.dtos;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
public class TechnicienDashboardDto {

    private Long technicienId;
    private String username;
    private String email;

    // Interventions
    private long totalInterventions;
    private long interventionsPlanifiees;
    private long interventionsEnCours;
    private long interventionsTerminees;
    private long interventionsAnnulees;

    // Dates clés
    private LocalDateTime derniereInterventionDebut;
    private LocalDateTime derniereInterventionTerminee;

    // Durée moyenne des interventions (en minutes)
    private Long tempsMoyenRealisationMinutes;

    // 🔹 NOUVEAU : pièces consommées
    private long totalPiecesConsommees;     // somme des quantités
    private BigDecimal coutTotalPieces;     // somme quantité × prix unitaire
}
