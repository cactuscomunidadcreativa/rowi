import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { EQ_MAX } from '@/domains/eq/lib/eqLevels'; // ✅ Escala 135 global

export type HistoryPoint = { date: string; avg: number };

export default function EQLine({
  data,
  title = 'Histórico (EQ promedio)'
}: {
  data: HistoryPoint[];
  title?: string;
}) {
  return (
    <div className="p-4 rounded-2xl border border-white/10 bg-white/5">
      <h3 className="mb-3 font-semibold">{title}</h3>
      <div style={{ height: 360 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            {/* ✅ Ajustamos escala a 0–135 */}
            <YAxis domain={[0, EQ_MAX]} />
            {/* ✅ Tooltip muestra valor con /135 */}
            <Tooltip
              formatter={(value: number) => `${value} / ${EQ_MAX}`}
              labelFormatter={(label: string) => `Fecha: ${label}`}
            />
            {/* ✅ Mantiene tu estilo actual */}
            <Line
              type="monotone"
              dataKey="avg"
              stroke="#31a2e3"
              strokeWidth={2}
              dot={{ fill: '#7a59c9', strokeWidth: 1 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}