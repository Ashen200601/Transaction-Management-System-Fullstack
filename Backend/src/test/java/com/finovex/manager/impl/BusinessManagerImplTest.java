package com.finovex.manager.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.finovex.config.BusinessProperties;
import com.finovex.entity.Business;
import com.finovex.entity.BusinessUser;
import com.finovex.entity.User;
import com.finovex.enums.BusinessRole;
import com.finovex.enums.MasterDataStatus;
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
		assertThat(business.getStatus()).isEqualTo(MasterDataStatus.ACTIVE.getStatusSeq());

		ArgumentCaptor<BusinessUser> membership = ArgumentCaptor.forClass(BusinessUser.class);
		verify(this.businessUserRepository).save(membership.capture());
		assertThat(membership.getValue().getBusiness()).isSameAs(business);
		assertThat(membership.getValue().getUser()).isSameAs(owner);
		assertThat(membership.getValue().getRole()).isEqualTo(BusinessRole.OWNER);
		assertThat(membership.getValue().getStatus()).isEqualTo(MasterDataStatus.ACTIVE.getStatusSeq());
	}

}
