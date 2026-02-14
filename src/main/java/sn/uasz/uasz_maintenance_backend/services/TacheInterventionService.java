package sn.uasz.uasz_maintenance_backend.services;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import sn.uasz.uasz_maintenance_backend.entities.Intervention;
import sn.uasz.uasz_maintenance_backend.entities.TacheIntervention;
import sn.uasz.uasz_maintenance_backend.enums.StatutIntervention;
import sn.uasz.uasz_maintenance_backend.enums.StatutTache;
import sn.uasz.uasz_maintenance_backend.exceptions.ResourceNotFoundException;
import sn.uasz.uasz_maintenance_backend.repositories.InterventionRepository;
import sn.uasz.uasz_maintenance_backend.repositories.TacheInterventionRepository;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class TacheInterventionService {

    private final TacheInterventionRepository tacheInterventionRepository;
    private final InterventionRepository interventionRepository;

    public List<TacheIntervention> getTachesByIntervention(Long interventionId) {
        interventionRepository.findById(interventionId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Intervention non trouvée avec l'id : " + interventionId));

        return tacheInterventionRepository.findByInterventionId(interventionId);
    }

    public TacheIntervention createTache(Long interventionId, TacheIntervention tacheRequest) {
        Intervention intervention = interventionRepository.findById(interventionId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Intervention non trouvée avec l'id : " + interventionId));

        if (tacheRequest.getStatut() == null) {
            tacheRequest.setStatut(StatutTache.A_FAIRE);
        }

        tacheRequest.setId(null); // sécurité
        tacheRequest.setIntervention(intervention);

        if (tacheRequest.getStatut() == StatutTache.EN_COURS && tacheRequest.getDateDebut() == null) {
            tacheRequest.setDateDebut(LocalDateTime.now());
        }

        if (tacheRequest.getStatut() == StatutTache.TERMINEE) {
            if (tacheRequest.getDateDebut() == null) {
                tacheRequest.setDateDebut(LocalDateTime.now());
            }
            tacheRequest.setDateFin(LocalDateTime.now());
        }

        TacheIntervention saved = tacheInterventionRepository.save(tacheRequest);

        // On met à jour le statut de l'intervention au cas où
        mettreAJourStatutIntervention(intervention);

        return saved;
    }

    public TacheIntervention updateStatut(Long interventionId, Long tacheId, StatutTache nouveauStatut) {
        Intervention intervention = interventionRepository.findById(interventionId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Intervention non trouvée avec l'id : " + interventionId));

        TacheIntervention tache = tacheInterventionRepository.findById(tacheId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Tâche non trouvée avec l'id : " + tacheId));

        // Optionnel : sécuriser le lien tâche ↔ intervention du path
        if (tache.getIntervention() == null ||
                !tache.getIntervention().getId().equals(interventionId)) {
            throw new ResourceNotFoundException(
                    "La tâche " + tacheId + " n'appartient pas à l'intervention " + interventionId);
        }

        StatutTache ancienStatut = tache.getStatut();
        tache.setStatut(nouveauStatut);

        // Gestion des dates
        if (ancienStatut == StatutTache.A_FAIRE && nouveauStatut == StatutTache.EN_COURS
                && tache.getDateDebut() == null) {
            tache.setDateDebut(LocalDateTime.now());
        }

        if (nouveauStatut == StatutTache.TERMINEE) {
            if (tache.getDateDebut() == null) {
                tache.setDateDebut(LocalDateTime.now());
            }
            tache.setDateFin(LocalDateTime.now());
        }

        TacheIntervention saved = tacheInterventionRepository.save(tache);

        // ⚠️ Ici on met à jour l'intervention en fonction de toutes ses tâches
        mettreAJourStatutIntervention(intervention);

        return saved;
    }

    public void deleteTache(Long interventionId, Long tacheId) {
        Intervention intervention = interventionRepository.findById(interventionId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Intervention non trouvée avec l'id : " + interventionId));

        TacheIntervention tache = tacheInterventionRepository.findById(tacheId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Tâche non trouvée avec l'id : " + tacheId));

        tacheInterventionRepository.delete(tache);

        // Après suppression, on recalcule le statut de l'intervention
        mettreAJourStatutIntervention(intervention);
    }

    /**
     * Met à jour le statut de l'intervention à partir de ses tâches :
     * - toutes TERMINÉES  → intervention TERMINÉE
     * - au moins une EN_COURS → intervention EN_COURS
     * - sinon on laisse (PLANIFIEE, etc.)
     */
    private void mettreAJourStatutIntervention(Intervention intervention) {
        List<TacheIntervention> taches =
                tacheInterventionRepository.findByInterventionId(intervention.getId());

        if (taches == null || taches.isEmpty()) {
            // Si plus de tâches, on peut laisser l'intervention comme PLANIFIEE ou autre
            return;
        }

        boolean toutesTerminees = taches.stream()
                .allMatch(t -> t.getStatut() == StatutTache.TERMINEE);

        boolean auMoinsUneEnCours = taches.stream()
                .anyMatch(t -> t.getStatut() == StatutTache.EN_COURS);

        if (toutesTerminees) {
            intervention.setStatut(StatutIntervention.TERMINEE);
        } else if (auMoinsUneEnCours) {
            intervention.setStatut(StatutIntervention.EN_COURS);
        } else {
            // sinon on ne modifie pas (PLANIFIEE ou autre)
        }

        interventionRepository.save(intervention);
    }
}
