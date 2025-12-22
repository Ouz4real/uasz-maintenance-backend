package sn.uasz.uasz_maintenance_backend.services;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import sn.uasz.uasz_maintenance_backend.dtos.SuperviseurDashboardDto;
import sn.uasz.uasz_maintenance_backend.dtos.SuperviseurDashboardResponse;
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

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.OptionalDouble;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SuperviseurDashboardService {

    private final UtilisateurRepository utilisateurRepository;
    private final PanneRepository panneRepository;
    private final InterventionRepository interventionRepository;

    /**
     * Méthode appelée par le controller /api/superviseurs/{id}/dashboard
     */
    public SuperviseurDashboardResponse getDashboard(Long superviseurId) {
        SuperviseurDashboardDto dto = getDashboardForSuperviseur(superviseurId);

        return SuperviseurDashboardResponse.builder()
                .superviseurId(dto.getSuperviseurId())
                .username(dto.getUsername())
                .email(dto.getEmail())
                .totalPannes(dto.getTotalPannes())
                .pannesOuvertes(dto.getPannesOuvertes())
                .pannesEnCours(dto.getPannesEnCours())
                .pannesResolues(dto.getPannesResolues())
                .pannesAnnulees(dto.getPannesAnnulees())
                .pannesPrioriteHaute(dto.getPannesPrioriteHaute())
                .pannesPrioriteMoyenne(dto.getPannesPrioriteMoyenne())
                .pannesPrioriteBasse(dto.getPannesPrioriteBasse())
                .tempsMoyenResolutionMinutes(dto.getTempsMoyenResolutionMinutes())
                .nombreEquipementsImpactes(dto.getNombreEquipementsImpactes())
                .totalInterventions(dto.getTotalInterventions())
                .interventionsPlanifiees(dto.getInterventionsPlanifiees())
                .interventionsEnCours(dto.getInterventionsEnCours())
                .interventionsTerminees(dto.getInterventionsTerminees())
                .interventionsAnnulees(dto.getInterventionsAnnulees())
                .tempsMoyenRealisationMinutes(dto.getTempsMoyenRealisationMinutes())
                .build();
    }

    /**
     * Logique métier : vue globale pour le Superviseur
     */
    public SuperviseurDashboardDto getDashboardForSuperviseur(Long superviseurId) {

        Utilisateur superviseur = utilisateurRepository.findById(superviseurId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Superviseur non trouvé avec l'id : " + superviseurId
                ));

        if (superviseur.getRole() != Role.SUPERVISEUR) {
            throw new IllegalArgumentException(
                    "L'utilisateur " + superviseur.getUsername() + " n'a pas le rôle SUPERVISEUR"
            );
        }

        List<Panne> pannes = panneRepository.findAll();
        List<Intervention> interventions = interventionRepository.findAll();

        long totalPannes = pannes.size();
        long pannesOuvertes = pannes.stream().filter(p -> p.getStatut() == StatutPanne.OUVERTE).count();
        long pannesEnCours = pannes.stream().filter(p -> p.getStatut() == StatutPanne.EN_COURS).count();
        long pannesResolues = pannes.stream().filter(p -> p.getStatut() == StatutPanne.RESOLUE).count();

        long pannesPrioriteHaute = pannes.stream().filter(p -> p.getPriorite() == Priorite.HAUTE).count();
        long pannesPrioriteMoyenne = pannes.stream().filter(p -> p.getPriorite() == Priorite.MOYENNE).count();
        long pannesPrioriteBasse = pannes.stream().filter(p -> p.getPriorite() == Priorite.BASSE).count();

        // Temps moyen de résolution des pannes (signalement -> dernière intervention terminée)
        Double tempsMoyenResolutionMinutes = null;

        List<Panne> pannesResoluesList = pannes.stream()
                .filter(p -> p.getStatut() == StatutPanne.RESOLUE)
                .collect(Collectors.toList());

        if (!pannesResoluesList.isEmpty()) {
            OptionalDouble moyenne = pannesResoluesList.stream()
                    .mapToLong(p -> {
                        List<Intervention> intervs = interventionRepository.findByPanneId(p.getId());
                        LocalDateTime dateResolution = intervs.stream()
                                .map(Intervention::getDateFin)
                                .filter(d -> d != null)
                                .max(LocalDateTime::compareTo)
                                .orElse(null);

                        if (p.getDateSignalement() != null && dateResolution != null) {
                            Duration d = Duration.between(p.getDateSignalement(), dateResolution);
                            return d.toMinutes();
                        }
                        return 0L;
                    })
                    .filter(v -> v > 0)
                    .average();

            if (moyenne.isPresent()) {
                tempsMoyenResolutionMinutes = moyenne.getAsDouble();
            }
        }

        // Nombre d'équipements différents ayant au moins une panne
        long equipementsImpactesCount = pannes.stream()
                .filter(p -> p.getEquipement() != null)
                .map(p -> p.getEquipement().getId())
                .distinct()
                .count();
        Long nombreEquipementsImpactes = equipementsImpactesCount; // autoboxing

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

        // Temps moyen de réalisation des interventions (début -> fin)
        Double tempsMoyenRealisationMinutes = null;

        OptionalDouble moyenneInterventions = interventions.stream()
                .filter(i -> i.getDateDebut() != null && i.getDateFin() != null)
                .mapToLong(i -> {
                    Duration d = Duration.between(i.getDateDebut(), i.getDateFin());
                    return d.toMinutes();
                })
                .filter(v -> v > 0)
                .average();

        if (moyenneInterventions.isPresent()) {
            tempsMoyenRealisationMinutes = moyenneInterventions.getAsDouble();
        }

        return SuperviseurDashboardDto.builder()
                .superviseurId(superviseur.getId())
                .username(superviseur.getUsername())
                .email(superviseur.getEmail())
                .totalPannes(totalPannes)
                .pannesOuvertes(pannesOuvertes)
                .pannesEnCours(pannesEnCours)
                .pannesResolues(pannesResolues)
                .pannesPrioriteHaute(pannesPrioriteHaute)
                .pannesPrioriteMoyenne(pannesPrioriteMoyenne)
                .pannesPrioriteBasse(pannesPrioriteBasse)
                .tempsMoyenResolutionMinutes(tempsMoyenResolutionMinutes)
                .nombreEquipementsImpactes(nombreEquipementsImpactes)
                .totalInterventions(totalInterventions)
                .interventionsPlanifiees(interventionsPlanifiees)
                .interventionsEnCours(interventionsEnCours)
                .interventionsTerminees(interventionsTerminees)
                .interventionsAnnulees(interventionsAnnulees)
                .tempsMoyenRealisationMinutes(tempsMoyenRealisationMinutes)
                .build();
    }
}
