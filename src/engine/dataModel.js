/**
 * Bizzly Event Intelligence — Data Model & Parser
 * Validates and normalizes event JSON into the 6-layer unified model.
 */

const REQUIRED_FIELDS = ['event', 'participants', 'sessions', 'networking'];

export function validateEventJSON(json) {
  const errors = [];
  const warnings = [];

  if (!json || typeof json !== 'object') {
    errors.push('Invalid JSON structure');
    return { valid: false, errors, warnings };
  }

  REQUIRED_FIELDS.forEach(field => {
    if (!json[field]) errors.push(`Missing required field: "${field}"`);
  });

  if (json.participants && Array.isArray(json.participants)) {
    if (json.participants.length === 0) warnings.push('Participants array is empty');
    json.participants.forEach((p, i) => {
      if (!p.user_id) errors.push(`Participant #${i} missing user_id`);
    });
  }

  if (json.sessions && Array.isArray(json.sessions)) {
    json.sessions.forEach((s, i) => {
      if (!s.session_id) errors.push(`Session #${i} missing session_id`);
    });
  }

  if (json.networking && Array.isArray(json.networking)) {
    json.networking.forEach((n, i) => {
      if (!n.from_user_id || !n.to_user_id) {
        errors.push(`Networking interaction #${i} missing from/to user_id`);
      }
    });
  }

  return { valid: errors.length === 0, errors, warnings };
}

export function parseEventData(json) {
  const event = json.event || {};
  const participants = json.participants || [];
  const sessions = json.sessions || [];
  const speakers = json.speakers || [];
  const networking = json.networking || [];
  const sponsors = json.sponsors || [];

  // Layer 1: Profile
  const profiles = participants.map(p => ({
    user_id: p.user_id,
    name: p.name || `User ${p.user_id}`,
    role: p.role || 'attendee',
    industry: p.industry || 'unknown',
    seniority: p.seniority || 'unknown',
    company: p.company || '',
    goals: p.goals || [],
    interests: p.interests || [],
    networking_intent: p.networking_intent || 'medium',
  }));

  // Layer 2: Attendance
  const attendance = participants.map(p => ({
    user_id: p.user_id,
    invited: p.invited !== false,
    rsvp_status: p.rsvp_status || 'unknown',
    ticket_type: p.ticket_type || 'general',
    attended: p.attended !== false,
    check_in_time: p.check_in_time || null,
    entry_source: p.entry_source || 'invite',
  }));

  // Layer 3: Behavior
  const behavior = participants.map(p => ({
    user_id: p.user_id,
    app_opens: p.behavior?.app_opens || 0,
    profile_views: p.behavior?.profile_views || 0,
    session_views: p.behavior?.session_views || 0,
    session_joins: p.behavior?.session_joins || 0,
    time_spent_total: p.behavior?.time_spent_total || 0,
    sponsor_clicks: p.behavior?.sponsor_clicks || 0,
    bookmarks: p.behavior?.bookmarks || 0,
  }));

  // Layer 4: Sessions & Speakers
  const sessionData = sessions.map(s => ({
    session_id: s.session_id,
    title: s.title || 'Untitled Session',
    speaker_id: s.speaker_id,
    room: s.room || '',
    capacity: s.capacity || 0,
    attendees_count: s.attendees_count || (s.attendees_ids || []).length,
    attendees_ids: s.attendees_ids || [],
    session_rating: s.session_rating || null,
    tags: s.tags || [],
  }));

  const speakerData = speakers.map(sp => ({
    speaker_id: sp.speaker_id,
    name: sp.name || `Speaker ${sp.speaker_id}`,
    topic: sp.topic || '',
    tags: sp.tags || [],
    company: sp.company || '',
  }));

  // Layer 5: Networking
  const networkingData = networking.map(n => ({
    from_user_id: n.from_user_id,
    to_user_id: n.to_user_id,
    request_sent: n.request_sent !== false,
    accepted: n.accepted || false,
    message_sent: n.message_sent || false,
    meeting_booked: n.meeting_booked || false,
    follow_up: n.follow_up || false,
    timestamp: n.timestamp || null,
    context: n.context || 'random',
  }));

  // Layer 6: Sponsors
  const sponsorData = sponsors.map(sp => ({
    sponsor_id: sp.sponsor_id,
    name: sp.name || `Sponsor ${sp.sponsor_id}`,
    tier: sp.tier || 'standard',
    booth_visits: sp.booth_visits || 0,
    impressions: sp.impressions || 0,
    leads_collected: sp.leads_collected || 0,
    meetings_booked: sp.meetings_booked || 0,
    lead_user_ids: sp.lead_user_ids || [],
    interactions: sp.interactions || [],
  }));

  return {
    event: {
      id: event.id || `evt_${Date.now()}`,
      name: event.name || 'Unnamed Event',
      date: event.date || '',
      location: event.location || '',
      type: event.type || 'conference',
      total_invited: event.total_invited || participants.length,
      description: event.description || '',
    },
    profiles,
    attendance,
    behavior,
    sessions: sessionData,
    speakers: speakerData,
    networking: networkingData,
    sponsors: sponsorData,
  };
}
