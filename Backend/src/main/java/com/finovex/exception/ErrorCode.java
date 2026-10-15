package com.finovex.exception;

import org.springframework.http.HttpStatus;

/**
 * Machine-readable error codes, sent as {@code code} in every error body. The frontend
 * branches on these, so rename one only together with the frontend.
 */
public enum ErrorCode {

	VALIDATION_ERROR(HttpStatus.UNPROCESSABLE_CONTENT, "Validation failed"),
	INVALID_CREDENTIALS(HttpStatus.UNAUTHORIZED, "Sign-in failed"),
	UNAUTHORIZED(HttpStatus.UNAUTHORIZED, "Sign in required"),
	SESSION_EXPIRED(HttpStatus.UNAUTHORIZED, "Session ended"),
	FORBIDDEN(HttpStatus.FORBIDDEN, "Not allowed"),
	ACCOUNT_DISABLED(HttpStatus.FORBIDDEN, "Account disabled"),
	NOT_FOUND(HttpStatus.NOT_FOUND, "Not found"),
	ACCOUNT_EXISTS(HttpStatus.CONFLICT, "Account already exists"),
	CONFLICT(HttpStatus.CONFLICT, "Conflict"),
	INTERNAL_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "Something went wrong");

	private final HttpStatus status;

	private final String title;

	ErrorCode(HttpStatus status, String title) {
		this.status = status;
		this.title = title;
	}

	public HttpStatus getStatus() {
		return this.status;
	}

	public String getTitle() {
		return this.title;
	}

}
