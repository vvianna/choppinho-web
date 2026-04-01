import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react';
import { getTrainingPlan } from '../../lib/api';
import type { TrainingPlan } from '../../lib/types';
import type { GeneratedPlan, PlanWeek, SessionType } from '../../lib/plan-generator';

// ─── Constants ───

const DAY_NAMES = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

const PHASE_LABELS: Record<string, string> = {
  base: 'Base',
  build: 'Construção',
  specific: 'Específico',
  taper: 'Taper',
};

const EXPERIENCE_LABELS: Record<string, string> = {
  sedentary: 'Sedentário',
  beginner: 'Iniciante',
  intermediate: 'Intermediário',
  advanced: 'Avançado',
  competitive: 'Competitivo',
};

const GOAL_LABELS: Record<string, string> = {
  finish: 'Completar',
  time: 'Bater tempo',
  pr: 'Recorde pessoal',
  compete: 'Competir',
};

const SESSION_TYPE_LABELS: Record<SessionType, string> = {
  easy: 'Fácil',
  tempo: 'Tempo',
  interval: 'Interval',
  longao: 'Longão',
  recovery: 'Recup.',
  fartlek: 'Fartlek',
  racePace: 'Prova',
  rest: 'Descanso',
  cross: 'Cross',
};

const SESSION_TYPE_COLORS: Record<SessionType, string> = {
  easy: 'bg-green-100 text-green-700',
  tempo: 'bg-yellow-100 text-yellow-700',
  interval: 'bg-red-100 text-red-700',
  longao: 'bg-blue-100 text-blue-700',
  recovery: 'bg-gray-100 text-gray-500',
  fartlek: 'bg-pink-100 text-pink-700',
  racePace: 'bg-amber-100 text-amber-700',
  rest: 'bg-gray-50 text-gray-400',
  cross: 'bg-purple-100 text-purple-700',
};

const SESSION_TYPE_DOT_COLORS: Record<SessionType, string> = {
  easy: 'bg-green-400',
  tempo: 'bg-yellow-400',
  interval: 'bg-red-400',
  longao: 'bg-blue-400',
  recovery: 'bg-gray-300',
  fartlek: 'bg-pink-400',
  racePace: 'bg-amber-400',
  rest: 'bg-gray-200',
  cross: 'bg-purple-400',
};

// ─── Helper: extract session title from description ───

function getSessionTitle(type: SessionType, km: number): string {
  switch (type) {
    case 'easy': return `Corrida leve ${km}km`;
    case 'tempo': return `Corrida Tempo ${km}km`;
    case 'interval': return `Treino Intervalado ${km}km`;
    case 'longao': return `Longão ${km}km`;
    case 'recovery': return `Recuperação ${km}km`;
    case 'fartlek': return `Fartlek ${km}km`;
    case 'racePace': return `Pace de Prova ${km}km`;
    case 'rest': return 'Descanso';
    case 'cross': return 'Cross-training';
    default: return `Sessão ${km}km`;
  }
}

// ─── WeekCard Component ───

interface WeekCardProps {
  week: PlanWeek;
  isOpen: boolean;
  onToggle: () => void;
}

function WeekCard({ week, isOpen, onToggle }: WeekCardProps) {
  const runningSessions = week.sessions.filter(s => s.type !== 'rest');

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-xl border border-primary/10 mb-2 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-3">
          <span className="font-display font-bold text-sm bg-primary/10 text-primary w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0">
            S{week.weekNum}
          </span>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-sm">
                {PHASE_LABELS[week.phase] ?? week.phase} · Semana {week.weekNum}
              </span>
              {week.isRecovery && (
                <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded font-bold">
                  RECUPERAÇÃO
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="flex gap-1">
            {runningSessions.map((s, i) => (
              <span
                key={i}
                className={`w-2 h-2 rounded-full ${SESSION_TYPE_DOT_COLORS[s.type] ?? 'bg-gray-300'}`}
                title={SESSION_TYPE_LABELS[s.type]}
              />
            ))}
          </div>
          <span className="font-display font-bold text-primary text-sm">{week.targetKm}km</span>
          {isOpen ? (
            <ChevronUp size={16} className="text-bark/40" />
          ) : (
            <ChevronDown size={16} className="text-bark/40" />
          )}
        </div>
      </button>

      {isOpen && (
        <div className="px-4 pb-3 border-t border-bark/5">
          {week.sessions.map((session, i) => (
            <div
              key={i}
              className="flex items-start gap-3 py-3 border-b border-bark/5 last:border-0"
            >
              <span className="text-xs font-bold text-bark/50 uppercase w-8 pt-0.5 flex-shrink-0">
                {DAY_NAMES[session.day]}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded flex-shrink-0 ${SESSION_TYPE_COLORS[session.type] ?? 'bg-gray-100 text-gray-600'}`}>
                    {SESSION_TYPE_LABELS[session.type]}
                  </span>
                  <span className="text-sm font-semibold truncate">
                    {getSessionTitle(session.type, session.km)}
                  </span>
                </div>
                <p className="text-xs text-bark/60 mt-0.5 leading-relaxed">
                  {session.description}
                </p>
                {session.pace !== '—' && (
                  <span className="text-xs text-primary font-bold">
                    Pace: {session.pace}
                  </span>
                )}
              </div>
              <span className="font-display font-bold text-primary text-sm flex-shrink-0">
                {session.km > 0 ? `${session.km}km` : '—'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───

export default function PlanView() {
  const navigate = useNavigate();
  const { planId } = useParams<{ planId: string }>();

  const [plan, setPlan] = useState<TrainingPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openWeeks, setOpenWeeks] = useState<Set<number>>(new Set([1]));

  useEffect(() => {
    if (!planId) {
      setError('ID do plano não encontrado.');
      setLoading(false);
      return;
    }
    loadPlan(planId);
  }, [planId]);

  const loadPlan = async (id: string) => {
    try {
      const result = await getTrainingPlan(id);
      if (result?.data) {
        setPlan(result.data);
      } else {
        setError('Plano não encontrado.');
      }
    } catch (err) {
      console.error('Error loading plan:', err);
      setError('Erro ao carregar plano. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const toggleWeek = (weekNum: number) => {
    setOpenWeeks(prev => {
      const next = new Set(prev);
      if (next.has(weekNum)) {
        next.delete(weekNum);
      } else {
        next.add(weekNum);
      }
      return next;
    });
  };

  // ── Loading state ──
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-cream to-primary/10 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  // ── Error state ──
  if (error || !plan) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-cream to-primary/10">
        <div className="grain-overlay" />
        <div className="bg-white/90 backdrop-blur-sm border-b border-primary/10 sticky top-0 z-10">
          <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
            <button
              onClick={() => navigate('/dashboard/treino')}
              className="text-bark/60 hover:text-primary transition-colors flex items-center gap-1"
            >
              <ArrowLeft size={20} />
              <span className="text-sm font-body">Voltar</span>
            </button>
            <h1 className="font-display font-bold text-base text-primary">Plano de Treino</h1>
            <div className="w-16" />
          </div>
        </div>
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <p className="text-bark/60 font-body">{error ?? 'Plano não encontrado.'}</p>
          <button
            onClick={() => navigate('/dashboard/treino')}
            className="mt-4 px-6 py-3 rounded-xl font-display font-bold text-white bg-primary hover:bg-primary-600 transition-colors"
          >
            Voltar aos planos
          </button>
        </div>
      </div>
    );
  }

  const planData = plan.plan_data as GeneratedPlan | null;
  const weeks: PlanWeek[] = planData?.weeks ?? [];
  const paces = planData?.paces;

  // Derived stats
  const minKm = weeks.length > 0 ? Math.min(...weeks.map(w => w.targetKm)) : 0;
  const maxKm = planData?.peakVolume ?? 0;

  const PACE_ZONES = paces
    ? [
        {
          label: 'Fácil',
          name: 'Easy',
          pace: paces.easy,
          desc: 'Ritmo confortável para treinos leves e longões',
          bg: 'bg-green-50 border-green-200',
          text: 'text-green-700',
          badge: 'bg-green-100 text-green-800',
        },
        {
          label: 'Maratona',
          name: 'Marathon',
          pace: paces.marathon,
          desc: 'Pace de prova para maratonas e provas longas',
          bg: 'bg-blue-50 border-blue-200',
          text: 'text-blue-700',
          badge: 'bg-blue-100 text-blue-800',
        },
        {
          label: 'Tempo',
          name: 'Threshold',
          pace: paces.tempo,
          desc: 'Limiar anaeróbico, desconfortável mas sustentável',
          bg: 'bg-yellow-50 border-yellow-200',
          text: 'text-yellow-700',
          badge: 'bg-yellow-100 text-yellow-800',
        },
        {
          label: 'Interval',
          name: 'VO2max',
          pace: paces.interval,
          desc: 'Alta intensidade para treinos intervalados',
          bg: 'bg-red-50 border-red-200',
          text: 'text-red-700',
          badge: 'bg-red-100 text-red-800',
        },
        {
          label: 'Repetição',
          name: 'Repetition',
          pace: paces.repetition,
          desc: 'Sprints curtos e econômicos para velocidade',
          bg: 'bg-pink-50 border-pink-200',
          text: 'text-pink-700',
          badge: 'bg-pink-100 text-pink-800',
        },
      ]
    : [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-cream to-primary/10 pb-12">
      <div className="grain-overlay" />

      {/* Header */}
      <div className="bg-white/90 backdrop-blur-sm border-b border-primary/10 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate('/dashboard/treino')}
            className="text-bark/60 hover:text-primary transition-colors flex items-center gap-1"
          >
            <ArrowLeft size={20} />
            <span className="text-sm font-body">Voltar</span>
          </button>
          <h1 className="font-display font-bold text-base text-primary">Plano de Treino</h1>
          <div className="w-16" />
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">

        {/* ── Hero Banner ── */}
        <div className="bg-gradient-to-br from-primary to-primary-600 rounded-2xl p-6 text-white shadow-lg shadow-primary/20">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="font-display font-bold text-xl leading-tight">
                {plan.race_name || 'Plano de Treino'}
              </h2>
              <p className="text-white/70 text-sm mt-1 font-body">
                {plan.runner_name && <span>{plan.runner_name} · </span>}
                {plan.experience_level && (
                  <span>{EXPERIENCE_LABELS[plan.experience_level] ?? plan.experience_level} · </span>
                )}
                {plan.goal_type && (
                  <span>{GOAL_LABELS[plan.goal_type] ?? plan.goal_type}</span>
                )}
              </p>
            </div>
            {plan.status === 'active' && (
              <span className="bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full border border-white/30 flex-shrink-0">
                Plano ativo
              </span>
            )}
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-4 gap-3 mt-4">
            <div className="text-center">
              <p className="font-display font-bold text-lg leading-none">
                {plan.total_weeks ?? planData?.totalWeeks ?? '—'}
              </p>
              <p className="text-white/60 text-xs mt-1">semanas</p>
            </div>
            <div className="text-center">
              <p className="font-display font-bold text-lg leading-none">
                {plan.vdot_score ?? planData?.vdotScore ?? '—'}
              </p>
              <p className="text-white/60 text-xs mt-1">VDOT</p>
            </div>
            <div className="text-center">
              <p className="font-display font-bold text-base leading-none">
                {minKm}→{maxKm}
              </p>
              <p className="text-white/60 text-xs mt-1">km/sem</p>
            </div>
            <div className="text-center">
              <p className="font-display font-bold text-lg leading-none">
                {plan.days_per_week ?? '—'}
              </p>
              <p className="text-white/60 text-xs mt-1">dias/sem</p>
            </div>
          </div>
        </div>

        {/* ── Coach Choppinho AI Insights ── */}
        {plan.ai_insights && (
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-primary/10 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-lg">🏃</div>
              <div>
                <h3 className="font-display font-bold text-bark text-sm">Coach Choppinho</h3>
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-700">AI</span>
              </div>
            </div>

            {/* Greeting + Analysis */}
            {plan.ai_insights.greeting && (
              <p className="text-sm text-bark/80 font-body mb-3">{plan.ai_insights.greeting}</p>
            )}
            {plan.ai_insights.analysis && (
              <p className="text-sm text-bark/70 font-body mb-4">{plan.ai_insights.analysis}</p>
            )}

            {/* Strengths + Warnings */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              {plan.ai_insights.strengths && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-3">
                  <p className="text-xs font-bold text-green-700 mb-2">💪 Pontos fortes</p>
                  <ul className="space-y-1">
                    {plan.ai_insights.strengths.map((s: string, i: number) => (
                      <li key={i} className="text-xs text-green-800">{s}</li>
                    ))}
                  </ul>
                </div>
              )}
              {plan.ai_insights.warnings && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3">
                  <p className="text-xs font-bold text-yellow-700 mb-2">⚠️ Atenção</p>
                  <ul className="space-y-1">
                    {plan.ai_insights.warnings.map((w: string, i: number) => (
                      <li key={i} className="text-xs text-yellow-800">{w}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Main tip */}
            {plan.ai_insights.main_tip && (
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-3">
                <p className="text-xs font-bold text-primary mb-1">💡 Dica principal</p>
                <p className="text-sm text-bark/80 font-body">{plan.ai_insights.main_tip}</p>
              </div>
            )}

            {/* Nutrition */}
            {plan.ai_insights.nutrition && (
              <div className="mt-4">
                <p className="text-xs font-bold text-bark/60 mb-2">🍎 Nutrição para o longão</p>
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-bark/5 rounded-lg p-2">
                    <p className="text-xs font-bold text-bark">Pré</p>
                    <p className="text-xs text-bark/60">{plan.ai_insights.nutrition.pre}</p>
                  </div>
                  <div className="bg-bark/5 rounded-lg p-2">
                    <p className="text-xs font-bold text-bark">Durante</p>
                    <p className="text-xs text-bark/60">{plan.ai_insights.nutrition.during}</p>
                  </div>
                  <div className="bg-bark/5 rounded-lg p-2">
                    <p className="text-xs font-bold text-bark">Pós</p>
                    <p className="text-xs text-bark/60">{plan.ai_insights.nutrition.post}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Pace Zones Card ── */}
        {PACE_ZONES.length > 0 && (
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-primary/10 p-5">
            <h3 className="font-display font-bold text-base text-bark mb-4">
              Zonas de Pace
            </h3>
            <div className="grid grid-cols-1 gap-2">
              {PACE_ZONES.map(zone => (
                <div
                  key={zone.name}
                  className={`flex items-center justify-between rounded-xl p-3 border ${zone.bg}`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${zone.badge}`}>
                      {zone.label}
                    </span>
                    <div>
                      <p className={`text-xs font-bold ${zone.text}`}>{zone.name}</p>
                      <p className="text-xs text-bark/50 font-body">{zone.desc}</p>
                    </div>
                  </div>
                  <span className={`font-display font-bold text-sm ${zone.text}`}>
                    {zone.pace}/km
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Week Accordion ── */}
        {weeks.length > 0 ? (
          <div>
            <h3 className="font-display font-bold text-base text-bark mb-3">
              Semanas de Treino
            </h3>
            {weeks.map(week => (
              <WeekCard
                key={week.weekNum}
                week={week}
                isOpen={openWeeks.has(week.weekNum)}
                onToggle={() => toggleWeek(week.weekNum)}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-primary/10 p-8 text-center">
            <p className="text-bark/50 font-body text-sm">
              Nenhuma semana de treino encontrada neste plano.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
