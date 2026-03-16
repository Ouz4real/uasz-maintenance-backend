package sn.uasz.uasz_maintenance_backend.dtos;

import lombok.Data;
import java.time.LocalDate;

@Data
public class RealiserMaintenanceRequest {
    private String rapport; // Notes du technicien
    private String piecesUtilisees; // JSON des pièces
    private String photoUrl; // URL de la photo
    private LocalDate dateRealisee; // Date effective (optionnel, par défaut aujourd'hui)
}
