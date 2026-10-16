package com.finovex.manager.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.ArgumentMatchers;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;

import com.finovex.dto.request.CreateStakeholderRequest;
import com.finovex.dto.request.StakeholderSearchRequest;
import com.finovex.dto.response.StakeholderResponse;
import com.finovex.dto.response.StakeholderTypeResponse;
import com.finovex.entity.Business;
import com.finovex.entity.Stakeholder;
import com.finovex.entity.StakeholderStakeholderType;
import com.finovex.entity.StakeholderType;
import com.finovex.enums.MasterDataStatus;
import com.finovex.exception.ApiException;
import com.finovex.exception.ErrorCode;
import com.finovex.manager.BusinessManager;
import com.finovex.manager.StakeholderTypeManager;
import com.finovex.repository.StakeholderRepository;

@ExtendWith(MockitoExtension.class)
class StakeholderManagerImplTest {

	private static final Integer APPROVED = MasterDataStatus.APPROVED.getStatusSeq();

	private static final Integer DELETED = MasterDataStatus.DELETED.getStatusSeq();

	private static final StakeholderTypeResponse CUSTOMER = new StakeholderTypeResponse("1", "CUSTOMER", "Customer");

	private static final StakeholderTypeResponse VENDOR = new StakeholderTypeResponse("2", "VENDOR", "Vendor");

	@Mock
	private StakeholderRepository stakeholderRepository;

	@Mock
	private BusinessManager businessManager;

	@Mock
	private StakeholderTypeManager stakeholderTypeManager;

	private StakeholderManagerImpl stakeholderManager;

	@BeforeEach
	void setUp() {
		this.stakeholderManager = new StakeholderManagerImpl(this.stakeholderRepository, this.businessManager,
				this.stakeholderTypeManager);
	}

	@Test
	void createStoresATidiedApprovedStakeholderWithItsTypes() {
		Business business = business(7);
		StakeholderType customer = type(1, "CUSTOMER", "Customer");
		StakeholderType vendor = type(2, "VENDOR", "Vendor");
		when(this.businessManager.activeBusinessOf(3)).thenReturn(business);
		when(this.stakeholderTypeManager.usableTypes(List.of("2", "1"))).thenReturn(List.of(customer, vendor));
		when(this.stakeholderRepository.save(any(Stakeholder.class))).thenAnswer((invocation) -> {
			Stakeholder stakeholder = invocation.getArgument(0);
			stakeholder.setStakeholderSeq(51);
			return stakeholder;
		});

		StakeholderResponse response = this.stakeholderManager.create(3, new CreateStakeholderRequest(
				List.of("2", "1"), " abc-traders ", "  ABC Traders ", " +94 77 123 4567 ", "  ", null, " VAT-1 "));

		ArgumentCaptor<Stakeholder> saved = ArgumentCaptor.forClass(Stakeholder.class);
		verify(this.stakeholderRepository).save(saved.capture());
		Stakeholder stakeholder = saved.getValue();
		assertThat(stakeholder.getBusiness()).isSameAs(business);
		assertThat(stakeholder.getStakeholderCode()).isEqualTo("ABC-TRADERS");
		assertThat(stakeholder.getStakeholderName()).isEqualTo("ABC Traders");
		assertThat(stakeholder.getPhone()).isEqualTo("+94 77 123 4567");
		assertThat(stakeholder.getEmail()).isNull();
		assertThat(stakeholder.getAddress()).isNull();
		assertThat(stakeholder.getTaxNo()).isEqualTo("VAT-1");
		assertThat(stakeholder.getStatus()).isEqualTo(APPROVED);
		assertThat(stakeholder.getStakeholderStakeholderTypes()).allSatisfy((link) -> {
			assertThat(link.getStakeholder()).isSameAs(stakeholder);
			assertThat(link.getStatus()).isEqualTo(APPROVED);
		});
		assertThat(stakeholder.getStakeholderStakeholderTypes())
			.extracting(StakeholderStakeholderType::getStakeholderType)
			.containsExactly(customer, vendor);
		assertThat(response).isEqualTo(new StakeholderResponse("51", "ABC-TRADERS", "ABC Traders", "+94 77 123 4567",
				null, null, "VAT-1", List.of(CUSTOMER, VENDOR)));
	}

	@Test
	void createRejectsACodeTheBusinessAlreadyUses() {
		when(this.businessManager.activeBusinessOf(3)).thenReturn(business(7));
		when(this.stakeholderRepository.existsByBusinessSeqAndStakeholderCodeIgnoreCaseAndStatusNot(7, "ABC", DELETED))
			.thenReturn(true);

		assertThatThrownBy(() -> this.stakeholderManager.create(3, request("abc", List.of("1"))))
			.isInstanceOfSatisfying(ApiException.class, (ex) -> {
				assertThat(ex.getErrorCode()).isEqualTo(ErrorCode.CONFLICT);
				assertThat(ex.getFieldErrors()).containsKey("stakeholderCode");
			});
		verify(this.stakeholderRepository, never()).save(any());
	}

	@Test
	void createRejectsTypesThatCantBeUsed() {
		when(this.businessManager.activeBusinessOf(3)).thenReturn(business(7));
		when(this.stakeholderTypeManager.usableTypes(List.of("99"))).thenThrow(new ApiException(
				ErrorCode.VALIDATION_ERROR, "Some fields need attention.",
				Map.of("stakeholderTypeIds", List.of("Choose at least one stakeholder type from the list"))));

		assertThatThrownBy(() -> this.stakeholderManager.create(3, request("ABC", List.of("99"))))
			.isInstanceOfSatisfying(ApiException.class,
					(ex) -> assertThat(ex.getFieldErrors()).containsKey("stakeholderTypeIds"));
		verify(this.stakeholderRepository, never()).save(any());
	}

	@Test
	void searchReturnsTheMatchingStakeholdersByCodeWithoutDeletedTypes() {
		when(this.businessManager.activeBusinessOf(3)).thenReturn(business(7));
		Stakeholder abc = new Stakeholder();
		abc.setStakeholderSeq(51);
		abc.setStakeholderCode("ABC");
		abc.setStakeholderName("ABC Traders");
		abc.addStakeholderType(type(2, "VENDOR", "Vendor"));
		abc.addStakeholderType(type(1, "CUSTOMER", "Customer"));
		abc.getStakeholderStakeholderTypes().get(1).setStatus(DELETED);
		when(this.stakeholderRepository.findAll(ArgumentMatchers.<Specification<Stakeholder>>any(),
				eq(Sort.by("stakeholderCode"))))
			.thenReturn(List.of(abc));

		assertThat(this.stakeholderManager.search(3, new StakeholderSearchRequest("ab", null, "2")))
			.containsExactly(new StakeholderResponse("51", "ABC", "ABC Traders", null, null, null, null, List.of(VENDOR)));
	}

	private static CreateStakeholderRequest request(String code, List<String> typeIds) {
		return new CreateStakeholderRequest(typeIds, code, "ABC Traders", null, null, null, null);
	}

	private static StakeholderType type(Integer seq, String code, String name) {
		StakeholderType type = new StakeholderType();
		type.setStakeholderTypeSeq(seq);
		type.setStakeholderTypeCode(code);
		type.setStakeholderTypeName(name);
		type.setStatus(APPROVED);
		return type;
	}

	private static Business business(Integer businessSeq) {
		Business business = new Business();
		business.setBusinessSeq(businessSeq);
		business.setStatus(APPROVED);
		return business;
	}

}
