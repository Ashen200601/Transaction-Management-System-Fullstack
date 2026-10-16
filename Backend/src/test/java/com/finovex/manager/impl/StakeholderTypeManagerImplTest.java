package com.finovex.manager.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.finovex.dto.response.StakeholderTypeResponse;
import com.finovex.entity.StakeholderType;
import com.finovex.enums.MasterDataStatus;
import com.finovex.exception.ApiException;
import com.finovex.exception.ErrorCode;
import com.finovex.repository.StakeholderTypeRepository;

@ExtendWith(MockitoExtension.class)
class StakeholderTypeManagerImplTest {

	private static final Integer APPROVED = MasterDataStatus.APPROVED.getStatusSeq();

	@Mock
	private StakeholderTypeRepository stakeholderTypeRepository;

	private StakeholderTypeManagerImpl stakeholderTypeManager;

	@BeforeEach
	void setUp() {
		this.stakeholderTypeManager = new StakeholderTypeManagerImpl(this.stakeholderTypeRepository);
	}

	@Test
	void findUsableListsTheApprovedTypesInOrder() {
		when(this.stakeholderTypeRepository.findByStatusOrderByStakeholderTypeSeq(APPROVED))
			.thenReturn(List.of(type(1, "CUSTOMER", "Customer"), type(2, "VENDOR", "Vendor")));

		assertThat(this.stakeholderTypeManager.findUsable()).containsExactly(
				new StakeholderTypeResponse("1", "CUSTOMER", "Customer"),
				new StakeholderTypeResponse("2", "VENDOR", "Vendor"));
	}

	@Test
	void usableTypesReturnsEachRequestedTypeOnce() {
		List<StakeholderType> both = List.of(type(1, "CUSTOMER", "Customer"), type(2, "VENDOR", "Vendor"));
		when(this.stakeholderTypeRepository.findByStakeholderTypeSeqInAndStatusOrderByStakeholderTypeSeq(List.of(2, 1),
				APPROVED))
			.thenReturn(both);

		assertThat(this.stakeholderTypeManager.usableTypes(List.of("2", " 1 ", "2"))).isEqualTo(both);
	}

	@Test
	void usableTypesRejectsAnUnknownOrUnapprovedType() {
		when(this.stakeholderTypeRepository.findByStakeholderTypeSeqInAndStatusOrderByStakeholderTypeSeq(List.of(1, 99),
				APPROVED))
			.thenReturn(List.of(type(1, "CUSTOMER", "Customer")));

		assertThatThrownBy(() -> this.stakeholderTypeManager.usableTypes(List.of("1", "99")))
			.isInstanceOfSatisfying(ApiException.class, (ex) -> {
				assertThat(ex.getErrorCode()).isEqualTo(ErrorCode.VALIDATION_ERROR);
				assertThat(ex.getFieldErrors()).containsKey("stakeholderTypeIds");
			});
	}

	private static StakeholderType type(Integer seq, String code, String name) {
		StakeholderType type = new StakeholderType();
		type.setStakeholderTypeSeq(seq);
		type.setStakeholderTypeCode(code);
		type.setStakeholderTypeName(name);
		type.setStatus(APPROVED);
		return type;
	}

}
