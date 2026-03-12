package sn.uasz.uasz_maintenance_backend.controllers;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import sn.uasz.uasz_maintenance_backend.entities.Piece;
import sn.uasz.uasz_maintenance_backend.exceptions.ResourceNotFoundException;
import sn.uasz.uasz_maintenance_backend.services.PieceService;

import java.util.List;

@RestController
@RequestMapping("/api/pieces")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class PieceController {

    private final PieceService pieceService;

    // =====================================================
    // LECTURE
    // =====================================================

    /**
     * Toutes les pièces (actives ou non).
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('TECHNICIEN','RESPONSABLE_MAINTENANCE','SUPERVISEUR')")
    public List<Piece> getAll() {
        return pieceService.getAllPieces();
    }

    /**
     * Pièces actives uniquement.
     */
    @GetMapping("/actives")
    @PreAuthorize("hasAnyRole('TECHNICIEN','RESPONSABLE_MAINTENANCE','SUPERVISEUR')")
    public List<Piece> getActives() {
        return pieceService.getPiecesActives();
    }

    /**
     * Pièces en rupture ou proches de la rupture
     * (stockActuel <= stockMinimum).
     */
    @GetMapping("/rupture")
    @PreAuthorize("hasAnyRole('TECHNICIEN','RESPONSABLE_MAINTENANCE','SUPERVISEUR')")
    public List<Piece> getEnRupture() {
        return pieceService.getPiecesEnRupture();
    }

    /**
     * Détail d’une pièce par son id.
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('TECHNICIEN','RESPONSABLE_MAINTENANCE','SUPERVISEUR')")
    public Piece getById(@PathVariable Long id) {
        return pieceService.getPieceById(id);
    }

    /**
     * Détail d’une pièce par son code.
     */
    @GetMapping("/code/{code}")
    @PreAuthorize("hasAnyRole('TECHNICIEN','RESPONSABLE_MAINTENANCE','SUPERVISEUR')")
    public Piece getByCode(@PathVariable String code) {
        return pieceService.getPieceByCode(code);
    }

    // =====================================================
    // CREATION / MISE À JOUR / SUPPRESSION
    // (réservé au Responsable Maintenance + Superviseur)
    // =====================================================

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('RESPONSABLE_MAINTENANCE','SUPERVISEUR')")
    public Piece create(@RequestBody Piece piece) {
        return pieceService.createPiece(piece);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('RESPONSABLE_MAINTENANCE','SUPERVISEUR')")
    public Piece update(@PathVariable Long id, @RequestBody Piece piece) {
        return pieceService.updatePiece(id, piece);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAnyRole('RESPONSABLE_MAINTENANCE','SUPERVISEUR')")
    public void delete(@PathVariable Long id) {
        pieceService.deletePiece(id);
    }

    // =====================================================
    // STOCK & ACTIVATION
    // =====================================================

    /**
     * Ajuster le stock :
     * PATCH /api/pieces/{id}/stock?delta=-2
     */
    @PatchMapping("/{id}/stock")
    @PreAuthorize("hasAnyRole('RESPONSABLE_MAINTENANCE','SUPERVISEUR')")
    public Piece ajusterStock(
            @PathVariable Long id,
            @RequestParam("delta") int delta
    ) {
        return pieceService.ajusterStock(id, delta);
    }

    /**
     * Activer / désactiver une pièce :
     * PATCH /api/pieces/{id}/actif?actif=true/false
     */
    @PatchMapping("/{id}/actif")
    @PreAuthorize("hasAnyRole('RESPONSABLE_MAINTENANCE','SUPERVISEUR')")
    public Piece changerActif(
            @PathVariable Long id,
            @RequestParam("actif") boolean actif
    ) {
        return pieceService.changerEtatActif(id, actif);
    }

    // =====================================================
    // GESTION DES ERREURS LOCALES (facultatif,
    // tu as déjà un GlobalExceptionHandler)
    // =====================================================

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<String> handleNotFound(ResourceNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ex.getMessage());
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<String> handleBadRequest(IllegalArgumentException ex) {
        return ResponseEntity.badRequest().body(ex.getMessage());
    }
}
