package sn.uasz.uasz_maintenance_backend.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import sn.uasz.uasz_maintenance_backend.entities.Panne;
import sn.uasz.uasz_maintenance_backend.enums.StatutPanne;

import java.util.List;

public interface PanneRepository extends JpaRepository<Panne, Long> {

    List<Panne> findByStatut(StatutPanne statut);

    List<Panne> findByEquipementId(Long equipementId);

    List<Panne> findByDemandeurId(Long demandeurId);

    List<Panne> findByDemandeurIdAndStatut(Long demandeurId, StatutPanne statut);

    long countByStatut(StatutPanne statut);
}
