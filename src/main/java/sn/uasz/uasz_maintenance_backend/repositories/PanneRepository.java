package sn.uasz.uasz_maintenance_backend.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import sn.uasz.uasz_maintenance_backend.entities.Panne;
import sn.uasz.uasz_maintenance_backend.enums.StatutInterventions;
import sn.uasz.uasz_maintenance_backend.enums.StatutPanne;

import java.time.LocalDateTime;
import java.util.List;

public interface PanneRepository extends JpaRepository<Panne, Long> {

    List<Panne> findByStatut(StatutPanne statut);

    List<Panne> findByEquipementId(Long equipementId);

    List<Panne> findByDemandeurId(Long demandeurId);

    List<Panne> findByDemandeurIdAndStatut(Long demandeurId, StatutPanne statut);

    List<Panne> findByTechnicienId(Long technicienId);

    long countByStatut(StatutPanne statut);

    // 🔥 NOUVEAU
    List<Panne> findByTechnicienIdAndStatut(Long technicienId, StatutPanne statut);

    // 🔥 POUR OCCUPATION
    boolean existsByTechnicienIdAndStatut(Long technicienId, StatutPanne statut);

    // 🔥 POUR OCCUPATION (basé sur statut_interventions)
    boolean existsByTechnicienIdAndStatutInterventions(Long technicienId, StatutInterventions statutInterventions);


    // 🔹 Pannes EN COURS d’un technicien
    List<Panne> findByTechnicienIdAndStatutInterventionsOrderByDateDebutInterventionDesc(
            Long technicienId,
            StatutInterventions statutInterventions
    );

    // 🔹 Dernières pannes TERMINÉES d’un technicien
    List<Panne> findTop5ByTechnicienIdAndStatutInterventionsOrderByDateFinInterventionDesc(
            Long technicienId,
            StatutInterventions statutInterventions
    );

    // 🔹 Comptages (stats)
    long countByTechnicienIdAndStatutInterventions(Long technicienId, StatutInterventions statut);

    @Query("""
        SELECT COUNT(p)
        FROM Panne p
        WHERE p.technicien.id = :technicienId
        AND p.statutInterventions = sn.uasz.uasz_maintenance_backend.enums.StatutInterventions.EN_COURS
    """)
    Long countEnCours(@Param("technicienId") Long technicienId);

    @Query("""
        SELECT COUNT(p)
        FROM Panne p
        WHERE p.technicien.id = :technicienId
        AND p.statutInterventions = sn.uasz.uasz_maintenance_backend.enums.StatutInterventions.TERMINEE
    """)
    Long countTerminees(@Param("technicienId") Long technicienId);

    // 🔹 Temps moyen en HEURES
    @Query(
            value = """
            SELECT AVG(EXTRACT(EPOCH FROM (date_fin_intervention - date_debut_intervention)) / 3600)
            FROM pannes
            WHERE technicien_id = :technicienId
              AND statut_interventions = 'TERMINEE'
              AND date_fin_intervention IS NOT NULL
              AND date_debut_intervention IS NOT NULL
        """,
            nativeQuery = true
    )
    Double tempsMoyenHeures(@Param("technicienId") Long technicienId);

    // 🔹 Pannes AFFECTÉES à un technicien (NON_DEMARREE ou EN_COURS)
    @Query("""
        SELECT p FROM Panne p
        WHERE p.technicien.id = :technicienId
        AND p.statutInterventions IN (
            sn.uasz.uasz_maintenance_backend.enums.StatutInterventions.NON_DEMARREE,
            sn.uasz.uasz_maintenance_backend.enums.StatutInterventions.EN_COURS
        )
        ORDER BY p.dateSignalement DESC
    """)
    List<Panne> findPannesAffecteesAuTechnicien(@Param("technicienId") Long technicienId);

    // 🔹 TOUTES les pannes d'un technicien (incluant TERMINEE)
    @Query("""
        SELECT p FROM Panne p
        WHERE p.technicien.id = :technicienId
        ORDER BY p.dateSignalement DESC
    """)
    List<Panne> findToutesPannesDuTechnicien(@Param("technicienId") Long technicienId);

}
