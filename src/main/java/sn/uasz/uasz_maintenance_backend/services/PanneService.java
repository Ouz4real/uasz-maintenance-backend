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
    private final NotificationService notificationService;

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
        // 8. Notification aux responsables
        // ===============================
        try {
            // Récupérer tous les responsables
            List<Utilisateur> responsables = utilisateurRepository.findByRole(Role.RESPONSABLE_MAINTENANCE);
            
            for (Utilisateur responsable : responsables) {
                String urgenceText = panne.getPriorite() != null ? 
                    " (Urgence: " + panne.getPriorite() + ")" : "";
                
                notificationService.createNotification(
                    responsable.getId(),
                    "Nouvelle demande de maintenance",
                    String.format("Une nouvelle demande \"%s\" a été créée%s", 
                        saved.getTitre(),
                        urgenceText),
                    "INFO",
                    "PANNE",
                    saved.getId()
                );
            }
            System.out.println("  - Notifications créées pour les responsables (nouvelle demande)");
        } catch (Exception e) {
            System.err.println("Erreur création notifications responsables: " + e.getMessage());
        }
        
        // ===============================
        // 9. Notification aux superviseurs (si URGENTE)
        // ===============================
        try {
            // Notifier les superviseurs uniquement si la priorité est HAUTE
            if (panne.getPriorite() == Priorite.HAUTE) {
                List<Utilisateur> superviseurs = utilisateurRepository.findByRole(Role.SUPERVISEUR);
                
                for (Utilisateur superviseur : superviseurs) {
                    notificationService.createNotification(
                        superviseur.getId(),
                        "⚠️ Demande URGENTE",
                        String.format("Nouvelle demande urgente \"%s\" nécessite une attention immédiate", 
                            saved.getTitre()),
                        "WARNING",
                        "PANNE",
                        saved.getId()
                    );
                }
                System.out.println("  - Notifications créées pour les superviseurs (demande urgente)");
            }
        } catch (Exception e) {
            System.err.println("Erreur création notifications superviseurs: " + e.getMessage());
        }

        // ===============================
        // 10. Retour
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

            // 3️⃣ Si la demande était déclinée, sauvegarder le technicien qui a décliné
            if (panne.getStatutInterventions() == StatutInterventions.DECLINEE && panne.getTechnicien() != null) {
                // Le technicienDeclinant est déjà sauvegardé lors du déclin
                // On le garde pour l'historique
            }

            // 4️⃣ Affectation du nouveau technicien
            panne.setTechnicien(technicien);

            // 5️⃣ LOGIQUE MÉTIER CLÉ 🔥
            // Si on affecte → la panne passe automatiquement EN_COURS
            panne.setStatut(StatutPanne.EN_COURS);

            // 🔥 IMPORTANT : Lors de la réaffectation, réinitialiser TOUT pour le nouveau technicien
            // Il doit voir la demande comme NOUVELLE, sans aucune info de déclin
            panne.setStatutInterventions(StatutInterventions.EN_COURS);

            // ✅ EFFACER les infos de déclin pour le nouveau technicien
            // Le technicienDeclinant reste pour l'historique (visible par le responsable)
            panne.setRaisonRefus(null);
            panne.setDateRefus(null);

            // 6️⃣ Sauvegarde
            Panne saved = panneRepository.save(panne);

            // 7️⃣ Mapping propre vers le DTO
            return toResponse(saved);
        }



    public PanneResponse toResponse(Panne panne) {
        Utilisateur tech = panne.getTechnicien();
        Utilisateur demandeur = panne.getDemandeur();
        Utilisateur techDeclinant = panne.getTechnicienDeclinant();

        // Construire l'objet DemandeurInfo si le demandeur existe
        PanneResponse.DemandeurInfo demandeurInfo = null;
        if (demandeur != null) {
            demandeurInfo = PanneResponse.DemandeurInfo.builder()
                    .id(demandeur.getId())
                    .prenom(demandeur.getPrenom())
                    .nom(demandeur.getNom())
                    .username(demandeur.getUsername())
                    .build();
        }

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
                
                // ✅ AJOUT: Informations du demandeur
                .demandeurId(demandeur != null ? demandeur.getId() : null)
                .demandeur(demandeurInfo)
                
                // ✅ AJOUT: Informations du technicien qui a décliné
                .technicienDeclinantId(techDeclinant != null ? techDeclinant.getId() : null)
                .technicienDeclinantNom(
                        techDeclinant != null
                                ? (techDeclinant.getNom() != null ? techDeclinant.getNom() : techDeclinant.getUsername())
                                : null
                )
                
                .imagePath(panne.getImagePath())
                .commentaireInterne(panne.getCommentaireInterne())
                .raisonRefus(panne.getRaisonRefus())
                .dateRefus(panne.getDateRefus() != null ? panne.getDateRefus().toString() : null)
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

        // 4️⃣ Changement du statut de la panne
        if (panne.getStatut() == StatutPanne.OUVERTE) {
            panne.setStatut(StatutPanne.EN_COURS);
            System.out.println("  - Statut changé de OUVERTE à EN_COURS");
        }

        // 🔥 Le statutInterventions reste NON_DEMARREE jusqu'à ce que le technicien accepte
        // Le technicien doit explicitement accepter l'intervention via demarrerIntervention()
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
        
        // 🔔 Créer une notification pour le technicien
        try {
            if (saved.getTechnicien() != null) {
                String prioriteText = "";
                if (saved.getPrioriteResponsable() != null) {
                    prioriteText = " (Priorité: " + saved.getPrioriteResponsable() + ")";
                }
                
                notificationService.createNotification(
                    saved.getTechnicien().getId(),
                    "Nouvelle intervention affectée",
                    String.format("La demande \"%s\" vous a été affectée%s", 
                        saved.getTitre(),
                        prioriteText),
                    "INFO",
                    "PANNE",
                    saved.getId()
                );
                System.out.println("  - Notification créée pour le technicien");
            }
        } catch (Exception e) {
            System.err.println("Erreur création notification technicien: " + e.getMessage());
        }
        
        // 🔔 Créer une notification pour les superviseurs si la demande est URGENTE (priorité HAUTE)
        try {
            if (saved.getPriorite() == Priorite.HAUTE) {
                List<Utilisateur> superviseurs = utilisateurRepository.findByRole(Role.SUPERVISEUR);
                String nomTechnicien = "";
                if (saved.getTechnicien() != null) {
                    if (saved.getTechnicien().getPrenom() != null && !saved.getTechnicien().getPrenom().isEmpty()) {
                        nomTechnicien = saved.getTechnicien().getPrenom();
                    }
                    if (saved.getTechnicien().getNom() != null && !saved.getTechnicien().getNom().isEmpty()) {
                        nomTechnicien += (nomTechnicien.isEmpty() ? "" : " ") + saved.getTechnicien().getNom();
                    }
                    if (nomTechnicien.isEmpty()) {
                        nomTechnicien = saved.getTechnicien().getUsername();
                    }
                }
                
                for (Utilisateur superviseur : superviseurs) {
                    notificationService.createNotification(
                        superviseur.getId(),
                        "Demande urgente prise en charge",
                        String.format("La demande urgente \"%s\" a été affectée à %s", 
                            saved.getTitre(),
                            nomTechnicien),
                        "INFO",
                        "PANNE",
                        saved.getId()
                    );
                }
                System.out.println("  - Notifications créées pour les superviseurs (demande urgente prise en charge)");
            }
        } catch (Exception e) {
            System.err.println("Erreur création notifications superviseurs: " + e.getMessage());
        }
        
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
        // INCLUANT les pannes qu'il a déclinées (même si réaffectées à un autre)
        return panneRepository.findToutesPannesDuTechnicienAvecDeclinees(technicienId);
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
        
        // 🔔 Créer une notification pour le demandeur
        try {
            if (saved.getDemandeur() != null && saved.getTechnicien() != null) {
                // Construire le nom du technicien
                String nomTechnicien = "";
                if (saved.getTechnicien().getPrenom() != null && !saved.getTechnicien().getPrenom().isEmpty()) {
                    nomTechnicien = saved.getTechnicien().getPrenom();
                }
                if (saved.getTechnicien().getNom() != null && !saved.getTechnicien().getNom().isEmpty()) {
                    nomTechnicien += (nomTechnicien.isEmpty() ? "" : " ") + saved.getTechnicien().getNom();
                }
                // Si pas de prénom/nom, utiliser le username
                if (nomTechnicien.isEmpty()) {
                    nomTechnicien = saved.getTechnicien().getUsername();
                }
                
                notificationService.createNotification(
                    saved.getDemandeur().getId(),
                    "Intervention en cours",
                    String.format("Votre demande \"%s\" est maintenant prise en charge par %s", 
                        saved.getTitre(),
                        nomTechnicien),
                    "INFO",
                    "PANNE",
                    saved.getId()
                );
            }
        } catch (Exception e) {
            System.err.println("Erreur création notification demandeur: " + e.getMessage());
        }
        
        // 🔔 Créer une notification pour tous les responsables
        try {
            List<Utilisateur> responsables = utilisateurRepository.findByRole(Role.RESPONSABLE_MAINTENANCE);
            String nomTechnicien = "";
            if (saved.getTechnicien().getPrenom() != null && !saved.getTechnicien().getPrenom().isEmpty()) {
                nomTechnicien = saved.getTechnicien().getPrenom();
            }
            if (saved.getTechnicien().getNom() != null && !saved.getTechnicien().getNom().isEmpty()) {
                nomTechnicien += (nomTechnicien.isEmpty() ? "" : " ") + saved.getTechnicien().getNom();
            }
            if (nomTechnicien.isEmpty()) {
                nomTechnicien = saved.getTechnicien().getUsername();
            }
            
            for (Utilisateur responsable : responsables) {
                notificationService.createNotification(
                    responsable.getId(),
                    "Intervention démarrée",
                    String.format("La demande \"%s\" a été prise en charge par %s", 
                        saved.getTitre(),
                        nomTechnicien),
                    "INFO",
                    "PANNE",
                    saved.getId()
                );
            }
            System.out.println("  - Notifications créées pour les responsables (intervention démarrée)");
        } catch (Exception e) {
            System.err.println("Erreur création notifications responsables: " + e.getMessage());
        }
        
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
        
        // 🔔 Créer une notification pour le demandeur
        try {
            if (saved.getDemandeur() != null) {
                notificationService.createNotification(
                    saved.getDemandeur().getId(),
                    "Intervention terminée",
                    String.format("L'intervention sur votre demande \"%s\" a été terminée par le technicien", 
                        saved.getTitre()),
                    "SUCCESS",
                    "PANNE",
                    saved.getId()
                );
            }
        } catch (Exception e) {
            System.err.println("Erreur création notification demandeur: " + e.getMessage());
        }
        
        // 🔔 Créer une notification pour tous les responsables
        try {
            List<Utilisateur> responsables = utilisateurRepository.findByRole(Role.RESPONSABLE_MAINTENANCE);
            String nomTechnicien = "";
            if (saved.getTechnicien() != null) {
                if (saved.getTechnicien().getPrenom() != null && !saved.getTechnicien().getPrenom().isEmpty()) {
                    nomTechnicien = saved.getTechnicien().getPrenom();
                }
                if (saved.getTechnicien().getNom() != null && !saved.getTechnicien().getNom().isEmpty()) {
                    nomTechnicien += (nomTechnicien.isEmpty() ? "" : " ") + saved.getTechnicien().getNom();
                }
                if (nomTechnicien.isEmpty()) {
                    nomTechnicien = saved.getTechnicien().getUsername();
                }
            }
            
            for (Utilisateur responsable : responsables) {
                notificationService.createNotification(
                    responsable.getId(),
                    "Intervention terminée",
                    String.format("La demande \"%s\" a été terminée par %s", 
                        saved.getTitre(),
                        nomTechnicien),
                    "SUCCESS",
                    "PANNE",
                    saved.getId()
                );
            }
            System.out.println("  - Notifications créées pour les responsables (intervention terminée)");
        } catch (Exception e) {
            System.err.println("Erreur création notifications responsables: " + e.getMessage());
        }
        
        // 🔔 Créer une notification pour tous les superviseurs
        try {
            List<Utilisateur> superviseurs = utilisateurRepository.findByRole(Role.SUPERVISEUR);
            String nomTechnicien = "";
            if (saved.getTechnicien() != null) {
                if (saved.getTechnicien().getPrenom() != null && !saved.getTechnicien().getPrenom().isEmpty()) {
                    nomTechnicien = saved.getTechnicien().getPrenom();
                }
                if (saved.getTechnicien().getNom() != null && !saved.getTechnicien().getNom().isEmpty()) {
                    nomTechnicien += (nomTechnicien.isEmpty() ? "" : " ") + saved.getTechnicien().getNom();
                }
                if (nomTechnicien.isEmpty()) {
                    nomTechnicien = saved.getTechnicien().getUsername();
                }
            }
            
            for (Utilisateur superviseur : superviseurs) {
                notificationService.createNotification(
                    superviseur.getId(),
                    "Intervention terminée",
                    String.format("L'intervention \"%s\" a été terminée par %s", 
                        saved.getTitre(),
                        nomTechnicien),
                    "SUCCESS",
                    "PANNE",
                    saved.getId()
                );
            }
            System.out.println("  - Notifications créées pour les superviseurs (intervention terminée)");
        } catch (Exception e) {
            System.err.println("Erreur création notifications superviseurs: " + e.getMessage());
        }
        
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

    /**
     * Décliner une intervention (technicien)
     */
    @Transactional
    public PanneResponse refuserIntervention(Long panneId, Long technicienId, String raisonRefus) {
        Panne panne = panneRepository.findById(panneId)
                .orElseThrow(() -> new ResourceNotFoundException("Panne introuvable"));

        if (panne.getTechnicien() == null || !panne.getTechnicien().getId().equals(technicienId)) {
            throw new IllegalArgumentException("Cette panne n'est pas affectée à ce technicien");
        }

        if (panne.getStatutInterventions() == StatutInterventions.EN_COURS) {
            throw new IllegalArgumentException("L'intervention est déjà en cours");
        }

        if (panne.getStatutInterventions() == StatutInterventions.TERMINEE) {
            throw new IllegalArgumentException("L'intervention est déjà terminée");
        }

        panne.setStatutInterventions(StatutInterventions.DECLINEE);
        panne.setRaisonRefus(raisonRefus);
        panne.setDateRefus(LocalDateTime.now());
        // 🔥 Sauvegarder le technicien qui a décliné
        panne.setTechnicienDeclinant(panne.getTechnicien());
        Panne saved = panneRepository.save(panne);
        
        // 🔔 Créer une notification pour tous les responsables de maintenance
        try {
            List<Utilisateur> responsables = utilisateurRepository.findByRole(Role.RESPONSABLE_MAINTENANCE);
            
            String nomTechnicien = "";
            if (saved.getTechnicien().getPrenom() != null && !saved.getTechnicien().getPrenom().isEmpty()) {
                nomTechnicien = saved.getTechnicien().getPrenom() + " " + saved.getTechnicien().getNom();
            } else {
                nomTechnicien = saved.getTechnicien().getUsername();
            }
            
            for (Utilisateur responsable : responsables) {
                notificationService.createNotification(
                    responsable.getId(),
                    "⚠️ Intervention déclinée par un technicien",
                    String.format("Le technicien %s a décliné l'intervention '%s' (Lieu: %s). Raison: %s. Réaffectation nécessaire.", 
                        nomTechnicien, saved.getTitre(), saved.getLieu(), raisonRefus),
                    "WARNING",
                    "PANNE",
                    saved.getId()
                );
            }
        } catch (Exception e) {
            System.err.println("Erreur lors de la création des notifications pour les responsables: " + e.getMessage());
        }
        
        return toResponse(saved);
    }
}
