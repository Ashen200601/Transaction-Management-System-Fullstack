package com.finovex.manager;

import com.finovex.dto.request.LoginRequest;
import com.finovex.dto.request.SignupRequest;
import com.finovex.dto.response.LoginResponse;
import com.finovex.dto.response.SignupResponse;

/** Account sign-up and sign-in. Implemented by {@code AuthManagerImpl}. */
public interface AuthManager {

	/**
	 * Creates the account and its first business, with the new user as the business's owner.
	 * All or nothing: if any part fails, nothing is saved.
	 * @throws com.finovex.exception.ApiException ACCOUNT_EXISTS when the username or email is taken
	 */
	SignupResponse signup(SignupRequest request);

	/**
	 * @throws com.finovex.exception.ApiException INVALID_CREDENTIALS for an unknown username or wrong
	 * password, ACCOUNT_DISABLED when the password is right but the account isn't active
	 */
	LoginResponse login(LoginRequest request);

}
