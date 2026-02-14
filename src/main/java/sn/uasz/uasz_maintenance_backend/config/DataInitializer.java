package sn.uasz.uasz_maintenance_backend.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import sn.uasz.uasz_maintenance_backend.entities.Utilisateur;
import sn.uasz.uasz_maintenance_backend.enums.Role;
import sn.uasz.uasz_maintenance_backend.repositories.UtilisateurRepository;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final UtilisateurRepository utilisateurRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        log.info("🚀 Initialisation des données de test...");

        // 1. ADMINISTRATEUR
        createUserIfNotExists(
                "admin", "admin123",
                "Admin", "Système",
                "admin@uasz.sn",
                Role.ADMINISTRATEUR,
                null, null
        );

        // 2. SUPERVISEUR
        createUserIfNotExists(
                "superviseur", "super123",
                "Diop", "Amadou",
                "superviseur@uasz.sn",
                Role.SUPERVISEUR,
                null, null
        );

        // 3. RESPONSABLE MAINTENANCE
        createUserIfNotExists(
                "responsable", "resp123",
                "Sow", "Fatou",
                "responsable@uasz.sn",
                Role.RESPONSABLE_MAINTENANCE,
                null, null
        );

        // 4. TECHNICIEN
        createUserIfNotExists(
                "technicien", "tech123",
                "Fall", "Moussa",
                "technicien@uasz.sn",
                Role.TECHNICIEN,
                "Électricité", "Installation électrique"
        );

        // 5. DEMANDEUR
        createUserIfNotExists(
                "demandeur", "dem123",
                "Ndiaye", "Aïssatou",
                "demandeur@uasz.sn",
                Role.DEMANDEUR,
                null, null
        );

        log.info("✅ Initialisation des données terminée!");
        log.info("📋 Utilisateurs disponibles:");
        log.info("   - admin / admin123 (ADMINISTRATEUR)");
        log.info("   - superviseur / super123 (SUPERVISEUR)");
        log.info("   - responsable / resp123 (RESPONSABLE_MAINTENANCE)");
        log.info("   - technicien / tech123 (TECHNICIEN)");
        log.info("   - demandeur / dem123 (DEMANDEUR)");
    }

    private void createUserIfNotExists(
            String username, String password,
            String nom, String prenom,
            String email, Role role,
            String categorie, String sousCategorie
    ) {
        if (utilisateurRepository.existsByUsername(username)) {
            log.info("✓ Utilisateur '{}' existe déjà", username);
            return;
        }

        Utilisateur.UtilisateurBuilder builder = Utilisateur.builder()
                .username(username)
                .motDePasse(passwordEncoder.encode(password))
                .nom(nom)
                .prenom(prenom)
                .email(email)
                .role(role)
                .enabled(true);

        Utilisateur user = builder.build();
        utilisateurRepository.save(user);
        log.info("✓ Utilisateur '{}' créé avec succès ({})", username, role);
    }
}
