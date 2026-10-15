package com.finovex.repository;

import java.util.Date;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.finovex.entity.RefreshToken;

import jakarta.persistence.LockModeType;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Integer> {

	/** Locks the row until the transaction ends, so two refreshes with one token run one after the other. */
	@Lock(LockModeType.PESSIMISTIC_WRITE)
	Optional<RefreshToken> findByTokenHash(String tokenHash);

	/** The session's tokens that haven't been revoked yet. */
	List<RefreshToken> findBySessionIdAndRevokedDateIsNull(String sessionId);

	@Modifying
	@Query("delete from RefreshToken t where t.expiresDate < :cutoff")
	int deleteExpiredBefore(@Param("cutoff") Date cutoff);

}
