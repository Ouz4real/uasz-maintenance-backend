package sn.uasz.uasz_maintenance_backend.controllers;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import sn.uasz.uasz_maintenance_backend.dtos.AuthRequest;
import sn.uasz.uasz_maintenance_backend.dtos.AuthResponse;
import sn.uasz.uasz_maintenance_backend.dtos.ChangePasswordRequest;
import sn.uasz.uasz_maintenance_backend.dtos.RegisterRequest;
import sn.uasz.uasz_maintenance_backend.entities.Notification;
import sn.uasz.uasz_maintenance_backend.entities.Utilisateur;
import sn.uasz.uasz_maintenance_backend.enums.Role;
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
    private final sn.uasz.uasz_maintenance_backend.services.NotificationService notificationService;

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

            // 5) Construire la réponse JSON
            AuthResponse response = AuthResponse.builder()
                    .token(token)
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

    // Endpoint de debug pour réinitialiser le mot de passe du superviseur
    @PostMapping("/reset-superviseur-password")
    public ResponseEntity<?> resetSuperviseurPassword() {
        try {
            Optional<Utilisateur> optUser = utilisateurRepository.findByUsername("superviseur");
            if (optUser.isEmpty()) {
                return ResponseEntity.status(404).body("Utilisateur superviseur non trouvé");
            }

            Utilisateur superviseur = optUser.get();
            String newPassword = "super123";
            superviseur.setMotDePasse(passwordEncoder.encode(newPassword));
            utilisateurRepository.save(superviseur);

            log.info("✅ Mot de passe du superviseur réinitialisé à: {}", newPassword);

            return ResponseEntity.ok().body("Mot de passe du superviseur réinitialisé à: " + newPassword);

        } catch (Exception e) {
            log.error("❌ Erreur lors de la réinitialisation du mot de passe", e);
            return ResponseEntity.status(500).body("Erreur interne serveur");
        }
    }
}
