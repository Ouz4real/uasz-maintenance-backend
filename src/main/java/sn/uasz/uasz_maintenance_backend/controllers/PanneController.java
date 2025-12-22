package sn.uasz.uasz_maintenance_backend.controllers;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import sn.uasz.uasz_maintenance_backend.dtos.PanneRequest;
import sn.uasz.uasz_maintenance_backend.entities.Panne;
import sn.uasz.uasz_maintenance_backend.entities.Utilisateur;
import sn.uasz.uasz_maintenance_backend.enums.Priorite;
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

    @GetMapping
    @PreAuthorize("hasAnyRole('TECHNICIEN','RESPONSABLE_MAINTENANCE','SUPERVISEUR')")
    public List<Panne> getAll() {
        return panneService.getAllPannes();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('TECHNICIEN','RESPONSABLE_MAINTENANCE','SUPERVISEUR','DEMANDEUR')")
    public Panne getById(@PathVariable Long id) {
        return panneService.getPanneById(id);
    }

    @GetMapping("/equipement/{equipementId}")
    @PreAuthorize("hasAnyRole('TECHNICIEN','RESPONSABLE_MAINTENANCE','SUPERVISEUR')")
    public List<Panne> getByEquipement(@PathVariable Long equipementId) {
        return panneService.getPannesByEquipement(equipementId);
    }

    @GetMapping("/statut/{statut}")
    @PreAuthorize("hasAnyRole('TECHNICIEN','RESPONSABLE_MAINTENANCE','SUPERVISEUR')")
    public List<Panne> getByStatut(@PathVariable StatutPanne statut) {
        return panneService.getPannesByStatut(statut);
    }

    @GetMapping("/demandeur/{demandeurId}")
    @PreAuthorize("hasAnyRole('TECHNICIEN','RESPONSABLE_MAINTENANCE','SUPERVISEUR','DEMANDEUR')")
    public List<Panne> getByDemandeur(@PathVariable Long demandeurId) {
        return panneService.getPannesByDemandeur(demandeurId);
    }

    @GetMapping("/demandeur/{demandeurId}/statut/{statut}")
    @PreAuthorize("hasAnyRole('TECHNICIEN','RESPONSABLE_MAINTENANCE','SUPERVISEUR','DEMANDEUR')")
    public List<Panne> getByDemandeurAndStatut(
            @PathVariable Long demandeurId,
            @PathVariable StatutPanne statut
    ) {
        return panneService.getPannesByDemandeurAndStatut(demandeurId, statut);
    }

    @GetMapping("/mes-pannes")
    @PreAuthorize("hasAnyRole('DEMANDEUR','RESPONSABLE_MAINTENANCE')")
    public List<Panne> getMesPannes(Authentication authentication) {
        Utilisateur user = (Utilisateur) authentication.getPrincipal();
        return panneService.getPannesByDemandeur(user.getId());
    }

    @PatchMapping("/{id}/priorite-responsable")
    @PreAuthorize("hasRole('RESPONSABLE_MAINTENANCE')")
    public Panne updatePrioriteResponsable(
            @PathVariable Long id,
            @RequestParam("priorite") Priorite priorite
    ) {
        return panneService.updatePrioriteResponsable(id, priorite);
    }



    // ✅ POST multipart (data + image)
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('DEMANDEUR','TECHNICIEN','RESPONSABLE_MAINTENANCE')")
    public Panne create(
            @ModelAttribute PanneRequest request,
            @RequestPart(value = "image", required = false) MultipartFile image,
            Authentication authentication
    ) {
        Utilisateur user = (Utilisateur) authentication.getPrincipal();

        // ✅ on force le demandeur depuis le JWT
        request.setDemandeurId(user.getId());

        // ✅ on force aussi "signaleePar" si besoin
        if (request.getSignaleePar() == null || request.getSignaleePar().isBlank()) {
            request.setSignaleePar(user.getPrenom() + " " + user.getNom());
        }

        return panneService.createPanne(request, image);
    }



    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('TECHNICIEN','RESPONSABLE_MAINTENANCE')")
    public Panne update(@PathVariable Long id, @RequestBody PanneRequest request) {
        return panneService.updatePanne(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('RESPONSABLE_MAINTENANCE')")
    public void delete(@PathVariable Long id) {
        panneService.deletePanne(id);
    }

    @PatchMapping("/{id}/statut")
    @PreAuthorize("hasAnyRole('TECHNICIEN','RESPONSABLE_MAINTENANCE')")
    public Panne updateStatut(@PathVariable Long id, @RequestParam("statut") StatutPanne statut) {
        return panneService.updateStatut(id, statut);
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<String> handleNotFound(ResourceNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ex.getMessage());
    }
}
