package sn.uasz.uasz_maintenance_backend.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import sn.uasz.uasz_maintenance_backend.entities.EquipementItem;
import sn.uasz.uasz_maintenance_backend.enums.EtatEquipementItem;


import java.util.List;
import java.util.Optional;

@Repository
public interface EquipementItemRepository extends JpaRepository<EquipementItem, Long> {

    long countByTypeId(Long typeId);

    long countByTypeIdAndStatut(Long typeId, EtatEquipementItem statut);

    List<EquipementItem> findByTypeIdOrderByIdDesc(Long typeId);

    List<EquipementItem> findByTypeIdAndStatutOrderByDateMiseEnServiceDesc(Long typeId, EtatEquipementItem statut);

    Optional<EquipementItem> findFirstByTypeIdAndStatutOrderByIdAsc(Long typeId, EtatEquipementItem statut);

    List<EquipementItem> findByInterventionId(Long interventionId);
    

}
