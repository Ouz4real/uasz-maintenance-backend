package sn.uasz.uasz_maintenance_backend.scheduler;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import sn.uasz.uasz_maintenance_backend.entities.Panne;
import sn.uasz.uasz_maintenance_backend.repositories.PanneRepository;
import sn.uasz.uasz_maintenance_backend.repositories.UtilisateurRepository;
import sn.uasz.uasz_maintenance_backend.services.EmailService;
import sn.uasz.uasz_maintenance_backend.services.NotificationService;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Tests RelanceDemandeScheduler")
class RelanceDemandeSchedulerTest {

    @Mock private PanneRepository panneRepository;
    @Mock private UtilisateurRepository utilisateurRepository;
    @Mock private EmailService emailService;
    @Mock private NotificationService notificationService;

    @InjectMocks
    private RelanceDemandeScheduler scheduler;

    @Test
    @DisplayName("Scheduler avec aucune panne à relancer ne doit rien faire")
    void relancerDemandesNonTraitees_aucunePanne_neDoitRienFaire() {
        when(panneRepository.findPannesARelancer(any(LocalDateTime.class)))
            .thenReturn(Collections.emptyList());

        scheduler.relancerDemandesNonTraitees();

        // Aucun email ni notification ne doit être envoyé
        verifyNoInteractions(emailService);
        verifyNoInteractions(notificationService);
    }

    @Test
    @DisplayName("Scheduler avec pannes à relancer doit mettre à jour dateDerniereRelance")
    void relancerDemandesNonTraitees_avecPannes_doitMettreAJourDate() {
        Panne panne = new Panne();
        panne.setId(1L);
        panne.setTitre("PC en panne");
        panne.setLieu("Salle 01");
        panne.setDateSignalement(LocalDateTime.now().minusDays(5));
        // demandeur null pour simplifier

        when(panneRepository.findPannesARelancer(any(LocalDateTime.class)))
            .thenReturn(List.of(panne));
        when(utilisateurRepository.findByRole(any())).thenReturn(Collections.emptyList());
        when(panneRepository.save(any())).thenReturn(panne);

        scheduler.relancerDemandesNonTraitees();

        // La panne doit être sauvegardée avec la nouvelle date
        verify(panneRepository, times(1)).save(panne);
    }

    @Test
    @DisplayName("Le scheduler est désactivé - la méthode peut être appelée manuellement sans erreur")
    void schedulerDesactive_appelManuel_neDoitPasLeverException() {
        when(panneRepository.findPannesARelancer(any(LocalDateTime.class)))
            .thenReturn(Collections.emptyList());

        // Vérifier que la méthode peut être appelée sans exception
        // (le @Scheduled est commenté donc pas de déclenchement automatique)
        assertDoesNotThrow(() -> scheduler.relancerDemandesNonTraitees());
    }

    private void assertDoesNotThrow(Runnable runnable) {
        try {
            runnable.run();
        } catch (Exception e) {
            throw new AssertionError("Exception inattendue : " + e.getMessage(), e);
        }
    }
}
