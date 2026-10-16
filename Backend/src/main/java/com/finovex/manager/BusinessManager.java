package com.finovex.manager;

import com.finovex.dto.response.BusinessResponse;
import com.finovex.entity.Business;
import com.finovex.entity.User;

/**
 * Businesses (tenants) and their members. Implemented by {@code BusinessManagerImpl}.
 * Methods returning entities are for other managers; controllers get DTOs.
 */
public interface BusinessManager {

	/**
	 * Creates an active business in the default currency, with {@code owner} as its OWNER.
	 * Runs in the caller's transaction, so a failure here undoes the caller's work too.
	 */
	Business createWithOwner(String name, User owner);

	/**
	 * The business the user works in: an approved business they have an approved membership of.
	 * Each user has one today (made at sign-up); when users can join several, the frontend will say
	 * which one it means.
	 * @throws com.finovex.exception.ApiException FORBIDDEN if there is none
	 */
	Business activeBusinessOf(Integer userSeq);

	/** {@link #activeBusinessOf} for the API, e.g. the business name in the app's header bar. */
	BusinessResponse current(Integer userSeq);

}
