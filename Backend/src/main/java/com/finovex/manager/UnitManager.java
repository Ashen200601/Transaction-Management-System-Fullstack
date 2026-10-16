package com.finovex.manager;

import java.util.List;

import com.finovex.dto.response.UnitResponse;
import com.finovex.entity.Unit;

/**
 * Units items are sold in. Implemented by {@code UnitManagerImpl}.
 * Methods returning entities are for other managers; controllers get DTOs.
 */
public interface UnitManager {

	/** The units an item can be given (approved ones), in their list order. */
	List<UnitResponse> findUsable();

	/**
	 * The approved unit with this id, for an item to use.
	 * @param unitId the unit's id as the API sends it (a unitSeq as a string)
	 * @throws com.finovex.exception.ApiException VALIDATION_ERROR on {@code unitId} if there is no such
	 * approved unit
	 */
	Unit usableUnit(String unitId);

}
