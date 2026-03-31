export interface VDOTRow {
  vdot: number;
  e: string;   // Easy pace (min:sec/km)
  m: string;   // Marathon pace
  t: string;   // Threshold pace
  i: string;   // Interval pace
  r: string;   // Repetition pace
  '5k': string;
  '10k': string;
  '21k': string;
  '42k': string;
}

export const VDOT_TABLE: VDOTRow[] = [
  { vdot:30, e:"7:52", m:"7:03", t:"6:36", i:"6:06", r:"5:34", "5k":"32:12", "10k":"66:42", "21k":"146:36", "42k":"306:00" },
  { vdot:32, e:"7:25", m:"6:40", t:"6:14", i:"5:46", r:"5:16", "5k":"30:12", "10k":"62:36", "21k":"137:36", "42k":"288:00" },
  { vdot:34, e:"7:01", m:"6:19", t:"5:54", i:"5:28", r:"5:00", "5k":"28:24", "10k":"58:54", "21k":"129:36", "42k":"271:00" },
  { vdot:36, e:"6:40", m:"6:00", t:"5:36", i:"5:12", r:"4:46", "5k":"26:48", "10k":"55:36", "21k":"122:24", "42k":"256:00" },
  { vdot:38, e:"6:21", m:"5:43", t:"5:20", i:"4:57", r:"4:33", "5k":"25:24", "10k":"52:36", "21k":"115:48", "42k":"242:00" },
  { vdot:40, e:"6:03", m:"5:27", t:"5:06", i:"4:44", r:"4:21", "5k":"24:06", "10k":"50:00", "21k":"110:00", "42k":"229:00" },
  { vdot:42, e:"5:48", m:"5:13", t:"4:53", i:"4:31", r:"4:10", "5k":"22:54", "10k":"47:36", "21k":"104:42", "42k":"218:00" },
  { vdot:44, e:"5:33", m:"5:00", t:"4:41", i:"4:20", r:"4:00", "5k":"21:50", "10k":"45:24", "21k":"99:54",  "42k":"208:00" },
  { vdot:46, e:"5:20", m:"4:48", t:"4:30", i:"4:10", r:"3:51", "5k":"20:54", "10k":"43:24", "21k":"95:30",  "42k":"199:00" },
  { vdot:48, e:"5:08", m:"4:37", t:"4:20", i:"4:01", r:"3:42", "5k":"20:00", "10k":"41:36", "21k":"91:30",  "42k":"191:00" },
  { vdot:50, e:"4:57", m:"4:27", t:"4:10", i:"3:52", r:"3:34", "5k":"19:12", "10k":"39:54", "21k":"87:48",  "42k":"183:00" },
  { vdot:52, e:"4:47", m:"4:18", t:"4:02", i:"3:44", r:"3:27", "5k":"18:24", "10k":"38:18", "21k":"84:18",  "42k":"176:00" },
  { vdot:55, e:"4:33", m:"4:05", t:"3:50", i:"3:33", r:"3:17", "5k":"17:18", "10k":"36:06", "21k":"79:24",  "42k":"166:00" },
  { vdot:58, e:"4:20", m:"3:53", t:"3:38", i:"3:22", r:"3:07", "5k":"16:18", "10k":"34:06", "21k":"75:00",  "42k":"157:00" },
  { vdot:60, e:"4:12", m:"3:46", t:"3:32", i:"3:16", r:"3:02", "5k":"15:42", "10k":"32:48", "21k":"72:12",  "42k":"151:00" },
  { vdot:65, e:"3:52", m:"3:28", t:"3:15", i:"3:01", r:"2:48", "5k":"14:12", "10k":"29:48", "21k":"65:36",  "42k":"137:00" },
];

export function timeToSeconds(t: string): number {
  const parts = t.replace(',', ':').split(':').map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return parts[0] * 60;
}

export function secondsToTime(s: number): string {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.round(s % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  return `${m}:${String(sec).padStart(2, '0')}`;
}

export function estimateVDOT(raceDistance: string, raceTime: string): VDOTRow | null {
  const distMap: Record<string, number> = {
    '5k': 5, '10k': 10, '15k': 15, '21k': 21.1, 'meia': 21.1,
    '42k': 42.195, 'maratona': 42.195,
  };
  const dist = distMap[raceDistance.toLowerCase()] || parseFloat(raceDistance);
  if (!dist || !raceTime) return null;

  const timeSec = timeToSeconds(raceTime);
  const pacePerKm = timeSec / dist;

  let closest = VDOT_TABLE[0];
  let minDiff = Infinity;

  for (const row of VDOT_TABLE) {
    const key = dist <= 5 ? '5k' : dist <= 10 ? '10k' : dist <= 21.5 ? '21k' : '42k';
    const refTime = timeToSeconds(row[key]);
    const refDist = dist <= 5 ? 5 : dist <= 10 ? 10 : dist <= 21.5 ? 21.1 : 42.195;
    const refPace = refTime / refDist;
    const diff = Math.abs(refPace - pacePerKm);
    if (diff < minDiff) { minDiff = diff; closest = row; }
  }
  return closest;
}
