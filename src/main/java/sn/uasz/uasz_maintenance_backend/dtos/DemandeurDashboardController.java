package sn.uasz.uasz_maintenance_backend.controllers;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import sn.uasz.uasz_maintenance_backend.dtos.DemandeurDashboardResponse;
import sn.uasz.uasz_maintenance_backend.exceptions.ResourceNotFoundException;
import sn.uasz.uasz_maintenance_backend.services.DemandeurDashboardService;

@RestController
@RequestMapping("/api/demandeurs")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class DemandeurDashboardController {

    private final DemandeurDashboardService demandeurDashboardService;

    @GetMapping("/{demandeurId}/dashboard")
    public DemandeurDashboardResponse getDashboard(@PathVariable Long demandeurId) {
        return demandeurDashboardService.getDashboard(demandeurId);
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
