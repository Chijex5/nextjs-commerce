/**
 * Tiny trend line for metric tiles. Pure SVG, rendered on the server: no
 * chart library, no hydration. Current period is a solid line, the
 * comparison period a dashed grey one behind it.
 */
export function Sparkline({
  values,
  previous,
  height = 40,
  label,
}: {
  values: number[];
  previous?: number[];
  height?: number;
  label: string;
}) {
  const width = 240;
  const clean = values.map((v) => (Number.isFinite(v) ? v : null));
  const prev = (previous ?? []).map((v) => (Number.isFinite(v) ? v : 0));
  const max = Math.max(1, ...clean.map((v) => v ?? 0), ...prev);
  const points = Math.max(clean.length, prev.length, 2);
  const x = (i: number) => (i / (points - 1)) * width;
  const y = (v: number) => height - 2 - (v / max) * (height - 4);

  const path = (series: Array<number | null>) => {
    let d = "";
    let pen = false;
    series.forEach((v, i) => {
      if (v === null) {
        pen = false;
        return;
      }
      d += `${pen ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`;
      pen = true;
    });
    return d;
  };

  const lastIndex = clean.reduce<number>(
    (acc, v, i) => (v !== null ? i : acc),
    -1,
  );

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className="block h-10 w-full overflow-visible"
      role="img"
      aria-label={label}
    >
      {prev.length ? (
        <path
          d={path(prev)}
          fill="none"
          stroke="var(--brand-muted)"
          strokeWidth={1.25}
          strokeDasharray="3 3"
          vectorEffect="non-scaling-stroke"
          opacity={0.7}
        />
      ) : null}
      <path
        d={path(clean)}
        fill="none"
        stroke="var(--brand-cream)"
        strokeWidth={1.75}
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
      {lastIndex >= 0 ? (
        <circle
          cx={x(lastIndex)}
          cy={y(clean[lastIndex]!)}
          r={2.5}
          fill="var(--brand-cream)"
        />
      ) : null}
    </svg>
  );
}
