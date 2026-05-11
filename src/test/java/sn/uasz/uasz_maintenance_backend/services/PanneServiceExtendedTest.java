package sn.uasz.uasz_maintenance_backend.services;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import sn.uasz.uasz_maintenance_backend.entities.Panne;
import sn.uasz.uasz_maintenance_backend.entities.Utilisateur;
import sn.uasz.uasz_maintenance_backend.enums.Priorite;
import sn.uasz.uasz_maintenance_backend.enums.StatutInterventions;
import sn.uasz.uasz_maintenance_backend.enums.StatutPanne;
import sn.uasz.uasz_maintenance_backend.repositories.EquipementRepository;
import sn.uasz.uasz_maintenance_backend.repositories.PanneRepository;
import sn.uasz.uasz_maintenance_backend.repositories.UtilisateurRepository;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("Tests PanneService - Affectation et Interventions")
class PanneServiceExtendedTest {

    @Mock private PanneRepository panneRepository;
    @Mock private EquipementRepository equipementRepository;
    @Mock private UtilisateurRepository utilisateurRepository;
    @Mock private NotificationService notificationService;
    @Mock private EmailService emailService;

    @InjectMocks
    private PanneService panneService;

    // ===== Helpers =====

    private Utilisateur buildTechnicien(Long id) {
        Utilisateur t = new Utilisateur();
        t.setId(id);
        t.setPrenom("Ousmane");
        t.setNom("Mané");
        t.setEmail("tech@zig.univ.sn");
        return t;
    }

    private Utilisateur buildDemandeur(Long id) {
        Utilisateur d = new Utilisateur();
        d.setId(id);
        d.setPrenom("Khadim");
        d.setNom("Gaye");
        d.setEmail("dem@zig.univ.sn");
        return d;
    }

    private Panne buildPanne(Long id, StatutPanne statut, StatutInterventions statutInterventions) {
        Panne p = new Panne();
        p.setId(id);
        p.setTitre("PC en panne");
        p.setLieu("Salle 01");
        p.setTypeEquipement("Ordinateur de bureau");
        p.setStatut(statut);
        p.setStatutInterventions(statutInterventions);
        p.setDateSignalement(LocalDateTime.now().minusDays(1));
        p.setDemandeur(buildDemandeur(10L));
        return p;
    }

    // ===== Tests affecterTechnicien =====

    @Test
    @DisplayName("affecterTechnicien doit passer le statut de OUVERTE à EN_COURS")
    void affecterTechnicien_panneOuverte_doitPasserEnCours() {
        Panne panne = buildPanne(1L, StatutPanne.OUVERTE, StatutInterventions.NON_DEMARREE);
        Utilisateur technicien = buildTechnicien(2L);
        Utilisateur responsable = buildTechnicien(3L);

        when(panneRepository.findById(1L)).thenReturn(Optional.of(panne));
        when(utilisateurRepository.findById(2L)).thenReturn(Optional.of(technicien));
        when(panneRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(utilisateurRepository.findByRole(any())).thenReturn(Collections.emptyList());

        panneService.affecterTechnicien(1L, 2L, responsable);

        assertEquals(StatutPanne.EN_COURS, panne.getStatut());
        assertEquals(technicien, panne.getTechnicien());
    }

    @Test
    @DisplayName("affecterTechnicien doit réinitialiser statutInterventions à NON_DEMARREE")
    void affecterTechnicien_doitReinitialisierStatutInterventions() {
        Panne panne = buildPanne(1L, StatutPanne.EN_COURS, StatutInterventions.DECLINEE);
        Utilisateur technicien = buildTechnicien(2L);

        when(panneRepository.findById(1L)).thenReturn(Optional.of(panne));
        when(utilisateurRepository.findById(2L)).thenReturn(Optional.of(technicien));
        when(panneRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(utilisateurRepository.findByRole(any())).thenReturn(Collections.emptyList());

        panneService.affecterTechnicien(1L, 2L, new Utilisateur());

        assertEquals(StatutInterventions.NON_DEMARREE, panne.getStatutInterventions());
        assertNull(panne.getRaisonRefus());
        assertNull(panne.getDateRefus());
    }

    @Test
    @DisplayName("affecterTechnicien avec panne inexistante doit lever une exception")
    void affecterTechnicien_panneInexistante_doitLeverException() {
        when(panneRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class,
            () -> panneService.affecterTechnicien(999L, 1L, new Utilisateur()));
    }

    @Test
    @DisplayName("affecterTechnicien avec technicien inexistant doit lever une exception")
    void affecterTechnicien_technicienInexistant_doitLeverException() {
        Panne panne = buildPanne(1L, StatutPanne.OUVERTE, StatutInterventions.NON_DEMARREE);

        when(panneRepository.findById(1L)).thenReturn(Optional.of(panne));
        when(utilisateurRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class,
            () -> panneService.affecterTechnicien(1L, 999L, new Utilisateur()));
    }

    // ===== Tests demarrerIntervention =====

    @Test
    @DisplayName("demarrerIntervention doit passer statutInterventions à EN_COURS")
    void demarrerIntervention_doitPasserEnCours() {
        Utilisateur technicien = buildTechnicien(2L);
        Panne panne = buildPanne(1L, StatutPanne.EN_COURS, StatutInterventions.NON_DEMARREE);
        panne.setTechnicien(technicien);

        when(panneRepository.findById(1L)).thenReturn(Optional.of(panne));
        when(panneRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(utilisateurRepository.findByRole(any())).thenReturn(Collections.emptyList());

        panneService.demarrerIntervention(1L, 2L);

        assertEquals(StatutInterventions.EN_COURS, panne.getStatutInterventions());
        assertNotNull(panne.getDateDebutIntervention());
    }

    @Test
    @DisplayName("demarrerIntervention par un technicien non affecté doit lever une exception")
    void demarrerIntervention_mauvaisTechnicien_doitLeverException() {
        Utilisateur technicien = buildTechnicien(2L);
        Panne panne = buildPanne(1L, StatutPanne.EN_COURS, StatutInterventions.NON_DEMARREE);
        panne.setTechnicien(technicien);

        when(panneRepository.findById(1L)).thenReturn(Optional.of(panne));

        // Technicien 99 essaie de démarrer une intervention affectée au technicien 2
        assertThrows(IllegalArgumentException.class,
            () -> panneService.demarrerIntervention(1L, 99L));
    }

    @Test
    @DisplayName("demarrerIntervention déjà en cours doit lever une exception")
    void demarrerIntervention_dejaEnCours_doitLeverException() {
        Utilisateur technicien = buildTechnicien(2L);
        Panne panne = buildPanne(1L, StatutPanne.EN_COURS, StatutInterventions.EN_COURS);
        panne.setTechnicien(technicien);

        when(panneRepository.findById(1L)).thenReturn(Optional.of(panne));

        assertThrows(IllegalArgumentException.class,
            () -> panneService.demarrerIntervention(1L, 2L));
    }

    // ===== Tests terminerIntervention =====

    @Test
    @DisplayName("terminerIntervention doit passer statutInterventions à TERMINEE")
    void terminerIntervention_doitPasserTerminee() {
        Utilisateur technicien = buildTechnicien(2L);
        Panne panne = buildPanne(1L, StatutPanne.EN_COURS, StatutInterventions.EN_COURS);
        panne.setTechnicien(technicien);

        when(panneRepository.findById(1L)).thenReturn(Optional.of(panne));
        when(panneRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(utilisateurRepository.findByRole(any())).thenReturn(Collections.emptyList());

        panneService.terminerIntervention(1L, 2L, "Réparation effectuée", null, null);

        assertEquals(StatutInterventions.TERMINEE, panne.getStatutInterventions());
        assertNotNull(panne.getDateFinIntervention());
        assertEquals("Réparation effectuée", panne.getNoteTechnicien());
    }

    @Test
    @DisplayName("terminerIntervention non en cours doit lever une exception")
    void terminerIntervention_nonEnCours_doitLeverException() {
        Utilisateur technicien = buildTechnicien(2L);
        Panne panne = buildPanne(1L, StatutPanne.EN_COURS, StatutInterventions.NON_DEMARREE);
        panne.setTechnicien(technicien);

        when(panneRepository.findById(1L)).thenReturn(Optional.of(panne));

        assertThrows(IllegalArgumentException.class,
            () -> panneService.terminerIntervention(1L, 2L, null, null, null));
    }

    // ===== Tests marquerPanneResolue =====

    @Test
    @DisplayName("marquerPanneResolue doit passer le statut à RESOLUE")
    void marquerPanneResolue_doitPasserResolue() {
        Panne panne = buildPanne(1L, StatutPanne.EN_COURS, StatutInterventions.TERMINEE);

        when(panneRepository.findById(1L)).thenReturn(Optional.of(panne));
        when(panneRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        panneService.marquerPanneResolue(1L, true);

        assertEquals(StatutPanne.RESOLUE, panne.getStatut());
    }

    @Test
    @DisplayName("marquerPanneResolue avec false ne doit pas changer le statut")
    void marquerPanneResolue_false_neDoitPasChanger() {
        Panne panne = buildPanne(1L, StatutPanne.EN_COURS, StatutInterventions.TERMINEE);

        when(panneRepository.findById(1L)).thenReturn(Optional.of(panne));
        when(panneRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        panneService.marquerPanneResolue(1L, false);

        assertNotEquals(StatutPanne.RESOLUE, panne.getStatut());
    }

    // ===== Tests refuserIntervention =====

    @Test
    @DisplayName("refuserIntervention doit enregistrer la raison du refus")
    void refuserIntervention_doitEnregistrerRaison() {
        Utilisateur technicien = buildTechnicien(2L);
        Panne panne = buildPanne(1L, StatutPanne.EN_COURS, StatutInterventions.NON_DEMARREE);
        panne.setTechnicien(technicien);

        when(panneRepository.findById(1L)).thenReturn(Optional.of(panne));
        when(panneRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(utilisateurRepository.findByRole(any())).thenReturn(Collections.emptyList());
        when(utilisateurRepository.findById(2L)).thenReturn(Optional.of(technicien));

        panneService.refuserIntervention(1L, 2L, "Pas disponible");

        assertEquals("Pas disponible", panne.getRaisonRefus());
        assertNotNull(panne.getDateRefus());
        assertEquals(StatutInterventions.DECLINEE, panne.getStatutInterventions());
    }

    @Test
    @DisplayName("refuserIntervention par un technicien non affecté doit lever une exception")
    void refuserIntervention_mauvaisTechnicien_doitLeverException() {
        Utilisateur technicien = buildTechnicien(2L);
        Panne panne = buildPanne(1L, StatutPanne.EN_COURS, StatutInterventions.NON_DEMARREE);
        panne.setTechnicien(technicien);

        when(panneRepository.findById(1L)).thenReturn(Optional.of(panne));

        assertThrows(IllegalArgumentException.class,
            () -> panneService.refuserIntervention(1L, 99L, "Raison"));
    }

    // ===== Tests technicienEstOccupe =====

    @Test
    @DisplayName("technicienEstOccupe doit retourner true si technicien a une intervention EN_COURS")
    void technicienEstOccupe_avecInterventionEnCours_doitRetournerTrue() {
        when(panneRepository.existsByTechnicienIdAndStatutInterventions(
            1L, StatutInterventions.EN_COURS)).thenReturn(true);

        assertTrue(panneService.technicienEstOccupe(1L));
    }

    @Test
    @DisplayName("technicienEstOccupe doit retourner false si technicien est libre")
    void technicienEstOccupe_sansIntervention_doitRetournerFalse() {
        when(panneRepository.existsByTechnicienIdAndStatutInterventions(
            1L, StatutInterventions.EN_COURS)).thenReturn(false);

        assertFalse(panneService.technicienEstOccupe(1L));
    }
}
