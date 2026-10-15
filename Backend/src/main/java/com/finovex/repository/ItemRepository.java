package com.finovex.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import com.finovex.entity.Item;

/** Searches go through {@link JpaSpecificationExecutor}; see {@code ItemSpecifications}. */
public interface ItemRepository extends JpaRepository<Item, Integer>, JpaSpecificationExecutor<Item> {

	/** Whether the business already has an item with this code, ignoring rows with status {@code statusNot}. */
	boolean existsByBusinessSeqAndItemCodeIgnoreCaseAndStatusNot(Integer businessSeq, String itemCode,
			Integer statusNot);

}
