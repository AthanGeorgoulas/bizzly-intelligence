import { useApp } from '../context/AppContext';
import ScoreGauge from '../components/ScoreGauge';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#2F6BFF', '#5A8AFF', '#16A34A', '#D97706', '#8D847C'];

export default function NetworkingPage() {
  const { activeEvent } = useApp();
  if (!activeEvent) return null;

  const { analysis } = activeEvent;
  const net = analysis.networking;

  const funnelData = [
    { name: 'Requests', value: net.requests_sent },
    { name: 'Accepted', value: net.accepted },
    { name: 'Messages', value: net.messages_sent },
    { name: 'Meetings', value: net.meetings_booked },
    { name: 'Follow-ups', value: net.follow_ups },
  ];

  const contextData = Object.entries(net.by_context).map(([key, val]) => ({
    name: key.replace('_', ' ').replace(/^\w/, c => c.toUpperCase()),
    value: val,
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

  const rates = [
    { label: 'Acceptance rate', value: net.acceptance_rate, desc: 'of connection requests accepted' },
    { label: 'Meeting conversion', value: net.meeting_conversion, desc: 'of accepted connections → meeting' },
    { label: 'Follow-up rate', value: net.follow_up_rate, desc: 'of meetings → follow-up' },
    { label: 'Participation', value: net.networking_participation, desc: 'of attendees actively networked' },
  ];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Networking Analytics</h1>
        <p className="page-subtitle">Connection quality, depth, and conversion metrics</p>
      </div>

      <div className="card" style={{ marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 48, flexWrap: 'wrap' }}>
        <ScoreGauge score={Math.round(net.quality_score)} label="Networking Quality" size={140} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {rates.map(r => (
            <div key={r.label}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                <span style={{ color: 'var(--bz-text-secondary)' }}>{r.label}</span>
                <span style={{ fontWeight: 600 }}>{r.value.toFixed(0)}%</span>
              </div>
              <div className="progress-bar" style={{ width: 280 }}>
                <div
                  className="fill"
                  style={{
                    width: `${Math.min(100, r.value)}%`,
                    background: r.value >= 60 ? 'var(--bz-success)' : r.value >= 30 ? 'var(--bz-warning)' : 'var(--bz-danger)',
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-title">Networking funnel</div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={funnelData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fill: '#A6A09A', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#8D847C', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip {...tooltipStyle} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {funnelData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="card-title">Interaction context</div>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={contextData}
                cx="50%" cy="50%"
                innerRadius={60} outerRadius={90}
                paddingAngle={3}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {contextData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip {...tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card">
        <div className="card-title">Key numbers</div>
        <div className="grid-4" style={{ marginBottom: 0 }}>
          {[
            ['Total interactions', net.total_interactions],
            ['Active networkers', net.active_networkers],
            ['Meetings booked', net.meetings_booked],
            ['Network density', `${net.density.toFixed(1)}%`],
          ].map(([label, val]) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 700 }}>{val}</div>
              <div style={{ fontSize: 12, color: 'var(--bz-text-secondary)', marginTop: 4 }}>{label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
