package sn.uasz.uasz_maintenance_backend.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import sn.uasz.uasz_maintenance_backend.entities.Equipement;

import java.util.Optional;

@Repository
public interface EquipementRepository extends JpaRepository<Equipement, Long> {

    Optional<Equipement> findByCode(String code);
}
