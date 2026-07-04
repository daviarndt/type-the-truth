"use client";

/** Heatmap de atividade estilo GitHub — últimas 26 semanas. */

interface HeatmapProps {
  /** epoch ms de cada sessão concluída. */
  timestamps: number[];
  locale: string;
}

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

export function Heatmap({ timestamps }: HeatmapProps) {
  const WEEKS = 26;
  const counts = new Map<string, number>();
  for (const ts of timestamps) {
    const k = dayKey(new Date(ts));
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }

  // Começa no domingo, WEEKS semanas atrás
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(today);
  start.setDate(start.getDate() - (WEEKS * 7 - 1));
  start.setDate(start.getDate() - start.getDay()); // alinha no domingo

  const weeks: { key: string; level: number; date: Date }[][] = [];
  const cursor = new Date(start);
  for (let w = 0; w < WEEKS + 1; w++) {
    const col: { key: string; level: number; date: Date }[] = [];
    for (let d = 0; d < 7; d++) {
      const date = new Date(cursor);
      const n = counts.get(dayKey(date)) ?? 0;
      const future = date > today;
      const level = future ? -1 : n === 0 ? 0 : n === 1 ? 1 : n <= 3 ? 2 : n <= 5 ? 3 : 4;
      col.push({ key: dayKey(date), level, date });
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push(col);
  }

  const colors = [
    "hsl(var(--surface-offset))",
    "hsl(var(--primary) / 0.3)",
    "hsl(var(--primary) / 0.5)",
    "hsl(var(--primary) / 0.75)",
    "hsl(var(--primary))",
  ];

  return (
    <div style={{ display: "flex", gap: 3, overflowX: "auto", paddingBottom: 4 }}>
      {weeks.map((col, wi) => (
        <div key={wi} style={{ display: "grid", gap: 3 }}>
          {col.map((cell) => (
            <div
              key={cell.key}
              title={cell.date.toLocaleDateString()}
              style={{
                width: 11,
                height: 11,
                borderRadius: 3,
                background: cell.level < 0 ? "transparent" : colors[cell.level],
                border: cell.level === 0 ? "1px solid hsl(var(--border) / 0.4)" : "none",
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
