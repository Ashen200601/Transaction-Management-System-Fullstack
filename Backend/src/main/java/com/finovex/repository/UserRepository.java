package com.finovex.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.finovex.entity.User;

/** Spring Data writes the queries from the method names. Callers pass lowercase values. */
public interface UserRepository extends JpaRepository<User, Integer> {

	Optional<User> findByUsername(String username);

	boolean existsByUsername(String username);

	boolean existsByEmail(String email);

}
