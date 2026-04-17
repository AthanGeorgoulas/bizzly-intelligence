import { useApp } from '../context/AppContext';
import ScoreGauge from '../components/ScoreGauge';
import { recommendSponsorMatches } from '../engine/sponsorMatching';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useState } from 'react';
import { ChevronDown, ChevronUp, Users } from 'lucide-react';

export default function SponsorsPage() {
  const { activeEvent } = useApp();
  const [expandedSponsor, setExpandedSponsor] = useState(null);

  if (!activeEvent) return null;
  const sponsors = activeEvent.analysis.sponsors;

  if (sponsors.length === 0) {
    return (
      <div>
        <div className="page-header"><h1 className="page-title">Sponsor Performance</h1></div>
        <div className="card" style={{ textAlign: 'center', padding: 60, color: 'var(--bz-text-muted)' }}>No sponsor data available.</div>
      </div>
    );
  }

  const sorted = [...sponsors].sort((a, b) => b.roi_score - a.roi_score);
  const sponsorMatches = recommendSponsorMatches(activeEvent.parsed);

  const funnelData = sorted.map(s => ({
    name: s.name.length > 12 ? s.name.slice(0, 10) + '...' : s.name,
    'Booth Visits': s.booth_visits,
    Impressions: s.impressions,
    Leads: s.leads_collected,
    Meetings: s.meetings_booked,
  }));

  const tooltipStyle = {
    contentStyle: { background: '#FFFFFF', border: '1px solid #E5E2DD', borderRadius: 8, fontSize: 12, color: '#0F0F10' },
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Sponsor Performance</h1>
        <p className="page-subtitle">ROI metrics, funnel conversion, lead quality, and attendee matching</p>
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

      <div className="card" style={{ marginBottom: 24, overflowX: 'auto' }}>
        <div className="card-title">Detailed metrics</div>
        <table className="data-table" style={{ minWidth: 700 }}>
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
                <td><span className="badge badge-info">{s.tier}</span></td>
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
                  <span style={{ fontWeight: 700, color: s.roi_score >= 60 ? 'var(--bz-success)' : s.roi_score >= 35 ? 'var(--bz-warning)' : 'var(--bz-danger)' }}>
                    {s.roi_score.toFixed(0)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card">
        <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Users size={16} /> Sponsor-Attendee matching
        </div>
        <p style={{ fontSize: 13, color: 'var(--bz-text-secondary)', marginBottom: 16 }}>
          Top attendee matches per sponsor based on role, industry, interests, and networking intent.
        </p>

        {sponsorMatches.map((sm, idx) => {
          const isExpanded = expandedSponsor === idx;
          return (
            <div key={sm.sponsor_id} style={{ marginBottom: 12, border: '1px solid var(--bz-border-light)', borderRadius: 'var(--bz-radius-md)', overflow: 'hidden' }}>
              <button
                onClick={() => setExpandedSponsor(isExpanded ? null : idx)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '12px 16px', background: 'var(--bz-bg-secondary)', border: 'none',
                  cursor: 'pointer', fontFamily: 'var(--bz-font)', fontSize: 14,
                  color: 'var(--bz-text-primary)', fontWeight: 600,
                }}
              >
                <span>{sm.sponsor_name} <span style={{ fontWeight: 400, color: 'var(--bz-text-muted)', fontSize: 12 }}>({sm.sponsor_tier})</span></span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--bz-text-secondary)', fontSize: 12 }}>
                  {sm.top_matches.filter(m => m.match_score >= 50).length} strong matches
                  {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </span>
              </button>

              {isExpanded && (
                <div style={{ overflowX: 'auto' }}>
                  <table className="data-table" style={{ minWidth: 600 }}>
                    <thead>
                      <tr>
                        <th>Attendee</th>
                        <th>Role</th>
                        <th>Industry</th>
                        <th>Company</th>
                        <th>Role Fit</th>
                        <th>Industry Fit</th>
                        <th>Interest Fit</th>
                        <th>Match</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sm.top_matches.slice(0, 10).map(match => (
                        <tr key={match.user_id}>
                          <td style={{ fontWeight: 600 }}>{match.name}</td>
                          <td><span className="badge badge-info" style={{ fontSize: 10 }}>{match.role}</span></td>
                          <td style={{ fontSize: 12, color: 'var(--bz-text-secondary)' }}>{match.industry}</td>
                          <td style={{ fontSize: 12, color: 'var(--bz-text-secondary)' }}>{match.company}</td>
                          <td>{match.scores.role_match}</td>
                          <td>{match.scores.industry_match}</td>
                          <td>{match.scores.interest_overlap}</td>
                          <td>
                            <span style={{ fontWeight: 700, fontSize: 15, color: match.match_score >= 60 ? 'var(--bz-success)' : match.match_score >= 40 ? 'var(--bz-warning)' : 'var(--bz-danger)' }}>
                              {match.match_score}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
