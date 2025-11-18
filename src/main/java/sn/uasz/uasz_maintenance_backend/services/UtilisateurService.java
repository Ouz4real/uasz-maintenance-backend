package sn.uasz.uasz_maintenance_backend.services;

import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import sn.uasz.uasz_maintenance_backend.dtos.UtilisateurRequest;
import sn.uasz.uasz_maintenance_backend.dtos.UtilisateurResponse;
import sn.uasz.uasz_maintenance_backend.entities.Utilisateur;
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
                .role(u.getRole())
                .enabled(u.isEnabled())
                .build();
    }
}
