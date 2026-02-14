package sn.uasz.uasz_maintenance_backend.services;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import sn.uasz.uasz_maintenance_backend.dtos.InterventionPieceRequest;
import sn.uasz.uasz_maintenance_backend.entities.Intervention;
import sn.uasz.uasz_maintenance_backend.entities.InterventionPiece;
import sn.uasz.uasz_maintenance_backend.entities.Piece;
import sn.uasz.uasz_maintenance_backend.exceptions.ResourceNotFoundException;
import sn.uasz.uasz_maintenance_backend.repositories.InterventionPieceRepository;
import sn.uasz.uasz_maintenance_backend.repositories.InterventionRepository;
import sn.uasz.uasz_maintenance_backend.repositories.PieceRepository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class InterventionPieceService {

    private final InterventionPieceRepository interventionPieceRepository;
    private final InterventionRepository interventionRepository;
    private final PieceRepository pieceRepository;
    private final PieceService pieceService;

    /**
     * Toutes les pièces consommées pour une intervention.
     */
    @Transactional(readOnly = true)
    public List<InterventionPiece> getByIntervention(Long interventionId) {

        // Vérifier que l'intervention existe
        interventionRepository.findById(interventionId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Intervention non trouvée avec l'id : " + interventionId
                ));

        return interventionPieceRepository.findByInterventionId(interventionId);
    }

    /**
     * Ajoute une consommation de pièce à une intervention
     * et met à jour le stock (stockActuel - quantite).
     */
    public InterventionPiece addPiece(Long interventionId, InterventionPieceRequest request) {

        if (request.getPieceId() == null || request.getQuantite() == null) {
            throw new IllegalArgumentException("pieceId et quantite sont obligatoires.");
        }

        if (request.getQuantite() <= 0) {
            throw new IllegalArgumentException("La quantité doit être strictement positive.");
        }

        Intervention intervention = interventionRepository.findById(interventionId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Intervention non trouvée avec l'id : " + interventionId
                ));

        Piece piece = pieceRepository.findById(request.getPieceId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Pièce non trouvée avec l'id : " + request.getPieceId()
                ));

        int quantite = request.getQuantite();

        // Vérifier le stock
        int stockActuel = piece.getStockActuel() != null ? piece.getStockActuel() : 0;
        if (stockActuel < quantite) {
            throw new IllegalArgumentException(
                    "Stock insuffisant pour la pièce " + piece.getCode()
                            + " (stock actuel : " + stockActuel
                            + ", quantité demandée : " + quantite + ")"
            );
        }

        BigDecimal prixUnitaire = piece.getPrixUnitaire();
        if (prixUnitaire == null) {
            prixUnitaire = BigDecimal.ZERO;
        }

        BigDecimal coutTotal = prixUnitaire.multiply(BigDecimal.valueOf(quantite));

        InterventionPiece interventionPiece = InterventionPiece.builder()
                .intervention(intervention)
                .piece(piece)
                .quantite(quantite)
                .prixUnitaire(prixUnitaire)
                .coutTotal(coutTotal)
                .dateUtilisation(LocalDateTime.now())
                .build();

        // Sauvegarde de la consommation
        InterventionPiece saved = interventionPieceRepository.save(interventionPiece);

        // Mise à jour du stock (consommation)
        pieceService.ajusterStock(piece.getId(), -quantite);

        return saved;
    }

    /**
     * Met à jour la quantité consommée pour une pièce donnée
     * et ajuste le stock en conséquence.
     */
    public InterventionPiece updateQuantite(Long interventionId, Long consommationId, int nouvelleQuantite) {

        if (nouvelleQuantite <= 0) {
            throw new IllegalArgumentException("La quantité doit être strictement positive.");
        }

        // Vérifier l'existence de l'intervention
        interventionRepository.findById(interventionId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Intervention non trouvée avec l'id : " + interventionId
                ));

        InterventionPiece interventionPiece = interventionPieceRepository.findById(consommationId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Consommation de pièce non trouvée avec l'id : " + consommationId
                ));

        Piece piece = interventionPiece.getPiece();
        int ancienneQuantite = interventionPiece.getQuantite();
        int delta = nouvelleQuantite - ancienneQuantite; // peut être positif ou négatif

        if (delta > 0) {
            // On consomme plus => vérifier le stock dispo
            int stockActuel = piece.getStockActuel() != null ? piece.getStockActuel() : 0;
            if (stockActuel < delta) {
                throw new IllegalArgumentException(
                        "Stock insuffisant pour augmenter la quantité. " +
                                "(stock actuel : " + stockActuel + ", delta : " + delta + ")"
                );
            }
            pieceService.ajusterStock(piece.getId(), -delta);
        } else if (delta < 0) {
            // On consomme moins => on remet des pièces en stock
            pieceService.ajusterStock(piece.getId(), -delta); // delta négatif -> -delta positif => on ajoute au stock
        }

        interventionPiece.setQuantite(nouvelleQuantite);
        BigDecimal prixUnitaire = interventionPiece.getPrixUnitaire() != null
                ? interventionPiece.getPrixUnitaire()
                : BigDecimal.ZERO;
        interventionPiece.setCoutTotal(prixUnitaire.multiply(BigDecimal.valueOf(nouvelleQuantite)));

        return interventionPieceRepository.save(interventionPiece);
    }

    /**
     * Supprime une consommation et remet les pièces correspondantes en stock.
     */
    public void delete(Long interventionId, Long consommationId) {

        // Vérifier l'intervention
        interventionRepository.findById(interventionId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Intervention non trouvée avec l'id : " + interventionId
                ));

        InterventionPiece interventionPiece = interventionPieceRepository.findById(consommationId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Consommation de pièce non trouvée avec l'id : " + consommationId
                ));

        Piece piece = interventionPiece.getPiece();
        int quantite = interventionPiece.getQuantite() != null ? interventionPiece.getQuantite() : 0;

        // On remet la quantité en stock
        if (quantite > 0) {
            pieceService.ajusterStock(piece.getId(), quantite);
        }

        interventionPieceRepository.delete(interventionPiece);
    }
}
