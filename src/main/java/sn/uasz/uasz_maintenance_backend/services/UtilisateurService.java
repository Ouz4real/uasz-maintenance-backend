package sn.uasz.uasz_maintenance_backend.services;

import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import sn.uasz.uasz_maintenance_backend.dtos.*;
import sn.uasz.uasz_maintenance_backend.entities.Utilisateur;
import sn.uasz.uasz_maintenance_backend.enums.Role;
import sn.uasz.uasz_maintenance_backend.enums.StatutIntervention;
import sn.uasz.uasz_maintenance_backend.repositories.InterventionRepository;
import sn.uasz.uasz_maintenance_backend.repositories.UtilisateurRepository;
import sn.uasz.uasz_maintenance_backend.services.EmailService;
import sn.uasz.uasz_maintenance_backend.services.impl.NotificationServiceImpl;

import java.security.SecureRandom;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class UtilisateurService {

    private final UtilisateurRepository utilisateurRepository;
    private final PasswordEncoder passwordEncoder;
    private final NotificationServiceImpl notificationService;
    private final EmailService emailService;

    private static final String CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$!";
    private static final SecureRandom RANDOM = new SecureRandom();

    private String generatePassword() {
        StringBuilder sb = new StringBuilder(12);
        // Garantir au moins 1 majuscule, 1 minuscule, 1 chiffre, 1 spécial
        sb.append("ABCDEFGHIJKLMNOPQRSTUVWXYZ".charAt(RANDOM.nextInt(26)));
        sb.append("abcdefghijklmnopqrstuvwxyz".charAt(RANDOM.nextInt(26)));
        sb.append("0123456789".charAt(RANDOM.nextInt(10)));
        sb.append("@#$!".charAt(RANDOM.nextInt(4)));
        for (int i = 4; i < 12; i++) {
            sb.append(CHARS.charAt(RANDOM.nextInt(CHARS.length())));
        }
        // Mélanger
        char[] arr = sb.toString().toCharArray();
        for (int i = arr.length - 1; i > 0; i--) {
            int j = RANDOM.nextInt(i + 1);
            char tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
        }
        return new String(arr);
    }

    /**
     * Création d’un utilisateur avec vérification d’unicité
     * sur username et email.
     */
    /**
     * Création d'un utilisateur avec vérification d'unicité
     * sur username et email.
     */
    public UtilisateurResponse create(UtilisateurRequest request) {

        String username = request.getUsername();
        String email = request.getEmail();

        // Vérifier si le username est déjà pris
        if (utilisateurRepository.existsByUsername(username)) {
            throw new IllegalArgumentException("Username déjà utilisé : " + username);
        }

        // Vérifier si l'email est déjà utilisé
        if (utilisateurRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("Email déjà utilisé : " + email);
        }

        // Générer un mot de passe aléatoire sécurisé si non fourni (création par admin)
        String motDePasse = request.getMotDePasse();
        boolean mustChange = false;
        
        if (motDePasse == null || motDePasse.trim().isEmpty()) {
            motDePasse = generatePassword();
            mustChange = true;
        }

        Utilisateur utilisateur = Utilisateur.builder()
                .username(username)
                .email(email)
                .motDePasse(passwordEncoder.encode(motDePasse))
                .nom(request.getNom())
                .prenom(request.getPrenom())
                .telephone(request.getTelephone())
                .departement(request.getDepartement())
                .serviceUnite(request.getServiceUnite())
                .role(request.getRole())
                .enabled(true)
                .mustChangePassword(mustChange)
                .build();

        Utilisateur saved = utilisateurRepository.save(utilisateur);

        // 📧 Envoyer le mot de passe temporaire par email si généré automatiquement
        if (mustChange) {
            String prenomNom = (saved.getPrenom() != null ? saved.getPrenom() : "") + " " + (saved.getNom() != null ? saved.getNom() : "");
            emailService.sendWelcomeEmail(saved.getEmail(), prenomNom.trim(), saved.getUsername(), motDePasse);
        }

        // 🔔 Créer une notification pour tous les responsables si c'est un technicien
        try {
            if (saved.getRole() == Role.TECHNICIEN) {
                List<Utilisateur> responsables = utilisateurRepository.findByRole(Role.RESPONSABLE_MAINTENANCE);
                
                for (Utilisateur responsable : responsables) {
                    String nomComplet = saved.getPrenom() + " " + saved.getNom();
                    notificationService.createNotification(
                        responsable.getId(),
                        "Nouveau technicien ajouté",
                        String.format("Un nouveau technicien %s (%s) a été ajouté à l'équipe", 
                            nomComplet,
                            saved.getUsername()),
                        "INFO",
                        "UTILISATEUR",
                        saved.getId()
                    );
                }
                System.out.println("  - Notifications créées pour les responsables (nouveau technicien)");
            }
        } catch (Exception e) {
            System.err.println("Erreur création notifications responsables: " + e.getMessage());
        }
        
        return toResponse(saved);
    }


    public List<UtilisateurResponse> getAll() {
        return utilisateurRepository.findAll()
                .stream()
                .sorted((u1, u2) -> {
                    if (u1.getCreatedAt() == null && u2.getCreatedAt() == null) return 0;
                    if (u1.getCreatedAt() == null) return 1;
                    if (u2.getCreatedAt() == null) return -1;
                    return u2.getCreatedAt().compareTo(u1.getCreatedAt()); // Décroissant
                })
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    private UtilisateurResponse toResponse(Utilisateur u) {
        return UtilisateurResponse.builder()
                .id(u.getId())
                .username(u.getUsername())
                .email(u.getEmail())

                // ✅ Ajouts
                .nom(u.getNom())
                .prenom(u.getPrenom())
                .departement(u.getDepartement())
                .serviceUnite(u.getServiceUnite())
                .telephone(u.getTelephone())

                .role(u.getRole())
                .enabled(u.isEnabled())
                .createdAt(u.getCreatedAt())
                .build();
    }


    // ========= RÉCUPÉRATION PAR ID =========
    public UtilisateurResponse getById(Long id) {
        Utilisateur user = utilisateurRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Utilisateur introuvable"));
        return toResponse(user);
    }

    // ========= MISE À JOUR DU PROFIL =========
    public UtilisateurResponse updateProfile(Long id, UpdateProfileRequest request) {
        Utilisateur user = utilisateurRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Utilisateur introuvable"));

        // ➜ Adapte ces setters aux champs réels de ton entity Utilisateur
        if (request.getNom() != null) {
            user.setNom(request.getNom());
        }
        if (request.getPrenom() != null) {
            user.setPrenom(request.getPrenom());
        }
        if (request.getEmail() != null) {
            user.setEmail(request.getEmail());
        }
        if (request.getTelephone() != null) {
            user.setTelephone(request.getTelephone());
        }
        if (request.getServiceUnite() != null) {
            user.setServiceUnite(request.getServiceUnite());
        }
        if (request.getDepartement() != null) {
            user.setDepartement(request.getDepartement());
        }
        if (request.getRole() != null) {
            user.setRole(request.getRole());
        }
        if (request.getEnabled() != null) {
            user.setEnabled(request.getEnabled());
        }

        Utilisateur saved = utilisateurRepository.save(user);
        return toResponse(saved);
    }

    // ========= CHANGEMENT DE MOT DE PASSE =========
    public void changePassword(Utilisateur utilisateur, ChangePasswordRequest request) {

        // 1) Vérifier l'ancien mot de passe avec le HASH
        boolean ok = passwordEncoder.matches(
                request.getCurrentPassword(),
                utilisateur.getMotDePasse()
        );

        if (!ok) {
            throw new IllegalArgumentException("Mot de passe actuel incorrect.");
        }

        // 2) Enregistrer le nouveau mot de passe hashé
        String encoded = passwordEncoder.encode(request.getNewPassword());
        utilisateur.setMotDePasse(encoded);
        utilisateurRepository.save(utilisateur);
    }

    public List<UtilisateurResponse> getByRole(Role role) {
        return utilisateurRepository.findByRole(role)
                .stream()
                .map(this::toResponse) // ta méthode mapper existante
                .toList();
    }

    // ========= RÉINITIALISATION DU MOT DE PASSE (ADMIN) =========
    public void resetPassword(Long userId, String newPassword) {
        Utilisateur user = utilisateurRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Utilisateur introuvable"));
        
        String encoded = passwordEncoder.encode(newPassword);
        user.setMotDePasse(encoded);
        utilisateurRepository.save(user);
    }

    // ========= ACTIVATION/DÉSACTIVATION D'UN UTILISATEUR (ADMIN) =========
    public UtilisateurResponse toggleEnabled(Long userId, Boolean enabled) {
        Utilisateur user = utilisateurRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Utilisateur introuvable"));
        
        user.setEnabled(enabled);
        Utilisateur saved = utilisateurRepository.save(user);
        return toResponse(saved);
    }

    // ========= SUPPRESSION D'UN UTILISATEUR (ADMIN) =========
    public void deleteById(Long userId) {
        Utilisateur user = utilisateurRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Utilisateur introuvable"));
        
        utilisateurRepository.delete(user);
    }



}
