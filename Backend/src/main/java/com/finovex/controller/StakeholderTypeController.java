package com.finovex.controller;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.finovex.dto.response.StakeholderTypeResponse;
import com.finovex.manager.StakeholderTypeManager;

import io.swagger.v3.oas.annotations.tags.Tag;

/** HTTP only: call the manager, return its DTOs. */
@RestController
@RequestMapping("/stakeholder-types")
@Tag(name = "Stakeholder types")
public class StakeholderTypeController {

	private final StakeholderTypeManager stakeholderTypeManager;

	public StakeholderTypeController(StakeholderTypeManager stakeholderTypeManager) {
		this.stakeholderTypeManager = stakeholderTypeManager;
	}

	/** The types a stakeholder can be given, for the stakeholder form's type checkboxes. */
	@GetMapping
	public List<StakeholderTypeResponse> findUsable() {
		return this.stakeholderTypeManager.findUsable();
	}

}
