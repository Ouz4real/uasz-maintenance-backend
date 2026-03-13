package sn.uasz.uasz_maintenance_backend.controllers;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import sn.uasz.uasz_maintenance_backend.entities.Utilisateur;
import sn.uasz.uasz_maintenance_backend.repositories.UtilisateurRepository;

import java.util.Optional;

/**
 * Contrôleur temporaire pour le debug et la réinitialisation des mots de passe
 * À SUPPRIMER EN PRODUCTION!
 */
@RestController
@RequestMapping("/api/debug")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:4200")
@Slf4j
public class DebugController {

    private final UtilisateurRepository utilisateurRepository;
    private final PasswordEncoder passwordEncoder;

    /**
     * Endpoint pour réinitialiser le mot de passe d'un utilisateur
     * URL: POST http://localhost:8080/api/debug/reset-password
     * Body: {"username": "admin", "newPassword": "admin123"}
     */
    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody ResetPasswordRequest request) {
        try {
            log.info("🔧 Tentative de réinitialisation du mot de passe pour: {}", request.getUsername());

            Optional<Utilisateur> optUser = utilisateurRepository.findByUsername(request.getUsername());
            
            if (optUser.isEmpty()) {
                log.warn("❌ Utilisateur non trouvé: {}", request.getUsername());
                return ResponseEntity.badRequest().body("Utilisateur non trouvé: " + request.getUsername());
            }

            Utilisateur user = optUser.get();
            String hashedPassword = passwordEncoder.encode(request.getNewPassword());
            user.setMotDePasse(hashedPassword);
            utilisateurRepository.save(user);

            log.info("✅ Mot de passe réinitialisé avec succès pour: {}", request.getUsername());
            
            return ResponseEntity.ok(new ResetPasswordResponse(
                true,
                "Mot de passe réinitialisé avec succès",
                request.getUsername(),
                user.getRole().toString()
            ));

        } catch (Exception e) {
            log.error("❌ Erreur lors de la réinitialisation du mot de passe", e);
            return ResponseEntity.status(500).body("Erreur: " + e.getMessage());
        }
    }

    /**
     * Endpoint pour lister tous les utilisateurs (debug)
     */
    @GetMapping("/users")
    public ResponseEntity<?> listUsers() {
        try {
            var users = utilisateurRepository.findAll();
            log.info("📋 Liste de {} utilisateurs", users.size());
            return ResponseEntity.ok(users);
        } catch (Exception e) {
            log.error("❌ Erreur lors de la récupération des utilisateurs", e);
            return ResponseEntity.status(500).body("Erreur: " + e.getMessage());
        }
    }

    // DTOs internes
    public static class ResetPasswordRequest {
        private String username;
        private String newPassword;

        public String getUsername() { return username; }
        public void setUsername(String username) { this.username = username; }
        public String getNewPassword() { return newPassword; }
        public void setNewPassword(String newPassword) { this.newPassword = newPassword; }
    }

    public static class ResetPasswordResponse {
        private boolean success;
        private String message;
        private String username;
        private String role;

        public ResetPasswordResponse(boolean success, String message, String username, String role) {
            this.success = success;
            this.message = message;
            this.username = username;
            this.role = role;
        }

        public boolean isSuccess() { return success; }
        public String getMessage() { return message; }
        public String getUsername() { return username; }
        public String getRole() { return role; }
    }
}
