package sn.uasz.uasz_maintenance_backend.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import sn.uasz.uasz_maintenance_backend.entities.Panne;

import java.util.List;

public interface PanneRepository extends JpaRepository<Panne, Long> {

    List<Panne> findByStatut(String statut); // on améliorera avec l'enum plus tard

    List<Panne> findByEquipementId(Long equipementId);

    boolean existsByCode(String code);
}
