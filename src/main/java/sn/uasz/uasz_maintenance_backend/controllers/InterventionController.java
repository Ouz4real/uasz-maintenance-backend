package sn.uasz.uasz_maintenance_backend.controllers;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import sn.uasz.uasz_maintenance_backend.dtos.InterventionRequest;
import sn.uasz.uasz_maintenance_backend.entities.Intervention;
import sn.uasz.uasz_maintenance_backend.exceptions.ResourceNotFoundException;
import sn.uasz.uasz_maintenance_backend.services.InterventionService;

import java.util.List;

@RestController
@RequestMapping("/api/interventions")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class InterventionController {

    private final InterventionService interventionService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Intervention create(@RequestBody InterventionRequest request) {
        return interventionService.createIntervention(request);
    }

    @GetMapping
    public List<Intervention> getAll() {
        return interventionService.getAll();
    }

    @GetMapping("/{id}")
    public Intervention getById(@PathVariable Long id) {
        return interventionService.getById(id);
    }

    @GetMapping("/panne/{panneId}")
    public List<Intervention> getByPanne(@PathVariable Long panneId) {
        return interventionService.getByPanne(panneId);
    }

    @PatchMapping("/{id}/terminer")
    public Intervention terminer(@PathVariable Long id) {
        return interventionService.terminerIntervention(id);
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<String> handleNotFound(ResourceNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ex.getMessage());
    }
}
