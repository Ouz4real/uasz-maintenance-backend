package sn.uasz.uasz_maintenance_backend.controllers;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import sn.uasz.uasz_maintenance_backend.dtos.EquipementStockDetailsDto;
import sn.uasz.uasz_maintenance_backend.dtos.EquipementStockRowDto;
import sn.uasz.uasz_maintenance_backend.services.StockEquipementService;

import java.util.List;

@RestController
@RequestMapping("/api/stock/equipements")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class StockEquipementController {

    private final StockEquipementService stockService;

    @GetMapping
    public List<EquipementStockRowDto> getStock() {
        return stockService.getStock();
    }

    @GetMapping("/{typeId}")
    public EquipementStockDetailsDto getStockDetails(@PathVariable Long typeId) {
        return stockService.getStockDetails(typeId);
    }
}
