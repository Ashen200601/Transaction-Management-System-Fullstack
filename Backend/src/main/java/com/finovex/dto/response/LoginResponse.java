package com.finovex.dto.response;

/**
 * Result of POST /auth/login. The frontend sends {@code accessToken} back as
 * {@code Authorization: Bearer <token>} on every later request.
 *
 * @param expiresIn seconds until the token expires
 */
public record LoginResponse(String accessToken, long expiresIn, UserResponse user) {
}
