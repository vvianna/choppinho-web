import type { Activity } from './types';

export interface StravaAnalysis {
  totalKm: number;
  totalRuns: number;
  totalTime: number;
  totalElevation: number;
  avgWeeklyKm: number;
  avgRunsPerWeek: number;
  longestRun: Activity;
  avgEasyPace: number;       // seconds per km
  fastestPace: number;
  maxHR: number | null;
  avgHR: number | null;
  races: Activity[];
  bestRace: Activity | null;
  qualitySessions: number;
  easyPct: number;
  hardPct: number;
  consistencyScore: number;  // 0-100
  volumeTrend: number;       // % change last 4 weeks vs prior 4
  estimatedLevel: 'sedentary' | 'beginner' | 'intermediate' | 'advanced' | 'competitive';
  weeklyData: { week: string; km: number; runs: number }[];
  insights: { type: 'strength' | 'warning'; text: string }[];
  paceZones: { z1: number; z2: number; z3: number; z4: number; z5: number };
}

const EMPTY_ANALYSIS: StravaAnalysis = {
  totalKm: 0, totalRuns: 0, totalTime: 0, totalElevation: 0,
  avgWeeklyKm: 0, avgRunsPerWeek: 0,
  longestRun: {} as Activity,
  avgEasyPace: 0, fastestPace: 0,
  maxHR: null, avgHR: null,
  races: [], bestRace: null, qualitySessions: 0,
  easyPct: 0, hardPct: 0,
  consistencyScore: 0, volumeTrend: 0,
  estimatedLevel: 'sedentary',
  weeklyData: [], insights: [],
  paceZones: { z1: 0, z2: 0, z3: 0, z4: 0, z5: 0 },
};

export function analyzeActivities(activities: Activity[]): StravaAnalysis {
  const now = new Date();
  const cutoff = new Date(now.getTime() - 90 * 86400000);
  const runs = activities.filter(
    a => a.activity_type === 'Run' && new Date(a.start_date) >= cutoff
  );

  if (runs.length === 0) return { ...EMPTY_ANALYSIS };

  // --- Basic metrics ---
  const totalKm = runs.reduce((s, a) => s + a.distance_meters, 0) / 1000;
  const totalTime = runs.reduce((s, a) => s + a.moving_time_seconds, 0);
  const totalElevation = runs.reduce((s, a) => s + a.total_elevation_gain, 0);

  // --- Weekly grouping ---
  const weeks: Record<string, { km: number; runs: number; time: number }> = {};
  runs.forEach(a => {
    const d = new Date(a.start_date);
    const ws = new Date(d);
    ws.setDate(d.getDate() - d.getDay());
    const key = ws.toISOString().slice(0, 10);
    if (!weeks[key]) weeks[key] = { km: 0, runs: 0, time: 0 };
    weeks[key].km += a.distance_meters / 1000;
    weeks[key].runs++;
    weeks[key].time += a.moving_time_seconds;
  });
  const weeklyData = Object.entries(weeks)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([week, data]) => ({ week, km: Math.round(data.km * 10) / 10, runs: data.runs }));
  const avgWeeklyKm = weeklyData.length
    ? Math.round(weeklyData.reduce((s, w) => s + w.km, 0) / weeklyData.length)
    : 0;
  const avgRunsPerWeek = weeklyData.length
    ? +(weeklyData.reduce((s, w) => s + w.runs, 0) / weeklyData.length).toFixed(1)
    : 0;

  // --- Longest run ---
  const longestRun = runs.reduce((m, a) => a.distance_meters > m.distance_meters ? a : m, runs[0]);

  // --- Pace analysis ---
  const easyRuns = runs.filter(a => (a.workout_type ?? 0) === 0);
  const easyPaces = easyRuns
    .filter(a => a.distance_meters > 0)
    .map(a => a.moving_time_seconds / (a.distance_meters / 1000));
  const avgEasyPace = easyPaces.length
    ? easyPaces.reduce((s, p) => s + p, 0) / easyPaces.length
    : 0;
  const allPaces = runs
    .filter(a => a.distance_meters > 0)
    .map(a => a.moving_time_seconds / (a.distance_meters / 1000));
  const fastestPace = allPaces.length ? Math.min(...allPaces) : 0;

  // --- Heart rate ---
  const hrRuns = runs.filter(a => a.average_heartrate);
  const maxHR = hrRuns.length ? Math.max(...hrRuns.map(a => a.max_heartrate!)) : null;
  const avgHR = hrRuns.length
    ? Math.round(hrRuns.reduce((s, a) => s + a.average_heartrate!, 0) / hrRuns.length)
    : null;

  // --- Race detection ---
  const races = runs
    .filter(a => (a.workout_type ?? 0) === 1)
    .sort((a, b) => {
      const pa = a.moving_time_seconds / (a.distance_meters / 1000);
      const pb = b.moving_time_seconds / (b.distance_meters / 1000);
      return pa - pb;
    });
  const bestRace = races.length > 0 ? races[0] : null;

  // --- 80/20 distribution ---
  const qualitySessions = runs.filter(a => (a.workout_type ?? 0) === 3).length;
  const easyKm = easyRuns.reduce((s, a) => s + a.distance_meters, 0) / 1000;
  const hardKm = runs
    .filter(a => (a.workout_type ?? 0) === 3 || (a.workout_type ?? 0) === 1)
    .reduce((s, a) => s + a.distance_meters, 0) / 1000;
  const easyPct = totalKm > 0 ? Math.round((easyKm / totalKm) * 100) : 0;
  const hardPct = totalKm > 0 ? Math.round((hardKm / totalKm) * 100) : 0;

  // --- Pace zones ---
  const paceZones = { z1: 0, z2: 0, z3: 0, z4: 0, z5: 0 };
  runs.forEach(a => {
    if (a.distance_meters <= 0) return;
    const pace = a.moving_time_seconds / (a.distance_meters / 1000);
    const km = a.distance_meters / 1000;
    if (pace > 420) paceZones.z1 += km;
    else if (pace > 360) paceZones.z2 += km;
    else if (pace > 330) paceZones.z3 += km;
    else if (pace > 300) paceZones.z4 += km;
    else paceZones.z5 += km;
  });

  // --- Consistency ---
  const consistentWeeks = weeklyData.filter(w => w.runs >= 2).length;
  const consistencyScore = weeklyData.length
    ? Math.round((consistentWeeks / weeklyData.length) * 100)
    : 0;

  // --- Volume trend ---
  const last4 = weeklyData.slice(-4);
  const prior4 = weeklyData.slice(-8, -4);
  const l4avg = last4.length ? last4.reduce((s, w) => s + w.km, 0) / last4.length : 0;
  const p4avg = prior4.length ? prior4.reduce((s, w) => s + w.km, 0) / prior4.length : 0;
  const volumeTrend = p4avg > 0 ? Math.round(((l4avg - p4avg) / p4avg) * 100) : 0;

  // --- Estimated level ---
  const estimatedLevel: StravaAnalysis['estimatedLevel'] =
    avgWeeklyKm > 55 ? 'competitive' :
    avgWeeklyKm > 35 ? 'advanced' :
    avgWeeklyKm > 18 ? 'intermediate' :
    avgWeeklyKm > 5 ? 'beginner' : 'sedentary';

  // --- Insights ---
  const insights: { type: 'strength' | 'warning'; text: string }[] = [];

  if (easyPct >= 75 && easyPct <= 85)
    insights.push({ type: 'strength', text: 'Distribuicao 80/20 no ponto!' });
  else if (easyPct < 70)
    insights.push({ type: 'warning', text: `So ${easyPct}% dos km sao leves. Risco de overtraining.` });
  else if (easyPct > 90)
    insights.push({ type: 'warning', text: 'Poucos estimulos de intensidade. Adicione treinos de qualidade.' });

  if (longestRun && longestRun.distance_meters / 1000 >= 18)
    insights.push({ type: 'strength', text: `Longao de ${(longestRun.distance_meters / 1000).toFixed(1)}km — base solida!` });

  if (consistencyScore >= 80)
    insights.push({ type: 'strength', text: `Consistencia de ${consistencyScore}%. Excelente!` });
  else if (consistencyScore < 60)
    insights.push({ type: 'warning', text: `Consistencia de ${consistencyScore}%. Tente nao falhar semanas.` });

  if (volumeTrend > 15)
    insights.push({ type: 'warning', text: `Volume subiu ${volumeTrend}% recentemente. Cuidado com a regra dos 10%.` });

  return {
    totalKm: Math.round(totalKm * 10) / 10,
    totalRuns: runs.length,
    totalTime,
    totalElevation: Math.round(totalElevation),
    avgWeeklyKm,
    avgRunsPerWeek,
    longestRun,
    avgEasyPace: Math.round(avgEasyPace),
    fastestPace: Math.round(fastestPace),
    maxHR,
    avgHR,
    races,
    bestRace,
    qualitySessions,
    easyPct,
    hardPct,
    consistencyScore,
    volumeTrend,
    estimatedLevel,
    weeklyData,
    insights,
    paceZones,
  };
}
