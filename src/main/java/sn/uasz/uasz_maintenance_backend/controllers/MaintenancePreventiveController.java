package sn.uasz.uasz_maintenance_backend.controllers;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import sn.uasz.uasz_maintenance_backend.dtos.MaintenancePreventiveRequest;
import sn.uasz.uasz_maintenance_backend.dtos.MaintenancePreventiveResponse;
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
}
