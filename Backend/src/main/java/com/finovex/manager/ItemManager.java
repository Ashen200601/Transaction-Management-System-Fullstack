package com.finovex.manager;

import java.util.List;

import com.finovex.dto.request.CreateItemRequest;
import com.finovex.dto.request.ItemSearchRequest;
import com.finovex.dto.response.ItemResponse;

/** Items a business sells. Implemented by {@code ItemManagerImpl}. */
public interface ItemManager {

	/**
	 * Creates an item in the signed-in user's business.
	 * @param userSeq the signed-in user (the access token's subject)
	 * @throws com.finovex.exception.ApiException CONFLICT if the business already uses the item code,
	 * VALIDATION_ERROR if the unit isn't an approved one, FORBIDDEN if the user doesn't belong to an active business
	 */
	ItemResponse create(Integer userSeq, CreateItemRequest request);

	/**
	 * The signed-in user's business's items that match {@code search}, ordered by item code. Deleted
	 * items are left out; empty filters match everything.
	 * @param userSeq the signed-in user (the access token's subject)
	 * @throws com.finovex.exception.ApiException VALIDATION_ERROR if minPrice is above maxPrice,
	 * FORBIDDEN if the user doesn't belong to an active business
	 */
	List<ItemResponse> search(Integer userSeq, ItemSearchRequest search);

}
