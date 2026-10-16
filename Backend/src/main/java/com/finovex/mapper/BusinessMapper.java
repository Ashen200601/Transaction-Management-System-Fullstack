package com.finovex.mapper;

import com.finovex.dto.response.BusinessResponse;
import com.finovex.entity.Business;

/** Entity to response DTO. Ids go out as strings because the frontend types every id as a string. */
public final class BusinessMapper {

	private BusinessMapper() {
	}

	public static BusinessResponse toResponse(Business business) {
		return new BusinessResponse(String.valueOf(business.getBusinessSeq()), business.getName(),
				business.getCurrency());
	}

}
