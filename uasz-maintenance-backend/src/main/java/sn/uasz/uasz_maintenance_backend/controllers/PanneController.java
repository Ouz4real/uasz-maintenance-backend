package sn.uasz.uasz_maintenance_backend.controllers;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import sn.uasz.uasz_maintenance_backend.dtos.PanneRequest;
import sn.uasz.uasz_maintenance_backend.entities.Panne;
import sn.uasz.uasz_maintenance_backend.entities.Utilisateur;
import sn.uasz.uasz_maintenance_backend.enums.StatutPanne;
import sn.uasz.uasz_maintenance_backend.exceptions.ResourceNotFoundException;
import sn.uasz.uasz_maintenance_backend.services.PanneService;

import java.util.List;

@RestController
@RequestMapping("/api/pannes")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class PanneController {

    private final PanneService panneService;

    // =====================================================
    // CONSULTATION
    // =====================================================

    /**
     * Toutes les pannes.
     * Visible par TECHNICIEN, RESPONSABLE_MAINTENANCE, SUPERVISEUR.
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('TECHNICIEN','RESPONSABLE_MAINTENANCE','SUPERVISEUR')")
    public List<Panne> getAll() {
        return panneService.getAllPannes();
    }

    /**
     * Détail d'une panne.
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('TECHNICIEN','RESPONSABLE_MAINTENANCE','SUPERVISEUR','DEMANDEUR')")
    public Panne getById(@PathVariable Long id) {
        return panneService.getPanneById(id);
    }

    /**
     * Pannes d'un équipement donné.
     */
    @GetMapping("/equipement/{equipementId}")
    @PreAuthorize("hasAnyRole('TECHNICIEN','RESPONSABLE_MAINTENANCE','SUPERVISEUR')")
    public List<Panne> getByEquipement(@PathVariable Long equipementId) {
        return panneService.getPannesByEquipement(equipementId);
    }

    /**
     * Pannes filtrées par statut.
     */
    @GetMapping("/statut/{statut}")
    @PreAuthorize("hasAnyRole('TECHNICIEN','RESPONSABLE_MAINTENANCE','SUPERVISEUR')")
    public List<Panne> getByStatut(@PathVariable StatutPanne statut) {
        return panneService.getPannesByStatut(statut);
    }

    /**
     * Pannes d'un demandeur spécifique (utilisé par les dashboards, etc.).
     */
    @GetMapping("/demandeur/{demandeurId}")
    @PreAuthorize("hasAnyRole('TECHNICIEN','RESPONSABLE_MAINTENANCE','SUPERVISEUR','DEMANDEUR')")
    public List<Panne> getByDemandeur(@PathVariable Long demandeurId) {
        return panneService.getPannesByDemandeur(demandeurId);
    }

    /**
     * Pannes d'un demandeur spécifique filtrées par statut.
     */
    @GetMapping("/demandeur/{demandeurId}/statut/{statut}")
    @PreAuthorize("hasAnyRole('TECHNICIEN','RESPONSABLE_MAINTENANCE','SUPERVISEUR','DEMANDEUR')")
    public List<Panne> getByDemandeurAndStatut(
            @PathVariable Long demandeurId,
            @PathVariable StatutPanne statut
    ) {
        return panneService.getPannesByDemandeurAndStatut(demandeurId, statut);
    }

    // =====================================================
    // MES PANNES (DEMANDEUR CONNECTÉ)
    // =====================================================

    /**
     * Pannes du demandeur connecté (via le JWT).
     * GET /api/pannes/mes-pannes
     */
    @GetMapping("/mes-pannes")
    @PreAuthorize("hasRole('DEMANDEUR')")
    public List<Panne> getMesPannes(Authentication authentication) {
        Utilisateur user = (Utilisateur) authentication.getPrincipal();
        return panneService.getPannesByDemandeur(user.getId());
    }

    // =====================================================
    // CREATION / MODIFICATION / SUPPRESSION
    // =====================================================

    /**
     * Création d'une panne.
     * Accessible au DEMANDEUR, au TECHNICIEN et au RESPONSABLE_MAINTENANCE.
     */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('DEMANDEUR','TECHNICIEN','RESPONSABLE_MAINTENANCE')")
    public Panne create(@RequestBody PanneRequest request) {
        return panneService.createPanne(request);
    }

    /**
     * Mise à jour d'une panne.
     * En pratique, on peut restreindre aux rôles techniques.
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('TECHNICIEN','RESPONSABLE_MAINTENANCE')")
    public Panne update(@PathVariable Long id, @RequestBody PanneRequest request) {
        return panneService.updatePanne(id, request);
    }

    /**
     * Suppression d'une panne.
     * Réservé au responsable maintenance (par exemple).
     */
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('RESPONSABLE_MAINTENANCE')")
    public void delete(@PathVariable Long id) {
        panneService.deletePanne(id);
    }

    /**
     * Mise à jour du statut d'une panne (OUVERTE, EN_COURS, RESOLUE, ANNULEE).
     */
    @PatchMapping("/{id}/statut")
    @PreAuthorize("hasAnyRole('TECHNICIEN','RESPONSABLE_MAINTENANCE')")
    public Panne updateStatut(
            @PathVariable Long id,
            @RequestParam("statut") StatutPanne statut
    ) {
        return panneService.updateStatut(id, statut);
    }

    // =====================================================
    // GESTION DES ERREURS
    // =====================================================

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<String> handleNotFound(ResourceNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ex.getMessage());
    }
}
