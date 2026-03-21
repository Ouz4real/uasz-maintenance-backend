package sn.uasz.uasz_maintenance_backend.controllers;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.beans.factory.annotation.Value;
import sn.uasz.uasz_maintenance_backend.dtos.AuthRequest;
import sn.uasz.uasz_maintenance_backend.dtos.AuthResponse;
import sn.uasz.uasz_maintenance_backend.dtos.ChangePasswordRequest;
import sn.uasz.uasz_maintenance_backend.dtos.ForgotPasswordRequest;
import sn.uasz.uasz_maintenance_backend.dtos.RegisterRequest;
import sn.uasz.uasz_maintenance_backend.dtos.ResetPasswordRequest;
import sn.uasz.uasz_maintenance_backend.entities.Notification;
import sn.uasz.uasz_maintenance_backend.entities.PasswordResetToken;
import sn.uasz.uasz_maintenance_backend.entities.RefreshToken;
import sn.uasz.uasz_maintenance_backend.entities.Utilisateur;
import sn.uasz.uasz_maintenance_backend.enums.Role;
import sn.uasz.uasz_maintenance_backend.repositories.PasswordResetTokenRepository;
import sn.uasz.uasz_maintenance_backend.repositories.UtilisateurRepository;
import sn.uasz.uasz_maintenance_backend.security.JwtService;
import sn.uasz.uasz_maintenance_backend.services.RefreshTokenService;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Slf4j
public class AuthController {

    private final UtilisateurRepository utilisateurRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final sn.uasz.uasz_maintenance_backend.services.NotificationService notificationService;
    private final sn.uasz.uasz_maintenance_backend.services.EmailService emailService;
    private final RefreshTokenService refreshTokenService;
    private final PasswordResetTokenRepository passwordResetTokenRepository;

    @Value("${app.frontend.url:http://localhost:4200}")
    private String frontendUrl;

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

            // 3) Vérifier si le compte est activé
            if (!utilisateur.isEnabled()) {
                log.warn("Tentative de connexion avec un compte désactivé: {}", login);
                return ResponseEntity.status(403).body("Votre compte a été désactivé. Veuillez contacter l'administrateur pour plus d'informations.");
            }

            // 4) Générer le token JWT
            String token = jwtService.generateToken(utilisateur);

            // 4b) Générer le refresh token
            RefreshToken refreshToken = refreshTokenService.createRefreshToken(utilisateur);

            // 5) Construire la réponse JSON
            AuthResponse response = AuthResponse.builder()
                    .token(token)
                    .refreshToken(refreshToken.getToken())
                    .type("Bearer")
                    .userId(utilisateur.getId())
                    .username(utilisateur.getUsername())
                    .email(utilisateur.getEmail())
                    .nom(utilisateur.getNom())
                    .prenom(utilisateur.getPrenom())
                    .role(utilisateur.getRole())
                    .mustChangePassword(utilisateur.isMustChangePassword())
                    .build();

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Erreur interne pendant le login", e);
            return ResponseEntity.status(500).body("Erreur interne serveur");
        }
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        try {
            // Validation basique
            if (request.getUsername() == null || request.getUsername().isBlank()) {
                return ResponseEntity.badRequest().body("Le nom d'utilisateur est obligatoire");
            }
            if (request.getEmail() == null || request.getEmail().isBlank()) {
                return ResponseEntity.badRequest().body("L'email est obligatoire");
            }
            if (request.getMotDePasse() == null || request.getMotDePasse().isBlank()) {
                return ResponseEntity.badRequest().body("Le mot de passe est obligatoire");
            }
            if (request.getNom() == null || request.getNom().isBlank()) {
                return ResponseEntity.badRequest().body("Le nom est obligatoire");
            }
            if (request.getPrenom() == null || request.getPrenom().isBlank()) {
                return ResponseEntity.badRequest().body("Le prénom est obligatoire");
            }

            // Vérifier si le username existe déjà
            if (utilisateurRepository.existsByUsername(request.getUsername())) {
                return ResponseEntity.status(409).body("Ce nom d'utilisateur existe déjà");
            }

            // Vérifier si l'email existe déjà
            if (utilisateurRepository.existsByEmail(request.getEmail())) {
                return ResponseEntity.status(409).body("Cet email existe déjà");
            }

            // Créer le nouvel utilisateur
            Utilisateur utilisateur = Utilisateur.builder()
                    .username(request.getUsername())
                    .email(request.getEmail())
                    .nom(request.getNom())
                    .prenom(request.getPrenom())
                    .telephone(request.getTelephone())
                    .departement(request.getDepartement())
                    .serviceUnite(request.getServiceUnite())
                    .motDePasse(passwordEncoder.encode(request.getMotDePasse()))
                    .role(Role.DEMANDEUR) // Par défaut, les nouveaux utilisateurs sont des demandeurs
                    .enabled(true)
                    .build();

            // Sauvegarder l'utilisateur
            Utilisateur savedUser = utilisateurRepository.save(utilisateur);

            log.info("✅ Nouvel utilisateur créé: {} (ID: {})", request.getUsername(), savedUser.getId());

            // Créer une notification pour tous les administrateurs
            try {
                log.info("🔔 Début création notifications pour les admins...");
                java.util.List<Utilisateur> admins = utilisateurRepository.findByRole(Role.ADMINISTRATEUR);
                log.info("📋 Nombre d'administrateurs trouvés: {}", admins.size());
                
                if (admins.isEmpty()) {
                    log.warn("⚠️ Aucun administrateur trouvé dans la base de données!");
                }
                
                for (Utilisateur admin : admins) {
                    log.info("📧 Création notification pour admin: {} (ID: {})", admin.getUsername(), admin.getId());
                    Notification notif = notificationService.createNotification(
                        admin.getId(),
                        "Nouvel utilisateur inscrit",
                        String.format("%s %s (%s) s'est inscrit sur la plateforme", 
                            savedUser.getPrenom(), 
                            savedUser.getNom(), 
                            savedUser.getUsername()),
                        "INFO",
                        "UTILISATEUR",
                        savedUser.getId()
                    );
                    log.info("✅ Notification créée avec ID: {}", notif.getId());
                }
                log.info("✅ Toutes les notifications ont été créées pour {} administrateur(s)", admins.size());
            } catch (Exception e) {
                log.error("❌ Erreur lors de la création des notifications", e);
                // On ne bloque pas l'inscription si la notification échoue
            }

            // 📧 Email aux admins (nouvel utilisateur inscrit)
            try {
                java.util.List<Utilisateur> admins = utilisateurRepository.findByRole(Role.ADMINISTRATEUR);
                String nouvelUtilisateurNom = savedUser.getPrenom() + " " + savedUser.getNom();
                String date = java.time.LocalDateTime.now()
                    .format(java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy à HH:mm"));
                for (Utilisateur admin : admins) {
                    if (admin.getEmail() != null) {
                        emailService.sendNouvelUtilisateurAdminEmail(
                            admin.getEmail(),
                            admin.getPrenom() + " " + admin.getNom(),
                            nouvelUtilisateurNom,
                            savedUser.getUsername(),
                            savedUser.getEmail(),
                            date
                        );
                    }
                }
                log.info("📧 Emails envoyés aux admins (nouvel utilisateur inscrit)");
            } catch (Exception e) {
                log.error("❌ Erreur envoi email admins (inscription): {}", e.getMessage());
            }

            return ResponseEntity.ok().body("Compte créé avec succès");

        } catch (Exception e) {
            log.error("Erreur lors de l'inscription", e);
            return ResponseEntity.status(500).body("Erreur interne serveur");
        }
    }

    @PostMapping("/change-password-required")
    public ResponseEntity<?> changePasswordRequired(@RequestBody ChangePasswordRequest request) {
        try {
            // Validation
            if (request.getUserId() == null) {
                return ResponseEntity.badRequest().body("L'ID utilisateur est obligatoire");
            }
            if (request.getNewPassword() == null || request.getNewPassword().isBlank()) {
                return ResponseEntity.badRequest().body("Le nouveau mot de passe est obligatoire");
            }
            if (request.getNewPassword().length() < 6) {
                return ResponseEntity.badRequest().body("Le mot de passe doit contenir au moins 6 caractères");
            }

            // Récupérer l'utilisateur
            Optional<Utilisateur> optUser = utilisateurRepository.findById(request.getUserId());
            if (optUser.isEmpty()) {
                return ResponseEntity.status(404).body("Utilisateur non trouvé");
            }

            Utilisateur utilisateur = optUser.get();

            // Mettre à jour le mot de passe et le flag
            utilisateur.setMotDePasse(passwordEncoder.encode(request.getNewPassword()));
            utilisateur.setMustChangePassword(false);
            utilisateurRepository.save(utilisateur);

            log.info("Mot de passe changé avec succès pour l'utilisateur: {}", utilisateur.getUsername());

            return ResponseEntity.ok().body("Mot de passe changé avec succès");

        } catch (Exception e) {
            log.error("Erreur lors du changement de mot de passe", e);
            return ResponseEntity.status(500).body("Erreur interne serveur");
        }
    }

    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(@RequestBody ChangePasswordRequest request) {
        try {
            log.info("🔐 Tentative de changement de mot de passe pour userId: {}", request.getUserId());
            
            // Validation
            if (request.getUserId() == null) {
                log.warn("❌ userId manquant");
                return ResponseEntity.badRequest().body("L'ID utilisateur est obligatoire");
            }
            if (request.getCurrentPassword() == null || request.getCurrentPassword().isBlank()) {
                log.warn("❌ Mot de passe actuel manquant");
                return ResponseEntity.badRequest().body("Le mot de passe actuel est obligatoire");
            }
            if (request.getNewPassword() == null || request.getNewPassword().isBlank()) {
                log.warn("❌ Nouveau mot de passe manquant");
                return ResponseEntity.badRequest().body("Le nouveau mot de passe est obligatoire");
            }
            if (request.getNewPassword().length() < 8) {
                log.warn("❌ Nouveau mot de passe trop court");
                return ResponseEntity.badRequest().body("Le mot de passe doit contenir au moins 8 caractères");
            }

            // Récupérer l'utilisateur
            Optional<Utilisateur> optUser = utilisateurRepository.findById(request.getUserId());
            if (optUser.isEmpty()) {
                log.warn("❌ Utilisateur non trouvé pour userId: {}", request.getUserId());
                return ResponseEntity.status(404).body("Utilisateur non trouvé");
            }

            Utilisateur utilisateur = optUser.get();
            log.info("👤 Utilisateur trouvé: {} ({})", utilisateur.getUsername(), utilisateur.getEmail());

            // Vérifier l'ancien mot de passe
            boolean passwordMatches = passwordEncoder.matches(request.getCurrentPassword(), utilisateur.getPassword());
            log.info("🔍 Vérification mot de passe actuel: {}", passwordMatches ? "✅ OK" : "❌ INCORRECT");
            
            if (!passwordMatches) {
                log.warn("❌ Mot de passe actuel incorrect pour l'utilisateur: {}", utilisateur.getUsername());
                return ResponseEntity.status(401).body("Le mot de passe actuel est incorrect");
            }

            // Mettre à jour le mot de passe
            utilisateur.setMotDePasse(passwordEncoder.encode(request.getNewPassword()));
            utilisateurRepository.save(utilisateur);

            log.info("✅ Mot de passe changé avec succès pour l'utilisateur: {}", utilisateur.getUsername());

            // Retourner une réponse JSON
            return ResponseEntity.ok(new java.util.HashMap<String, String>() {{
                put("message", "Mot de passe changé avec succès");
            }});

        } catch (Exception e) {
            log.error("❌ Erreur lors du changement de mot de passe", e);
            return ResponseEntity.status(500).body("Erreur interne serveur");
        }
    }

    @PostMapping("/refresh")
    public ResponseEntity<?> refreshToken(@RequestBody Map<String, String> body) {
        String requestToken = body.get("refreshToken");
        if (requestToken == null || requestToken.isBlank()) {
            return ResponseEntity.badRequest().body("refreshToken est obligatoire");
        }

        return refreshTokenService.findByToken(requestToken)
                .map(rt -> {
                    if (rt.isExpired()) {
                        refreshTokenService.deleteByUtilisateur(rt.getUtilisateur());
                        return ResponseEntity.status(401).<Object>body("Refresh token expiré, veuillez vous reconnecter");
                    }
                    String newJwt = jwtService.generateToken(rt.getUtilisateur());
                    return ResponseEntity.ok((Object) Map.of("token", newJwt));
                })
                .orElse(ResponseEntity.status(401).body("Refresh token invalide"));
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(@RequestBody Map<String, String> body) {
        String requestToken = body.get("refreshToken");
        if (requestToken != null) {
            refreshTokenService.findByToken(requestToken)
                    .ifPresent(rt -> refreshTokenService.deleteByUtilisateur(rt.getUtilisateur()));
        }
        return ResponseEntity.ok(Map.of("message", "Déconnexion réussie"));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody ForgotPasswordRequest request) {
        if (request.getEmail() == null || request.getEmail().isBlank()) {
            return ResponseEntity.badRequest().body("L'email est obligatoire");
        }

        Optional<Utilisateur> optUser = utilisateurRepository.findByEmail(request.getEmail());

        // Toujours répondre OK pour ne pas révéler si l'email existe
        if (optUser.isEmpty()) {
            log.info("Demande reset password pour email inconnu: {}", request.getEmail());
            return ResponseEntity.ok(Map.of("message", "Si cet email existe, un lien de réinitialisation a été envoyé."));
        }

        Utilisateur user = optUser.get();

        // Supprimer les anciens tokens de cet utilisateur
        passwordResetTokenRepository.deleteByUtilisateurId(user.getId());

        // Créer un nouveau token (valide 30 min)
        String token = UUID.randomUUID().toString();
        PasswordResetToken resetToken = PasswordResetToken.builder()
                .token(token)
                .utilisateurId(user.getId())
                .expiresAt(LocalDateTime.now().plusMinutes(30))
                .build();
        passwordResetTokenRepository.save(resetToken);

        // Envoyer l'email
        String resetLink = frontendUrl + "/reset-password?token=" + token;
        String prenomNom = (user.getPrenom() != null ? user.getPrenom() : "") + " " + (user.getNom() != null ? user.getNom() : "");
        emailService.sendResetPasswordEmail(user.getEmail(), prenomNom.trim(), resetLink);

        log.info("Reset password demandé pour: {}", user.getEmail());
        return ResponseEntity.ok(Map.of("message", "Si cet email existe, un lien de réinitialisation a été envoyé."));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody ResetPasswordRequest request) {
        if (request.getToken() == null || request.getToken().isBlank()) {
            return ResponseEntity.badRequest().body("Le token est obligatoire");
        }
        if (request.getNewPassword() == null || request.getNewPassword().length() < 6) {
            return ResponseEntity.badRequest().body("Le mot de passe doit contenir au moins 6 caractères");
        }

        Optional<PasswordResetToken> optToken = passwordResetTokenRepository.findByToken(request.getToken());
        if (optToken.isEmpty()) {
            return ResponseEntity.status(400).body("Lien invalide ou déjà utilisé");
        }

        PasswordResetToken resetToken = optToken.get();
        if (resetToken.isUsed() || resetToken.isExpired()) {
            return ResponseEntity.status(400).body("Ce lien a expiré ou a déjà été utilisé");
        }

        Optional<Utilisateur> optUser = utilisateurRepository.findById(resetToken.getUtilisateurId());
        if (optUser.isEmpty()) {
            return ResponseEntity.status(404).body("Utilisateur non trouvé");
        }

        Utilisateur user = optUser.get();
        user.setMotDePasse(passwordEncoder.encode(request.getNewPassword()));
        user.setMustChangePassword(false);
        utilisateurRepository.save(user);

        // Invalider le token
        resetToken.setUsed(true);
        passwordResetTokenRepository.save(resetToken);

        log.info("Mot de passe réinitialisé avec succès pour: {}", user.getEmail());
        return ResponseEntity.ok(Map.of("message", "Mot de passe réinitialisé avec succès"));
    }
}
