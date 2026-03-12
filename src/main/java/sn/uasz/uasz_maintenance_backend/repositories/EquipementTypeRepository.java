package sn.uasz.uasz_maintenance_backend.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import sn.uasz.uasz_maintenance_backend.entities.EquipementType;

@Repository
public interface EquipementTypeRepository extends JpaRepository<EquipementType, Long> {
    boolean existsByLibelleIgnoreCase(String libelle);
}
