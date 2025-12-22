package sn.uasz.uasz_maintenance_backend.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import sn.uasz.uasz_maintenance_backend.entities.Utilisateur;
import sn.uasz.uasz_maintenance_backend.enums.Role;

import java.util.List;
import java.util.Optional;

@Repository
public interface UtilisateurRepository extends JpaRepository<Utilisateur, Long> {

    Optional<Utilisateur> findByUsername(String username);
    Optional<Utilisateur> findByUsernameOrEmail(String username, String email);

    Optional<Utilisateur> findByEmail(String email);

    boolean existsByUsername(String username);

    List<Utilisateur> findByRole(Role role);


    boolean existsByEmail(String email);
}
