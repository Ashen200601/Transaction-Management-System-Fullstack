package com.finovex.dto.response;

/**
 * The signed-in user, as the frontend's {@code AuthUser}.
 *
 * @param id the user's userSeq as a string; the frontend treats every id as a string
 */
public record UserResponse(String id, String username, String name, String email) {
}
