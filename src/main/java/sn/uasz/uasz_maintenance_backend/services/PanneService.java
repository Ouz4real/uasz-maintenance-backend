package sn.uasz.uasz_maintenance_backend.services;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import sn.uasz.uasz_maintenance_backend.entities.Equipement;
import sn.uasz.uasz_maintenance_backend.entities.Panne;
import sn.uasz.uasz_maintenance_backend.enums.Priorite;
import sn.uasz.uasz_maintenance_backend.enums.StatutPanne;
import sn.uasz.uasz_maintenance_backend.exceptions.ResourceNotFoundException;
import sn.uasz.uasz_maintenance_backend.repositories.EquipementRepository;
import sn.uasz.uasz_maintenance_backend.repositories.PanneRepository;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class PanneService {

    private final PanneRepository panneRepository;
    private final EquipementRepository equipementRepository;

    public List<Panne> getAllPannes() {
        return panneRepository.findAll();
    }

    public Panne getPanneById(Long id) {
        return panneRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Panne non trouvée avec id = " + id));
    }

    public Panne createPanne(Panne panne, Long equipementId) {
        Equipement equipement = equipementRepository.findById(equipementId)
                .orElseThrow(() -> new ResourceNotFoundException("Equipement non trouvé avec id = " + equipementId));

        // valeurs par défaut si non fournies
        if (panne.getDateSignalement() == null) {
            panne.setDateSignalement(LocalDateTime.now());
        }
        if (panne.getPriorite() == null) {
            panne.setPriorite(Priorite.MOYENNE);
        }
        if (panne.getStatut() == null) {
            panne.setStatut(StatutPanne.OUVERTE);
        }

        panne.setEquipement(equipement);
        return panneRepository.save(panne);
    }

    public Panne updatePanne(Long id, Panne panneDetails) {
        Panne existing = getPanneById(id);

        existing.setTitre(panneDetails.getTitre());
        existing.setDescription(panneDetails.getDescription());
        existing.setPriorite(panneDetails.getPriorite());
        existing.setStatut(panneDetails.getStatut());
        existing.setSignaleePar(panneDetails.getSignaleePar());

        // On ne change pas l’équipement ici pour le moment (on pourra ajouter une méthode spécifique si besoin)

        return panneRepository.save(existing);
    }

    public void deletePanne(Long id) {
        Panne existing = getPanneById(id);
        panneRepository.delete(existing);
    }
    public List<Panne> getPannesByEquipement(Long equipementId) {
        return panneRepository.findByEquipementId(equipementId);
    }
    public Panne updateStatut(Long id, StatutPanne nouveauStatut) {
        Panne panne = panneRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Panne non trouvée avec id " + id));

        panne.setStatut(nouveauStatut);
        return panneRepository.save(panne);
    }
}
