package sn.uasz.uasz_maintenance_backend.controllers;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import sn.uasz.uasz_maintenance_backend.dtos.SuperviseurDashboardResponse;
import sn.uasz.uasz_maintenance_backend.entities.Utilisateur;
import sn.uasz.uasz_maintenance_backend.exceptions.ResourceNotFoundException;
import sn.uasz.uasz_maintenance_backend.services.SuperviseurDashboardService;

@RestController
@RequestMapping("/api/superviseurs")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class SuperviseurDashboardController {

    private final SuperviseurDashboardService superviseurDashboardService;

    /**
     * Dashboard d’un superviseur (par ID).
     * Accès : SUPERVISEUR uniquement (tu peux élargir si tu veux).
     */
    @GetMapping("/{superviseurId}/dashboard")
    @PreAuthorize("hasRole('SUPERVISEUR')")
    public SuperviseurDashboardResponse getDashboard(@PathVariable Long superviseurId) {
        return superviseurDashboardService.getDashboard(superviseurId);
    }

    /**
     * Dashboard du superviseur connecté.
     * GET /api/superviseurs/mon-dashboard
     */
    @GetMapping("/mon-dashboard")
    @PreAuthorize("hasRole('SUPERVISEUR')")
    public SuperviseurDashboardResponse getMonDashboard(Authentication authentication) {
        Utilisateur superviseur = (Utilisateur) authentication.getPrincipal();
        return superviseurDashboardService.getDashboard(superviseur.getId());
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
