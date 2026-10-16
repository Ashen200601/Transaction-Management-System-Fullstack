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

import com.finovex.dto.request.CreateItemRequest;
import com.finovex.dto.request.ItemSearchRequest;
import com.finovex.dto.response.ItemResponse;
import com.finovex.dto.response.UnitResponse;
import com.finovex.entity.Business;
import com.finovex.entity.Item;
import com.finovex.entity.Unit;
import com.finovex.enums.MasterDataStatus;
import com.finovex.exception.ApiException;
import com.finovex.exception.ErrorCode;
import com.finovex.manager.BusinessManager;
import com.finovex.manager.UnitManager;
import com.finovex.repository.ItemRepository;

@ExtendWith(MockitoExtension.class)
class ItemManagerImplTest {

	private static final Integer APPROVED = MasterDataStatus.APPROVED.getStatusSeq();

	private static final Integer DELETED = MasterDataStatus.DELETED.getStatusSeq();

	private static final UnitResponse KG = new UnitResponse("2", "KG", "Kilogram");

	@Mock
	private ItemRepository itemRepository;

	@Mock
	private BusinessManager businessManager;

	@Mock
	private UnitManager unitManager;

	private ItemManagerImpl itemManager;

	@BeforeEach
	void setUp() {
		this.itemManager = new ItemManagerImpl(this.itemRepository, this.businessManager, this.unitManager);
	}

	@Test
	void createStoresATidiedApprovedItemInTheUsersBusiness() {
		Business business = business(7);
		Unit kg = kilogram();
		when(this.businessManager.activeBusinessOf(3)).thenReturn(business);
		when(this.unitManager.usableUnit("2")).thenReturn(kg);
		when(this.itemRepository.save(any(Item.class))).thenAnswer((invocation) -> {
			Item item = invocation.getArgument(0);
			item.setItemSeq(41);
			return item;
		});

		ItemResponse response = this.itemManager.create(3,
				new CreateItemRequest("  Espresso Beans 1kg ", " esp-1kg ", "  ", 2500L, "2"));

		ArgumentCaptor<Item> saved = ArgumentCaptor.forClass(Item.class);
		verify(this.itemRepository).save(saved.capture());
		Item item = saved.getValue();
		assertThat(item.getBusiness()).isSameAs(business);
		assertThat(item.getItemCode()).isEqualTo("ESP-1KG");
		assertThat(item.getItemName()).isEqualTo("Espresso Beans 1kg");
		assertThat(item.getDescription()).isNull();
		assertThat(item.getPrice()).isEqualTo(2500L);
		assertThat(item.getUnit()).isSameAs(kg);
		assertThat(item.getStatus()).isEqualTo(APPROVED);
		assertThat(response).isEqualTo(new ItemResponse("41", "ESP-1KG", "Espresso Beans 1kg", null, 2500L, KG));
	}

	@Test
	void createRejectsAnItemCodeTheBusinessAlreadyUses() {
		when(this.businessManager.activeBusinessOf(3)).thenReturn(business(7));
		when(this.itemRepository.existsByBusinessSeqAndItemCodeIgnoreCaseAndStatusNot(7, "ESP-1KG", DELETED))
			.thenReturn(true);

		assertThatThrownBy(() -> this.itemManager.create(3,
				new CreateItemRequest("Espresso", "esp-1kg", null, 2500L, "2")))
			.isInstanceOfSatisfying(ApiException.class, (ex) -> {
				assertThat(ex.getErrorCode()).isEqualTo(ErrorCode.CONFLICT);
				assertThat(ex.getFieldErrors()).containsKey("itemCode");
			});
		verify(this.itemRepository, never()).save(any());
	}

	@Test
	void createRejectsAUnitThatCantBeUsed() {
		when(this.businessManager.activeBusinessOf(3)).thenReturn(business(7));
		when(this.unitManager.usableUnit("99")).thenThrow(new ApiException(ErrorCode.VALIDATION_ERROR,
				"Some fields need attention.", Map.of("unitId", List.of("Choose a unit"))));

		assertThatThrownBy(() -> this.itemManager.create(3,
				new CreateItemRequest("Espresso", "ESP", null, 2500L, "99")))
			.isInstanceOfSatisfying(ApiException.class, (ex) -> {
				assertThat(ex.getErrorCode()).isEqualTo(ErrorCode.VALIDATION_ERROR);
				assertThat(ex.getFieldErrors()).containsKey("unitId");
			});
		verify(this.itemRepository, never()).save(any());
	}

	@Test
	void createStopsWhenTheUserHasNoActiveBusiness() {
		when(this.businessManager.activeBusinessOf(3))
			.thenThrow(new ApiException(ErrorCode.FORBIDDEN, "Your account isn't part of an active business."));

		assertThatThrownBy(() -> this.itemManager.create(3,
				new CreateItemRequest("Espresso", "ESP", null, 2500L, "2")))
			.isInstanceOfSatisfying(ApiException.class,
					(ex) -> assertThat(ex.getErrorCode()).isEqualTo(ErrorCode.FORBIDDEN));
		verify(this.itemRepository, never()).save(any());
	}

	@Test
	void searchReturnsTheMatchingItemsOfTheUsersBusinessByCode() {
		when(this.businessManager.activeBusinessOf(3)).thenReturn(business(7));
		Item beans = new Item();
		beans.setItemSeq(41);
		beans.setItemCode("ESP-1KG");
		beans.setItemName("Espresso Beans 1kg");
		beans.setPrice(2550L);
		beans.setUnit(kilogram());
		when(this.itemRepository.findAll(ArgumentMatchers.<Specification<Item>>any(), eq(Sort.by("itemCode"))))
			.thenReturn(List.of(beans));

		assertThat(this.itemManager.search(3, new ItemSearchRequest("esp", null, "2", 1000L, 3000L)))
			.containsExactly(new ItemResponse("41", "ESP-1KG", "Espresso Beans 1kg", null, 2550L, KG));
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

	private static Unit kilogram() {
		Unit unit = new Unit();
		unit.setUnitSeq(2);
		unit.setUnitCode("KG");
		unit.setUnitName("Kilogram");
		unit.setStatus(APPROVED);
		return unit;
	}

	private static Business business(Integer businessSeq) {
		Business business = new Business();
		business.setBusinessSeq(businessSeq);
		business.setStatus(APPROVED);
		return business;
	}

}
