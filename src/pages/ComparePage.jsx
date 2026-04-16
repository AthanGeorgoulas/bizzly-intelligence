import { useApp } from '../context/AppContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, Cell, LineChart, Line } from 'recharts';

const COLORS = ['#2F6BFF', '#5A8AFF', '#16A34A', '#D97706', '#8D847C', '#DC2626'];

export default function ComparePage() {
  const { events, patterns } = useApp();

  if (events.length < 2) {
    return (
      <div>
        <div className="page-header">
          <h1 className="page-title">Event Comparison</h1>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: 60, color: 'var(--bz-text-muted)' }}>
          Load at least 2 events to compare. Go to Upload and add more JSON files.
        </div>
      </div>
    );
  }

  const tooltipStyle = {
    contentStyle: {
      background: '#FFFFFF',
      border: '1px solid #E5E2DD',
      borderRadius: 8,
      fontSize: 12,
      color: '#0F0F10',
    },
  };

  const scoreComparison = events.map((e, i) => ({
    name: e.parsed.event.name.length > 18
      ? e.parsed.event.name.slice(0, 16) + '…'
      : e.parsed.event.name,
    'Event Score': e.analysis.scores.total,
    Attendance: e.analysis.scores.breakdown.attendance,
    Networking: e.analysis.scores.breakdown.networking,
    Speakers: e.analysis.scores.breakdown.speaker,
    Sponsors: e.analysis.scores.breakdown.sponsor,
  }));

  const trendData = events
    .map(e => ({
      name: e.parsed.event.name.length > 12 ? e.parsed.event.name.slice(0, 10) + '…' : e.parsed.event.name,
      date: e.parsed.event.date,
      score: e.analysis.scores.total,
      networking: Math.round(e.analysis.networking.quality_score),
      attendance: Math.round(e.analysis.attendance.attendance_rate),
    }))
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  const metricsTable = events.map(e => ({
    name: e.parsed.event.name,
    date: e.parsed.event.date,
    attendees: e.analysis.attendance.attended,
    rate: e.analysis.attendance.attendance_rate.toFixed(0),
    connections: e.analysis.networking.accepted,
    meetings: e.analysis.networking.meetings_booked,
    netScore: Math.round(e.analysis.networking.quality_score),
    total: e.analysis.scores.total,
  }));

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Event Comparison</h1>
        <p className="page-subtitle">Side-by-side analysis of {events.length} events</p>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-title">Score comparison</div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={scoreComparison} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
            <XAxis dataKey="name" tick={{ fill: '#A6A09A', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis domain={[0, 100]} tick={{ fill: '#8D847C', fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip {...tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 12, color: '#A6A09A' }} />
            <Bar dataKey="Event Score" fill="#2F6BFF" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Attendance" fill="#5A8AFF" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Networking" fill="#16A34A" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Speakers" fill="#D97706" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Sponsors" fill="#8D847C" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {trendData.length >= 2 && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-title">Performance trend</div>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={trendData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fill: '#A6A09A', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fill: '#8D847C', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip {...tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 12, color: '#A6A09A' }} />
              <Line type="monotone" dataKey="score" name="Overall" stroke="#2F6BFF" strokeWidth={2} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="networking" name="Networking" stroke="#16A34A" strokeWidth={2} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="attendance" name="Attendance" stroke="#5A8AFF" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="card">
        <div className="card-title">Metrics comparison table</div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Event</th>
              <th>Date</th>
              <th>Attendees</th>
              <th>Att. Rate</th>
              <th>Connections</th>
              <th>Meetings</th>
              <th>Net. Score</th>
              <th>Overall</th>
            </tr>
          </thead>
          <tbody>
            {metricsTable.map((m, i) => (
              <tr key={i}>
                <td style={{ fontWeight: 600 }}>{m.name}</td>
                <td style={{ color: 'var(--bz-text-secondary)' }}>{m.date}</td>
                <td>{m.attendees}</td>
                <td>{m.rate}%</td>
                <td>{m.connections}</td>
                <td>{m.meetings}</td>
                <td>
                  <span style={{
                    fontWeight: 700,
                    color: m.netScore >= 60 ? 'var(--bz-success)' : m.netScore >= 35 ? 'var(--bz-warning)' : 'var(--bz-danger)',
                  }}>
                    {m.netScore}
                  </span>
                </td>
                <td>
                  <span style={{
                    fontWeight: 700, fontSize: 16,
                    color: m.total >= 60 ? 'var(--bz-success)' : m.total >= 35 ? 'var(--bz-warning)' : 'var(--bz-danger)',
                  }}>
                    {m.total}
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
