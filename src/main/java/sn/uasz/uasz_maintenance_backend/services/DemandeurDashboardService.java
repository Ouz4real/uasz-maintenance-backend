package sn.uasz.uasz_maintenance_backend.services;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import sn.uasz.uasz_maintenance_backend.dtos.DemandeurDashboardDto;
import sn.uasz.uasz_maintenance_backend.dtos.DemandeurDashboardResponse;
import sn.uasz.uasz_maintenance_backend.entities.Intervention;
import sn.uasz.uasz_maintenance_backend.entities.Panne;
import sn.uasz.uasz_maintenance_backend.entities.Utilisateur;
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

    /**
     * Méthode utilisée par le contrôleur : retourne un DemandeurDashboardResponse
     */
    public DemandeurDashboardResponse getDashboard(Long demandeurId) {
        DemandeurDashboardDto dto = getDashboardForDemandeur(demandeurId);

        // On mappe le DTO vers la réponse (même champs)
        return DemandeurDashboardResponse.builder()
                .demandeurId(dto.getDemandeurId())
                .username(dto.getUsername())
                .email(dto.getEmail())
                .totalPannes(dto.getTotalPannes())
                .pannesOuvertes(dto.getPannesOuvertes())
                .pannesEnCours(dto.getPannesEnCours())
                .pannesResolues(dto.getPannesResolues())
                .pannesAnnulees(dto.getPannesAnnulees())
                .tempsMoyenResolutionMinutes(dto.getTempsMoyenResolutionMinutes())
                .dernierePanneCree(dto.getDernierePanneCree())
                .dernierePanneResolue(dto.getDernierePanneResolue())
                .build();
    }

    /**
     * Méthode interne (logique métier) qui calcule les stats
     */
    public DemandeurDashboardDto getDashboardForDemandeur(Long demandeurId) {

        Utilisateur demandeur = utilisateurRepository.findById(demandeurId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Demandeur non trouvé avec l'id : " + demandeurId
                ));

        List<Panne> pannes = panneRepository.findByDemandeurId(demandeurId);

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


        // Dernière panne créée
        LocalDateTime dernierePanneCree = pannes.stream()
                .map(Panne::getDateSignalement)
                .filter(d -> d != null)
                .max(LocalDateTime::compareTo)
                .orElse(null);

        // Pannes résolues
        List<Panne> pannesResoluesList = pannes.stream()
                .filter(p -> p.getStatut() == StatutPanne.RESOLUE)
                .toList();

        LocalDateTime dernierePanneResolue = null;
        Long tempsMoyenResolutionMinutes = null;

        if (!pannesResoluesList.isEmpty()) {
            // Temps moyen de résolution (signalement -> dernière intervention terminée)
            OptionalDouble moyenne = pannesResoluesList.stream()
                    .mapToLong(p -> {
                        List<Intervention> interventions = interventionRepository.findByPanneId(p.getId());
                        LocalDateTime dateResolution = interventions.stream()
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
                tempsMoyenResolutionMinutes = (long) moyenne.getAsDouble();
            }

            // Dernière panne résolue = celle qui a la date de résolution la plus récente
            dernierePanneResolue = pannesResoluesList.stream()
                    .map(p -> {
                        List<Intervention> interventions = interventionRepository.findByPanneId(p.getId());
                        return interventions.stream()
                                .map(Intervention::getDateFin)
                                .filter(d -> d != null)
                                .max(LocalDateTime::compareTo)
                                .orElse(null);
                    })
                    .filter(d -> d != null)
                    .max(LocalDateTime::compareTo)
                    .orElse(null);
        }

        return DemandeurDashboardDto.builder()
                .demandeurId(demandeur.getId())
                .username(demandeur.getUsername())
                .email(demandeur.getEmail())
                .totalPannes(totalPannes)
                .pannesOuvertes(pannesOuvertes)
                .pannesEnCours(pannesEnCours)
                .pannesResolues(pannesResolues)
                .tempsMoyenResolutionMinutes(tempsMoyenResolutionMinutes)
                .dernierePanneCree(dernierePanneCree)
                .dernierePanneResolue(dernierePanneResolue)
                .build();
    }
}
