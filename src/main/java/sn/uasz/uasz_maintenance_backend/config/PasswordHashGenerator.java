package sn.uasz.uasz_maintenance_backend.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class PasswordHashGenerator {

    @Bean
    CommandLineRunner printBcrypt(PasswordEncoder encoder) {
        return args -> {
            System.out.println("BCrypt(tech1234) = " + encoder.encode("tech1234"));
        };
    }
}
