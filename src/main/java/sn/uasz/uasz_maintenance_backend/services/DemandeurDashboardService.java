package sn.uasz.uasz_maintenance_backend.services;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import sn.uasz.uasz_maintenance_backend.dtos.DemandeurDashboardResponse;
import sn.uasz.uasz_maintenance_backend.entities.Intervention;
import sn.uasz.uasz_maintenance_backend.entities.Panne;
import sn.uasz.uasz_maintenance_backend.entities.Utilisateur;
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

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DemandeurDashboardService {

    private final UtilisateurRepository utilisateurRepository;
    private final PanneRepository panneRepository;
    private final InterventionRepository interventionRepository;

    public DemandeurDashboardResponse getDashboard(Long demandeurId) {

        // Vérifier utilisateur
        Utilisateur demandeur = utilisateurRepository.findById(demandeurId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Utilisateur non trouvé avec l'id : " + demandeurId
                ));

        if (demandeur.getRole() != Role.DEMANDEUR) {
            throw new IllegalArgumentException(
                    "L'utilisateur " + demandeur.getUsername() + " n'a pas le rôle DEMANDEUR"
            );
        }

        // Récupérer pannes du demandeur
        List<Panne> pannes = panneRepository.findByDemandeurId(demandeurId);

        long totalPannes = pannes.size();
        long pannesOuvertes = pannes.stream().filter(p -> p.getStatut() == StatutPanne.OUVERTE).count();
        long pannesEnCours = pannes.stream().filter(p -> p.getStatut() == StatutPanne.EN_COURS).count();
        long pannesResolues = pannes.stream().filter(p -> p.getStatut() == StatutPanne.RESOLUE).count();
        long pannesAnnulees = pannes.stream().filter(p -> p.getStatut() == StatutPanne.ANNULEE).count();

        // Dernier signalement
        LocalDateTime dernierePanneCree = pannes.stream()
                .map(Panne::getDateSignalement)
                .filter(d -> d != null)
                .max(LocalDateTime::compareTo)
                .orElse(null);

        // Calcul temps moyen de résolution + dernière panne résolue
        Long tempsMoyenResolutionMinutes = null;
        LocalDateTime dernierePanneResolue = null;

        long totalMinutes = 0;
        long nbPannesResoluesAvecTemps = 0;

        for (Panne panne : pannes) {
            if (panne.getStatut() != StatutPanne.RESOLUE) continue;

            List<Intervention> interventions = interventionRepository.findByPanneId(panne.getId());

            LocalDateTime derniereFin = interventions.stream()
                    .filter(i -> i.getStatut() == StatutIntervention.TERMINEE)
                    .map(Intervention::getDateFin)
                    .filter(df -> df != null)
                    .max(LocalDateTime::compareTo)
                    .orElse(null);

            if (derniereFin != null && panne.getDateSignalement() != null) {

                // Calcul durée
                long minutes = Duration.between(panne.getDateSignalement(), derniereFin).toMinutes();
                totalMinutes += minutes;
                nbPannesResoluesAvecTemps++;

                // Mise à jour dernière panne résolue
                if (dernierePanneResolue == null || derniereFin.isAfter(dernierePanneResolue)) {
                    dernierePanneResolue = derniereFin;
                }
            }
        }

        if (nbPannesResoluesAvecTemps > 0) {
            tempsMoyenResolutionMinutes = totalMinutes / nbPannesResoluesAvecTemps;
        }

        // Construire réponse
        return DemandeurDashboardResponse.builder()
                .demandeurId(demandeur.getId())
                .username(demandeur.getUsername())
                .email(demandeur.getEmail())
                .totalPannes(totalPannes)
                .pannesOuvertes(pannesOuvertes)
                .pannesEnCours(pannesEnCours)
                .pannesResolues(pannesResolues)
                .pannesAnnulees(pannesAnnulees)
                .tempsMoyenResolutionMinutes(tempsMoyenResolutionMinutes)
                .dernierePanneCree(dernierePanneCree)
                .dernierePanneResolue(dernierePanneResolue)
                .build();
    }
}
