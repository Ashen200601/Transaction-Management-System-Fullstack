package com.finovex.manager.impl;

import java.util.List;
import java.util.Locale;
import java.util.Map;

import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.finovex.dto.request.CreateItemRequest;
import com.finovex.dto.request.ItemSearchRequest;
import com.finovex.dto.response.ItemResponse;
import com.finovex.entity.Business;
import com.finovex.entity.Item;
import com.finovex.entity.Unit;
import com.finovex.enums.MasterDataStatus;
import com.finovex.exception.ApiException;
import com.finovex.exception.ErrorCode;
import com.finovex.manager.BusinessManager;
import com.finovex.manager.ItemManager;
import com.finovex.manager.UnitManager;
import com.finovex.mapper.ItemMapper;
import com.finovex.repository.ItemRepository;
import com.finovex.repository.ItemSpecifications;

@Service
public class ItemManagerImpl implements ItemManager {

	private static final Integer APPROVED = MasterDataStatus.APPROVED.getStatusSeq();

	private static final Integer DELETED = MasterDataStatus.DELETED.getStatusSeq();

	private final ItemRepository itemRepository;

	private final BusinessManager businessManager;

	private final UnitManager unitManager;

	public ItemManagerImpl(ItemRepository itemRepository, BusinessManager businessManager,
			UnitManager unitManager) {
		this.itemRepository = itemRepository;
		this.businessManager = businessManager;
		this.unitManager = unitManager;
	}

	@Override
	@Transactional
	public ItemResponse create(Integer userSeq, CreateItemRequest request) {
		Business business = this.businessManager.activeBusinessOf(userSeq);
		String itemCode = request.itemCode().trim().toUpperCase(Locale.ROOT);

		if (this.itemRepository.existsByBusinessSeqAndItemCodeIgnoreCaseAndStatusNot(business.getBusinessSeq(),
				itemCode, DELETED)) {
			throw new ApiException(ErrorCode.CONFLICT, "Another item already uses this code.",
					Map.of("itemCode", List.of("Another item already uses this code. Try another.")));
		}
		Unit unit = this.unitManager.usableUnit(request.unitId());

		Item item = new Item();
		item.setBusiness(business);
		item.setItemCode(itemCode);
		item.setItemName(request.itemName().trim());
		item.setDescription(blankToNull(request.description()));
		item.setPrice(request.price());
		item.setUnit(unit);
		item.setStatus(APPROVED);
		return ItemMapper.toResponse(this.itemRepository.save(item));
	}

	@Override
	@Transactional(readOnly = true)
	public List<ItemResponse> search(Integer userSeq, ItemSearchRequest search) {
		if (search.minPrice() != null && search.maxPrice() != null && search.minPrice() > search.maxPrice()) {
			throw new ApiException(ErrorCode.VALIDATION_ERROR, "Some fields need attention.",
					Map.of("maxPrice", List.of("Make this at least the lowest price")));
		}
		Business business = this.businessManager.activeBusinessOf(userSeq);
		return this.itemRepository
			.findAll(ItemSpecifications.search(business.getBusinessSeq(), search), Sort.by("itemCode"))
			.stream()
			.map(ItemMapper::toResponse)
			.toList();
	}


	private static String blankToNull(String value) {
		return (value == null || value.isBlank()) ? null : value.trim();
	}

}
