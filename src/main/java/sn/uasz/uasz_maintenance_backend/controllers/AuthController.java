package sn.uasz.uasz_maintenance_backend.controllers;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import sn.uasz.uasz_maintenance_backend.dtos.AuthRequest;
import sn.uasz.uasz_maintenance_backend.dtos.AuthResponse;
import sn.uasz.uasz_maintenance_backend.entities.Utilisateur;
import sn.uasz.uasz_maintenance_backend.repositories.UtilisateurRepository;
import sn.uasz.uasz_maintenance_backend.security.JwtService;

import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:4200")
@Slf4j
public class AuthController {

    private final UtilisateurRepository utilisateurRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody AuthRequest request) {
        try {
            // 0) Validation basique
            if (request.getUsernameOrEmail() == null || request.getUsernameOrEmail().isBlank()
                    || request.getMotDePasse() == null || request.getMotDePasse().isBlank()) {
                return ResponseEntity.badRequest().body("usernameOrEmail et motDePasse sont obligatoires");
            }

            String login = request.getUsernameOrEmail();
            String rawPassword = request.getMotDePasse();

            // 1) Chercher l'utilisateur par username OU email
            Optional<Utilisateur> optUser =
                    utilisateurRepository.findByUsernameOrEmail(login, login);

            if (optUser.isEmpty()) {
                log.warn("Utilisateur non trouvé pour {}", login);
                return ResponseEntity.status(401).body("Utilisateur ou mot de passe incorrect");
            }

            Utilisateur utilisateur = optUser.get();

            // 2) Vérifier le mot de passe (hash BCrypt)
            if (!passwordEncoder.matches(rawPassword, utilisateur.getPassword())) {
                log.warn("Mot de passe incorrect pour {}", login);
                return ResponseEntity.status(401).body("Utilisateur ou mot de passe incorrect");
            }

            // 3) Générer le token JWT
            String token = jwtService.generateToken(utilisateur);

            // 4) Construire la réponse JSON
            AuthResponse response = AuthResponse.builder()
                    .token(token)
                    .type("Bearer")
                    .userId(utilisateur.getId())
                    .username(utilisateur.getUsername())
                    .email(utilisateur.getEmail())
                    .role(utilisateur.getRole())
                    .build();

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Erreur interne pendant le login", e);
            return ResponseEntity.status(500).body("Erreur interne serveur");
        }
    }
}
