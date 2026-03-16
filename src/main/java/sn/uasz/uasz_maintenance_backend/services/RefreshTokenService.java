package sn.uasz.uasz_maintenance_backend.services;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import sn.uasz.uasz_maintenance_backend.entities.RefreshToken;
import sn.uasz.uasz_maintenance_backend.entities.Utilisateur;
import sn.uasz.uasz_maintenance_backend.repositories.RefreshTokenRepository;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RefreshTokenService {

    @Value("${app.jwt.refresh-expiration-ms:604800000}") // 7 jours par défaut
    private long refreshExpirationMs;

    private final RefreshTokenRepository refreshTokenRepository;

    @Transactional
    public RefreshToken createRefreshToken(Utilisateur utilisateur) {
        // Supprimer l'ancien token s'il existe
        refreshTokenRepository.deleteByUtilisateur(utilisateur);

        RefreshToken token = RefreshToken.builder()
                .utilisateur(utilisateur)
                .token(UUID.randomUUID().toString())
                .expiryDate(Instant.now().plusMillis(refreshExpirationMs))
                .build();

        return refreshTokenRepository.save(token);
    }

    public Optional<RefreshToken> findByToken(String token) {
        return refreshTokenRepository.findByToken(token);
    }

    @Transactional
    public void deleteByUtilisateur(Utilisateur utilisateur) {
        refreshTokenRepository.deleteByUtilisateur(utilisateur);
    }
}
