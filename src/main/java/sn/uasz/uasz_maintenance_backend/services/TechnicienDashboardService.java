package sn.uasz.uasz_maintenance_backend.services;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import sn.uasz.uasz_maintenance_backend.dtos.TechnicienDashboardDto;
import sn.uasz.uasz_maintenance_backend.dtos.TechnicienDashboardResponse;
import sn.uasz.uasz_maintenance_backend.entities.Intervention;
import sn.uasz.uasz_maintenance_backend.entities.InterventionPiece;
import sn.uasz.uasz_maintenance_backend.entities.Utilisateur;
import sn.uasz.uasz_maintenance_backend.enums.Role;
import sn.uasz.uasz_maintenance_backend.enums.StatutIntervention;
import sn.uasz.uasz_maintenance_backend.exceptions.ResourceNotFoundException;
import sn.uasz.uasz_maintenance_backend.repositories.InterventionPieceRepository;
import sn.uasz.uasz_maintenance_backend.repositories.InterventionRepository;
import sn.uasz.uasz_maintenance_backend.repositories.UtilisateurRepository;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.OptionalDouble;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TechnicienDashboardService {

    private final UtilisateurRepository utilisateurRepository;
    private final InterventionRepository interventionRepository;
    private final InterventionPieceRepository interventionPieceRepository;

    /**
     * Méthode appelée par le controller /api/techniciens/{id}/dashboard
     */
    public TechnicienDashboardResponse getDashboard(Long technicienId) {
        TechnicienDashboardDto dto = getDashboardForTechnicien(technicienId);

        return TechnicienDashboardResponse.builder()
                .technicienId(dto.getTechnicienId())
                .username(dto.getUsername())
                .email(dto.getEmail())
                .totalInterventions(dto.getTotalInterventions())
                .interventionsPlanifiees(dto.getInterventionsPlanifiees())
                .interventionsEnCours(dto.getInterventionsEnCours())
                .interventionsTerminees(dto.getInterventionsTerminees())
                .interventionsAnnulees(dto.getInterventionsAnnulees())
                .derniereInterventionDebut(dto.getDerniereInterventionDebut())
                .derniereInterventionTerminee(dto.getDerniereInterventionTerminee())
                .tempsMoyenRealisationMinutes(dto.getTempsMoyenRealisationMinutes())
                .totalPiecesConsommees(dto.getTotalPiecesConsommees())
                .coutTotalPieces(dto.getCoutTotalPieces())
                .build();
    }

    /**
     * Logique métier : statistiques d’un technicien donné.
     */
    public TechnicienDashboardDto getDashboardForTechnicien(Long technicienId) {

        Utilisateur technicien = utilisateurRepository.findById(technicienId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Technicien non trouvé avec l'id : " + technicienId
                ));

        if (technicien.getRole() != Role.TECHNICIEN) {
            throw new IllegalArgumentException(
                    "L'utilisateur " + technicien.getUsername() + " n'a pas le rôle TECHNICIEN"
            );
        }

        // ===== Interventions du technicien =====
        List<Intervention> interventions =
                interventionRepository.findByTechnicienId(technicienId);

        long totalInterventions = interventions.size();
        long interventionsPlanifiees = interventions.stream()
                .filter(i -> i.getStatut() == StatutIntervention.PLANIFIEE)
                .count();
        long interventionsEnCours = interventions.stream()
                .filter(i -> i.getStatut() == StatutIntervention.EN_COURS)
                .count();
        long interventionsTerminees = interventions.stream()
                .filter(i -> i.getStatut() == StatutIntervention.TERMINEE)
                .count();
        long interventionsAnnulees = interventions.stream()
                .filter(i -> i.getStatut() == StatutIntervention.ANNULEE)
                .count();

        LocalDateTime derniereInterventionDebut = interventions.stream()
                .map(Intervention::getDateDebut)
                .filter(d -> d != null)
                .max(LocalDateTime::compareTo)
                .orElse(null);

        LocalDateTime derniereInterventionTerminee = interventions.stream()
                .map(Intervention::getDateFin)
                .filter(d -> d != null)
                .max(LocalDateTime::compareTo)
                .orElse(null);

        Long tempsMoyenRealisationMinutes = null;
        OptionalDouble moyenne = interventions.stream()
                .filter(i -> i.getDateDebut() != null && i.getDateFin() != null)
                .mapToLong(i -> {
                    Duration d = Duration.between(i.getDateDebut(), i.getDateFin());
                    return d.toMinutes();
                })
                .filter(v -> v > 0)
                .average();

        if (moyenne.isPresent()) {
            tempsMoyenRealisationMinutes = (long) moyenne.getAsDouble();
        }

        // ===== NOUVEAU : pièces consommées par ce technicien =====
        List<InterventionPiece> piecesConsommees =
                interventionPieceRepository.findByIntervention_Technicien_Id(technicienId);

        long totalPiecesConsommees = piecesConsommees.stream()
                .mapToLong(ip -> ip.getQuantite() != null ? ip.getQuantite() : 0)
                .sum();

        BigDecimal coutTotalPieces = piecesConsommees.stream()
                .map(ip -> {
                    int qte = ip.getQuantite() != null ? ip.getQuantite() : 0;

                    // On prend en priorité le prixUnitaire saisi sur l’intervention,
                    // sinon le prix de la pièce elle-même, sinon 0.
                    BigDecimal prix = BigDecimal.ZERO;
                    if (ip.getPrixUnitaire() != null) {
                        prix = ip.getPrixUnitaire();
                    } else if (ip.getPiece() != null && ip.getPiece().getPrixUnitaire() != null) {
                        prix = ip.getPiece().getPrixUnitaire();
                    }

                    return prix.multiply(BigDecimal.valueOf(qte));
                })
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return TechnicienDashboardDto.builder()
                .technicienId(technicien.getId())
                .username(technicien.getUsername())
                .email(technicien.getEmail())
                .totalInterventions(totalInterventions)
                .interventionsPlanifiees(interventionsPlanifiees)
                .interventionsEnCours(interventionsEnCours)
                .interventionsTerminees(interventionsTerminees)
                .interventionsAnnulees(interventionsAnnulees)
                .derniereInterventionDebut(derniereInterventionDebut)
                .derniereInterventionTerminee(derniereInterventionTerminee)
                .tempsMoyenRealisationMinutes(tempsMoyenRealisationMinutes)
                .totalPiecesConsommees(totalPiecesConsommees)
                .coutTotalPieces(coutTotalPieces)
                .build();
    }
}
