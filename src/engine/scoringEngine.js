/**
 * Bizzly Event Intelligence — Scoring Engine
 * Computes: Event Success, Networking Quality, Speaker Impact, Sponsor ROI
 */

// Networking interaction weights
const NET_WEIGHTS = {
  request_sent: 1,
  accepted: 3,
  message_sent: 5,
  meeting_booked: 10,
  follow_up: 15,
};

// Event success composite weights
const EVENT_WEIGHTS = {
  attendance: 0.25,
  networking: 0.35,
  speaker: 0.20,
  sponsor: 0.20,
};

function clamp(val, min = 0, max = 100) {
  return Math.max(min, Math.min(max, val));
}

// ─── Attendance Metrics ─────────────────────────────────
export function computeAttendanceMetrics(data) {
  const { attendance, event } = data;
  const totalInvited = event.total_invited || attendance.length;
  const rsvpYes = attendance.filter(a => a.rsvp_status === 'yes').length;
  const rsvpMaybe = attendance.filter(a => a.rsvp_status === 'maybe').length;
  const attended = attendance.filter(a => a.attended).length;
  const noShows = rsvpYes - attended;

  return {
    total_invited: totalInvited,
    rsvp_yes: rsvpYes,
    rsvp_maybe: rsvpMaybe,
    rsvp_no: attendance.filter(a => a.rsvp_status === 'no').length,
    attended,
    no_shows: Math.max(0, noShows),
    invite_to_attend_rate: totalInvited > 0 ? (attended / totalInvited) * 100 : 0,
    rsvp_to_attend_rate: rsvpYes > 0 ? (attended / rsvpYes) * 100 : 0,
    attendance_rate: totalInvited > 0 ? (attended / totalInvited) * 100 : 0,
    by_source: {
      invite: attendance.filter(a => a.entry_source === 'invite' && a.attended).length,
      organic: attendance.filter(a => a.entry_source === 'organic' && a.attended).length,
      referral: attendance.filter(a => a.entry_source === 'referral' && a.attended).length,
    },
    by_ticket: attendance.reduce((acc, a) => {
      if (a.attended) acc[a.ticket_type] = (acc[a.ticket_type] || 0) + 1;
      return acc;
    }, {}),
  };
}

// ─── Networking Metrics ─────────────────────────────────
export function computeNetworkingMetrics(data) {
  const { networking, attendance } = data;
  const attended = attendance.filter(a => a.attended).length;
  const totalInteractions = networking.length;

  const requests = networking.filter(n => n.request_sent).length;
  const accepted = networking.filter(n => n.accepted).length;
  const messages = networking.filter(n => n.message_sent).length;
  const meetings = networking.filter(n => n.meeting_booked).length;
  const followUps = networking.filter(n => n.follow_up).length;

  // Active networkers: users who sent or received at least one interaction
  const activeUsers = new Set();
  networking.forEach(n => {
    activeUsers.add(n.from_user_id);
    if (n.accepted) activeUsers.add(n.to_user_id);
  });

  // Weighted score
  const maxPossiblePerInteraction =
    NET_WEIGHTS.request_sent + NET_WEIGHTS.accepted +
    NET_WEIGHTS.message_sent + NET_WEIGHTS.meeting_booked +
    NET_WEIGHTS.follow_up;

  const totalWeightedScore = networking.reduce((sum, n) => {
    let s = 0;
    if (n.request_sent) s += NET_WEIGHTS.request_sent;
    if (n.accepted) s += NET_WEIGHTS.accepted;
    if (n.message_sent) s += NET_WEIGHTS.message_sent;
    if (n.meeting_booked) s += NET_WEIGHTS.meeting_booked;
    if (n.follow_up) s += NET_WEIGHTS.follow_up;
    return sum + s;
  }, 0);

  const maxPossibleTotal = totalInteractions * maxPossiblePerInteraction;

  // Context breakdown
  const byContext = networking.reduce((acc, n) => {
    acc[n.context] = (acc[n.context] || 0) + 1;
    return acc;
  }, {});

  return {
    total_interactions: totalInteractions,
    requests_sent: requests,
    accepted,
    messages_sent: messages,
    meetings_booked: meetings,
    follow_ups: followUps,
    acceptance_rate: requests > 0 ? (accepted / requests) * 100 : 0,
    meeting_conversion: accepted > 0 ? (meetings / accepted) * 100 : 0,
    follow_up_rate: meetings > 0 ? (followUps / meetings) * 100 : 0,
    active_networkers: activeUsers.size,
    networking_participation: attended > 0 ? (activeUsers.size / attended) * 100 : 0,
    quality_score: clamp(maxPossibleTotal > 0 ? (totalWeightedScore / maxPossibleTotal) * 100 : 0),
    density: attended > 1 ? totalInteractions / (attended * (attended - 1) / 2) * 100 : 0,
    by_context: byContext,
  };
}

// ─── Speaker Metrics ────────────────────────────────────
export function computeSpeakerMetrics(data) {
  const { sessions, speakers, networking } = data;

  return speakers.map(speaker => {
    const speakerSessions = sessions.filter(s => s.speaker_id === speaker.speaker_id);
    const totalCapacity = speakerSessions.reduce((s, sess) => s + sess.capacity, 0);
    const totalAttendees = speakerSessions.reduce((s, sess) => s + sess.attendees_count, 0);
    const allAttendeeIds = speakerSessions.flatMap(s => s.attendees_ids);

    // Networking triggered after this speaker's session
    const networkingAfterSession = networking.filter(n =>
      n.context === 'after_session' &&
      allAttendeeIds.includes(n.from_user_id)
    ).length;

    const fillRate = totalCapacity > 0 ? (totalAttendees / totalCapacity) * 100 : 0;
    const networkingTrigger = networking.length > 0
      ? (networkingAfterSession / networking.length) * 100 : 0;

    const ratings = speakerSessions
      .filter(s => s.session_rating !== null)
      .map(s => s.session_rating);
    const avgRating = ratings.length > 0
      ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null;

    const impactScore = clamp(fillRate * 0.5 + networkingTrigger * 0.5);

    return {
      speaker_id: speaker.speaker_id,
      name: speaker.name,
      topic: speaker.topic,
      tags: speaker.tags,
      sessions_count: speakerSessions.length,
      total_attendees: totalAttendees,
      total_capacity: totalCapacity,
      fill_rate: fillRate,
      networking_triggered: networkingAfterSession,
      networking_trigger_rate: networkingTrigger,
      avg_rating: avgRating,
      impact_score: impactScore,
    };
  });
}

// ─── Sponsor Metrics ────────────────────────────────────
export function computeSponsorMetrics(data) {
  const { sponsors, profiles } = data;

  return sponsors.map(sponsor => {
    // Lead quality: check how many leads match target segments
    const leadProfiles = profiles.filter(p =>
      sponsor.lead_user_ids.includes(p.user_id)
    );

    const relevantLeads = leadProfiles.filter(p =>
      p.role === 'founder' || p.role === 'investor' || p.role === 'corporate'
    ).length;

    const leadQuality = leadProfiles.length > 0
      ? (relevantLeads / leadProfiles.length) * 100 : 0;

    // Funnel conversion
    const impressions = sponsor.impressions || 1;
    const boothVisitRate = (sponsor.booth_visits / impressions) * 100;
    const leadConversion = sponsor.booth_visits > 0
      ? (sponsor.leads_collected / sponsor.booth_visits) * 100 : 0;
    const meetingConversion = sponsor.leads_collected > 0
      ? (sponsor.meetings_booked / sponsor.leads_collected) * 100 : 0;

    // ROI score: weighted funnel progression
    const roiScore = clamp(
      boothVisitRate * 0.2 +
      leadConversion * 0.3 +
      meetingConversion * 0.3 +
      leadQuality * 0.2
    );

    return {
      sponsor_id: sponsor.sponsor_id,
      name: sponsor.name,
      tier: sponsor.tier,
      impressions: sponsor.impressions,
      booth_visits: sponsor.booth_visits,
      leads_collected: sponsor.leads_collected,
      meetings_booked: sponsor.meetings_booked,
      booth_visit_rate: boothVisitRate,
      lead_conversion: leadConversion,
      meeting_conversion: meetingConversion,
      lead_quality: leadQuality,
      roi_score: roiScore,
    };
  });
}

// ─── Event Success Score ────────────────────────────────
export function computeEventSuccessScore(attendanceMetrics, networkingMetrics, speakerMetrics, sponsorMetrics) {
  const attendanceScore = clamp(attendanceMetrics.attendance_rate);
  const networkingScore = networkingMetrics.quality_score;

  const avgSpeakerImpact = speakerMetrics.length > 0
    ? speakerMetrics.reduce((s, sp) => s + sp.impact_score, 0) / speakerMetrics.length : 0;

  const avgSponsorROI = sponsorMetrics.length > 0
    ? sponsorMetrics.reduce((s, sp) => s + sp.roi_score, 0) / sponsorMetrics.length : 0;

  const composite = clamp(
    EVENT_WEIGHTS.attendance * attendanceScore +
    EVENT_WEIGHTS.networking * networkingScore +
    EVENT_WEIGHTS.speaker * avgSpeakerImpact +
    EVENT_WEIGHTS.sponsor * avgSponsorROI
  );

  return {
    total: Math.round(composite),
    breakdown: {
      attendance: Math.round(attendanceScore),
      networking: Math.round(networkingScore),
      speaker: Math.round(avgSpeakerImpact),
      sponsor: Math.round(avgSponsorROI),
    },
    weights: EVENT_WEIGHTS,
  };
}

// ─── Full Analysis ──────────────────────────────────────
export function analyzeEvent(parsedData) {
  const attendanceMetrics = computeAttendanceMetrics(parsedData);
  const networkingMetrics = computeNetworkingMetrics(parsedData);
  const speakerMetrics = computeSpeakerMetrics(parsedData);
  const sponsorMetrics = computeSponsorMetrics(parsedData);
  const eventScore = computeEventSuccessScore(
    attendanceMetrics, networkingMetrics, speakerMetrics, sponsorMetrics
  );

  return {
    event: parsedData.event,
    scores: eventScore,
    attendance: attendanceMetrics,
    networking: networkingMetrics,
    speakers: speakerMetrics,
    sponsors: sponsorMetrics,
  };
}
