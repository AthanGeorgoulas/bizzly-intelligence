import { useApp } from '../context/AppContext';
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, ArrowRight } from 'lucide-react';

const severityIcon = {
  positive: <CheckCircle2 size={16} color="var(--bz-success)" />,
  warning: <AlertTriangle size={16} color="var(--bz-warning)" />,
  critical: <TrendingDown size={16} color="var(--bz-danger)" />,
};

export default function InsightsPage() {
  const { activeEvent, patterns } = useApp();
  if (!activeEvent) return null;

  const { insights, recommendations } = activeEvent;

  const grouped = {
    critical: insights.filter(i => i.severity === 'critical'),
    warning: insights.filter(i => i.severity === 'warning'),
    positive: insights.filter(i => i.severity === 'positive'),
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Insights & Recommendations</h1>
        <p className="page-subtitle">AI-generated analysis of event performance</p>
      </div>

      {/* Critical issues first */}
      {grouped.critical.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--bz-danger)', marginBottom: 12 }}>
            Critical Issues
          </h3>
          {grouped.critical.map((ins, i) => (
            <div key={i} className="insight-card critical">
              <div className="insight-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {severityIcon.critical} {ins.title}
              </div>
              <div className="insight-message">{ins.message}</div>
            </div>
          ))}
        </div>
      )}

      {grouped.warning.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--bz-warning)', marginBottom: 12 }}>
            Warnings
          </h3>
          {grouped.warning.map((ins, i) => (
            <div key={i} className="insight-card warning">
              <div className="insight-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {severityIcon.warning} {ins.title}
              </div>
              <div className="insight-message">{ins.message}</div>
            </div>
          ))}
        </div>
      )}

      {grouped.positive.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--bz-success)', marginBottom: 12 }}>
            Positive Signals
          </h3>
          {grouped.positive.map((ins, i) => (
            <div key={i} className="insight-card positive">
              <div className="insight-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {severityIcon.positive} {ins.title}
              </div>
              <div className="insight-message">{ins.message}</div>
            </div>
          ))}
        </div>
      )}

      {/* Recommendations */}
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16, marginTop: 32 }}>Recommendations</h2>
      {recommendations.map((rec, i) => (
        <div key={i} className="rec-card">
          <div className={`rec-priority ${rec.priority}`}>{rec.priority} priority · {rec.area}</div>
          <div className="rec-title">{rec.title}</div>
          <ul className="rec-actions">
            {rec.actions.map((action, j) => (
              <li key={j}>{action}</li>
            ))}
          </ul>
        </div>
      ))}

      {recommendations.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: 40, color: 'var(--bz-text-muted)' }}>
          No recommendations generated — event performance is strong across all dimensions.
        </div>
      )}

      {/* Cross-event patterns */}
      {patterns.length > 0 && (
        <>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16, marginTop: 40 }}>Cross-Event Patterns</h2>
          {patterns.map((p, i) => (
            <div key={i} className="card" style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span className="badge badge-info">{p.type}</span>
                <span style={{ fontWeight: 600, fontSize: 14 }}>{p.title}</span>
              </div>
              <div style={{ fontSize: 13, color: 'var(--bz-text-secondary)', lineHeight: 1.6 }}>
                {p.message}
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
