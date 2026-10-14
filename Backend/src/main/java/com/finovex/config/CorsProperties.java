package com.finovex.config;

import java.util.List;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Browser origins allowed to call the API from another origin ({@code finovex.cors.*}).
 *
 * @param allowedOrigins exact origins such as {@code http://localhost:5173}; empty allows none
 */
@ConfigurationProperties("finovex.cors")
public record CorsProperties(List<String> allowedOrigins) {

	public CorsProperties {
		allowedOrigins = allowedOrigins == null ? List.of() : List.copyOf(allowedOrigins);
	}

}
