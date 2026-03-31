import { describe, it, expect } from 'vitest';
import { timeToSeconds, secondsToTime, estimateVDOT, VDOT_TABLE } from './vdot';

describe('timeToSeconds', () => {
  it('converts MM:SS format', () => {
    expect(timeToSeconds('5:00')).toBe(300);
    expect(timeToSeconds('4:31')).toBe(271);
  });

  it('converts H:MM:SS format', () => {
    expect(timeToSeconds('1:45:30')).toBe(6330);
    expect(timeToSeconds('0:52:34')).toBe(3154);
  });

  it('handles single number as minutes', () => {
    expect(timeToSeconds('5')).toBe(300);
  });
});

describe('secondsToTime', () => {
  it('formats seconds to MM:SS when under 1 hour', () => {
    expect(secondsToTime(300)).toBe('5:00');
    expect(secondsToTime(271)).toBe('4:31');
  });

  it('formats seconds to H:MM:SS when over 1 hour', () => {
    expect(secondsToTime(6330)).toBe('1:45:30');
  });

  it('pads minutes and seconds with zeros', () => {
    expect(secondsToTime(3605)).toBe('1:00:05');
  });
});

describe('VDOT_TABLE', () => {
  it('has entries from VDOT 30 to 65', () => {
    expect(VDOT_TABLE[0].vdot).toBe(30);
    expect(VDOT_TABLE[VDOT_TABLE.length - 1].vdot).toBe(65);
  });

  it('has all required pace zones', () => {
    const row = VDOT_TABLE[0];
    expect(row.e).toBeDefined();
    expect(row.m).toBeDefined();
    expect(row.t).toBeDefined();
    expect(row.i).toBeDefined();
    expect(row.r).toBeDefined();
  });
});

describe('estimateVDOT', () => {
  it('estimates VDOT from a 10K race result', () => {
    const result = estimateVDOT('10k', '52:34');
    expect(result).not.toBeNull();
    expect(result!.vdot).toBeGreaterThanOrEqual(36);
    expect(result!.vdot).toBeLessThanOrEqual(42);
  });

  it('estimates VDOT from a 5K race result', () => {
    const result = estimateVDOT('5k', '24:06');
    expect(result).not.toBeNull();
    expect(result!.vdot).toBe(40);
  });

  it('estimates VDOT from a half marathon result', () => {
    const result = estimateVDOT('21k', '1:50:00');
    expect(result).not.toBeNull();
    expect(result!.vdot).toBeGreaterThanOrEqual(40);
    expect(result!.vdot).toBeLessThanOrEqual(46);
  });

  it('returns null for invalid input', () => {
    expect(estimateVDOT('', '24:00')).toBeNull();
    expect(estimateVDOT('5k', '')).toBeNull();
  });

  it('handles meia as 21k alias', () => {
    const a = estimateVDOT('21k', '1:50:00');
    const b = estimateVDOT('meia', '1:50:00');
    expect(a).toEqual(b);
  });
});
