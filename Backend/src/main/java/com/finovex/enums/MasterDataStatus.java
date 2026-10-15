package com.finovex.enums;

/**
 * Values of the {@code status} column on every table that has one. The number is what's stored;
 * {@link #getStatus()} is the label shown as statusDescription.
 * <ul>
 * <li>{@link #APPROVED}: in use. Only approved rows may be used (e.g. only approved users sign in).</li>
 * <li>{@link #OPEN}: inactive. Kept, but not usable (a disabled user, a used refresh token).</li>
 * <li>{@link #DELETED}: deleted. Rows are never removed; queries skip them with {@code ...AndStatusNot}.</li>
 * </ul>
 */
public enum MasterDataStatus {

	DELETED(0, "DELETED"),
	OPEN(1, "OPEN"),
	APPROVED(2, "APPROVED");

	private final Integer statusSeq;

	private final String status;

	MasterDataStatus(Integer statusSeq, String status) {
		this.statusSeq = statusSeq;
		this.status = status;
	}

	public Integer getStatusSeq() {
		return this.statusSeq;
	}

	public String getStatus() {
		return this.status;
	}

	/** @throws IllegalArgumentException for a number that isn't a known status */
	public static MasterDataStatus findOne(Integer statusSeq) {
		for (MasterDataStatus value : values()) {
			if (value.statusSeq.equals(statusSeq)) {
				return value;
			}
		}
		throw new IllegalArgumentException("Unknown master data status: " + statusSeq);
	}

}
