package sn.uasz.uasz_maintenance_backend.services;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import sn.uasz.uasz_maintenance_backend.dtos.InterventionRequest;
import sn.uasz.uasz_maintenance_backend.entities.Intervention;
import sn.uasz.uasz_maintenance_backend.entities.Panne;
import sn.uasz.uasz_maintenance_backend.enums.StatutIntervention;
import sn.uasz.uasz_maintenance_backend.repositories.InterventionRepository;
import sn.uasz.uasz_maintenance_backend.repositories.PanneRepository;
import sn.uasz.uasz_maintenance_backend.exceptions.ResourceNotFoundException;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class InterventionService {

    private final InterventionRepository interventionRepository;
    private final PanneRepository panneRepository;

    public Intervention createIntervention(InterventionRequest request) {
        Panne panne = panneRepository.findById(request.getPanneId())
                .orElseThrow(() -> new ResourceNotFoundException("Panne non trouvée avec id: " + request.getPanneId()));

        Intervention intervention = Intervention.builder()
                .titre(request.getTitre())
                .description(request.getDescription())
                .type(request.getType())
                .statut(request.getStatut() != null ? request.getStatut() : StatutIntervention.PLANIFIEE)
                .realiseePar(request.getRealiseePar())
                .cout(request.getCout())
                .dateDebut(LocalDateTime.now())
                .panne(panne)
                .build();

        return interventionRepository.save(intervention);
    }

    public List<Intervention> getAll() {
        return interventionRepository.findAll();
    }

    public Intervention getById(Long id) {
        return interventionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Intervention non trouvée avec id: " + id));
    }

    public List<Intervention> getByPanne(Long panneId) {
        return interventionRepository.findByPanneId(panneId);
    }

    public Intervention terminerIntervention(Long id) {
        Intervention intervention = getById(id);
        intervention.setStatut(StatutIntervention.TERMINEE);
        intervention.setDateFin(LocalDateTime.now());
        return interventionRepository.save(intervention);
    }
}
