package sn.uasz.uasz_maintenance_backend.exceptions;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<String> handleNotFound(ResourceNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ex.getMessage());
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<String> handleIllegalArgument(IllegalArgumentException ex) {
        // On renvoie le message réel (ex: "Stock négatif", "email déjà utilisé", etc.)
        return ResponseEntity.badRequest().body(ex.getMessage());
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<String> handleDataIntegrity(DataIntegrityViolationException ex) {

        String causeMsg = ex.getMostSpecificCause() != null
                ? ex.getMostSpecificCause().getMessage()
                : "";

        System.err.println("#### DataIntegrityViolationException ####");
        System.err.println(causeMsg);
        System.err.println("########################################");

        String lower = causeMsg.toLowerCase();
        String message = "Erreur d’intégrité des données.";

        // Cas utilisateur
        if (lower.contains("utilisateur")
                || lower.contains("utilisateurs")
                || lower.contains("email")
                || lower.contains("username")) {

            message = "Username ou email déjà utilisé.";

            // Cas pièce (on vérifie la table / contrainte liée aux pièces)
        } else if ((lower.contains("piece") || lower.contains("pieces"))
                && lower.contains("code")) {

            message = "Code de pièce déjà utilisé.";

        } else {
            // Par défaut, on renvoie la cause technique pour t'aider à déboguer
            message = "Erreur d’intégrité des données : " + causeMsg;
        }

        return ResponseEntity.badRequest().body(message);
    }
}
