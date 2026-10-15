package com.finovex.dto.request;

import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

/**
 * Query parameters of GET /items. Every filter is optional; leave them all out to list every item.
 * The form is {@code Frontend/src/features/items/schemas.ts} (itemSearchSchema).
 *
 * @param itemCode part of the item code, any case
 * @param itemName part of the item name, any case
 * @param unit an exact unit code such as KG
 * @param minPrice lowest price, inclusive, in minor units (cents)
 * @param maxPrice highest price, inclusive, in minor units (cents)
 */
public record ItemSearchRequest(
		@Size(max = 30, message = "Keep the item code under 30 characters")
		String itemCode,

		@Size(max = 120, message = "Keep the item name under 120 characters")
		String itemName,

		@Size(max = 20, message = "Choose a unit")
		String unit,

		@PositiveOrZero(message = "The price can't be negative")
		Long minPrice,

		@PositiveOrZero(message = "The price can't be negative")
		Long maxPrice) {
}
