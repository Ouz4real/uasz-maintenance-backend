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
    private Role role;
    private boolean enabled;
}
