package com.finovex.manager.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.ArgumentMatchers;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;

import com.finovex.dto.request.CreateItemRequest;
import com.finovex.dto.request.ItemSearchRequest;
import com.finovex.dto.response.ItemResponse;
import com.finovex.entity.Business;
import com.finovex.entity.BusinessUser;
import com.finovex.entity.Item;
import com.finovex.enums.MasterDataStatus;
import com.finovex.exception.ApiException;
import com.finovex.exception.ErrorCode;
import com.finovex.repository.BusinessUserRepository;
import com.finovex.repository.ItemRepository;

@ExtendWith(MockitoExtension.class)
class ItemManagerImplTest {

	private static final Integer APPROVED = MasterDataStatus.APPROVED.getStatusSeq();

	private static final Integer OPEN = MasterDataStatus.OPEN.getStatusSeq();

	private static final Integer DELETED = MasterDataStatus.DELETED.getStatusSeq();

	@Mock
	private ItemRepository itemRepository;

	@Mock
	private BusinessUserRepository businessUserRepository;

	private ItemManagerImpl itemManager;

	@BeforeEach
	void setUp() {
		this.itemManager = new ItemManagerImpl(this.itemRepository, this.businessUserRepository);
	}

	@Test
	void createStoresATidiedApprovedItemInTheUsersBusiness() {
		Business business = business(7, APPROVED);
		when(this.businessUserRepository.findByUserSeqAndStatusNot(3, DELETED))
			.thenReturn(List.of(membership(business, APPROVED)));
		when(this.itemRepository.save(any(Item.class))).thenAnswer((invocation) -> {
			Item item = invocation.getArgument(0);
			item.setItemSeq(41);
			return item;
		});

		ItemResponse response = this.itemManager.create(3,
				new CreateItemRequest("  Espresso Beans 1kg ", " esp-1kg ", "  ", 2500L, "KG"));

		ArgumentCaptor<Item> saved = ArgumentCaptor.forClass(Item.class);
		verify(this.itemRepository).save(saved.capture());
		Item item = saved.getValue();
		assertThat(item.getBusiness()).isSameAs(business);
		assertThat(item.getItemCode()).isEqualTo("ESP-1KG");
		assertThat(item.getItemName()).isEqualTo("Espresso Beans 1kg");
		assertThat(item.getDescription()).isNull();
		assertThat(item.getPrice()).isEqualTo(2500L);
		assertThat(item.getUnit()).isEqualTo("KG");
		assertThat(item.getStatus()).isEqualTo(APPROVED);
		assertThat(response).isEqualTo(new ItemResponse("41", "ESP-1KG", "Espresso Beans 1kg", null, 2500L, "KG"));
	}

	@Test
	void createRejectsAnItemCodeTheBusinessAlreadyUses() {
		when(this.businessUserRepository.findByUserSeqAndStatusNot(3, DELETED))
			.thenReturn(List.of(membership(business(7, APPROVED), APPROVED)));
		when(this.itemRepository.existsByBusinessSeqAndItemCodeIgnoreCaseAndStatusNot(7, "ESP-1KG", DELETED))
			.thenReturn(true);

		assertThatThrownBy(() -> this.itemManager.create(3,
				new CreateItemRequest("Espresso", "esp-1kg", null, 2500L, "KG")))
			.isInstanceOfSatisfying(ApiException.class, (ex) -> {
				assertThat(ex.getErrorCode()).isEqualTo(ErrorCode.CONFLICT);
				assertThat(ex.getFieldErrors()).containsKey("itemCode");
			});
		verify(this.itemRepository, never()).save(any());
	}

	@Test
	void createNeedsAnActiveMembershipOfAnActiveBusiness() {
		when(this.businessUserRepository.findByUserSeqAndStatusNot(3, DELETED)).thenReturn(List.of(
				membership(business(7, APPROVED), OPEN), membership(business(8, OPEN), APPROVED)));

		assertThatThrownBy(() -> this.itemManager.create(3,
				new CreateItemRequest("Espresso", "ESP", null, 2500L, "KG")))
			.isInstanceOfSatisfying(ApiException.class,
					(ex) -> assertThat(ex.getErrorCode()).isEqualTo(ErrorCode.FORBIDDEN));
		verify(this.itemRepository, never()).existsByBusinessSeqAndItemCodeIgnoreCaseAndStatusNot(anyInt(),
				anyString(), anyInt());
	}

	@Test
	void searchReturnsTheMatchingItemsOfTheUsersBusinessByCode() {
		when(this.businessUserRepository.findByUserSeqAndStatusNot(3, DELETED))
			.thenReturn(List.of(membership(business(7, APPROVED), APPROVED)));
		Item beans = new Item();
		beans.setItemSeq(41);
		beans.setItemCode("ESP-1KG");
		beans.setItemName("Espresso Beans 1kg");
		beans.setPrice(2550L);
		beans.setUnit("KG");
		when(this.itemRepository.findAll(ArgumentMatchers.<Specification<Item>>any(), eq(Sort.by("itemCode"))))
			.thenReturn(List.of(beans));

		assertThat(this.itemManager.search(3, new ItemSearchRequest("esp", null, "KG", 1000L, 3000L)))
			.containsExactly(new ItemResponse("41", "ESP-1KG", "Espresso Beans 1kg", null, 2550L, "KG"));
	}

	@Test
	void searchRejectsAPriceRangeThatRunsBackwards() {
		assertThatThrownBy(() -> this.itemManager.search(3, new ItemSearchRequest(null, null, null, 3000L, 1000L)))
			.isInstanceOfSatisfying(ApiException.class, (ex) -> {
				assertThat(ex.getErrorCode()).isEqualTo(ErrorCode.VALIDATION_ERROR);
				assertThat(ex.getFieldErrors()).containsKey("maxPrice");
			});
		verify(this.itemRepository, never()).findAll(ArgumentMatchers.<Specification<Item>>any(), any(Sort.class));
	}

	private static Business business(Integer businessSeq, Integer status) {
		Business business = new Business();
		business.setBusinessSeq(businessSeq);
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
