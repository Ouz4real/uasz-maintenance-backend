package sn.uasz.uasz_maintenance_backend.dtos;

import lombok.Data;

@Data
public class ResetPasswordRequest {
    private String token;
    private String newPassword;
}
