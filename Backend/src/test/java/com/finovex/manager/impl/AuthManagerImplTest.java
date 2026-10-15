package com.finovex.manager.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.Date;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.finovex.dto.request.ClientInfo;
import com.finovex.dto.request.LoginRequest;
import com.finovex.dto.request.SignupRequest;
import com.finovex.dto.response.AuthResult;
import com.finovex.entity.RefreshToken;
import com.finovex.entity.User;
import com.finovex.enums.LoginEvent;
import com.finovex.enums.LoginResult;
import com.finovex.enums.MasterDataStatus;
import com.finovex.enums.SessionEndReason;
import com.finovex.exception.ApiException;
import com.finovex.exception.ErrorCode;
import com.finovex.manager.BusinessManager;
import com.finovex.manager.LoginAuditManager;
import com.finovex.manager.RefreshTokenManager;
import com.finovex.manager.RefreshTokenManager.IssuedRefreshToken;
import com.finovex.manager.RefreshTokenManager.Rotation;
import com.finovex.repository.UserRepository;
import com.finovex.security.JwtService;
import com.finovex.security.JwtService.IssuedToken;

/** Unit test: the manager's rules alone, with the repository and collaborators mocked. */
@ExtendWith(MockitoExtension.class)
class AuthManagerImplTest {

	private static final String UNKNOWN_USER_HASH = "{bcrypt}unknown-user-hash";

	private static final ClientInfo CLIENT = new ClientInfo("203.0.113.7", "JUnit");

	private static final Integer DELETED = MasterDataStatus.DELETED.getStatusSeq();

	@Mock
	private UserRepository userRepository;

	@Mock
	private PasswordEncoder passwordEncoder;

	@Mock
	private JwtService jwtService;

	@Mock
	private BusinessManager businessManager;

	@Mock
	private RefreshTokenManager refreshTokenManager;

	@Mock
	private LoginAuditManager loginAuditManager;

	private AuthManagerImpl authManager;

	@BeforeEach
	void setUp() {
		when(this.passwordEncoder.encode(anyString())).thenReturn(UNKNOWN_USER_HASH);
		this.authManager = new AuthManagerImpl(this.userRepository, this.passwordEncoder, this.jwtService,
				this.businessManager, this.refreshTokenManager, this.loginAuditManager);
	}

	@Test
	void signupStoresAnActiveUserAndMakesThemOwnerOfTheirBusiness() {
		when(this.passwordEncoder.encode("secret123")).thenReturn("{bcrypt}hashed");
		when(this.userRepository.save(any(User.class))).thenAnswer((invocation) -> {
			User user = invocation.getArgument(0);
			user.setUserSeq(42);
			return user;
		});

		var response = this.authManager.signup(new SignupRequest(" Jane Perera ", "Perera Stores",
				" Jane.Perera ", "Jane@Example.com", "secret123"));

		ArgumentCaptor<User> saved = ArgumentCaptor.forClass(User.class);
		verify(this.userRepository).save(saved.capture());
		assertThat(saved.getValue().getUsername()).isEqualTo("jane.perera");
		assertThat(saved.getValue().getEmail()).isEqualTo("jane@example.com");
		assertThat(saved.getValue().getName()).isEqualTo("Jane Perera");
		assertThat(saved.getValue().getPasswordHash()).isEqualTo("{bcrypt}hashed");
		assertThat(saved.getValue().getStatus()).isEqualTo(MasterDataStatus.APPROVED.getStatusSeq());
		assertThat(saved.getValue().getStatusDescription()).isEqualTo("APPROVED");
		assertThat(response.id()).isEqualTo("42");
		verify(this.businessManager).createWithOwner("Perera Stores", saved.getValue());
	}

	@Test
	void signupRejectsTakenUsernameAndEmailTogether() {
		when(this.userRepository.existsByUsername("jane")).thenReturn(true);
		when(this.userRepository.existsByEmail("jane@example.com")).thenReturn(true);

		assertThatThrownBy(() -> this.authManager
			.signup(new SignupRequest("Jane", "Shop", "jane", "jane@example.com", "secret123")))
			.isInstanceOfSatisfying(ApiException.class, (ex) -> {
				assertThat(ex.getErrorCode()).isEqualTo(ErrorCode.ACCOUNT_EXISTS);
				assertThat(ex.getFieldErrors()).containsOnlyKeys("username", "email");
			});
		verify(this.userRepository, never()).save(any());
		verify(this.businessManager, never()).createWithOwner(any(), any());
	}

	@Test
	void loginStartsASessionAndAuditsTheSuccess() {
		User user = user(MasterDataStatus.APPROVED);
		when(this.userRepository.findByUsernameAndStatusNot("jane", DELETED)).thenReturn(Optional.of(user));
		when(this.passwordEncoder.matches("secret123", "{bcrypt}real")).thenReturn(true);
		IssuedRefreshToken refreshToken = new IssuedRefreshToken("refresh-1", "session-1", new Date());
		when(this.refreshTokenManager.startSession(user, CLIENT)).thenReturn(refreshToken);
		when(this.jwtService.issue(eq(user), eq("session-1"), any(Instant.class)))
			.thenReturn(new IssuedToken("access-1", 900));

		AuthResult result = this.authManager.login(new LoginRequest(" Jane ", "secret123"), CLIENT);

		assertThat(result.refreshToken()).isEqualTo("refresh-1");
		assertThat(result.response().accessToken()).isEqualTo("access-1");
		assertThat(result.response().expiresIn()).isEqualTo(900);
		assertThat(result.response().user().id()).isEqualTo("7");
		verify(this.loginAuditManager).record(LoginEvent.LOGIN, LoginResult.SUCCESS, 7, "jane", "session-1", CLIENT);
	}

	@Test
	void loginWithUnknownUsernameStillChecksAPasswordAndIsAuditedWithoutAnAccount() {
		when(this.userRepository.findByUsernameAndStatusNot("ghost", DELETED)).thenReturn(Optional.empty());

		assertThatThrownBy(() -> this.authManager.login(new LoginRequest("Ghost", "whatever1"), CLIENT))
			.isInstanceOfSatisfying(ApiException.class,
					(ex) -> assertThat(ex.getErrorCode()).isEqualTo(ErrorCode.INVALID_CREDENTIALS));
		verify(this.passwordEncoder).matches(eq("whatever1"), eq(UNKNOWN_USER_HASH));
		verify(this.loginAuditManager).record(LoginEvent.LOGIN, LoginResult.INVALID_CREDENTIALS, null, "ghost", null,
				CLIENT);
		verifyNoInteractions(this.refreshTokenManager, this.jwtService);
	}

	@Test
	void loginWithWrongPasswordFailsAndIsAuditedAgainstTheAccount() {
		User user = user(MasterDataStatus.APPROVED);
		when(this.userRepository.findByUsernameAndStatusNot("jane", DELETED)).thenReturn(Optional.of(user));
		when(this.passwordEncoder.matches("wrong-pass1", "{bcrypt}real")).thenReturn(false);

		assertThatThrownBy(() -> this.authManager.login(new LoginRequest("jane", "wrong-pass1"), CLIENT))
			.isInstanceOfSatisfying(ApiException.class,
					(ex) -> assertThat(ex.getErrorCode()).isEqualTo(ErrorCode.INVALID_CREDENTIALS));
		verify(this.loginAuditManager).record(LoginEvent.LOGIN, LoginResult.INVALID_CREDENTIALS, 7, "jane", null,
				CLIENT);
		verifyNoInteractions(this.refreshTokenManager, this.jwtService);
	}

	@Test
	void inactiveAccountCannotSignInEvenWithTheRightPassword() {
		User user = user(MasterDataStatus.OPEN);
		when(this.userRepository.findByUsernameAndStatusNot("jane", DELETED)).thenReturn(Optional.of(user));
		when(this.passwordEncoder.matches("secret123", "{bcrypt}real")).thenReturn(true);

		assertThatThrownBy(() -> this.authManager.login(new LoginRequest("jane", "secret123"), CLIENT))
			.isInstanceOfSatisfying(ApiException.class,
					(ex) -> assertThat(ex.getErrorCode()).isEqualTo(ErrorCode.ACCOUNT_DISABLED));
		verify(this.loginAuditManager).record(LoginEvent.LOGIN, LoginResult.ACCOUNT_DISABLED, 7, "jane", null,
				CLIENT);
		verifyNoInteractions(this.refreshTokenManager, this.jwtService);
	}

	@Test
	void refreshWithoutACookieEndsTheSessionWithoutAnAuditRow() {
		assertThatThrownBy(() -> this.authManager.refresh(null, CLIENT)).isInstanceOfSatisfying(ApiException.class,
				(ex) -> assertThat(ex.getErrorCode()).isEqualTo(ErrorCode.SESSION_EXPIRED));
		verifyNoInteractions(this.refreshTokenManager, this.loginAuditManager);
	}

	@Test
	void refreshIssuesANewAccessTokenForTheSameSession() {
		User user = user(MasterDataStatus.APPROVED);
		IssuedRefreshToken next = new IssuedRefreshToken("refresh-2", "session-1", new Date());
		when(this.refreshTokenManager.rotate("refresh-1", CLIENT))
			.thenReturn(new Rotation(LoginResult.SUCCESS, user, "session-1", next));
		when(this.jwtService.issue(eq(user), eq("session-1"), any(Instant.class)))
			.thenReturn(new IssuedToken("access-2", 900));

		AuthResult result = this.authManager.refresh("refresh-1", CLIENT);

		assertThat(result.refreshToken()).isEqualTo("refresh-2");
		assertThat(result.response().accessToken()).isEqualTo("access-2");
		verify(this.loginAuditManager).record(LoginEvent.REFRESH, LoginResult.SUCCESS, 7, "jane", "session-1", CLIENT);
	}

	@Test
	void aFailedRefreshIsAuditedWithItsReasonButTheClientOnlyHearsSessionExpired() {
		User user = user(MasterDataStatus.APPROVED);
		when(this.refreshTokenManager.rotate("stolen", CLIENT))
			.thenReturn(new Rotation(LoginResult.TOKEN_REUSED, user, "session-1", null));

		assertThatThrownBy(() -> this.authManager.refresh("stolen", CLIENT)).isInstanceOfSatisfying(
				ApiException.class, (ex) -> assertThat(ex.getErrorCode()).isEqualTo(ErrorCode.SESSION_EXPIRED));
		verify(this.loginAuditManager).record(LoginEvent.REFRESH, LoginResult.TOKEN_REUSED, 7, "jane", "session-1",
				CLIENT);
		verifyNoInteractions(this.jwtService);
	}

	@Test
	void refreshWithAnUnknownTokenIsAuditedWithoutAnAccount() {
		when(this.refreshTokenManager.rotate("made-up", CLIENT))
			.thenReturn(new Rotation(LoginResult.INVALID_TOKEN, null, null, null));

		assertThatThrownBy(() -> this.authManager.refresh("made-up", CLIENT)).isInstanceOf(ApiException.class);
		verify(this.loginAuditManager).record(eq(LoginEvent.REFRESH), eq(LoginResult.INVALID_TOKEN), isNull(),
				isNull(), isNull(), eq(CLIENT));
	}

	@Test
	void logoutEndsTheSessionAndAuditsIt() {
		RefreshToken token = new RefreshToken();
		token.setUser(user(MasterDataStatus.APPROVED));
		token.setUserSeq(7);
		token.setSessionId("session-1");
		when(this.refreshTokenManager.endSession("refresh-1", SessionEndReason.LOGOUT)).thenReturn(Optional.of(token));

		this.authManager.logout("refresh-1", CLIENT);

		verify(this.loginAuditManager).record(LoginEvent.LOGOUT, LoginResult.SUCCESS, 7, "jane", "session-1", CLIENT);
	}

	@Test
	void logoutWithoutACookieOrWithAnUnknownTokenDoesNothing() {
		this.authManager.logout(null, CLIENT);
		when(this.refreshTokenManager.endSession("made-up", SessionEndReason.LOGOUT)).thenReturn(Optional.empty());
		this.authManager.logout("made-up", CLIENT);

		verifyNoInteractions(this.loginAuditManager);
	}

	private static User user(MasterDataStatus status) {
		User user = new User();
		user.setUserSeq(7);
		user.setUsername("jane");
		user.setName("Jane");
		user.setEmail("jane@example.com");
		user.setPasswordHash("{bcrypt}real");
		user.setStatus(status.getStatusSeq());
		return user;
	}

}
