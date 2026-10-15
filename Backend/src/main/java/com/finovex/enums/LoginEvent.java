package com.finovex.enums;

/** What a user_login_audit row records. Stored by name. */
public enum LoginEvent {

	/** A username and password sign-in attempt. */
	LOGIN,

	/** A refresh token exchanged for a new access token. */
	REFRESH,

	/** A sign-out. */
	LOGOUT

}
