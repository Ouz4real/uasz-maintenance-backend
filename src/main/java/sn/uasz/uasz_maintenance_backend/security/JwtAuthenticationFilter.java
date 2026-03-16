package sn.uasz.uasz_maintenance_backend.security;

import io.jsonwebtoken.ExpiredJwtException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;

@Component
@RequiredArgsConstructor
@Slf4j
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final CustomUserDetailsService userDetailsService;

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        // 1) Récupération de l'en-tête Authorization
        final String authHeader = request.getHeader("Authorization");

        // 2) Si pas de Bearer token → on laisse passer
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        final String jwt = authHeader.substring(7);

        String username;
        try {
            username = jwtService.extractUsername(jwt);
        } catch (ExpiredJwtException e) {
            log.warn("JWT expiré : {}", e.getMessage());
            filterChain.doFilter(request, response);
            return;
        } catch (IllegalArgumentException e) {
            log.warn("JWT invalide : {}", e.getMessage());
            filterChain.doFilter(request, response);
            return;
        } catch (Exception e) {
            log.error("Erreur lors de l'analyse du JWT", e);
            filterChain.doFilter(request, response);
            return;
        }

        // 3) Si on a un username et pas encore d'auth dans le contexte
        if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {

            UserDetails userDetails = userDetailsService.loadUserByUsername(username);

            if (jwtService.isTokenValid(jwt, userDetails)) {
                UsernamePasswordAuthenticationToken authToken =
                        new UsernamePasswordAuthenticationToken(
                                userDetails,
                                null,
                                userDetails.getAuthorities()
                        );
                authToken.setDetails(
                        new WebAuthenticationDetailsSource().buildDetails(request)
                );
                SecurityContextHolder.getContext().setAuthentication(authToken);
            }
        }

        // 4) On laisse toujours continuer la chaîne
        filterChain.doFilter(request, response);
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();

        // ✅ NE PAS INTERCEPTER LES FICHIERS STATIQUES
        return path.startsWith("/uploads/");
    }

}
