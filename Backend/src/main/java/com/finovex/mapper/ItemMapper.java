package com.finovex.mapper;

import com.finovex.dto.response.ItemResponse;
import com.finovex.entity.Item;

/** Entity to response DTO. Ids go out as strings because the frontend types every id as a string. */
public final class ItemMapper {

	private ItemMapper() {
	}

	public static ItemResponse toResponse(Item item) {
		return new ItemResponse(String.valueOf(item.getItemSeq()), item.getItemCode(), item.getItemName(),
				item.getDescription(), item.getPrice(), item.getUnit());
	}

}
