package com.finovex.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.finovex.entity.BusinessUser;

public interface BusinessUserRepository extends JpaRepository<BusinessUser, Integer> {

	/** Every business the user belongs to. */
	List<BusinessUser> findByUserSeq(Integer userSeq);

}
