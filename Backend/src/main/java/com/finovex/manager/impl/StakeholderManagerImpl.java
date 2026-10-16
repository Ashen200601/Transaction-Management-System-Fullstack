package com.finovex.manager.impl;

import java.util.List;
import java.util.Locale;
import java.util.Map;

import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.finovex.dto.request.CreateStakeholderRequest;
import com.finovex.dto.request.StakeholderSearchRequest;
import com.finovex.dto.response.StakeholderResponse;
import com.finovex.entity.Business;
import com.finovex.entity.Stakeholder;
import com.finovex.entity.StakeholderType;
import com.finovex.enums.MasterDataStatus;
import com.finovex.exception.ApiException;
import com.finovex.exception.ErrorCode;
import com.finovex.manager.BusinessManager;
import com.finovex.manager.StakeholderManager;
import com.finovex.manager.StakeholderTypeManager;
import com.finovex.mapper.StakeholderMapper;
import com.finovex.repository.StakeholderRepository;
import com.finovex.repository.StakeholderSpecifications;

@Service
public class StakeholderManagerImpl implements StakeholderManager {

	private static final Integer APPROVED = MasterDataStatus.APPROVED.getStatusSeq();

	private static final Integer DELETED = MasterDataStatus.DELETED.getStatusSeq();

	private final StakeholderRepository stakeholderRepository;

	private final BusinessManager businessManager;

	private final StakeholderTypeManager stakeholderTypeManager;

	public StakeholderManagerImpl(StakeholderRepository stakeholderRepository, BusinessManager businessManager,
			StakeholderTypeManager stakeholderTypeManager) {
		this.stakeholderRepository = stakeholderRepository;
		this.businessManager = businessManager;
		this.stakeholderTypeManager = stakeholderTypeManager;
	}

	@Override
	@Transactional
	public StakeholderResponse create(Integer userSeq, CreateStakeholderRequest request) {
		Business business = this.businessManager.activeBusinessOf(userSeq);
		String stakeholderCode = request.stakeholderCode().trim().toUpperCase(Locale.ROOT);

		if (this.stakeholderRepository.existsByBusinessSeqAndStakeholderCodeIgnoreCaseAndStatusNot(
				business.getBusinessSeq(), stakeholderCode, DELETED)) {
			throw new ApiException(ErrorCode.CONFLICT, "Another stakeholder already uses this code.",
					Map.of("stakeholderCode", List.of("Another stakeholder already uses this code. Try another.")));
		}
		List<StakeholderType> types = this.stakeholderTypeManager.usableTypes(request.stakeholderTypeIds());

		Stakeholder stakeholder = new Stakeholder();
		stakeholder.setBusiness(business);
		stakeholder.setStakeholderCode(stakeholderCode);
		stakeholder.setStakeholderName(request.stakeholderName().trim());
		stakeholder.setPhone(blankToNull(request.phone()));
		stakeholder.setEmail(blankToNull(request.email()));
		stakeholder.setAddress(blankToNull(request.address()));
		stakeholder.setTaxNo(blankToNull(request.taxNo()));
		stakeholder.setStatus(APPROVED);
		types.forEach(stakeholder::addStakeholderType);
		return StakeholderMapper.toResponse(this.stakeholderRepository.save(stakeholder));
	}

	@Override
	@Transactional(readOnly = true)
	public List<StakeholderResponse> search(Integer userSeq, StakeholderSearchRequest search) {
		Business business = this.businessManager.activeBusinessOf(userSeq);
		return this.stakeholderRepository
			.findAll(StakeholderSpecifications.search(business.getBusinessSeq(), search), Sort.by("stakeholderCode"))
			.stream()
			.map(StakeholderMapper::toResponse)
			.toList();
	}


	private static String blankToNull(String value) {
		return (value == null || value.isBlank()) ? null : value.trim();
	}

}
