package sn.uasz.uasz_maintenance_backend.services;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.security.crypto.password.PasswordEncoder;
import sn.uasz.uasz_maintenance_backend.dtos.UtilisateurRequest;
import sn.uasz.uasz_maintenance_backend.entities.Utilisateur;
import sn.uasz.uasz_maintenance_backend.enums.Role;
import sn.uasz.uasz_maintenance_backend.repositories.InterventionRepository;
import sn.uasz.uasz_maintenance_backend.repositories.NotificationRepository;
import sn.uasz.uasz_maintenance_backend.repositories.PanneRepository;
import sn.uasz.uasz_maintenance_backend.repositories.RefreshTokenRepository;
import sn.uasz.uasz_maintenance_backend.repositories.UtilisateurRepository;
import sn.uasz.uasz_maintenance_backend.services.impl.NotificationServiceImpl;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("Tests UtilisateurService - Cas avancés")
class UtilisateurServiceExtendedTest {

    @Mock private UtilisateurRepository utilisateurRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private NotificationServiceImpl notificationService;
    @Mock private EmailService emailService;
    @Mock private PanneRepository panneRepository;
    @Mock private InterventionRepository interventionRepository;
    @Mock private NotificationRepository notificationRepository;
    @Mock private RefreshTokenRepository refreshTokenRepository;

    @InjectMocks
    private UtilisateurService utilisateurService;

    @Test
    @DisplayName("Création réussie avec email @zig.univ.sn doit sauvegarder l'utilisateur")
    void create_emailValide_doitSauvegarder() {
        UtilisateurRequest request = new UtilisateurRequest();
        request.setUsername("ousmane.mane");
        request.setEmail("o.m6@zig.univ.sn");
        request.setNom("Mané");
        request.setPrenom("Ousmane");
        request.setRole(Role.DEMANDEUR);

        Utilisateur saved = Utilisateur.builder()
                .id(1L)
                .username("ousmane.mane")
                .email("o.m6@zig.univ.sn")
                .nom("Mané")
                .prenom("Ousmane")
                .role(Role.DEMANDEUR)
                .enabled(true)
                .mustChangePassword(true)
                .build();

        when(utilisateurRepository.existsByUsername("ousmane.mane")).thenReturn(false);
        when(utilisateurRepository.existsByEmail("o.m6@zig.univ.sn")).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenReturn("$2a$encoded");
        when(utilisateurRepository.save(any())).thenReturn(saved);
        when(utilisateurRepository.findByRole(any())).thenReturn(Collections.emptyList());

        var response = utilisateurService.create(request);

        assertNotNull(response);
        assertEquals("ousmane.mane", response.getUsername());
        verify(utilisateurRepository, times(1)).save(any());
    }

    @Test
    @DisplayName("Création avec email @univ-zig.sn doit aussi fonctionner")
    void create_emailUnivZig_doitFonctionner() {
        UtilisateurRequest request = new UtilisateurRequest();
        request.setUsername("kgaye");
        request.setEmail("kgaye@univ-zig.sn");
        request.setNom("Gaye");
        request.setPrenom("Khadim");
        request.setRole(Role.RESPONSABLE_MAINTENANCE);

        Utilisateur saved = Utilisateur.builder()
                .id(2L)
                .username("kgaye")
                .email("kgaye@univ-zig.sn")
                .role(Role.RESPONSABLE_MAINTENANCE)
                .enabled(true)
                .build();

        when(utilisateurRepository.existsByUsername("kgaye")).thenReturn(false);
        when(utilisateurRepository.existsByEmail("kgaye@univ-zig.sn")).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenReturn("$2a$encoded");
        when(utilisateurRepository.save(any())).thenReturn(saved);
        when(utilisateurRepository.findByRole(any())).thenReturn(Collections.emptyList());

        assertDoesNotThrow(() -> utilisateurService.create(request));
    }

    @Test
    @DisplayName("toggleEnabled doit activer un compte désactivé")
    void toggleEnabled_compteDesactive_doitActiver() {
        Utilisateur user = Utilisateur.builder()
                .id(1L)
                .username("testuser")
                .enabled(false)
                .build();

        when(utilisateurRepository.findById(1L)).thenReturn(Optional.of(user));
        when(utilisateurRepository.save(any())).thenReturn(user);

        utilisateurService.toggleEnabled(1L, true);

        assertTrue(user.isEnabled());
        verify(utilisateurRepository, times(1)).save(user);
    }

    @Test
    @DisplayName("toggleEnabled doit désactiver un compte actif")
    void toggleEnabled_compteActif_doitDesactiver() {
        Utilisateur user = Utilisateur.builder()
                .id(1L)
                .username("testuser")
                .enabled(true)
                .build();

        when(utilisateurRepository.findById(1L)).thenReturn(Optional.of(user));
        when(utilisateurRepository.save(any())).thenReturn(user);

        utilisateurService.toggleEnabled(1L, false);

        assertFalse(user.isEnabled());
    }

    @Test
    @DisplayName("getAll doit retourner tous les utilisateurs")
    void getAll_doitRetournerTousLesUtilisateurs() {
        Utilisateur u1 = Utilisateur.builder().id(1L).username("user1").role(Role.DEMANDEUR).build();
        Utilisateur u2 = Utilisateur.builder().id(2L).username("user2").role(Role.TECHNICIEN).build();

        when(utilisateurRepository.findAll()).thenReturn(List.of(u1, u2));

        var result = utilisateurService.getAll();

        assertEquals(2, result.size());
    }

    @Test
    @DisplayName("getById avec ID inexistant doit lever une exception")
    void getById_idInexistant_doitLeverException() {
        when(utilisateurRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(Exception.class, () -> utilisateurService.getById(999L));
    }

    @Test
    @DisplayName("deleteById doit supprimer l'utilisateur")
    void deleteById_doitSupprimerUtilisateur() {
        Utilisateur user = Utilisateur.builder()
                .id(1L)
                .username("todelete")
                .build();

        when(utilisateurRepository.findById(1L)).thenReturn(Optional.of(user));

        utilisateurService.deleteById(1L);

        verify(utilisateurRepository, times(1)).delete(user);
    }

    @Test
    @DisplayName("Mot de passe généré automatiquement si non fourni")
    void create_sansMotDePasse_doitGenererMotDePasse() {
        UtilisateurRequest request = new UtilisateurRequest();
        request.setUsername("newuser");
        request.setEmail("newuser@zig.univ.sn");
        request.setNom("User");
        request.setPrenom("New");
        request.setRole(Role.DEMANDEUR);
        request.setMotDePasse(null); // pas de mot de passe fourni

        Utilisateur saved = Utilisateur.builder()
                .id(3L)
                .username("newuser")
                .email("newuser@zig.univ.sn")
                .mustChangePassword(true) // doit être true car mot de passe généré
                .build();

        when(utilisateurRepository.existsByUsername("newuser")).thenReturn(false);
        when(utilisateurRepository.existsByEmail("newuser@zig.univ.sn")).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenReturn("$2a$encoded");
        when(utilisateurRepository.save(any())).thenReturn(saved);
        when(utilisateurRepository.findByRole(any())).thenReturn(Collections.emptyList());

        var response = utilisateurService.create(request);

        // L'email de bienvenue doit être envoyé avec le mot de passe temporaire
        verify(emailService, times(1)).sendWelcomeEmail(anyString(), anyString(), anyString(), anyString());
        assertNotNull(response);
    }
}
