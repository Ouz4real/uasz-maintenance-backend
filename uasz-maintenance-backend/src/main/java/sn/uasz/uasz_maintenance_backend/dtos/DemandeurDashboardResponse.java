package sn.uasz.uasz_maintenance_backend.dtos;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DemandeurDashboardResponse {

    private Long demandeurId;
    private String username;
    private String email;

    private long totalPannes;
    private long pannesOuvertes;
    private long pannesEnCours;
    private long pannesResolues;
    private long pannesAnnulees;

    /**
     * Temps moyen de résolution des pannes (en minutes).
     * Null si aucune panne résolue.
     */
    private Long tempsMoyenResolutionMinutes;

    /**
     * Date du dernier signalement effectué par ce demandeur.
     */
    private LocalDateTime dernierePanneCree;

    /**
     * Date de la dernière panne résolue pour ce demandeur.
     * Calculée à partir de la date de fin de la dernière intervention.
     */
    private LocalDateTime dernierePanneResolue;
}
