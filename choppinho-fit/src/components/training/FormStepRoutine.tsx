import type { TrainingFormData } from '../../pages/dashboard/TrainingForm';
import type { StravaAnalysis } from '../../lib/strava-analyzer';

interface FormStepProps {
  data: TrainingFormData;
  onChange: (updates: Partial<TrainingFormData>) => void;
  stravaAnalysis?: StravaAnalysis | null;
}

const DAYS_OPTIONS = [2, 3, 4, 5, 6];

const PREFERRED_TIME_OPTIONS = [
  { key: 'morning', label: 'Manhã' },
  { key: 'afternoon', label: 'Tarde' },
  { key: 'evening', label: 'Noite' },
  { key: 'flexible', label: 'Flexível' },
];

const CROSS_TRAINING_OPTIONS = [
  { label: 'Musculação', key: 'musculacao' },
  { label: 'Bike', key: 'bike' },
  { label: 'Natação', key: 'natacao' },
  { label: 'Yoga', key: 'yoga' },
  { label: 'Caminhada', key: 'caminhada' },
  { label: 'Nenhum', key: 'nenhum' },
];

export default function FormStepRoutine({ data, onChange }: FormStepProps) {
  const toggleCrossTraining = (key: string) => {
    const selected = data.crossTraining.includes(key);
    let updated: string[];
    if (key === 'nenhum') {
      // Selecting "Nenhum" clears everything else; deselecting clears only nenhum
      updated = selected ? [] : ['nenhum'];
    } else {
      updated = selected
        ? data.crossTraining.filter((x) => x !== key)
        : [...data.crossTraining.filter((x) => x !== 'nenhum'), key];
    }
    onChange({ crossTraining: updated });
  };

  return (
    <div>
      <h2 className="font-display font-bold text-xl text-bark mb-1">Rotina</h2>
      <p className="text-sm text-bark/60 font-body mb-6">Como é sua disponibilidade para treinar?</p>

      <div className="space-y-6">
        {/* Days per week */}
        <div>
          <label className="block font-body font-semibold text-bark mb-2 text-sm">
            Dias por semana
          </label>
          <div className="flex gap-2 flex-wrap">
            {DAYS_OPTIONS.map((day) => (
              <button
                key={day}
                onClick={() => onChange({ daysPerWeek: day })}
                className={`px-4 py-2 rounded-xl border font-semibold text-sm transition-all ${
                  data.daysPerWeek === day
                    ? 'bg-primary text-white border-primary'
                    : 'bg-white border-bark/20 text-bark hover:border-primary/40'
                }`}
              >
                {day}x
              </button>
            ))}
          </div>
        </div>

        {/* Max time weekday + weekend */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block font-body font-semibold text-bark mb-2 text-sm">
              Tempo máximo semana (min)
            </label>
            <input
              type="number"
              min={15}
              max={300}
              step={5}
              value={data.maxTimeWeekday}
              onChange={(e) =>
                onChange({ maxTimeWeekday: e.target.value === '' ? '' : Number(e.target.value) })
              }
              placeholder="Ex: 60"
              className="w-full px-4 py-3 rounded-xl border border-bark/20 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-bark font-body"
            />
          </div>

          <div>
            <label className="block font-body font-semibold text-bark mb-2 text-sm">
              Tempo máximo fim de semana (min)
            </label>
            <input
              type="number"
              min={15}
              max={300}
              step={5}
              value={data.maxTimeWeekend}
              onChange={(e) =>
                onChange({ maxTimeWeekend: e.target.value === '' ? '' : Number(e.target.value) })
              }
              placeholder="Ex: 120"
              className="w-full px-4 py-3 rounded-xl border border-bark/20 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-bark font-body"
            />
          </div>
        </div>

        {/* Preferred time */}
        <div>
          <label className="block font-body font-semibold text-bark mb-2 text-sm">
            Horário preferido
          </label>
          <div className="flex gap-2 flex-wrap">
            {PREFERRED_TIME_OPTIONS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => onChange({ preferredTime: key })}
                className={`px-4 py-2 rounded-xl border font-semibold text-sm transition-all ${
                  data.preferredTime === key
                    ? 'bg-primary text-white border-primary'
                    : 'bg-white border-bark/20 text-bark hover:border-primary/40'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Cross training */}
        <div>
          <label className="block font-body font-semibold text-bark mb-2 text-sm">
            Treino complementar
          </label>
          <div className="flex gap-2 flex-wrap">
            {CROSS_TRAINING_OPTIONS.map(({ key, label }) => {
              const selected = data.crossTraining.includes(key);
              return (
                <button
                  key={key}
                  onClick={() => toggleCrossTraining(key)}
                  className={`px-4 py-2 rounded-xl border font-semibold text-sm transition-all ${
                    selected
                      ? 'bg-primary text-white border-primary'
                      : 'bg-white border-bark/20 text-bark hover:border-primary/40'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Has GPS watch */}
        <div>
          <label className="block font-body font-semibold text-bark mb-2 text-sm">
            Usa relógio GPS?
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => onChange({ hasWatch: true })}
              className={`px-4 py-2 rounded-xl border font-semibold text-sm transition-all ${
                data.hasWatch
                  ? 'bg-primary text-white border-primary'
                  : 'bg-white border-bark/20 text-bark hover:border-primary/40'
              }`}
            >
              Sim
            </button>
            <button
              onClick={() => onChange({ hasWatch: false })}
              className={`px-4 py-2 rounded-xl border font-semibold text-sm transition-all ${
                !data.hasWatch
                  ? 'bg-primary text-white border-primary'
                  : 'bg-white border-bark/20 text-bark hover:border-primary/40'
              }`}
            >
              Não
            </button>
          </div>
        </div>

        {/* Uses heart rate */}
        <div>
          <label className="block font-body font-semibold text-bark mb-2 text-sm">
            Treina por frequência cardíaca?
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => onChange({ usesHeartRate: true })}
              className={`px-4 py-2 rounded-xl border font-semibold text-sm transition-all ${
                data.usesHeartRate
                  ? 'bg-primary text-white border-primary'
                  : 'bg-white border-bark/20 text-bark hover:border-primary/40'
              }`}
            >
              Sim
            </button>
            <button
              onClick={() => onChange({ usesHeartRate: false })}
              className={`px-4 py-2 rounded-xl border font-semibold text-sm transition-all ${
                !data.usesHeartRate
                  ? 'bg-primary text-white border-primary'
                  : 'bg-white border-bark/20 text-bark hover:border-primary/40'
              }`}
            >
              Não
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
