import { useApp } from '../context/AppContext';
import ScoreGauge from '../components/ScoreGauge';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Users, UserCheck, Handshake, CalendarCheck } from 'lucide-react';

const COLORS = ['#2F6BFF', '#5A8AFF', '#16A34A', '#D97706', '#8D847C'];

const MetricCard = ({ icon: Icon, label, value, subtitle, color }) => (
  <div className="card">
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
      <div style={{
        width: 36, height: 36, borderRadius: 8,
        background: color || 'var(--bz-accent-dim)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={18} color="var(--bz-accent)" />
      </div>
      <span className="card-title" style={{ margin: 0 }}>{label}</span>
    </div>
    <div className="card-value">{value}</div>
    {subtitle && <div className="card-subtitle">{subtitle}</div>}
  </div>
);

export default function OverviewPage() {
  const { activeEvent } = useApp();
  if (!activeEvent) return null;

  const { analysis, parsed } = activeEvent;
  const { scores, attendance, networking } = analysis;

  const funnelData = [
    { name: 'Invited', value: attendance.total_invited },
    { name: 'RSVP Yes', value: attendance.rsvp_yes },
    { name: 'Attended', value: attendance.attended },
    { name: 'Networked', value: networking.active_networkers },
    { name: 'Meetings', value: networking.meetings_booked },
  ];

  const breakdownData = [
    { name: 'Attendance', score: scores.breakdown.attendance, weight: '25%' },
    { name: 'Networking', score: scores.breakdown.networking, weight: '35%' },
    { name: 'Speakers', score: scores.breakdown.speaker, weight: '20%' },
    { name: 'Sponsors', score: scores.breakdown.sponsor, weight: '20%' },
  ];

  const sourceData = Object.entries(attendance.by_source).map(([key, val]) => ({
    name: key.charAt(0).toUpperCase() + key.slice(1),
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

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">{parsed.event.name}</h1>
        <p className="page-subtitle">{parsed.event.date} · {parsed.event.location} · {parsed.event.type}</p>
      </div>

      {/* Score gauges */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', flexWrap: 'wrap', gap: 20 }}>
          <ScoreGauge score={scores.total} label="Event Success" size={140} />
          <ScoreGauge score={scores.breakdown.attendance} label="Attendance" size={100} />
          <ScoreGauge score={scores.breakdown.networking} label="Networking" size={100} />
          <ScoreGauge score={scores.breakdown.speaker} label="Speakers" size={100} />
          <ScoreGauge score={scores.breakdown.sponsor} label="Sponsors" size={100} />
        </div>
      </div>

      {/* Key metrics */}
      <div className="grid-4">
        <MetricCard
          icon={Users}
          label="Invited"
          value={attendance.total_invited}
          subtitle={`${attendance.attended} attended (${attendance.attendance_rate.toFixed(0)}%)`}
        />
        <MetricCard
          icon={UserCheck}
          label="RSVP → Attend"
          value={`${attendance.rsvp_to_attend_rate.toFixed(0)}%`}
          subtitle={`${attendance.no_shows} no-shows`}
        />
        <MetricCard
          icon={Handshake}
          label="Connections"
          value={networking.accepted}
          subtitle={`${networking.acceptance_rate.toFixed(0)}% acceptance rate`}
        />
        <MetricCard
          icon={CalendarCheck}
          label="Meetings Booked"
          value={networking.meetings_booked}
          subtitle={`${networking.meeting_conversion.toFixed(0)}% conversion`}
        />
      </div>

      {/* Charts */}
      <div className="grid-2">
        <div className="card">
          <div className="card-title">Conversion funnel</div>
          <ResponsiveContainer width="100%" height={260}>
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
          <div className="card-title">Score breakdown</div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={breakdownData} layout="vertical" margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
              <XAxis type="number" domain={[0, 100]} tick={{ fill: '#8D847C', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis dataKey="name" type="category" tick={{ fill: '#A6A09A', fontSize: 12 }} axisLine={false} tickLine={false} width={80} />
              <Tooltip {...tooltipStyle} formatter={(v) => `${v}/100`} />
              <Bar dataKey="score" radius={[0, 6, 6, 0]}>
                {breakdownData.map((entry, i) => (
                  <Cell key={i} fill={entry.score >= 60 ? '#16A34A' : entry.score >= 35 ? '#D97706' : '#DC2626'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Attendance by source */}
      <div className="grid-2">
        <div className="card">
          <div className="card-title">Attendance by source</div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={sourceData}
                cx="50%" cy="50%"
                innerRadius={50} outerRadius={80}
                paddingAngle={3}
                dataKey="value"
              >
                {sourceData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip {...tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginTop: 8 }}>
            {sourceData.map((d, i) => (
              <span key={d.name} style={{ fontSize: 12, color: 'var(--bz-text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: COLORS[i % COLORS.length] }} />
                {d.name}: {d.value}
              </span>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-title">Quick stats</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 8 }}>
            {[
              ['Total interactions', networking.total_interactions],
              ['Active networkers', networking.active_networkers],
              ['Follow-ups', networking.follow_ups],
              ['Networking density', `${networking.density.toFixed(1)}%`],
              ['Sessions', parsed.sessions.length],
              ['Speakers', parsed.speakers.length],
              ['Sponsors', parsed.sponsors.length],
            ].map(([label, val]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: 'var(--bz-text-secondary)' }}>{label}</span>
                <span style={{ fontWeight: 600 }}>{val}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
