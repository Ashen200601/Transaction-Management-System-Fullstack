package com.finovex.mapper;

import com.finovex.dto.response.StakeholderTypeResponse;
import com.finovex.entity.StakeholderType;

/** Entity to response DTO. Ids go out as strings because the frontend types every id as a string. */
public final class StakeholderTypeMapper {

	private StakeholderTypeMapper() {
	}

	public static StakeholderTypeResponse toResponse(StakeholderType stakeholderType) {
		return new StakeholderTypeResponse(String.valueOf(stakeholderType.getStakeholderTypeSeq()),
				stakeholderType.getStakeholderTypeCode(), stakeholderType.getStakeholderTypeName());
	}

}
