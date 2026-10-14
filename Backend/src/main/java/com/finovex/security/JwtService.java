package com.finovex.security;

import java.time.Duration;
import java.time.Instant;
import java.util.UUID;

import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Component;

import com.finovex.config.JwtProperties;
import com.finovex.entity.User;

/**
 * Issues the access token returned by sign-in. Its subject is the user's userSeq, which controllers
 * read back with {@code @AuthenticationPrincipal Jwt jwt} and {@code jwt.getSubject()}.
 */
@Component
public class JwtService {

	private final JwtEncoder encoder;

	private final String issuer;

	private final Duration ttl;

	public JwtService(JwtEncoder encoder, JwtProperties properties) {
		this.encoder = encoder;
		this.issuer = properties.issuer();
		this.ttl = properties.accessTokenTtl();
	}

	public IssuedToken issue(User user) {
		Instant now = Instant.now();
		JwtClaimsSet claims = JwtClaimsSet.builder()
			.issuer(this.issuer)
			.subject(String.valueOf(user.getUserSeq()))
			.id(UUID.randomUUID().toString())
			.issuedAt(now)
			.expiresAt(now.plus(this.ttl))
			.claim("username", user.getUsername())
			.build();
		JwsHeader header = JwsHeader.with(MacAlgorithm.HS256).build();
		String token = this.encoder.encode(JwtEncoderParameters.from(header, claims)).getTokenValue();
		return new IssuedToken(token, this.ttl.toSeconds());
	}

	/**
	 * @param value the signed JWT
	 * @param expiresInSeconds seconds until it expires
	 */
	public record IssuedToken(String value, long expiresInSeconds) {
	}

}
