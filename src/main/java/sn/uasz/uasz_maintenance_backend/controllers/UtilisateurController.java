package sn.uasz.uasz_maintenance_backend.controllers;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import sn.uasz.uasz_maintenance_backend.dtos.UtilisateurRequest;
import sn.uasz.uasz_maintenance_backend.dtos.UtilisateurResponse;
import sn.uasz.uasz_maintenance_backend.services.UtilisateurService;

import java.util.List;

@RestController
@RequestMapping("/api/utilisateurs")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class UtilisateurController {

    private final UtilisateurService utilisateurService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public UtilisateurResponse create(@RequestBody UtilisateurRequest request) {
        return utilisateurService.create(request);
    }

    @GetMapping
    public List<UtilisateurResponse> getAll() {
        return utilisateurService.getAll();
    }
}
