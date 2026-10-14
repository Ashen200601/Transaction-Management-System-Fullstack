package com.finovex.config;

import java.util.Base64;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtValidators;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;

import com.nimbusds.jose.jwk.source.ImmutableSecret;

/** Signs access tokens at sign-in and verifies them on every request, with one shared HMAC key. */
@Configuration
public class JwtConfig {

	/** HS256 needs a key of at least 256 bits. */
	private static final int MIN_KEY_BYTES = 32;

	@Bean
	SecretKey jwtSigningKey(JwtProperties properties) {
		
		byte[] key;
		try {
			key = Base64.getDecoder().decode(properties.secret());
		}
		catch (IllegalArgumentException ex) {
			throw new IllegalStateException("finovex.security.jwt.secret must be base64-encoded", ex);
		}
		if (key.length < MIN_KEY_BYTES) {
			throw new IllegalStateException(
					"finovex.security.jwt.secret must decode to at least " + MIN_KEY_BYTES + " bytes");
		}
		return new SecretKeySpec(key, "HmacSHA256");
	}

	@Bean
	JwtEncoder jwtEncoder(SecretKey jwtSigningKey) {
		return new NimbusJwtEncoder(new ImmutableSecret<>(jwtSigningKey));
	}

	@Bean
	JwtDecoder jwtDecoder(SecretKey jwtSigningKey, JwtProperties properties) {
		NimbusJwtDecoder decoder = NimbusJwtDecoder.withSecretKey(jwtSigningKey)
			.macAlgorithm(MacAlgorithm.HS256)
			.build();
		// Checks expiry and that the token was issued by this API.
		decoder.setJwtValidator(JwtValidators.createDefaultWithIssuer(properties.issuer()));
		return decoder;
	}

}
