package sn.uasz.uasz_maintenance_backend.controllers;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import sn.uasz.uasz_maintenance_backend.entities.TacheIntervention;
import sn.uasz.uasz_maintenance_backend.enums.StatutTache;
import sn.uasz.uasz_maintenance_backend.exceptions.ResourceNotFoundException;
import sn.uasz.uasz_maintenance_backend.services.TacheInterventionService;

import java.util.List;

@RestController
@RequestMapping("/api/interventions/{interventionId}/taches")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class TacheInterventionController {

    private final TacheInterventionService tacheInterventionService;

    @GetMapping
    public List<TacheIntervention> getTaches(@PathVariable Long interventionId) {
        return tacheInterventionService.getTachesByIntervention(interventionId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public TacheIntervention createTache(
            @PathVariable Long interventionId,
            @RequestBody TacheIntervention tacheRequest
    ) {
        return tacheInterventionService.createTache(interventionId, tacheRequest);
    }

    @PatchMapping("/{tacheId}/statut")
    public TacheIntervention updateStatut(
            @PathVariable Long interventionId,
            @PathVariable Long tacheId,
            @RequestParam StatutTache statut
    ) {
        return tacheInterventionService.updateStatut(interventionId, tacheId, statut);
    }

    @DeleteMapping("/{tacheId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteTache(
            @PathVariable Long interventionId,
            @PathVariable Long tacheId
    ) {
        tacheInterventionService.deleteTache(interventionId, tacheId);
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<String> handleNotFound(ResourceNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ex.getMessage());
    }
}
