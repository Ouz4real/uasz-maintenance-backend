package sn.uasz.uasz_maintenance_backend.controllers;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import sn.uasz.uasz_maintenance_backend.dtos.EquipementStatsDto;
import sn.uasz.uasz_maintenance_backend.dtos.SuperviseurDashboardResponse;
import sn.uasz.uasz_maintenance_backend.entities.Utilisateur;
import sn.uasz.uasz_maintenance_backend.exceptions.ResourceNotFoundException;
import sn.uasz.uasz_maintenance_backend.services.EquipementStatsService;
import sn.uasz.uasz_maintenance_backend.services.SuperviseurDashboardService;

@RestController
@RequestMapping("/api/superviseurs")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class SuperviseurDashboardController {

    private final SuperviseurDashboardService superviseurDashboardService;
    private final EquipementStatsService equipementStatsService;

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

    /**
     * Dashboard du superviseur connecté avec filtrage par période.
     * GET /api/superviseurs/mon-dashboard/periode?dateDebut=2024-01-01&dateFin=2024-12-31
     */
    @GetMapping("/mon-dashboard/periode")
    @PreAuthorize("hasRole('SUPERVISEUR')")
    public SuperviseurDashboardResponse getMonDashboardByPeriode(
            Authentication authentication,
            @RequestParam String dateDebut,
            @RequestParam String dateFin) {
        Utilisateur superviseur = (Utilisateur) authentication.getPrincipal();
        return superviseurDashboardService.getDashboardByPeriode(superviseur.getId(), dateDebut, dateFin);
    }

    /**
     * Statistiques des équipements pour le superviseur.
     * GET /api/superviseurs/equipements/stats
     */
    @GetMapping("/equipements/stats")
    @PreAuthorize("hasRole('SUPERVISEUR')")
    public EquipementStatsDto getEquipementStats() {
        return equipementStatsService.getEquipementStats();
    }

    /**
     * Statistiques des équipements avec filtrage par période.
     * GET /api/superviseurs/equipements/stats/periode?dateDebut=2024-01-01&dateFin=2024-12-31
     */
    @GetMapping("/equipements/stats/periode")
    @PreAuthorize("hasRole('SUPERVISEUR')")
    public EquipementStatsDto getEquipementStatsByPeriode(
            @RequestParam String dateDebut,
            @RequestParam String dateFin) {
        try {
            return equipementStatsService.getEquipementStatsByPeriode(dateDebut, dateFin);
        } catch (Exception e) {
            throw new IllegalArgumentException("Erreur lors du filtrage par période: " + e.getMessage(), e);
        }
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
