import { describe, expect, it } from 'vitest';

import { getConfidenceLevel, needsReview } from './confidence';

describe('getConfidenceLevel', () => {
  it.each([
    [1, 'high'],
    [0.9, 'high'],
    [0.8999, 'medium'],
    [0.7, 'medium'],
    [0.6999, 'low'],
    [0, 'low'],
  ] as const)('scores %s as %s', (score, level) => {
    expect(getConfidenceLevel(score)).toBe(level);
  });

  // An unknown score must never pass as trustworthy: a person has to check it.
  it.each([Number.NaN, -0.1, 1.1, null, undefined])('treats invalid score %s as low', (score) => {
    expect(getConfidenceLevel(score)).toBe('low');
  });
});

describe('needsReview', () => {
  it('passes a document when every field is high confidence', () => {
    expect(needsReview([{ confidence: 0.98 }, { confidence: 0.91 }])).toBe(false);
  });

  it('flags a document when any field is below high confidence', () => {
    expect(needsReview([{ confidence: 0.98 }, { confidence: 0.75 }])).toBe(true);
    expect(needsReview([{ confidence: 0.98 }, { confidence: null }])).toBe(true);
  });

  it('flags a document with no extracted fields', () => {
    expect(needsReview([])).toBe(true);
  });
});
