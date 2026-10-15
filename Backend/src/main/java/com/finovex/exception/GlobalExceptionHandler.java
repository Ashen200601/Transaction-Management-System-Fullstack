package com.finovex.exception;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.validation.FieldError;
import org.springframework.validation.ObjectError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

/**
 * Turns every error into an RFC 7807 problem body, the shape the frontend reads
 * ({@code Frontend/src/lib/api/errors.ts}):
 *
 * <pre>{@code
 * { "type": "about:blank", "title": "Validation failed", "status": 422,
 *   "code": "VALIDATION_ERROR", "detail": "Some fields need attention.",
 *   "errors": { "email": ["Enter a valid email address, like name@company.com"] } }
 * }</pre>
 *
 * Framework errors (malformed JSON, unknown URL, wrong method) are handled by the parent class.
 */
@RestControllerAdvice
public class GlobalExceptionHandler extends ResponseEntityExceptionHandler {

	private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

	@ExceptionHandler(ApiException.class)
	ResponseEntity<ProblemDetail> handleApiException(ApiException ex) {
		return problem(ex.getErrorCode(), ex.getMessage(), ex.getFieldErrors());
	}

	@ExceptionHandler(AuthenticationException.class)
	ResponseEntity<ProblemDetail> handleAuthentication(AuthenticationException ex) {
		ProblemDetail body = build(ErrorCode.UNAUTHORIZED, "Sign in to continue.", Map.of());
		return ResponseEntity.status(ErrorCode.UNAUTHORIZED.getStatus())
			.header(HttpHeaders.WWW_AUTHENTICATE, "Bearer")
			.body(body);
	}

	@ExceptionHandler(AccessDeniedException.class)
	ResponseEntity<ProblemDetail> handleAccessDenied(AccessDeniedException ex) {
		return problem(ErrorCode.FORBIDDEN, "You don't have permission to do that.", Map.of());
	}

	/** A unique constraint caught a duplicate that a manager's own check missed (e.g. two requests at once). */
	@ExceptionHandler(DataIntegrityViolationException.class)
	ResponseEntity<ProblemDetail> handleDataIntegrity(DataIntegrityViolationException ex) {
		log.warn("Data integrity violation: {}", ex.getMostSpecificCause().getMessage());
		return problem(ErrorCode.CONFLICT, "This conflicts with existing data. Refresh and try again.", Map.of());
	}

	/** Anything unexpected: log it in full, but tell the client only a trace id to quote. */
	@ExceptionHandler(Exception.class)
	ResponseEntity<ProblemDetail> handleUnexpected(Exception ex) {
		String traceId = UUID.randomUUID().toString();
		log.error("Unhandled error [traceId={}]", traceId, ex);
		ProblemDetail body = build(ErrorCode.INTERNAL_ERROR, "Something went wrong on our side. Please try again.",
				Map.of());
		body.setProperty("traceId", traceId);
		return ResponseEntity.status(ErrorCode.INTERNAL_ERROR.getStatus()).body(body);
	}

	/** {@code @Valid} request bodies: one list of messages per field. */
	@Override
	protected ResponseEntity<Object> handleMethodArgumentNotValid(MethodArgumentNotValidException ex,
			HttpHeaders headers, HttpStatusCode status, WebRequest request) {
		Map<String, Set<String>> messages = new LinkedHashMap<>();
		for (FieldError error : ex.getBindingResult().getFieldErrors()) {
			// A value of the wrong type (e.g. letters for a number) has a Java message; don't send that.
			String message = error.isBindingFailure() ? "Enter a valid value" : error.getDefaultMessage();
			messages.computeIfAbsent(error.getField(), (field) -> new LinkedHashSet<>()).add(message);
		}
		for (ObjectError error : ex.getBindingResult().getGlobalErrors()) {
			messages.computeIfAbsent("_", (field) -> new LinkedHashSet<>()).add(error.getDefaultMessage());
		}
		Map<String, List<String>> fieldErrors = new LinkedHashMap<>();
		messages.forEach((field, list) -> fieldErrors.put(field, new ArrayList<>(list)));
		ProblemDetail body = build(ErrorCode.VALIDATION_ERROR, "Some fields need attention.", fieldErrors);
		return ResponseEntity.status(ErrorCode.VALIDATION_ERROR.getStatus()).body(body);
	}

	private static ResponseEntity<ProblemDetail> problem(ErrorCode code, String detail,
			Map<String, List<String>> fieldErrors) {
		return ResponseEntity.status(code.getStatus()).body(build(code, detail, fieldErrors));
	}

	private static ProblemDetail build(ErrorCode code, String detail, Map<String, List<String>> fieldErrors) {
		ProblemDetail body = ProblemDetail.forStatusAndDetail(code.getStatus(), detail);
		body.setTitle(code.getTitle());
		body.setProperty("code", code.name());
		if (!fieldErrors.isEmpty()) {
			body.setProperty("errors", fieldErrors);
		}
		return body;
	}

}
