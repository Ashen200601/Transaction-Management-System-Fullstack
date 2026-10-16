package com.finovex.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.finovex.entity.Unit;

public interface UnitRepository extends JpaRepository<Unit, Integer> {

	/** Units with this status, in the order they were added (the seeded list starts with PCS). */
	List<Unit> findByStatusOrderByUnitSeq(Integer status);

	Optional<Unit> findByUnitSeqAndStatus(Integer unitSeq, Integer status);

}
