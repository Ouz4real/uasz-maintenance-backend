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

    // 🔥 ENDPOINT DE DEBUG pour vérifier les pannes créées par un utilisateur
    @GetMapping("/debug/mes-pannes")
    @PreAuthorize("hasAnyRole('DEMANDEUR','TECHNICIEN','RESPONSABLE_MAINTENANCE','ADMINISTRATEUR','SUPERVISEUR')")
    public ResponseEntity<String> debugMesPannes(Authentication authentication) {
        Utilisateur user = (Utilisateur) authentication.getPrincipal();
        List<Panne> pannes = panneService.getPannesByDemandeur(user.getId());
        
        StringBuilder debug = new StringBuilder();
        debug.append("=== DEBUG MES PANNES (CRÉÉES PAR MOI) ===\n");
        debug.append("Utilisateur connecté: ").append(user.getPrenom()).append(" ").append(user.getNom());
        debug.append(" (ID: ").append(user.getId()).append(")\n\n");
        
        for (Panne p : pannes) {
            debug.append("Panne #").append(p.getId()).append(": ").append(p.getTitre()).append("\n");
            debug.append("  - Demandeur ID: ").append(p.getDemandeur() != null ? p.getDemandeur().getId() : "null").append("\n");
            debug.append("  - Demandeur Nom: ").append(p.getDemandeur() != null ? p.getDemandeur().getPrenom() + " " + p.getDemandeur().getNom() : "null").append("\n");
            debug.append("  - Technicien ID: ").append(p.getTechnicien() != null ? p.getTechnicien().getId() : "null").append("\n");
            debug.append("  - Technicien Nom: ").append(p.getTechnicien() != null ? p.getTechnicien().getPrenom() + " " + p.getTechnicien().getNom() : "null").append("\n");
            debug.append("  - Statut: ").append(p.getStatut()).append("\n");
            debug.append("  - Statut Interventions: ").append(p.getStatutInterventions()).append("\n");
            debug.append("\n");
        }
        
        debug.append("Total: ").append(pannes.size()).append(" panne(s) créée(s) par moi\n");
        
        return ResponseEntity.ok(debug.toString());
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
            @RequestParam Long technicienId
    ) {
        panneService.affecterTechnicien(id, technicienId);
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
            @RequestBody TraitementResponsableRequest request
    ) {
        PanneResponse resp = panneService.traiterParResponsable(
                id,
                request.getTechnicienId(),
                request.getPrioriteResponsable(),
                request.getStatut(),
                request.getCommentaireInterne()
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

    // 🔥 ENDPOINT DE DEBUG pour voir l'état réel des pannes
    @GetMapping("/debug/technicien/{technicienId}")
    @PreAuthorize("hasAnyRole('TECHNICIEN','RESPONSABLE_MAINTENANCE','SUPERVISEUR')")
    public ResponseEntity<List<Panne>> getDebugPannesByTechnicien(
            @PathVariable Long technicienId
    ) {
        List<Panne> pannes = panneRepository.findByTechnicienId(technicienId);
        return ResponseEntity.ok(pannes);
    }

    // 🔥 ENDPOINT DE DEBUG DÉTAILLÉ pour voir les statuts
    @GetMapping("/debug/technicien/{technicienId}/statuts")
    @PreAuthorize("hasAnyRole('TECHNICIEN','RESPONSABLE_MAINTENANCE','SUPERVISEUR')")
    public ResponseEntity<String> getDebugStatutsByTechnicien(
            @PathVariable Long technicienId
    ) {
        List<Panne> pannes = panneRepository.findByTechnicienId(technicienId);
        
        StringBuilder debug = new StringBuilder();
        debug.append("=== DEBUG PANNES TECHNICIEN ").append(technicienId).append(" ===\n\n");
        
        long countEnCours = 0;
        long countNonDemarree = 0;
        long countTerminee = 0;
        
        for (Panne p : pannes) {
            debug.append("Panne #").append(p.getId()).append(":\n");
            debug.append("  - statut: ").append(p.getStatut()).append("\n");
            debug.append("  - statutInterventions: ").append(p.getStatutInterventions()).append("\n");
            debug.append("  - dateDebutIntervention: ").append(p.getDateDebutIntervention()).append("\n");
            debug.append("  - dateFinIntervention: ").append(p.getDateFinIntervention()).append("\n");
            debug.append("\n");
            
            if (p.getStatutInterventions() == StatutInterventions.EN_COURS) {
                countEnCours++;
            } else if (p.getStatutInterventions() == StatutInterventions.NON_DEMARREE) {
                countNonDemarree++;
            } else if (p.getStatutInterventions() == StatutInterventions.TERMINEE) {
                countTerminee++;
            }
        }
        
        debug.append("\n=== RÉSUMÉ ===\n");
        debug.append("Total pannes: ").append(pannes.size()).append("\n");
        debug.append("NON_DEMARREE: ").append(countNonDemarree).append("\n");
        debug.append("EN_COURS: ").append(countEnCours).append("\n");
        debug.append("TERMINEE: ").append(countTerminee).append("\n");
        
        boolean occupe = panneRepository.existsByTechnicienIdAndStatutInterventions(
                technicienId, StatutInterventions.EN_COURS
        );
        debug.append("Occupé (selon existsByTechnicienIdAndStatutInterventions): ").append(occupe).append("\n");
        
        return ResponseEntity.ok(debug.toString());
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


}
