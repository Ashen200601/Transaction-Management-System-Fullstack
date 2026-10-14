package com.finovex.manager.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.finovex.dto.request.LoginRequest;
import com.finovex.dto.request.SignupRequest;
import com.finovex.entity.User;
import com.finovex.enums.MasterDataStatus;
import com.finovex.exception.ApiException;
import com.finovex.exception.ErrorCode;
import com.finovex.manager.BusinessManager;
import com.finovex.repository.UserRepository;
import com.finovex.security.JwtService;

/** Unit test: the manager's rules alone, with the repository and collaborators mocked. */
@ExtendWith(MockitoExtension.class)
class AuthManagerImplTest {

	private static final String UNKNOWN_USER_HASH = "{bcrypt}unknown-user-hash";

	@Mock
	private UserRepository userRepository;

	@Mock
	private PasswordEncoder passwordEncoder;

	@Mock
	private JwtService jwtService;

	@Mock
	private BusinessManager businessManager;

	private AuthManagerImpl authManager;

	@BeforeEach
	void setUp() {
		when(this.passwordEncoder.encode(anyString())).thenReturn(UNKNOWN_USER_HASH);
		this.authManager = new AuthManagerImpl(this.userRepository, this.passwordEncoder, this.jwtService,
				this.businessManager);
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
		assertThat(saved.getValue().getStatus()).isEqualTo(MasterDataStatus.ACTIVE.getStatusSeq());
		assertThat(saved.getValue().getStatusDescription()).isEqualTo("Active");
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
	void loginWithUnknownUsernameStillChecksAPasswordAndFailsLikeAWrongPassword() {
		when(this.userRepository.findByUsername("ghost")).thenReturn(Optional.empty());

		assertThatThrownBy(() -> this.authManager.login(new LoginRequest("Ghost", "whatever1")))
			.isInstanceOfSatisfying(ApiException.class,
					(ex) -> assertThat(ex.getErrorCode()).isEqualTo(ErrorCode.INVALID_CREDENTIALS));
		verify(this.passwordEncoder).matches(eq("whatever1"), eq(UNKNOWN_USER_HASH));
		verify(this.jwtService, never()).issue(any());
	}

	@Test
	void loginWithWrongPasswordFails() {
		User user = user(MasterDataStatus.ACTIVE);
		when(this.userRepository.findByUsername("jane")).thenReturn(Optional.of(user));
		when(this.passwordEncoder.matches("wrong-pass1", "{bcrypt}real")).thenReturn(false);

		assertThatThrownBy(() -> this.authManager.login(new LoginRequest("jane", "wrong-pass1")))
			.isInstanceOfSatisfying(ApiException.class,
					(ex) -> assertThat(ex.getErrorCode()).isEqualTo(ErrorCode.INVALID_CREDENTIALS));
		verify(this.jwtService, never()).issue(any());
	}

	@Test
	void inactiveAccountCannotSignInEvenWithTheRightPassword() {
		User user = user(MasterDataStatus.INACTIVE);
		when(this.userRepository.findByUsername("jane")).thenReturn(Optional.of(user));
		when(this.passwordEncoder.matches("secret123", "{bcrypt}real")).thenReturn(true);

		assertThatThrownBy(() -> this.authManager.login(new LoginRequest("jane", "secret123")))
			.isInstanceOfSatisfying(ApiException.class,
					(ex) -> assertThat(ex.getErrorCode()).isEqualTo(ErrorCode.ACCOUNT_DISABLED));
		verify(this.jwtService, never()).issue(any());
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
