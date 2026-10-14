package com.finovex.dto.response;

/**
 * Result of POST /auth/register.
 *
 * @param id the new user's userSeq as a string
 */
public record RegisteredAccountResponse(String id, String username) {
}
