package com.finovex.dto.response;

/**
 * A business, as the frontend's {@code Business}.
 *
 * @param id the businessSeq as a string; the frontend treats every id as a string
 * @param currency ISO 4217 code, e.g. USD; prices are in its minor units
 */
public record BusinessResponse(String id, String name, String currency) {
}
