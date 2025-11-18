package sn.uasz.uasz_maintenance_backend.security;

import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import sn.uasz.uasz_maintenance_backend.entities.Utilisateur;
import sn.uasz.uasz_maintenance_backend.repositories.UtilisateurRepository;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UtilisateurRepository utilisateurRepository;

    /**
     * Spring Security va appeler cette méthode avec le "username".
     * Ici on accepte soit username, soit email.
     */
    @Override
    public UserDetails loadUserByUsername(String usernameOrEmail) throws UsernameNotFoundException {
        Utilisateur utilisateur = utilisateurRepository.findByUsername(usernameOrEmail)
                .or(() -> utilisateurRepository.findByEmail(usernameOrEmail))
                .orElseThrow(() -> new UsernameNotFoundException(
                        "Utilisateur non trouvé avec username/email : " + usernameOrEmail
                ));

        return utilisateur; // Utilisateur implémente déjà UserDetails
    }
}
