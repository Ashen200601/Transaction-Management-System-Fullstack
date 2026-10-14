package com.finovex.manager;

import com.finovex.entity.Business;
import com.finovex.entity.User;

/**
 * Businesses (tenants) and their members. Implemented by {@code BusinessManagerImpl}.
 * Returns entities because only other managers call it; controllers get DTOs.
 */
public interface BusinessManager {

	/**
	 * Creates an active business in the default currency, with {@code owner} as its OWNER.
	 * Runs in the caller's transaction, so a failure here undoes the caller's work too.
	 */
	Business createWithOwner(String name, User owner);

}
