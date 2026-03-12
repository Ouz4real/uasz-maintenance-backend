package sn.uasz.uasz_maintenance_backend.dtos;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RegisterRequest {
    private String nom;
    private String prenom;
    private String email;
    private String telephone;
    private String departement;
    private String serviceUnite;
    private String username;
    private String motDePasse;
    private String role;
}
