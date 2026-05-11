package sn.uasz.uasz_maintenance_backend.services;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import sn.uasz.uasz_maintenance_backend.dtos.MaintenancePreventiveRequest;
import sn.uasz.uasz_maintenance_backend.dtos.MaintenancePreventiveResponse;
import sn.uasz.uasz_maintenance_backend.entities.MaintenancePreventive;
import sn.uasz.uasz_maintenance_backend.repositories.MaintenancePreventiveRepository;
import sn.uasz.uasz_maintenance_backend.repositories.UtilisateurRepository;
import sn.uasz.uasz_maintenance_backend.services.impl.NotificationServiceImpl;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Tests MaintenancePreventiveService")
class MaintenancePreventiveServiceTest {

    @Mock private MaintenancePreventiveRepository repo;
    @Mock private NotificationServiceImpl notificationService;
    @Mock private UtilisateurRepository utilisateurRepository;

    @InjectMocks
    private MaintenancePreventiveService service;

    @Test
    @DisplayName("Création d'une maintenance préventive doit retourner une réponse non nulle")
    void create_doitRetournerReponseNonNulle() {
        MaintenancePreventiveRequest req = new MaintenancePreventiveRequest();
        req.setEquipementReference("PC-LABO-01");
        req.setFrequence("MENSUELLE");
        req.setProchaineDate(LocalDate.now().plusMonths(1));
        req.setTechnicienId(1L);

        MaintenancePreventive saved = MaintenancePreventive.builder()
                .id(1L)
                .equipementReference("PC-LABO-01")
                .frequence("MENSUELLE")
                .prochaineDate(LocalDate.now().plusMonths(1))
                .technicienId(1L)
                .build();

        when(repo.save(any())).thenReturn(saved);

        MaintenancePreventiveResponse response = service.create(req);

        assertNotNull(response);
        assertEquals("PC-LABO-01", response.getEquipementReference());
    }

    @Test
    @DisplayName("Création sans technicien ne doit pas lever d'exception")
    void create_sansTechnicien_doitFonctionner() {
        MaintenancePreventiveRequest req = new MaintenancePreventiveRequest();
        req.setEquipementReference("IMPRIMANTE-01");
        req.setFrequence("TRIMESTRIELLE");
        req.setProchaineDate(LocalDate.now().plusMonths(3));
        // technicienId null

        MaintenancePreventive saved = MaintenancePreventive.builder()
                .id(2L)
                .equipementReference("IMPRIMANTE-01")
                .frequence("TRIMESTRIELLE")
                .build();

        when(repo.save(any())).thenReturn(saved);

        assertDoesNotThrow(() -> service.create(req));
    }

    @Test
    @DisplayName("getAll doit retourner la liste complète")
    void getAll_doitRetournerListe() {
        MaintenancePreventive m1 = MaintenancePreventive.builder().id(1L).equipementReference("PC-01").build();
        MaintenancePreventive m2 = MaintenancePreventive.builder().id(2L).equipementReference("PC-02").build();

        when(repo.findAll()).thenReturn(List.of(m1, m2));

        List<MaintenancePreventiveResponse> result = service.getAll();

        assertEquals(2, result.size());
    }

    @Test
    @DisplayName("realiser une maintenance inexistante doit lever une exception")
    void realiser_maintenanceInexistante_doitLeverException() {
        when(repo.findById(999L)).thenReturn(Optional.empty());

        assertThrows(Exception.class, () -> service.realiser(999L, null));
    }

    @Test
    @DisplayName("annuler une maintenance inexistante doit lever une exception")
    void annuler_maintenanceInexistante_doitLeverException() {
        when(repo.findById(999L)).thenReturn(Optional.empty());

        assertThrows(Exception.class, () -> service.annuler(999L));
    }
}
