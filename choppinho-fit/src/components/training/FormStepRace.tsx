import type { TrainingFormData } from '../../pages/dashboard/TrainingForm';
import type { StravaAnalysis } from '../../lib/strava-analyzer';

interface FormStepProps {
  data: TrainingFormData;
  onChange: (updates: Partial<TrainingFormData>) => void;
  stravaAnalysis?: StravaAnalysis | null;
}

const DISTANCES = [
  { key: '5k', label: '5K' },
  { key: '10k', label: '10K' },
  { key: '13k', label: '13K' },
  { key: '15k', label: '15K' },
  { key: '18k', label: '18K' },
  { key: '21k', label: 'Meia Maratona' },
  { key: '42k', label: 'Maratona' },
];

export default function FormStepRace({ data, onChange }: FormStepProps) {
  return (
    <div>
      <h2 className="font-display font-bold text-xl text-bark mb-1">A Prova</h2>
      <p className="text-sm text-bark/60 font-body mb-6">Qual é a sua próxima corrida?</p>

      <div className="space-y-5">
        {/* Distance chips */}
        <div>
          <label className="block font-body font-semibold text-bark mb-2 text-sm">
            Distância
          </label>
          <div className="flex flex-wrap gap-2">
            {DISTANCES.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => onChange({ raceDistance: key })}
                className={`px-4 py-2 rounded-xl border font-semibold text-sm transition-all ${
                  data.raceDistance === key
                    ? 'bg-primary text-white border-primary'
                    : 'bg-white border-bark/20 text-bark hover:border-primary/40'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Race name */}
        <div>
          <label className="block font-body font-semibold text-bark mb-2 text-sm">
            Nome da prova
          </label>
          <input
            type="text"
            value={data.raceName}
            onChange={(e) => onChange({ raceName: e.target.value })}
            placeholder="Ex: São Silvestre, Maratona de SP..."
            className="w-full px-4 py-3 rounded-xl border border-bark/20 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-bark font-body"
          />
        </div>

        {/* Race date */}
        <div>
          <label className="block font-body font-semibold text-bark mb-2 text-sm">
            Data da prova{' '}
            <span className="text-red-500 font-bold">*</span>
          </label>
          <input
            type="date"
            value={data.raceDate}
            onChange={(e) => onChange({ raceDate: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border border-bark/20 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-bark font-body"
          />
        </div>

        {/* City */}
        <div>
          <label className="block font-body font-semibold text-bark mb-2 text-sm">
            Cidade
          </label>
          <input
            type="text"
            value={data.raceCity}
            onChange={(e) => onChange({ raceCity: e.target.value })}
            placeholder="Ex: São Paulo, Rio de Janeiro..."
            className="w-full px-4 py-3 rounded-xl border border-bark/20 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-bark font-body"
          />
        </div>

        {/* Terrain */}
        <div>
          <label className="block font-body font-semibold text-bark mb-2 text-sm">
            Terreno
          </label>
          <select
            value={data.raceTerrain}
            onChange={(e) => onChange({ raceTerrain: e.target.value as TrainingFormData['raceTerrain'] })}
            className="w-full px-4 py-3 rounded-xl border border-bark/20 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-bark font-body bg-white"
          >
            <option value="road">Asfalto</option>
            <option value="trail">Trail</option>
            <option value="mixed">Misto</option>
          </select>
        </div>
      </div>
    </div>
  );
}
