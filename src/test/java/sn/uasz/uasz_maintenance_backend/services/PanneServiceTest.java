package sn.uasz.uasz_maintenance_backend.services;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import sn.uasz.uasz_maintenance_backend.dtos.PanneRequest;
import sn.uasz.uasz_maintenance_backend.entities.Utilisateur;
import sn.uasz.uasz_maintenance_backend.enums.Priorite;
import sn.uasz.uasz_maintenance_backend.enums.StatutPanne;
import sn.uasz.uasz_maintenance_backend.repositories.EquipementRepository;
import sn.uasz.uasz_maintenance_backend.repositories.PanneRepository;
import sn.uasz.uasz_maintenance_backend.repositories.UtilisateurRepository;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Tests PanneService")
class PanneServiceTest {

    @Mock private PanneRepository panneRepository;
    @Mock private EquipementRepository equipementRepository;
    @Mock private UtilisateurRepository utilisateurRepository;
    @Mock private NotificationService notificationService;
    @Mock private EmailService emailService;

    @InjectMocks
    private PanneService panneService;

    // ===== Tests createPanne() =====

    @Test
    @DisplayName("Création sans demandeurId doit lever IllegalArgumentException")
    void createPanne_sansDemandeurId_doitLeverException() {
        PanneRequest request = new PanneRequest();
        request.setTitre("PC en panne");
        request.setLieu("Salle 01");
        request.setTypeEquipement("Ordinateur de bureau");
        // demandeurId non défini

        assertThrows(IllegalArgumentException.class,
            () -> panneService.createPanne(request, null));
    }

    @Test
    @DisplayName("Création sans titre doit lever IllegalArgumentException")
    void createPanne_sansTitre_doitLeverException() {
        PanneRequest request = new PanneRequest();
        request.setDemandeurId(1L);
        request.setLieu("Salle 01");
        request.setTypeEquipement("Ordinateur de bureau");

        assertThrows(IllegalArgumentException.class,
            () -> panneService.createPanne(request, null));
    }

    @Test
    @DisplayName("Création sans lieu doit lever IllegalArgumentException")
    void createPanne_sansLieu_doitLeverException() {
        PanneRequest request = new PanneRequest();
        request.setDemandeurId(1L);
        request.setTitre("PC en panne");
        request.setTypeEquipement("Ordinateur de bureau");

        assertThrows(IllegalArgumentException.class,
            () -> panneService.createPanne(request, null));
    }

    @Test
    @DisplayName("Création sans typeEquipement doit lever IllegalArgumentException")
    void createPanne_sansTypeEquipement_doitLeverException() {
        PanneRequest request = new PanneRequest();
        request.setDemandeurId(1L);
        request.setTitre("PC en panne");
        request.setLieu("Salle 01");

        assertThrows(IllegalArgumentException.class,
            () -> panneService.createPanne(request, null));
    }

    @Test
    @DisplayName("Création avec doublon doit lever IllegalStateException")
    void createPanne_doublon_doitLeverException() {
        PanneRequest request = new PanneRequest();
        request.setDemandeurId(1L);
        request.setTitre("PC en panne");
        request.setLieu("Salle 01");
        request.setTypeEquipement("Ordinateur de bureau");

        when(panneRepository
            .existsByDemandeurIdAndTitreIgnoreCaseAndLieuIgnoreCaseAndTypeEquipementIgnoreCaseAndStatutIn(
                eq(1L), anyString(), anyString(), anyString(), anyList()))
            .thenReturn(true);

        IllegalStateException ex = assertThrows(IllegalStateException.class,
            () -> panneService.createPanne(request, null));
        assertTrue(ex.getMessage().contains("identique"));
    }

    @Test
    @DisplayName("Relance d'une panne non trouvée doit lever ResourceNotFoundException")
    void relancerDemande_panneInexistante_doitLeverException() {
        when(panneRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(Exception.class,
            () -> panneService.relancerDemande(999L, 1L));
    }

    @Test
    @DisplayName("Relance d'une panne non OUVERTE doit lever IllegalArgumentException")
    void relancerDemande_panneNonOuverte_doitLeverException() {
        Utilisateur demandeur = new Utilisateur();
        demandeur.setId(1L);

        sn.uasz.uasz_maintenance_backend.entities.Panne panne =
            new sn.uasz.uasz_maintenance_backend.entities.Panne();
        panne.setId(1L);
        panne.setDemandeur(demandeur);
        panne.setStatut(StatutPanne.RESOLUE); // pas OUVERTE

        when(panneRepository.findById(1L)).thenReturn(Optional.of(panne));

        assertThrows(IllegalArgumentException.class,
            () -> panneService.relancerDemande(1L, 1L));
    }

    @Test
    @DisplayName("Relance d'une panne appartenant à un autre utilisateur doit lever IllegalArgumentException")
    void relancerDemande_autreUtilisateur_doitLeverException() {
        Utilisateur demandeur = new Utilisateur();
        demandeur.setId(2L); // ID différent

        sn.uasz.uasz_maintenance_backend.entities.Panne panne =
            new sn.uasz.uasz_maintenance_backend.entities.Panne();
        panne.setId(1L);
        panne.setDemandeur(demandeur);
        panne.setStatut(StatutPanne.OUVERTE);

        when(panneRepository.findById(1L)).thenReturn(Optional.of(panne));

        assertThrows(IllegalArgumentException.class,
            () -> panneService.relancerDemande(1L, 1L)); // demandeurId = 1, mais panne appartient à 2
    }
}
