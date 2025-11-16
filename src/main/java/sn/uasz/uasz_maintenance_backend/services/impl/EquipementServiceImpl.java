package sn.uasz.uasz_maintenance_backend.services.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import sn.uasz.uasz_maintenance_backend.entities.Equipement;
import sn.uasz.uasz_maintenance_backend.exceptions.ResourceNotFoundException;
import sn.uasz.uasz_maintenance_backend.repositories.EquipementRepository;
import sn.uasz.uasz_maintenance_backend.services.EquipementService;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class EquipementServiceImpl implements EquipementService {

    private final EquipementRepository equipementRepository;

    @Override
    @Transactional(readOnly = true)
    public List<Equipement> getAllEquipements() {
        return equipementRepository.findAll();
    }

    @Override
    @Transactional(readOnly = true)
    public Equipement getEquipementById(Long id) {
        return equipementRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Équipement non trouvé avec id = " + id));
    }

    @Override
    @Transactional(readOnly = true)
    public Equipement getEquipementByCode(String code) {
        return equipementRepository.findByCode(code)
                .orElseThrow(() -> new ResourceNotFoundException("Équipement non trouvé avec code = " + code));
    }

    @Override
    public Equipement createEquipement(Equipement equipement) {
        // On pourrait ajouter des vérifications : code unique, etc.
        return equipementRepository.save(equipement);
    }

    @Override
    public Equipement updateEquipement(Long id, Equipement updated) {
        Equipement existant = getEquipementById(id);

        existant.setCode(updated.getCode());
        existant.setLibelle(updated.getLibelle());
        existant.setDescription(updated.getDescription());
        existant.setDateAcquisition(updated.getDateAcquisition());
        existant.setEtat(updated.getEtat());
        existant.setLocalisation(updated.getLocalisation());

        return equipementRepository.save(existant);
    }

    @Override
    public void deleteEquipement(Long id) {
        Equipement existant = getEquipementById(id);
        equipementRepository.delete(existant);
    }
}
