import { describe, it, expect } from 'vitest';
import { analyzeActivities } from './strava-analyzer';
import type { Activity } from './types';

let _idCounter = 0;
function nextId(): string {
  return `test-id-${++_idCounter}`;
}

// Factory to create test activities
function makeActivity(overrides: Partial<Activity> = {}): Activity {
  return {
    id: nextId(),
    user_id: 'test-user',
    strava_activity_id: Math.floor(Math.random() * 1000000),
    activity_type: 'Run',
    name: 'Morning Run',
    start_date: new Date().toISOString(),
    distance_meters: 8000,
    moving_time_seconds: 2880, // 8km in 48min = 6:00/km
    elapsed_time_seconds: 3000,
    total_elevation_gain: 50,
    average_speed: 2.78,
    max_speed: 3.5,
    average_heartrate: 145,
    max_heartrate: 165,
    suffer_score: null,
    calories: null,
    average_cadence: null,
    splits_json: null,
    insight_sent: false,
    synced_at: new Date().toISOString(),
    workout_type: 0,
    ...overrides,
  };
}

function makeWeekOfActivities(weekOffset: number, count: number): Activity[] {
  const activities: Activity[] = [];
  const now = new Date();
  for (let i = 0; i < count; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - weekOffset * 7 - i);
    activities.push(makeActivity({
      start_date: date.toISOString(),
      distance_meters: 7000 + Math.random() * 4000,
      moving_time_seconds: 2400 + Math.random() * 1200,
    }));
  }
  return activities;
}

describe('analyzeActivities', () => {
  it('returns zero-state for empty array', () => {
    const result = analyzeActivities([]);
    expect(result.totalKm).toBe(0);
    expect(result.totalRuns).toBe(0);
    expect(result.estimatedLevel).toBe('sedentary');
  });

  it('filters only Run activities from last 90 days', () => {
    const oldRun = makeActivity({
      start_date: new Date(Date.now() - 100 * 86400000).toISOString(),
      activity_type: 'Run',
    });
    const recentRun = makeActivity({
      start_date: new Date().toISOString(),
      activity_type: 'Run',
    });
    const recentRide = makeActivity({
      start_date: new Date().toISOString(),
      activity_type: 'Ride',
    });

    const result = analyzeActivities([oldRun, recentRun, recentRide]);
    expect(result.totalRuns).toBe(1);
  });

  it('calculates total km correctly', () => {
    const activities = [
      makeActivity({ distance_meters: 10000, start_date: new Date().toISOString() }),
      makeActivity({ distance_meters: 5000, start_date: new Date().toISOString() }),
    ];
    const result = analyzeActivities(activities);
    expect(result.totalKm).toBe(15);
  });

  it('finds the longest run', () => {
    const activities = [
      makeActivity({ distance_meters: 10000, start_date: new Date().toISOString(), name: 'Short' }),
      makeActivity({ distance_meters: 21000, start_date: new Date().toISOString(), name: 'Long' }),
      makeActivity({ distance_meters: 8000, start_date: new Date().toISOString(), name: 'Medium' }),
    ];
    const result = analyzeActivities(activities);
    expect(result.longestRun.name).toBe('Long');
  });

  it('detects races by workout_type', () => {
    const activities = [
      makeActivity({ workout_type: 0, start_date: new Date().toISOString() }),
      makeActivity({ workout_type: 1, start_date: new Date().toISOString(), name: 'Race Day' }),
      makeActivity({ workout_type: 3, start_date: new Date().toISOString() }),
    ];
    const result = analyzeActivities(activities);
    expect(result.races.length).toBe(1);
    expect(result.races[0].name).toBe('Race Day');
  });

  it('calculates 80/20 distribution', () => {
    const easy = Array.from({ length: 8 }, () =>
      makeActivity({ workout_type: 0, distance_meters: 8000, start_date: new Date().toISOString() })
    );
    const hard = Array.from({ length: 2 }, () =>
      makeActivity({ workout_type: 3, distance_meters: 8000, start_date: new Date().toISOString() })
    );
    const result = analyzeActivities([...easy, ...hard]);
    expect(result.easyPct).toBe(80);
    expect(result.hardPct).toBe(20);
  });

  it('estimates level based on weekly km', () => {
    // 12 weeks of ~40km/week = advanced
    const activities: Activity[] = [];
    for (let w = 0; w < 12; w++) {
      activities.push(...Array.from({ length: 4 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - w * 7 - i);
        return makeActivity({
          start_date: date.toISOString(),
          distance_meters: 10000,
        });
      }));
    }
    const result = analyzeActivities(activities);
    expect(result.avgWeeklyKm).toBeGreaterThanOrEqual(35);
    expect(result.estimatedLevel).toBe('advanced');
  });

  it('calculates average easy pace', () => {
    const activities = [
      makeActivity({
        workout_type: 0,
        distance_meters: 10000,
        moving_time_seconds: 3600, // 6:00/km
        start_date: new Date().toISOString(),
      }),
    ];
    const result = analyzeActivities(activities);
    expect(result.avgEasyPace).toBe(360); // 360 seconds = 6:00/km
  });

  it('generates insights for poor 80/20 distribution', () => {
    const allHard = Array.from({ length: 10 }, () =>
      makeActivity({ workout_type: 3, distance_meters: 8000, start_date: new Date().toISOString() })
    );
    const result = analyzeActivities(allHard);
    expect(result.insights.some(i => i.type === 'warning' && i.text.includes('leves'))).toBe(true);
  });

  it('generates weekly data grouped correctly', () => {
    const activities = makeWeekOfActivities(0, 3).concat(makeWeekOfActivities(1, 4));
    const result = analyzeActivities(activities);
    expect(result.weeklyData.length).toBeGreaterThanOrEqual(2);
  });
});
