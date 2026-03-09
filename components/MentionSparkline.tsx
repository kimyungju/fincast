const MentionSparkline = ({
  data,
  width = 80,
  height = 24,
  color = "var(--color-orange)",
}: {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
}) => {
  if (data.length < 2) return null;

  const max = Math.max(...data, 1);
  const padding = 2;
  const innerWidth = width - 2 * padding;
  const innerHeight = height - 2 * padding;

  const points = data.map((val, i) => {
    const x = padding + (i / (data.length - 1)) * innerWidth;
    const y = padding + innerHeight - (val / max) * innerHeight;
    return `${x},${y}`;
  });

  const polylinePoints = points.join(" ");

  const fillPath = [
    `M ${padding},${padding + innerHeight}`,
    ...data.map((val, i) => {
      const x = padding + (i / (data.length - 1)) * innerWidth;
      const y = padding + innerHeight - (val / max) * innerHeight;
      return `L ${x},${y}`;
    }),
    `L ${padding + innerWidth},${padding + innerHeight}`,
    "Z",
  ].join(" ");

  const lastX = padding + ((data.length - 1) / (data.length - 1)) * innerWidth;
  const lastY =
    padding + innerHeight - (data[data.length - 1] / max) * innerHeight;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="flex-shrink-0"
    >
      <path d={fillPath} fill={color} opacity={0.15} />
      <polyline
        points={polylinePoints}
        stroke={color}
        strokeWidth={1.5}
        fill="none"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle cx={lastX} cy={lastY} r={2} fill={color} />
    </svg>
  );
};

export default MentionSparkline;
