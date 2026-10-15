package com.finovex.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.finovex.entity.User;

/** Spring Data writes the queries from the method names. Callers pass lowercase values. */
public interface UserRepository extends JpaRepository<User, Integer> {

	/** The account with this username, whatever its status. */
	Optional<User> findByUsername(String username);

	/** The account with this username, unless its status is {@code statusNot} (usually DELETED). */
	Optional<User> findByUsernameAndStatusNot(String username, Integer statusNot);

	/** Counts deleted accounts too: their username stays taken. */
	boolean existsByUsername(String username);

	/** Counts deleted accounts too: their email stays taken. */
	boolean existsByEmail(String email);

}
