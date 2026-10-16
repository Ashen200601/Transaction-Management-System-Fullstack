package com.finovex.manager.impl;

import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.finovex.dto.response.UnitResponse;
import com.finovex.entity.Unit;
import com.finovex.enums.MasterDataStatus;
import com.finovex.exception.ApiException;
import com.finovex.exception.ErrorCode;
import com.finovex.manager.UnitManager;
import com.finovex.mapper.UnitMapper;
import com.finovex.repository.UnitRepository;

@Service
public class UnitManagerImpl implements UnitManager {

	private static final Integer APPROVED = MasterDataStatus.APPROVED.getStatusSeq();

	private final UnitRepository unitRepository;

	public UnitManagerImpl(UnitRepository unitRepository) {
		this.unitRepository = unitRepository;
	}

	@Override
	@Transactional(readOnly = true)
	public List<UnitResponse> findUsable() {
		return this.unitRepository.findByStatusOrderByUnitSeq(APPROVED).stream().map(UnitMapper::toResponse).toList();
	}

	@Override
	@Transactional(readOnly = true)
	public Unit usableUnit(String unitId) {
		return this.unitRepository.findByUnitSeqAndStatus(Integer.valueOf(unitId.trim()), APPROVED)
			.orElseThrow(() -> new ApiException(ErrorCode.VALIDATION_ERROR, "Some fields need attention.",
					Map.of("unitId", List.of("Choose a unit"))));
	}

}
