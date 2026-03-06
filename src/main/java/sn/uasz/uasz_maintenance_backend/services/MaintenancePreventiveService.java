package sn.uasz.uasz_maintenance_backend.services;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import sn.uasz.uasz_maintenance_backend.dtos.MaintenancePreventiveRequest;
import sn.uasz.uasz_maintenance_backend.dtos.MaintenancePreventiveResponse;
import sn.uasz.uasz_maintenance_backend.dtos.RealiserMaintenanceRequest;
import sn.uasz.uasz_maintenance_backend.entities.MaintenancePreventive;
import sn.uasz.uasz_maintenance_backend.repositories.MaintenancePreventiveRepository;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MaintenancePreventiveService {

    private final MaintenancePreventiveRepository repo;

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
        MaintenancePreventive maintenance = repo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Maintenance préventive introuvable"));

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

        repo.save(nouvelleOccurrence);

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
     * Arrêter/annuler une maintenance préventive
     * Cela empêche la création de nouvelles occurrences
     */
    public MaintenancePreventiveResponse annuler(Long id) {
        MaintenancePreventive maintenance = repo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Maintenance préventive introuvable"));

        // Changer le statut à ANNULEE
        maintenance.setStatut("ANNULEE");

        // Sauvegarder
        MaintenancePreventive saved = repo.save(maintenance);

        return toResponse(saved);
    }
}
