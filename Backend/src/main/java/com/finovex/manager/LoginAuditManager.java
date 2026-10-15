package com.finovex.manager;

import com.finovex.dto.request.ClientInfo;
import com.finovex.enums.LoginEvent;
import com.finovex.enums.LoginResult;

/** Writes the login audit (user_login_audit). Implemented by {@code LoginAuditManagerImpl}. */
public interface LoginAuditManager {

	/**
	 * Saves one audit row in its own transaction, so it's kept even when the caller's work is
	 * rolled back, as it is for every failed sign-in.
	 *
	 * @param userSeq the account, or null when the username matched none
	 * @param username what was entered, or the account's username
	 * @param sessionId the sign-in session, when there is one
	 */
	void record(LoginEvent event, LoginResult result, Integer userSeq, String username, String sessionId,
			ClientInfo client);

}
