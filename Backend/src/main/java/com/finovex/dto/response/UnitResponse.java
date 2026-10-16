package com.finovex.dto.response;

/**
 * A unit, as the frontend's {@code Unit}.
 *
 * @param id the unitSeq as a string; the frontend treats every id as a string
 * @param unitCode short code, e.g. KG
 * @param unitName e.g. Kilogram
 */
public record UnitResponse(String id, String unitCode, String unitName) {
}
