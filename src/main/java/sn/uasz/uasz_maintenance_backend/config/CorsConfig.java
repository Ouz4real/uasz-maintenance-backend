package sn.uasz.uasz_maintenance_backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
public class CorsConfig {

    /**
     * Configuration CORS globale pour l'API.
     * On autorise le front Angular en http://localhost:4200
     * avec en-tête Authorization, méthodes classiques, et cookies / credentials.
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();

        // ⛔ surtout pas "*" quand allowCredentials = true
        config.setAllowedOrigins(List.of("http://localhost:4200"));

        // Méthodes autorisées
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));

        // Headers autorisés
        config.setAllowedHeaders(List.of("Authorization", "Content-Type"));

        // Pour pouvoir envoyer le header Authorization / cookies
        config.setAllowCredentials(true);

        // Application sur tous les endpoints
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);

        return source;
    }
}
