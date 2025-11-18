package sn.uasz.uasz_maintenance_backend.controllers;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import sn.uasz.uasz_maintenance_backend.dtos.InterventionRequest;
import sn.uasz.uasz_maintenance_backend.entities.Intervention;
import sn.uasz.uasz_maintenance_backend.entities.Utilisateur;
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

    // =====================================================
    // CREATION
    // =====================================================

    /**
     * Création d’une intervention pour une panne.
     * Réservé au Responsable maintenance / Superviseur.
     */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('RESPONSABLE_MAINTENANCE','SUPERVISEUR')")
    public Intervention create(@RequestBody InterventionRequest request) {
        return interventionService.createIntervention(request);
    }

    // =====================================================
    // LECTURE GLOBALE
    // =====================================================

    /**
     * Toutes les interventions (vue globale).
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('RESPONSABLE_MAINTENANCE','SUPERVISEUR')")
    public List<Intervention> getAll() {
        return interventionService.getAll();
    }

    /**
     * Détail d’une intervention.
     * On autorise technicien + responsable + superviseur.
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('TECHNICIEN','RESPONSABLE_MAINTENANCE','SUPERVISEUR')")
    public Intervention getById(@PathVariable Long id) {
        return interventionService.getById(id);
    }

    /**
     * Interventions d’une panne donnée.
     */
    @GetMapping("/panne/{panneId}")
    @PreAuthorize("hasAnyRole('RESPONSABLE_MAINTENANCE','SUPERVISEUR')")
    public List<Intervention> getByPanne(@PathVariable Long panneId) {
        return interventionService.getByPanne(panneId);
    }

    /**
     * Interventions par statut (toutes pannes confondues).
     */
    @GetMapping("/statut/{statut}")
    @PreAuthorize("hasAnyRole('RESPONSABLE_MAINTENANCE','SUPERVISEUR')")
    public List<Intervention> getByStatut(@PathVariable StatutIntervention statut) {
        return interventionService.getByStatut(statut);
    }

    // =====================================================
    // VUES TECHNICIEN
    // =====================================================

    /**
     * Toutes les interventions d’un technicien (pour écran de supervision).
     * Réservé au Responsable / Superviseur.
     */
    @GetMapping("/technicien/{technicienId}")
    @PreAuthorize("hasAnyRole('RESPONSABLE_MAINTENANCE','SUPERVISEUR')")
    public List<Intervention> getByTechnicien(@PathVariable Long technicienId) {
        return interventionService.getByTechnicien(technicienId);
    }

    /**
     * Interventions d’un technicien filtrées par statut.
     * Réservé au Responsable / Superviseur.
     */
    @GetMapping("/technicien/{technicienId}/statut/{statut}")
    @PreAuthorize("hasAnyRole('RESPONSABLE_MAINTENANCE','SUPERVISEUR')")
    public List<Intervention> getByTechnicienAndStatut(
            @PathVariable Long technicienId,
            @PathVariable StatutIntervention statut
    ) {
        return interventionService.getByTechnicienAndStatut(technicienId, statut);
    }

    /**
     * Les interventions du technicien connecté (à partir du token JWT).
     * GET /api/interventions/mes-interventions
     */
    @GetMapping("/mes-interventions")
    @PreAuthorize("hasRole('TECHNICIEN')")
    public List<Intervention> getMesInterventions(Authentication authentication) {
        Utilisateur technicien = (Utilisateur) authentication.getPrincipal();
        return interventionService.getByTechnicien(technicien.getId());
    }

    // =====================================================
    // ACTIONS SUR UNE INTERVENTION
    // =====================================================

    /**
     * Marquer une intervention comme terminée.
     */
    @PatchMapping("/{id}/terminer")
    @PreAuthorize("hasAnyRole('RESPONSABLE_MAINTENANCE','SUPERVISEUR')")
    public Intervention terminer(@PathVariable Long id) {
        return interventionService.terminerIntervention(id);
    }

    /**
     * Affecter un technicien à une intervention :
     * PATCH /api/interventions/{id}/technicien?technicienId=X
     */
    @PatchMapping("/{id}/technicien")
    @PreAuthorize("hasAnyRole('RESPONSABLE_MAINTENANCE','SUPERVISEUR')")
    public Intervention affecterTechnicien(
            @PathVariable Long id,
            @RequestParam Long technicienId
    ) {
        return interventionService.affecterTechnicien(id, technicienId);
    }

    // =====================================================
    // GESTION DES ERREURS
    // =====================================================

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<String> handleNotFound(ResourceNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ex.getMessage());
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<String> handleBadRequest(IllegalArgumentException ex) {
        return ResponseEntity.badRequest().body(ex.getMessage());
    }
}
