package com.finovex.enums;

/**
 * How a sign-in, refresh or sign-out ended. Stored by name in user_login_audit. The client is
 * only told "wrong credentials" or "session ended"; the exact reason stays in the audit.
 */
public enum LoginResult {

	SUCCESS,

	/** Unknown username or wrong password. */
	INVALID_CREDENTIALS,

	/** Right password, but the account isn't active. */
	ACCOUNT_DISABLED,

	/** A refresh token that was never issued. */
	INVALID_TOKEN,

	/** The session's 8 hours are up. */
	SESSION_EXPIRED,

	/** The session was already ended, e.g. by signing out. */
	SESSION_REVOKED,

	/** A refresh token used a second time: it was copied, so the whole session was ended. */
	TOKEN_REUSED

}
