import type { TrainingFormData } from '../../pages/dashboard/TrainingForm';
import type { StravaAnalysis } from '../../lib/strava-analyzer';

interface FormStepProps {
  data: TrainingFormData;
  onChange: (updates: Partial<TrainingFormData>) => void;
  stravaAnalysis?: StravaAnalysis | null;
}

export default function FormStepProfile({ data, onChange }: FormStepProps) {
  return (
    <div>
      <h2 className="font-display font-bold text-xl text-bark mb-1">Perfil</h2>
      <p className="text-sm text-bark/60 font-body mb-6">Nos conte um pouco sobre você.</p>

      <div className="space-y-5">
        {/* Name + Age — 2 column grid */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block font-body font-semibold text-bark mb-2 text-sm flex items-center gap-2">
              Nome{' '}
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-primary/10 text-primary">
                CADASTRO
              </span>
            </label>
            <input
              type="text"
              value={data.runnerName}
              onChange={(e) => onChange({ runnerName: e.target.value })}
              placeholder="Seu nome"
              className="w-full px-4 py-3 rounded-xl border border-bark/20 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-bark font-body"
            />
          </div>

          <div>
            <label className="block font-body font-semibold text-bark mb-2 text-sm">
              Idade
            </label>
            <input
              type="number"
              min={10}
              max={100}
              value={data.age}
              onChange={(e) =>
                onChange({ age: e.target.value === '' ? '' : Number(e.target.value) })
              }
              placeholder="Ex: 35"
              className="w-full px-4 py-3 rounded-xl border border-bark/20 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-bark font-body"
            />
          </div>
        </div>

        {/* Gender + Weight + Height — 3 column grid */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block font-body font-semibold text-bark mb-2 text-sm">
              Gênero
            </label>
            <select
              value={data.gender}
              onChange={(e) => onChange({ gender: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-bark/20 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-bark font-body bg-white"
            >
              <option value="">—</option>
              <option value="male">Masculino</option>
              <option value="female">Feminino</option>
              <option value="other">Outro</option>
            </select>
          </div>

          <div>
            <label className="block font-body font-semibold text-bark mb-2 text-sm">
              Peso (kg)
            </label>
            <input
              type="number"
              min={30}
              max={250}
              step={0.1}
              value={data.weight}
              onChange={(e) =>
                onChange({ weight: e.target.value === '' ? '' : Number(e.target.value) })
              }
              placeholder="Ex: 70"
              className="w-full px-4 py-3 rounded-xl border border-bark/20 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-bark font-body"
            />
          </div>

          <div>
            <label className="block font-body font-semibold text-bark mb-2 text-sm">
              Altura (cm)
            </label>
            <input
              type="number"
              min={100}
              max={250}
              value={data.height}
              onChange={(e) =>
                onChange({ height: e.target.value === '' ? '' : Number(e.target.value) })
              }
              placeholder="Ex: 175"
              className="w-full px-4 py-3 rounded-xl border border-bark/20 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-bark font-body"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
