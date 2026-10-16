package com.finovex.repository;

import java.util.List;

import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import com.finovex.entity.Stakeholder;

/** Searches go through {@link JpaSpecificationExecutor}; see {@code StakeholderSpecifications}. */
public interface StakeholderRepository extends JpaRepository<Stakeholder, Integer>, JpaSpecificationExecutor<Stakeholder> {

	/** Whether the business already has a stakeholder with this code, ignoring rows with status {@code statusNot}. */
	boolean existsByBusinessSeqAndStakeholderCodeIgnoreCaseAndStatusNot(Integer businessSeq, String stakeholderCode,
			Integer statusNot);

	/** Loads each stakeholder's types in the same query, since every search result shows them. */
	@Override
	@EntityGraph(attributePaths = "stakeholderStakeholderTypes.stakeholderType")
	List<Stakeholder> findAll(Specification<Stakeholder> spec, Sort sort);

}
