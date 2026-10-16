package com.finovex.controller;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.finovex.dto.response.UnitResponse;
import com.finovex.manager.UnitManager;

import io.swagger.v3.oas.annotations.tags.Tag;

/** HTTP only: call the manager, return its DTOs. */
@RestController
@RequestMapping("/units")
@Tag(name = "Units")
public class UnitController {

	private final UnitManager unitManager;

	public UnitController(UnitManager unitManager) {
		this.unitManager = unitManager;
	}

	/** The units an item can be given, for the item form's unit list. */
	@GetMapping
	public List<UnitResponse> findUsable() {
		return this.unitManager.findUsable();
	}

}
