package com.finovex.security;

import java.time.Duration;

import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;

import com.finovex.config.SessionProperties;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * The refresh token's cookie. HttpOnly, so page scripts can't read it; SameSite=Strict, so other
 * sites can't make the browser send it; and only sent to /api/auth/*. It has no Max-Age, so it's
 * gone when the browser closes; the server ends the session after its fixed length anyway.
 */
@Component
public class RefreshTokenCookie {

	public static final String NAME = "finovex_refresh";

	private final boolean secure;

	public RefreshTokenCookie(SessionProperties properties) {
		this.secure = properties.cookieSecure();
	}

	/** The refresh token the browser sent, or null. */
	public String read(HttpServletRequest request) {
		Cookie[] cookies = request.getCookies();
		if (cookies == null) {
			return null;
		}
		for (Cookie cookie : cookies) {
			if (NAME.equals(cookie.getName())) {
				return cookie.getValue();
			}
		}
		return null;
	}

	public void write(HttpServletRequest request, HttpServletResponse response, String refreshToken) {
		response.addHeader(HttpHeaders.SET_COOKIE, build(request, refreshToken, null).toString());
	}

	public void clear(HttpServletRequest request, HttpServletResponse response) {
		response.addHeader(HttpHeaders.SET_COOKIE, build(request, "", Duration.ZERO).toString());
	}

	private ResponseCookie build(HttpServletRequest request, String value, Duration maxAge) {
		ResponseCookie.ResponseCookieBuilder cookie = ResponseCookie.from(NAME, value)
			.httpOnly(true)
			.secure(this.secure)
			.sameSite("Strict")
			// The servlet context path is /api, so this is /api/auth: refresh and logout, nothing else.
			.path(request.getContextPath() + "/auth");
		if (maxAge != null) {
			cookie.maxAge(maxAge);
		}
		return cookie.build();
	}

}
