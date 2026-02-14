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
import sn.uasz.uasz_maintenance_backend.enums.StatutInterventions;
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


    panne.setStatutInterventions(StatutInterventions.NON_DEMARREE);
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
        if (nouveauStatut == StatutPanne.RESOLUE) {
            throw new IllegalStateException(
                    "La résolution doit passer par traiterParResponsable"
            );
        }

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

        // 1️⃣ Affectation
        panne.setTechnicien(technicien);

        // 2️⃣ Priorité responsable
        if (prioriteResponsable != null) {
            panne.setPrioriteResponsable(prioriteResponsable);
        }

        // 3️⃣ Statuts
        if (panne.getStatut() == StatutPanne.OUVERTE) {
            panne.setStatut(StatutPanne.EN_COURS);
        }

        panne.setStatutInterventions(StatutInterventions.EN_COURS);

        // 🔥 DATE DE DÉBUT
        if (panne.getDateDebutIntervention() == null) {
            panne.setDateDebutIntervention(LocalDateTime.now());
        }

        return panneRepository.save(panne);
    }


    public PanneResponse toResponse(Panne panne) {
        Utilisateur tech = panne.getTechnicien();

        return PanneResponse.builder()
                .id(panne.getId())
                .titre(panne.getTitre())
                .lieu(panne.getLieu())
                .typeEquipement(panne.getTypeEquipement())

                .statut(panne.getStatut() != null ? panne.getStatut().name() : null)
                .priorite(panne.getPriorite() != null ? panne.getPriorite().name() : null)
                .prioriteResponsable(
                        panne.getPrioriteResponsable() != null
                                ? panne.getPrioriteResponsable().name()
                                : null
                )

                .statutInterventions(panne.getStatutInterventions())

                .technicienId(tech != null ? tech.getId() : null)
                .technicienNom(
                        tech != null
                                ? (tech.getNom() != null ? tech.getNom() : tech.getUsername())
                                : null
                )
                .technicienServiceUnite(tech != null ? tech.getServiceUnite() : null)
                .imagePath(panne.getImagePath())
                .commentaireInterne(panne.getCommentaireInterne())
                .build();
    }

    @Transactional
    public PanneResponse traiterParResponsable(
            Long panneId,
            Long technicienId,
            Priorite prioriteResp,
            StatutPanne statut,
            String commentaireInterne
    ) {
        System.out.println("🔥 traiterParResponsable appelé:");
        System.out.println("  - panneId: " + panneId);
        System.out.println("  - technicienId: " + technicienId);
        System.out.println("  - prioriteResp: " + prioriteResp);
        System.out.println("  - statut: " + statut);
        System.out.println("  - commentaireInterne: " + commentaireInterne);

        Panne panne = panneRepository.findById(panneId)
                .orElseThrow(() -> new ResourceNotFoundException("Panne introuvable"));

        System.out.println("  - Panne AVANT modification:");
        System.out.println("    * statut: " + panne.getStatut());
        System.out.println("    * statutInterventions: " + panne.getStatutInterventions());
        System.out.println("    * technicien: " + (panne.getTechnicien() != null ? panne.getTechnicien().getId() : "null"));

        Utilisateur technicien = utilisateurRepository.findById(technicienId)
                .orElseThrow(() -> new ResourceNotFoundException("Technicien introuvable"));

        // 1️⃣ Affectation du technicien
        panne.setTechnicien(technicien);

        // 2️⃣ Priorité responsable (ne pas écraser si null)
        if (prioriteResp != null) {
            panne.setPrioriteResponsable(prioriteResp);
        }

        // 3️⃣ Commentaire interne (ne pas écraser si null ou vide)
        if (commentaireInterne != null && !commentaireInterne.trim().isEmpty()) {
            panne.setCommentaireInterne(commentaireInterne);
            System.out.println("  - Commentaire interne sauvegardé");
        }

        // 4️⃣ Changement du statut de la panne (pas de l'intervention)
        if (panne.getStatut() == StatutPanne.OUVERTE) {
            panne.setStatut(StatutPanne.EN_COURS);
            System.out.println("  - Statut changé de OUVERTE à EN_COURS");
        }

        // 🔥 NE PAS démarrer l'intervention automatiquement
        // Le statutInterventions reste NON_DEMARREE jusqu'à ce que le technicien prenne en charge
        System.out.println("  - StatutInterventions reste: " + panne.getStatutInterventions());

        // 5️⃣ RÉSOLUTION EXPLICITE (si le responsable résout directement)
        if (statut != null) {
            panne.setStatut(statut);
            System.out.println("  - Statut explicite défini: " + statut);

            if (statut == StatutPanne.RESOLUE) {
                panne.setStatutInterventions(StatutInterventions.TERMINEE);
                System.out.println("  - StatutInterventions changé à TERMINEE");

                // 🔥 DATE DE FIN
                panne.setDateFinIntervention(LocalDateTime.now());
                System.out.println("  - Date fin intervention définie");
            }
        }

        Panne saved = panneRepository.save(panne);
        
        System.out.println("  - Panne APRÈS sauvegarde:");
        System.out.println("    * statut: " + saved.getStatut());
        System.out.println("    * statutInterventions: " + saved.getStatutInterventions());
        System.out.println("    * technicien: " + (saved.getTechnicien() != null ? saved.getTechnicien().getId() : "null"));
        
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

        if (panne.getStatut() == StatutPanne.OUVERTE) {
            panne.setStatut(StatutPanne.EN_COURS);
        }

// 🔥 NOUVEAU : démarrage intervention
        panne.setStatutInterventions(StatutInterventions.EN_COURS);

        // 5️⃣ Sauvegarde
        Panne saved = panneRepository.save(panne);

        // 6️⃣ Mapping propre vers le DTO
        return toResponse(saved);
    }

    public boolean technicienEstOccupe(Long technicienId) {
        return panneRepository.existsByTechnicienIdAndStatutInterventions(
                technicienId,
                StatutInterventions.EN_COURS
        );
    }


    public List<Panne> getPannesEnCoursByTechnicien(Long technicienId) {
        return panneRepository.findByTechnicienIdAndStatutInterventionsOrderByDateDebutInterventionDesc(
                technicienId,
                StatutInterventions.EN_COURS
        );
    }

    public List<Panne> getPannesAffecteesAuTechnicien(Long technicienId) {
        // Retourne TOUTES les pannes du technicien (NON_DEMARREE + EN_COURS + TERMINEE)
        return panneRepository.findToutesPannesDuTechnicien(technicienId);
    }

    public List<Panne> getPannesRecentesByTechnicien(Long technicienId) {
        return panneRepository.findTop5ByTechnicienIdAndStatutInterventionsOrderByDateFinInterventionDesc(
                technicienId,
                StatutInterventions.TERMINEE
        );
    }

    public Long countEnCoursByTechnicien(Long technicienId) {
        return panneRepository.countEnCours(technicienId);
    }

    public Long countTermineesByTechnicien(Long technicienId) {
        return panneRepository.countTerminees(technicienId);
    }

    public Double getTempsMoyenHeuresByTechnicien(Long technicienId) {
        return panneRepository.tempsMoyenHeures(technicienId);
    }

    @Transactional
    public PanneResponse demarrerIntervention(Long panneId, Long technicienId) {
        Panne panne = panneRepository.findById(panneId)
                .orElseThrow(() -> new ResourceNotFoundException("Panne introuvable"));

        // Vérifier que la panne est bien affectée à ce technicien
        if (panne.getTechnicien() == null || !panne.getTechnicien().getId().equals(technicienId)) {
            throw new IllegalArgumentException("Cette panne n'est pas affectée à ce technicien");
        }

        // Vérifier que l'intervention n'est pas déjà démarrée
        if (panne.getStatutInterventions() == StatutInterventions.EN_COURS) {
            throw new IllegalArgumentException("L'intervention est déjà en cours");
        }

        // Vérifier que l'intervention n'est pas terminée
        if (panne.getStatutInterventions() == StatutInterventions.TERMINEE) {
            throw new IllegalArgumentException("L'intervention est déjà terminée");
        }

        // Démarrer l'intervention
        panne.setStatutInterventions(StatutInterventions.EN_COURS);
        panne.setDateDebutIntervention(LocalDateTime.now());

        // S'assurer que le statut de la panne est EN_COURS
        if (panne.getStatut() != StatutPanne.EN_COURS) {
            panne.setStatut(StatutPanne.EN_COURS);
        }

        Panne saved = panneRepository.save(panne);
        return toResponse(saved);
    }

    @Transactional
    public PanneResponse terminerIntervention(Long panneId, Long technicienId, sn.uasz.uasz_maintenance_backend.dtos.TerminerInterventionRequest request) {
        Panne panne = panneRepository.findById(panneId)
                .orElseThrow(() -> new ResourceNotFoundException("Panne introuvable"));

        // Vérifier que la panne est bien affectée à ce technicien
        if (panne.getTechnicien() == null || !panne.getTechnicien().getId().equals(technicienId)) {
            throw new IllegalArgumentException("Cette panne n'est pas affectée à ce technicien");
        }

        // Vérifier que l'intervention est en cours
        if (panne.getStatutInterventions() != StatutInterventions.EN_COURS) {
            throw new IllegalArgumentException("L'intervention doit être en cours pour être terminée");
        }

        // Terminer l'intervention
        panne.setStatutInterventions(StatutInterventions.TERMINEE);
        panne.setDateFinIntervention(LocalDateTime.now());
        
        // ⚠️ NE PAS changer le statut de la panne - il reste EN_COURS
        // Seul le responsable peut marquer la panne comme RESOLUE

        // Enregistrer la note du technicien
        if (request.getNoteTechnicien() != null && !request.getNoteTechnicien().trim().isEmpty()) {
            panne.setNoteTechnicien(request.getNoteTechnicien().trim());
        }

        // Enregistrer les pièces utilisées (format JSON simple)
        if (request.getPieces() != null && !request.getPieces().isEmpty()) {
            StringBuilder piecesJson = new StringBuilder("[");
            for (int i = 0; i < request.getPieces().size(); i++) {
                var piece = request.getPieces().get(i);
                if (i > 0) piecesJson.append(",");
                piecesJson.append("{\"nom\":\"").append(piece.getNom())
                          .append("\",\"quantite\":").append(piece.getQuantite())
                          .append("}");
            }
            piecesJson.append("]");
            panne.setPiecesUtilisees(piecesJson.toString());
        }

        Panne saved = panneRepository.save(panne);
        return toResponse(saved);
    }

    @Transactional
    public PanneResponse marquerPanneResolue(Long panneId, Boolean marquerResolue) {
        Panne panne = panneRepository.findById(panneId)
                .orElseThrow(() -> new ResourceNotFoundException("Panne introuvable avec l'id : " + panneId));

        // Vérifier que l'intervention est terminée
        if (panne.getStatutInterventions() != StatutInterventions.TERMINEE) {
            throw new IllegalArgumentException("L'intervention doit être terminée avant de marquer la panne comme résolue");
        }

        // Marquer comme résolue ou remettre en cours
        if (marquerResolue != null && marquerResolue) {
            panne.setStatut(StatutPanne.RESOLUE);
        } else {
            panne.setStatut(StatutPanne.EN_COURS);
        }

        Panne saved = panneRepository.save(panne);
        return toResponse(saved);
    }
}




