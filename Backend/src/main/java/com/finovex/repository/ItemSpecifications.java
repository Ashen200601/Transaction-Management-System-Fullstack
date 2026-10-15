package com.finovex.repository;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

import org.springframework.data.jpa.domain.Specification;

import com.finovex.dto.request.ItemSearchRequest;
import com.finovex.entity.Item;
import com.finovex.enums.MasterDataStatus;

import jakarta.persistence.criteria.Predicate;

/** Query conditions for item searches. */
public final class ItemSpecifications {

	private static final char ESCAPE = '\\';

	private ItemSpecifications() {
	}

	/**
	 * The business's items that aren't deleted and match every filter given in {@code search}.
	 * Blank filters are ignored. Code and name match any part, in any case.
	 */
	public static Specification<Item> search(Integer businessSeq, ItemSearchRequest search) {
		return (root, query, cb) -> {
			List<Predicate> where = new ArrayList<>();
			where.add(cb.equal(root.get("businessSeq"), businessSeq));
			where.add(cb.notEqual(root.get("status"), MasterDataStatus.DELETED.getStatusSeq()));
			if (hasText(search.itemCode())) {
				where.add(cb.like(cb.upper(root.get("itemCode")), contains(search.itemCode()), ESCAPE));
			}
			if (hasText(search.itemName())) {
				where.add(cb.like(cb.upper(root.get("itemName")), contains(search.itemName()), ESCAPE));
			}
			if (hasText(search.unit())) {
				where.add(cb.equal(root.get("unit"), search.unit().trim().toUpperCase(Locale.ROOT)));
			}
			if (search.minPrice() != null) {
				where.add(cb.greaterThanOrEqualTo(root.get("price"), search.minPrice()));
			}
			if (search.maxPrice() != null) {
				where.add(cb.lessThanOrEqualTo(root.get("price"), search.maxPrice()));
			}
			return cb.and(where.toArray(Predicate[]::new));
		};
	}

	private static boolean hasText(String value) {
		return value != null && !value.isBlank();
	}

	/** "%VALUE%" with LIKE's own wildcards escaped, so "50%" matches a literal percent sign. */
	private static String contains(String value) {
		String escaped = value.trim().toUpperCase(Locale.ROOT).replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_");
		return "%" + escaped + "%";
	}

}
