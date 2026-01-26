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

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class UtilisateurService {

    private final UtilisateurRepository utilisateurRepository;
    private final PasswordEncoder passwordEncoder;

    /**
     * Création d’un utilisateur avec vérification d’unicité
     * sur username et email.
     */
    public UtilisateurResponse create(UtilisateurRequest request) {

        String username = request.getUsername();
        String email = request.getEmail();

        // Vérifier si le username est déjà pris
        if (utilisateurRepository.existsByUsername(username)) {
            throw new IllegalArgumentException("Username déjà utilisé : " + username);
        }

        // Vérifier si l’email est déjà utilisé
        if (utilisateurRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("Email déjà utilisé : " + email);
        }

        Utilisateur utilisateur = Utilisateur.builder()
                .username(username)
                .email(email)
                .motDePasse(passwordEncoder.encode(request.getMotDePasse()))
                .role(request.getRole())
                .enabled(true)
                .build();

        Utilisateur saved = utilisateurRepository.save(utilisateur);
        return toResponse(saved);
    }

    public List<UtilisateurResponse> getAll() {
        return utilisateurRepository.findAll()
                .stream()
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
                .build();
    }

    @Service
    @RequiredArgsConstructor
    public class TechnicienService {

        private final UtilisateurRepository utilisateurRepository;
        private final InterventionRepository interventionRepository;

        public List<TechnicienUIResponse> getTechniciensSupervision() {

            List<Utilisateur> techniciens =
                    utilisateurRepository.findByRole(Role.TECHNICIEN);


            return techniciens.stream().map(technicien -> {

                TechnicienUIResponse dto = new TechnicienUIResponse();
                dto.setId(technicien.getId());
                dto.setNom(technicien.getNom());
                dto.setPrenom(technicien.getPrenom());

                // 🔥 ICI ET NULLE PART AILLEURS
                dto.setOccupe(
                        interventionRepository.existsByTechnicienIdAndStatut(
                                technicien.getId(),
                                StatutIntervention.EN_COURS
                        )
                );

                return dto;
            }).toList();
        }
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



}
