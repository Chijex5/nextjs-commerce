/**
 * Server-rendered column chart: one or two series, native tooltips via the
 * title attribute, no client JS. Good for small, static breakdowns.
 */
export function BarChart({
  data,
  series,
  height = 160,
  label,
  tickEvery = 1,
}: {
  data: Array<{ label: string; values: number[] }>;
  series: Array<{ name: string; className: string }>;
  height?: number;
  label: string;
  /** Show an x-axis label every N bars. */
  tickEvery?: number;
}) {
  const max = Math.max(1, ...data.flatMap((d) => d.values));
  return (
    <figure aria-label={label}>
      <div className="flex items-end gap-px" style={{ height }}>
        {data.map((d, i) => (
          <div
            key={i}
            className="group relative flex h-full flex-1 items-end gap-px"
          >
            {d.values.map((v, s) => (
              <div
                key={s}
                className={`flex-1 ${series[s]?.className ?? "bg-fg"} transition-opacity group-hover:opacity-70`}
                style={{
                  height: `${(v / max) * 100}%`,
                  minHeight: v > 0 ? 2 : 0,
                }}
                title={`${d.label}: ${v} ${series[s]?.name.toLowerCase() ?? ""}`}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-px border-t border-line pt-1.5">
        {data.map((d, i) => (
          <span
            key={i}
            className="min-w-0 flex-1 overflow-visible whitespace-nowrap font-mono text-[10px] text-fg-3"
          >
            {i % tickEvery === 0 ? d.label : ""}
          </span>
        ))}
      </div>
      <figcaption className="mt-3 flex gap-4 text-xs text-fg-3">
        {series.map((s) => (
          <span key={s.name} className="flex items-center gap-2">
            <span className={`size-2.5 ${s.className}`} aria-hidden />
            {s.name}
          </span>
        ))}
      </figcaption>
    </figure>
  );
}
