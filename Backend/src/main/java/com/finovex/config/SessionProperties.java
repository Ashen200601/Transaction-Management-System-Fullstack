package com.finovex.config;

import java.time.Duration;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

import jakarta.validation.constraints.NotNull;

/**
 * Sign-in sessions ({@code finovex.security.session.*}). A session starts at sign-in and is kept
 * alive by refresh tokens in an HttpOnly cookie; access tokens are short and renewed with them.
 *
 * @param ttl how long a sign-in lasts, however active the user is
 * @param reuseGrace how long a just-used refresh token is still accepted, so two tabs refreshing
 * at the same moment don't look like a stolen token
 * @param cookieSecure send the refresh cookie over HTTPS only; off for plain-HTTP local development
 */
@Validated
@ConfigurationProperties("finovex.security.session")
public record SessionProperties(@NotNull Duration ttl, @NotNull Duration reuseGrace, boolean cookieSecure) {
}
