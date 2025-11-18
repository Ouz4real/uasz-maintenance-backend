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
public class DemandeurDashboardDto {

    private Long demandeurId;
    private String username;
    private String email;

    private long totalPannes;
    private long pannesOuvertes;
    private long pannesEnCours;
    private long pannesResolues;
    private long pannesAnnulees;

    // en minutes, peut être null
    private Long tempsMoyenResolutionMinutes;

    private LocalDateTime dernierePanneCree;
    private LocalDateTime dernierePanneResolue;
}
