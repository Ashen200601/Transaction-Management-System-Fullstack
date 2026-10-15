package com.finovex.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.finovex.entity.BusinessUser;

public interface BusinessUserRepository extends JpaRepository<BusinessUser, Integer> {

	/** The user's memberships, except those with status {@code statusNot} (usually DELETED). */
	List<BusinessUser> findByUserSeqAndStatusNot(Integer userSeq, Integer statusNot);

}
