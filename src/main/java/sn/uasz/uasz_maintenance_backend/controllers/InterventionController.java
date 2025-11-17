package sn.uasz.uasz_maintenance_backend.controllers;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import sn.uasz.uasz_maintenance_backend.dtos.InterventionRequest;
import sn.uasz.uasz_maintenance_backend.entities.Intervention;
import sn.uasz.uasz_maintenance_backend.enums.StatutIntervention;
import sn.uasz.uasz_maintenance_backend.exceptions.ResourceNotFoundException;
import sn.uasz.uasz_maintenance_backend.services.InterventionService;

import java.util.List;

@RestController
@RequestMapping("/api/interventions")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class InterventionController {

    private final InterventionService interventionService;

    // Création d'une intervention (avec panneId + éventuellement technicienId)
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Intervention create(@RequestBody InterventionRequest request) {
        return interventionService.createIntervention(request);
    }

    // Toutes les interventions
    @GetMapping
    public List<Intervention> getAll() {
        return interventionService.getAll();
    }

    // Intervention par id
    @GetMapping("/{id}")
    public Intervention getById(@PathVariable Long id) {
        return interventionService.getById(id);
    }

    // Interventions d'une panne
    @GetMapping("/panne/{panneId}")
    public List<Intervention> getByPanne(@PathVariable Long panneId) {
        return interventionService.getByPanne(panneId);
    }

    // Interventions par statut (toutes, tous techniciens confondus)
    @GetMapping("/statut/{statut}")
    public List<Intervention> getByStatut(@PathVariable StatutIntervention statut) {
        return interventionService.getByStatut(statut);
    }

    // Interventions d'un technicien
    @GetMapping("/technicien/{technicienId}")
    public List<Intervention> getByTechnicien(@PathVariable Long technicienId) {
        return interventionService.getByTechnicien(technicienId);
    }

    // Interventions d'un technicien filtrées par statut
    @GetMapping("/technicien/{technicienId}/statut/{statut}")
    public List<Intervention> getByTechnicienAndStatut(
            @PathVariable Long technicienId,
            @PathVariable StatutIntervention statut
    ) {
        return interventionService.getByTechnicienAndStatut(technicienId, statut);
    }

    // Terminer une intervention (et éventuellement mettre la panne à RESOLUE)
    @PatchMapping("/{id}/terminer")
    public Intervention terminer(@PathVariable Long id) {
        return interventionService.terminerIntervention(id);
    }

    // Affecter un technicien à une intervention
    @PatchMapping("/{id}/technicien")
    public Intervention affecterTechnicien(
            @PathVariable Long id,
            @RequestParam Long technicienId
    ) {
        return interventionService.affecterTechnicien(id, technicienId);
    }

    // Gestion des ressources non trouvées
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<String> handleNotFound(ResourceNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ex.getMessage());
    }

    // Optionnel : gérer aussi les IllegalArgumentException proprement
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<String> handleIllegalArg(IllegalArgumentException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ex.getMessage());
    }
}
