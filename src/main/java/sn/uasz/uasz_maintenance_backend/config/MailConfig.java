package sn.uasz.uasz_maintenance_backend.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.util.StringUtils;

import java.util.Properties;

@Configuration
@Slf4j
public class MailConfig {

    @Value("${brevo.api.key:}")
    private String brevoApiKey;

    @Value("${app.email.from:noreply@uasz-maintenance.sn}")
    private String fromEmail;

    @Value("${spring.mail.host:smtp.gmail.com}")
    private String mailHost;

    @Value("${spring.mail.port:587}")
    private int mailPort;

    @Value("${spring.mail.username:}")
    private String mailUsername;

    @Value("${spring.mail.password:}")
    private String mailPassword;

    @Bean
    @Primary
    public JavaMailSender javaMailSender() {
        if (StringUtils.hasText(brevoApiKey)) {
            log.info("✅ Utilisation de Brevo API pour l'envoi d'emails");
            return new BrevoMailSender(brevoApiKey, fromEmail, mailHost, mailPort,
                    mailUsername, mailPassword);
        }
        log.info("📧 Utilisation de JavaMailSender SMTP standard");
        JavaMailSenderImpl sender = new JavaMailSenderImpl();
        sender.setHost(mailHost);
        sender.setPort(mailPort);
        sender.setUsername(mailUsername);
        sender.setPassword(mailPassword);
        Properties props = sender.getJavaMailProperties();
        props.put("mail.smtp.auth", "true");
        props.put("mail.smtp.starttls.enable", "true");
        props.put("mail.smtp.starttls.required", "true");
        return sender;
    }
}
