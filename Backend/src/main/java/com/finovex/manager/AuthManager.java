package com.finovex.manager;

import com.finovex.dto.request.LoginRequest;
import com.finovex.dto.request.RegisterRequest;
import com.finovex.dto.response.LoginResponse;
import com.finovex.dto.response.RegisteredAccountResponse;

/** Account sign-up and sign-in. Implemented by {@code AuthManagerImpl}. */
public interface AuthManager {

	/** @throws com.finovex.exception.ApiException ACCOUNT_EXISTS when the username or email is taken */
	RegisteredAccountResponse register(RegisterRequest request);

	/**
	 * @throws com.finovex.exception.ApiException INVALID_CREDENTIALS for an unknown username or wrong
	 * password, ACCOUNT_DISABLED when the password is right but the account isn't active
	 */
	LoginResponse login(LoginRequest request);

}
