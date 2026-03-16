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
import sn.uasz.uasz_maintenance_backend.dtos.PanneResponse;
import sn.uasz.uasz_maintenance_backend.dtos.StatsTechnicienResponse;
import sn.uasz.uasz_maintenance_backend.dtos.TechnicienDashboardResponse;
import sn.uasz.uasz_maintenance_backend.dtos.TraitementResponsableRequest;
import sn.uasz.uasz_maintenance_backend.entities.Panne;
import sn.uasz.uasz_maintenance_backend.entities.Utilisateur;
import sn.uasz.uasz_maintenance_backend.enums.Priorite;
import sn.uasz.uasz_maintenance_backend.enums.StatutInterventions;
import sn.uasz.uasz_maintenance_backend.enums.StatutPanne;
import sn.uasz.uasz_maintenance_backend.exceptions.ResourceNotFoundException;
import sn.uasz.uasz_maintenance_backend.repositories.PanneRepository;
import sn.uasz.uasz_maintenance_backend.services.PanneService;
import sn.uasz.uasz_maintenance_backend.services.TechnicienDashboardService;
import sn.uasz.uasz_maintenance_backend.services.UtilisateurService;

import java.util.List;

@RestController
@RequestMapping("/api/pannes")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class PanneController {

    private final PanneService panneService;
    private final TechnicienDashboardService technicienDashboardService;
    private final PanneRepository panneRepository;

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
    @PreAuthorize("hasAnyRole('DEMANDEUR','TECHNICIEN','RESPONSABLE_MAINTENANCE','ADMINISTRATEUR','SUPERVISEUR')")
    public List<Panne> getMesPannes(Authentication authentication) {
        Utilisateur user = (Utilisateur) authentication.getPrincipal();
        return panneService.getPannesByDemandeur(user.getId());
    }






    // ✅ POST multipart (data + image)
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('DEMANDEUR','TECHNICIEN','RESPONSABLE_MAINTENANCE','ADMINISTRATEUR','SUPERVISEUR')")
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
        System.out.println("priorite reçue: " + request.getPriorite());


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

    @GetMapping("/techniciens/{id}/dashboard")
    public ResponseEntity<TechnicienDashboardResponse> dashboard(@PathVariable Long id) {
        return ResponseEntity.ok(technicienDashboardService.getDashboard(id));
    }




    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<String> handleNotFound(ResourceNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ex.getMessage());
    }

    @PatchMapping("/{id}/technicien")
    @PreAuthorize("hasAnyRole('RESPONSABLE_MAINTENANCE','SUPERVISEUR')")
    public ResponseEntity<Void> affecterTechnicien(
            @PathVariable Long id,
            @RequestParam Long technicienId,
            Authentication authentication
    ) {
        Utilisateur user = (Utilisateur) authentication.getPrincipal();
        panneService.affecterTechnicien(id, technicienId, user);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/priorite-responsable")
    public ResponseEntity<PanneResponse> updatePrioriteResponsable(
            @PathVariable Long id,
            @RequestParam Priorite priorite
    ) {
        Panne updated = panneService.updatePrioriteResponsable(id, priorite);
        return ResponseEntity.ok(panneService.toResponse(updated));
    }



    @PutMapping("/{id}/traitement-responsable")
    @PreAuthorize("hasRole('RESPONSABLE_MAINTENANCE')")
    public ResponseEntity<PanneResponse> traiterPanneResponsable(
            @PathVariable Long id,
            @RequestBody TraitementResponsableRequest request,
            Authentication authentication
    ) {
        Utilisateur user = (Utilisateur) authentication.getPrincipal();
        PanneResponse resp = panneService.traiterParResponsable(
                id,
                request.getTechnicienId(),
                request.getPrioriteResponsable(),
                request.getStatut(),
                request.getCommentaireInterne(),
                user
        );
        return ResponseEntity.ok(resp);
    }




    @GetMapping("/technicien/{technicienId}/occupe")
    @PreAuthorize("hasAnyRole('RESPONSABLE_MAINTENANCE','SUPERVISEUR')")
    public boolean technicienOccupe(@PathVariable Long technicienId) {
        return panneService.technicienEstOccupe(technicienId);
    }

    @GetMapping("/technicien/{technicienId}/affectees")
    @PreAuthorize("hasAnyRole('TECHNICIEN','RESPONSABLE_MAINTENANCE','SUPERVISEUR')")
    public List<Panne> getPannesAffecteesAuTechnicien(
            @PathVariable Long technicienId
    ) {
        return panneService.getPannesAffecteesAuTechnicien(technicienId);
    }

    @GetMapping("/technicien/{technicienId}/en-cours")
    @PreAuthorize("hasAnyRole('TECHNICIEN','RESPONSABLE_MAINTENANCE','SUPERVISEUR')")
    public List<Panne> getPannesEnCoursByTechnicien(
            @PathVariable Long technicienId
    ) {
        return panneService.getPannesEnCoursByTechnicien(technicienId);
    }

    @GetMapping("/technicien/{technicienId}/recentes")
    @PreAuthorize("hasAnyRole('TECHNICIEN','RESPONSABLE_MAINTENANCE','SUPERVISEUR')")
    public List<Panne> getPannesRecentesByTechnicien(
            @PathVariable Long technicienId
    ) {
        return panneService.getPannesRecentesByTechnicien(technicienId);
    }

    // 🔥 NOUVEAU : Endpoint pour que le technicien prenne en charge une panne
    @PatchMapping("/{panneId}/demarrer-intervention")
    @PreAuthorize("hasAnyRole('TECHNICIEN','RESPONSABLE_MAINTENANCE')")
    public ResponseEntity<PanneResponse> demarrerIntervention(
            @PathVariable Long panneId,
            Authentication authentication
    ) {
        Utilisateur user = (Utilisateur) authentication.getPrincipal();
        PanneResponse response = panneService.demarrerIntervention(panneId, user.getId());
        return ResponseEntity.ok(response);
    }

    // 🔥 NOUVEAU : Endpoint pour terminer une intervention
    @PatchMapping("/{panneId}/terminer-intervention")
    @PreAuthorize("hasAnyRole('TECHNICIEN','RESPONSABLE_MAINTENANCE')")
    public ResponseEntity<PanneResponse> terminerIntervention(
            @PathVariable Long panneId,
            @RequestBody sn.uasz.uasz_maintenance_backend.dtos.TerminerInterventionRequest request,
            Authentication authentication
    ) {
        Utilisateur user = (Utilisateur) authentication.getPrincipal();
        PanneResponse response = panneService.terminerIntervention(panneId, user.getId(), request);
        return ResponseEntity.ok(response);
    }

    // 🔥 NOUVEAU : Endpoint pour marquer une panne comme résolue (responsable uniquement)
    @PatchMapping("/{panneId}/marquer-resolue")
    @PreAuthorize("hasRole('RESPONSABLE_MAINTENANCE')")
    public ResponseEntity<PanneResponse> marquerPanneResolue(
            @PathVariable Long panneId,
            @RequestBody sn.uasz.uasz_maintenance_backend.dtos.MarquerResolueRequest request
    ) {
        PanneResponse response = panneService.marquerPanneResolue(panneId, request.getMarquerResolue());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/technicien/{technicienId}/stats")
    @PreAuthorize("hasAnyRole('TECHNICIEN','RESPONSABLE_MAINTENANCE','SUPERVISEUR')")
    public ResponseEntity<StatsTechnicienResponse> getStatsTechnicien(
            @PathVariable Long technicienId
    ) {
        Long enCours = panneService.countEnCoursByTechnicien(technicienId);
        Long terminees = panneService.countTermineesByTechnicien(technicienId);
        Double tempsMoyenHeures = panneService.getTempsMoyenHeuresByTechnicien(technicienId);

        // Conversion heures → minutes
        Double tempsMoyenMinutes = (tempsMoyenHeures != null) 
                ? tempsMoyenHeures * 60 
                : null;

        long total = (enCours != null ? enCours : 0) + (terminees != null ? terminees : 0);

        String affichage = formatMinutes(tempsMoyenMinutes);

        StatsTechnicienResponse response = StatsTechnicienResponse.builder()
                .technicienId(technicienId)
                .totalInterventions(total)
                .interventionsPlanifiees(0L)
                .interventionsEnCours(enCours != null ? enCours : 0L)
                .interventionsTerminees(terminees != null ? terminees : 0L)
                .interventionsAnnulees(0L)
                .tempsMoyenMinutes(tempsMoyenMinutes)
                .tempsMoyenAffichage(affichage)
                .build();

        return ResponseEntity.ok(response);
    }



    private String formatMinutes(Double minutes) {
        if (minutes == null) return "0 h";
        long totalMin = Math.round(minutes);
        long h = totalMin / 60;
        long m = totalMin % 60;
        if (h <= 0 && m <= 0) return "0 h";
        if (h <= 0) return m + " min";
        if (m == 0) return h + " h";
        return h + " h " + m + " min";
    }

    /**
     * Décliner une intervention (technicien)
     * POST /api/pannes/{id}/refuser
     */
    @PostMapping("/{id}/refuser")
    @PreAuthorize("hasRole('TECHNICIEN')")
    public ResponseEntity<PanneResponse> refuserIntervention(
            @PathVariable Long id,
            @RequestBody java.util.Map<String, String> body,
            Authentication authentication
    ) {
        Utilisateur technicien = (Utilisateur) authentication.getPrincipal();
        String raisonRefus = body.get("raisonRefus");
        
        if (raisonRefus == null || raisonRefus.trim().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        
        PanneResponse response = panneService.refuserIntervention(
            id, 
            technicien.getId(), 
            raisonRefus
        );
        
        return ResponseEntity.ok(response);
    }
}

