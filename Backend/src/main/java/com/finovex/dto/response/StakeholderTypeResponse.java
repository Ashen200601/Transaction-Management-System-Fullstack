package com.finovex.dto.response;

/**
 * A stakeholder type, as the frontend's {@code StakeholderType}.
 *
 * @param id the stakeholderTypeSeq as a string; the frontend treats every id as a string
 * @param stakeholderTypeCode short code, e.g. VENDOR
 * @param stakeholderTypeName e.g. Vendor
 */
public record StakeholderTypeResponse(String id, String stakeholderTypeCode, String stakeholderTypeName) {
}
