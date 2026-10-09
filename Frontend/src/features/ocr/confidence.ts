export type ConfidenceLevel = 'high' | 'medium' | 'low';

const HIGH = 0.9;
const MEDIUM = 0.7;

/** Invalid or unknown scores count as low: a person has to check them. */
export function getConfidenceLevel(score: number | null | undefined): ConfidenceLevel {
  if (typeof score !== 'number' || !Number.isFinite(score) || score < 0 || score > 1) return 'low';
  if (score >= HIGH) return 'high';
  if (score >= MEDIUM) return 'medium';
  return 'low';
}

/** True unless every extracted field is high confidence. An empty extraction always needs review. */
export function needsReview(fields: ReadonlyArray<{ confidence: number | null | undefined }>): boolean {
  return fields.length === 0 || fields.some((field) => getConfidenceLevel(field.confidence) !== 'high');
}
