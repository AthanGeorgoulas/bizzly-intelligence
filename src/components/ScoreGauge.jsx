export default function ScoreGauge({ score, label, size = 120, color }) {
  const resolvedColor = color || (score >= 70 ? 'var(--bz-success)' : score >= 40 ? 'var(--bz-warning)' : 'var(--bz-danger)');
  const circumference = 2 * Math.PI * 44;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <svg width={size} height={size} viewBox="0 0 100 100">
        <circle
          cx="50" cy="50" r="44"
          fill="none"
          stroke="var(--bz-border-light)"
          strokeWidth="6"
        />
        <circle
          cx="50" cy="50" r="44"
          fill="none"
          stroke={resolvedColor}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 50 50)"
          style={{ transition: 'stroke-dashoffset 1s ease' }}
        />
        <text
          x="50" y="46" textAnchor="middle"
          dominantBaseline="central"
          fill="var(--bz-text-primary)"
          fontSize="28" fontWeight="700"
          fontFamily="var(--bz-font)"
        >
          {score}
        </text>
        <text
          x="50" y="66" textAnchor="middle"
          fill="var(--bz-text-muted)"
          fontSize="9"
          fontFamily="var(--bz-font)"
        >
          / 100
        </text>
      </svg>
      {label && (
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--bz-text-secondary)', textAlign: 'center' }}>
          {label}
        </span>
      )}
    </div>
  );
}
