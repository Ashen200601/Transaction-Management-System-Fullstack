package com.finovex.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.finovex.entity.UserLoginAudit;

public interface UserLoginAuditRepository extends JpaRepository<UserLoginAudit, Integer> {

}
