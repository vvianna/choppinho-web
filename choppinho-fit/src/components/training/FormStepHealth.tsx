import type { TrainingFormData } from '../../pages/dashboard/TrainingForm';

interface FormStepProps {
  data: TrainingFormData;
  onChange: (updates: Partial<TrainingFormData>) => void;
}

export default function FormStepHealth({ data, onChange }: FormStepProps) {
  return (
    <div>
      <h2 className="font-display font-bold text-xl text-bark mb-1">Saúde</h2>
      <p className="text-sm text-bark/60 font-body mb-6">Alguma limitação ou condição de saúde?</p>

      <div className="space-y-5">
        {/* Medical disclaimer */}
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-sm text-red-700 font-body leading-relaxed">
            ⚠️ <strong>Aviso médico:</strong> Este plano não substitui orientação médica profissional.
            Consulte um médico antes de iniciar qualquer programa de treinamento intenso, especialmente
            se você tiver condições de saúde pré-existentes.
          </p>
        </div>

        {/* Injuries */}
        <div>
          <label className="block font-body font-semibold text-bark mb-2 text-sm">
            Lesões recentes ou crônicas
          </label>
          <textarea
            rows={3}
            value={data.injuries}
            onChange={(e) => onChange({ injuries: e.target.value })}
            placeholder="Ex: tendinite no joelho, dor no quadril, fratura de estresse (ou deixe em branco se não houver)..."
            className="w-full px-4 py-3 rounded-xl border border-bark/20 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-bark font-body resize-none"
          />
        </div>

        {/* Health conditions */}
        <div>
          <label className="block font-body font-semibold text-bark mb-2 text-sm">
            Condições de saúde
          </label>
          <textarea
            rows={3}
            value={data.healthConditions}
            onChange={(e) => onChange({ healthConditions: e.target.value })}
            placeholder="Ex: hipertensão, diabetes, asma (ou deixe em branco se não houver)..."
            className="w-full px-4 py-3 rounded-xl border border-bark/20 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-bark font-body resize-none"
          />
        </div>

        {/* Sleep hours */}
        <div>
          <label className="block font-body font-semibold text-bark mb-2 text-sm">
            Horas de sono por noite
          </label>
          <div className="flex flex-wrap gap-2">
            {['<6h', '6-7h', '7-8h', '>8h'].map(opt => (
              <button
                key={opt}
                onClick={() => onChange({ sleepHours: opt })}
                className={`px-4 py-2 rounded-xl border font-semibold text-sm transition-all ${
                  data.sleepHours === opt
                    ? 'bg-primary text-white border-primary'
                    : 'bg-white border-bark/20 text-bark hover:border-primary/40'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        {/* Stress level */}
        <div>
          <label className="block font-body font-semibold text-bark mb-2 text-sm">
            Nível de estresse
          </label>
          <div className="flex flex-wrap gap-2">
            {[
              { value: 'low', label: 'Baixo' },
              { value: 'moderate', label: 'Moderado' },
              { value: 'high', label: 'Alto' },
            ].map(({ value, label }) => (
              <button
                key={value}
                onClick={() => onChange({ stressLevel: value })}
                className={`px-4 py-2 rounded-xl border font-semibold text-sm transition-all ${
                  data.stressLevel === value
                    ? 'bg-primary text-white border-primary'
                    : 'bg-white border-bark/20 text-bark hover:border-primary/40'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
