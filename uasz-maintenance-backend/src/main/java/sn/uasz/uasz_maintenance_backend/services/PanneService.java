package sn.uasz.uasz_maintenance_backend.services;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import sn.uasz.uasz_maintenance_backend.dtos.PanneRequest;
import sn.uasz.uasz_maintenance_backend.entities.Equipement;
import sn.uasz.uasz_maintenance_backend.entities.Panne;
import sn.uasz.uasz_maintenance_backend.entities.Utilisateur;
import sn.uasz.uasz_maintenance_backend.enums.Priorite;
import sn.uasz.uasz_maintenance_backend.enums.StatutPanne;
import sn.uasz.uasz_maintenance_backend.exceptions.ResourceNotFoundException;
import sn.uasz.uasz_maintenance_backend.repositories.EquipementRepository;
import sn.uasz.uasz_maintenance_backend.repositories.PanneRepository;
import sn.uasz.uasz_maintenance_backend.repositories.UtilisateurRepository;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class PanneService {

    private final PanneRepository panneRepository;
    private final EquipementRepository equipementRepository;
    private final UtilisateurRepository utilisateurRepository;

    public List<Panne> getAllPannes() {
        return panneRepository.findAll();
    }

    public Panne getPanneById(Long id) {
        return panneRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Panne non trouvée avec id = " + id));
    }

    public List<Panne> getPannesByEquipement(Long equipementId) {
        return panneRepository.findByEquipementId(equipementId);
    }

    public List<Panne> getPannesByStatut(StatutPanne statut) {
        return panneRepository.findByStatut(statut);
    }

    public List<Panne> getPannesByDemandeur(Long demandeurId) {
        return panneRepository.findByDemandeurId(demandeurId);
    }

    public List<Panne> getPannesByDemandeurAndStatut(Long demandeurId, StatutPanne statut) {
        return panneRepository.findByDemandeurIdAndStatut(demandeurId, statut);
    }

    // 🔹 création à partir du DTO
    public Panne createPanne(PanneRequest request) {
        Equipement equipement = equipementRepository.findById(request.getEquipementId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Equipement non trouvé avec id = " + request.getEquipementId()
                ));

        Utilisateur demandeur = null;
        if (request.getDemandeurId() != null) {
            demandeur = utilisateurRepository.findById(request.getDemandeurId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Demandeur non trouvé avec id = " + request.getDemandeurId()
                    ));
        }

        Panne panne = new Panne();
        panne.setCode(request.getCode());
        panne.setTitre(request.getTitre());
        panne.setDescription(request.getDescription());
        panne.setSignaleePar(request.getSignaleePar());
        panne.setEquipement(equipement);
        panne.setDemandeur(demandeur);

        // valeurs par défaut
        panne.setDateSignalement(LocalDateTime.now());

        if (request.getPriorite() != null) {
            panne.setPriorite(request.getPriorite());
        } else {
            panne.setPriorite(Priorite.MOYENNE);
        }

        if (request.getStatut() != null) {
            panne.setStatut(request.getStatut());
        } else {
            panne.setStatut(StatutPanne.OUVERTE);
        }

        return panneRepository.save(panne);
    }

    public Panne updatePanne(Long id, PanneRequest request) {
        Panne existing = getPanneById(id);

        if (request.getTitre() != null) existing.setTitre(request.getTitre());
        if (request.getDescription() != null) existing.setDescription(request.getDescription());
        if (request.getSignaleePar() != null) existing.setSignaleePar(request.getSignaleePar());
        if (request.getPriorite() != null) existing.setPriorite(request.getPriorite());
        if (request.getStatut() != null) existing.setStatut(request.getStatut());

        if (request.getEquipementId() != null) {
            Equipement equipement = equipementRepository.findById(request.getEquipementId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Equipement non trouvé avec id = " + request.getEquipementId()
                    ));
            existing.setEquipement(equipement);
        }

        if (request.getDemandeurId() != null) {
            Utilisateur demandeur = utilisateurRepository.findById(request.getDemandeurId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Demandeur non trouvé avec id = " + request.getDemandeurId()
                    ));
            existing.setDemandeur(demandeur);
        }

        return panneRepository.save(existing);
    }

    public void deletePanne(Long id) {
        Panne existing = getPanneById(id);
        panneRepository.delete(existing);
    }

    public Panne updateStatut(Long id, StatutPanne nouveauStatut) {
        Panne panne = panneRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Panne non trouvée avec id " + id));

        panne.setStatut(nouveauStatut);
        return panneRepository.save(panne);
    }
}
