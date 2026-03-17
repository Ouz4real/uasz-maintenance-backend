package sn.uasz.uasz_maintenance_backend.services.impl;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import sn.uasz.uasz_maintenance_backend.services.EmailService;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailServiceImpl implements EmailService {

    private final JavaMailSender mailSender;

    @Value("${app.email.from}")
    private String fromEmail;

    @Value("${app.email.enabled:true}")
    private boolean emailEnabled;

    @Override
    @Async
    public void sendNewDemandeEmail(String toEmail, String demandeurNom, String description, String equipement) {
        if (!emailEnabled) {
            log.info("Email désactivé - Email non envoyé à {}", toEmail);
            return;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject("Confirmation de votre demande de maintenance - UASZ");

            String htmlContent = buildNewDemandeEmailTemplate(demandeurNom, description, equipement);
            helper.setText(htmlContent, true);

            mailSender.send(message);
            log.info("Email de nouvelle demande envoyé avec succès à {}", toEmail);

        } catch (MessagingException e) {
            log.error("Erreur lors de l'envoi de l'email à {}: {}", toEmail, e.getMessage());
        }
    }

    @Override
    @Async
    public void sendNotificationEmail(String toEmail, String userName, String notificationMessage) {
        if (!emailEnabled) {
            log.info("Email désactivé - Email non envoyé à {}", toEmail);
            return;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject("Nouvelle notification - UASZ Maintenance");

            String htmlContent = buildNotificationEmailTemplate(userName, notificationMessage);
            helper.setText(htmlContent, true);

            mailSender.send(message);
            log.info("Email de notification envoyé avec succès à {}", toEmail);

        } catch (MessagingException e) {
            log.error("Erreur lors de l'envoi de l'email de notification à {}: {}", toEmail, e.getMessage());
        }
    }

    private String buildNewDemandeEmailTemplate(String demandeurNom, String description, String equipement) {
        String dateActuelle = LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy à HH:mm"));
        
        return """
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background-color: #2c3e50; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
                    .content { background-color: #f9f9f9; padding: 30px; border: 1px solid #ddd; }
                    .info-box { background-color: white; padding: 15px; margin: 15px 0; border-left: 4px solid #3498db; }
                    .footer { background-color: #ecf0f1; padding: 15px; text-align: center; font-size: 12px; color: #7f8c8d; border-radius: 0 0 5px 5px; }
                    .highlight { color: #2c3e50; font-weight: bold; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h2>🔧 UASZ - Plateforme de Maintenance</h2>
                    </div>
                    <div class="content">
                        <p>Bonjour <span class="highlight">%s</span>,</p>
                        
                        <p>Nous avons bien reçu votre demande de maintenance. Votre demande a été enregistrée avec succès dans notre système.</p>
                        
                        <div class="info-box">
                            <p><strong>📋 Détails de votre demande :</strong></p>
                            <p><strong>Équipement :</strong> %s</p>
                            <p><strong>Description :</strong> %s</p>
                            <p><strong>Date de soumission :</strong> %s</p>
                        </div>
                        
                        <p>Votre demande est actuellement <span class="highlight">en attente de traitement</span>. Notre équipe technique va l'examiner dans les plus brefs délais.</p>
                        
                        <p>Vous recevrez une notification par email dès qu'un technicien sera affecté à votre demande.</p>
                        
                        <p>Vous pouvez suivre l'état de votre demande en vous connectant à votre tableau de bord sur la plateforme.</p>
                        
                        <p>Cordialement,<br>
                        <strong>L'équipe de maintenance UASZ</strong></p>
                    </div>
                    <div class="footer">
                        <p>Ceci est un email automatique, merci de ne pas y répondre.</p>
                        <p>© 2026 UASZ - Université Assane Seck de Ziguinchor</p>
                    </div>
                </div>
            </body>
            </html>
            """.formatted(demandeurNom, equipement, description, dateActuelle);
    }

    private String buildNotificationEmailTemplate(String userName, String notificationMessage) {
        String dateActuelle = LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy à HH:mm"));
        
        return """
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background-color: #27ae60; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
                    .content { background-color: #f9f9f9; padding: 30px; border: 1px solid #ddd; }
                    .notification-box { background-color: #e8f8f5; padding: 20px; margin: 15px 0; border-left: 4px solid #27ae60; border-radius: 5px; }
                    .footer { background-color: #ecf0f1; padding: 15px; text-align: center; font-size: 12px; color: #7f8c8d; border-radius: 0 0 5px 5px; }
                    .highlight { color: #27ae60; font-weight: bold; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h2>🔔 Nouvelle Notification</h2>
                    </div>
                    <div class="content">
                        <p>Bonjour <span class="highlight">%s</span>,</p>
                        
                        <p>Vous avez reçu une nouvelle notification sur la plateforme UASZ Maintenance :</p>
                        
                        <div class="notification-box">
                            <p><strong>%s</strong></p>
                            <p style="color: #7f8c8d; font-size: 14px; margin-top: 10px;">Reçu le %s</p>
                        </div>
                        
                        <p>Connectez-vous à votre tableau de bord pour voir plus de détails et gérer vos demandes.</p>
                        
                        <p>Cordialement,<br>
                        <strong>L'équipe de maintenance UASZ</strong></p>
                    </div>
                    <div class="footer">
                        <p>Ceci est un email automatique, merci de ne pas y répondre.</p>
                        <p>© 2026 UASZ - Université Assane Seck de Ziguinchor</p>
                    </div>
                </div>
            </body>
            </html>
            """.formatted(userName, notificationMessage, dateActuelle);
    }

    @Override
    @Async
    public void sendDemandeAffecteeEmail(String toEmail, String demandeurNom, String titreDemande, String technicienNom, String dateAffectation) {
        if (!emailEnabled) {
            log.info("Email désactivé - Email non envoyé à {}", toEmail);
            return;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject("Votre demande a été prise en charge - UASZ");

            String htmlContent = buildDemandeAffecteeEmailTemplate(demandeurNom, titreDemande, technicienNom, dateAffectation);
            helper.setText(htmlContent, true);

            mailSender.send(message);
            log.info("Email d'affectation envoyé avec succès à {}", toEmail);

        } catch (MessagingException e) {
            log.error("Erreur lors de l'envoi de l'email d'affectation à {}: {}", toEmail, e.getMessage());
        }
    }

    @Override
    @Async
    public void sendDemandeResolueEmail(String toEmail, String demandeurNom, String titreDemande, String technicienNom, String dateResolution, String commentaire) {
        if (!emailEnabled) {
            log.info("Email désactivé - Email non envoyé à {}", toEmail);
            return;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject("Votre demande a été résolue - UASZ");

            String htmlContent = buildDemandeResolueEmailTemplate(demandeurNom, titreDemande, technicienNom, dateResolution, commentaire);
            helper.setText(htmlContent, true);

            mailSender.send(message);
            log.info("Email de résolution envoyé avec succès à {}", toEmail);

        } catch (MessagingException e) {
            log.error("Erreur lors de l'envoi de l'email de résolution à {}: {}", toEmail, e.getMessage());
        }
    }

    private String buildDemandeAffecteeEmailTemplate(String demandeurNom, String titreDemande, String technicienNom, String dateAffectation) {
        return """
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background-color: #3498db; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
                    .content { background-color: #f9f9f9; padding: 30px; border: 1px solid #ddd; }
                    .info-box { background-color: #e3f2fd; padding: 20px; margin: 15px 0; border-left: 4px solid #3498db; border-radius: 5px; }
                    .technicien-box { background-color: #fff3cd; padding: 15px; margin: 15px 0; border-left: 4px solid #ffc107; border-radius: 5px; }
                    .footer { background-color: #ecf0f1; padding: 15px; text-align: center; font-size: 12px; color: #7f8c8d; border-radius: 0 0 5px 5px; }
                    .highlight { color: #3498db; font-weight: bold; }
                    .icon { font-size: 24px; margin-right: 10px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h2>👨‍🔧 Demande Prise en Charge</h2>
                    </div>
                    <div class="content">
                        <p>Bonjour <span class="highlight">%s</span>,</p>
                        
                        <p>Bonne nouvelle ! Votre demande de maintenance a été prise en charge par notre équipe technique.</p>
                        
                        <div class="info-box">
                            <p><strong>📋 Votre demande :</strong></p>
                            <p style="font-size: 16px; margin: 10px 0;"><strong>%s</strong></p>
                        </div>
                        
                        <div class="technicien-box">
                            <p><strong>👨‍🔧 Technicien affecté :</strong></p>
                            <p style="font-size: 16px; margin: 10px 0;"><strong>%s</strong></p>
                            <p style="color: #666; font-size: 14px;">Date d'affectation : %s</p>
                        </div>
                        
                        <p>Notre technicien va prendre contact avec vous prochainement pour planifier l'intervention.</p>
                        
                        <p>Vous pouvez suivre l'évolution de votre demande en temps réel sur votre tableau de bord.</p>
                        
                        <p style="margin-top: 20px;">Si vous avez des questions, n'hésitez pas à nous contacter.</p>
                        
                        <p>Cordialement,<br>
                        <strong>L'équipe de maintenance UASZ</strong></p>
                    </div>
                    <div class="footer">
                        <p>Ceci est un email automatique, merci de ne pas y répondre.</p>
                        <p>© 2026 UASZ - Université Assane Seck de Ziguinchor</p>
                    </div>
                </div>
            </body>
            </html>
            """.formatted(demandeurNom, titreDemande, technicienNom, dateAffectation);
    }

    private String buildDemandeResolueEmailTemplate(String demandeurNom, String titreDemande, String technicienNom, String dateResolution, String commentaire) {
        String commentaireSection = (commentaire != null && !commentaire.isBlank()) 
            ? "<div class=\"comment-box\"><p><strong>💬 Commentaire du technicien :</strong></p><p style=\"font-style: italic; color: #555;\">\"" + commentaire + "\"</p></div>"
            : "";
            
        return """
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background-color: #27ae60; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
                    .content { background-color: #f9f9f9; padding: 30px; border: 1px solid #ddd; }
                    .success-box { background-color: #d4edda; padding: 20px; margin: 15px 0; border-left: 4px solid #28a745; border-radius: 5px; text-align: center; }
                    .info-box { background-color: white; padding: 15px; margin: 15px 0; border: 1px solid #ddd; border-radius: 5px; }
                    .comment-box { background-color: #f8f9fa; padding: 15px; margin: 15px 0; border-left: 4px solid #6c757d; border-radius: 5px; }
                    .footer { background-color: #ecf0f1; padding: 15px; text-align: center; font-size: 12px; color: #7f8c8d; border-radius: 0 0 5px 5px; }
                    .highlight { color: #27ae60; font-weight: bold; }
                    .checkmark { font-size: 48px; color: #28a745; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h2>✅ Demande Résolue</h2>
                    </div>
                    <div class="content">
                        <p>Bonjour <span class="highlight">%s</span>,</p>
                        
                        <div class="success-box">
                            <div class="checkmark">✓</div>
                            <h3 style="color: #28a745; margin: 10px 0;">Intervention Terminée avec Succès</h3>
                        </div>
                        
                        <p>Nous avons le plaisir de vous informer que votre demande de maintenance a été résolue.</p>
                        
                        <div class="info-box">
                            <p><strong>📋 Demande :</strong> %s</p>
                            <p><strong>👨‍🔧 Technicien :</strong> %s</p>
                            <p><strong>📅 Date de résolution :</strong> %s</p>
                        </div>
                        
                        %s
                        
                        <p>Nous espérons que cette intervention a répondu à vos attentes.</p>
                        
                        <p style="background-color: #fff3cd; padding: 15px; border-radius: 5px; border-left: 4px solid #ffc107;">
                            <strong>💡 Votre avis compte !</strong><br>
                            Si vous rencontrez à nouveau un problème avec cet équipement, n'hésitez pas à créer une nouvelle demande.
                        </p>
                        
                        <p style="margin-top: 20px;">Merci de votre confiance.</p>
                        
                        <p>Cordialement,<br>
                        <strong>L'équipe de maintenance UASZ</strong></p>
                    </div>
                    <div class="footer">
                        <p>Ceci est un email automatique, merci de ne pas y répondre.</p>
                        <p>© 2026 UASZ - Université Assane Seck de Ziguinchor</p>
                    </div>
                </div>
            </body>
            </html>
            """.formatted(demandeurNom, titreDemande, technicienNom, dateResolution, commentaireSection);
    }

    @Override
    @Async
    public void sendDemandePriseEnChargeEmail(String toEmail, String demandeurNom, String titreDemande, String technicienNom, String dateDebut) {
        if (!emailEnabled) {
            log.info("Email désactivé - Email non envoyé à {}", toEmail);
            return;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject("Votre demande est en cours de traitement - UASZ");

            String htmlContent = buildDemandePriseEnChargeEmailTemplate(demandeurNom, titreDemande, technicienNom, dateDebut);
            helper.setText(htmlContent, true);

            mailSender.send(message);
            log.info("Email de prise en charge envoyé avec succès à {}", toEmail);

        } catch (MessagingException e) {
            log.error("Erreur lors de l'envoi de l'email de prise en charge à {}: {}", toEmail, e.getMessage());
        }
    }

    private String buildDemandePriseEnChargeEmailTemplate(String demandeurNom, String titreDemande, String technicienNom, String dateDebut) {
        return """
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background-color: #e67e22; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
                    .content { background-color: #f9f9f9; padding: 30px; border: 1px solid #ddd; }
                    .info-box { background-color: #fef9e7; padding: 20px; margin: 15px 0; border-left: 4px solid #e67e22; border-radius: 5px; }
                    .technicien-box { background-color: #eafaf1; padding: 15px; margin: 15px 0; border-left: 4px solid #27ae60; border-radius: 5px; }
                    .status-badge { display: inline-block; background-color: #e67e22; color: white; padding: 6px 16px; border-radius: 20px; font-weight: bold; font-size: 14px; }
                    .footer { background-color: #ecf0f1; padding: 15px; text-align: center; font-size: 12px; color: #7f8c8d; border-radius: 0 0 5px 5px; }
                    .highlight { color: #e67e22; font-weight: bold; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h2>🔧 Intervention en Cours</h2>
                        <p style="margin: 5px 0; font-size: 14px; opacity: 0.9;">Votre demande est maintenant prise en charge</p>
                    </div>
                    <div class="content">
                        <p>Bonjour <span class="highlight">%s</span>,</p>

                        <p>Nous vous informons que votre demande de maintenance est désormais <strong>en cours de traitement</strong>.</p>

                        <div class="info-box">
                            <p><strong>📋 Demande concernée :</strong></p>
                            <p style="font-size: 16px; margin: 8px 0;"><strong>%s</strong></p>
                            <p><span class="status-badge">🔧 EN COURS</span></p>
                        </div>

                        <div class="technicien-box">
                            <p><strong>👨‍🔧 Technicien en charge :</strong></p>
                            <p style="font-size: 16px; margin: 8px 0;"><strong>%s</strong></p>
                            <p style="color: #555; font-size: 14px;">📅 Début de l'intervention : <strong>%s</strong></p>
                        </div>

                        <p>Notre technicien travaille activement sur votre demande. Vous serez notifié dès que l'intervention sera terminée.</p>

                        <p>Vous pouvez suivre l'avancement en temps réel depuis votre tableau de bord.</p>

                        <p style="margin-top: 20px;">Merci de votre patience.</p>

                        <p>Cordialement,<br>
                        <strong>L'équipe de maintenance UASZ</strong></p>
                    </div>
                    <div class="footer">
                        <p>Ceci est un email automatique, merci de ne pas y répondre.</p>
                        <p>© 2026 UASZ - Université Assane Seck de Ziguinchor</p>
                    </div>
                </div>
            </body>
            </html>
            """.formatted(demandeurNom, titreDemande, technicienNom, dateDebut);
    }

    // =====================================================================
    // EMAILS RESPONSABLE
    // =====================================================================

    @Override
    @Async
    public void sendNouvelleDemandeResponsableEmail(String toEmail, String responsableNom, String titreDemande, String demandeurNom, String lieu, String priorite, String date) {
        if (!emailEnabled) { log.info("Email désactivé - Email non envoyé à {}", toEmail); return; }
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject("Nouvelle demande de maintenance - " + titreDemande);
            helper.setText("""
                <!DOCTYPE html><html><head><meta charset="UTF-8">
                <style>
                  body{font-family:Arial,sans-serif;line-height:1.6;color:#333}
                  .container{max-width:600px;margin:0 auto;padding:20px}
                  .header{background:#2c3e50;color:white;padding:20px;text-align:center;border-radius:5px 5px 0 0}
                  .content{background:#f9f9f9;padding:30px;border:1px solid #ddd}
                  .info-box{background:#eaf4fb;padding:15px;margin:15px 0;border-left:4px solid #2980b9;border-radius:5px}
                  .badge{display:inline-block;padding:4px 12px;border-radius:12px;font-weight:bold;font-size:13px}
                  .badge-haute{background:#e74c3c;color:white}
                  .badge-moyenne{background:#f39c12;color:white}
                  .badge-basse{background:#27ae60;color:white}
                  .footer{background:#ecf0f1;padding:15px;text-align:center;font-size:12px;color:#7f8c8d;border-radius:0 0 5px 5px}
                  .highlight{color:#2980b9;font-weight:bold}
                </style></head><body>
                <div class="container">
                  <div class="header"><h2>📋 Nouvelle Demande de Maintenance</h2></div>
                  <div class="content">
                    <p>Bonjour <span class="highlight">%s</span>,</p>
                    <p>Une nouvelle demande de maintenance vient d'être soumise et nécessite votre attention.</p>
                    <div class="info-box">
                      <p><strong>📌 Titre :</strong> %s</p>
                      <p><strong>👤 Demandeur :</strong> %s</p>
                      <p><strong>📍 Lieu :</strong> %s</p>
                      <p><strong>⚡ Priorité :</strong> <span class="badge badge-%s">%s</span></p>
                      <p><strong>🕐 Date :</strong> %s</p>
                    </div>
                    <p>Veuillez vous connecter à votre tableau de bord pour traiter cette demande.</p>
                    <p>Cordialement,<br><strong>Système de maintenance UASZ</strong></p>
                  </div>
                  <div class="footer"><p>Ceci est un email automatique, merci de ne pas y répondre.</p><p>© 2026 UASZ</p></div>
                </div></body></html>
                """.formatted(responsableNom, titreDemande, demandeurNom, lieu, priorite.toLowerCase(), priorite, date), true);
            mailSender.send(message);
            log.info("Email nouvelle demande envoyé au responsable {}", toEmail);
        } catch (MessagingException e) {
            log.error("Erreur email responsable nouvelle demande: {}", e.getMessage());
        }
    }

    @Override
    @Async
    public void sendDemandeAccepteeResponsableEmail(String toEmail, String responsableNom, String titreDemande, String technicienNom, String date) {
        if (!emailEnabled) { log.info("Email désactivé - Email non envoyé à {}", toEmail); return; }
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject("Intervention acceptée - " + titreDemande);
            helper.setText("""
                <!DOCTYPE html><html><head><meta charset="UTF-8">
                <style>
                  body{font-family:Arial,sans-serif;line-height:1.6;color:#333}
                  .container{max-width:600px;margin:0 auto;padding:20px}
                  .header{background:#27ae60;color:white;padding:20px;text-align:center;border-radius:5px 5px 0 0}
                  .content{background:#f9f9f9;padding:30px;border:1px solid #ddd}
                  .info-box{background:#eafaf1;padding:15px;margin:15px 0;border-left:4px solid #27ae60;border-radius:5px}
                  .footer{background:#ecf0f1;padding:15px;text-align:center;font-size:12px;color:#7f8c8d;border-radius:0 0 5px 5px}
                  .highlight{color:#27ae60;font-weight:bold}
                </style></head><body>
                <div class="container">
                  <div class="header"><h2>✅ Intervention Acceptée</h2></div>
                  <div class="content">
                    <p>Bonjour <span class="highlight">%s</span>,</p>
                    <p>Un technicien a accepté et démarré l'intervention sur la demande suivante.</p>
                    <div class="info-box">
                      <p><strong>📌 Demande :</strong> %s</p>
                      <p><strong>👨‍🔧 Technicien :</strong> %s</p>
                      <p><strong>🕐 Date de début :</strong> %s</p>
                    </div>
                    <p>L'intervention est maintenant en cours. Vous serez notifié à sa résolution.</p>
                    <p>Cordialement,<br><strong>Système de maintenance UASZ</strong></p>
                  </div>
                  <div class="footer"><p>Ceci est un email automatique, merci de ne pas y répondre.</p><p>© 2026 UASZ</p></div>
                </div></body></html>
                """.formatted(responsableNom, titreDemande, technicienNom, date), true);
            mailSender.send(message);
            log.info("Email intervention acceptée envoyé au responsable {}", toEmail);
        } catch (MessagingException e) {
            log.error("Erreur email responsable intervention acceptée: {}", e.getMessage());
        }
    }

    @Override
    @Async
    public void sendDemandeDeclineeResponsableEmail(String toEmail, String responsableNom, String titreDemande, String technicienNom, String raisonRefus, String date) {
        if (!emailEnabled) { log.info("Email désactivé - Email non envoyé à {}", toEmail); return; }
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject("⚠️ Intervention déclinée - " + titreDemande);
            helper.setText("""
                <!DOCTYPE html><html><head><meta charset="UTF-8">
                <style>
                  body{font-family:Arial,sans-serif;line-height:1.6;color:#333}
                  .container{max-width:600px;margin:0 auto;padding:20px}
                  .header{background:#e74c3c;color:white;padding:20px;text-align:center;border-radius:5px 5px 0 0}
                  .content{background:#f9f9f9;padding:30px;border:1px solid #ddd}
                  .info-box{background:#fdf2f2;padding:15px;margin:15px 0;border-left:4px solid #e74c3c;border-radius:5px}
                  .raison-box{background:#fff3cd;padding:15px;margin:15px 0;border-left:4px solid #f39c12;border-radius:5px}
                  .footer{background:#ecf0f1;padding:15px;text-align:center;font-size:12px;color:#7f8c8d;border-radius:0 0 5px 5px}
                  .highlight{color:#e74c3c;font-weight:bold}
                </style></head><body>
                <div class="container">
                  <div class="header"><h2>⚠️ Intervention Déclinée</h2></div>
                  <div class="content">
                    <p>Bonjour <span class="highlight">%s</span>,</p>
                    <p>Un technicien a décliné l'intervention. Une réaffectation est nécessaire.</p>
                    <div class="info-box">
                      <p><strong>📌 Demande :</strong> %s</p>
                      <p><strong>👨‍🔧 Technicien :</strong> %s</p>
                      <p><strong>🕐 Date :</strong> %s</p>
                    </div>
                    <div class="raison-box">
                      <p><strong>💬 Raison du refus :</strong></p>
                      <p>%s</p>
                    </div>
                    <p>Veuillez vous connecter à votre tableau de bord pour réaffecter cette demande.</p>
                    <p>Cordialement,<br><strong>Système de maintenance UASZ</strong></p>
                  </div>
                  <div class="footer"><p>Ceci est un email automatique, merci de ne pas y répondre.</p><p>© 2026 UASZ</p></div>
                </div></body></html>
                """.formatted(responsableNom, titreDemande, technicienNom, date, raisonRefus), true);
            mailSender.send(message);
            log.info("Email intervention déclinée envoyé au responsable {}", toEmail);
        } catch (MessagingException e) {
            log.error("Erreur email responsable intervention déclinée: {}", e.getMessage());
        }
    }

    @Override
    @Async
    public void sendDemandeResolueResponsableEmail(String toEmail, String responsableNom, String titreDemande, String technicienNom, String date) {
        if (!emailEnabled) { log.info("Email désactivé - Email non envoyé à {}", toEmail); return; }
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject("Demande résolue - " + titreDemande);
            helper.setText("""
                <!DOCTYPE html><html><head><meta charset="UTF-8">
                <style>
                  body{font-family:Arial,sans-serif;line-height:1.6;color:#333}
                  .container{max-width:600px;margin:0 auto;padding:20px}
                  .header{background:#8e44ad;color:white;padding:20px;text-align:center;border-radius:5px 5px 0 0}
                  .content{background:#f9f9f9;padding:30px;border:1px solid #ddd}
                  .info-box{background:#f5eef8;padding:15px;margin:15px 0;border-left:4px solid #8e44ad;border-radius:5px}
                  .footer{background:#ecf0f1;padding:15px;text-align:center;font-size:12px;color:#7f8c8d;border-radius:0 0 5px 5px}
                  .highlight{color:#8e44ad;font-weight:bold}
                </style></head><body>
                <div class="container">
                  <div class="header"><h2>✅ Demande Résolue</h2></div>
                  <div class="content">
                    <p>Bonjour <span class="highlight">%s</span>,</p>
                    <p>Une demande de maintenance a été marquée comme résolue.</p>
                    <div class="info-box">
                      <p><strong>📌 Demande :</strong> %s</p>
                      <p><strong>👨‍🔧 Technicien :</strong> %s</p>
                      <p><strong>🕐 Date de résolution :</strong> %s</p>
                    </div>
                    <p>Cordialement,<br><strong>Système de maintenance UASZ</strong></p>
                  </div>
                  <div class="footer"><p>Ceci est un email automatique, merci de ne pas y répondre.</p><p>© 2026 UASZ</p></div>
                </div></body></html>
                """.formatted(responsableNom, titreDemande, technicienNom, date), true);
            mailSender.send(message);
            log.info("Email demande résolue envoyé au responsable {}", toEmail);
        } catch (MessagingException e) {
            log.error("Erreur email responsable demande résolue: {}", e.getMessage());
        }
    }

    // =====================================================================
    // EMAIL TECHNICIEN
    // =====================================================================

    @Override
    @Async
    public void sendDemandeAffecteeTechnicienEmail(String toEmail, String technicienNom, String titreDemande, String demandeurNom, String lieu, String priorite, String date) {
        if (!emailEnabled) { log.info("Email désactivé - Email non envoyé à {}", toEmail); return; }
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject("Nouvelle intervention assignée - " + titreDemande);
            helper.setText("""
                <!DOCTYPE html><html><head><meta charset="UTF-8">
                <style>
                  body{font-family:Arial,sans-serif;line-height:1.6;color:#333}
                  .container{max-width:600px;margin:0 auto;padding:20px}
                  .header{background:#2980b9;color:white;padding:20px;text-align:center;border-radius:5px 5px 0 0}
                  .content{background:#f9f9f9;padding:30px;border:1px solid #ddd}
                  .info-box{background:#eaf4fb;padding:15px;margin:15px 0;border-left:4px solid #2980b9;border-radius:5px}
                  .badge{display:inline-block;padding:4px 12px;border-radius:12px;font-weight:bold;font-size:13px}
                  .badge-haute{background:#e74c3c;color:white}
                  .badge-moyenne{background:#f39c12;color:white}
                  .badge-basse{background:#27ae60;color:white}
                  .footer{background:#ecf0f1;padding:15px;text-align:center;font-size:12px;color:#7f8c8d;border-radius:0 0 5px 5px}
                  .highlight{color:#2980b9;font-weight:bold}
                </style></head><body>
                <div class="container">
                  <div class="header"><h2>🔧 Nouvelle Intervention Assignée</h2></div>
                  <div class="content">
                    <p>Bonjour <span class="highlight">%s</span>,</p>
                    <p>Une nouvelle intervention vous a été assignée. Veuillez en prendre connaissance et l'accepter ou la décliner depuis votre tableau de bord.</p>
                    <div class="info-box">
                      <p><strong>📌 Demande :</strong> %s</p>
                      <p><strong>👤 Demandeur :</strong> %s</p>
                      <p><strong>📍 Lieu :</strong> %s</p>
                      <p><strong>⚡ Priorité :</strong> <span class="badge badge-%s">%s</span></p>
                      <p><strong>🕐 Date d'affectation :</strong> %s</p>
                    </div>
                    <p>Merci de traiter cette demande dans les meilleurs délais.</p>
                    <p>Cordialement,<br><strong>Système de maintenance UASZ</strong></p>
                  </div>
                  <div class="footer"><p>Ceci est un email automatique, merci de ne pas y répondre.</p><p>© 2026 UASZ</p></div>
                </div></body></html>
                """.formatted(technicienNom, titreDemande, demandeurNom, lieu, priorite.toLowerCase(), priorite, date), true);
            mailSender.send(message);
            log.info("Email affectation envoyé au technicien {}", toEmail);
        } catch (MessagingException e) {
            log.error("Erreur email technicien affectation: {}", e.getMessage());
        }
    }

    // =====================================================================
    // EMAIL ADMIN
    // =====================================================================

    @Override
    @Async
    public void sendNouvelUtilisateurAdminEmail(String toEmail, String adminNom, String nouvelUtilisateurNom, String username, String email, String date) {
        if (!emailEnabled) { log.info("Email désactivé - Email non envoyé à {}", toEmail); return; }
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject("Nouvel utilisateur inscrit - " + nouvelUtilisateurNom);
            helper.setText("""
                <!DOCTYPE html><html><head><meta charset="UTF-8">
                <style>
                  body{font-family:Arial,sans-serif;line-height:1.6;color:#333}
                  .container{max-width:600px;margin:0 auto;padding:20px}
                  .header{background:#8e44ad;color:white;padding:20px;text-align:center;border-radius:5px 5px 0 0}
                  .content{background:#f9f9f9;padding:30px;border:1px solid #ddd}
                  .info-box{background:#f5eef8;padding:15px;margin:15px 0;border-left:4px solid #8e44ad;border-radius:5px}
                  .footer{background:#ecf0f1;padding:15px;text-align:center;font-size:12px;color:#7f8c8d;border-radius:0 0 5px 5px}
                  .highlight{color:#8e44ad;font-weight:bold}
                </style></head><body>
                <div class="container">
                  <div class="header"><h2>👤 Nouvel Utilisateur Inscrit</h2></div>
                  <div class="content">
                    <p>Bonjour <span class="highlight">%s</span>,</p>
                    <p>Un nouvel utilisateur vient de s'inscrire sur la plateforme UASZ Maintenance.</p>
                    <div class="info-box">
                      <p><strong>👤 Nom complet :</strong> %s</p>
                      <p><strong>🔑 Nom d'utilisateur :</strong> %s</p>
                      <p><strong>📧 Email :</strong> %s</p>
                      <p><strong>🕐 Date d'inscription :</strong> %s</p>
                      <p><strong>🎭 Rôle attribué :</strong> DEMANDEUR (par défaut)</p>
                    </div>
                    <p>Connectez-vous à votre tableau de bord pour gérer cet utilisateur (modifier son rôle, activer/désactiver son compte, etc.).</p>
                    <p>Cordialement,<br><strong>Système de maintenance UASZ</strong></p>
                  </div>
                  <div class="footer"><p>Ceci est un email automatique, merci de ne pas y répondre.</p><p>© 2026 UASZ</p></div>
                </div></body></html>
                """.formatted(adminNom, nouvelUtilisateurNom, username, email, date), true);
            mailSender.send(message);
            log.info("Email nouvel utilisateur envoyé à l'admin {}", toEmail);
        } catch (MessagingException e) {
            log.error("Erreur email admin nouvel utilisateur: {}", e.getMessage());
        }
    }

    @Override
    @Async
    public void sendWelcomeEmail(String toEmail, String prenomNom, String username, String motDePasseTemporaire) {
        if (!emailEnabled) { log.info("Email désactivé - Email non envoyé à {}", toEmail); return; }
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject("Bienvenue sur UASZ Maintenance - Vos identifiants de connexion");
            helper.setText("""
                <!DOCTYPE html><html><head><meta charset="UTF-8">
                <style>
                  body{font-family:Arial,sans-serif;line-height:1.6;color:#333}
                  .container{max-width:600px;margin:0 auto;padding:20px}
                  .header{background:#1d4ed8;color:white;padding:20px;text-align:center;border-radius:5px 5px 0 0}
                  .content{background:#f9f9f9;padding:30px;border:1px solid #ddd}
                  .credentials-box{background:#eff6ff;padding:20px;margin:20px 0;border-left:4px solid #1d4ed8;border-radius:5px}
                  .password-box{background:#1d4ed8;color:white;padding:12px 20px;border-radius:8px;font-size:20px;font-weight:bold;letter-spacing:2px;text-align:center;margin:10px 0}
                  .warning-box{background:#fef3c7;padding:15px;margin:15px 0;border-left:4px solid #f59e0b;border-radius:5px}
                  .footer{background:#ecf0f1;padding:15px;text-align:center;font-size:12px;color:#7f8c8d;border-radius:0 0 5px 5px}
                  .highlight{color:#1d4ed8;font-weight:bold}
                </style></head><body>
                <div class="container">
                  <div class="header">
                    <h2>🎉 Bienvenue sur UASZ Maintenance</h2>
                    <p style="margin:5px 0;font-size:14px;opacity:0.9">Votre compte a été créé avec succès</p>
                  </div>
                  <div class="content">
                    <p>Bonjour <span class="highlight">%s</span>,</p>
                    <p>Votre compte sur la plateforme de gestion de maintenance de l'UASZ a été créé par l'administrateur.</p>
                    <div class="credentials-box">
                      <p><strong>🔑 Vos identifiants de connexion :</strong></p>
                      <p><strong>Nom d'utilisateur :</strong> %s</p>
                      <p><strong>Mot de passe temporaire :</strong></p>
                      <div class="password-box">%s</div>
                    </div>
                    <div class="warning-box">
                      <p><strong>⚠️ Important :</strong> Ce mot de passe est temporaire. Vous devrez le changer dès votre première connexion.</p>
                    </div>
                    <p>Pour vous connecter, rendez-vous sur la plateforme et utilisez ces identifiants. Vous serez automatiquement invité à définir un nouveau mot de passe.</p>
                    <p>Cordialement,<br><strong>L'équipe de maintenance UASZ</strong></p>
                  </div>
                  <div class="footer"><p>Ceci est un email automatique, merci de ne pas y répondre.</p><p>© 2026 UASZ - Université Assane Seck de Ziguinchor</p></div>
                </div></body></html>
                """.formatted(prenomNom, username, motDePasseTemporaire), true);
            mailSender.send(message);
            log.info("Email de bienvenue envoyé à {}", toEmail);
        } catch (MessagingException e) {
            log.error("Erreur email de bienvenue: {}", e.getMessage());
        }
    }
}
