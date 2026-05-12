package sn.uasz.uasz_maintenance_backend.config;

import jakarta.mail.internet.MimeMessage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.mail.javamail.MimeMessagePreparator;
import org.springframework.web.client.RestTemplate;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.util.Properties;

/**
 * JavaMailSender qui redirige les envois vers l'API HTTP Brevo (port 443).
 * Utilisé en prod pour contourner le blocage SMTP de Render.
 */
@Slf4j
public class BrevoMailSender implements JavaMailSender {

    private final String apiKey;
    private final String fromEmail;
    private final RestTemplate restTemplate = new RestTemplate();
    private final JavaMailSenderImpl delegate;

    public BrevoMailSender(String apiKey, String fromEmail, String host, int port,
                           String username, String password) {
        this.apiKey = apiKey;
        this.fromEmail = fromEmail;
        this.delegate = new JavaMailSenderImpl();
        this.delegate.setHost(host);
        this.delegate.setPort(port);
        this.delegate.setUsername(username);
        this.delegate.setPassword(password);
        Properties props = this.delegate.getJavaMailProperties();
        props.put("mail.smtp.auth", "true");
        props.put("mail.smtp.starttls.enable", "true");
    }

    @Override
    public MimeMessage createMimeMessage() {
        return delegate.createMimeMessage();
    }

    @Override
    public MimeMessage createMimeMessage(InputStream contentStream) throws MailException {
        return delegate.createMimeMessage(contentStream);
    }

    @Override
    public void send(MimeMessage mimeMessage) throws MailException {
        sendViaBrevo(mimeMessage);
    }

    @Override
    public void send(MimeMessage... mimeMessages) throws MailException {
        for (MimeMessage msg : mimeMessages) {
            sendViaBrevo(msg);
        }
    }

    @Override
    public void send(MimeMessagePreparator mimeMessagePreparator) throws MailException {
        MimeMessage msg = createMimeMessage();
        try {
            mimeMessagePreparator.prepare(msg);
            sendViaBrevo(msg);
        } catch (Exception e) {
            log.error("Erreur préparation message: {}", e.getMessage());
        }
    }

    @Override
    public void send(MimeMessagePreparator... mimeMessagePreparators) throws MailException {
        for (MimeMessagePreparator p : mimeMessagePreparators) {
            send(p);
        }
    }

    @Override
    public void send(SimpleMailMessage simpleMessage) throws MailException {
        String html = "<p>" + simpleMessage.getText() + "</p>";
        String to = simpleMessage.getTo() != null && simpleMessage.getTo().length > 0
                ? simpleMessage.getTo()[0] : "";
        sendViaBrevoRaw(to, simpleMessage.getSubject(), html);
    }

    @Override
    public void send(SimpleMailMessage... simpleMessages) throws MailException {
        for (SimpleMailMessage msg : simpleMessages) {
            send(msg);
        }
    }

    private void sendViaBrevo(MimeMessage mimeMessage) {
        try {
            String to = mimeMessage.getAllRecipients() != null && mimeMessage.getAllRecipients().length > 0
                    ? mimeMessage.getAllRecipients()[0].toString() : "";
            String subject = mimeMessage.getSubject();

            // Extraire le contenu HTML du MimeMessage
            Object content = mimeMessage.getContent();
            String html;
            if (content instanceof String) {
                html = (String) content;
            } else {
                // Multipart — lire le contenu brut
                ByteArrayOutputStream baos = new ByteArrayOutputStream();
                mimeMessage.writeTo(baos);
                html = "<p>Message UASZ Maintenance</p>";
                // Essayer d'extraire le HTML du multipart
                try {
                    jakarta.mail.Multipart mp = (jakarta.mail.Multipart) content;
                    for (int i = 0; i < mp.getCount(); i++) {
                        jakarta.mail.BodyPart bp = mp.getBodyPart(i);
                        if (bp.getContentType().toLowerCase().contains("text/html")) {
                            html = (String) bp.getContent();
                            break;
                        }
                    }
                } catch (Exception ignored) {}
            }

            sendViaBrevoRaw(to, subject, html);
        } catch (Exception e) {
            log.error("Erreur extraction MimeMessage: {}", e.getMessage());
        }
    }

    private void sendViaBrevoRaw(String toEmail, String subject, String htmlContent) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("api-key", apiKey);

            String safeHtml = htmlContent
                    .replace("\\", "\\\\")
                    .replace("\"", "\\\"")
                    .replace("\n", "\\n")
                    .replace("\r", "");

            String body = """
                {
                  "sender": {"email": "%s", "name": "UASZ Maintenance"},
                  "to": [{"email": "%s"}],
                  "subject": "%s",
                  "htmlContent": "%s"
                }
                """.formatted(fromEmail, toEmail, subject, safeHtml);

            HttpEntity<String> request = new HttpEntity<>(body, headers);
            ResponseEntity<String> response = restTemplate.postForEntity(
                    "https://api.brevo.com/v3/smtp/email", request, String.class);

            if (response.getStatusCode().is2xxSuccessful()) {
                log.info("✅ Email envoyé via Brevo API à {}", toEmail);
            } else {
                log.error("❌ Erreur Brevo API ({}): {}", response.getStatusCode(), response.getBody());
            }
        } catch (Exception e) {
            log.error("❌ Erreur envoi Brevo: {}", e.getMessage());
        }
    }
}
