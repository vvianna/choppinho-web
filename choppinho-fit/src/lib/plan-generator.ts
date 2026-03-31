import { VDOT_TABLE, type VDOTRow } from './vdot';

// ─── Types ───

export type SessionType =
  | 'easy' | 'tempo' | 'interval' | 'longao'
  | 'recovery' | 'fartlek' | 'racePace' | 'rest' | 'cross';

export type PhaseName = 'base' | 'build' | 'specific' | 'taper';

export interface PlanSession {
  day: number;         // 0=Mon, 6=Sun
  type: SessionType;
  km: number;
  pace: string;        // "M:SS/km"
  zone: string;        // "Z1-Z2", etc.
  description: string;
}

export interface PlanWeek {
  weekNum: number;
  phase: PhaseName;
  targetKm: number;
  isRecovery: boolean;
  sessions: PlanSession[];
}

export interface GeneratedPlan {
  weeks: PlanWeek[];
  vdotScore: number;
  peakVolume: number;
  totalKm: number;
  totalWeeks: number;
  paces: {
    easy: string;
    marathon: string;
    tempo: string;
    interval: string;
    repetition: string;
  };
}

export interface PlanInput {
  raceDistance: string;
  raceDate?: string;
  experienceLevel: string;
  currentWeeklyKm: number;
  daysPerWeek: number;
  vdot: VDOTRow | null;
  goalType?: string;
  crossTraining?: string[];
}

// ─── Constants ───

export const PEAK_VOLUME_TABLE: Record<string, Record<string, number>> = {
  '5k':  { beginner: 25, intermediate: 35, advanced: 50, competitive: 65 },
  '10k': { beginner: 35, intermediate: 45, advanced: 60, competitive: 80 },
  '15k': { beginner: 40, intermediate: 50, advanced: 65, competitive: 85 },
  '21k': { beginner: 45, intermediate: 55, advanced: 70, competitive: 90 },
  '30k': { beginner: 50, intermediate: 60, advanced: 80, competitive: 100 },
  '42k': { beginner: 55, intermediate: 70, advanced: 90, competitive: 110 },
};

export const DEFAULT_WEEKS_TABLE: Record<string, Record<string, number>> = {
  '5k':  { beginner: 8,  intermediate: 6,  advanced: 6,  competitive: 6 },
  '10k': { beginner: 10, intermediate: 8,  advanced: 8,  competitive: 6 },
  '15k': { beginner: 12, intermediate: 10, advanced: 8,  competitive: 8 },
  '21k': { beginner: 16, intermediate: 14, advanced: 12, competitive: 10 },
  '30k': { beginner: 20, intermediate: 16, advanced: 14, competitive: 12 },
  '42k': { beginner: 24, intermediate: 20, advanced: 16, competitive: 14 },
};

export const PHASE_RATIOS: Record<PhaseName, number> = {
  base: 0.30, build: 0.35, specific: 0.25, taper: 0.10,
};

// ─── Phase Distribution ───

export function distributePhases(
  totalWeeks: number,
): { phase: PhaseName; weeks: number }[] {
  const taper = Math.max(1, Math.round(totalWeeks * PHASE_RATIOS.taper));
  const remaining = totalWeeks - taper;
  const base = Math.max(1, Math.round(remaining * (PHASE_RATIOS.base / (1 - PHASE_RATIOS.taper))));
  const build = Math.max(1, Math.round(remaining * (PHASE_RATIOS.build / (1 - PHASE_RATIOS.taper))));
  const specific = Math.max(1, remaining - base - build);

  return [
    { phase: 'base', weeks: base },
    { phase: 'build', weeks: build },
    { phase: 'specific', weeks: specific },
    { phase: 'taper', weeks: taper },
  ];
}

export function buildVolumeCurve(
  totalWeeks: number,
  currentKm: number,
  peakKm: number,
): { weekNum: number; phase: PhaseName; targetKm: number; isRecovery: boolean }[] {
  const phases = distributePhases(totalWeeks);
  const result: { weekNum: number; phase: PhaseName; targetKm: number; isRecovery: boolean }[] = [];

  let weekNum = 0;
  let weeksSinceRecovery = 0;

  for (const { phase, weeks: phaseWeeks } of phases) {
    for (let w = 0; w < phaseWeeks; w++) {
      weekNum++;
      weeksSinceRecovery++;

      // Taper logic
      if (phase === 'taper') {
        const factor = w === 0 ? 0.75 : w === 1 ? 0.50 : 0.40;
        const km = Math.round(peakKm * factor);
        result.push({ weekNum, phase, targetKm: km, isRecovery: false });
        continue;
      }

      // Recovery week every 3-4 weeks
      const isRecovery = weeksSinceRecovery >= 4;
      if (isRecovery) {
        const lastNonRecovery = [...result].reverse().find(w => !w.isRecovery);
        const baseKm = lastNonRecovery ? lastNonRecovery.targetKm : currentKm;
        const km = Math.round(baseKm * 0.70);
        result.push({ weekNum, phase, targetKm: km, isRecovery: true });
        weeksSinceRecovery = 0;
        continue;
      }

      // Progressive volume with 10% rule
      const progressRatio = weekNum / totalWeeks;
      let targetForWeek: number;
      if (phase === 'base') {
        targetForWeek = currentKm + (peakKm * 0.7 - currentKm) * (progressRatio / 0.3);
      } else if (phase === 'build') {
        targetForWeek = peakKm * 0.7 + (peakKm * 0.9 - peakKm * 0.7) * ((progressRatio - 0.3) / 0.35);
      } else {
        targetForWeek = peakKm;
      }

      // Apply 10% rule from last non-recovery week
      const lastNonRecovery = [...result].reverse().find(w => !w.isRecovery);
      const baseForIncrease = lastNonRecovery ? lastNonRecovery.targetKm : currentKm;
      const maxAllowed = Math.round(baseForIncrease * 1.10);

      const km = Math.min(Math.round(targetForWeek), maxAllowed, peakKm);
      result.push({ weekNum, phase, targetKm: Math.max(km, currentKm), isRecovery: false });
    }
  }

  return result;
}

// ─── Helpers ───

function normalizeDistance(d: string): string {
  const lower = d.toLowerCase().replace(/\s/g, '');
  if (lower === 'meia') return '21k';
  if (lower === 'maratona') return '42k';
  if (lower.endsWith('k')) return lower;
  return '21k';
}

function normalizeLevel(level: string): string {
  if (['beginner', 'intermediate', 'advanced', 'competitive'].includes(level)) return level;
  if (level === 'sedentary') return 'intermediate';
  return 'intermediate';
}

export function calculateTotalWeeks(
  raceDate?: string,
  raceDistance?: string,
  level?: string,
): number {
  if (raceDate) {
    const diff = new Date(raceDate).getTime() - Date.now();
    const weeks = Math.round(diff / (7 * 86400000));
    return Math.max(4, Math.min(30, weeks));
  }
  const dist = normalizeDistance(raceDistance || '21k');
  const lvl = normalizeLevel(level || 'intermediate');
  return DEFAULT_WEEKS_TABLE[dist]?.[lvl] ?? 14;
}

export function calculatePeakVolume(raceDistance: string, level: string): number {
  const dist = normalizeDistance(raceDistance);
  const lvl = normalizeLevel(level);
  return PEAK_VOLUME_TABLE[dist]?.[lvl] ?? PEAK_VOLUME_TABLE['21k']['intermediate'];
}

// ─── Session Building ───

interface WeekSessionInput {
  daysPerWeek: number;
  weeklyKm: number;
  phase: PhaseName;
  isRecovery: boolean;
  vdot: VDOTRow;
  crossTraining?: string[];
}

const SESSION_TEMPLATES: Record<number, Record<PhaseName, SessionType[]>> = {
  3: {
    base:     ['easy', 'fartlek', 'longao'],
    build:    ['easy', 'tempo', 'longao'],
    specific: ['tempo', 'interval', 'longao'],
    taper:    ['easy', 'easy', 'longao'],
  },
  4: {
    base:     ['easy', 'easy', 'fartlek', 'longao'],
    build:    ['easy', 'tempo', 'interval', 'longao'],
    specific: ['easy', 'tempo', 'interval', 'longao'],
    taper:    ['easy', 'easy', 'easy', 'longao'],
  },
  5: {
    base:     ['easy', 'easy', 'fartlek', 'easy', 'longao'],
    build:    ['easy', 'tempo', 'easy', 'interval', 'longao'],
    specific: ['easy', 'tempo', 'interval', 'racePace', 'longao'],
    taper:    ['easy', 'easy', 'easy', 'easy', 'longao'],
  },
  6: {
    base:     ['easy', 'easy', 'fartlek', 'easy', 'recovery', 'longao'],
    build:    ['easy', 'tempo', 'easy', 'interval', 'recovery', 'longao'],
    specific: ['easy', 'tempo', 'interval', 'racePace', 'recovery', 'longao'],
    taper:    ['easy', 'easy', 'easy', 'recovery', 'easy', 'longao'],
  },
};

const DAY_SLOTS: Record<number, number[]> = {
  3: [0, 2, 6],
  4: [0, 2, 4, 6],
  5: [0, 1, 3, 4, 6],
  6: [0, 1, 2, 4, 5, 6],
};

function getPace(type: SessionType, vdot: VDOTRow): string {
  switch (type) {
    case 'easy': case 'longao': case 'recovery': return `${vdot.e}/km`;
    case 'tempo': return `${vdot.t}/km`;
    case 'interval': return `${vdot.i}/km`;
    case 'racePace': return `${vdot.m}/km`;
    case 'fartlek': return `${vdot.e}-${vdot.t}/km`;
    default: return '—';
  }
}

function getZone(type: SessionType): string {
  switch (type) {
    case 'recovery': return 'Z1';
    case 'easy': case 'longao': return 'Z1-Z2';
    case 'fartlek': return 'Z2-Z4';
    case 'racePace': return 'Z3';
    case 'tempo': return 'Z3-Z4';
    case 'interval': return 'Z4-Z5';
    default: return '—';
  }
}

function getDescription(type: SessionType, km: number, phase: PhaseName, vdot: VDOTRow): string {
  const LONGAO_RACE_PACE: Record<PhaseName, number> = { base: 0, build: 0.30, specific: 0.50, taper: 0 };
  switch (type) {
    case 'easy': return `Corrida leve ${km}km. Manter ritmo confortavel, FC controlada.`;
    case 'tempo': return `Aquec 2km + ${Math.max(1, km - 4)}km em pace ${vdot.t}/km + volta calma 2km.`;
    case 'interval': {
      const reps = Math.max(3, Math.round(km / 1.5));
      return `Aquec 2km + ${reps}x800m em pace ${vdot.i}/km (rec 400m trote) + volta calma 1km.`;
    }
    case 'longao': {
      const rpFraction = LONGAO_RACE_PACE[phase];
      if (rpFraction > 0) {
        const rpKm = Math.round(km * rpFraction);
        return `${km - rpKm}km easy + ${rpKm}km em pace ${vdot.m}/km.`;
      }
      return `Corrida longa ${km}km em pace leve. Foco em tempo de pe.`;
    }
    case 'fartlek': return `${km}km com variacoes de ritmo: 2min forte / 2min leve. Divirta-se!`;
    case 'racePace': return `${km}km em pace de prova (${vdot.m}/km). Simular ritmo do dia.`;
    case 'recovery': return `Corrida regenerativa ${km}km. Bem leve, sem se preocupar com pace.`;
    case 'rest': return 'Descanso total ou alongamento leve.';
    case 'cross': return 'Cross-training: musculacao, natacao ou bike. 40-50min.';
    default: return '';
  }
}

export function buildWeekSessions(input: WeekSessionInput): PlanSession[] {
  const { daysPerWeek, weeklyKm, phase, isRecovery, vdot, crossTraining } = input;
  const days = Math.max(3, Math.min(6, daysPerWeek));

  let template = SESSION_TEMPLATES[days]?.[phase] ?? SESSION_TEMPLATES[4][phase];

  // Recovery weeks: replace quality with easy
  if (isRecovery) {
    template = template.map(t =>
      ['tempo', 'interval', 'fartlek', 'racePace'].includes(t) ? 'easy' : t
    );
  }

  const slots = DAY_SLOTS[days] ?? DAY_SLOTS[4];

  // Allocate longao first (30% of weekly km, or 25% for recovery)
  const longaoKm = Math.round(weeklyKm * (isRecovery ? 0.25 : 0.30));
  const remainingKm = weeklyKm - longaoKm;

  // First pass: assign capped km to quality sessions
  const qualityTypes = new Set<SessionType>(['tempo', 'interval', 'racePace', 'fartlek', 'recovery']);
  const otherSessions = template.filter(t => t !== 'longao');
  const baseKmPerSession = otherSessions.length > 0 ? remainingKm / otherSessions.length : 0;

  const qualityKmMap: SessionType[] = [];
  let qualityTotalKm = 0;
  for (const type of otherSessions) {
    if (type === 'recovery') {
      const km = Math.max(1, Math.round(Math.min(baseKmPerSession, 5)));
      qualityKmMap.push(type);
      qualityTotalKm += km;
    } else if (type === 'interval') {
      const km = Math.max(1, Math.round(Math.min(baseKmPerSession, weeklyKm * 0.12)));
      qualityKmMap.push(type);
      qualityTotalKm += km;
    } else if (type === 'tempo' || type === 'racePace' || type === 'fartlek') {
      const km = Math.max(1, Math.round(Math.min(baseKmPerSession, weeklyKm * 0.15)));
      qualityKmMap.push(type);
      qualityTotalKm += km;
    }
  }

  // Redistribute remaining km to easy sessions
  const easySessions = otherSessions.filter(t => !qualityTypes.has(t));
  const easyTotalBudget = remainingKm - qualityTotalKm;
  const kmPerEasy = easySessions.length > 0 ? easyTotalBudget / easySessions.length : baseKmPerSession;

  // Second pass: build session list with correct km
  let qualityIdx = 0;
  const sessions: PlanSession[] = [];
  for (let i = 0; i < template.length; i++) {
    const type = template[i];
    let km: number;
    if (type === 'longao') {
      km = longaoKm;
    } else if (type === 'recovery') {
      km = Math.max(1, Math.round(Math.min(baseKmPerSession, 5)));
      qualityIdx++;
    } else if (type === 'interval') {
      km = Math.max(1, Math.round(Math.min(baseKmPerSession, weeklyKm * 0.12)));
      qualityIdx++;
    } else if (type === 'tempo' || type === 'racePace' || type === 'fartlek') {
      km = Math.max(1, Math.round(Math.min(baseKmPerSession, weeklyKm * 0.15)));
      qualityIdx++;
    } else {
      km = Math.max(1, Math.round(kmPerEasy));
    }

    sessions.push({
      day: slots[i],
      type,
      km,
      pace: getPace(type, vdot),
      zone: getZone(type),
      description: getDescription(type, km, phase, vdot),
    });
  }

  // Fill remaining days with rest/cross
  for (let d = 0; d < 7; d++) {
    if (!sessions.some(s => s.day === d)) {
      const useCross = crossTraining && crossTraining.length > 0 &&
        !sessions.some(s => s.type === 'cross') && d === 5;
      sessions.push({
        day: d,
        type: useCross ? 'cross' : 'rest',
        km: 0,
        pace: '—',
        zone: useCross ? 'Z1-Z2' : '—',
        description: useCross
          ? `Cross-training: ${crossTraining!.join(', ')}. 40-50min.`
          : 'Descanso total ou alongamento leve.',
      });
    }
  }

  return sessions.sort((a, b) => a.day - b.day);
}

// ─── Plan Generator ───

// Default VDOT for fallback (VDOT 34 = beginner/intermediate)
const DEFAULT_VDOT: VDOTRow = VDOT_TABLE.find(r => r.vdot === 34)!;

export function generatePlan(input: PlanInput): GeneratedPlan {
  const {
    raceDistance,
    raceDate,
    experienceLevel,
    currentWeeklyKm,
    daysPerWeek,
    vdot,
    crossTraining,
  } = input;

  const effectiveVdot = vdot ?? DEFAULT_VDOT;

  const totalWeeks = calculateTotalWeeks(raceDate, raceDistance, experienceLevel);
  const peakVolume = calculatePeakVolume(raceDistance, experienceLevel);
  const volumeCurve = buildVolumeCurve(totalWeeks, currentWeeklyKm, peakVolume);

  const weeks: PlanWeek[] = volumeCurve.map(weekData => ({
    weekNum: weekData.weekNum,
    phase: weekData.phase,
    targetKm: weekData.targetKm,
    isRecovery: weekData.isRecovery,
    sessions: buildWeekSessions({
      daysPerWeek,
      weeklyKm: weekData.targetKm,
      phase: weekData.phase,
      isRecovery: weekData.isRecovery,
      vdot: effectiveVdot,
      crossTraining,
    }),
  }));

  const totalKm = weeks.reduce((s, w) => s + w.targetKm, 0);

  return {
    weeks,
    vdotScore: vdot?.vdot ?? 0,
    peakVolume,
    totalKm,
    totalWeeks,
    paces: {
      easy: effectiveVdot.e,
      marathon: effectiveVdot.m,
      tempo: effectiveVdot.t,
      interval: effectiveVdot.i,
      repetition: effectiveVdot.r,
    },
  };
}
