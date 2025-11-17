package sn.uasz.uasz_maintenance_backend.controllers;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import sn.uasz.uasz_maintenance_backend.dtos.TechnicienDashboardResponse;
import sn.uasz.uasz_maintenance_backend.services.TechnicienDashboardService;

@RestController
@RequestMapping("/api/techniciens")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class TechnicienDashboardController {

    private final TechnicienDashboardService technicienDashboardService;

    @GetMapping("/{id}/dashboard")
    public TechnicienDashboardResponse getDashboard(@PathVariable Long id) {
        return technicienDashboardService.getDashboard(id);
    }
}
