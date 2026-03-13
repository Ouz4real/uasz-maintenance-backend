package sn.uasz.uasz_maintenance_backend.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class SwaggerConfig {

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("UASZ Maintenance API")
                        .description("API pour la gestion de maintenance des équipements à l'UASZ")
                        .version("1.0.0"));
    }
}
