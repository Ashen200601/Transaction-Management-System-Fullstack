package com.finovex.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

/**
 * Body of POST /items. The rules and messages mirror the item form
 * ({@code Frontend/src/features/items/schemas.ts}); keep the two in step.
 *
 * @param price in the business currency's minor units (cents): 12.50 is 1250
 * @param unitId the id of an approved unit (GET /units)
 */
public record CreateItemRequest(
		@NotBlank(message = "Enter the item name")
		@Size(max = 120, message = "Keep the item name under 120 characters")
		String itemName,

		@NotBlank(message = "Use 1–30 letters, numbers, dots, dashes or underscores")
		@Pattern(regexp = "^\\s*[A-Za-z0-9._-]{1,30}\\s*$",
				message = "Use 1–30 letters, numbers, dots, dashes or underscores")
		String itemCode,

		@Size(max = 500, message = "Keep the description under 500 characters")
		String description,

		@NotNull(message = "Enter the price")
		@PositiveOrZero(message = "The price can't be negative")
		@Max(value = 99_999_999_999L, message = "Enter a smaller price")
		Long price,

		@NotBlank(message = "Choose a unit")
		@Pattern(regexp = "^\\s*\\d{1,9}\\s*$", message = "Choose a unit")
		String unitId) {
}
