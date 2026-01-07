package sn.uasz.uasz_maintenance_backend.controllers;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import sn.uasz.uasz_maintenance_backend.entities.Equipement;
import sn.uasz.uasz_maintenance_backend.services.EquipementService;

import java.util.List;

@RestController
@RequestMapping("/api/equipements")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class EquipementController {

    private final EquipementService equipementService;

    @GetMapping
    public List<Equipement> getAll() {
        return equipementService.getAllEquipements();
    }

    @GetMapping("/{id}")
    public Equipement getById(@PathVariable Long id) {
        return equipementService.getEquipementById(id);
    }

    @GetMapping("/code/{code}")
    public Equipement getByCode(@PathVariable String code) {
        return equipementService.getEquipementByCode(code);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Equipement create(@RequestBody Equipement equipement) {
        return equipementService.createEquipement(equipement);
    }

    @PutMapping("/{id}")
    public Equipement update(@PathVariable Long id, @RequestBody Equipement equipement) {
        return equipementService.updateEquipement(id, equipement);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        equipementService.deleteEquipement(id);
    }
}
