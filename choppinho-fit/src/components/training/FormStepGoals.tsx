import type { TrainingFormData } from '../../pages/dashboard/TrainingForm';
import type { VDOTRow } from '../../lib/vdot';

interface FormStepGoalsProps {
  data: TrainingFormData;
  onChange: (updates: Partial<TrainingFormData>) => void;
  vdot?: VDOTRow | null;
}

const GOAL_OPTIONS = [
  { value: 'finish', label: '🏁 Completar' },
  { value: 'time', label: '⏱ Tempo-alvo' },
  { value: 'pr', label: '🔥 PR' },
  { value: 'compete', label: '🏆 Competir' },
];

export default function FormStepGoals({ data, onChange, vdot }: FormStepGoalsProps) {
  const showTargetTime = data.goalType === 'time' || data.goalType === 'pr';

  return (
    <div>
      <h2 className="font-display font-bold text-xl text-bark mb-1">Objetivos</h2>
      <p className="text-sm text-bark/60 font-body mb-6">O que você quer alcançar?</p>

      <div className="space-y-5">
        {/* Goal type chips */}
        <div>
          <label className="block font-body font-semibold text-bark mb-2 text-sm">
            Objetivo principal
          </label>
          <div className="flex flex-wrap gap-2">
            {GOAL_OPTIONS.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => onChange({ goalType: value })}
                className={`px-4 py-2 rounded-xl border font-semibold text-sm transition-all ${
                  data.goalType === value
                    ? 'bg-primary text-white border-primary'
                    : 'bg-white border-bark/20 text-bark hover:border-primary/40'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Target time (only for 'time' or 'pr') */}
        {showTargetTime && (
          <div>
            <label className="block font-body font-semibold text-bark mb-2 text-sm">
              Tempo-alvo
            </label>
            <input
              type="text"
              value={data.targetTime}
              onChange={(e) => onChange({ targetTime: e.target.value })}
              placeholder="Ex: 1:55:00"
              className="w-full px-4 py-3 rounded-xl border border-bark/20 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-bark font-body"
            />
            {vdot && (
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="text-xs text-bark/50 font-body self-center">Referência VDOT {vdot.vdot}:</span>
                <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-lg font-semibold">
                  21k: {vdot['21k']} min
                </span>
                <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-lg font-semibold">
                  42k: {vdot['42k']} min
                </span>
              </div>
            )}
          </div>
        )}

        {/* Motivation */}
        <div>
          <label className="block font-body font-semibold text-bark mb-2 text-sm">
            Motivação
          </label>
          <textarea
            rows={3}
            value={data.motivation}
            onChange={(e) => onChange({ motivation: e.target.value })}
            placeholder="Por que você quer completar essa prova? O que te motiva a treinar?"
            className="w-full px-4 py-3 rounded-xl border border-bark/20 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-bark font-body resize-none"
          />
        </div>

        {/* Biggest challenge */}
        <div>
          <label className="block font-body font-semibold text-bark mb-2 text-sm">
            Maior desafio
          </label>
          <textarea
            rows={3}
            value={data.biggestChallenge}
            onChange={(e) => onChange({ biggestChallenge: e.target.value })}
            placeholder="Qual é o maior obstáculo que você enfrenta no treinamento? (tempo, fadiga, motivação...)"
            className="w-full px-4 py-3 rounded-xl border border-bark/20 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-bark font-body resize-none"
          />
        </div>
      </div>
    </div>
  );
}
