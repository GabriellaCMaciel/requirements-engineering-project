'use client';

/* Gráficos da visão geral (carregados só no navegador) */
import { Bar, BarChart, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export interface ChartDatum { name: string; value: number; color: string }

export function ProfessionalBarChart({ data }: { data: ChartDatum[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
        <XAxis dataKey="name" tickLine={false} tick={{ fontSize: 10 }} interval={0} />
        <YAxis allowDecimals={false} tickLine={false} tick={{ fontSize: 10 }} />
        <Tooltip contentStyle={{ fontSize: 11 }} />
        <Bar dataKey="value" name="Agendamentos" radius={[6, 6, 0, 0]}>
          {data.map((d) => <Cell key={d.name} fill={d.color} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function StatusPieChart({ data }: { data: ChartDatum[] }) {
  const filtered = data.filter((d) => d.value > 0);
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Legend verticalAlign="top" wrapperStyle={{ fontSize: 11 }} />
        <Tooltip contentStyle={{ fontSize: 11 }} />
        <Pie data={filtered} dataKey="value" nameKey="name" innerRadius="45%" outerRadius="75%" paddingAngle={2}>
          {filtered.map((d) => <Cell key={d.name} fill={d.color} />)}
        </Pie>
      </PieChart>
    </ResponsiveContainer>
  );
}
