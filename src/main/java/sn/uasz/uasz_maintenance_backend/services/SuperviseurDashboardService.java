package sn.uasz.uasz_maintenance_backend.services;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
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
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SuperviseurDashboardService {

    private final UtilisateurRepository utilisateurRepository;
    private final PanneRepository panneRepository;
    private final InterventionRepository interventionRepository;

    public SuperviseurDashboardResponse getDashboard(Long superviseurId) {

        // 1) Vérifier que l'utilisateur existe et est SUPERVISEUR
        Utilisateur superviseur = utilisateurRepository.findById(superviseurId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Utilisateur non trouvé avec l'id : " + superviseurId
                ));

        if (superviseur.getRole() != Role.SUPERVISEUR) {
            throw new IllegalArgumentException(
                    "L'utilisateur " + superviseur.getUsername() + " n'a pas le rôle SUPERVISEUR"
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

        long pannesPrioriteHaute = pannes.stream()
                .filter(p -> p.getPriorite() == Priorite.HAUTE)
                .count();
        long pannesPrioriteMoyenne = pannes.stream()
                .filter(p -> p.getPriorite() == Priorite.MOYENNE)
                .count();
        long pannesPrioriteBasse = pannes.stream()
                .filter(p -> p.getPriorite() == Priorite.BASSE)
                .count();

        Long nombreEquipementsImpactes = pannes.stream()
                .filter(p -> p.getEquipement() != null)
                .map(p -> p.getEquipement().getId())
                .distinct()
                .count();

        // Temps moyen de résolution (MTTR) global sur les pannes résolues
        Double tempsMoyenResolutionMinutes = null;

        List<Long> dureesResolution = pannes.stream()
                .filter(p -> p.getStatut() == StatutPanne.RESOLUE)
                .filter(p -> p.getDateSignalement() != null)
                .map(p -> {
                    LocalDateTime dateSignalement = p.getDateSignalement();

                    // on prend la dernière dateFin parmi les interventions TERMINÉES de cette panne
                    LocalDateTime dateResolution = interventions.stream()
                            .filter(i -> i.getPanne() != null && i.getPanne().getId().equals(p.getId()))
                            .filter(i -> i.getStatut() == StatutIntervention.TERMINEE)
                            .map(Intervention::getDateFin)
                            .filter(Objects::nonNull)
                            .max(LocalDateTime::compareTo)
                            .orElse(null);

                    if (dateResolution == null) {
                        return null;
                    }
                    return Duration.between(dateSignalement, dateResolution).toMinutes();
                })
                .filter(Objects::nonNull)
                .toList();

        if (!dureesResolution.isEmpty()) {
            long somme = dureesResolution.stream().reduce(0L, Long::sum);
            tempsMoyenResolutionMinutes = somme * 1.0 / dureesResolution.size();
        }

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

        // Temps moyen de réalisation d'une intervention (pour celles avec début + fin)
        Double tempsMoyenRealisationMinutes = null;

        List<Long> dureesInterventions = interventions.stream()
                .filter(i -> i.getDateDebut() != null && i.getDateFin() != null)
                .map(i -> Duration.between(i.getDateDebut(), i.getDateFin()).toMinutes())
                .toList();

        if (!dureesInterventions.isEmpty()) {
            long somme = dureesInterventions.stream().reduce(0L, Long::sum);
            tempsMoyenRealisationMinutes = somme * 1.0 / dureesInterventions.size();
        }

        // 3) Construire la réponse
        return SuperviseurDashboardResponse.builder()
                .superviseurId(superviseur.getId())
                .username(superviseur.getUsername())
                .email(superviseur.getEmail())

                .totalPannes(totalPannes)
                .pannesOuvertes(pannesOuvertes)
                .pannesEnCours(pannesEnCours)
                .pannesResolues(pannesResolues)
                .pannesAnnulees(pannesAnnulees)

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
