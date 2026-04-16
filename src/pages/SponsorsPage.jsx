import { useApp } from '../context/AppContext';
import ScoreGauge from '../components/ScoreGauge';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';

export default function SponsorsPage() {
  const { activeEvent } = useApp();
  if (!activeEvent) return null;

  const sponsors = activeEvent.analysis.sponsors;

  if (sponsors.length === 0) {
    return (
      <div>
        <div className="page-header">
          <h1 className="page-title">Sponsor Performance</h1>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: 60, color: 'var(--bz-text-muted)' }}>
          No sponsor data available for this event.
        </div>
      </div>
    );
  }

  const sorted = [...sponsors].sort((a, b) => b.roi_score - a.roi_score);

  const funnelData = sorted.map(s => ({
    name: s.name.length > 14 ? s.name.slice(0, 12) + '…' : s.name,
    Impressions: s.impressions,
    'Booth Visits': s.booth_visits,
    Leads: s.leads_collected,
    Meetings: s.meetings_booked,
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
        <h1 className="page-title">Sponsor Performance</h1>
        <p className="page-subtitle">ROI metrics, funnel conversion, and lead quality</p>
      </div>

      <div className="card" style={{ marginBottom: 24, display: 'flex', justifyContent: 'center', gap: 32, flexWrap: 'wrap' }}>
        {sorted.map(s => (
          <ScoreGauge key={s.sponsor_id} score={Math.round(s.roi_score)} label={s.name} size={100} />
        ))}
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-title">Sponsor funnel comparison</div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={funnelData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
            <XAxis dataKey="name" tick={{ fill: '#A6A09A', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#8D847C', fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip {...tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 12, color: '#A6A09A' }} />
            <Bar dataKey="Impressions" fill="#2F6BFF" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Booth Visits" fill="#5A8AFF" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Leads" fill="#16A34A" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Meetings" fill="#D97706" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="card">
        <div className="card-title">Detailed metrics</div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Sponsor</th>
              <th>Tier</th>
              <th>Impressions</th>
              <th>Booth Visits</th>
              <th>Leads</th>
              <th>Meetings</th>
              <th>Lead Quality</th>
              <th>ROI Score</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map(s => (
              <tr key={s.sponsor_id}>
                <td style={{ fontWeight: 600 }}>{s.name}</td>
                <td>
                  <span className="badge badge-info">{s.tier}</span>
                </td>
                <td>{s.impressions}</td>
                <td>{s.booth_visits} <span style={{ color: 'var(--bz-text-muted)', fontSize: 11 }}>({s.booth_visit_rate.toFixed(0)}%)</span></td>
                <td>{s.leads_collected} <span style={{ color: 'var(--bz-text-muted)', fontSize: 11 }}>({s.lead_conversion.toFixed(0)}%)</span></td>
                <td>{s.meetings_booked}</td>
                <td>
                  <span className={`badge ${s.lead_quality >= 60 ? 'badge-positive' : s.lead_quality >= 30 ? 'badge-warning' : 'badge-critical'}`}>
                    {s.lead_quality.toFixed(0)}%
                  </span>
                </td>
                <td>
                  <span style={{
                    fontWeight: 700,
                    color: s.roi_score >= 60 ? 'var(--bz-success)' : s.roi_score >= 35 ? 'var(--bz-warning)' : 'var(--bz-danger)',
                  }}>
                    {s.roi_score.toFixed(0)}
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
