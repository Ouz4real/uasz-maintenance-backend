package sn.uasz.uasz_maintenance_backend.services;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import sn.uasz.uasz_maintenance_backend.dtos.MaintenancePreventiveRequest;
import sn.uasz.uasz_maintenance_backend.dtos.MaintenancePreventiveResponse;
import sn.uasz.uasz_maintenance_backend.entities.MaintenancePreventive;
import sn.uasz.uasz_maintenance_backend.repositories.MaintenancePreventiveRepository;

import java.util.List;

@Service
@RequiredArgsConstructor
public class MaintenancePreventiveService {

    private final MaintenancePreventiveRepository repo;

    public MaintenancePreventiveResponse create(MaintenancePreventiveRequest req) {
        MaintenancePreventive saved = repo.save(MaintenancePreventive.builder()
                .equipementReference(req.getEquipementReference())
                .technicienId(req.getTechnicienId())
                .frequence(req.getFrequence())
                .prochaineDate(req.getProchaineDate())
                .responsable(req.getResponsable())
                .statut(req.getStatut())
                .description(req.getDescription())
                .build());

        return toResponse(saved);
    }

    public List<MaintenancePreventiveResponse> getAll() {
        return repo.findAll().stream().map(this::toResponse).toList();
    }

    private MaintenancePreventiveResponse toResponse(MaintenancePreventive m) {
        return MaintenancePreventiveResponse.builder()
                .id(m.getId())
                .equipementReference(m.getEquipementReference())
                .technicienId(m.getTechnicienId())
                .frequence(m.getFrequence())
                .prochaineDate(m.getProchaineDate())
                .responsable(m.getResponsable())
                .statut(m.getStatut())
                .description(m.getDescription())
                .build();
    }
}
