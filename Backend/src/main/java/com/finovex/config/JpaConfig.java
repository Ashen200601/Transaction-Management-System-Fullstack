package com.finovex.config;

import java.util.Optional;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.domain.AuditorAware;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;

/**
 * Fills in the audit columns on every entity: {@code @CreatedDate} / {@code @LastModifiedDate}
 * with the current time, and {@code @CreatedBy} / {@code @LastModifiedBy} with the signed-in
 * user's username, or "system" when nobody is signed in (e.g. self sign-up).
 */
@Configuration
@EnableJpaAuditing(auditorAwareRef = "auditorAware")
public class JpaConfig {

	static final String SYSTEM_AUDITOR = "system";

	@Bean
	AuditorAware<String> auditorAware() {
		return () -> Optional.ofNullable(SecurityContextHolder.getContext().getAuthentication())
			.map(Authentication::getPrincipal)
			.filter(Jwt.class::isInstance)
			.map((principal) -> ((Jwt) principal).getClaimAsString("username"))
			.or(() -> Optional.of(SYSTEM_AUDITOR));
	}

}
