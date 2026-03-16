package sn.uasz.uasz_maintenance_backend.dtos;

import lombok.Data;

@Data
public class ChangePasswordRequest {
    private Long userId; // Pour le changement obligatoire
    private String currentPassword; // Pour le changement normal
    private String newPassword;
}
