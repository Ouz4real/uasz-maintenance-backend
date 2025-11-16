package sn.uasz.uasz_maintenance_backend.services;

import sn.uasz.uasz_maintenance_backend.entities.Equipement;

import java.util.List;

public interface EquipementService {

    List<Equipement> getAllEquipements();

    Equipement getEquipementById(Long id);

    Equipement getEquipementByCode(String code);

    Equipement createEquipement(Equipement equipement);

    Equipement updateEquipement(Long id, Equipement equipement);

    void deleteEquipement(Long id);
}
