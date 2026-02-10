import { describe, expect, it } from 'vitest';
import { toGregorian, toShamsi, getStartOfCurrentShamsiMonth } from './utils';

describe('date utilities', () => {
  it('keeps already-formatted gregorian dates unchanged', () => {
    expect(toGregorian('2026-02-10')).toBe('2026-02-10');
  });

  it('keeps already-formatted shamsi dates unchanged', () => {
    expect(toShamsi('1404/11/21')).toBe('1404/11/21');
  });

  it('returns a gregorian month start string', () => {
    const result = getStartOfCurrentShamsiMonth();
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
