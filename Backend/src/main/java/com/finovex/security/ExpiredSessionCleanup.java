package com.finovex.security;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import com.finovex.manager.RefreshTokenManager;

/** Every night, deletes refresh tokens whose sessions are over, so the table doesn't keep growing. */
@Component
public class ExpiredSessionCleanup {

	private static final Logger log = LoggerFactory.getLogger(ExpiredSessionCleanup.class);

	private final RefreshTokenManager refreshTokenManager;

	public ExpiredSessionCleanup(RefreshTokenManager refreshTokenManager) {
		this.refreshTokenManager = refreshTokenManager;
	}

	@Scheduled(cron = "${finovex.security.session.cleanup-cron:0 30 3 * * *}")
	public void deleteExpiredRefreshTokens() {
		int deleted = this.refreshTokenManager.deleteExpired();
		log.info("Deleted {} refresh tokens of ended sessions", deleted);
	}

}
