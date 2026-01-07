package sn.uasz.uasz_maintenance_backend.services;

import sn.uasz.uasz_maintenance_backend.dtos.EquipementStockDetailsDto;
import sn.uasz.uasz_maintenance_backend.dtos.EquipementStockRowDto;

import java.util.List;

public interface StockEquipementService {
    List<EquipementStockRowDto> getStock();
    EquipementStockDetailsDto getStockDetails(Long typeId);
}
