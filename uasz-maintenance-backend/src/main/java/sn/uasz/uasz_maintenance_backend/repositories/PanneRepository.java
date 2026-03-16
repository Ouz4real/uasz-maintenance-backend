package sn.uasz.uasz_maintenance_backend.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import sn.uasz.uasz_maintenance_backend.entities.Panne;
import sn.uasz.uasz_maintenance_backend.enums.StatutPanne;

import java.util.List;

public interface PanneRepository extends JpaRepository<Panne, Long> {

    // 🔹 Pannes par statut (enum)
    List<Panne> findByStatut(StatutPanne statut);

    // 🔹 Pannes pour un équipement donné
    List<Panne> findByEquipementId(Long equipementId);

    // 🔹 Vérifier l’unicité d’un code de panne
    boolean existsByCode(String code);

    // 🔹 Pannes par demandeur
    List<Panne> findByDemandeurId(Long demandeurId);

    // 🔹 Pannes par demandeur + statut
    List<Panne> findByDemandeurIdAndStatut(Long demandeurId, StatutPanne statut);

    // 🔹 Pour les statistiques globales
    long countByStatut(StatutPanne statut);
}
