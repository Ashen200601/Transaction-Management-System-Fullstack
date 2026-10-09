import type { ReviewedDocument } from './schemas';

export type DocumentStatus = 'processing' | 'needs_review' | 'confirmed' | 'failed';

/** A value read by OCR, with how sure the engine is (0–1, null if unknown). */
export interface ExtractedField<T> {
  value: T | null;
  confidence: number | null;
}

export interface ExtractedLine {
  description: ExtractedField<string>;
  quantity: ExtractedField<number>;
  /** Minor units. */
  unitPrice: ExtractedField<number>;
}

export interface DocumentExtraction {
  vendorName: ExtractedField<string>;
  /** YYYY-MM-DD */
  documentDate: ExtractedField<string>;
  currency: ExtractedField<string>;
  subtotal: ExtractedField<number>;
  tax: ExtractedField<number>;
  total: ExtractedField<number>;
  lines: ExtractedLine[];
}

/** A scanned supplier receipt or invoice. */
export interface OcrDocument {
  id: string;
  fileName: string;
  status: DocumentStatus;
  uploadedAt: string;
  imageUrl: string | null;
  extraction: DocumentExtraction | null;
  /** The figures a person confirmed. */
  reviewed: ReviewedDocument | null;
  failureReason: string | null;
}
