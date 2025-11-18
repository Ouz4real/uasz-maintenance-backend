package sn.uasz.uasz_maintenance_backend.controllers;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import sn.uasz.uasz_maintenance_backend.dtos.InterventionPieceRequest;
import sn.uasz.uasz_maintenance_backend.entities.InterventionPiece;
import sn.uasz.uasz_maintenance_backend.exceptions.ResourceNotFoundException;
import sn.uasz.uasz_maintenance_backend.services.InterventionPieceService;

import java.util.List;

@RestController
@RequestMapping("/api/interventions/{interventionId}/pieces")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class InterventionPieceController {

    private final InterventionPieceService interventionPieceService;

    /**
     * Liste des pièces consommées pour une intervention.
     * GET /api/interventions/{interventionId}/pieces
     */
    @GetMapping
    public List<InterventionPiece> getByIntervention(@PathVariable Long interventionId) {
        return interventionPieceService.getByIntervention(interventionId);
    }

    /**
     * Ajoute une consommation de pièce.
     * POST /api/interventions/{interventionId}/pieces
     */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public InterventionPiece addPiece(
            @PathVariable Long interventionId,
            @RequestBody InterventionPieceRequest request
    ) {
        return interventionPieceService.addPiece(interventionId, request);
    }

    /**
     * Met à jour la quantité consommée.
     * PATCH /api/interventions/{interventionId}/pieces/{consommationId}/quantite?quantite=5
     */
    @PatchMapping("/{consommationId}/quantite")
    public InterventionPiece updateQuantite(
            @PathVariable Long interventionId,
            @PathVariable Long consommationId,
            @RequestParam("quantite") int quantite
    ) {
        return interventionPieceService.updateQuantite(interventionId, consommationId, quantite);
    }

    /**
     * Supprime une consommation de pièce.
     * DELETE /api/interventions/{interventionId}/pieces/{consommationId}
     */
    @DeleteMapping("/{consommationId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(
            @PathVariable Long interventionId,
            @PathVariable Long consommationId
    ) {
        interventionPieceService.delete(interventionId, consommationId);
    }

    // Si tu n'utilises que le GlobalExceptionHandler, ces handlers locaux sont optionnels.
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<String> handleNotFound(ResourceNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ex.getMessage());
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<String> handleBadRequest(IllegalArgumentException ex) {
        return ResponseEntity.badRequest().body(ex.getMessage());
    }
}
