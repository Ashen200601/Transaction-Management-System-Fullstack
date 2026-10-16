package com.finovex.manager.impl;

import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.finovex.dto.response.StakeholderTypeResponse;
import com.finovex.entity.StakeholderType;
import com.finovex.enums.MasterDataStatus;
import com.finovex.exception.ApiException;
import com.finovex.exception.ErrorCode;
import com.finovex.manager.StakeholderTypeManager;
import com.finovex.mapper.StakeholderTypeMapper;
import com.finovex.repository.StakeholderTypeRepository;

@Service
public class StakeholderTypeManagerImpl implements StakeholderTypeManager {

	private static final Integer APPROVED = MasterDataStatus.APPROVED.getStatusSeq();

	private final StakeholderTypeRepository stakeholderTypeRepository;

	public StakeholderTypeManagerImpl(StakeholderTypeRepository stakeholderTypeRepository) {
		this.stakeholderTypeRepository = stakeholderTypeRepository;
	}

	@Override
	@Transactional(readOnly = true)
	public List<StakeholderTypeResponse> findUsable() {
		return this.stakeholderTypeRepository.findByStatusOrderByStakeholderTypeSeq(APPROVED)
			.stream()
			.map(StakeholderTypeMapper::toResponse)
			.toList();
	}

	@Override
	@Transactional(readOnly = true)
	public List<StakeholderType> usableTypes(List<String> stakeholderTypeIds) {
		List<Integer> seqs = stakeholderTypeIds.stream().map((id) -> Integer.valueOf(id.trim())).distinct().toList();
		List<StakeholderType> types = this.stakeholderTypeRepository
			.findByStakeholderTypeSeqInAndStatusOrderByStakeholderTypeSeq(seqs, APPROVED);
		if (seqs.isEmpty() || types.size() != seqs.size()) {
			throw new ApiException(ErrorCode.VALIDATION_ERROR, "Some fields need attention.",
					Map.of("stakeholderTypeIds", List.of("Choose at least one stakeholder type from the list")));
		}
		return types;
	}

}
