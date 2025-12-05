package sn.uasz.uasz_maintenance_backend.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import sn.uasz.uasz_maintenance_backend.entities.Utilisateur;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.function.Function;

@Service
@Slf4j
public class JwtService {

    // Chaîne assez longue pour HMAC (tu peux la changer, mais garde-la secrète)
    private static final String SECRET_KEY =
            "cette_cle_est_tres_longue_pour_le_hmac_et_utilisee_en_UTF8_uniquement_pour_signer_les_tokens";

    // ✅ On n'essaie plus de décoder en Base64
    private SecretKey getSigningKey() {
        byte[] keyBytes = SECRET_KEY.getBytes(StandardCharsets.UTF_8);
        return Keys.hmacShaKeyFor(keyBytes); // -> SecretKey HMAC valide
    }

    // ================== EXTRACTION ==================

    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public <T> T extractClaim(String token, Function<Claims, T> resolver) {
        Claims claims = extractAllClaims(token);
        return resolver.apply(claims);
    }

    // ================== GENERATION ==================

    public String generateToken(UserDetails user) {
        Instant now = Instant.now();
        Instant expiration = now.plus(24, ChronoUnit.HOURS); // 24h de validité

        return Jwts.builder()
                .subject(user.getUsername())
                .issuedAt(Date.from(now))
                .expiration(Date.from(expiration))
                .claim("roles", user.getAuthorities())
                .signWith(getSigningKey())      // 🔥 utilise la SecretKey ci-dessus
                .compact();
    }

    public String generateToken(Utilisateur user) {
        return generateToken((UserDetails) user);
    }

    // ================== VALIDATION ==================

    public boolean isTokenValid(String token, UserDetails user) {
        try {
            String username = extractUsername(token);
            return username.equals(user.getUsername()) && !isTokenExpired(token);
        } catch (ExpiredJwtException e) {
            log.warn("JWT expiré lors de la validation: {}", e.getMessage());
            return false;
        } catch (IllegalArgumentException | JwtException e) {
            log.warn("JWT invalide lors de la validation: {}", e.getMessage());
            return false;
        } catch (Exception e) {
            log.error("Erreur lors de la validation du JWT", e);
            return false;
        }
    }

    private boolean isTokenExpired(String token) {
        try {
            return extractExpiration(token).before(new Date());
        } catch (ExpiredJwtException e) {
            return true;
        }
    }

    private Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    // ================== PARSING ==================

    Claims extractAllClaims(String token) {
        try {
            return Jwts.parser()
                    .verifyWith(getSigningKey())   // ✅ maintenant c'est bien une SecretKey
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
        } catch (ExpiredJwtException e) {
            throw e;  // laissé pour que le filtre le gère
        } catch (JwtException | IllegalArgumentException e) {
            throw new IllegalArgumentException("Token JWT invalide", e);
        }
    }
}
