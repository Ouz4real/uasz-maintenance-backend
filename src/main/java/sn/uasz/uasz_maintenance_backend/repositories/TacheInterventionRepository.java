package sn.uasz.uasz_maintenance_backend.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import sn.uasz.uasz_maintenance_backend.entities.TacheIntervention;

import java.util.List;

public interface TacheInterventionRepository extends JpaRepository<TacheIntervention, Long> {

    List<TacheIntervention> findByInterventionId(Long interventionId);
}
