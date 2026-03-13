package sn.uasz.uasz_maintenance_backend.dtos;

import lombok.Data;
import java.time.LocalDate;

@Data
public class MaintenancePreventiveRequest {
    private String equipementReference;
    private Long technicienId;
    private String frequence;
    private LocalDate prochaineDate;
    private String responsable;
    private String statut;
    private String description;
}
