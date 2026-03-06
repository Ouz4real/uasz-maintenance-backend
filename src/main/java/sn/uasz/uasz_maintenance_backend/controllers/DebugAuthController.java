// src/main/java/.../controllers/DebugAuthController.java
package sn.uasz.uasz_maintenance_backend.controllers;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/debug")
@CrossOrigin(origins = "http://localhost:4200")
public class DebugAuthController {

    @GetMapping("/me")
    public Map<String, Object> me(Authentication auth) {
        if (auth == null) {
            return Map.of("authenticated", false, "reason", "auth is null");
        }
        return Map.of(
                "authenticated", true,
                "name", auth.getName(),
                "authorities", auth.getAuthorities().stream()
                        .map(a -> a.getAuthority())
                        .collect(Collectors.toList())
        );
    }
}
