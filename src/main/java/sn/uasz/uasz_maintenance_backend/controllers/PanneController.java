package sn.uasz.uasz_maintenance_backend.controllers;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import sn.uasz.uasz_maintenance_backend.entities.Panne;
import sn.uasz.uasz_maintenance_backend.enums.StatutPanne;
import sn.uasz.uasz_maintenance_backend.exceptions.ResourceNotFoundException;
import sn.uasz.uasz_maintenance_backend.services.PanneService;

import java.util.List;

@RestController
@RequestMapping("/api/pannes")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class PanneController {

    private final PanneService panneService;


    @GetMapping("/equipement/{equipementId}")
    public List<Panne> getByEquipement(@PathVariable Long equipementId) {
        return panneService.getPannesByEquipement(equipementId);
    }

    @GetMapping
    public List<Panne> getAll() {
        return panneService.getAllPannes();
    }

    @GetMapping("/{id}")
    public Panne getById(@PathVariable Long id) {
        return panneService.getPanneById(id);
    }

    @PostMapping("/equipement/{equipementId}")
    @ResponseStatus(HttpStatus.CREATED)
    public Panne create(@PathVariable Long equipementId, @RequestBody Panne panne) {
        return panneService.createPanne(panne, equipementId);
    }

    @PutMapping("/{id}")
    public Panne update(@PathVariable Long id, @RequestBody Panne panne) {
        return panneService.updatePanne(id, panne);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        panneService.deletePanne(id);
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<String> handleNotFound(ResourceNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ex.getMessage());
    }
    @PatchMapping("/{id}/statut")
    public Panne updateStatut(
            @PathVariable Long id,
            @RequestParam("statut") StatutPanne statut
    ) {
        return panneService.updateStatut(id, statut);
    }
}
