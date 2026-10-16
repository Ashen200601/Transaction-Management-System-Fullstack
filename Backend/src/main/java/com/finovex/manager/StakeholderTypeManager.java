package com.finovex.manager;

import java.util.List;

import com.finovex.dto.response.StakeholderTypeResponse;
import com.finovex.entity.StakeholderType;

/**
 * The types a stakeholder can have (customer, vendor, ...). Implemented by {@code StakeholderTypeManagerImpl}.
 * Methods returning entities are for other managers; controllers get DTOs.
 */
public interface StakeholderTypeManager {

	/** The types a stakeholder can be given (approved ones), in their list order. */
	List<StakeholderTypeResponse> findUsable();

	/**
	 * The approved types with these ids, each once, in list order.
	 * @param stakeholderTypeIds the types' ids as the API sends them (stakeholderTypeSeqs as strings)
	 * @throws com.finovex.exception.ApiException VALIDATION_ERROR on {@code stakeholderTypeIds} if any of
	 * them isn't an approved type
	 */
	List<StakeholderType> usableTypes(List<String> stakeholderTypeIds);

}
