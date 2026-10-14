package com.finovex.dto.request;

import jakarta.validation.constraints.NotBlank;

/** Body of POST /auth/login. */
public record LoginRequest(
		@NotBlank(message = "Enter your username") String username,
		@NotBlank(message = "Enter your password") String password) {
}
