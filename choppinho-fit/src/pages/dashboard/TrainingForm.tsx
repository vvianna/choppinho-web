import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle, Activity as ActivityIcon, Zap, Target } from 'lucide-react';
import { getAuthHeaders, clearSession } from '../../lib/auth';
import { analyzeActivities, type StravaAnalysis } from '../../lib/strava-analyzer';
import { estimateVDOT, type VDOTRow } from '../../lib/vdot';
import { generatePlan } from '../../lib/plan-generator';
import { createTrainingPlan } from '../../lib/api';
import type { RaceRegistration, Activity } from '../../lib/types';
import Toast from '../../components/Toast';
import FormStepProfile from '../../components/training/FormStepProfile';
import FormStepHistory from '../../components/training/FormStepHistory';
import FormStepRoutine from '../../components/training/FormStepRoutine';
import FormStepGoals from '../../components/training/FormStepGoals';
import FormStepSummary from '../../components/training/FormStepSummary';

// ─── Form Data Interface ───

export interface TrainingFormData {
  // Step 1: Race
  raceDistance: string;
  raceDistanceCustom: number | '';
  raceName: string;
  raceDate: string;
  raceCity: string;
  raceTerrain: 'road' | 'trail' | 'mixed';
  // Step 2: Profile
  runnerName: string;
  age: number | '';
  gender: string;
  weight: number | '';
  height: number | '';
  // Step 3: History
  experienceLevel: string;
  weeklyKm: number | '';
  longestRun: number | '';
  recentRaceDistance: string;
  recentRaceTime: string;
  currentPaceEasy: string;
  // Step 4: Routine
  daysPerWeek: number;
  maxTimeWeekday: number | '';
  maxTimeWeekend: number | '';
  preferredTime: string;
  crossTraining: string[];
  hasWatch: boolean;
  usesHeartRate: boolean;
  // Step 5: Health
  injuries: string;
  healthConditions: string;
  sleepHours: string;
  stressLevel: string;
  // Step 6: Goals
  goalType: string;
  targetTime: string;
  motivation: string;
  biggestChallenge: string;
}

const DEFAULT_FORM: TrainingFormData = {
  raceDistance: '21k',
  raceDistanceCustom: '',
  raceName: '',
  raceDate: '',
  raceCity: '',
  raceTerrain: 'road',
  runnerName: '',
  age: '',
  gender: '',
  weight: '',
  height: '',
  experienceLevel: 'intermediate',
  weeklyKm: '',
  longestRun: '',
  recentRaceDistance: '',
  recentRaceTime: '',
  currentPaceEasy: '',
  daysPerWeek: 4,
  maxTimeWeekday: '',
  maxTimeWeekend: '',
  preferredTime: 'morning',
  crossTraining: [],
  hasWatch: false,
  usesHeartRate: false,
  injuries: '',
  healthConditions: '',
  sleepHours: '7-8',
  stressLevel: 'moderate',
  goalType: 'finish',
  targetTime: '',
  motivation: '',
  biggestChallenge: '',
};

type ToastType = { message: string; type: 'success' | 'error' | 'info' } | null;

// ─── Component ───

export default function TrainingForm() {
  const navigate = useNavigate();
  const { raceId } = useParams();

  const [currentStep, setCurrentStep] = useState(0); // 0=prep, 1-6=steps
  const [formData, setFormData] = useState<TrainingFormData>(DEFAULT_FORM);
  const [stravaAnalysis, setStravaAnalysis] = useState<StravaAnalysis | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [estimatedVdot, setEstimatedVdot] = useState<VDOTRow | null>(null);
  const [stravaConnected, setStravaConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [toast, setToast] = useState<ToastType>(null);

  useEffect(() => {
    initializeForm();
  }, []);

  const initializeForm = async () => {
    try {
      // 1. Fetch user profile for Strava status
      const profileRes = await fetch('/api/user/profile', { headers: getAuthHeaders() });
      if (profileRes.status === 401) {
        clearSession();
        navigate('/login');
        return;
      }
      let isStravaConnected = false;
      if (profileRes.ok) {
        const profileData = await profileRes.json();
        const profile = profileData.data;
        isStravaConnected = !!profile.strava_connection;
        setStravaConnected(isStravaConnected);
        const user = profile.user;
        setFormData(prev => ({
          ...prev,
          runnerName: user.first_name || '',
          age: user.age || '',
          gender: user.gender || '',
          weight: user.weight || '',
          height: user.height || '',
        }));
      }

      // 2. If raceId, fetch race data
      if (raceId) {
        const racesRes = await fetch('/api/races', { headers: getAuthHeaders() });
        if (racesRes.ok) {
          const racesData = await racesRes.json();
          const race = racesData.data?.races?.find((r: RaceRegistration) => r.id === raceId)
            || racesData.data?.find?.((r: RaceRegistration) => r.id === raceId);
          if (race) {
            setFormData(prev => ({
              ...prev,
              raceName: race.race_name,
              raceDate: race.race_date,
              raceCity: race.location || '',
              raceDistance: mapDistanceToKey(race.distance),
              raceTerrain: (race.race_terrain as 'road' | 'trail' | 'mixed') || 'road',
            }));
          }
        }
      }

      // 3. Fetch activities for Strava analysis
      // Trigger a sync first so we get fresh/complete activity data
      // Note: use local isStravaConnected (React state updates are async within this function)
      if (isStravaConnected) {
        try {
          await fetch('/api/strava/sync', { method: 'POST', headers: getAuthHeaders() });
        } catch (e) {
          console.error('Sync error:', e);
        }
      }
      // Use period=month (dashboard only supports 'week' | 'month'; 'quarter' falls through to 7-day default)
      const activitiesRes = await fetch('/api/activities/list?days=90', { headers: getAuthHeaders() });
      if (activitiesRes.ok) {
        const activitiesData = await activitiesRes.json();
        const activityList: Activity[] = activitiesData.data?.activities || [];
        setActivities(activityList);
        if (activityList.length > 0) {
          const analysis = analyzeActivities(activityList);
          setStravaAnalysis(analysis);

          // Infer preferred training time from activities
          const hours = activityList
            .filter((a: Activity) => a.activity_type === 'Run')
            .map((a: Activity) => new Date(a.start_date).getHours());
          let preferredTime = 'morning';
          if (hours.length > 0) {
            const avgHour = hours.reduce((s: number, h: number) => s + h, 0) / hours.length;
            preferredTime = avgHour < 11 ? 'morning' : avgHour < 15 ? 'afternoon' : 'evening';
          }

          setFormData(prev => ({
            ...prev,
            experienceLevel: analysis.estimatedLevel,
            weeklyKm: analysis.avgWeeklyKm,
            longestRun: analysis.longestRun?.distance_meters
              ? Math.round(analysis.longestRun.distance_meters / 1000 * 10) / 10
              : '',
            daysPerWeek: Math.round(analysis.avgRunsPerWeek) || 4,
            hasWatch: true,
            usesHeartRate: !!analysis.avgHR,
            preferredTime,
          }));
          // Estimate VDOT if races found
          if (analysis.bestRace) {
            const dist = analysis.bestRace.distance_meters;
            const time = analysis.bestRace.moving_time_seconds;
            const distKey = dist < 7000 ? '5k' : dist < 15000 ? '10k' : dist < 25000 ? '21k' : '42k';
            const mins = Math.floor(time / 60);
            const secs = time % 60;
            const timeStr = `${mins}:${secs.toString().padStart(2, '0')}`;
            const vdot = estimateVDOT(distKey, timeStr);
            setEstimatedVdot(vdot);
          }
        }
      }
    } catch (err) {
      console.error('Error initializing form:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (updates: Partial<TrainingFormData>) => {
    setFormData(prev => {
      const next = { ...prev, ...updates };
      // Recalculate VDOT when user fills in race result manually
      if (('recentRaceDistance' in updates || 'recentRaceTime' in updates) && next.recentRaceDistance && next.recentRaceTime) {
        const vdot = estimateVDOT(next.recentRaceDistance, next.recentRaceTime);
        if (vdot) setEstimatedVdot(vdot);
      }
      return next;
    });
  };

  const saveProfileData = async () => {
    try {
      await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: formData.runnerName,
          age: Number(formData.age) || null,
          gender: formData.gender || null,
          weight: Number(formData.weight) || null,
          height: Number(formData.height) || null,
        }),
      });
    } catch (err) {
      console.error('Error saving profile:', err);
    }
  };

  const handleNext = () => {
    if (currentStep === 1) saveProfileData();
    setCurrentStep(prev => prev + 1);
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      // 1. Generate plan algorithmically (instant, local)
      const plan = generatePlan({
        raceDistance: formData.raceDistance,
        raceDate: formData.raceDate,
        experienceLevel: formData.experienceLevel || 'intermediate',
        currentWeeklyKm: Number(formData.weeklyKm) || 20,
        daysPerWeek: formData.daysPerWeek,
        vdot: estimatedVdot,
        crossTraining: formData.crossTraining,
      });

      console.log('Plan generated:', { weeks: plan.weeks.length, totalKm: plan.totalKm, vdot: plan.vdotScore });

      // 2. Try AI enhancement (may fail gracefully)
      let aiInsights = null;
      try {
        const enhanceRes = await fetch('/api/training-plans/enhance', {
          method: 'POST',
          headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
          body: JSON.stringify({
            training_plan: {
              totalWeeks: plan.totalWeeks,
              totalKm: plan.totalKm,
              vdotScore: plan.vdotScore,
              peakVolume: plan.peakVolume,
              paces: plan.paces,
              // Send summary, not all weeks (too much data)
              phases: plan.weeks.reduce((acc: any, w) => {
                if (!acc[w.phase]) acc[w.phase] = { weeks: 0, avgKm: 0, totalKm: 0 };
                acc[w.phase].weeks++;
                acc[w.phase].totalKm += w.targetKm;
                acc[w.phase].avgKm = Math.round(acc[w.phase].totalKm / acc[w.phase].weeks);
                return acc;
              }, {}),
            },
            runner_profile: {
              name: formData.runnerName,
              age: formData.age,
              gender: formData.gender,
              weight: formData.weight,
              height: formData.height,
              experience_level: formData.experienceLevel,
              weekly_km: formData.weeklyKm,
              longest_run: formData.longestRun,
              days_per_week: formData.daysPerWeek,
              race_distance: formData.raceDistance,
              race_name: formData.raceName,
              race_date: formData.raceDate,
              goal_type: formData.goalType,
              target_time: formData.targetTime,
              injuries: formData.injuries,
              vdot_score: estimatedVdot?.vdot || 0,
              easy_pace: estimatedVdot?.e || '',
            },
          }),
        });

        if (enhanceRes.ok) {
          const enhanceData = await enhanceRes.json();
          if (enhanceData.success && enhanceData.data?.ok && enhanceData.data?.insights) {
            aiInsights = enhanceData.data.insights;
            console.log('AI insights received');
          }
        }
      } catch (err) {
        console.warn('AI enhancement failed (continuing without):', err);
      }

      // 3. Save to DB with AI insights if available
      const result = await createTrainingPlan({
        ...formData,
        plan_data: plan,
        ai_insights: aiInsights,
        vdot_score: plan.vdotScore,
        total_weeks: plan.totalWeeks,
        status: 'active',
        race_distance: formData.raceDistance,
        race_name: formData.raceName,
        race_date: formData.raceDate,
        race_city: formData.raceCity,
        race_terrain: formData.raceTerrain,
        runner_name: formData.runnerName,
        age: Number(formData.age) || null,
        gender: formData.gender || null,
        weight: Number(formData.weight) || null,
        height: Number(formData.height) || null,
        experience_level: formData.experienceLevel,
        weekly_km: Number(formData.weeklyKm) || null,
        longest_run: Number(formData.longestRun) || null,
        days_per_week: formData.daysPerWeek,
        goal_type: formData.goalType || null,
        target_time: formData.targetTime || null,
        injuries: formData.injuries || null,
        stress_level: formData.stressLevel || 'moderate',
      });

      console.log('createTrainingPlan result:', result);

      // 4. Navigate to plan view
      const planId = result?.data?.plan?.id || result?.data?.id;
      if (planId) {
        navigate(`/dashboard/treino/plano/${planId}`);
      } else {
        console.warn('No plan ID in response, navigating to list. Result:', result);
        navigate('/dashboard/treino');
      }
    } catch (err) {
      console.error('Error generating plan:', err);
      setToast({ message: 'Erro ao gerar plano. Tente novamente.', type: 'error' });
      setGenerating(false);
    }
  };

  function mapDistanceToKey(km: number): string {
    if (km <= 5) return '5k';
    if (km <= 10) return '10k';
    if (km <= 13) return '13k';
    if (km <= 15) return '15k';
    if (km <= 18) return '18k';
    if (km <= 21.5) return '21k';
    return '42k';
  }

  const STEP_LABELS = ['Preparação', 'Perfil', 'Histórico', 'Rotina', 'Objetivos', 'Resumo'];
  const TOTAL_STEPS = 5;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-cream to-primary/10 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-cream to-primary/10 pb-12">
      <div className="grain-overlay" />

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Header */}
      <div className="bg-white/90 backdrop-blur-sm border-b border-primary/10 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => {
              if (currentStep === 0) {
                navigate('/dashboard/treino');
              } else {
                setCurrentStep(s => s - 1);
              }
            }}
            className="text-bark/60 hover:text-primary transition-colors flex items-center gap-1"
          >
            <ArrowLeft size={20} />
            <span className="text-sm font-body">Voltar</span>
          </button>

          <div className="text-center">
            <h1 className="font-display font-bold text-base text-primary">
              Criar Plano de Treino
            </h1>
            {currentStep > 0 && (
              <p className="text-xs text-bark/50 font-body">
                Passo {currentStep} de {TOTAL_STEPS} · {STEP_LABELS[currentStep]}
              </p>
            )}
          </div>

          <div className="w-16" />
        </div>

        {/* Step progress dots */}
        {currentStep > 0 && (
          <div className="max-w-2xl mx-auto px-4 pb-3">
            <div className="flex items-center gap-1.5 justify-center">
              {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map(step => (
                <div
                  key={step}
                  className={`rounded-full transition-all ${
                    step < currentStep
                      ? 'w-3 h-3 bg-primary'
                      : step === currentStep
                      ? 'w-4 h-4 bg-accent border-2 border-accent/30'
                      : 'w-3 h-3 bg-bark/20'
                  }`}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-8">

        {/* ── Step 0: Prep Screen ── */}
        {currentStep === 0 && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target size={32} className="text-primary" />
              </div>
              <h2 className="font-display font-bold text-2xl text-bark mb-2">
                Vamos criar seu plano!
              </h2>
              <p className="text-bark/60 font-body text-sm">
                Responda algumas perguntas para gerar um plano de treino personalizado para você.
              </p>
            </div>

            {/* Strava status */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-primary/10 space-y-4">
              <h3 className="font-display font-bold text-lg text-bark">Preparação</h3>

              <div className="flex items-start gap-3">
                {stravaConnected ? (
                  <CheckCircle size={20} className="text-primary mt-0.5 flex-shrink-0" />
                ) : (
                  <XCircle size={20} className="text-bark/30 mt-0.5 flex-shrink-0" />
                )}
                <div>
                  <p className={`font-body font-semibold text-sm ${stravaConnected ? 'text-bark' : 'text-bark/50'}`}>
                    Strava conectado
                  </p>
                  <p className="text-xs text-bark/50 font-body">
                    {stravaConnected
                      ? 'Seus dados de treino serão usados para personalizar o plano'
                      : 'Conecte o Strava nas configurações para melhores recomendações'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                {stravaAnalysis ? (
                  <CheckCircle size={20} className="text-primary mt-0.5 flex-shrink-0" />
                ) : (
                  <XCircle size={20} className="text-bark/30 mt-0.5 flex-shrink-0" />
                )}
                <div>
                  <p className={`font-body font-semibold text-sm ${stravaAnalysis ? 'text-bark' : 'text-bark/50'}`}>
                    Atividades analisadas
                  </p>
                  <p className="text-xs text-bark/50 font-body">
                    {stravaAnalysis
                      ? `${stravaAnalysis.totalRuns} corridas dos últimos 90 dias analisadas`
                      : 'Sem dados de atividades para análise'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                {estimatedVdot ? (
                  <CheckCircle size={20} className="text-primary mt-0.5 flex-shrink-0" />
                ) : (
                  <Zap size={20} className="text-accent mt-0.5 flex-shrink-0" />
                )}
                <div>
                  <p className={`font-body font-semibold text-sm ${estimatedVdot ? 'text-bark' : 'text-bark/70'}`}>
                    {estimatedVdot ? 'VDOT estimado' : 'VDOT será calculado'}
                  </p>
                  <p className="text-xs text-bark/50 font-body">
                    {estimatedVdot
                      ? `VDOT ${estimatedVdot.vdot} · Ritmo fácil ${estimatedVdot.e}/km`
                      : 'Informe um resultado de prova no passo 3 para calcular, ou usaremos valores padrão'}
                  </p>
                </div>
              </div>

              {stravaAnalysis && (
                <div className="flex items-start gap-3">
                  <ActivityIcon size={20} className="text-accent mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-body font-semibold text-sm text-bark">
                      Nível detectado: <span className="text-accent capitalize">{stravaAnalysis.estimatedLevel}</span>
                    </p>
                    <p className="text-xs text-bark/50 font-body">
                      {stravaAnalysis.avgWeeklyKm} km/semana em média · {stravaAnalysis.consistencyScore}% consistência
                    </p>
                  </div>
                </div>
              )}
            </div>

            {raceId && (
              <div className="bg-accent/10 border border-accent/20 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Zap size={16} className="text-accent" />
                  <p className="font-body font-semibold text-sm text-bark">Prova pré-selecionada</p>
                </div>
                <p className="text-xs text-bark/60 font-body">
                  Os dados da prova cadastrada já foram carregados para o formulário.
                </p>
              </div>
            )}

            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-5 border border-primary/10">
              <p className="text-sm text-bark/70 font-body">
                O formulário tem <strong>5 etapas</strong> e leva cerca de <strong>5 minutos</strong>.
                Ao final, um plano completo semana a semana será gerado para você.
              </p>
            </div>

            <button
              onClick={() => setCurrentStep(1)}
              className="w-full bg-primary hover:bg-primary-600 text-white px-6 py-4 rounded-xl font-display font-bold text-lg transition-colors shadow-lg shadow-primary/20"
            >
              Começar
            </button>
          </div>
        )}

        {/* ── Steps 1-7: Form Steps ── */}
        {currentStep >= 1 && currentStep <= TOTAL_STEPS && (
          <div className="space-y-6">
            {/* Generating loading overlay */}
            {generating && (
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 border border-primary/10 text-center">
                <div className="text-5xl mb-4">⚡</div>
                <h2 className="font-display font-bold text-xl text-bark mb-2">Gerando seu plano...</h2>
                <p className="text-sm text-bark/60 font-body mb-6">O Coach Choppinho está montando seu treino personalizado</p>
                <div className="w-48 h-2 bg-bark/10 rounded-full mx-auto overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-primary to-accent rounded-full animate-pulse" style={{width: '70%'}} />
                </div>
                <p className="text-xs text-bark/40 mt-4">Isso pode levar até 30 segundos</p>
              </div>
            )}

            {/* Step content */}
            {!generating && (
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-primary/10 min-h-[300px]">
              {currentStep === 1 && (
                <FormStepProfile data={formData} onChange={handleChange} />
              )}
              {currentStep === 2 && (
                <FormStepHistory data={formData} onChange={handleChange} stravaAnalysis={stravaAnalysis} recentActivities={activities} />
              )}
              {currentStep === 3 && (
                <FormStepRoutine data={formData} onChange={handleChange} stravaAnalysis={stravaAnalysis} />
              )}
              {currentStep === 4 && (
                <FormStepGoals data={formData} onChange={handleChange} vdot={estimatedVdot} />
              )}
              {currentStep === 5 && (
                <FormStepSummary
                  data={formData}
                  onChange={handleChange}
                  vdot={estimatedVdot}
                  onGenerate={handleGenerate}
                  generating={generating}
                  goToStep={setCurrentStep}
                />
              )}
            </div>
            )}

            {/* Navigation buttons */}
            {!generating && (
            <div className="flex gap-3">
              <button
                onClick={() => setCurrentStep(s => s - 1)}
                className="flex-1 px-6 py-3 rounded-xl font-body font-semibold text-bark bg-white/90 border border-bark/10 hover:bg-bark/5 transition-colors"
              >
                Voltar
              </button>

              {currentStep < TOTAL_STEPS ? (
                <button
                  onClick={handleNext}
                  className="flex-1 px-6 py-4 rounded-xl font-display font-bold text-white bg-primary hover:bg-primary-600 transition-colors shadow-lg shadow-primary/20"
                >
                  Próximo
                </button>
              ) : (
                <button
                  onClick={handleGenerate}
                  disabled={generating}
                  className="flex-1 px-6 py-4 rounded-xl font-display font-bold text-white bg-accent hover:bg-accent/90 disabled:bg-bark/20 disabled:cursor-not-allowed transition-colors shadow-lg shadow-accent/20"
                >
                  {generating ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Gerando plano...
                    </span>
                  ) : (
                    'Gerar plano'
                  )}
                </button>
              )}
            </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

