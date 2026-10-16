package com.finovex.manager.impl;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.finovex.config.BusinessProperties;
import com.finovex.dto.response.BusinessResponse;
import com.finovex.entity.Business;
import com.finovex.entity.BusinessUser;
import com.finovex.entity.User;
import com.finovex.enums.BusinessRole;
import com.finovex.enums.MasterDataStatus;
import com.finovex.exception.ApiException;
import com.finovex.exception.ErrorCode;
import com.finovex.manager.BusinessManager;
import com.finovex.mapper.BusinessMapper;
import com.finovex.repository.BusinessRepository;
import com.finovex.repository.BusinessUserRepository;

@Service
public class BusinessManagerImpl implements BusinessManager {

	private static final Integer APPROVED = MasterDataStatus.APPROVED.getStatusSeq();

	private static final Integer DELETED = MasterDataStatus.DELETED.getStatusSeq();

	private final BusinessRepository businessRepository;

	private final BusinessUserRepository businessUserRepository;

	private final String defaultCurrency;

	public BusinessManagerImpl(BusinessRepository businessRepository, BusinessUserRepository businessUserRepository,
			BusinessProperties properties) {
		this.businessRepository = businessRepository;
		this.businessUserRepository = businessUserRepository;
		this.defaultCurrency = properties.defaultCurrency();
	}

	@Override
	@Transactional
	public Business createWithOwner(String name, User owner) {
		Business business = new Business();
		business.setName(name.trim());
		business.setCurrency(this.defaultCurrency);
		business.setStatus(MasterDataStatus.APPROVED.getStatusSeq());
		business = this.businessRepository.save(business);

		BusinessUser membership = new BusinessUser();
		membership.setBusiness(business);
		membership.setUser(owner);
		membership.setRole(BusinessRole.OWNER);
		membership.setStatus(MasterDataStatus.APPROVED.getStatusSeq());
		this.businessUserRepository.save(membership);

		return business;
	}

	@Override
	@Transactional(readOnly = true)
	public Business activeBusinessOf(Integer userSeq) {
		return this.businessUserRepository.findByUserSeqAndStatusNot(userSeq, DELETED)
			.stream()
			.filter((membership) -> APPROVED.equals(membership.getStatus()))
			.map(BusinessUser::getBusiness)
			.filter((business) -> APPROVED.equals(business.getStatus()))
			.findFirst()
			.orElseThrow(() -> new ApiException(ErrorCode.FORBIDDEN, "Your account isn't part of an active business."));
	}

	@Override
	@Transactional(readOnly = true)
	public BusinessResponse current(Integer userSeq) {
		return BusinessMapper.toResponse(activeBusinessOf(userSeq));
	}

}
