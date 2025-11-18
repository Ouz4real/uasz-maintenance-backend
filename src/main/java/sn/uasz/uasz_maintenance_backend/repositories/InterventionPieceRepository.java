package sn.uasz.uasz_maintenance_backend.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import sn.uasz.uasz_maintenance_backend.entities.InterventionPiece;

import java.util.List;

public interface InterventionPieceRepository extends JpaRepository<InterventionPiece, Long> {

    // pièces d’une intervention
    List<InterventionPiece> findByInterventionId(Long interventionId);

    // 🔹 toutes les pièces consommées par un technicien (via l’intervention)
    List<InterventionPiece> findByIntervention_Technicien_Id(Long technicienId);
}
