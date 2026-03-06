package sn.uasz.uasz_maintenance_backend.controllers;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import sn.uasz.uasz_maintenance_backend.dtos.EquipementDetailsDto;
import sn.uasz.uasz_maintenance_backend.dtos.EquipementStockDto;
import sn.uasz.uasz_maintenance_backend.services.EquipementStockService;

import java.util.List;

@RestController
@RequestMapping("/api/stock-equipements")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class EquipementStockController {

    private final EquipementStockService stockService;

    @GetMapping
    public List<EquipementStockDto> stock() {
        return stockService.getStock();
    }

    @GetMapping("/{typeId}/details")
    public EquipementDetailsDto details(@PathVariable Long typeId) {
        return stockService.getDetails(typeId);
    }

    // création type + quantité initiale
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public void create(@RequestBody CreateEquipementTypeRequest req) {
        stockService.createTypeWithQuantity(
                req.libelle, req.description, req.quantite, req.localisation, req.statut
        );
    }

    // ajouter exemplaires à un type existant
    @PostMapping("/{typeId}/items")
    public void addItems(@PathVariable Long typeId, @RequestBody AddItemsRequest req) {
        stockService.addItems(typeId, req.quantite, req.localisation, req.statut);
    }

    // petits DTO request internes
    public static class CreateEquipementTypeRequest {
        public String libelle;
        public String description;
        public int quantite;
        public String localisation;
        public String statut; // EN_SERVICE / HORS_SERVICE
    }

    public static class AddItemsRequest {
        public int quantite;
        public String localisation;
        public String statut;
    }
}
