package com.finovex.manager.impl;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Duration;
import java.util.Base64;
import java.util.Date;
import java.util.HexFormat;
import java.util.Optional;
import java.util.UUID;

import org.hibernate.Hibernate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.finovex.config.SessionProperties;
import com.finovex.dto.request.ClientInfo;
import com.finovex.entity.RefreshToken;
import com.finovex.entity.User;
import com.finovex.enums.LoginResult;
import com.finovex.enums.MasterDataStatus;
import com.finovex.enums.SessionEndReason;
import com.finovex.manager.RefreshTokenManager;
import com.finovex.repository.RefreshTokenRepository;

@Service
public class RefreshTokenManagerImpl implements RefreshTokenManager {

	/** 256 random bits per token. */
	private static final int TOKEN_BYTES = 32;

	/** Expired tokens are kept a little longer, so a late refresh is still recognised in the audit. */
	private static final Duration KEEP_AFTER_EXPIRY = Duration.ofDays(1);

	private static final Integer OPEN = MasterDataStatus.OPEN.getStatusSeq();

	private static final Integer APPROVED = MasterDataStatus.APPROVED.getStatusSeq();

	private final SecureRandom random = new SecureRandom();

	private final RefreshTokenRepository refreshTokenRepository;

	private final Duration sessionTtl;

	private final Duration reuseGrace;

	public RefreshTokenManagerImpl(RefreshTokenRepository refreshTokenRepository, SessionProperties properties) {
		this.refreshTokenRepository = refreshTokenRepository;
		this.sessionTtl = properties.ttl();
		this.reuseGrace = properties.reuseGrace();
	}

	@Override
	@Transactional
	public IssuedRefreshToken startSession(User user, ClientInfo client) {
		Date expiresDate = new Date(System.currentTimeMillis() + this.sessionTtl.toMillis());
		return issue(user, UUID.randomUUID().toString(), expiresDate, client);
	}

	@Override
	@Transactional
	public Rotation rotate(String refreshToken, ClientInfo client) {
		Optional<RefreshToken> found = this.refreshTokenRepository.findByTokenHash(hash(refreshToken));
		if (found.isEmpty()) {
			return new Rotation(LoginResult.INVALID_TOKEN, null, null, null);
		}
		RefreshToken token = found.get();
		User user = (User) Hibernate.unproxy(token.getUser());
		String sessionId = token.getSessionId();
		Date now = new Date();

		if (token.getRevokedDate() != null) {
			return new Rotation(LoginResult.SESSION_REVOKED, user, sessionId, null);
		}
		if (!token.getExpiresDate().after(now)) {
			return new Rotation(LoginResult.SESSION_EXPIRED, user, sessionId, null);
		}
		if (!APPROVED.equals(user.getStatus())) {
			// Made inactive or deleted during the session.
			revokeSession(sessionId, SessionEndReason.ACCOUNT_DISABLED, now);
			return new Rotation(LoginResult.ACCOUNT_DISABLED, user, sessionId, null);
		}
		if (token.getUsedDate() == null) {
			token.setUsedDate(now);
			token.setStatus(OPEN);
		}
		else if (now.getTime() - token.getUsedDate().getTime() > this.reuseGrace.toMillis()) {
			revokeSession(sessionId, SessionEndReason.TOKEN_REUSED, now);
			return new Rotation(LoginResult.TOKEN_REUSED, user, sessionId, null);
		}
		// Unused, or used a moment ago by another tab of the same browser: hand out the next token.
		IssuedRefreshToken next = issue(user, sessionId, token.getExpiresDate(), client);
		return new Rotation(LoginResult.SUCCESS, user, sessionId, next);
	}

	@Override
	@Transactional
	public Optional<RefreshToken> endSession(String refreshToken, SessionEndReason reason) {
		Optional<RefreshToken> found = this.refreshTokenRepository.findByTokenHash(hash(refreshToken));
		found.ifPresent((token) -> {
			Hibernate.initialize(token.getUser());
			revokeSession(token.getSessionId(), reason, new Date());
		});
		return found;
	}

	@Override
	@Transactional
	public int deleteExpired() {
		return this.refreshTokenRepository
			.deleteExpiredBefore(new Date(System.currentTimeMillis() - KEEP_AFTER_EXPIRY.toMillis()));
	}

	private IssuedRefreshToken issue(User user, String sessionId, Date expiresDate, ClientInfo client) {
		byte[] bytes = new byte[TOKEN_BYTES];
		this.random.nextBytes(bytes);
		String value = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);

		RefreshToken token = new RefreshToken();
		token.setUser(user);
		token.setTokenHash(hash(value));
		token.setSessionId(sessionId);
		token.setExpiresDate(expiresDate);
		token.setIpAddress(client.ipAddress());
		token.setUserAgent(client.userAgent());
		token.setStatus(APPROVED);
		this.refreshTokenRepository.save(token);
		return new IssuedRefreshToken(value, sessionId, expiresDate);
	}

	private void revokeSession(String sessionId, SessionEndReason reason, Date now) {
		for (RefreshToken token : this.refreshTokenRepository.findBySessionIdAndRevokedDateIsNull(sessionId)) {
			token.setRevokedDate(now);
			token.setRevokedReason(reason);
			token.setStatus(OPEN);
		}
	}

	static String hash(String token) {
		try {
			byte[] digest = MessageDigest.getInstance("SHA-256").digest(token.getBytes(StandardCharsets.UTF_8));
			return HexFormat.of().formatHex(digest);
		}
		catch (NoSuchAlgorithmException ex) {
			throw new IllegalStateException("SHA-256 is always available", ex);
		}
	}

}
