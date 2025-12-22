package sn.uasz.uasz_maintenance_backend.services;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import sn.uasz.uasz_maintenance_backend.dtos.StatsGlobalesResponse;
import sn.uasz.uasz_maintenance_backend.dtos.StatsTechnicienResponse;
import sn.uasz.uasz_maintenance_backend.entities.Utilisateur;
import sn.uasz.uasz_maintenance_backend.enums.Role;
import sn.uasz.uasz_maintenance_backend.enums.StatutIntervention;
import sn.uasz.uasz_maintenance_backend.enums.StatutPanne;
import sn.uasz.uasz_maintenance_backend.exceptions.ResourceNotFoundException;
import sn.uasz.uasz_maintenance_backend.repositories.InterventionRepository;
import sn.uasz.uasz_maintenance_backend.repositories.PanneRepository;
import sn.uasz.uasz_maintenance_backend.repositories.UtilisateurRepository;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class StatsService {

    private final PanneRepository panneRepository;
    private final InterventionRepository interventionRepository;
    private final UtilisateurRepository utilisateurRepository;

    public StatsGlobalesResponse getStatsGlobales() {

        // ===== PANNES =====
        long totalPannes      = panneRepository.count();
        long pannesOuvertes   = panneRepository.countByStatut(StatutPanne.OUVERTE);
        long pannesEnCours    = panneRepository.countByStatut(StatutPanne.EN_COURS);
        long pannesResolues   = panneRepository.countByStatut(StatutPanne.RESOLUE);

        // ===== INTERVENTIONS =====
        long totalInterventions        = interventionRepository.count();
        long interPlanifiees           = interventionRepository.countByStatut(StatutIntervention.PLANIFIEE);
        long interEnCours              = interventionRepository.countByStatut(StatutIntervention.EN_COURS);
        long interTerminees            = interventionRepository.countByStatut(StatutIntervention.TERMINEE);
        long interAnnulees             = interventionRepository.countByStatut(StatutIntervention.ANNULEE);

        return StatsGlobalesResponse.builder()
                .totalPannes(totalPannes)
                .pannesOuvertes(pannesOuvertes)
                .pannesEnCours(pannesEnCours)
                .pannesResolues(pannesResolues)
                .totalInterventions(totalInterventions)
                .interventionsPlanifiees(interPlanifiees)
                .interventionsEnCours(interEnCours)
                .interventionsTerminees(interTerminees)
                .interventionsAnnulees(interAnnulees)
                .build();
    }

    /**
     * Stats pour un technicien : nombre d'interventions par statut.
     */
    public StatsTechnicienResponse getStatsPourTechnicien(Long technicienId) {

        // 1) Vérifier que l'utilisateur existe
        Utilisateur technicien = utilisateurRepository.findById(technicienId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Utilisateur non trouvé avec l'id : " + technicienId
                ));

        // 2) Vérifier qu'il a bien le rôle TECHNICIEN
        if (technicien.getRole() != Role.TECHNICIEN) {
            throw new IllegalArgumentException(
                    "L'utilisateur " + technicien.getUsername() + " n'a pas le rôle TECHNICIEN"
            );
        }

        // 3) Calculer les stats pour ce technicien
        long total = interventionRepository.countByTechnicienId(technicienId);
        long planifiees = interventionRepository
                .countByTechnicienIdAndStatut(technicienId, StatutIntervention.PLANIFIEE);
        long enCours = interventionRepository
                .countByTechnicienIdAndStatut(technicienId, StatutIntervention.EN_COURS);
        long terminees = interventionRepository
                .countByTechnicienIdAndStatut(technicienId, StatutIntervention.TERMINEE);
        long annulees = interventionRepository
                .countByTechnicienIdAndStatut(technicienId, StatutIntervention.ANNULEE);

        // 4) Construire la réponse
        return StatsTechnicienResponse.builder()
                .technicienId(technicien.getId())
                .technicienUsername(technicien.getUsername())
                .technicienEmail(technicien.getEmail())
                .totalInterventions(total)
                .interventionsPlanifiees(planifiees)
                .interventionsEnCours(enCours)
                .interventionsTerminees(terminees)
                .interventionsAnnulees(annulees)
                .build();
    }
}
