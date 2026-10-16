package com.finovex.dto.request;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * Query parameters of GET /stakeholders. Every filter is optional; leave them all out to list every
 * stakeholder. The form is {@code Frontend/src/features/stakeholders/schemas.ts} (stakeholderSearchSchema).
 *
 * @param stakeholderCode part of the stakeholder code, any case
 * @param stakeholderName part of the name, any case
 * @param stakeholderTypeId the id of a stakeholder type; blank means any type
 */
public record StakeholderSearchRequest(
		@Size(max = 30, message = "Keep the code under 30 characters")
		String stakeholderCode,

		@Size(max = 120, message = "Keep the name under 120 characters")
		String stakeholderName,

		@Pattern(regexp = "^\\s*\\d{0,9}\\s*$", message = "Choose a stakeholder type")
		String stakeholderTypeId) {
}
