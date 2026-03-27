package sn.uasz.uasz_maintenance_backend.scheduler;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import sn.uasz.uasz_maintenance_backend.entities.Panne;
import sn.uasz.uasz_maintenance_backend.entities.Utilisateur;
import sn.uasz.uasz_maintenance_backend.enums.Role;
import sn.uasz.uasz_maintenance_backend.repositories.PanneRepository;
import sn.uasz.uasz_maintenance_backend.repositories.UtilisateurRepository;
import sn.uasz.uasz_maintenance_backend.services.EmailService;
import sn.uasz.uasz_maintenance_backend.services.NotificationService;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class RelanceDemandeScheduler {

    private static final int JOURS_SEUIL = 2;

    private final PanneRepository panneRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final EmailService emailService;
    private final NotificationService notificationService;

    /**
     * Scheduler automatique DÉSACTIVÉ.
     * Les relances sont désormais déclenchées uniquement par l'action
     * explicite de l'utilisateur via le bouton "Relancer cette demande".
     *
     * Pour réactiver : décommenter @Scheduled(cron = "0 0 8 * * *")
     */
    // @Scheduled(cron = "0 0 8 * * *")
    @Transactional
    public void relancerDemandesNonTraitees() {
        LocalDateTime seuil = LocalDateTime.now().minusDays(JOURS_SEUIL);
        List<Panne> pannesARelancer = panneRepository.findPannesARelancer(seuil);

        if (pannesARelancer.isEmpty()) {
            log.info("✅ Aucune demande à relancer aujourd'hui.");
            return;
        }

        log.info("⏳ {} demande(s) à relancer...", pannesARelancer.size());

        List<Utilisateur> responsables = utilisateurRepository.findByRole(Role.RESPONSABLE_MAINTENANCE);

        for (Panne panne : pannesARelancer) {
            long joursAttente = ChronoUnit.DAYS.between(panne.getDateSignalement(), LocalDateTime.now());
            String lieu = panne.getLieu() != null ? panne.getLieu() : "Non précisé";

            // --- Notifier et emailer le demandeur ---
            if (panne.getDemandeur() != null) {
                Utilisateur demandeur = panne.getDemandeur();
                String nomDemandeur = demandeur.getPrenom() + " " + demandeur.getNom();

                notificationService.createNotification(
                        demandeur.getId(),
                        "⏳ Demande toujours en attente",
                        "Votre demande \"" + panne.getTitre() + "\" n'a pas encore été prise en charge après " + joursAttente + " jour(s). Notre équipe a été relancée.",
                        "WARNING",
                        "PANNE",
                        panne.getId()
                );

                emailService.sendRelanceDemandeEmail(
                        demandeur.getEmail(),
                        nomDemandeur,
                        panne.getTitre(),
                        lieu,
                        joursAttente
                );
            }

            // --- Notifier et emailer tous les responsables ---
            String demandeurNom = panne.getDemandeur() != null
                    ? panne.getDemandeur().getPrenom() + " " + panne.getDemandeur().getNom()
                    : "Inconnu";

            for (Utilisateur responsable : responsables) {
                notificationService.createNotification(
                        responsable.getId(),
                        "🚨 Demande non traitée depuis " + joursAttente + " jour(s)",
                        "La demande \"" + panne.getTitre() + "\" de " + demandeurNom + " est toujours ouverte sans prise en charge.",
                        "URGENT",
                        "PANNE",
                        panne.getId()
                );

                emailService.sendRelanceResponsableEmail(
                        responsable.getEmail(),
                        responsable.getPrenom() + " " + responsable.getNom(),
                        panne.getTitre(),
                        demandeurNom,
                        lieu,
                        joursAttente
                );
            }

            // Mettre à jour la date de dernière relance
            panne.setDateDerniereRelance(LocalDateTime.now());
            panneRepository.save(panne);

            log.info("📧 Relance envoyée pour la panne ID={} ({}j d'attente)", panne.getId(), joursAttente);
        }

        log.info("✅ Relances terminées : {} demande(s) traitée(s).", pannesARelancer.size());
    }
}
