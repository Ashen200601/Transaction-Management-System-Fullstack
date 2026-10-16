package com.finovex.repository;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

import org.springframework.data.jpa.domain.Specification;

import com.finovex.dto.request.StakeholderSearchRequest;
import com.finovex.entity.Stakeholder;
import com.finovex.entity.StakeholderStakeholderType;
import com.finovex.enums.MasterDataStatus;

import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.criteria.Subquery;

/** Query conditions for stakeholder searches. */
public final class StakeholderSpecifications {

	private static final char ESCAPE = '\\';

	private static final Integer DELETED = MasterDataStatus.DELETED.getStatusSeq();

	private StakeholderSpecifications() {
	}

	/**
	 * The business's stakeholders that aren't deleted and match every filter given in {@code search}.
	 * Blank filters are ignored. Code and name match any part, in any case; a type matches
	 * stakeholders that have it.
	 */
	public static Specification<Stakeholder> search(Integer businessSeq, StakeholderSearchRequest search) {
		return (root, query, cb) -> {
			List<Predicate> where = new ArrayList<>();
			where.add(cb.equal(root.get("businessSeq"), businessSeq));
			where.add(cb.notEqual(root.get("status"), DELETED));
			if (hasText(search.stakeholderCode())) {
				where.add(cb.like(cb.upper(root.get("stakeholderCode")), contains(search.stakeholderCode()), ESCAPE));
			}
			if (hasText(search.stakeholderName())) {
				where.add(cb.like(cb.upper(root.get("stakeholderName")), contains(search.stakeholderName()), ESCAPE));
			}
			if (hasText(search.stakeholderTypeId())) {
				// A subquery rather than a join, so a stakeholder isn't listed once per matching link.
				Subquery<Integer> withType = query.subquery(Integer.class);
				Root<StakeholderStakeholderType> link = withType.from(StakeholderStakeholderType.class);
				withType.select(link.get("stakeholderSeq"))
					.where(cb.equal(link.get("stakeholderTypeSeq"), Integer.valueOf(search.stakeholderTypeId().trim())),
							cb.notEqual(link.get("status"), DELETED));
				where.add(root.get("stakeholderSeq").in(withType));
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
