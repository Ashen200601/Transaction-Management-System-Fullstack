package com.finovex.dto.request;

import java.util.List;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * Body of POST /stakeholders. The rules and messages mirror the stakeholder form
 * ({@code Frontend/src/features/stakeholders/schemas.ts}); keep the two in step.
 *
 * @param stakeholderTypeIds ids of approved stakeholder types (GET /stakeholder-types); at least one
 * @param taxNo VAT or business registration number
 */
public record CreateStakeholderRequest(
		@NotEmpty(message = "Choose at least one stakeholder type")
		List<@NotBlank(message = "Choose a stakeholder type")
		@Pattern(regexp = "^\\s*\\d{1,9}\\s*$", message = "Choose a stakeholder type") String> stakeholderTypeIds,

		@NotBlank(message = "Use 1–30 letters, numbers, dots, dashes or underscores")
		@Pattern(regexp = "^\\s*[A-Za-z0-9._-]{1,30}\\s*$",
				message = "Use 1–30 letters, numbers, dots, dashes or underscores")
		String stakeholderCode,

		@NotBlank(message = "Enter the stakeholder name")
		@Size(max = 120, message = "Keep the name under 120 characters")
		String stakeholderName,

		@Size(max = 30, message = "Keep the phone number under 30 characters")
		@Pattern(regexp = "^[0-9+()\\s-]*$", message = "Use digits, spaces, +, - and brackets")
		String phone,

		@Size(max = 120, message = "Keep the email under 120 characters")
		@Email(message = "Enter an email like name@example.com")
		String email,

		@Size(max = 500, message = "Keep the address under 500 characters")
		String address,

		@Size(max = 50, message = "Keep the tax number under 50 characters")
		String taxNo) {
}
