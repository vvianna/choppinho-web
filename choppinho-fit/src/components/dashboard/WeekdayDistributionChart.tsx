import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface Activity {
  start_date: string;
}

interface Props {
  activities: Activity[];
}

export default function WeekdayDistributionChart({ activities }: Props) {
  // Contar atividades por dia da semana
  const weekdayCounts = activities.reduce(
    (acc, activity) => {
      const date = new Date(activity.start_date);
      const day = date.getDay(); // 0 = Domingo, 1 = Segunda, etc
      acc[day]++;
      return acc;
    },
    [0, 0, 0, 0, 0, 0, 0] // Dom, Seg, Ter, Qua, Qui, Sex, Sáb
  );

  const chartData = [
    { name: "Dom", day: "Domingo", runs: weekdayCounts[0] },
    { name: "Seg", day: "Segunda", runs: weekdayCounts[1] },
    { name: "Ter", day: "Terça", runs: weekdayCounts[2] },
    { name: "Qua", day: "Quarta", runs: weekdayCounts[3] },
    { name: "Qui", day: "Quinta", runs: weekdayCounts[4] },
    { name: "Sex", day: "Sexta", runs: weekdayCounts[5] },
    { name: "Sáb", day: "Sábado", runs: weekdayCounts[6] },
  ];

  // Cores diferentes para cada dia
  const colors = [
    "#EF4444", // Domingo - Vermelho
    "#3B82F6", // Segunda - Azul
    "#10B981", // Terça - Verde
    "#F59E0B", // Quarta - Amarelo
    "#8B5CF6", // Quinta - Roxo
    "#EC4899", // Sexta - Rosa
    "#06B6D4", // Sábado - Ciano
  ];

  if (activities.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-bark/40">
        <div className="text-center">
          <p className="font-body">Nenhuma atividade registrada</p>
        </div>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart
        data={chartData}
        margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
      >
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
            value: "Treinos",
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
          formatter={(value: any) => [`${value} corridas`, "Total"]}
          labelFormatter={(label) => {
            const item = chartData.find((d) => d.name === label);
            return item?.day || label;
          }}
        />
        <Bar dataKey="runs" radius={[8, 8, 0, 0]} animationDuration={1000}>
          {chartData.map((_, index) => (
            <Cell key={`cell-${index}`} fill={colors[index]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
