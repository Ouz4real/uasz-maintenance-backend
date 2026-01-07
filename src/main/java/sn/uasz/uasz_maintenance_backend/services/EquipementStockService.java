package sn.uasz.uasz_maintenance_backend.services;

import sn.uasz.uasz_maintenance_backend.dtos.EquipementDetailsDto;
import sn.uasz.uasz_maintenance_backend.dtos.EquipementStockDto;

import java.util.List;

public interface EquipementStockService {
    List<EquipementStockDto> getStock();
    EquipementDetailsDto getDetails(Long typeId);

    // créer un type + quantité initiale d'exemplaires
    void createTypeWithQuantity(String libelle, String description, int quantite,
                                String localisation, String statut);

    // ajouter X exemplaires à un type existant
    void addItems(Long typeId, int quantite, String localisation, String statut);
}
