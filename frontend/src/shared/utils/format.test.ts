import { describe, expect, it } from 'vitest';
import { DATE_PRESETS, detectPreset } from './date-presets';
import { dateForInput, dateLabel, dateToISO, formatCurrency } from './format';

describe('format utilities', () => {
  it('formats PEN and USD currencies cleanly', () => {
    expect(formatCurrency(1500, 'PEN')).toContain('1,500.00');
    expect(formatCurrency(250.5, 'USD')).toContain('$250.50');
  });

  it('parses and formats calendar dates consistently in UTC', () => {
    const iso = dateToISO('2026-11-18');
    expect(iso).toBe('2026-11-18T12:00:00.000Z');
    expect(dateForInput(iso)).toBe('2026-11-18');
    expect(dateLabel(iso)).toContain('2026');
    expect(dateLabel('invalid-date')).toBe('—');
  });
});

describe('date presets', () => {
  it('detects active preset matching exact range and returns null for custom range', () => {
    const thirty = DATE_PRESETS.find((p) => p.key === 'last_30')!;
    const range = thirty.getRange();

    expect(detectPreset(range.from, range.to)).toBe('last_30');
    expect(detectPreset('2026-01-03', '2026-01-09')).toBeNull();
  });
});
