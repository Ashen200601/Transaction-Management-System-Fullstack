package com.finovex.dto.response;

/**
 * Result of POST /auth/signup.
 *
 * @param id the new user's userSeq as a string
 */
public record SignupResponse(String id, String username) {
}
