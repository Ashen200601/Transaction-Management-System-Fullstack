package com.finovex.dto.response;

import java.util.List;

/**
 * A stakeholder, as the frontend's {@code Stakeholder}.
 *
 * @param id the stakeholderSeq as a string; the frontend treats every id as a string
 * @param stakeholderTypes its types, in type order
 * @param taxNo VAT or business registration number
 */
public record StakeholderResponse(String id, String stakeholderCode, String stakeholderName, String phone,
		String email, String address, String taxNo, List<StakeholderTypeResponse> stakeholderTypes) {
}
