package com.finovex.manager;

import com.finovex.dto.request.ClientInfo;
import com.finovex.dto.request.LoginRequest;
import com.finovex.dto.request.SignupRequest;
import com.finovex.dto.response.AuthResult;
import com.finovex.dto.response.SignupResponse;

/**
 * Account sign-up, sign-in, refresh and sign-out. Every sign-in, refresh and sign-out is
 * written to the login audit. Implemented by {@code AuthManagerImpl}.
 */
public interface AuthManager {

	/**
	 * Creates the account and its first business, with the new user as the business's owner.
	 * All or nothing: if any part fails, nothing is saved.
	 * @throws com.finovex.exception.ApiException ACCOUNT_EXISTS when the username or email is taken
	 */
	SignupResponse signup(SignupRequest request);

	/**
	 * Checks the password and starts a session: a short access token plus a refresh token.
	 * @throws com.finovex.exception.ApiException INVALID_CREDENTIALS for an unknown username or wrong
	 * password, ACCOUNT_DISABLED when the password is right but the account isn't active
	 */
	AuthResult login(LoginRequest request, ClientInfo client);

	/**
	 * Exchanges a refresh token for a new access token and the next refresh token.
	 * @param refreshToken from the cookie; null when there is none
	 * @throws com.finovex.exception.ApiException SESSION_EXPIRED when there's no usable session
	 */
	AuthResult refresh(String refreshToken, ClientInfo client);

	/**
	 * Ends the refresh token's session, so it can't be refreshed again. Does nothing for a
	 * missing or unknown token.
	 */
	void logout(String refreshToken, ClientInfo client);

}
