import { describe, it, expect } from 'vitest';
import {
  PEAK_VOLUME_TABLE,
  DEFAULT_WEEKS_TABLE,
  calculateTotalWeeks,
  calculatePeakVolume,
  distributePhases,
  buildVolumeCurve,
  buildWeekSessions,
  generatePlan,
} from './plan-generator';
import type { PlanInput } from './plan-generator';
import { VDOT_TABLE } from './vdot';

describe('PEAK_VOLUME_TABLE', () => {
  it('has entries for all distance/level combos', () => {
    expect(PEAK_VOLUME_TABLE['21k']['intermediate']).toBe(55);
    expect(PEAK_VOLUME_TABLE['5k']['beginner']).toBe(25);
    expect(PEAK_VOLUME_TABLE['42k']['competitive']).toBe(110);
  });
});

describe('DEFAULT_WEEKS_TABLE', () => {
  it('returns reasonable defaults when no race date', () => {
    expect(DEFAULT_WEEKS_TABLE['5k']['beginner']).toBeGreaterThanOrEqual(6);
    expect(DEFAULT_WEEKS_TABLE['42k']['beginner']).toBeGreaterThanOrEqual(16);
  });
});

describe('calculateTotalWeeks', () => {
  it('calculates weeks from race date', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 70);
    const weeks = calculateTotalWeeks(futureDate.toISOString().slice(0, 10));
    expect(weeks).toBe(10);
  });

  it('clamps to minimum 4 weeks', () => {
    const soon = new Date();
    soon.setDate(soon.getDate() + 14);
    const weeks = calculateTotalWeeks(soon.toISOString().slice(0, 10));
    expect(weeks).toBe(4);
  });

  it('clamps to maximum 30 weeks', () => {
    const far = new Date();
    far.setDate(far.getDate() + 300);
    const weeks = calculateTotalWeeks(far.toISOString().slice(0, 10));
    expect(weeks).toBe(30);
  });

  it('uses default table when no date', () => {
    const weeks = calculateTotalWeeks(undefined, '21k', 'intermediate');
    expect(weeks).toBeGreaterThanOrEqual(12);
    expect(weeks).toBeLessThanOrEqual(20);
  });
});

describe('calculatePeakVolume', () => {
  it('looks up from table', () => {
    expect(calculatePeakVolume('21k', 'intermediate')).toBe(55);
  });

  it('defaults to intermediate for unknown level', () => {
    expect(calculatePeakVolume('10k', 'sedentary')).toBe(45);
  });
});

describe('distributePhases', () => {
  it('distributes 14 weeks across 4 phases', () => {
    const phases = distributePhases(14);
    expect(phases).toEqual([
      { phase: 'base', weeks: 4 },
      { phase: 'build', weeks: 5 },
      { phase: 'specific', weeks: 4 },
      { phase: 'taper', weeks: 1 },
    ]);
  });

  it('always gives taper at least 1 week', () => {
    const phases = distributePhases(4);
    const taper = phases.find(p => p.phase === 'taper');
    expect(taper!.weeks).toBeGreaterThanOrEqual(1);
  });

  it('total weeks equals input', () => {
    for (const total of [4, 8, 14, 20, 30]) {
      const phases = distributePhases(total);
      const sum = phases.reduce((s, p) => s + p.weeks, 0);
      expect(sum).toBe(total);
    }
  });
});

describe('buildVolumeCurve', () => {
  it('starts near current volume', () => {
    const curve = buildVolumeCurve(14, 30, 55);
    expect(curve[0].targetKm).toBeLessThanOrEqual(33); // max +10%
  });

  it('respects 10% rule', () => {
    const curve = buildVolumeCurve(14, 20, 55);
    for (let i = 1; i < curve.length; i++) {
      if (!curve[i].isRecovery && !['taper'].includes(curve[i].phase)) {
        const lastNonRecovery = curve.slice(0, i).reverse().find(w => !w.isRecovery);
        if (lastNonRecovery) {
          const increase = curve[i].targetKm / lastNonRecovery.targetKm;
          expect(increase).toBeLessThanOrEqual(1.12); // allow slight rounding
        }
      }
    }
  });

  it('inserts recovery weeks every 3-4 weeks', () => {
    const curve = buildVolumeCurve(16, 30, 70);
    const recoveryWeeks = curve.filter(w => w.isRecovery);
    expect(recoveryWeeks.length).toBeGreaterThanOrEqual(2);
  });

  it('recovery weeks have reduced volume', () => {
    const curve = buildVolumeCurve(14, 30, 55);
    const recovery = curve.find(w => w.isRecovery);
    if (recovery) {
      const prevIdx = curve.indexOf(recovery) - 1;
      if (prevIdx >= 0) {
        expect(recovery.targetKm).toBeLessThan(curve[prevIdx].targetKm);
      }
    }
  });

  it('taper reduces volume progressively', () => {
    const curve = buildVolumeCurve(14, 30, 55);
    const taperWeeks = curve.filter(w => w.phase === 'taper');
    if (taperWeeks.length > 0) {
      const lastNonTaper = curve.filter(w => w.phase !== 'taper').pop()!;
      expect(taperWeeks[0].targetKm).toBeLessThan(lastNonTaper.targetKm);
    }
  });

  it('assigns correct phases', () => {
    const curve = buildVolumeCurve(14, 30, 55);
    expect(curve[0].phase).toBe('base');
    expect(curve[curve.length - 1].phase).toBe('taper');
  });

  it('total weeks matches', () => {
    const curve = buildVolumeCurve(14, 30, 55);
    expect(curve.length).toBe(14);
  });
});

describe('buildWeekSessions', () => {
  const vdot42 = VDOT_TABLE.find(r => r.vdot === 42)!;

  it('creates correct number of running sessions for 4 days', () => {
    const sessions = buildWeekSessions({
      daysPerWeek: 4,
      weeklyKm: 40,
      phase: 'build',
      isRecovery: false,
      vdot: vdot42,
    });
    const runningSessions = sessions.filter(s => s.type !== 'rest' && s.type !== 'cross');
    expect(runningSessions.length).toBe(4);
    expect(sessions.length).toBe(7);
  });

  it('creates correct number of sessions for 3 days', () => {
    const sessions = buildWeekSessions({
      daysPerWeek: 3,
      weeklyKm: 25,
      phase: 'base',
      isRecovery: false,
      vdot: vdot42,
    });
    const runningSessions = sessions.filter(s => s.type !== 'rest' && s.type !== 'cross');
    expect(runningSessions.length).toBe(3);
  });

  it('always includes a longao on Sunday', () => {
    const sessions = buildWeekSessions({
      daysPerWeek: 4,
      weeklyKm: 40,
      phase: 'build',
      isRecovery: false,
      vdot: vdot42,
    });
    const sunday = sessions.find(s => s.day === 6);
    expect(sunday!.type).toBe('longao');
  });

  it('respects 80/20 rule roughly', () => {
    const sessions = buildWeekSessions({
      daysPerWeek: 5,
      weeklyKm: 50,
      phase: 'build',
      isRecovery: false,
      vdot: vdot42,
    });
    const runSessions = sessions.filter(s => !['rest', 'cross'].includes(s.type));
    const totalKm = runSessions.reduce((s, r) => s + r.km, 0);
    const easyKm = runSessions
      .filter(s => ['easy', 'longao', 'recovery'].includes(s.type))
      .reduce((s, r) => s + r.km, 0);
    const easyPct = (easyKm / totalKm) * 100;
    expect(easyPct).toBeGreaterThanOrEqual(70);
  });

  it('recovery week has only easy and longao', () => {
    const sessions = buildWeekSessions({
      daysPerWeek: 4,
      weeklyKm: 30,
      phase: 'build',
      isRecovery: true,
      vdot: vdot42,
    });
    const runningSessions = sessions.filter(s => !['rest', 'cross'].includes(s.type));
    runningSessions.forEach(s => {
      expect(['easy', 'longao', 'recovery'].includes(s.type)).toBe(true);
    });
  });

  it('base phase has no intervals', () => {
    const sessions = buildWeekSessions({
      daysPerWeek: 4,
      weeklyKm: 30,
      phase: 'base',
      isRecovery: false,
      vdot: vdot42,
    });
    const hasInterval = sessions.some(s => s.type === 'interval');
    expect(hasInterval).toBe(false);
  });

  it('sessions have pace from VDOT', () => {
    const sessions = buildWeekSessions({
      daysPerWeek: 4,
      weeklyKm: 40,
      phase: 'build',
      isRecovery: false,
      vdot: vdot42,
    });
    const easy = sessions.find(s => s.type === 'easy');
    expect(easy!.pace).toBe('5:48/km');
  });

  it('total km approximately matches target', () => {
    const target = 40;
    const sessions = buildWeekSessions({
      daysPerWeek: 4,
      weeklyKm: target,
      phase: 'build',
      isRecovery: false,
      vdot: vdot42,
    });
    const totalKm = sessions.reduce((s, r) => s + r.km, 0);
    expect(totalKm).toBeGreaterThanOrEqual(target * 0.85);
    expect(totalKm).toBeLessThanOrEqual(target * 1.15);
  });
});

describe('generatePlan', () => {
  const vdot42 = VDOT_TABLE.find(r => r.vdot === 42)!;

  function makePlanInput(overrides: Partial<PlanInput> = {}): PlanInput {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 98); // 14 weeks
    return {
      raceDistance: '21k',
      raceDate: futureDate.toISOString().slice(0, 10),
      experienceLevel: 'intermediate',
      currentWeeklyKm: 30,
      daysPerWeek: 4,
      vdot: vdot42,
      ...overrides,
    };
  }

  it('generates a plan with correct number of weeks', () => {
    const plan = generatePlan(makePlanInput());
    expect(plan.weeks.length).toBe(14);
    expect(plan.totalWeeks).toBe(14);
  });

  it('includes VDOT score', () => {
    const plan = generatePlan(makePlanInput());
    expect(plan.vdotScore).toBe(42);
  });

  it('includes pace zones from VDOT', () => {
    const plan = generatePlan(makePlanInput());
    expect(plan.paces.easy).toBe('5:48');
    expect(plan.paces.tempo).toBe('4:53');
    expect(plan.paces.interval).toBe('4:31');
    expect(plan.paces.marathon).toBe('5:13');
  });

  it('first week is base phase', () => {
    const plan = generatePlan(makePlanInput());
    expect(plan.weeks[0].phase).toBe('base');
  });

  it('last week is taper phase', () => {
    const plan = generatePlan(makePlanInput());
    expect(plan.weeks[plan.weeks.length - 1].phase).toBe('taper');
  });

  it('every week has 7 sessions (including rest)', () => {
    const plan = generatePlan(makePlanInput());
    plan.weeks.forEach(w => {
      expect(w.sessions.length).toBe(7);
    });
  });

  it('calculates total km across all weeks', () => {
    const plan = generatePlan(makePlanInput());
    const calcTotal = plan.weeks.reduce((s, w) => s + w.targetKm, 0);
    expect(plan.totalKm).toBe(calcTotal);
  });

  it('works without VDOT (uses defaults)', () => {
    const plan = generatePlan(makePlanInput({ vdot: null }));
    expect(plan.weeks.length).toBe(14);
    expect(plan.vdotScore).toBe(0);
    expect(plan.paces.easy).toBeTruthy();
  });

  it('works without race date (uses default weeks)', () => {
    const plan = generatePlan(makePlanInput({ raceDate: undefined }));
    expect(plan.weeks.length).toBeGreaterThanOrEqual(4);
  });

  it('handles 3-day plan', () => {
    const plan = generatePlan(makePlanInput({ daysPerWeek: 3 }));
    const firstWeek = plan.weeks[0];
    const runSessions = firstWeek.sessions.filter(s => !['rest', 'cross'].includes(s.type));
    expect(runSessions.length).toBe(3);
  });
});
