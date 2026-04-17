import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { recommendSpeakers } from '../engine/speakerMatching';
import { CalendarPlus, X, Sparkles, ChevronDown, ChevronUp, TrendingUp, Users, BarChart3, Lightbulb } from 'lucide-react';

const COMMON_TAGS = ['AI', 'SaaS', 'Fintech', 'Web3', 'Healthtech', 'Sustainability', 'Growth', 'HR', 'DevOps', 'Marketing', 'Sales', 'Product', 'Design', 'Data', 'IoT', 'Cybersecurity', 'Startup', 'Enterprise'];

function generatePredictions(events, upcoming) {
  if (events.length === 0) return null;

  const analyses = events.map(e => e.analysis);
  const upTags = new Set((upcoming.tags || []).map(t => t.toLowerCase()));

  // Find events with overlapping tags
  const relevantEvents = events.filter(e => {
    const eTags = new Set((e.parsed.speakers || []).flatMap(s => (s.tags || []).map(t => t.toLowerCase())));
    return [...upTags].some(t => eTags.has(t));
  });

  const source = relevantEvents.length > 0 ? relevantEvents : events;
  const sourceAnalyses = source.map(e => e.analysis);

  // Estimated attendance
  const avgAttRate = sourceAnalyses.reduce((s, a) => s + a.attendance.attendance_rate, 0) / sourceAnalyses.length;
  const avgNetQuality = sourceAnalyses.reduce((s, a) => s + a.networking.quality_score, 0) / sourceAnalyses.length;
  const avgMeetings = sourceAnalyses.reduce((s, a) => s + a.networking.meetings_booked, 0) / sourceAnalyses.length;
  const avgConnections = sourceAnalyses.reduce((s, a) => s + a.networking.accepted, 0) / sourceAnalyses.length;
  const avgFollowUps = sourceAnalyses.reduce((s, a) => s + a.networking.follow_ups, 0) / sourceAnalyses.length;

  // Best format
  const formatScores = {};
  events.forEach(e => {
    const type = e.parsed.event.type || 'conference';
    if (!formatScores[type]) formatScores[type] = { total: 0, count: 0 };
    formatScores[type].total += e.analysis.scores.total;
    formatScores[type].count++;
  });
  const bestFormat = Object.entries(formatScores)
    .map(([type, d]) => ({ type, avg: d.total / d.count }))
    .sort((a, b) => b.avg - a.avg)[0];

  // Top audience segments
  const industryCounts = {};
  const roleCounts = {};
  source.forEach(e => {
    (e.parsed.profiles || []).forEach(p => {
      const hasInterest = (p.interests || []).some(i => upTags.has(i.toLowerCase()));
      if (hasInterest) {
        industryCounts[p.industry] = (industryCounts[p.industry] || 0) + 1;
        roleCounts[p.role] = (roleCounts[p.role] || 0) + 1;
      }
    });
  });
  const topIndustries = Object.entries(industryCounts).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([k]) => k);
  const topRoles = Object.entries(roleCounts).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k]) => k);

  // Networking recommendation
  const avgParticipation = sourceAnalyses.reduce((s, a) => s + a.networking.networking_participation, 0) / sourceAnalyses.length;
  let netRecommendation = '';
  if (avgParticipation < 50) netRecommendation = 'Add structured networking breaks and icebreaker sessions — past events with these tags had low organic participation.';
  else if (avgParticipation < 70) netRecommendation = 'Consider AI-powered matchmaking to boost connection quality — participation is moderate.';
  else netRecommendation = 'Networking participation is strong for these topics — focus on meeting conversion and follow-up tools.';

  // Sponsor recommendation
  const sponsorFit = [];
  events.forEach(e => {
    (e.parsed.sponsors || []).forEach(sp => {
      const spTags = new Set((sp.tags || []).map(t => t.toLowerCase()));
      const overlap = [...upTags].filter(t => spTags.has(t)).length;
      if (overlap > 0) {
        const existing = sponsorFit.find(s => s.name === sp.name);
        if (existing) { existing.overlap = Math.max(existing.overlap, overlap); existing.count++; }
        else sponsorFit.push({ name: sp.name, tier: sp.tier, overlap, count: 1 });
      }
    });
  });
  sponsorFit.sort((a, b) => b.overlap - a.overlap || b.count - a.count);

  return {
    estimated_attendance_rate: Math.round(avgAttRate),
    estimated_connections: Math.round(avgConnections),
    estimated_meetings: Math.round(avgMeetings),
    estimated_follow_ups: Math.round(avgFollowUps),
    networking_quality: Math.round(avgNetQuality),
    best_format: bestFormat,
    top_industries: topIndustries,
    top_roles: topRoles,
    networking_recommendation: netRecommendation,
    recommended_sponsors: sponsorFit.slice(0, 4),
    based_on: source.length,
  };
}

export default function UpcomingPage() {
  const { upcomingEvents, addUpcomingEvent, removeUpcomingEvent, events } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', date: '', location: '', type: 'conference', tags: [] });
  const [tagInput, setTagInput] = useState('');
  const [expandedMatch, setExpandedMatch] = useState(null);
  const [expandedPredictions, setExpandedPredictions] = useState(null);

  const handleAddTag = (tag) => {
    if (tag && !form.tags.includes(tag)) setForm(f => ({ ...f, tags: [...f.tags, tag] }));
    setTagInput('');
  };

  const handleSubmit = () => {
    if (!form.name.trim()) return;
    addUpcomingEvent({ name: form.name.trim(), date: form.date, location: form.location.trim(), type: form.type, tags: form.tags, target_audience: { interests: form.tags, roles: [] } });
    setForm({ name: '', date: '', location: '', type: 'conference', tags: [] });
    setShowForm(false);
  };

  const getSpeakerRecs = (upcoming) => {
    if (events.length === 0) return [];
    return recommendSpeakers(events.map(e => e.analysis), { name: upcoming.name, tags: upcoming.tags, target_audience: upcoming.target_audience });
  };

  const inputStyle = { width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--bz-border)', background: 'var(--bz-bg-secondary)', color: 'var(--bz-text-primary)', fontSize: 14, fontFamily: 'var(--bz-font)' };

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Upcoming Events</h1>
          <p className="page-subtitle">Plan future events with AI-powered predictions and recommendations</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          <CalendarPlus size={16} /> New Event
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-title">Create upcoming event</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--bz-text-secondary)', display: 'block', marginBottom: 4 }}>Event Name *</label>
              <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. AI Summit Istanbul 2026" style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--bz-text-secondary)', display: 'block', marginBottom: 4 }}>Date</label>
              <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--bz-text-secondary)', display: 'block', marginBottom: 4 }}>Location</label>
              <input type="text" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="e.g. Istanbul, Turkey" style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--bz-text-secondary)', display: 'block', marginBottom: 4 }}>Type</label>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} style={inputStyle}>
                <option value="conference">Conference</option>
                <option value="meetup">Meetup</option>
                <option value="workshop">Workshop</option>
                <option value="summit">Summit</option>
                <option value="networking">Networking Event</option>
              </select>
            </div>
          </div>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--bz-text-secondary)', display: 'block', marginBottom: 6 }}>Topics / Tags</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
            {form.tags.map(tag => (
              <span key={tag} className="badge badge-info" style={{ cursor: 'pointer', gap: 4, display: 'flex', alignItems: 'center' }} onClick={() => setForm(f => ({ ...f, tags: f.tags.filter(t => t !== tag) }))}>
                {tag} <X size={12} />
              </span>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <input type="text" value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddTag(tagInput.trim()); } }} placeholder="Add custom tag..." style={{ ...inputStyle, flex: 1 }} />
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 16 }}>
            {COMMON_TAGS.filter(t => !form.tags.includes(t)).map(tag => (
              <button key={tag} onClick={() => handleAddTag(tag)} style={{ padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 500, border: '1px solid var(--bz-border)', background: 'transparent', color: 'var(--bz-text-muted)', cursor: 'pointer', fontFamily: 'var(--bz-font)' }}>+ {tag}</button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-primary" onClick={handleSubmit}>Create Event</button>
            <button className="btn btn-outline" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </div>
      )}

      {upcomingEvents.length === 0 && !showForm && (
        <div className="card" style={{ textAlign: 'center', padding: 60, color: 'var(--bz-text-muted)' }}>No upcoming events. Create one to get AI-powered predictions.</div>
      )}

      {upcomingEvents.map((upcoming, idx) => {
        const recs = getSpeakerRecs(upcoming);
        const predictions = generatePredictions(events, upcoming);
        const isMatchExpanded = expandedMatch === idx;
        const isPredExpanded = expandedPredictions === idx;

        return (
          <div key={upcoming.id} className="card" style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>{upcoming.name}</div>
                <div style={{ fontSize: 13, color: 'var(--bz-text-secondary)' }}>
                  {upcoming.date && `${upcoming.date} · `}{upcoming.location && `${upcoming.location} · `}{upcoming.type}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
                  {upcoming.tags.map(tag => (<span key={tag} className="badge badge-info">{tag}</span>))}
                </div>
              </div>
              <button onClick={() => removeUpcomingEvent(idx)} style={{ background: 'none', border: 'none', color: 'var(--bz-text-muted)', cursor: 'pointer' }}><X size={18} /></button>
            </div>

            {/* AI Predictions */}
            {predictions && (
              <div style={{ marginTop: 16, borderTop: '1px solid var(--bz-border-light)', paddingTop: 16 }}>
                <button onClick={() => setExpandedPredictions(isPredExpanded ? null : idx)} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', color: 'var(--bz-accent)', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'var(--bz-font)', padding: 0, marginBottom: isPredExpanded ? 12 : 0 }}>
                  <Lightbulb size={14} /> AI predictions & recommendations
                  {isPredExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>

                {isPredExpanded && (
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--bz-text-muted)', marginBottom: 12 }}>Based on {predictions.based_on} past event{predictions.based_on > 1 ? 's' : ''} with similar topics</div>

                    {/* Estimated metrics */}
                    <div className="grid-4" style={{ marginBottom: 16 }}>
                      {[
                        { label: 'Est. attendance', value: `~${predictions.estimated_attendance_rate}%`, icon: <Users size={14} /> },
                        { label: 'Est. connections', value: `~${predictions.estimated_connections}`, icon: <TrendingUp size={14} /> },
                        { label: 'Est. meetings', value: `~${predictions.estimated_meetings}`, icon: <BarChart3 size={14} /> },
                        { label: 'Net. quality', value: `${predictions.networking_quality}/100`, icon: <Sparkles size={14} /> },
                      ].map(m => (
                        <div key={m.label} style={{ background: 'var(--bz-bg-secondary)', borderRadius: 'var(--bz-radius-md)', padding: '12px 14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--bz-text-muted)', marginBottom: 4 }}>{m.icon} {m.label}</div>
                          <div style={{ fontSize: 20, fontWeight: 700 }}>{m.value}</div>
                        </div>
                      ))}
                    </div>

                    {/* Best format */}
                    {predictions.best_format && (
                      <div className="insight-card positive" style={{ marginBottom: 12 }}>
                        <div className="insight-title">Recommended format: {predictions.best_format.type}</div>
                        <div className="insight-message">Events of type "{predictions.best_format.type}" scored {predictions.best_format.avg.toFixed(0)}/100 on average — the highest across your past events.</div>
                      </div>
                    )}

                    {/* Networking recommendation */}
                    <div className="insight-card warning" style={{ marginBottom: 12 }}>
                      <div className="insight-title">Networking strategy</div>
                      <div className="insight-message">{predictions.networking_recommendation}</div>
                    </div>

                    {/* Target audience */}
                    {predictions.top_industries.length > 0 && (
                      <div style={{ marginBottom: 12 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--bz-text-secondary)', marginBottom: 6 }}>Target audience segments</div>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 12, color: 'var(--bz-text-muted)', marginRight: 4 }}>Industries:</span>
                          {predictions.top_industries.map(i => (<span key={i} className="badge badge-info">{i}</span>))}
                        </div>
                        {predictions.top_roles.length > 0 && (
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                            <span style={{ fontSize: 12, color: 'var(--bz-text-muted)', marginRight: 4 }}>Roles:</span>
                            {predictions.top_roles.map(r => (<span key={r} className="badge badge-info">{r}</span>))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Recommended sponsors */}
                    {predictions.recommended_sponsors.length > 0 && (
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--bz-text-secondary)', marginBottom: 6 }}>Recommended sponsors to invite</div>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          {predictions.recommended_sponsors.map(sp => (
                            <div key={sp.name} style={{ background: 'var(--bz-bg-secondary)', borderRadius: 'var(--bz-radius-sm)', padding: '6px 12px', fontSize: 12 }}>
                              <span style={{ fontWeight: 600 }}>{sp.name}</span>
                              <span style={{ color: 'var(--bz-text-muted)', marginLeft: 6 }}>{sp.tier}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Speaker recommendations */}
            {events.length > 0 && recs.length > 0 && (
              <div style={{ marginTop: 12, borderTop: '1px solid var(--bz-border-light)', paddingTop: 12 }}>
                <button onClick={() => setExpandedMatch(isMatchExpanded ? null : idx)} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', color: 'var(--bz-accent)', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'var(--bz-font)', padding: 0 }}>
                  <Sparkles size={14} /> {recs.length} speaker recommendations
                  {isMatchExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
                {isMatchExpanded && (
                  <div style={{ overflowX: 'auto' }}>
                    <table className="data-table" style={{ marginTop: 12, minWidth: 600 }}>
                      <thead><tr><th>Speaker</th><th>Tags</th><th>Events</th><th>Topic Fit</th><th>Performance</th><th>Net. Impact</th><th>Fit Score</th></tr></thead>
                      <tbody>
                        {recs.slice(0, 10).map(rec => (
                          <tr key={rec.speaker_id}>
                            <td style={{ fontWeight: 600 }}>{rec.name}</td>
                            <td><div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>{rec.tags.slice(0, 3).map(t => (<span key={t} className="badge badge-info" style={{ fontSize: 10 }}>{t}</span>))}</div></td>
                            <td>{rec.events_count}</td>
                            <td>{rec.scores.topic_relevance}</td>
                            <td>{rec.scores.past_performance}</td>
                            <td>{rec.scores.networking_impact}</td>
                            <td><span style={{ fontWeight: 700, fontSize: 15, color: rec.fit_score >= 60 ? 'var(--bz-success)' : rec.fit_score >= 35 ? 'var(--bz-warning)' : 'var(--bz-danger)' }}>{rec.fit_score}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {events.length === 0 && (
              <div style={{ marginTop: 12, fontSize: 12, color: 'var(--bz-text-muted)', fontStyle: 'italic' }}>Upload past event data to get AI predictions.</div>
            )}
          </div>
        );
      })}
    </div>
  );
}
