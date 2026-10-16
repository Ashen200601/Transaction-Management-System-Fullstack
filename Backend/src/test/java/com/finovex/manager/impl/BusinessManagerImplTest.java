package com.finovex.manager.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.finovex.config.BusinessProperties;
import com.finovex.dto.response.BusinessResponse;
import com.finovex.entity.Business;
import com.finovex.entity.BusinessUser;
import com.finovex.entity.User;
import com.finovex.enums.BusinessRole;
import com.finovex.enums.MasterDataStatus;
import com.finovex.exception.ApiException;
import com.finovex.exception.ErrorCode;
import com.finovex.repository.BusinessRepository;
import com.finovex.repository.BusinessUserRepository;

@ExtendWith(MockitoExtension.class)
class BusinessManagerImplTest {

	@Mock
	private BusinessRepository businessRepository;

	@Mock
	private BusinessUserRepository businessUserRepository;

	private BusinessManagerImpl businessManager;

	@BeforeEach
	void setUp() {
		this.businessManager = new BusinessManagerImpl(this.businessRepository, this.businessUserRepository,
				new BusinessProperties("LKR"));
	}

	@Test
	void createWithOwnerMakesAnActiveBusinessInTheDefaultCurrencyOwnedByTheUser() {
		when(this.businessRepository.save(any(Business.class))).thenAnswer((invocation) -> {
			Business business = invocation.getArgument(0);
			business.setBusinessSeq(9);
			return business;
		});
		User owner = new User();
		owner.setUserSeq(3);

		Business business = this.businessManager.createWithOwner("  Perera Stores ", owner);

		assertThat(business.getBusinessSeq()).isEqualTo(9);
		assertThat(business.getName()).isEqualTo("Perera Stores");
		assertThat(business.getCurrency()).isEqualTo("LKR");
		assertThat(business.getStatus()).isEqualTo(MasterDataStatus.APPROVED.getStatusSeq());

		ArgumentCaptor<BusinessUser> membership = ArgumentCaptor.forClass(BusinessUser.class);
		verify(this.businessUserRepository).save(membership.capture());
		assertThat(membership.getValue().getBusiness()).isSameAs(business);
		assertThat(membership.getValue().getUser()).isSameAs(owner);
		assertThat(membership.getValue().getRole()).isEqualTo(BusinessRole.OWNER);
		assertThat(membership.getValue().getStatus()).isEqualTo(MasterDataStatus.APPROVED.getStatusSeq());
	}

	@Test
	void theActiveBusinessIsTheApprovedOneTheUserHasAnApprovedMembershipOf() {
		Business inactiveBusiness = business(7, "Old Store", MasterDataStatus.OPEN.getStatusSeq());
		Business leftBusiness = business(8, "Left Store", MasterDataStatus.APPROVED.getStatusSeq());
		Business current = business(9, "Perera Stores", MasterDataStatus.APPROVED.getStatusSeq());
		when(this.businessUserRepository.findByUserSeqAndStatusNot(3, MasterDataStatus.DELETED.getStatusSeq()))
			.thenReturn(List.of(membership(inactiveBusiness, MasterDataStatus.APPROVED.getStatusSeq()),
					membership(leftBusiness, MasterDataStatus.OPEN.getStatusSeq()),
					membership(current, MasterDataStatus.APPROVED.getStatusSeq())));

		assertThat(this.businessManager.activeBusinessOf(3)).isSameAs(current);
		assertThat(this.businessManager.current(3)).isEqualTo(new BusinessResponse("9", "Perera Stores", "LKR"));
	}

	@Test
	void aUserWithoutAnActiveBusinessIsRefused() {
		when(this.businessUserRepository.findByUserSeqAndStatusNot(3, MasterDataStatus.DELETED.getStatusSeq()))
			.thenReturn(List.of(membership(business(7, "Old Store", MasterDataStatus.OPEN.getStatusSeq()),
					MasterDataStatus.APPROVED.getStatusSeq())));

		assertThatThrownBy(() -> this.businessManager.activeBusinessOf(3)).isInstanceOfSatisfying(ApiException.class,
				(ex) -> assertThat(ex.getErrorCode()).isEqualTo(ErrorCode.FORBIDDEN));
	}

	private static Business business(Integer businessSeq, String name, Integer status) {
		Business business = new Business();
		business.setBusinessSeq(businessSeq);
		business.setName(name);
		business.setCurrency("LKR");
		business.setStatus(status);
		return business;
	}

	private static BusinessUser membership(Business business, Integer status) {
		BusinessUser membership = new BusinessUser();
		membership.setBusiness(business);
		membership.setStatus(status);
		return membership;
	}

}
