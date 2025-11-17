package sn.uasz.uasz_maintenance_backend.controllers;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import sn.uasz.uasz_maintenance_backend.dtos.SuperviseurDashboardResponse;
import sn.uasz.uasz_maintenance_backend.services.SuperviseurDashboardService;

@RestController
@RequestMapping("/api/superviseurs")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class SuperviseurDashboardController {

    private final SuperviseurDashboardService superviseurDashboardService;

    @GetMapping("/{id}/dashboard")
    public SuperviseurDashboardResponse getDashboard(@PathVariable Long id) {
        return superviseurDashboardService.getDashboard(id);
    }
}
