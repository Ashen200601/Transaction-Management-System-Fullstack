package com.finovex.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.finovex.entity.Business;

public interface BusinessRepository extends JpaRepository<Business, Integer> {

}
