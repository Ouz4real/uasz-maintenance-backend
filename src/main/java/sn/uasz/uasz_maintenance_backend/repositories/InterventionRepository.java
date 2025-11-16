package sn.uasz.uasz_maintenance_backend.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import sn.uasz.uasz_maintenance_backend.entities.Intervention;

import java.util.List;

public interface InterventionRepository extends JpaRepository<Intervention, Long> {

    List<Intervention> findByPanneId(Long panneId);
}
