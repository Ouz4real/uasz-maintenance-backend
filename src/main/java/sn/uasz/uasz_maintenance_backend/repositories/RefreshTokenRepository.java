package sn.uasz.uasz_maintenance_backend.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.transaction.annotation.Transactional;
import sn.uasz.uasz_maintenance_backend.entities.RefreshToken;
import sn.uasz.uasz_maintenance_backend.entities.Utilisateur;

import java.util.Optional;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {

    Optional<RefreshToken> findByToken(String token);

    @Modifying
    @Transactional
    @Query("DELETE FROM RefreshToken r WHERE r.utilisateur = :utilisateur")
    void deleteByUtilisateur(Utilisateur utilisateur);
}
