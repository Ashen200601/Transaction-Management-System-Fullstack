package com.finovex.security;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerExceptionResolver;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * Security rejects requests before they reach a controller. This hands those rejections to
 * {@code GlobalExceptionHandler}, so a 401 or 403 has the same JSON body as every other error.
 */
@Component
public class ProblemDetailsSecurityHandler implements AuthenticationEntryPoint, AccessDeniedHandler {

	private final HandlerExceptionResolver resolver;

	public ProblemDetailsSecurityHandler(@Qualifier("handlerExceptionResolver") HandlerExceptionResolver resolver) {
		this.resolver = resolver;
	}

	@Override
	public void commence(HttpServletRequest request, HttpServletResponse response,
			AuthenticationException authException) {
		this.resolver.resolveException(request, response, null, authException);
	}

	@Override
	public void handle(HttpServletRequest request, HttpServletResponse response,
			AccessDeniedException accessDeniedException) {
		this.resolver.resolveException(request, response, null, accessDeniedException);
	}

}
