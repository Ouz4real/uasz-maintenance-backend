package sn.uasz.uasz_maintenance_backend.services;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import sn.uasz.uasz_maintenance_backend.dtos.InterventionRequest;
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

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class InterventionService {

    private final InterventionRepository interventionRepository;
    private final PanneRepository panneRepository;
    private final UtilisateurRepository utilisateurRepository;

    // ===================== CRUD de base =====================

    public List<Intervention> getAll() {
        return interventionRepository.findAll();
    }

    public Intervention getById(Long id) {
        return interventionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Intervention non trouvée avec l'id : " + id
                ));
    }

    public List<Intervention> getByPanne(Long panneId) {
        // On vérifie d'abord que la panne existe
        panneRepository.findById(panneId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Panne non trouvée avec l'id : " + panneId
                ));

        return interventionRepository.findByPanneId(panneId);
    }

    /**
     * Toutes les interventions d'un technicien.
     * On vérifie que l'utilisateur existe et a bien le rôle TECHNICIEN.
     */
    public List<Intervention> getByTechnicien(Long technicienId) {
        Utilisateur technicien = utilisateurRepository.findById(technicienId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Utilisateur non trouvé avec l'id : " + technicienId
                ));

        if (technicien.getRole() != Role.TECHNICIEN) {
            throw new IllegalArgumentException(
                    "L'utilisateur " + technicien.getUsername() + " n'a pas le rôle TECHNICIEN"
            );
        }

        return interventionRepository.findByTechnicienId(technicienId);
    }

    /**
     * Interventions d'un technicien filtrées par statut.
     */
    public List<Intervention> getByTechnicienAndStatut(Long technicienId, StatutIntervention statut) {
        Utilisateur technicien = utilisateurRepository.findById(technicienId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Utilisateur non trouvé avec l'id : " + technicienId
                ));

        if (technicien.getRole() != Role.TECHNICIEN) {
            throw new IllegalArgumentException(
                    "L'utilisateur " + technicien.getUsername() + " n'a pas le rôle TECHNICIEN"
            );
        }

        return interventionRepository.findByTechnicienIdAndStatut(technicienId, statut);
    }

    /**
     * Interventions filtrées par statut (toutes interventions, tous techniciens confondus).
     */
    public List<Intervention> getByStatut(StatutIntervention statut) {
        return interventionRepository.findByStatut(statut);
    }

    // ===================== Création =====================

    public Intervention createIntervention(InterventionRequest request) {

        // 1) Charger la panne
        Panne panne = panneRepository.findById(request.getPanneId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Panne non trouvée avec l'id : " + request.getPanneId()
                ));

        // 2) Construire l'intervention
        Intervention intervention = new Intervention();
        intervention.setTitre(request.getTitre());
        intervention.setDescription(request.getDescription());
        intervention.setType(request.getType());
        intervention.setRealiseePar(request.getRealiseePar());
        intervention.setCout(request.getCout());
        intervention.setPanne(panne);

        // 2.bis) Valeur par défaut du statut si null
        StatutIntervention statut = request.getStatut();
        if (statut == null) {
            statut = StatutIntervention.PLANIFIEE;
        }
        intervention.setStatut(statut);

        // 3) Gestion des dates selon le statut
        if (statut == StatutIntervention.EN_COURS && intervention.getDateDebut() == null) {
            intervention.setDateDebut(LocalDateTime.now());
        }
        if (intervention.getDateDebut() == null) {
            intervention.setDateDebut(LocalDateTime.now());
        }

        if (statut == StatutIntervention.TERMINEE) {
            if (intervention.getDateDebut() == null) {
                intervention.setDateDebut(LocalDateTime.now());
            }
            intervention.setDateFin(LocalDateTime.now());
        }

        // 4) Associer le technicien si technicienId est présent
        if (request.getTechnicienId() != null) {
            Utilisateur technicien = utilisateurRepository.findById(request.getTechnicienId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Technicien non trouvé avec l'id : " + request.getTechnicienId()
                    ));

            if (technicien.getRole() != Role.TECHNICIEN) {
                throw new IllegalArgumentException(
                        "L'utilisateur " + technicien.getUsername() + " n'a pas le rôle TECHNICIEN"
                );
            }

            intervention.setTechnicien(technicien);
        }

        // 5) Sauvegarde
        return interventionRepository.save(intervention);
    }

    // ===================== Terminer une intervention =====================

    public Intervention terminerIntervention(Long id) {
        // 1) Récupérer l’intervention
        Intervention intervention = interventionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Intervention non trouvée avec l'id : " + id
                ));

        // 2) Mettre à jour le statut + dates
        intervention.setStatut(StatutIntervention.TERMINEE);

        if (intervention.getDateDebut() == null) {
            intervention.setDateDebut(LocalDateTime.now());
        }
        intervention.setDateFin(LocalDateTime.now());

        interventionRepository.save(intervention);

        // 3) Mettre à jour le statut de la panne si nécessaire
        Panne panne = intervention.getPanne();
        if (panne != null) {
            List<Intervention> interventionsDeLaPanne =
                    interventionRepository.findByPanneId(panne.getId());

            boolean toutesTerminees = interventionsDeLaPanne.stream()
                    .allMatch(i -> i.getStatut() == StatutIntervention.TERMINEE);

            if (toutesTerminees) {
                panne.setStatut(StatutPanne.RESOLUE);
            } else {
                // au moins une intervention non terminée → la panne reste / passe EN_COURS
                if (panne.getStatut() == StatutPanne.OUVERTE) {
                    panne.setStatut(StatutPanne.EN_COURS);
                }
            }

            panneRepository.save(panne);
        }

        return intervention;
    }

    // ===================== Affecter un technicien =====================

    public Intervention affecterTechnicien(Long id, Long technicienId) {

        // 1) Charger l’intervention
        Intervention intervention = interventionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Intervention non trouvée avec l'id : " + id
                ));

        // 2) Charger l’utilisateur
        Utilisateur technicien = utilisateurRepository.findById(technicienId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Technicien non trouvé avec l'id : " + technicienId
                ));

        // 3) Vérifier le rôle
        if (technicien.getRole() != Role.TECHNICIEN) {
            throw new IllegalArgumentException(
                    "L'utilisateur " + technicien.getUsername() + " n'a pas le rôle TECHNICIEN"
            );
        }

        // 4) Affecter
        intervention.setTechnicien(technicien);

        // (optionnel) si tu veux, tu peux basculer en EN_COURS ici
        /*
        if (intervention.getStatut() == StatutIntervention.PLANIFIEE) {
            intervention.setStatut(StatutIntervention.EN_COURS);
            if (intervention.getDateDebut() == null) {
                intervention.setDateDebut(LocalDateTime.now());
            }
        }
        */

        return interventionRepository.save(intervention);
    }
}
