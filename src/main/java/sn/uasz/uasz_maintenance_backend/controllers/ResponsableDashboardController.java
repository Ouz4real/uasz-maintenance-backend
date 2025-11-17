package sn.uasz.uasz_maintenance_backend.controllers;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import sn.uasz.uasz_maintenance_backend.dtos.ResponsableDashboardResponse;
import sn.uasz.uasz_maintenance_backend.services.ResponsableDashboardService;

@RestController
@RequestMapping("/api/responsables")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ResponsableDashboardController {

    private final ResponsableDashboardService responsableDashboardService;

    @GetMapping("/{id}/dashboard")
    public ResponsableDashboardResponse getDashboard(@PathVariable Long id) {
        return responsableDashboardService.getDashboard(id);
    }
}
