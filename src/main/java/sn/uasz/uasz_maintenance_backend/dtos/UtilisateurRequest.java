package sn.uasz.uasz_maintenance_backend.dtos;

import lombok.Data;
import sn.uasz.uasz_maintenance_backend.enums.Role;

@Data
public class UtilisateurRequest {
    private String username;
    private String email;
    private String motDePasse;
    private String nom;
    private String prenom;
    private String telephone;
    private String departement;
    private String serviceUnite;
    private Role role;
}
