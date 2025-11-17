package sn.uasz.uasz_maintenance_backend.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import sn.uasz.uasz_maintenance_backend.entities.Intervention;
import sn.uasz.uasz_maintenance_backend.enums.StatutIntervention;

import java.util.List;

public interface InterventionRepository extends JpaRepository<Intervention, Long> {

    List<Intervention> findByPanneId(Long panneId);

    List<Intervention> findByTechnicienId(Long technicienId);

    List<Intervention> findByStatut(StatutIntervention statut);

    List<Intervention> findByTechnicienIdAndStatut(Long technicienId, StatutIntervention statut);

    // 🔹 Pour les stats globales
    long countByStatut(StatutIntervention statut);

    // 🔹 Pour les stats technicien
    long countByTechnicienId(Long technicienId);

    long countByTechnicienIdAndStatut(Long technicienId, StatutIntervention statut);
}
