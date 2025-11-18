package sn.uasz.uasz_maintenance_backend.controllers;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import sn.uasz.uasz_maintenance_backend.dtos.DemandeurDashboardResponse;
import sn.uasz.uasz_maintenance_backend.entities.Utilisateur;
import sn.uasz.uasz_maintenance_backend.exceptions.ResourceNotFoundException;
import sn.uasz.uasz_maintenance_backend.services.DemandeurDashboardService;

@RestController
@RequestMapping("/api/demandeurs")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class DemandeurDashboardController {

    private final DemandeurDashboardService demandeurDashboardService;

    /**
     * Vue dashboard d’un demandeur spécifique (par ID).
     * Réservé au responsable maintenance et au superviseur.
     */
    @GetMapping("/{demandeurId}/dashboard")
    @PreAuthorize("hasAnyRole('RESPONSABLE_MAINTENANCE','SUPERVISEUR')")
    public DemandeurDashboardResponse getDashboard(@PathVariable Long demandeurId) {
        return demandeurDashboardService.getDashboard(demandeurId);
    }

    /**
     * Vue dashboard du demandeur connecté (à partir du token).
     * GET /api/demandeurs/mon-dashboard
     */
    @GetMapping("/mon-dashboard")
    @PreAuthorize("hasRole('DEMANDEUR')")
    public DemandeurDashboardResponse getMonDashboard(Authentication authentication) {
        Utilisateur demandeur = (Utilisateur) authentication.getPrincipal();
        return demandeurDashboardService.getDashboard(demandeur.getId());
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<String> handleNotFound(ResourceNotFoundException ex) {
        return ResponseEntity.status(404).body(ex.getMessage());
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<String> handleBadRequest(IllegalArgumentException ex) {
        return ResponseEntity.badRequest().body(ex.getMessage());
    }
}
