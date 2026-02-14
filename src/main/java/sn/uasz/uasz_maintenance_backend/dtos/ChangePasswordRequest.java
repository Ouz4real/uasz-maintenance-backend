package sn.uasz.uasz_maintenance_backend.dtos;

import lombok.Data;

@Data
public class ChangePasswordRequest {
    private String currentPassword;
    private String newPassword;
}
