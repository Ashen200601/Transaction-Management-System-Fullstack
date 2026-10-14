package com.finovex.enums;

/**
 * Values of the {@code status} column on master data (users, products, customers, ...).
 * The number is what's stored; {@link #getStatus()} is the label shown as statusDescription.
 */
public enum MasterDataStatus {

	ACTIVE(1, "Active"),
	INACTIVE(2, "Inactive");

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
