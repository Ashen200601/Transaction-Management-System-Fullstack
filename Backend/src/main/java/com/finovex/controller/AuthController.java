package com.finovex.controller;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.finovex.dto.request.ClientInfo;
import com.finovex.dto.request.LoginRequest;
import com.finovex.dto.request.SignupRequest;
import com.finovex.dto.response.AuthResult;
import com.finovex.dto.response.LoginResponse;
import com.finovex.dto.response.SignupResponse;
import com.finovex.exception.ApiException;
import com.finovex.manager.AuthManager;
import com.finovex.security.RefreshTokenCookie;

import io.swagger.v3.oas.annotations.security.SecurityRequirements;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;

/**
 * HTTP only: validate the body, call the manager, return its DTO. No business rules and no
 * repositories here. The refresh token travels in an HttpOnly cookie (see RefreshTokenCookie),
 * never in a JSON body.
 */
@RestController
@RequestMapping("/auth")
@Tag(name = "Auth")
public class AuthController {

	private final AuthManager authManager;

	private final RefreshTokenCookie refreshTokenCookie;

	public AuthController(AuthManager authManager, RefreshTokenCookie refreshTokenCookie) {
		this.authManager = authManager;
		this.refreshTokenCookie = refreshTokenCookie;
	}

	@PostMapping("/signup")
	@ResponseStatus(HttpStatus.CREATED)
	@SecurityRequirements
	public SignupResponse signup(@Valid @RequestBody SignupRequest request) {
		return this.authManager.signup(request);
	}

	/** Returns a short-lived access token and sets the refresh cookie. */
	@PostMapping("/login")
	@SecurityRequirements
	public LoginResponse login(@Valid @RequestBody LoginRequest request, HttpServletRequest httpRequest,
			HttpServletResponse httpResponse) {
		AuthResult result = this.authManager.login(request, client(httpRequest));
		this.refreshTokenCookie.write(httpRequest, httpResponse, result.refreshToken());
		return result.response();
	}

	/**
	 * Exchanges the refresh cookie for a new access token, and replaces the cookie. On failure
	 * the cookie is deleted and the answer is 401 SESSION_EXPIRED.
	 */
	@PostMapping("/refresh")
	@SecurityRequirements
	public LoginResponse refresh(HttpServletRequest httpRequest, HttpServletResponse httpResponse) {
		try {
			AuthResult result = this.authManager.refresh(this.refreshTokenCookie.read(httpRequest),
					client(httpRequest));
			this.refreshTokenCookie.write(httpRequest, httpResponse, result.refreshToken());
			return result.response();
		}
		catch (ApiException ex) {
			this.refreshTokenCookie.clear(httpRequest, httpResponse);
			throw ex;
		}
	}

	/**
	 * Ends the session on the server and deletes the cookie. Access tokens already handed out
	 * keep working until they expire (at most finovex.security.jwt.access-token-ttl).
	 */
	@PostMapping("/logout")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	@SecurityRequirements
	public void logout(HttpServletRequest httpRequest, HttpServletResponse httpResponse) {
		this.authManager.logout(this.refreshTokenCookie.read(httpRequest), client(httpRequest));
		this.refreshTokenCookie.clear(httpRequest, httpResponse);
	}

	/** The caller's address (the real one behind a trusted proxy, see server.forward-headers-strategy). */
	private static ClientInfo client(HttpServletRequest request) {
		return new ClientInfo(request.getRemoteAddr(), request.getHeader(HttpHeaders.USER_AGENT));
	}

}
