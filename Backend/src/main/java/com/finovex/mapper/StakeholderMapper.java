package com.finovex.mapper;

import java.util.Comparator;

import com.finovex.dto.response.StakeholderResponse;
import com.finovex.entity.Stakeholder;
import com.finovex.entity.StakeholderStakeholderType;
import com.finovex.entity.StakeholderType;
import com.finovex.enums.MasterDataStatus;

/** Entity to response DTO. Ids go out as strings because the frontend types every id as a string. */
public final class StakeholderMapper {

	private static final Integer DELETED = MasterDataStatus.DELETED.getStatusSeq();

	private StakeholderMapper() {
	}

	/** Deleted type links are left out; the rest are in type order. */
	public static StakeholderResponse toResponse(Stakeholder stakeholder) {
		return new StakeholderResponse(String.valueOf(stakeholder.getStakeholderSeq()),
				stakeholder.getStakeholderCode(), stakeholder.getStakeholderName(), stakeholder.getPhone(),
				stakeholder.getEmail(), stakeholder.getAddress(), stakeholder.getTaxNo(),
				stakeholder.getStakeholderStakeholderTypes()
					.stream()
					.filter((link) -> !DELETED.equals(link.getStatus()))
					.map(StakeholderStakeholderType::getStakeholderType)
					.sorted(Comparator.comparing(StakeholderType::getStakeholderTypeSeq))
					.map(StakeholderTypeMapper::toResponse)
					.toList());
	}

}
