import type { TrainingFormData } from '../../pages/dashboard/TrainingForm';
import type { VDOTRow } from '../../lib/vdot';
import { calculateTotalWeeks, calculatePeakVolume } from '../../lib/plan-generator';

interface FormStepSummaryProps {
  data: TrainingFormData;
  onChange: (updates: Partial<TrainingFormData>) => void;
  vdot: VDOTRow | null;
  onGenerate: () => void;
  generating: boolean;
  goToStep: (step: number) => void;
}

interface SummarySectionProps {
  icon: string;
  title: string;
  step: number;
  goToStep: (step: number) => void;
  rows: { label: string; value: string }[];
}

function SummarySection({ icon, title, step, goToStep, rows }: SummarySectionProps) {
  return (
    <div className="bg-bark/5 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="font-body font-semibold text-sm text-bark">
          {icon} {title}
        </span>
        <button
          onClick={() => goToStep(step)}
          className="text-xs text-primary font-semibold font-body hover:underline"
        >
          editar ›
        </button>
      </div>
      <div className="space-y-1.5">
        {rows.map(({ label, value }) => value ? (
          <div key={label} className="flex justify-between items-center">
            <span className="text-xs text-bark/50 font-body">{label}</span>
            <span className="text-xs font-body font-semibold text-bark">{value}</span>
          </div>
        ) : null)}
      </div>
    </div>
  );
}

const GOAL_LABELS: Record<string, string> = {
  finish: '🏁 Completar',
  time: '⏱ Tempo-alvo',
  pr: '🔥 PR',
  compete: '🏆 Competir',
};

const TERRAIN_LABELS: Record<string, string> = {
  road: 'Asfalto',
  trail: 'Trail',
  mixed: 'Misto',
};


const LEVEL_LABELS: Record<string, string> = {
  beginner: 'Iniciante',
  intermediate: 'Intermediário',
  advanced: 'Avançado',
  competitive: 'Competitivo',
};

const PHASE_CONFIG = [
  { key: 'base', label: 'Base', color: 'bg-green-400' },
  { key: 'build', label: 'Construção', color: 'bg-yellow-400' },
  { key: 'specific', label: 'Específico', color: 'bg-red-400' },
  { key: 'taper', label: 'Taper', color: 'bg-purple-400' },
];

export default function FormStepSummary({
  data,
  vdot,
  onGenerate,
  generating,
  goToStep,
}: FormStepSummaryProps) {
  const totalWeeks = calculateTotalWeeks(data.raceDate, data.raceDistance, data.experienceLevel);
  const peakVolume = calculatePeakVolume(data.raceDistance, data.experienceLevel);
  const currentKm = Number(data.weeklyKm) || 20;

  return (
    <div>
      <h2 className="font-display font-bold text-xl text-bark mb-1">Resumo</h2>
      <p className="text-sm text-bark/60 font-body mb-6">Confirme seus dados antes de gerar o plano.</p>

      <div className="space-y-4">
        {/* VDOT Card */}
        {vdot && (
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white font-display font-bold text-lg">{vdot.vdot}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-body font-semibold text-sm text-bark mb-2">VDOT estimado: {vdot.vdot}</p>
                <div className="flex flex-wrap gap-1.5">
                  <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-lg font-semibold">
                    Fácil {vdot.e}/km
                  </span>
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-lg font-semibold">
                    Maratona {vdot.m}/km
                  </span>
                  <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs rounded-lg font-semibold">
                    Tempo {vdot.t}/km
                  </span>
                  <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-lg font-semibold">
                    Intervalo {vdot.i}/km
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Plan Preview */}
        <div className="bg-bark/5 rounded-xl p-4">
          <p className="font-body font-semibold text-sm text-bark mb-3">Prévia do plano</p>

          {/* Phase bar */}
          <div className="flex rounded-lg overflow-hidden h-3 mb-2">
            {PHASE_CONFIG.map(({ key, color }) => {
              const ratios: Record<string, number> = { base: 30, build: 35, specific: 25, taper: 10 };
              return (
                <div
                  key={key}
                  className={`${color}`}
                  style={{ width: `${ratios[key]}%` }}
                />
              );
            })}
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-1 mb-3">
            {PHASE_CONFIG.map(({ key, label, color }) => (
              <div key={key} className="flex items-center gap-1">
                <div className={`w-2 h-2 rounded-full ${color}`} />
                <span className="text-xs text-bark/50 font-body">{label}</span>
              </div>
            ))}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center">
              <p className="font-display font-bold text-lg text-primary">{totalWeeks}</p>
              <p className="text-xs text-bark/50 font-body">semanas</p>
            </div>
            <div className="text-center">
              <p className="font-display font-bold text-lg text-primary">
                {currentKm}→{peakVolume}
              </p>
              <p className="text-xs text-bark/50 font-body">km/semana</p>
            </div>
            <div className="text-center">
              <p className="font-display font-bold text-lg text-primary">{data.daysPerWeek}</p>
              <p className="text-xs text-bark/50 font-body">dias/semana</p>
            </div>
          </div>
        </div>

        {/* Summary sections */}

        {/* Race info — read-only, loaded from race registration */}
        <div className="bg-accent/10 rounded-xl p-4 mb-2">
          <span className="font-body font-semibold text-sm text-bark">🏆 Prova</span>
          <div className="mt-2 space-y-1">
            <div className="flex justify-between">
              <span className="text-xs text-bark/50">Prova</span>
              <span className="text-xs font-semibold text-bark">{data.raceName} — {data.raceDistance.toUpperCase()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-bark/50">Data</span>
              <span className="text-xs font-semibold text-bark">{data.raceDate}</span>
            </div>
            {data.raceCity && (
              <div className="flex justify-between">
                <span className="text-xs text-bark/50">Local</span>
                <span className="text-xs font-semibold text-bark">{data.raceCity}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-xs text-bark/50">Terreno</span>
              <span className="text-xs font-semibold text-bark">{TERRAIN_LABELS[data.raceTerrain] || data.raceTerrain}</span>
            </div>
          </div>
        </div>

        <SummarySection
          icon="👤"
          title="Perfil"
          step={1}
          goToStep={goToStep}
          rows={[
            { label: 'Nome', value: data.runnerName },
            { label: 'Idade', value: data.age ? `${data.age} anos` : '' },
            { label: 'Peso', value: data.weight ? `${data.weight} kg` : '' },
            { label: 'Altura', value: data.height ? `${data.height} cm` : '' },
            { label: 'Lesões', value: data.injuries || '' },
          ]}
        />

        <SummarySection
          icon="📊"
          title="Histórico"
          step={2}
          goToStep={goToStep}
          rows={[
            { label: 'Nível', value: LEVEL_LABELS[data.experienceLevel] || data.experienceLevel },
            { label: 'Km/semana', value: data.weeklyKm ? `${data.weeklyKm} km` : '' },
            { label: 'Pace fácil', value: data.currentPaceEasy ? `${data.currentPaceEasy}/km` : '' },
          ]}
        />

        <SummarySection
          icon="📅"
          title="Rotina"
          step={3}
          goToStep={goToStep}
          rows={[
            { label: 'Dias/semana', value: `${data.daysPerWeek} dias` },
            { label: 'Horário', value: data.preferredTime },
            { label: 'Cross-training', value: data.crossTraining.length > 0 ? data.crossTraining.join(', ') : '' },
          ]}
        />

        <SummarySection
          icon="🎯"
          title="Objetivos"
          step={4}
          goToStep={goToStep}
          rows={[
            { label: 'Objetivo', value: GOAL_LABELS[data.goalType] || data.goalType },
            { label: 'Tempo-alvo', value: data.targetTime },
            { label: 'Motivação', value: data.motivation ? data.motivation.slice(0, 60) + (data.motivation.length > 60 ? '...' : '') : '' },
          ]}
        />

        {/* Generate button */}
        <div className="pt-2">
          <button
            onClick={onGenerate}
            disabled={generating}
            className="w-full py-4 rounded-xl font-bold text-lg bg-gradient-to-r from-primary to-hop text-white shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
          >
            {generating ? '⏳ Gerando seu plano...' : '⚡ Gerar meu plano de treino'}
          </button>
          <p className="text-center text-xs text-bark/50 mt-2">Leva cerca de 30 segundos. Usa IA para personalizar.</p>
        </div>
      </div>
    </div>
  );
}
