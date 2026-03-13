package sn.uasz.uasz_maintenance_backend.services;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import sn.uasz.uasz_maintenance_backend.entities.Piece;
import sn.uasz.uasz_maintenance_backend.exceptions.ResourceNotFoundException;
import sn.uasz.uasz_maintenance_backend.repositories.PieceRepository;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class PieceService {

    private final PieceRepository pieceRepository;

    // ===================== CRUD de base =====================

    public List<Piece> getAllPieces() {
        return pieceRepository.findAll();
    }

    public List<Piece> getPiecesActives() {
        return pieceRepository.findByActifTrue();
    }

    public Piece getPieceById(Long id) {
        return pieceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Pièce non trouvée avec l'id : " + id
                ));
    }

    public Piece getPieceByCode(String code) {
        return pieceRepository.findByCode(code)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Pièce non trouvée avec le code : " + code
                ));
    }

    public Piece createPiece(Piece piece) {

        // Unicité du code
        if (pieceRepository.existsByCode(piece.getCode())) {
            throw new IllegalArgumentException(
                    "Une pièce avec le code " + piece.getCode() + " existe déjà"
            );
        }

        // Valeurs par défaut
        if (piece.getStockActuel() == null) {
            piece.setStockActuel(0);
        }
        if (piece.getStockMinimum() == null) {
            piece.setStockMinimum(0);
        }

        // Si seuilAlerte non renseigné : on le cale sur le stock minimum
        if (piece.getSeuilAlerte() == null) {
            piece.setSeuilAlerte(piece.getStockMinimum());
        }

        if (piece.getPrixUnitaire() == null) {
            piece.setPrixUnitaire(BigDecimal.ZERO);
        }
        if (piece.getActif() == null) {
            piece.setActif(true);
        }

        // Sécurité : id ignoré à la création
        piece.setId(null);

        return pieceRepository.save(piece);
    }

    public Piece updatePiece(Long id, Piece details) {
        Piece existing = getPieceById(id);

        existing.setLibelle(details.getLibelle());
        existing.setDescription(details.getDescription());
        existing.setStockActuel(details.getStockActuel());
        existing.setStockMinimum(details.getStockMinimum());
        existing.setPrixUnitaire(details.getPrixUnitaire());

        // Mise à jour du seuil d’alerte (peut être null si tu veux le désactiver)
        existing.setSeuilAlerte(details.getSeuilAlerte());

        // On ne change pas le code ici (sauf si tu décides plus tard de l’autoriser)
        if (details.getActif() != null) {
            existing.setActif(details.getActif());
        }

        return pieceRepository.save(existing);
    }

    public void deletePiece(Long id) {
        Piece existing = getPieceById(id);
        pieceRepository.delete(existing);
    }

    // ===================== Fonctions stock / rupture / activation =====================

    /**
     * Liste des pièces en rupture ou proches de la rupture.
     *
     * Règle :
     *  - si seuilAlerte est renseigné : stockActuel <= seuilAlerte
     *  - sinon : stockActuel <= stockMinimum
     */
    public List<Piece> getPiecesEnRupture() {
        return pieceRepository.findAll().stream()
                .filter(p -> p.getStockActuel() != null)
                .filter(p -> {
                    Integer seuil = p.getSeuilAlerte() != null
                            ? p.getSeuilAlerte()
                            : p.getStockMinimum();

                    return seuil != null && p.getStockActuel() <= seuil;
                })
                .toList();
    }

    /**
     * Ajuste le stock d'une pièce (delta positif ou négatif).
     * Exemple : delta = -2 => on consomme 2 unités.
     */
    public Piece ajusterStock(Long id, int delta) {
        Piece piece = getPieceById(id);

        int stockActuel = piece.getStockActuel() != null ? piece.getStockActuel() : 0;
        int nouveauStock = stockActuel + delta;

        if (nouveauStock < 0) {
            throw new IllegalArgumentException(
                    "Le stock ne peut pas devenir négatif (stock actuel : "
                            + stockActuel + ", delta : " + delta + ")"
            );
        }

        piece.setStockActuel(nouveauStock);
        return pieceRepository.save(piece);
    }

    /**
     * Active ou désactive une pièce.
     */
    public Piece changerEtatActif(Long id, boolean actif) {
        Piece piece = getPieceById(id);
        piece.setActif(actif);
        return pieceRepository.save(piece);
    }
}
