export interface StakeholderType {
  id: string;
  /** Short code, e.g. VENDOR. */
  stakeholderTypeCode: string;
  /** e.g. Vendor. */
  stakeholderTypeName: string;
}

export interface Stakeholder {
  id: string;
  stakeholderCode: string;
  stakeholderName: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  /** VAT or business registration number. */
  taxNo: string | null;
  /** In type order. */
  stakeholderTypes: StakeholderType[];
}
