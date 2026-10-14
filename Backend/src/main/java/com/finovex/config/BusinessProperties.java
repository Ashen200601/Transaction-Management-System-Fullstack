package com.finovex.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

/**
 * Settings for new businesses ({@code finovex.business.*}).
 *
 * @param defaultCurrency ISO 4217 code given to a business created at sign-up, e.g. USD
 */
@Validated
@ConfigurationProperties("finovex.business")
public record BusinessProperties(@NotNull @Pattern(regexp = "[A-Z]{3}") String defaultCurrency) {
}
