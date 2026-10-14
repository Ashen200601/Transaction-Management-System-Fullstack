package com.finovex.exception;

import java.util.List;
import java.util.Map;

/**
 * Throw from a manager to stop a request with an error the user can act on. The message is
 * shown to the user, so keep it plain and never include internal details.
 *
 * <pre>{@code
 * throw new ApiException(ErrorCode.NOT_FOUND, "That product no longer exists.");
 * }</pre>
 */
public class ApiException extends RuntimeException {

	private final ErrorCode errorCode;

	private final Map<String, List<String>> fieldErrors;

	public ApiException(ErrorCode errorCode, String message) {
		this(errorCode, message, Map.of());
	}

	/** @param fieldErrors messages per request field, shown next to that field in the form */
	public ApiException(ErrorCode errorCode, String message, Map<String, List<String>> fieldErrors) {
		super(message);
		this.errorCode = errorCode;
		this.fieldErrors = Map.copyOf(fieldErrors);
	}

	public ErrorCode getErrorCode() {
		return this.errorCode;
	}

	public Map<String, List<String>> getFieldErrors() {
		return this.fieldErrors;
	}

}
