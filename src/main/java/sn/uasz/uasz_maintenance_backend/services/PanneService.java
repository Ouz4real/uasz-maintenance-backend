package sn.uasz.uasz_maintenance_backend.services;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
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

import java.io.IOException;
import java.nio.file.*;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

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
    public Panne updatePrioriteResponsable(Long id, Priorite priorite) {
        Panne panne = getPanneById(id);
        panne.setPrioriteResponsable(priorite);
        return panneRepository.save(panne);
    }


    // ✅ CREATE avec image
    public Panne createPanne(PanneRequest request, MultipartFile image) {

        // ✅ Demandeur obligatoire
        if (request.getDemandeurId() == null) {
            throw new IllegalArgumentException("demandeurId est obligatoire (doit venir du JWT).");
        }

        Utilisateur demandeur = utilisateurRepository.findById(request.getDemandeurId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Demandeur non trouvé avec id = " + request.getDemandeurId()
                ));

        Equipement equipement = null;
        if (request.getEquipementId() != null) {
            equipement = equipementRepository.findById(request.getEquipementId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Equipement non trouvé avec id = " + request.getEquipementId()
                    ));
        }

        Panne panne = new Panne();
        panne.setTitre(request.getTitre());
        panne.setDescription(request.getDescription());
        panne.setSignaleePar(request.getSignaleePar());
        panne.setEquipement(equipement);
        panne.setDemandeur(demandeur);

        panne.setTypeEquipement(request.getTypeEquipement());
        panne.setLieu(request.getLieu());

        panne.setDateSignalement(LocalDateTime.now());
        panne.setPriorite(request.getPriorite() != null ? request.getPriorite() : Priorite.MOYENNE);
        panne.setStatut(request.getStatut() != null ? request.getStatut() : StatutPanne.OUVERTE);

        // 1) on sauvegarde une première fois pour avoir l’ID
        Panne saved = panneRepository.save(panne);

        // 2) si image => on enregistre le fichier et on met imagePath
        if (image != null && !image.isEmpty()) {
            String imagePath = savePanneImage(saved.getId(), image);
            saved.setImagePath(imagePath);
            saved = panneRepository.save(saved);
        }

        return saved;
    }

    public Panne updatePanne(Long id, PanneRequest request) {
        Panne existing = getPanneById(id);

        if (request.getTitre() != null) existing.setTitre(request.getTitre());
        if (request.getDescription() != null) existing.setDescription(request.getDescription());
        if (request.getSignaleePar() != null) existing.setSignaleePar(request.getSignaleePar());
        if (request.getPriorite() != null) existing.setPriorite(request.getPriorite());
        if (request.getStatut() != null) existing.setStatut(request.getStatut());

        if (request.getTypeEquipement() != null) existing.setTypeEquipement(request.getTypeEquipement());
        if (request.getLieu() != null) existing.setLieu(request.getLieu());

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
        Panne panne = getPanneById(id);
        panne.setStatut(nouveauStatut);
        return panneRepository.save(panne);
    }

    // ======== util image ========
    private String savePanneImage(Long panneId, MultipartFile file) {
        try {
            String original = file.getOriginalFilename() != null ? file.getOriginalFilename() : "image";
            String ext = "";

            int dot = original.lastIndexOf('.');
            if (dot >= 0) ext = original.substring(dot);

            String filename = "panne-" + panneId + "-" + UUID.randomUUID() + ext;

            Path dir = Paths.get("uploads", "pannes").toAbsolutePath().normalize();
            Files.createDirectories(dir);

            Path target = dir.resolve(filename);
            Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);

            // ✅ chemin PUBLIC (servi par /uploads/**)
            return "/uploads/pannes/" + filename;

        } catch (IOException e) {
            throw new RuntimeException("Erreur enregistrement image panne", e);
        }
    }
}
