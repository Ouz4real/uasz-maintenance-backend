package sn.uasz.uasz_maintenance_backend.dtos;

import lombok.Data;

@Data
public class AuthRequest {

    /**
     * On accepte soit le username, soit l'email.
     */
    private String usernameOrEmail;

    private String motDePasse;
}
