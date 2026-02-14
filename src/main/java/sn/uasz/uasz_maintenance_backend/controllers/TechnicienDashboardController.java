package sn.uasz.uasz_maintenance_backend.controllers;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import sn.uasz.uasz_maintenance_backend.dtos.TechnicienDashboardResponse;
import sn.uasz.uasz_maintenance_backend.entities.Utilisateur;
import sn.uasz.uasz_maintenance_backend.exceptions.ResourceNotFoundException;
import sn.uasz.uasz_maintenance_backend.services.TechnicienDashboardService;

@RestController
@RequestMapping("/api/techniciens")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class TechnicienDashboardController {

    private final TechnicienDashboardService technicienDashboardService;

    /**
     * Vue dashboard d’un technicien spécifique (par ID).
     * Réservé au responsable maintenance et au superviseur.
     */
    @GetMapping("/{technicienId}/dashboard")
    @PreAuthorize("hasAnyRole('RESPONSABLE_MAINTENANCE','SUPERVISEUR')")
    public TechnicienDashboardResponse getDashboard(@PathVariable Long technicienId) {
        return technicienDashboardService.getDashboard(technicienId);
    }

    /**
     * Dashboard du technicien connecté.
     * GET /api/techniciens/mon-dashboard
     */
    @GetMapping("/mon-dashboard")
    @PreAuthorize("hasRole('TECHNICIEN')")
    public TechnicienDashboardResponse getMonDashboard(Authentication authentication) {
        Utilisateur technicien = (Utilisateur) authentication.getPrincipal();
        return technicienDashboardService.getDashboard(technicien.getId());
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
