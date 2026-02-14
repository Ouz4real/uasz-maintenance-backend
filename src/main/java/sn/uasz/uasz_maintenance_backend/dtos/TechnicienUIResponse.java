package sn.uasz.uasz_maintenance_backend.dtos;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class TechnicienUIResponse {
    private Long id;
    private String nom;
    private String prenom;
    private String username;
    private String email;
    private String serviceUnite;
    private String departement;
    private String telephone;
    private String role;
    
    private boolean occupe;

    private long enCours;
    private long terminees;
    private Double tempsMoyen; // en heures ou minutes

}
