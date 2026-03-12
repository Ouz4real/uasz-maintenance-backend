package sn.uasz.uasz_maintenance_backend.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import sn.uasz.uasz_maintenance_backend.entities.Equipement;

import java.util.List;
import java.util.Optional;

@Repository
public interface EquipementRepository extends JpaRepository<Equipement, Long> {
    Optional<Equipement> findByCode(String code);

    long countByEtat(String etat);

    @Query("SELECT e.libelle, COUNT(e) FROM Equipement e GROUP BY e.libelle")
    List<Object[]> countByType();

    @Query("SELECT e.localisation, COUNT(e) FROM Equipement e WHERE e.localisation IS NOT NULL GROUP BY e.localisation")
    List<Object[]> countByLocalisation();

    @Query("SELECT e.localisation, e.etat, COUNT(e) FROM Equipement e WHERE e.localisation IS NOT NULL GROUP BY e.localisation, e.etat")
    List<Object[]> countByLocalisationAndEtat();

    @Query("""
        SELECT e, COUNT(p) as panneCount
        FROM Equipement e
        LEFT JOIN Panne p ON p.equipement.id = e.id
        GROUP BY e.id
        ORDER BY panneCount DESC
    """)
    List<Object[]> findEquipementsWithPanneCount();
}

