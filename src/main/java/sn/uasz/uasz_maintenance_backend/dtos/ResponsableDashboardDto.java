package sn.uasz.uasz_maintenance_backend.dtos;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class ResponsableDashboardDto {

    private Long responsableId;
    private String username;
    private String email;

    // Pannes
    private long totalPannes;
    private long pannesOuvertes;
    private long pannesEnCours;
    private long pannesResolues;
    private long pannesAnnulees;

    // Pannes sans intervention
    private long pannesSansIntervention;

    // Pannes ouvertes à haute priorité
    private long pannesOuvertesHautePriorite;

    // Interventions
    private long totalInterventions;
    private long interventionsPlanifiees;
    private long interventionsEnCours;
    private long interventionsTerminees;
    private long interventionsAnnulees;

    // Interventions sans technicien affecté
    private long interventionsSansTechnicien;

    // 🔹 NOUVEAU : indicateurs sur les pièces / stock
    private long totalPieces;
    private long piecesActives;
    private long piecesEnRupture;
    private BigDecimal valeurTotaleStock;
}
