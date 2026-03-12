package sn.uasz.uasz_maintenance_backend.controllers;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import sn.uasz.uasz_maintenance_backend.dtos.ResponsableDashboardResponse;
import sn.uasz.uasz_maintenance_backend.entities.Utilisateur;
import sn.uasz.uasz_maintenance_backend.exceptions.ResourceNotFoundException;
import sn.uasz.uasz_maintenance_backend.services.ResponsableDashboardService;

@RestController
@RequestMapping("/api/responsables")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ResponsableDashboardController {

    private final ResponsableDashboardService responsableDashboardService;

    /**
     * Dashboard d’un responsable maintenance (par ID).
     * Accès : RESPONSABLE_MAINTENANCE et SUPERVISEUR.
     */
    @GetMapping("/{responsableId}/dashboard")
    @PreAuthorize("hasAnyRole('RESPONSABLE_MAINTENANCE','SUPERVISEUR')")
    public ResponsableDashboardResponse getDashboard(@PathVariable Long responsableId) {
        return responsableDashboardService.getDashboard(responsableId);
    }

    /**
     * Dashboard du responsable connecté.
     * GET /api/responsables/mon-dashboard
     */
    @GetMapping("/mon-dashboard")
    @PreAuthorize("hasRole('RESPONSABLE_MAINTENANCE')")
    public ResponsableDashboardResponse getMonDashboard(Authentication authentication) {
        Utilisateur responsable = (Utilisateur) authentication.getPrincipal();
        return responsableDashboardService.getDashboard(responsable.getId());
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
