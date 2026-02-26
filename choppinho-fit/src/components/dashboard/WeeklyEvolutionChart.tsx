import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";

interface WeeklyStats {
  week_start: string;
  total_runs: number;
  total_km: number;
  avg_speed: number;
  avg_heartrate?: number;
  total_moving_time_seconds: number;
  total_calories?: number;
}

interface Props {
  data: WeeklyStats[];
}

export default function WeeklyEvolutionChart({ data }: Props) {
  // Formatar dados para o gráfico
  const chartData = data
    .slice(0, 4) // Últimas 4 semanas
    .reverse() // Mais antiga para mais recente
    .map((week, index) => {
      const date = new Date(week.week_start);
      const weekLabel = `S${index + 1}`;

      return {
        name: weekLabel,
        fullDate: date.toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "short",
        }),
        km: Number(week.total_km.toFixed(1)),
        runs: week.total_runs,
        pace:
          week.total_km > 0
            ? ((week.total_moving_time_seconds / 60) / week.total_km).toFixed(2)
            : 0,
      };
    });

  // Se não houver dados
  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-bark/40">
        <div className="text-center">
          <p className="font-body">Nenhum dado disponível</p>
          <p className="text-sm mt-1">Conecte seu Strava para ver a evolução</p>
        </div>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart
        data={chartData}
        margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
      >
        <defs>
          <linearGradient id="colorKm" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#D97706" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#D97706" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
        <XAxis
          dataKey="name"
          stroke="#6B7280"
          style={{ fontSize: "12px", fontFamily: "Space Grotesk" }}
        />
        <YAxis
          stroke="#6B7280"
          style={{ fontSize: "12px", fontFamily: "Space Grotesk" }}
          label={{
            value: "Quilômetros",
            angle: -90,
            position: "insideLeft",
            style: { fontSize: "12px", fill: "#6B7280" },
          }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "rgba(255, 255, 255, 0.95)",
            border: "1px solid #E5E7EB",
            borderRadius: "8px",
            padding: "8px 12px",
            fontFamily: "Space Grotesk",
          }}
          labelStyle={{ fontWeight: "bold", color: "#4A3728" }}
          formatter={(value: any, name?: string) => {
            if (name === "km") return [`${value} km`, "Distância"];
            if (name === "runs") return [`${value} corridas`, "Treinos"];
            if (name === "pace") return [`${value} min/km`, "Pace Médio"];
            return value;
          }}
        />
        <Area
          type="monotone"
          dataKey="km"
          stroke="#D97706"
          strokeWidth={3}
          fill="url(#colorKm)"
          animationDuration={1000}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
