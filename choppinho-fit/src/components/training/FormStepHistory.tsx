import type { TrainingFormData } from '../../pages/dashboard/TrainingForm';
import type { StravaAnalysis } from '../../lib/strava-analyzer';

interface FormStepProps {
  data: TrainingFormData;
  onChange: (updates: Partial<TrainingFormData>) => void;
  stravaAnalysis?: StravaAnalysis | null;
}

const LEVEL_OPTIONS = [
  { value: 'sedentary', label: 'Sedentário' },
  { value: 'beginner', label: 'Iniciante' },
  { value: 'intermediate', label: 'Intermediário' },
  { value: 'advanced', label: 'Avançado' },
  { value: 'competitive', label: 'Competitivo' },
];

function StravaBadge() {
  return (
    <span
      className="text-xs font-bold px-2 py-0.5 rounded"
      style={{ background: '#fc6d27', color: 'white' }}
    >
      STRAVA
    </span>
  );
}

export default function FormStepHistory({ data, onChange, stravaAnalysis }: FormStepProps) {
  const hasStrava = !!stravaAnalysis;

  return (
    <div>
      <h2 className="font-display font-bold text-xl text-bark mb-1">Histórico</h2>
      <p className="text-sm text-bark/60 font-body mb-6">Qual é sua experiência como corredor?</p>

      {hasStrava ? (
        <>
          {/* Mini stats dashboard */}
          <div className="grid grid-cols-2 gap-3 mb-5 sm:grid-cols-4">
            <div className="bg-primary/5 rounded-xl p-4 text-center">
              <div className="text-2xl font-display font-bold text-primary">
                {stravaAnalysis.totalKm}
              </div>
              <div className="text-xs font-semibold text-bark/60 uppercase">Total km</div>
            </div>
            <div className="bg-primary/5 rounded-xl p-4 text-center">
              <div className="text-2xl font-display font-bold text-primary">
                {stravaAnalysis.totalRuns}
              </div>
              <div className="text-xs font-semibold text-bark/60 uppercase">Corridas</div>
            </div>
            <div className="bg-primary/5 rounded-xl p-4 text-center">
              <div className="text-2xl font-display font-bold text-primary">
                {stravaAnalysis.consistencyScore}%
              </div>
              <div className="text-xs font-semibold text-bark/60 uppercase">Consistência</div>
            </div>
            <div className="bg-primary/5 rounded-xl p-4 text-center">
              <div className="text-2xl font-display font-bold text-primary">
                {stravaAnalysis.longestRun?.distance_meters
                  ? (stravaAnalysis.longestRun.distance_meters / 1000).toFixed(1)
                  : '—'}
              </div>
              <div className="text-xs font-semibold text-bark/60 uppercase">Longão km</div>
            </div>
          </div>

          {/* Insights */}
          {stravaAnalysis.insights.length > 0 && (
            <div className="space-y-2 mb-5">
              {stravaAnalysis.insights.map((insight, i) => (
                <div
                  key={i}
                  className={`flex items-start gap-2 text-sm font-body px-3 py-2 rounded-lg ${
                    insight.type === 'strength'
                      ? 'bg-primary/5 text-bark'
                      : 'bg-amber-50 text-amber-800'
                  }`}
                >
                  <span>{insight.type === 'strength' ? '💪' : '⚠️'}</span>
                  <span>{insight.text}</span>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="bg-bark/5 border border-bark/10 rounded-xl p-4 mb-5 text-sm text-bark/60 font-body">
          Sem dados do Strava. Preencha manualmente.
        </div>
      )}

      <div className="space-y-5">
        {/* Experience level */}
        <div>
          <label className="block font-body font-semibold text-bark mb-2 text-sm flex items-center gap-2">
            Nível de experiência{' '}
            {hasStrava && <StravaBadge />}
          </label>
          <select
            value={data.experienceLevel}
            onChange={(e) => onChange({ experienceLevel: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border border-bark/20 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-bark font-body bg-white"
          >
            {LEVEL_OPTIONS.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        {/* Weekly km + Longest run */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block font-body font-semibold text-bark mb-2 text-sm flex items-center gap-2">
              Km/semana atual{' '}
              {hasStrava && <StravaBadge />}
            </label>
            <input
              type="number"
              min={0}
              step={1}
              value={data.weeklyKm}
              onChange={(e) =>
                onChange({ weeklyKm: e.target.value === '' ? '' : Number(e.target.value) })
              }
              placeholder="Ex: 30"
              className="w-full px-4 py-3 rounded-xl border border-bark/20 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-bark font-body"
            />
          </div>

          <div>
            <label className="block font-body font-semibold text-bark mb-2 text-sm flex items-center gap-2">
              Longão recente (km){' '}
              {hasStrava && <StravaBadge />}
            </label>
            <input
              type="number"
              min={0}
              step={0.1}
              value={data.longestRun}
              onChange={(e) =>
                onChange({ longestRun: e.target.value === '' ? '' : Number(e.target.value) })
              }
              placeholder="Ex: 18"
              className="w-full px-4 py-3 rounded-xl border border-bark/20 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-bark font-body"
            />
          </div>
        </div>

        {/* Recent race distance + time */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block font-body font-semibold text-bark mb-2 text-sm">
              Distância prova recente
            </label>
            <input
              type="text"
              value={data.recentRaceDistance}
              onChange={(e) => onChange({ recentRaceDistance: e.target.value })}
              placeholder="Ex: 21k, 10k"
              className="w-full px-4 py-3 rounded-xl border border-bark/20 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-bark font-body"
            />
          </div>

          <div>
            <label className="block font-body font-semibold text-bark mb-2 text-sm">
              Tempo prova recente
            </label>
            <input
              type="text"
              value={data.recentRaceTime}
              onChange={(e) => onChange({ recentRaceTime: e.target.value })}
              placeholder="Ex: 1:45:00"
              className="w-full px-4 py-3 rounded-xl border border-bark/20 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-bark font-body"
            />
          </div>
        </div>

        {/* Current easy pace */}
        <div>
          <label className="block font-body font-semibold text-bark mb-2 text-sm">
            Ritmo leve atual (min/km)
          </label>
          <input
            type="text"
            value={data.currentPaceEasy}
            onChange={(e) => onChange({ currentPaceEasy: e.target.value })}
            placeholder="Ex: 6:30"
            className="w-full px-4 py-3 rounded-xl border border-bark/20 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-bark font-body"
          />
        </div>
      </div>
    </div>
  );
}
