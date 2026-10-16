package com.finovex.controller;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.finovex.dto.response.BusinessResponse;
import com.finovex.manager.BusinessManager;

import io.swagger.v3.oas.annotations.tags.Tag;

/** HTTP only: call the manager, return its DTO. */
@RestController
@RequestMapping("/businesses")
@Tag(name = "Businesses")
public class BusinessController {

	private final BusinessManager businessManager;

	public BusinessController(BusinessManager businessManager) {
		this.businessManager = businessManager;
	}

	/** The business the signed-in user works in. */
	@GetMapping("/current")
	public BusinessResponse current(@AuthenticationPrincipal Jwt jwt) {
		return this.businessManager.current(Integer.valueOf(jwt.getSubject()));
	}

}
