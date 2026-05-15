type Props = {
  values: number[];
  width?: number;
  height?: number;
  stroke?: string;
  fill?: string;
  smooth?: boolean;
};

export function Sparkline({
  values,
  width = 88,
  height = 28,
  stroke = "currentColor",
  fill,
  smooth = true,
}: Props) {
  if (!values.length) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const stepX = width / (values.length - 1);
  const points = values.map((v, i) => {
    const x = i * stepX;
    const y = height - 2 - ((v - min) / range) * (height - 4);
    return [x, y] as const;
  });

  const path = smooth
    ? points.reduce((acc, [x, y], i) => {
        if (i === 0) return `M ${x.toFixed(1)} ${y.toFixed(1)}`;
        const [px, py] = points[i - 1];
        const cx = (px + x) / 2;
        return `${acc} Q ${cx.toFixed(1)} ${py.toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)}`;
      }, "")
    : `M ${points.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join(" L ")}`;

  const areaPath = fill ? `${path} L ${width} ${height} L 0 ${height} Z` : "";

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="overflow-visible"
    >
      {fill && <path d={areaPath} fill={fill} opacity={0.18} />}
      <path d={path} fill="none" stroke={stroke} strokeWidth={1.25} strokeLinecap="round" strokeLinejoin="round" />
      {/* last point dot */}
      <circle
        cx={points[points.length - 1][0]}
        cy={points[points.length - 1][1]}
        r={1.8}
        fill={stroke}
      />
    </svg>
  );
}
