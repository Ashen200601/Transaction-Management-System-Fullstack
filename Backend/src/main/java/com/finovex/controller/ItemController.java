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

import com.finovex.dto.request.CreateItemRequest;
import com.finovex.dto.request.ItemSearchRequest;
import com.finovex.dto.response.ItemResponse;
import com.finovex.manager.ItemManager;

import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

/** HTTP only: validate the body, call the manager, return its DTO. */
@RestController
@RequestMapping("/items")
@Tag(name = "Items")
public class ItemController {

	private final ItemManager itemManager;

	public ItemController(ItemManager itemManager) {
		this.itemManager = itemManager;
	}

	/** Every filter is an optional query parameter, e.g. {@code /items?itemName=bean&unit=KG}. */
	@GetMapping
	public List<ItemResponse> search(@AuthenticationPrincipal Jwt jwt,
			@Valid @ParameterObject @ModelAttribute ItemSearchRequest search) {
		return this.itemManager.search(Integer.valueOf(jwt.getSubject()), search);
	}

	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	public ItemResponse create(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody CreateItemRequest request) {
		return this.itemManager.create(Integer.valueOf(jwt.getSubject()), request);
	}

}
