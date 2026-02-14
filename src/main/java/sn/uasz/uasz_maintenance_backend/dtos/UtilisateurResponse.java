package sn.uasz.uasz_maintenance_backend.dtos;

import lombok.Builder;
import lombok.Data;
import sn.uasz.uasz_maintenance_backend.enums.Role;

@Data
@Builder
public class UtilisateurResponse {
    private Long id;
    private String username;
    private String email;

    // ✅ Ajouts
    private String nom;
    private String prenom;
    private String departement;
    private String serviceUnite;
    private String telephone;

    private Role role;
    private boolean enabled;
}
