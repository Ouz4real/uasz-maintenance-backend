package sn.uasz.uasz_maintenance_backend.dtos;

import lombok.Data;
import lombok.Getter;
import lombok.Setter;


@Data
public class UpdateProfileRequest {
    private String nom;
    private String prenom;
    private String email;
    private String telephone;
    private String serviceUnite;
    private String departement;
}
