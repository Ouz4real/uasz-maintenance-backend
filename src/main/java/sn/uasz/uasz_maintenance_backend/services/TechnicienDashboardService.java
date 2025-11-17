package sn.uasz.uasz_maintenance_backend.services;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import sn.uasz.uasz_maintenance_backend.dtos.TechnicienDashboardResponse;
import sn.uasz.uasz_maintenance_backend.entities.Intervention;
import sn.uasz.uasz_maintenance_backend.entities.Utilisateur;
import sn.uasz.uasz_maintenance_backend.enums.Role;
import sn.uasz.uasz_maintenance_backend.enums.StatutIntervention;
import sn.uasz.uasz_maintenance_backend.exceptions.ResourceNotFoundException;
import sn.uasz.uasz_maintenance_backend.repositories.InterventionRepository;
import sn.uasz.uasz_maintenance_backend.repositories.UtilisateurRepository;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TechnicienDashboardService {

    private final UtilisateurRepository utilisateurRepository;
    private final InterventionRepository interventionRepository;

    public TechnicienDashboardResponse getDashboard(Long technicienId) {

        // 1) Vérifier que l'utilisateur existe et est bien TECHNICIEN
        Utilisateur technicien = utilisateurRepository.findById(technicienId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Utilisateur non trouvé avec l'id : " + technicienId
                ));

        if (technicien.getRole() != Role.TECHNICIEN) {
            throw new IllegalArgumentException(
                    "L'utilisateur " + technicien.getUsername() + " n'a pas le rôle TECHNICIEN"
            );
        }

        // 2) Récupérer toutes ses interventions
        List<Intervention> interventions = interventionRepository.findByTechnicienId(technicienId);

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

        // 3) Dernière intervention commencée (dateDebut max)
        LocalDateTime derniereInterventionDebut = interventions.stream()
                .map(Intervention::getDateDebut)
                .filter(d -> d != null)
                .max(LocalDateTime::compareTo)
                .orElse(null);

        // 4) Dernière intervention terminée (dateFin max)
        LocalDateTime derniereInterventionTerminee = interventions.stream()
                .map(Intervention::getDateFin)
                .filter(d -> d != null)
                .max(LocalDateTime::compareTo)
                .orElse(null);

        // 5) Temps moyen de réalisation (dateDebut → dateFin sur les TERMINEES)
        Long tempsMoyenRealisationMinutes = null;
        long totalMinutes = 0;
        long nbInterventionsAvecTemps = 0;

        for (Intervention intervention : interventions) {
            if (intervention.getStatut() != StatutIntervention.TERMINEE) continue;

            LocalDateTime debut = intervention.getDateDebut();
            LocalDateTime fin = intervention.getDateFin();

            if (debut != null && fin != null) {
                long minutes = Duration.between(debut, fin).toMinutes();
                totalMinutes += minutes;
                nbInterventionsAvecTemps++;
            }
        }

        if (nbInterventionsAvecTemps > 0) {
            tempsMoyenRealisationMinutes = totalMinutes / nbInterventionsAvecTemps;
        }

        // 6) Construire la réponse
        return TechnicienDashboardResponse.builder()
                .technicienId(technicien.getId())
                .username(technicien.getUsername())
                .email(technicien.getEmail())
                .totalInterventions(totalInterventions)
                .interventionsPlanifiees(interventionsPlanifiees)
                .interventionsEnCours(interventionsEnCours)
                .interventionsTerminees(interventionsTerminees)
                .interventionsAnnulees(interventionsAnnulees)
                .derniereInterventionDebut(derniereInterventionDebut)
                .derniereInterventionTerminee(derniereInterventionTerminee)
                .tempsMoyenRealisationMinutes(tempsMoyenRealisationMinutes)
                .build();
    }
}
