package com.finovex.controller;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.finovex.dto.request.LoginRequest;
import com.finovex.dto.request.RegisterRequest;
import com.finovex.dto.response.LoginResponse;
import com.finovex.dto.response.RegisteredAccountResponse;
import com.finovex.manager.AuthManager;

import io.swagger.v3.oas.annotations.security.SecurityRequirements;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

/**
 * HTTP only: validate the body, call the manager, return its DTO. No business rules and no
 * repositories here.
 */
@RestController
@RequestMapping("/auth")
@Tag(name = "Auth")
public class AuthController {

	private final AuthManager authManager;

	public AuthController(AuthManager authManager) {
		this.authManager = authManager;
	}

	@PostMapping("/register")
	@ResponseStatus(HttpStatus.CREATED)
	@SecurityRequirements
	public RegisteredAccountResponse register(@Valid @RequestBody RegisterRequest request) {
		return this.authManager.register(request);
	}

	@PostMapping("/login")
	@SecurityRequirements
	public LoginResponse login(@Valid @RequestBody LoginRequest request) {
		return this.authManager.login(request);
	}

	/**
	 * Tokens aren't stored on the server, so signing out means the client discards its token.
	 * A copied token stays valid until it expires (finovex.security.jwt.access-token-ttl).
	 */
	@PostMapping("/logout")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void logout() {
	}

}
