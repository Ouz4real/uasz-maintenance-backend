package sn.uasz.uasz_maintenance_backend.dtos;

import lombok.Builder;
import lombok.Data;
import sn.uasz.uasz_maintenance_backend.enums.Role;

@Data
@Builder
public class AuthResponse {
    private String token;
    private String type;     // ex: "Bearer"
    private Long userId;
    private String username;
    private String email;
    private Role role;
}
