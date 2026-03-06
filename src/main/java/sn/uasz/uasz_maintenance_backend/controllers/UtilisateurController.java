package sn.uasz.uasz_maintenance_backend.controllers;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import sn.uasz.uasz_maintenance_backend.dtos.*;
import sn.uasz.uasz_maintenance_backend.entities.Utilisateur;
import sn.uasz.uasz_maintenance_backend.enums.Role;
import sn.uasz.uasz_maintenance_backend.repositories.UtilisateurRepository;
import sn.uasz.uasz_maintenance_backend.services.TechnicienService;
import sn.uasz.uasz_maintenance_backend.services.UtilisateurService;

import java.util.List;

@RestController
@RequestMapping("/api/utilisateurs")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class UtilisateurController {

    private final UtilisateurService utilisateurService;
    private final UtilisateurRepository utilisateurRepository;
    private final TechnicienService technicienService;

    // ================== CRUD de base ==================

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public UtilisateurResponse create(@RequestBody UtilisateurRequest request) {
        return utilisateurService.create(request);
    }

    // ========= PROFIL DU USER CONNECTÉ =========

    /**
     * GET /api/utilisateurs/me
     * Récupère le profil de l’utilisateur connecté.
     */
    @GetMapping("/me")
    public UtilisateurResponse getMe(Authentication authentication) {
        Utilisateur current = (Utilisateur) authentication.getPrincipal();
        return utilisateurService.getById(current.getId());
    }

    /**
     * PUT /api/utilisateurs/me
     * Met à jour le profil de l’utilisateur connecté.
     */
    @PutMapping("/me")
    public UtilisateurResponse updateMe(
            Authentication authentication,
            @RequestBody UpdateProfileRequest request
    ) {
        Utilisateur current = (Utilisateur) authentication.getPrincipal();
        return utilisateurService.updateProfile(current.getId(), request);
    }

    /**
     * PUT /api/utilisateurs/me/password
     * Change le mot de passe de l’utilisateur connecté.
     */
    @PutMapping("/me/password")
    public ResponseEntity<Void> updateMyPassword(
            Authentication authentication,
            @RequestBody ChangePasswordRequest request
    ) {
        Utilisateur current = (Utilisateur) authentication.getPrincipal();
        // Méthode du service : changePassword(Utilisateur utilisateur, ChangePasswordRequest request)
        utilisateurService.changePassword(current, request);
        return ResponseEntity.noContent().build();
    }

    // ===================== Gestion des erreurs =====================

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<String> handleBadRequest(IllegalArgumentException ex) {
        return ResponseEntity.badRequest().body(ex.getMessage());
    }

    @GetMapping
    public ResponseEntity<List<UtilisateurResponse>> getAll(@RequestParam(required = false) Role role) {
        if (role == null) {
            return ResponseEntity.ok(utilisateurService.getAll());
        }
        return ResponseEntity.ok(utilisateurService.getByRole(role)); // à créer si pas déjà
    }

    /**
     * PUT /api/utilisateurs/{id}
     * Met à jour un utilisateur par son ID (admin uniquement).
     */
    @PutMapping("/{id}")
    public UtilisateurResponse updateById(
            @PathVariable Long id,
            @RequestBody UpdateProfileRequest request
    ) {
        return utilisateurService.updateProfile(id, request);
    }

    /**
     * POST /api/utilisateurs/{id}/reset-password
     * Réinitialise le mot de passe d'un utilisateur (admin uniquement).
     */
    @PostMapping("/{id}/reset-password")
    public ResponseEntity<Void> resetPassword(
            @PathVariable Long id,
            @RequestBody ResetPasswordRequest request
    ) {
        utilisateurService.resetPassword(id, request.getNewPassword());
        return ResponseEntity.noContent().build();
    }

    /**
     * PATCH /api/utilisateurs/{id}/enabled
     * Active ou désactive un utilisateur (admin uniquement).
     */
    @PatchMapping("/{id}/enabled")
    public UtilisateurResponse toggleEnabled(
            @PathVariable Long id,
            @RequestBody EnabledRequest request
    ) {
        return utilisateurService.toggleEnabled(id, request.getEnabled());
    }

    /**
     * DELETE /api/utilisateurs/{id}
     * Supprime un utilisateur par son ID (admin uniquement).
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteById(@PathVariable Long id) {
        utilisateurService.deleteById(id);
        return ResponseEntity.noContent().build();
    }


    @GetMapping("/techniciens/supervision")
    public List<TechnicienUIResponse> getTechniciensSupervision() {
        return technicienService.getTechniciensSupervision();
    }

}
