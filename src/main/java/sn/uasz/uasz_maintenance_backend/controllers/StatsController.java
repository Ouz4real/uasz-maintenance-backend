package sn.uasz.uasz_maintenance_backend.controllers;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import sn.uasz.uasz_maintenance_backend.dtos.StatsGlobalesResponse;
import sn.uasz.uasz_maintenance_backend.dtos.StatsTechnicienResponse;
import sn.uasz.uasz_maintenance_backend.services.StatsService;

@RestController
@RequestMapping("/api/stats")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class StatsController {

    private final StatsService statsService;

    @GetMapping("/globales")
    public StatsGlobalesResponse getStatsGlobales() {
        return statsService.getStatsGlobales();
    }

    /**
     * Stats pour un technicien précis
     * Exemple : /api/stats/techniciens/1
     */
    @GetMapping("/techniciens/{technicienId}")
    public StatsTechnicienResponse getStatsTechnicien(@PathVariable Long technicienId) {
        return statsService.getStatsPourTechnicien(technicienId);
    }
}
