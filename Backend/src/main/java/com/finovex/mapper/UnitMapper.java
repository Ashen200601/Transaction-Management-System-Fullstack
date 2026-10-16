package com.finovex.mapper;

import com.finovex.dto.response.UnitResponse;
import com.finovex.entity.Unit;

/** Entity to response DTO. Ids go out as strings because the frontend types every id as a string. */
public final class UnitMapper {

	private UnitMapper() {
	}

	public static UnitResponse toResponse(Unit unit) {
		return new UnitResponse(String.valueOf(unit.getUnitSeq()), unit.getUnitCode(), unit.getUnitName());
	}

}
