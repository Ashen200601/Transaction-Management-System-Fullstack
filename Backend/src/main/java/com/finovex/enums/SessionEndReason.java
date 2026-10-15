package com.finovex.enums;

/** Why a sign-in session was ended early. Stored by name in refresh_token.revoked_reason. */
public enum SessionEndReason {

	/** The user signed out. */
	LOGOUT,

	/** A refresh token was used twice, so it was probably copied. */
	TOKEN_REUSED,

	/** The account was disabled during the session. */
	ACCOUNT_DISABLED

}
