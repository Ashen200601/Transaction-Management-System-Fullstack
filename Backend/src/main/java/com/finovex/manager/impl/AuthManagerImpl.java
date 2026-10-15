package com.finovex.manager.impl;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.finovex.dto.request.ClientInfo;
import com.finovex.dto.request.LoginRequest;
import com.finovex.dto.request.SignupRequest;
import com.finovex.dto.response.AuthResult;
import com.finovex.dto.response.LoginResponse;
import com.finovex.dto.response.SignupResponse;
import com.finovex.entity.User;
import com.finovex.enums.LoginEvent;
import com.finovex.enums.LoginResult;
import com.finovex.enums.MasterDataStatus;
import com.finovex.enums.SessionEndReason;
import com.finovex.exception.ApiException;
import com.finovex.exception.ErrorCode;
import com.finovex.manager.AuthManager;
import com.finovex.manager.BusinessManager;
import com.finovex.manager.LoginAuditManager;
import com.finovex.manager.RefreshTokenManager;
import com.finovex.manager.RefreshTokenManager.IssuedRefreshToken;
import com.finovex.manager.RefreshTokenManager.Rotation;
import com.finovex.mapper.UserMapper;
import com.finovex.repository.UserRepository;
import com.finovex.security.JwtService;
import com.finovex.security.JwtService.IssuedToken;

@Service
public class AuthManagerImpl implements AuthManager {

	private final UserRepository userRepository;

	private final PasswordEncoder passwordEncoder;

	private final JwtService jwtService;

	private final BusinessManager businessManager;

	private final RefreshTokenManager refreshTokenManager;

	private final LoginAuditManager loginAuditManager;

	/**
	 * Checked when the username doesn't exist, so an unknown username takes as long to reject
	 * as a wrong password and can't be detected by timing.
	 */
	private final String unknownUserPasswordHash;

	public AuthManagerImpl(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtService jwtService,
			BusinessManager businessManager, RefreshTokenManager refreshTokenManager,
			LoginAuditManager loginAuditManager) {
		this.userRepository = userRepository;
		this.passwordEncoder = passwordEncoder;
		this.jwtService = jwtService;
		this.businessManager = businessManager;
		this.refreshTokenManager = refreshTokenManager;
		this.loginAuditManager = loginAuditManager;
		this.unknownUserPasswordHash = passwordEncoder.encode(UUID.randomUUID().toString());
	}

	@Override
	@Transactional
	public SignupResponse signup(SignupRequest request) {
		String username = normalize(request.username());
		String email = normalize(request.email());

		Map<String, List<String>> conflicts = new LinkedHashMap<>();
		if (this.userRepository.existsByUsername(username)) {
			conflicts.put("username", List.of("That username is taken. Try another."));
		}
		if (this.userRepository.existsByEmail(email)) {
			conflicts.put("email", List.of("An account with this email already exists. Sign in instead."));
		}
		if (!conflicts.isEmpty()) {
			throw new ApiException(ErrorCode.ACCOUNT_EXISTS, "Some details are already in use.", conflicts);
		}

		User user = new User();
		user.setUsername(username);
		user.setName(request.fullName().trim());
		user.setEmail(email);
		user.setPasswordHash(this.passwordEncoder.encode(request.password()));
		user.setStatus(MasterDataStatus.APPROVED.getStatusSeq());
		user = this.userRepository.save(user);

		// Same transaction: if the business can't be created, the account isn't either.
		this.businessManager.createWithOwner(request.businessName(), user);

		return new SignupResponse(String.valueOf(user.getUserSeq()), user.getUsername());
	}

	@Override
	@Transactional
	public AuthResult login(LoginRequest request, ClientInfo client) {
		String username = normalize(request.username());
		// A deleted account is treated as if it didn't exist.
		Optional<User> found = this.userRepository.findByUsernameAndStatusNot(username,
				MasterDataStatus.DELETED.getStatusSeq());
		String passwordHash = found.map(User::getPasswordHash).orElse(this.unknownUserPasswordHash);
		boolean passwordMatches = this.passwordEncoder.matches(request.password(), passwordHash);
		Integer userSeq = found.map(User::getUserSeq).orElse(null);
		if (found.isEmpty() || !passwordMatches) {
			this.loginAuditManager.record(LoginEvent.LOGIN, LoginResult.INVALID_CREDENTIALS, userSeq, username, null,
					client);
			// Same answer for both, so nobody can find out which usernames exist.
			throw new ApiException(ErrorCode.INVALID_CREDENTIALS, "Incorrect username or password.");
		}
		User user = found.get();
		// Only approved accounts sign in; an inactive (OPEN) one gets "disabled".
		if (!MasterDataStatus.APPROVED.getStatusSeq().equals(user.getStatus())) {
			this.loginAuditManager.record(LoginEvent.LOGIN, LoginResult.ACCOUNT_DISABLED, userSeq, username, null,
					client);
			throw new ApiException(ErrorCode.ACCOUNT_DISABLED,
					"This account is disabled. Contact your administrator.");
		}

		IssuedRefreshToken refreshToken = this.refreshTokenManager.startSession(user, client);
		this.loginAuditManager.record(LoginEvent.LOGIN, LoginResult.SUCCESS, userSeq, username,
				refreshToken.sessionId(), client);
		return authResult(user, refreshToken);
	}

	/**
	 * Not transactional: the rotation commits on its own, so a session ended for token reuse
	 * stays ended even though this then fails.
	 */
	@Override
	public AuthResult refresh(String refreshToken, ClientInfo client) {
		if (refreshToken == null || refreshToken.isBlank()) {
			// A visitor without a session. Not worth an audit row: the app asks on every page load.
			throw sessionEnded();
		}
		Rotation rotation = this.refreshTokenManager.rotate(refreshToken, client);
		User user = rotation.user();
		this.loginAuditManager.record(LoginEvent.REFRESH, rotation.result(), user == null ? null : user.getUserSeq(),
				user == null ? null : user.getUsername(), rotation.sessionId(), client);
		if (!rotation.succeeded()) {
			throw sessionEnded();
		}
		return authResult(user, rotation.next());
	}

	@Override
	public void logout(String refreshToken, ClientInfo client) {
		if (refreshToken == null || refreshToken.isBlank()) {
			return;
		}
		this.refreshTokenManager.endSession(refreshToken, SessionEndReason.LOGOUT)
			.ifPresent((token) -> this.loginAuditManager.record(LoginEvent.LOGOUT, LoginResult.SUCCESS,
					token.getUserSeq(), token.getUser().getUsername(), token.getSessionId(), client));
	}

	private AuthResult authResult(User user, IssuedRefreshToken refreshToken) {
		IssuedToken accessToken = this.jwtService.issue(user, refreshToken.sessionId(),
				refreshToken.expiresDate().toInstant());
		LoginResponse response = new LoginResponse(accessToken.value(), accessToken.expiresInSeconds(),
				UserMapper.toResponse(user));
		return new AuthResult(response, refreshToken.value());
	}

	private static ApiException sessionEnded() {
		return new ApiException(ErrorCode.SESSION_EXPIRED, "Your session has ended. Please sign in again.");
	}

	private static String normalize(String value) {
		return value.trim().toLowerCase(Locale.ROOT);
	}

}
