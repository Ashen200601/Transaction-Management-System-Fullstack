package com.finovex.controller;

import java.util.List;

import org.springdoc.core.annotations.ParameterObject;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.finovex.dto.request.CreateStakeholderRequest;
import com.finovex.dto.request.StakeholderSearchRequest;
import com.finovex.dto.response.StakeholderResponse;
import com.finovex.manager.StakeholderManager;

import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

/** HTTP only: validate the body, call the manager, return its DTO. */
@RestController
@RequestMapping("/stakeholders")
@Tag(name = "Stakeholders")
public class StakeholderController {

	private final StakeholderManager stakeholderManager;

	public StakeholderController(StakeholderManager stakeholderManager) {
		this.stakeholderManager = stakeholderManager;
	}

	/** Every filter is an optional query parameter, e.g. {@code /stakeholders?stakeholderTypeId=2}. */
	@GetMapping
	public List<StakeholderResponse> search(@AuthenticationPrincipal Jwt jwt,
			@Valid @ParameterObject @ModelAttribute StakeholderSearchRequest search) {
		return this.stakeholderManager.search(Integer.valueOf(jwt.getSubject()), search);
	}

	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	public StakeholderResponse create(@AuthenticationPrincipal Jwt jwt,
			@Valid @RequestBody CreateStakeholderRequest request) {
		return this.stakeholderManager.create(Integer.valueOf(jwt.getSubject()), request);
	}

}
