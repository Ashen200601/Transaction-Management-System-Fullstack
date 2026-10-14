package com.finovex.config;

import org.springframework.context.annotation.Configuration;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeType;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.security.SecurityScheme;

/**
 * API documentation at /api/swagger-ui/index.html. Its "Authorize" button takes the
 * {@code accessToken} from POST /auth/login. Turned off in the prod profile.
 */
@Configuration
@OpenAPIDefinition(info = @Info(title = "Finovex API", version = "v1"), security = @SecurityRequirement(name = "bearer"))
@SecurityScheme(name = "bearer", type = SecuritySchemeType.HTTP, scheme = "bearer", bearerFormat = "JWT")
public class OpenApiConfig {
}
