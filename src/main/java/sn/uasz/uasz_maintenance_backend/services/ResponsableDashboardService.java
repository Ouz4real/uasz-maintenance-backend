package sn.uasz.uasz_maintenance_backend.services;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import sn.uasz.uasz_maintenance_backend.dtos.ResponsableDashboardDto;
import sn.uasz.uasz_maintenance_backend.dtos.ResponsableDashboardResponse;
import sn.uasz.uasz_maintenance_backend.entities.Intervention;
import sn.uasz.uasz_maintenance_backend.entities.Panne;
import sn.uasz.uasz_maintenance_backend.entities.Piece;
import sn.uasz.uasz_maintenance_backend.entities.Utilisateur;
import sn.uasz.uasz_maintenance_backend.enums.Priorite;
import sn.uasz.uasz_maintenance_backend.enums.Role;
import sn.uasz.uasz_maintenance_backend.enums.StatutIntervention;
import sn.uasz.uasz_maintenance_backend.enums.StatutPanne;
import sn.uasz.uasz_maintenance_backend.exceptions.ResourceNotFoundException;
import sn.uasz.uasz_maintenance_backend.repositories.InterventionRepository;
import sn.uasz.uasz_maintenance_backend.repositories.PanneRepository;
import sn.uasz.uasz_maintenance_backend.repositories.PieceRepository;
import sn.uasz.uasz_maintenance_backend.repositories.UtilisateurRepository;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ResponsableDashboardService {

    private final UtilisateurRepository utilisateurRepository;
    private final PanneRepository panneRepository;
    private final InterventionRepository interventionRepository;
    private final PieceRepository pieceRepository;

    /**
     * Méthode appelée par le controller /api/responsables/{id}/dashboard
     */
    public ResponsableDashboardResponse getDashboard(Long responsableId) {
        ResponsableDashboardDto dto = getDashboardForResponsable(responsableId);

        return ResponsableDashboardResponse.builder()
                .responsableId(dto.getResponsableId())
                .username(dto.getUsername())
                .email(dto.getEmail())
                .totalPannes(dto.getTotalPannes())
                .pannesOuvertes(dto.getPannesOuvertes())
                .pannesEnCours(dto.getPannesEnCours())
                .pannesResolues(dto.getPannesResolues())
                .pannesAnnulees(dto.getPannesAnnulees())
                .pannesSansIntervention(dto.getPannesSansIntervention())
                .pannesOuvertesHautePriorite(dto.getPannesOuvertesHautePriorite())
                .totalInterventions(dto.getTotalInterventions())
                .interventionsPlanifiees(dto.getInterventionsPlanifiees())
                .interventionsEnCours(dto.getInterventionsEnCours())
                .interventionsTerminees(dto.getInterventionsTerminees())
                .interventionsAnnulees(dto.getInterventionsAnnulees())
                .interventionsSansTechnicien(dto.getInterventionsSansTechnicien())
                .totalPieces(dto.getTotalPieces())
                .piecesActives(dto.getPiecesActives())
                .piecesEnRupture(dto.getPiecesEnRupture())
                .valeurTotaleStock(dto.getValeurTotaleStock())
                .build();
    }

    /**
     * Logique métier : vue Responsable Maintenance.
     */
    public ResponsableDashboardDto getDashboardForResponsable(Long responsableId) {

        Utilisateur responsable = utilisateurRepository.findById(responsableId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Responsable maintenance non trouvé avec l'id : " + responsableId
                ));

        if (responsable.getRole() != Role.RESPONSABLE_MAINTENANCE) {
            throw new IllegalArgumentException(
                    "L'utilisateur " + responsable.getUsername()
                            + " n'a pas le rôle RESPONSABLE_MAINTENANCE"
            );
        }

        // ===== PANNES =====
        List<Panne> pannes = panneRepository.findAll();

        long totalPannes = pannes.size();
        long pannesOuvertes = pannes.stream().filter(p -> p.getStatut() == StatutPanne.OUVERTE).count();
        long pannesEnCours = pannes.stream().filter(p -> p.getStatut() == StatutPanne.EN_COURS).count();
        long pannesResolues = pannes.stream().filter(p -> p.getStatut() == StatutPanne.RESOLUE).count();
        long pannesAnnulees = pannes.stream().filter(p -> p.getStatut() == StatutPanne.ANNULEE).count();

        // Pannes sans intervention
        long pannesSansIntervention = pannes.stream()
                .filter(p -> interventionRepository.findByPanneId(p.getId()).isEmpty())
                .count();

        // Pannes ouvertes de priorité haute
        long pannesOuvertesHautePriorite = pannes.stream()
                .filter(p -> p.getStatut() == StatutPanne.OUVERTE)
                .filter(p -> p.getPriorite() == Priorite.HAUTE)
                .count();

        // ===== INTERVENTIONS =====
        List<Intervention> interventions = interventionRepository.findAll();

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

        // Interventions sans technicien
        long interventionsSansTechnicien = interventions.stream()
                .filter(i -> i.getTechnicien() == null)
                .count();

        // ===== PIECES / STOCK =====
        List<Piece> pieces = pieceRepository.findAll();

        long totalPieces = pieces.size();
        long piecesActives = pieces.stream()
                .filter(p -> Boolean.TRUE.equals(p.getActif()))
                .count();

        // pièces en rupture ou sous le stock minimum
        long piecesEnRupture = pieces.stream()
                .filter(p -> p.getStockActuel() != null && p.getStockMinimum() != null)
                .filter(p -> p.getStockActuel() <= p.getStockMinimum())
                .count();

        // Valeur totale du stock = Σ (stockActuel × prixUnitaire)
        BigDecimal valeurTotaleStock = pieces.stream()
                .map(p -> {
                    int stock = p.getStockActuel() != null ? p.getStockActuel() : 0;
                    BigDecimal prix = p.getPrixUnitaire() != null ? p.getPrixUnitaire() : BigDecimal.ZERO;
                    return prix.multiply(BigDecimal.valueOf(stock));
                })
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return ResponsableDashboardDto.builder()
                .responsableId(responsable.getId())
                .username(responsable.getUsername())
                .email(responsable.getEmail())
                .totalPannes(totalPannes)
                .pannesOuvertes(pannesOuvertes)
                .pannesEnCours(pannesEnCours)
                .pannesResolues(pannesResolues)
                .pannesAnnulees(pannesAnnulees)
                .pannesSansIntervention(pannesSansIntervention)
                .pannesOuvertesHautePriorite(pannesOuvertesHautePriorite)
                .totalInterventions(totalInterventions)
                .interventionsPlanifiees(interventionsPlanifiees)
                .interventionsEnCours(interventionsEnCours)
                .interventionsTerminees(interventionsTerminees)
                .interventionsAnnulees(interventionsAnnulees)
                .interventionsSansTechnicien(interventionsSansTechnicien)
                .totalPieces(totalPieces)
                .piecesActives(piecesActives)
                .piecesEnRupture(piecesEnRupture)
                .valeurTotaleStock(valeurTotaleStock)
                .build();
    }
}
