package sn.uasz.uasz_maintenance_backend.services;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import sn.uasz.uasz_maintenance_backend.dtos.ResponsableDashboardResponse;
import sn.uasz.uasz_maintenance_backend.entities.Intervention;
import sn.uasz.uasz_maintenance_backend.entities.Panne;
import sn.uasz.uasz_maintenance_backend.entities.Utilisateur;
import sn.uasz.uasz_maintenance_backend.enums.Priorite;
import sn.uasz.uasz_maintenance_backend.enums.Role;
import sn.uasz.uasz_maintenance_backend.enums.StatutIntervention;
import sn.uasz.uasz_maintenance_backend.enums.StatutPanne;
import sn.uasz.uasz_maintenance_backend.exceptions.ResourceNotFoundException;
import sn.uasz.uasz_maintenance_backend.repositories.InterventionRepository;
import sn.uasz.uasz_maintenance_backend.repositories.PanneRepository;
import sn.uasz.uasz_maintenance_backend.repositories.UtilisateurRepository;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ResponsableDashboardService {

    private final UtilisateurRepository utilisateurRepository;
    private final PanneRepository panneRepository;
    private final InterventionRepository interventionRepository;

    public ResponsableDashboardResponse getDashboard(Long responsableId) {

        // 1) Vérifier que l'utilisateur existe et est RESPONSABLE_MAINTENANCE
        Utilisateur responsable = utilisateurRepository.findById(responsableId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Utilisateur non trouvé avec l'id : " + responsableId
                ));

        if (responsable.getRole() != Role.RESPONSABLE_MAINTENANCE) {
            throw new IllegalArgumentException(
                    "L'utilisateur " + responsable.getUsername() + " n'a pas le rôle RESPONSABLE_MAINTENANCE"
            );
        }

        // 2) Récupérer toutes les pannes et interventions
        List<Panne> pannes = panneRepository.findAll();
        List<Intervention> interventions = interventionRepository.findAll();

        // ====== PANNES ======
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

        // Pannes qui n'ont AUCUNE intervention associée
        Set<Long> panneIdsAvecIntervention = interventions.stream()
                .map(i -> i.getPanne().getId())
                .collect(Collectors.toSet());

        long pannesSansIntervention = pannes.stream()
                .filter(p -> !panneIdsAvecIntervention.contains(p.getId()))
                .count();

        // Pannes ouvertes en priorité HAUTE
        long pannesOuvertesHautePriorite = pannes.stream()
                .filter(p -> p.getStatut() == StatutPanne.OUVERTE)
                .filter(p -> p.getPriorite() == Priorite.HAUTE)
                .count();

        // ====== INTERVENTIONS ======
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

        // Interventions sans technicien affecté
        long interventionsSansTechnicien = interventions.stream()
                .filter(i -> i.getTechnicien() == null)
                .count();

        // 3) Construire la réponse
        return ResponsableDashboardResponse.builder()
                .responsableId(responsable.getId())
                .username(responsable.getUsername())
                .email(responsable.getEmail())

                .totalPannes(totalPannes)
                .pannesOuvertes(pannesOuvertes)
                .pannesEnCours(pannesEnCours)
                .pannesResolues(pannesResolues)
                .pannesAnnulees(pannesAnnulees)
                .pannesSansIntervention(pannesSansIntervention)
                .pannesOuvertesHautePriorite(pannesOuvertesHautePriorite)

                .totalInterventions(totalInterventions)
                .interventionsPlanifiees(interventionsPlanifiees)
                .interventionsEnCours(interventionsEnCours)
                .interventionsTerminees(interventionsTerminees)
                .interventionsAnnulees(interventionsAnnulees)
                .interventionsSansTechnicien(interventionsSansTechnicien)
                .build();
    }
}
