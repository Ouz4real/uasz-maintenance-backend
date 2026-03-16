package sn.uasz.uasz_maintenance_backend.controllers;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import sn.uasz.uasz_maintenance_backend.dtos.AuthRequest;
import sn.uasz.uasz_maintenance_backend.dtos.AuthResponse;
import sn.uasz.uasz_maintenance_backend.entities.Utilisateur;
import sn.uasz.uasz_maintenance_backend.security.JwtService;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody AuthRequest request) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.getUsernameOrEmail(),
                            request.getMotDePasse()
                    )
            );

            Utilisateur utilisateur = (Utilisateur) authentication.getPrincipal();
            String token = jwtService.generateToken(utilisateur);

            AuthResponse response = AuthResponse.builder()
                    .token(token)
                    .type("Bearer")
                    .userId(utilisateur.getId())
                    .username(utilisateur.getUsername())
                    .email(utilisateur.getEmail())
                    .role(utilisateur.getRole())
                    .build();

            return ResponseEntity.ok(response);

        } catch (BadCredentialsException ex) {
            return ResponseEntity.status(401).build();
        }
    }
}
