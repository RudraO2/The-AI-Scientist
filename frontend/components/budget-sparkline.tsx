export function BudgetSparkline({ values, width = 140, height = 40 }: {
  values: number[];
  width?: number;
  height?: number;
}) {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => b - a);
  const max = Math.max(...sorted, 1);
  const min = Math.min(...sorted);
  const span = max - min || 1;
  const stepX = sorted.length > 1 ? width / (sorted.length - 1) : 0;
  const points = sorted.map((v, i) => {
    const x = i * stepX;
    const y = height - ((v - min) / span) * height;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const pathD = `M ${points.join(" L ")}`;
  const fillD = `${pathD} L ${(width).toFixed(1)},${height} L 0,${height} Z`;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      <defs>
        <linearGradient id="spark-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgb(16 185 129)" stopOpacity="0.35" />
          <stop offset="100%" stopColor="rgb(16 185 129)" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="spark-stroke" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="rgb(52 211 153)" />
          <stop offset="100%" stopColor="rgb(16 185 129)" />
        </linearGradient>
      </defs>
      <path d={fillD} fill="url(#spark-fill)" />
      <polyline
        points={points.join(" ")}
        fill="none"
        stroke="url(#spark-stroke)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
