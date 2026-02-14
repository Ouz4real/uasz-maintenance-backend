package sn.uasz.uasz_maintenance_backend.controllers;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import sn.uasz.uasz_maintenance_backend.dtos.MaintenancePreventiveRequest;
import sn.uasz.uasz_maintenance_backend.dtos.MaintenancePreventiveResponse;
import sn.uasz.uasz_maintenance_backend.dtos.RealiserMaintenanceRequest;
import sn.uasz.uasz_maintenance_backend.services.MaintenancePreventiveService;

import java.util.List;

@RestController
@RequestMapping("/api/maintenances-preventives")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class MaintenancePreventiveController {

    private final MaintenancePreventiveService service;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public MaintenancePreventiveResponse create(@RequestBody MaintenancePreventiveRequest req) {
        return service.create(req);
    }

    @GetMapping
    public List<MaintenancePreventiveResponse> getAll() {
        return service.getAll();
    }

    /**
     * Endpoint pour marquer une maintenance comme réalisée
     * POST /api/maintenances-preventives/{id}/realiser
     */
    @PostMapping("/{id}/realiser")
    public MaintenancePreventiveResponse realiser(
            @PathVariable Long id,
            @RequestBody RealiserMaintenanceRequest req
    ) {
        return service.realiser(id, req);
    }

    /**
     * Endpoint pour arrêter/annuler une maintenance préventive
     * POST /api/maintenances-preventives/{id}/annuler
     */
    @PostMapping("/{id}/annuler")
    public MaintenancePreventiveResponse annuler(@PathVariable Long id) {
        return service.annuler(id);
    }
}
