package sn.uasz.uasz_maintenance_backend.services;

import lombok.RequiredArgsConstructor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import sn.uasz.uasz_maintenance_backend.dtos.PanneRequest;
import sn.uasz.uasz_maintenance_backend.dtos.PanneResponse;
import sn.uasz.uasz_maintenance_backend.entities.Equipement;
import sn.uasz.uasz_maintenance_backend.entities.Panne;
import sn.uasz.uasz_maintenance_backend.entities.Utilisateur;
import sn.uasz.uasz_maintenance_backend.enums.Priorite;
import sn.uasz.uasz_maintenance_backend.enums.Role;
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


    @Transactional
    public Panne createPanne(PanneRequest request, MultipartFile image) {

        // ===============================
        // 1. Vérifications obligatoires
        // ===============================
        if (request.getDemandeurId() == null) {
            throw new IllegalArgumentException(
                    "demandeurId est obligatoire (doit venir du JWT)."
            );
        }

        if (request.getTitre() == null || request.getTitre().isBlank()) {
            throw new IllegalArgumentException("Le titre est obligatoire.");
        }

        if (request.getLieu() == null || request.getLieu().isBlank()) {
            throw new IllegalArgumentException("Le lieu est obligatoire.");
        }

        if (request.getTypeEquipement() == null || request.getTypeEquipement().isBlank()) {
            throw new IllegalArgumentException("Le type d’équipement est obligatoire.");
        }

        // ===============================
        // 2. Chargement du demandeur
        // ===============================
        Utilisateur demandeur = utilisateurRepository.findById(request.getDemandeurId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Demandeur non trouvé avec id = " + request.getDemandeurId()
                ));

        // ===============================
        // 3. Chargement équipement (si existant)
        // ===============================
        Equipement equipement = null;
        if (request.getEquipementId() != null) {
            equipement = equipementRepository.findById(request.getEquipementId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Equipement non trouvé avec id = " + request.getEquipementId()
                    ));
        }

        // ===============================
        // 4. Création de la panne
        // ===============================
        Panne panne = new Panne();
        panne.setTitre(request.getTitre().trim());
        panne.setDescription(request.getDescription());
        panne.setLieu(request.getLieu().trim());
        panne.setTypeEquipement(request.getTypeEquipement().trim());

        panne.setDemandeur(demandeur);
        panne.setEquipement(equipement);

        // signaleePar (sécurité)
        if (request.getSignaleePar() != null && !request.getSignaleePar().isBlank()) {
            panne.setSignaleePar(request.getSignaleePar());
        } else {
            panne.setSignaleePar(demandeur.getPrenom() + " " + demandeur.getNom());
        }

        panne.setDateSignalement(LocalDateTime.now());

        // ===============================
        // 5. Priorité & statut
        // ===============================
        // 👉 si le front envoie BASSE / MOYENNE / HAUTE → utilisé
        // 👉 sinon → MOYENNE par défaut
        panne.setPriorite(
                request.getPriorite() != null
                        ? request.getPriorite()
                        : Priorite.MOYENNE
        );

        panne.setStatut(
                request.getStatut() != null
                        ? request.getStatut()
                        : StatutPanne.OUVERTE
        );

        // ===============================
        // 6. Sauvegarde initiale (pour avoir l’ID)
        // ===============================
        Panne saved = panneRepository.save(panne);

        // ===============================
        // 7. Gestion image (optionnelle)
        // ===============================
        if (image != null && !image.isEmpty()) {
            String imagePath = savePanneImage(saved.getId(), image);
            saved.setImagePath(imagePath);
            saved = panneRepository.save(saved);
        }

        // ===============================
        // 8. Retour
        // ===============================
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

    @Transactional
    public Panne affecterTechnicienEtUrgence(
            Long panneId,
            Long technicienId,
            Priorite prioriteResponsable
    ) {
        Panne panne = panneRepository.findById(panneId)
                .orElseThrow(() -> new RuntimeException("Panne introuvable"));

        Utilisateur technicien = utilisateurRepository.findById(technicienId)
                .orElseThrow(() -> new RuntimeException("Technicien introuvable"));

        panne.setTechnicien(technicien);
        panne.setPrioriteResponsable(prioriteResponsable);

        // ✅ changement automatique de statut
        if (panne.getStatut() == StatutPanne.OUVERTE) {
            panne.setStatut(StatutPanne.EN_COURS);
        }

        return panneRepository.save(panne);
    }


    public PanneResponse toResponse(Panne p) {
        Utilisateur tech = p.getTechnicien();

        return PanneResponse.builder()
                .id(p.getId())
                .titre(p.getTitre())
                .lieu(p.getLieu())
                .typeEquipement(p.getTypeEquipement())

                .statut(p.getStatut() != null ? p.getStatut().name() : null)
                .priorite(p.getPriorite() != null ? p.getPriorite().name() : null)
                .prioriteResponsable(
                        p.getPrioriteResponsable() != null
                                ? p.getPrioriteResponsable().name()
                                : null
                )

                .technicienId(tech != null ? tech.getId() : null)
                .technicienNom(
                        tech != null
                                ? (tech.getNom() != null ? tech.getNom() : tech.getUsername())
                                : null
                )
                .technicienServiceUnite(tech != null ? tech.getServiceUnite() : null)
                .imagePath(p.getImagePath())
                .build();
    }


    @Transactional
    public PanneResponse traiterParResponsable(Long panneId, Long technicienId, Priorite prioriteResp) {

        Panne panne = panneRepository.findById(panneId)
                .orElseThrow(() -> new ResourceNotFoundException("Panne introuvable: " + panneId));

        if (technicienId == null) {
            throw new IllegalArgumentException("Technicien obligatoire");
        }
        if (prioriteResp == null) {
            throw new IllegalArgumentException("Priorité responsable obligatoire");
        }

        Utilisateur tech = utilisateurRepository.findById(technicienId)
                .orElseThrow(() -> new ResourceNotFoundException("Technicien introuvable: " + technicienId));

        // Optionnel: vérifier que tech.role == TECHNICIEN
        // if (tech.getRole() != Role.TECHNICIEN) throw new IllegalArgumentException("...");

        panne.setTechnicien(tech);
        panne.setPrioriteResponsable(prioriteResp);

        // ✅ changement de statut automatique
        if (panne.getStatut() == StatutPanne.OUVERTE) {
            panne.setStatut(StatutPanne.EN_COURS);
        }

        Panne saved = panneRepository.save(panne);
        return toResponse(saved);

    }

    @Transactional
    public PanneResponse affecterTechnicien(Long id, Long idTechnicien) {

        // 1️⃣ Récupération de la panne
        Panne panne = panneRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("Panne introuvable avec id : " + id)
                );

        // 2️⃣ Récupération du technicien
        Utilisateur technicien = utilisateurRepository.findById(idTechnicien)
                .orElseThrow(() ->
                        new RuntimeException("Technicien introuvable avec id : " + idTechnicien)
                );

        // 3️⃣ Affectation
        panne.setTechnicien(technicien);

        // 4️⃣ LOGIQUE MÉTIER CLÉ 🔥
        // Si on affecte → la panne passe automatiquement EN_COURS
        panne.setStatut(StatutPanne.EN_COURS);

        // 5️⃣ Sauvegarde
        Panne saved = panneRepository.save(panne);

        // 6️⃣ Mapping propre vers le DTO
        return toResponse(saved);
    }

    public boolean technicienEstOccupe(Long technicienId) {
        return panneRepository.existsByTechnicienIdAndStatut(
                technicienId,
                StatutPanne.EN_COURS
        );
    }


    public List<Panne> getPannesEnCoursByTechnicien(Long technicienId) {
        return panneRepository.findByTechnicienIdAndStatut(
                technicienId,
                StatutPanne.EN_COURS
        );
    }


    }



