package com.finovex.repository;

import java.util.Collection;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.finovex.entity.StakeholderType;

public interface StakeholderTypeRepository extends JpaRepository<StakeholderType, Integer> {

	/** Types with this status, in the order they were added (the seeded list starts with CUSTOMER). */
	List<StakeholderType> findByStatusOrderByStakeholderTypeSeq(Integer status);

	List<StakeholderType> findByStakeholderTypeSeqInAndStatusOrderByStakeholderTypeSeq(
			Collection<Integer> stakeholderTypeSeqs, Integer status);

}
