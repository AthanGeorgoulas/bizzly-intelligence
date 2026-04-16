import { useApp } from '../context/AppContext';
import ScoreGauge from '../components/ScoreGauge';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function SpeakersPage() {
  const { activeEvent } = useApp();
  if (!activeEvent) return null;

  const speakers = activeEvent.analysis.speakers;

  if (speakers.length === 0) {
    return (
      <div>
        <div className="page-header">
          <h1 className="page-title">Speaker Performance</h1>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: 60, color: 'var(--bz-text-muted)' }}>
          No speaker data available for this event.
        </div>
      </div>
    );
  }

  const sorted = [...speakers].sort((a, b) => b.impact_score - a.impact_score);

  const chartData = sorted.map(s => ({
    name: s.name.length > 16 ? s.name.slice(0, 14) + '…' : s.name,
    impact: Math.round(s.impact_score),
    fill_rate: Math.round(s.fill_rate),
  }));

  const tooltipStyle = {
    contentStyle: {
      background: '#FFFFFF',
      border: '1px solid #E5E2DD',
      borderRadius: 8,
      fontSize: 12,
      color: '#0F0F10',
    },
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Speaker Performance</h1>
        <p className="page-subtitle">Impact scores, fill rates, and networking triggers</p>
      </div>

      <div className="card" style={{ marginBottom: 24, display: 'flex', justifyContent: 'center', gap: 32, flexWrap: 'wrap' }}>
        {sorted.slice(0, 4).map(s => (
          <ScoreGauge key={s.speaker_id} score={Math.round(s.impact_score)} label={s.name} size={100} />
        ))}
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-title">Impact comparison</div>
        <ResponsiveContainer width="100%" height={Math.max(200, sorted.length * 50)}>
          <BarChart data={chartData} layout="vertical" margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
            <XAxis type="number" domain={[0, 100]} tick={{ fill: '#8D847C', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis dataKey="name" type="category" tick={{ fill: '#A6A09A', fontSize: 12 }} axisLine={false} tickLine={false} width={120} />
            <Tooltip {...tooltipStyle} />
            <Bar dataKey="impact" name="Impact score" radius={[0, 6, 6, 0]}>
              {chartData.map((entry, i) => (
                <Cell key={i} fill={entry.impact >= 60 ? '#16A34A' : entry.impact >= 35 ? '#D97706' : '#DC2626'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="card">
        <div className="card-title">Detailed breakdown</div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Speaker</th>
              <th>Topic</th>
              <th>Sessions</th>
              <th>Attendees</th>
              <th>Fill Rate</th>
              <th>Net. Triggered</th>
              <th>Rating</th>
              <th>Impact</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map(s => (
              <tr key={s.speaker_id}>
                <td style={{ fontWeight: 600 }}>{s.name}</td>
                <td style={{ color: 'var(--bz-text-secondary)' }}>{s.topic}</td>
                <td>{s.sessions_count}</td>
                <td>{s.total_attendees}/{s.total_capacity}</td>
                <td>
                  <span className={`badge ${s.fill_rate >= 70 ? 'badge-positive' : s.fill_rate >= 40 ? 'badge-warning' : 'badge-critical'}`}>
                    {s.fill_rate.toFixed(0)}%
                  </span>
                </td>
                <td>{s.networking_triggered}</td>
                <td>{s.avg_rating ? s.avg_rating.toFixed(1) : '—'}</td>
                <td>
                  <span style={{
                    fontWeight: 700,
                    color: s.impact_score >= 60 ? 'var(--bz-success)' : s.impact_score >= 35 ? 'var(--bz-warning)' : 'var(--bz-danger)',
                  }}>
                    {s.impact_score.toFixed(0)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
