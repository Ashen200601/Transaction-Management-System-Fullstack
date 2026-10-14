package com.finovex.enums;

/**
 * A user's role in one business, most to least privileged. Stored by name in
 * business_user.role. What each role may do is listed in
 * {@code Frontend/src/features/tenancy/permissions.ts}.
 */
public enum BusinessRole {

	OWNER,
	ADMIN,
	CASHIER,
	VIEWER

}
