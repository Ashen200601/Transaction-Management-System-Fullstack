package com.finovex.config;

import java.time.Duration;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/**
 * Settings for the access tokens the API issues ({@code finovex.security.jwt.*}).
 *
 * @param issuer the token's {@code iss} claim; tokens from any other issuer are rejected
 * @param secret base64-encoded HMAC key, at least 32 bytes once decoded
 * @param accessTokenTtl how long a token stays valid after sign-in
 */
@Validated
@ConfigurationProperties("finovex.security.jwt")
public record JwtProperties(@NotBlank String issuer, @NotBlank String secret, @NotNull Duration accessTokenTtl) {
}
