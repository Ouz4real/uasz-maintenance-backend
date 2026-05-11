package sn.uasz.uasz_maintenance_backend.services;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import sn.uasz.uasz_maintenance_backend.dtos.UtilisateurRequest;
import sn.uasz.uasz_maintenance_backend.enums.Role;
import sn.uasz.uasz_maintenance_backend.repositories.InterventionRepository;
import sn.uasz.uasz_maintenance_backend.repositories.NotificationRepository;
import sn.uasz.uasz_maintenance_backend.repositories.PanneRepository;
import sn.uasz.uasz_maintenance_backend.repositories.RefreshTokenRepository;
import sn.uasz.uasz_maintenance_backend.repositories.UtilisateurRepository;
import sn.uasz.uasz_maintenance_backend.services.impl.NotificationServiceImpl;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Tests UtilisateurService")
class UtilisateurServiceTest {

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

    // ===== Tests isEmailDomainAutorise =====

    @Test
    @DisplayName("Email @zig.univ.sn doit être accepté")
    void emailZigUnivSn_doitEtreAccepte() {
        assertTrue(UtilisateurService.isEmailDomainAutorise("o.m6@zig.univ.sn"));
    }

    @Test
    @DisplayName("Email @univ-zig.sn doit être accepté")
    void emailUnivZigSn_doitEtreAccepte() {
        assertTrue(UtilisateurService.isEmailDomainAutorise("kgaye@univ-zig.sn"));
    }

    @Test
    @DisplayName("Email @gmail.com doit être refusé")
    void emailGmail_doitEtreRefuse() {
        assertFalse(UtilisateurService.isEmailDomainAutorise("user@gmail.com"));
    }

    @Test
    @DisplayName("Email @yahoo.fr doit être refusé")
    void emailYahoo_doitEtreRefuse() {
        assertFalse(UtilisateurService.isEmailDomainAutorise("user@yahoo.fr"));
    }

    @Test
    @DisplayName("Email null doit retourner false")
    void emailNull_doitRetournerFalse() {
        assertFalse(UtilisateurService.isEmailDomainAutorise(null));
    }

    @Test
    @DisplayName("Email vide doit retourner false")
    void emailVide_doitRetournerFalse() {
        assertFalse(UtilisateurService.isEmailDomainAutorise(""));
    }

    @Test
    @DisplayName("Email insensible à la casse")
    void emailMajuscules_doitEtreAccepte() {
        assertTrue(UtilisateurService.isEmailDomainAutorise("USER@ZIG.UNIV.SN"));
    }

    // ===== Tests create() =====

    @Test
    @DisplayName("Création avec email domaine invalide doit lever IllegalArgumentException")
    void create_emailDomaineInvalide_doitLeverException() {
        UtilisateurRequest request = new UtilisateurRequest();
        request.setUsername("testuser");
        request.setEmail("test@gmail.com");
        request.setNom("Test");
        request.setPrenom("User");
        request.setRole(Role.DEMANDEUR);

        when(utilisateurRepository.existsByUsername("testuser")).thenReturn(false);
        when(utilisateurRepository.existsByEmail("test@gmail.com")).thenReturn(false);

        IllegalArgumentException ex = assertThrows(
            IllegalArgumentException.class,
            () -> utilisateurService.create(request)
        );
        assertTrue(ex.getMessage().contains("domaine"));
    }

    @Test
    @DisplayName("Création avec username déjà pris doit lever IllegalArgumentException")
    void create_usernameExistant_doitLeverException() {
        UtilisateurRequest request = new UtilisateurRequest();
        request.setUsername("existinguser");
        request.setEmail("user@zig.univ.sn");
        request.setRole(Role.DEMANDEUR);

        when(utilisateurRepository.existsByUsername("existinguser")).thenReturn(true);

        IllegalArgumentException ex = assertThrows(
            IllegalArgumentException.class,
            () -> utilisateurService.create(request)
        );
        assertTrue(ex.getMessage().contains("Username"));
    }

    @Test
    @DisplayName("Création avec email déjà utilisé doit lever IllegalArgumentException")
    void create_emailExistant_doitLeverException() {
        UtilisateurRequest request = new UtilisateurRequest();
        request.setUsername("newuser");
        request.setEmail("existing@zig.univ.sn");
        request.setRole(Role.DEMANDEUR);

        when(utilisateurRepository.existsByUsername("newuser")).thenReturn(false);
        when(utilisateurRepository.existsByEmail("existing@zig.univ.sn")).thenReturn(true);

        IllegalArgumentException ex = assertThrows(
            IllegalArgumentException.class,
            () -> utilisateurService.create(request)
        );
        assertTrue(ex.getMessage().contains("Email"));
    }
}
