package sn.uasz.uasz_maintenance_backend.services;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import sn.uasz.uasz_maintenance_backend.dtos.GlobalDashboardDto;
import sn.uasz.uasz_maintenance_backend.entities.Intervention;
import sn.uasz.uasz_maintenance_backend.entities.Panne;
import sn.uasz.uasz_maintenance_backend.enums.StatutIntervention;
import sn.uasz.uasz_maintenance_backend.enums.StatutPanne;
import sn.uasz.uasz_maintenance_backend.repositories.InterventionRepository;
import sn.uasz.uasz_maintenance_backend.repositories.PanneRepository;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class GlobalDashboardService {

    private final PanneRepository panneRepository;
    private final InterventionRepository interventionRepository;

    public GlobalDashboardDto getGlobalDashboard() {
        List<Panne> pannes = panneRepository.findAll();
        List<Intervention> interventions = interventionRepository.findAll();

        long totalPannes = pannes.size();
        long pannesOuvertes = pannes.stream()
                .filter(p -> p.getStatut() == StatutPanne.OUVERTE)
                .count();
        long pannesEnCours = pannes.stream()
                .filter(p -> p.getStatut() == StatutPanne.EN_COURS)
                .count();
        long pannesResolues = pannes.stream()
                .filter(p -> p.getStatut() == StatutPanne.RESOLUE)
                .count();
        long pannesAnnulees = pannes.stream()
                .filter(p -> p.getStatut() == StatutPanne.ANNULEE)
                .count();

        long totalInterventions = interventions.size();
        long interventionsPlanifiees = interventions.stream()
                .filter(i -> i.getStatut() == StatutIntervention.PLANIFIEE)
                .count();
        long interventionsEnCours = interventions.stream()
                .filter(i -> i.getStatut() == StatutIntervention.EN_COURS)
                .count();
        long interventionsTerminees = interventions.stream()
                .filter(i -> i.getStatut() == StatutIntervention.TERMINEE)
                .count();
        long interventionsAnnulees = interventions.stream()
                .filter(i -> i.getStatut() == StatutIntervention.ANNULEE)
                .count();

        return GlobalDashboardDto.builder()
                .totalPannes(totalPannes)
                .pannesOuvertes(pannesOuvertes)
                .pannesEnCours(pannesEnCours)
                .pannesResolues(pannesResolues)
                .pannesAnnulees(pannesAnnulees)
                .totalInterventions(totalInterventions)
                .interventionsPlanifiees(interventionsPlanifiees)
                .interventionsEnCours(interventionsEnCours)
                .interventionsTerminees(interventionsTerminees)
                .interventionsAnnulees(interventionsAnnulees)
                .build();
    }
}
