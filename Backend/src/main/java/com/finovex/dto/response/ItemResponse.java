package com.finovex.dto.response;

/**
 * An item, as the frontend's {@code Item}.
 *
 * @param id the itemSeq as a string; the frontend treats every id as a string
 * @param price in the business currency's minor units (cents)
 * @param unit how the item is counted and sold
 */
public record ItemResponse(String id, String itemCode, String itemName, String description, long price,
		UnitResponse unit) {
}
