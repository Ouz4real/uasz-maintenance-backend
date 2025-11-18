package sn.uasz.uasz_maintenance_backend.controllers;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import sn.uasz.uasz_maintenance_backend.dtos.GlobalDashboardDto;
import sn.uasz.uasz_maintenance_backend.dtos.DemandeurDashboardDto;
import sn.uasz.uasz_maintenance_backend.dtos.TechnicienDashboardDto;
import sn.uasz.uasz_maintenance_backend.dtos.ResponsableDashboardDto;
import sn.uasz.uasz_maintenance_backend.dtos.SuperviseurDashboardDto;
import sn.uasz.uasz_maintenance_backend.services.GlobalDashboardService;
import sn.uasz.uasz_maintenance_backend.services.DemandeurDashboardService;
import sn.uasz.uasz_maintenance_backend.services.TechnicienDashboardService;
import sn.uasz.uasz_maintenance_backend.services.ResponsableDashboardService;
import sn.uasz.uasz_maintenance_backend.services.SuperviseurDashboardService;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class DashboardController {

    private final GlobalDashboardService globalDashboardService;
    private final DemandeurDashboardService demandeurDashboardService;
    private final TechnicienDashboardService technicienDashboardService;
    private final ResponsableDashboardService responsableDashboardService;
    private final SuperviseurDashboardService superviseurDashboardService;

    @GetMapping("/global")
    public GlobalDashboardDto getGlobalDashboard() {
        return globalDashboardService.getGlobalDashboard();
    }

    @GetMapping("/demandeur/{demandeurId}")
    public DemandeurDashboardDto getDemandeurDashboard(@PathVariable Long demandeurId) {
        return demandeurDashboardService.getDashboardForDemandeur(demandeurId);
    }

    @GetMapping("/technicien/{technicienId}")
    public TechnicienDashboardDto getTechnicienDashboard(@PathVariable Long technicienId) {
        return technicienDashboardService.getDashboardForTechnicien(technicienId);
    }

    @GetMapping("/responsable/{responsableId}")
    public ResponsableDashboardDto getResponsableDashboard(@PathVariable Long responsableId) {
        return responsableDashboardService.getDashboardForResponsable(responsableId);
    }

    @GetMapping("/superviseur/{superviseurId}")
    public SuperviseurDashboardDto getSuperviseurDashboard(@PathVariable Long superviseurId) {
        return superviseurDashboardService.getDashboardForSuperviseur(superviseurId);
    }
}
