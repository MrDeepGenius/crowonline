export function BarChart({
  data,
  label,
  height = 160,
}: {
  data: { label: string; value: number }[];
  label: string;
  height?: number;
}) {
  const max = Math.max(1, ...data.map((item) => item.value));

  return (
    <div>
      <p className="text-[11px] uppercase tracking-wider text-crow-muted">{label}</p>
      <div className="mt-4 flex items-end gap-3" style={{ height }}>
        {data.map((item) => (
          <div key={item.label} className="flex flex-1 flex-col items-center gap-2">
            <div className="flex w-full flex-1 items-end">
              <div
                className="w-full rounded-t-lg bg-gradient-to-t from-crow-violet/40 to-crow-glow/80 transition-all"
                style={{ height: `${Math.max(6, (item.value / max) * 100)}%` }}
                title={`${item.label}: ${item.value}`}
              />
            </div>
            <span className="truncate text-[10px] text-crow-muted">{item.label}</span>
          </div>
        ))}
        {!data.length ? (
          <p className="text-[12.5px] text-crow-muted">Sin datos todavía.</p>
        ) : null}
      </div>
    </div>
  );
}

export function TimelineChart({
  data,
  label,
}: {
  data: { date: string; total: number }[];
  label: string;
}) {
  const max = Math.max(1, ...data.map((item) => item.total));

  return (
    <div>
      <p className="text-[11px] uppercase tracking-wider text-crow-muted">{label}</p>
      <div className="mt-4 flex h-32 items-end gap-[3px]">
        {data.map((item) => (
          <div
            key={item.date}
            className="flex-1 rounded-t bg-gradient-to-t from-crow-violet/30 to-crow-glow/70"
            style={{ height: `${Math.max(4, (item.total / max) * 100)}%` }}
            title={`${item.date}: ${item.total} USDT`}
          />
        ))}
      </div>
      <div className="mt-2 flex justify-between text-[10px] text-crow-muted">
        <span>{data[0]?.date}</span>
        <span>{data[data.length - 1]?.date}</span>
      </div>
    </div>
  );
}