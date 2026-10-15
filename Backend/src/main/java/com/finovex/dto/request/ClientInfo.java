package com.finovex.dto.request;

/**
 * Who is calling, from the HTTP request rather than its body: kept with refresh tokens and in
 * the login audit. Values are cut to fit their columns.
 */
public record ClientInfo(String ipAddress, String userAgent) {

	private static final int MAX_IP_LENGTH = 45;

	private static final int MAX_USER_AGENT_LENGTH = 500;

	public ClientInfo {
		ipAddress = truncate(ipAddress, MAX_IP_LENGTH);
		userAgent = truncate(userAgent, MAX_USER_AGENT_LENGTH);
	}

	private static String truncate(String value, int maxLength) {
		return value == null || value.length() <= maxLength ? value : value.substring(0, maxLength);
	}

}
