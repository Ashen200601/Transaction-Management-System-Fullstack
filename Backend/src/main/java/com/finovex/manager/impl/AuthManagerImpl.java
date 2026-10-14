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

import com.finovex.dto.request.LoginRequest;
import com.finovex.dto.request.RegisterRequest;
import com.finovex.dto.response.LoginResponse;
import com.finovex.dto.response.RegisteredAccountResponse;
import com.finovex.entity.User;
import com.finovex.enums.MasterDataStatus;
import com.finovex.exception.ApiException;
import com.finovex.exception.ErrorCode;
import com.finovex.manager.AuthManager;
import com.finovex.mapper.UserMapper;
import com.finovex.repository.UserRepository;
import com.finovex.security.JwtService;
import com.finovex.security.JwtService.IssuedToken;

@Service
public class AuthManagerImpl implements AuthManager {

	private final UserRepository userRepository;

	private final PasswordEncoder passwordEncoder;

	private final JwtService jwtService;

	/**
	 * Checked when the username doesn't exist, so an unknown username takes as long to reject
	 * as a wrong password and can't be detected by timing.
	 */
	private final String unknownUserPasswordHash;

	public AuthManagerImpl(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtService jwtService) {
		this.userRepository = userRepository;
		this.passwordEncoder = passwordEncoder;
		this.jwtService = jwtService;
		this.unknownUserPasswordHash = passwordEncoder.encode(UUID.randomUUID().toString());
	}

	@Override
	@Transactional
	public RegisteredAccountResponse register(RegisterRequest request) {
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
		user.setStatus(MasterDataStatus.ACTIVE.getStatusSeq());
		user = this.userRepository.save(user);
		return new RegisteredAccountResponse(String.valueOf(user.getUserSeq()), user.getUsername());
	}

	@Override
	@Transactional(readOnly = true)
	public LoginResponse login(LoginRequest request) {
		Optional<User> user = this.userRepository.findByUsername(normalize(request.username()));
		String passwordHash = user.map(User::getPasswordHash).orElse(this.unknownUserPasswordHash);
		boolean passwordMatches = this.passwordEncoder.matches(request.password(), passwordHash);
		if (user.isEmpty() || !passwordMatches) {
			// Same answer for both, so nobody can find out which usernames exist.
			throw new ApiException(ErrorCode.INVALID_CREDENTIALS, "Incorrect username or password.");
		}
		if (!MasterDataStatus.ACTIVE.getStatusSeq().equals(user.get().getStatus())) {
			throw new ApiException(ErrorCode.ACCOUNT_DISABLED,
					"This account is disabled. Contact your administrator.");
		}

		IssuedToken token = this.jwtService.issue(user.get());
		return new LoginResponse(token.value(), token.expiresInSeconds(), UserMapper.toResponse(user.get()));
	}

	private static String normalize(String value) {
		return value.trim().toLowerCase(Locale.ROOT);
	}

}
