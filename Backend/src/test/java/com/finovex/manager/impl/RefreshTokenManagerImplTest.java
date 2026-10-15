package com.finovex.manager.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Duration;
import java.util.Date;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.finovex.config.SessionProperties;
import com.finovex.dto.request.ClientInfo;
import com.finovex.entity.RefreshToken;
import com.finovex.entity.User;
import com.finovex.enums.LoginResult;
import com.finovex.enums.MasterDataStatus;
import com.finovex.enums.SessionEndReason;
import com.finovex.manager.RefreshTokenManager.IssuedRefreshToken;
import com.finovex.manager.RefreshTokenManager.Rotation;
import com.finovex.repository.RefreshTokenRepository;

@ExtendWith(MockitoExtension.class)
class RefreshTokenManagerImplTest {

	private static final ClientInfo CLIENT = new ClientInfo("203.0.113.7", "JUnit");

	private static final Integer APPROVED = MasterDataStatus.APPROVED.getStatusSeq();

	private static final Integer OPEN = MasterDataStatus.OPEN.getStatusSeq();

	@Mock
	private RefreshTokenRepository refreshTokenRepository;

	private RefreshTokenManagerImpl manager;

	private final User user = user(MasterDataStatus.APPROVED);

	@BeforeEach
	void setUp() {
		this.manager = new RefreshTokenManagerImpl(this.refreshTokenRepository,
				new SessionProperties(Duration.ofHours(8), Duration.ofSeconds(10), true));
		lenient().when(this.refreshTokenRepository.save(any(RefreshToken.class)))
			.thenAnswer((invocation) -> invocation.getArgument(0));
	}

	@Test
	void startSessionStoresOnlyTheHashOfARandomTokenThatEndsInEightHours() {
		long before = System.currentTimeMillis();

		IssuedRefreshToken issued = this.manager.startSession(this.user, CLIENT);

		RefreshToken saved = savedToken();
		assertThat(issued.value()).hasSize(43).isNotEqualTo(saved.getTokenHash());
		assertThat(saved.getTokenHash()).isEqualTo(RefreshTokenManagerImpl.hash(issued.value())).hasSize(64);
		assertThat(saved.getSessionId()).isEqualTo(issued.sessionId());
		assertThat(saved.getUser()).isSameAs(this.user);
		assertThat(saved.getStatus()).isEqualTo(APPROVED);
		assertThat(saved.getIpAddress()).isEqualTo("203.0.113.7");
		assertThat(saved.getExpiresDate().getTime() - before).isBetween(Duration.ofHours(8).toMillis() - 1000,
				Duration.ofHours(8).toMillis() + 1000);
		assertThat(this.manager.startSession(this.user, CLIENT).value()).isNotEqualTo(issued.value());
	}

	@Test
	void anUnknownTokenIsInvalid() {
		when(this.refreshTokenRepository.findByTokenHash(any())).thenReturn(Optional.empty());

		Rotation rotation = this.manager.rotate("made-up", CLIENT);

		assertThat(rotation.result()).isEqualTo(LoginResult.INVALID_TOKEN);
		assertThat(rotation.user()).isNull();
	}

	@Test
	void aFreshTokenIsUsedUpAndTheNextOneKeepsTheSessionAndItsEnd() {
		RefreshToken current = token(null, null);
		when(this.refreshTokenRepository.findByTokenHash(RefreshTokenManagerImpl.hash("current")))
			.thenReturn(Optional.of(current));

		Rotation rotation = this.manager.rotate("current", CLIENT);

		assertThat(rotation.succeeded()).isTrue();
		assertThat(current.getUsedDate()).isNotNull();
		assertThat(current.getStatus()).isEqualTo(OPEN);
		assertThat(rotation.next().sessionId()).isEqualTo("session-1");
		assertThat(rotation.next().expiresDate()).isEqualTo(current.getExpiresDate());
		assertThat(savedToken().getTokenHash()).isEqualTo(RefreshTokenManagerImpl.hash(rotation.next().value()));
	}

	@Test
	void aTokenUsedAMomentAgoByAnotherTabStillWorks() {
		RefreshToken current = token(new Date(System.currentTimeMillis() - 2_000), null);
		when(this.refreshTokenRepository.findByTokenHash(any())).thenReturn(Optional.of(current));

		Rotation rotation = this.manager.rotate("current", CLIENT);

		assertThat(rotation.succeeded()).isTrue();
		verify(this.refreshTokenRepository, never()).findBySessionIdAndRevokedDateIsNull(any());
	}

	@Test
	void aTokenUsedAgainAfterTheGraceEndsTheWholeSession() {
		RefreshToken reused = token(new Date(System.currentTimeMillis() - 60_000), null);
		RefreshToken latest = token(null, null);
		when(this.refreshTokenRepository.findByTokenHash(any())).thenReturn(Optional.of(reused));
		when(this.refreshTokenRepository.findBySessionIdAndRevokedDateIsNull("session-1"))
			.thenReturn(List.of(reused, latest));

		Rotation rotation = this.manager.rotate("copied", CLIENT);

		assertThat(rotation.result()).isEqualTo(LoginResult.TOKEN_REUSED);
		assertThat(rotation.next()).isNull();
		for (RefreshToken token : List.of(reused, latest)) {
			assertThat(token.getRevokedDate()).isNotNull();
			assertThat(token.getRevokedReason()).isEqualTo(SessionEndReason.TOKEN_REUSED);
			assertThat(token.getStatus()).isEqualTo(OPEN);
		}
		verify(this.refreshTokenRepository, never()).save(any());
	}

	@Test
	void anExpiredSessionCannotBeRefreshed() {
		RefreshToken expired = token(null, null);
		expired.setExpiresDate(new Date(System.currentTimeMillis() - 1));
		when(this.refreshTokenRepository.findByTokenHash(any())).thenReturn(Optional.of(expired));

		assertThat(this.manager.rotate("old", CLIENT).result()).isEqualTo(LoginResult.SESSION_EXPIRED);
		verify(this.refreshTokenRepository, never()).save(any());
	}

	@Test
	void aSignedOutSessionCannotBeRefreshed() {
		when(this.refreshTokenRepository.findByTokenHash(any())).thenReturn(Optional.of(token(null, new Date())));

		assertThat(this.manager.rotate("after-logout", CLIENT).result()).isEqualTo(LoginResult.SESSION_REVOKED);
	}

	@Test
	void aDisabledAccountLosesItsSession() {
		RefreshToken current = token(null, null);
		current.setUser(user(MasterDataStatus.OPEN));
		when(this.refreshTokenRepository.findByTokenHash(any())).thenReturn(Optional.of(current));
		when(this.refreshTokenRepository.findBySessionIdAndRevokedDateIsNull("session-1")).thenReturn(List.of(current));

		assertThat(this.manager.rotate("current", CLIENT).result()).isEqualTo(LoginResult.ACCOUNT_DISABLED);
		assertThat(current.getRevokedReason()).isEqualTo(SessionEndReason.ACCOUNT_DISABLED);
	}

	@Test
	void endSessionRevokesEveryTokenOfTheSession() {
		RefreshToken current = token(null, null);
		RefreshToken older = token(new Date(), null);
		when(this.refreshTokenRepository.findByTokenHash(RefreshTokenManagerImpl.hash("current")))
			.thenReturn(Optional.of(current));
		when(this.refreshTokenRepository.findBySessionIdAndRevokedDateIsNull("session-1"))
			.thenReturn(List.of(current, older));

		assertThat(this.manager.endSession("current", SessionEndReason.LOGOUT)).contains(current);
		assertThat(current.getRevokedReason()).isEqualTo(SessionEndReason.LOGOUT);
		assertThat(older.getRevokedReason()).isEqualTo(SessionEndReason.LOGOUT);
	}

	private RefreshToken savedToken() {
		ArgumentCaptor<RefreshToken> saved = ArgumentCaptor.forClass(RefreshToken.class);
		verify(this.refreshTokenRepository, atLeastOnce()).save(saved.capture());
		return saved.getAllValues().get(0);
	}

	private RefreshToken token(Date usedDate, Date revokedDate) {
		RefreshToken token = new RefreshToken();
		token.setUser(this.user);
		token.setSessionId("session-1");
		token.setExpiresDate(new Date(System.currentTimeMillis() + Duration.ofHours(1).toMillis()));
		token.setUsedDate(usedDate);
		token.setRevokedDate(revokedDate);
		token.setStatus(usedDate == null && revokedDate == null ? APPROVED : OPEN);
		return token;
	}

	private static User user(MasterDataStatus status) {
		User user = new User();
		user.setUserSeq(7);
		user.setUsername("jane");
		user.setStatus(status.getStatusSeq());
		return user;
	}

}
