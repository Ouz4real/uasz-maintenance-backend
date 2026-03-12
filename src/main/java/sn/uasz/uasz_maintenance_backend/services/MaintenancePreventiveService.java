package sn.uasz.uasz_maintenance_backend.services;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import sn.uasz.uasz_maintenance_backend.dtos.MaintenancePreventiveRequest;
import sn.uasz.uasz_maintenance_backend.dtos.MaintenancePreventiveResponse;
import sn.uasz.uasz_maintenance_backend.dtos.RealiserMaintenanceRequest;
import sn.uasz.uasz_maintenance_backend.entities.MaintenancePreventive;
import sn.uasz.uasz_maintenance_backend.entities.Utilisateur;
import sn.uasz.uasz_maintenance_backend.enums.Role;
import sn.uasz.uasz_maintenance_backend.repositories.MaintenancePreventiveRepository;
import sn.uasz.uasz_maintenance_backend.repositories.UtilisateurRepository;
import sn.uasz.uasz_maintenance_backend.services.impl.NotificationServiceImpl;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MaintenancePreventiveService {

    private final MaintenancePreventiveRepository repo;
    private final NotificationServiceImpl notificationService;
    private final UtilisateurRepository utilisateurRepository;

    public MaintenancePreventiveResponse create(MaintenancePreventiveRequest req) {
        MaintenancePreventive saved = repo.save(MaintenancePreventive.builder()
                .equipementReference(req.getEquipementReference())
                .technicienId(req.getTechnicienId())
                .frequence(req.getFrequence())
                .prochaineDate(req.getProchaineDate())
                .responsable(req.getResponsable())
                .statut(req.getStatut())
                .description(req.getDescription())
                .build());

        // Créer une notification pour le technicien
        try {
            if (saved.getTechnicienId() != null) {
                String frequenceText = saved.getFrequence() != null ? saved.getFrequence().toLowerCase() : "régulière";
                String equipementText = saved.getEquipementReference() != null ? 
                    saved.getEquipementReference() : "un équipement";
                
                notificationService.createNotification(
                    saved.getTechnicienId(),
                    "Nouvelle maintenance préventive assignée",
                    String.format("Une maintenance %s vous a été assignée pour %s", 
                        frequenceText, 
                        equipementText),
                    "INFO",
                    "MAINTENANCE_PREVENTIVE",
                    saved.getId()
                );
                System.out.println("  - Notification créée pour le technicien (maintenance préventive)");
            }
        } catch (Exception e) {
            System.err.println("Erreur création notification maintenance préventive: " + e.getMessage());
        }

        return toResponse(saved);
    }

    public List<MaintenancePreventiveResponse> getAll() {
        return repo.findAll().stream().map(this::toResponse).toList();
    }

    private MaintenancePreventiveResponse toResponse(MaintenancePreventive m) {
        return MaintenancePreventiveResponse.builder()
                .id(m.getId())
                .equipementReference(m.getEquipementReference())
                .technicienId(m.getTechnicienId())
                .frequence(m.getFrequence())
                .prochaineDate(m.getProchaineDate())
                .responsable(m.getResponsable())
                .statut(m.getStatut())
                .description(m.getDescription())
                .dateRealisee(m.getDateRealisee())
                .rapport(m.getRapport())
                .piecesUtilisees(m.getPiecesUtilisees())
                .photoUrl(m.getPhotoUrl())
                .typeEquipement(m.getTypeEquipement())
                .build();
    }

    /**
     * Marquer une maintenance comme réalisée et calculer automatiquement la prochaine date
     */
    public MaintenancePreventiveResponse realiser(Long id, RealiserMaintenanceRequest req) {
        System.out.println("🔥 realiser appelé - maintenanceId: " + id);
        
        MaintenancePreventive maintenance = repo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Maintenance préventive introuvable"));

        System.out.println("  - Maintenance trouvée: " + maintenance.getId());
        System.out.println("  - Statut actuel: " + maintenance.getStatut());

        // Enregistrer les informations de réalisation
        maintenance.setDateRealisee(req.getDateRealisee() != null ? req.getDateRealisee() : LocalDate.now());
        maintenance.setRapport(req.getRapport());
        maintenance.setPiecesUtilisees(req.getPiecesUtilisees());
        maintenance.setPhotoUrl(req.getPhotoUrl());
        maintenance.setStatut("REALISEE");

        // Calculer automatiquement la prochaine date selon la fréquence
        LocalDate nouvelleProchaineDate = calculerProchaineDateSelonFrequence(
                maintenance.getProchaineDate(),
                maintenance.getFrequence()
        );
        maintenance.setProchaineDate(nouvelleProchaineDate);

        // Sauvegarder
        MaintenancePreventive saved = repo.save(maintenance);
        System.out.println("  - Maintenance sauvegardée avec statut: " + saved.getStatut());

        // ✅ NOUVEAU: Créer une notification pour tous les responsables maintenance
        try {
            List<Utilisateur> responsables = utilisateurRepository.findByRole(Role.RESPONSABLE_MAINTENANCE);
            System.out.println("  - Nombre de responsables trouvés: " + responsables.size());
            
            String equipementText = saved.getEquipementReference() != null ? 
                saved.getEquipementReference() : "un équipement";
            
            for (Utilisateur responsable : responsables) {
                notificationService.createNotification(
                    responsable.getId(),
                    "Maintenance préventive réalisée",
                    String.format("La maintenance préventive pour %s a été marquée comme réalisée par le technicien", 
                        equipementText),
                    "SUCCESS",
                    "MAINTENANCE_PREVENTIVE",
                    saved.getId()
                );
                System.out.println("  - Notification créée pour responsable ID: " + responsable.getId());
            }
            System.out.println("✅ Notifications créées pour les responsables (maintenance réalisée)");
        } catch (Exception e) {
            System.err.println("❌ Erreur création notifications responsables: " + e.getMessage());
            e.printStackTrace();
        }

        // Créer une nouvelle occurrence pour la prochaine maintenance
        MaintenancePreventive nouvelleOccurrence = MaintenancePreventive.builder()
                .equipementReference(saved.getEquipementReference())
                .technicienId(saved.getTechnicienId())
                .frequence(saved.getFrequence())
                .prochaineDate(nouvelleProchaineDate)
                .responsable(saved.getResponsable())
                .statut("PLANIFIEE")
                .description(saved.getDescription())
                .typeEquipement(saved.getTypeEquipement())
                .build();

        MaintenancePreventive nouvelleOccurrenceSaved = repo.save(nouvelleOccurrence);

        // Créer une notification pour le technicien pour la nouvelle occurrence
        try {
            if (nouvelleOccurrenceSaved.getTechnicienId() != null) {
                String frequenceText = nouvelleOccurrenceSaved.getFrequence() != null ? 
                    nouvelleOccurrenceSaved.getFrequence().toLowerCase() : "régulière";
                String equipementText = nouvelleOccurrenceSaved.getEquipementReference() != null ? 
                    nouvelleOccurrenceSaved.getEquipementReference() : "un équipement";
                
                notificationService.createNotification(
                    nouvelleOccurrenceSaved.getTechnicienId(),
                    "Nouvelle maintenance préventive planifiée",
                    String.format("Une maintenance %s est planifiée pour %s (Date: %s)", 
                        frequenceText, 
                        equipementText,
                        nouvelleProchaineDate),
                    "INFO",
                    "MAINTENANCE_PREVENTIVE",
                    nouvelleOccurrenceSaved.getId()
                );
                System.out.println("  - Notification créée pour la nouvelle occurrence de maintenance");
            }
        } catch (Exception e) {
            System.err.println("Erreur création notification nouvelle occurrence: " + e.getMessage());
        }

        return toResponse(saved);
    }

    /**
     * Calculer la prochaine date selon la fréquence
     */
    private LocalDate calculerProchaineDateSelonFrequence(LocalDate dateActuelle, String frequence) {
        return switch (frequence.toUpperCase()) {
            case "MENSUELLE" -> dateActuelle.plusMonths(1);
            case "BIMENSUELLE" -> dateActuelle.plusMonths(2);
            case "TRIMESTRIELLE" -> dateActuelle.plusMonths(3);
            case "SEMESTRIELLE" -> dateActuelle.plusMonths(6);
            case "ANNUELLE" -> dateActuelle.plusYears(1);
            default -> dateActuelle.plusMonths(1); // Par défaut mensuelle
        };
    }

    /**
     * Prendre en charge une maintenance préventive (technicien)
     * Change le statut de PLANIFIEE à EN_COURS et notifie le responsable
     */
    public MaintenancePreventiveResponse prendreEnCharge(Long id, Long technicienId) {
        System.out.println("🔥 prendreEnCharge appelé - maintenanceId: " + id + ", technicienId: " + technicienId);
        
        MaintenancePreventive maintenance = repo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Maintenance préventive introuvable"));

        System.out.println("  - Maintenance trouvée: " + maintenance.getId());
        System.out.println("  - Statut actuel: " + maintenance.getStatut());
        System.out.println("  - Technicien affecté: " + maintenance.getTechnicienId());

        // Vérifier que la maintenance est bien affectée à ce technicien
        if (maintenance.getTechnicienId() == null || !maintenance.getTechnicienId().equals(technicienId)) {
            throw new IllegalArgumentException("Cette maintenance n'est pas affectée à ce technicien");
        }

        // Vérifier que la maintenance est en statut PLANIFIEE
        if (!"PLANIFIEE".equals(maintenance.getStatut())) {
            throw new IllegalArgumentException("Cette maintenance ne peut pas être prise en charge (statut: " + maintenance.getStatut() + ")");
        }

        // Changer le statut à EN_COURS
        maintenance.setStatut("EN_COURS");

        // Sauvegarder
        MaintenancePreventive saved = repo.save(maintenance);
        System.out.println("  - Maintenance sauvegardée avec statut: " + saved.getStatut());

        // Créer une notification pour tous les responsables maintenance
        try {
            List<Utilisateur> responsables = utilisateurRepository.findByRole(Role.RESPONSABLE_MAINTENANCE);
            System.out.println("  - Nombre de responsables trouvés: " + responsables.size());
            
            String equipementText = saved.getEquipementReference() != null ? 
                saved.getEquipementReference() : "un équipement";
            
            for (Utilisateur responsable : responsables) {
                notificationService.createNotification(
                    responsable.getId(),
                    "Maintenance préventive prise en charge",
                    String.format("La maintenance préventive pour %s a été prise en charge par le technicien", 
                        equipementText),
                    "INFO",
                    "MAINTENANCE_PREVENTIVE",
                    saved.getId()
                );
                System.out.println("  - Notification créée pour responsable ID: " + responsable.getId());
            }
            System.out.println("✅ Notifications créées pour les responsables (maintenance prise en charge)");
        } catch (Exception e) {
            System.err.println("❌ Erreur création notifications responsables: " + e.getMessage());
            e.printStackTrace();
        }

        return toResponse(saved);
    }

    /**
     * Arrêter/annuler une maintenance préventive
     * Notifie le technicien affecté
     */
    public MaintenancePreventiveResponse annuler(Long id) {
        System.out.println("🔥 annuler appelé - maintenanceId: " + id);
        
        MaintenancePreventive maintenance = repo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Maintenance préventive introuvable"));

        System.out.println("  - Maintenance trouvée: " + maintenance.getId());
        System.out.println("  - Statut actuel: " + maintenance.getStatut());
        System.out.println("  - Technicien affecté: " + maintenance.getTechnicienId());

        // Changer le statut à ANNULEE
        maintenance.setStatut("ANNULEE");

        // Sauvegarder
        MaintenancePreventive saved = repo.save(maintenance);
        System.out.println("  - Maintenance sauvegardée avec statut: " + saved.getStatut());

        // Créer une notification pour le technicien affecté
        try {
            if (saved.getTechnicienId() != null) {
                String equipementText = saved.getEquipementReference() != null ? 
                    saved.getEquipementReference() : "un équipement";
                
                notificationService.createNotification(
                    saved.getTechnicienId(),
                    "Maintenance préventive annulée",
                    String.format("La maintenance préventive pour %s a été annulée", 
                        equipementText),
                    "WARNING",
                    "MAINTENANCE_PREVENTIVE",
                    saved.getId()
                );
                System.out.println("✅ Notification créée pour le technicien ID: " + saved.getTechnicienId());
            } else {
                System.out.println("⚠️ Aucun technicien affecté, pas de notification envoyée");
            }
        } catch (Exception e) {
            System.err.println("❌ Erreur création notification technicien: " + e.getMessage());
            e.printStackTrace();
        }

        return toResponse(saved);
    }
}
