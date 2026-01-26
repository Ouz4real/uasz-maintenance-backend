package sn.uasz.uasz_maintenance_backend.dtos;

import lombok.Data;
import sn.uasz.uasz_maintenance_backend.enums.Priorite;

@Data
public class TraitementResponsableRequest {
    private Long technicienId;
    private Priorite prioriteResponsable;
}
