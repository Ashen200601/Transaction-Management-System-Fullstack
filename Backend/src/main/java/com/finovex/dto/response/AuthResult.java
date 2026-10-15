package com.finovex.dto.response;

/**
 * What a sign-in or refresh gives the controller: the JSON body, plus the new refresh token,
 * which goes into an HttpOnly cookie and never into the body.
 */
public record AuthResult(LoginResponse response, String refreshToken) {
}
