package com.finovex.manager;

import java.util.List;

import com.finovex.dto.request.CreateStakeholderRequest;
import com.finovex.dto.request.StakeholderSearchRequest;
import com.finovex.dto.response.StakeholderResponse;

/** The parties a business deals with. Implemented by {@code StakeholderManagerImpl}. */
public interface StakeholderManager {

	/**
	 * Creates a stakeholder, with its types, in the signed-in user's business.
	 * @param userSeq the signed-in user (the access token's subject)
	 * @throws com.finovex.exception.ApiException CONFLICT if the business already uses the code,
	 * VALIDATION_ERROR if a type isn't an approved one, FORBIDDEN if the user doesn't belong to an
	 * active business
	 */
	StakeholderResponse create(Integer userSeq, CreateStakeholderRequest request);

	/**
	 * The signed-in user's business's stakeholders that match {@code search}, ordered by code.
	 * Deleted stakeholders are left out; empty filters match everything.
	 * @param userSeq the signed-in user (the access token's subject)
	 * @throws com.finovex.exception.ApiException FORBIDDEN if the user doesn't belong to an active business
	 */
	List<StakeholderResponse> search(Integer userSeq, StakeholderSearchRequest search);

}
