package com.finovex.repository;

import java.util.List;

import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import com.finovex.entity.Item;

/** Searches go through {@link JpaSpecificationExecutor}; see {@code ItemSpecifications}. */
public interface ItemRepository extends JpaRepository<Item, Integer>, JpaSpecificationExecutor<Item> {

	/** Whether the business already has an item with this code, ignoring rows with status {@code statusNot}. */
	boolean existsByBusinessSeqAndItemCodeIgnoreCaseAndStatusNot(Integer businessSeq, String itemCode,
			Integer statusNot);

	/** Loads each item's unit in the same query, since every search result shows it. */
	@Override
	@EntityGraph(attributePaths = "unit")
	List<Item> findAll(Specification<Item> spec, Sort sort);

}
