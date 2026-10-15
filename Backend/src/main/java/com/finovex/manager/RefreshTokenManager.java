package com.finovex.manager;

import java.util.Date;
import java.util.Optional;

import com.finovex.dto.request.ClientInfo;
import com.finovex.entity.RefreshToken;
import com.finovex.entity.User;
import com.finovex.enums.LoginResult;
import com.finovex.enums.SessionEndReason;

/**
 * Sign-in sessions and their refresh tokens. Implemented by {@code RefreshTokenManagerImpl}.
 * Returns entities because only other managers call it.
 */
public interface RefreshTokenManager {

	/** Starts a session for the user, ending {@code finovex.security.session.ttl} from now. */
	IssuedRefreshToken startSession(User user, ClientInfo client);

	/**
	 * Uses up a refresh token and issues the next one in the same session. A token that was
	 * already used (outside the short reuse grace) ends the whole session: it was copied. Runs
	 * in its own transaction, so an ended session stays ended even though the caller then fails.
	 */
	Rotation rotate(String refreshToken, ClientInfo client);

	/** Ends the token's session. Empty when the token isn't known. The token's user is loaded. */
	Optional<RefreshToken> endSession(String refreshToken, SessionEndReason reason);

	/** Deletes the tokens of sessions that ended more than a day ago. Returns how many. */
	int deleteExpired();

	/**
	 * @param value the token for the cookie; only its hash is stored
	 * @param expiresDate when the session ends
	 */
	record IssuedRefreshToken(String value, String sessionId, Date expiresDate) {
	}

	/**
	 * The outcome of {@link #rotate}. {@code user} and {@code sessionId} are null for an unknown
	 * token, {@code next} is null unless it succeeded. {@code user} is loaded.
	 */
	record Rotation(LoginResult result, User user, String sessionId, IssuedRefreshToken next) {

		public boolean succeeded() {
			return this.result == LoginResult.SUCCESS;
		}

	}

}
