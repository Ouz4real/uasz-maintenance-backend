package sn.uasz.uasz_maintenance_backend.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;
import sn.uasz.uasz_maintenance_backend.entities.Intervention;
import sn.uasz.uasz_maintenance_backend.enums.StatutIntervention;

import java.util.List;

public interface InterventionRepository extends JpaRepository<Intervention, Long> {

    List<Intervention> findByPanneId(Long panneId);

    List<Intervention> findByTechnicienId(Long technicienId);

    List<Intervention> findByStatut(StatutIntervention statut);

    List<Intervention> findByTechnicienIdAndStatut(Long technicienId, StatutIntervention statut);

    // ✅ ordre sur le champ entity (dateDebut) => colonne date_debut
    List<Intervention> findByTechnicienIdAndStatutOrderByDateDebutDesc(Long technicienId, StatutIntervention statut);

    // ✅ top 5 sur le champ entity (dateDebut) => colonne date_debut
    List<Intervention> findTop5ByTechnicienIdOrderByDateDebutDesc(Long technicienId);

    // 🔹 stats
    long countByStatut(StatutIntervention statut);

    long countByTechnicienId(Long technicienId);

    boolean existsByTechnicienIdAndStatut(Long technicienId, StatutIntervention statut);


    long countByTechnicienIdAndStatut(Long technicienId, StatutIntervention statut);

    // ✅ temps moyen (minutes) uniquement pour TERMINEE (ou autre statut)
    //    -> native SQL PostgreSQL (date_fin - date_debut) ok
    @Query(value = """
        SELECT AVG(EXTRACT(EPOCH FROM (i.date_fin - i.date_debut)) / 60.0)
        FROM interventions i
        WHERE i.technicien_id = :technicienId
          AND i.statut = :statut
          AND i.date_debut IS NOT NULL
          AND i.date_fin IS NOT NULL
    """, nativeQuery = true)
    Double avgDureeMinutesByTechnicienAndStatut(
            @Param("technicienId") Long technicienId,
            @Param("statut") String statut
    );

    @Modifying
    @Transactional
    @Query("UPDATE Intervention i SET i.technicien = null WHERE i.technicien.id = :userId")
    void nullifyTechnicien(@Param("userId") Long userId);
}
