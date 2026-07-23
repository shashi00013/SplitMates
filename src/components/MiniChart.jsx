export default function MiniChart({ bars = 7, maxHeight = 28, color = 'var(--accent)' }) {
  const heights = Array.from({ length: bars }, () => 6 + Math.random() * (maxHeight - 6));

  return (
    <div className="mini-chart" style={{ height: maxHeight }}>
      {heights.map((h, i) => (
        <div
          key={i}
          className="mini-chart-bar"
          style={{ height: `${h}px`, background: color }}
        />
      ))}
    </div>
  );
}
