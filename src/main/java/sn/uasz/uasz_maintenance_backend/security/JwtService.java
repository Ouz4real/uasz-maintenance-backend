package sn.uasz.uasz_maintenance_backend.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

@Service
public class JwtService {

    @Value("${application.security.jwt.secret}")
    private String secretKeyString;

    @Value("${application.security.jwt.expiration}")
    private long jwtExpirationMillis;

    private SecretKey signingKey;

    @PostConstruct
    void initKey() {
        // génère une clé HMAC à partir de la chaîne (minimum 32 caractères recommandé)
        this.signingKey = Keys.hmacShaKeyFor(secretKeyString.getBytes(StandardCharsets.UTF_8));
    }

    // ===================== PUBLIC =====================

    /**
     * Génère un JWT simple (sans claims supplémentaires) pour un utilisateur.
     */
    public String generateToken(UserDetails userDetails) {
        return generateToken(new HashMap<>(), userDetails);
    }

    /**
     * Génère un JWT avec des claims supplémentaires.
     */
    public String generateToken(Map<String, Object> extraClaims, UserDetails userDetails) {
        Instant now = Instant.now();
        Instant expiration = now.plusMillis(jwtExpirationMillis);

        return Jwts.builder()
                .claims(extraClaims)
                .subject(userDetails.getUsername())
                .issuedAt(Date.from(now))
                .expiration(Date.from(expiration))
                .signWith(signingKey, Jwts.SIG.HS256) // nouvelle API jjwt 0.13.0
                .compact();
    }

    /**
     * Extrait le username (subject) du token.
     */
    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    /**
     * Vérifie si le token est valable pour cet utilisateur (username + non expiré).
     */
    public boolean isTokenValid(String token, UserDetails userDetails) {
        final String username = extractUsername(token);
        return username.equals(userDetails.getUsername()) && !isTokenExpired(token);
    }

    // ===================== PRIVATE / UTILITAIRES =====================

    private boolean isTokenExpired(String token) {
        Date expiration = extractExpiration(token);
        return expiration.before(new Date());
    }

    private Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    public <T> T extractClaim(String token, Function<Claims, T> resolver) {
        final Claims claims = extractAllClaims(token);
        return resolver.apply(claims);
    }

    private Claims extractAllClaims(String token) {
        try {
            // Nouvelle façon de parser en 0.13.0 :
            // parser().verifyWith(key).build().parseSignedClaims(token)
            return Jwts.parser()
                    .verifyWith(signingKey)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
        } catch (JwtException e) {
            // token invalide (signé avec une autre clé, corrompu, etc.)
            throw new IllegalArgumentException("Token JWT invalide", e);
        }
    }
}
