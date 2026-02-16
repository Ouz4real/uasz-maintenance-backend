package sn.uasz.uasz_maintenance_backend.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.web.cors.CorsConfigurationSource;
import sn.uasz.uasz_maintenance_backend.security.JwtAuthenticationFilter;
import sn.uasz.uasz_maintenance_backend.security.CustomUserDetailsService;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final CustomUserDetailsService userDetailsService;
    private final CorsConfigurationSource corsConfigurationSource;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {

        http
                // API REST : pas de CSRF
                .csrf(AbstractHttpConfigurer::disable)

                // CORS → utilise le bean défini dans CorsConfig
                .cors(cors -> cors.configurationSource(corsConfigurationSource))

                // JWT → pas de session serveur
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                // Service pour charger les users (Spring Security)
                .userDetailsService(userDetailsService)

                .authorizeHttpRequests(auth -> auth

                        // 🔓 SWAGGER / OPENAPI accessibles sans auth
                        .requestMatchers(
                                "/swagger-ui.html",
                                "/swagger-ui/**",
                                "/v3/api-docs/**",
                                "/swagger-resources/**",
                                "/configuration/ui",
                                "/configuration/security",
                                "/webjars/**"
                        ).permitAll()

                        // 🔓 Auth publique (login, éventuellement register)
                        .requestMatchers("/api/auth/**").permitAll()

                        // 🔓 Création utilisateur (à sécuriser plus tard si besoin)
                        .requestMatchers(HttpMethod.POST, "/api/utilisateurs").permitAll()

                        // 🔓 Actuator (health, metrics, etc.)
                        .requestMatchers("/actuator/**").permitAll()

                        // ✅ Tout le reste nécessite un JWT valide
                        .anyRequest().authenticated()
                )

                // Filtre JWT avant le filtre standard de login
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration configuration)
            throws Exception {
        return configuration.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
