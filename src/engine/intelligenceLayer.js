/**
 * Bizzly Event Intelligence — Intelligence Layer
 * Rule-based insights (single event) + cross-event pattern detection
 */

// ─── Single Event Insights ─────────────────────────────
export function generateInsights(analysis) {
  const insights = [];
  const { scores, attendance, networking, speakers, sponsors } = analysis;

  // Attendance insights
  if (attendance.attendance_rate < 50) {
    insights.push({
      category: 'attendance',
      severity: 'critical',
      title: 'Low attendance rate',
      message: `Only ${attendance.attendance_rate.toFixed(0)}% of invitees attended. Consider improving invite targeting or event positioning.`,
      metric: attendance.attendance_rate,
    });
  } else if (attendance.attendance_rate > 80) {
    insights.push({
      category: 'attendance',
      severity: 'positive',
      title: 'Strong attendance',
      message: `${attendance.attendance_rate.toFixed(0)}% attendance shows strong demand. This event has solid pull.`,
      metric: attendance.attendance_rate,
    });
  }

  if (attendance.no_shows > attendance.rsvp_yes * 0.3) {
    insights.push({
      category: 'attendance',
      severity: 'warning',
      title: 'High no-show rate',
      message: `${attendance.no_shows} no-shows from ${attendance.rsvp_yes} RSVPs. Send reminders 24h and 1h before the event.`,
      metric: (attendance.no_shows / Math.max(1, attendance.rsvp_yes)) * 100,
    });
  }

  // Networking insights
  if (networking.quality_score < 30) {
    insights.push({
      category: 'networking',
      severity: 'critical',
      title: 'Weak networking engagement',
      message: 'Networking quality is low. Add icebreaker sessions, matchmaking features, or structured networking breaks.',
      metric: networking.quality_score,
    });
  }

  if (networking.meeting_conversion < 15) {
    insights.push({
      category: 'networking',
      severity: 'warning',
      title: 'Low meeting conversion',
      message: `Only ${networking.meeting_conversion.toFixed(0)}% of connections led to meetings. Consider adding a meeting booking tool within the app.`,
      metric: networking.meeting_conversion,
    });
  }

  if (networking.follow_up_rate < 20) {
    insights.push({
      category: 'networking',
      severity: 'warning',
      title: 'Poor follow-up rate',
      message: 'Most meetings don\'t lead to follow-ups. Automated follow-up nudges could significantly improve this.',
      metric: networking.follow_up_rate,
    });
  }

  if (networking.networking_participation < 40) {
    insights.push({
      category: 'networking',
      severity: 'warning',
      title: 'Low networking participation',
      message: `Only ${networking.networking_participation.toFixed(0)}% of attendees actively networked. The rest were passive.`,
      metric: networking.networking_participation,
    });
  } else if (networking.networking_participation > 70) {
    insights.push({
      category: 'networking',
      severity: 'positive',
      title: 'High networking participation',
      message: `${networking.networking_participation.toFixed(0)}% of attendees actively networked — this is excellent community engagement.`,
      metric: networking.networking_participation,
    });
  }

  // Speaker insights
  const topSpeaker = speakers.length > 0
    ? speakers.reduce((best, s) => s.impact_score > best.impact_score ? s : best, speakers[0])
    : null;
  const weakSpeaker = speakers.length > 0
    ? speakers.reduce((worst, s) => s.impact_score < worst.impact_score ? s : worst, speakers[0])
    : null;

  if (topSpeaker && topSpeaker.impact_score > 60) {
    insights.push({
      category: 'speakers',
      severity: 'positive',
      title: `Top performer: ${topSpeaker.name}`,
      message: `Impact score ${topSpeaker.impact_score.toFixed(0)}/100. ${topSpeaker.fill_rate.toFixed(0)}% fill rate and triggered ${topSpeaker.networking_triggered} networking interactions.`,
      metric: topSpeaker.impact_score,
    });
  }

  if (weakSpeaker && weakSpeaker.impact_score < 30 && speakers.length > 1) {
    insights.push({
      category: 'speakers',
      severity: 'warning',
      title: `Underperforming: ${weakSpeaker.name}`,
      message: `Impact score ${weakSpeaker.impact_score.toFixed(0)}/100. Low audience pull and minimal networking trigger. Reconsider for future events.`,
      metric: weakSpeaker.impact_score,
    });
  }

  // Sponsor insights
  sponsors.forEach(sp => {
    if (sp.roi_score < 20) {
      insights.push({
        category: 'sponsors',
        severity: 'warning',
        title: `Low ROI: ${sp.name}`,
        message: `Sponsor ROI score ${sp.roi_score.toFixed(0)}/100. Poor funnel conversion. Review booth placement and audience targeting.`,
        metric: sp.roi_score,
      });
    }
    if (sp.lead_quality > 70) {
      insights.push({
        category: 'sponsors',
        severity: 'positive',
        title: `High-quality leads: ${sp.name}`,
        message: `${sp.lead_quality.toFixed(0)}% of leads are from target segments (founders, investors, corporates).`,
        metric: sp.lead_quality,
      });
    }
  });

  // Overall event
  if (scores.total > 70) {
    insights.push({
      category: 'overall',
      severity: 'positive',
      title: 'Strong event performance',
      message: `Event Success Score: ${scores.total}/100. This event delivered real value beyond just attendance.`,
      metric: scores.total,
    });
  } else if (scores.total < 40) {
    insights.push({
      category: 'overall',
      severity: 'critical',
      title: 'Event underperformed',
      message: `Event Success Score: ${scores.total}/100. Multiple areas need improvement. Focus on networking quality first — it has the highest weight.`,
      metric: scores.total,
    });
  }

  return insights;
}

// ─── Recommendations ────────────────────────────────────
export function generateRecommendations(analysis) {
  const recs = [];
  const { scores, networking, attendance, speakers } = analysis;

  if (scores.breakdown.networking < 40) {
    recs.push({
      priority: 'high',
      area: 'networking',
      title: 'Improve networking infrastructure',
      actions: [
        'Add structured networking breaks between sessions',
        'Implement AI-powered matchmaking based on interests and goals',
        'Enable meeting booking directly from attendee profiles',
        'Send automated follow-up nudges 24h after the event',
      ],
    });
  }

  if (attendance.attendance_rate < 60) {
    recs.push({
      priority: 'high',
      area: 'attendance',
      title: 'Boost attendance conversion',
      actions: [
        'Send multi-touch reminder sequences (7d, 3d, 1d, 1h)',
        'Add early-bird incentives for RSVP conversion',
        'Feature speaker lineup and agenda in invite materials',
        'Use referral incentives to drive organic attendance',
      ],
    });
  }

  if (scores.breakdown.speaker < 50) {
    recs.push({
      priority: 'medium',
      area: 'content',
      title: 'Improve session quality',
      actions: [
        'Survey attendees on preferred topics before the event',
        'Shorten sessions and add Q&A or workshop components',
        'Place high-impact speakers at peak-attendance times',
        'Add session feedback collection in real-time',
      ],
    });
  }

  if (scores.breakdown.sponsor < 40) {
    recs.push({
      priority: 'medium',
      area: 'sponsors',
      title: 'Increase sponsor ROI',
      actions: [
        'Place sponsor booths near networking areas',
        'Offer lead scanning tools to sponsors',
        'Provide pre-event attendee segment data to sponsors',
        'Add sponsored networking breaks or sessions',
      ],
    });
  }

  if (networking.follow_up_rate < 30) {
    recs.push({
      priority: 'high',
      area: 'retention',
      title: 'Drive post-event engagement',
      actions: [
        'Send connection summary emails within 24h',
        'Enable in-app follow-up scheduling',
        'Create a post-event networking window (48h)',
        'Share session recordings to re-engage attendees',
      ],
    });
  }

  return recs;
}

// ─── Cross-Event Pattern Detection ──────────────────────
export function detectPatterns(analyses) {
  if (analyses.length < 2) return [];

  const patterns = [];

  // Sort by date
  const sorted = [...analyses].sort((a, b) =>
    new Date(a.event.date) - new Date(b.event.date)
  );

  // Trend: Event success over time
  const scores = sorted.map(a => a.scores.total);
  const trend = scores[scores.length - 1] - scores[0];
  if (Math.abs(trend) > 10) {
    patterns.push({
      type: 'trend',
      title: trend > 0 ? 'Improving event performance' : 'Declining event performance',
      message: `Event success score ${trend > 0 ? 'increased' : 'decreased'} by ${Math.abs(trend).toFixed(0)} points across ${sorted.length} events.`,
      data: sorted.map(a => ({ name: a.event.name, score: a.scores.total, date: a.event.date })),
    });
  }

  // Pattern: Networking vs Attendance correlation
  const highNetEvents = sorted.filter(a => a.networking.quality_score > 50);
  const lowNetEvents = sorted.filter(a => a.networking.quality_score <= 50);
  if (highNetEvents.length > 0 && lowNetEvents.length > 0) {
    const avgHighScore = highNetEvents.reduce((s, a) => s + a.scores.total, 0) / highNetEvents.length;
    const avgLowScore = lowNetEvents.reduce((s, a) => s + a.scores.total, 0) / lowNetEvents.length;
    if (avgHighScore - avgLowScore > 15) {
      patterns.push({
        type: 'correlation',
        title: 'Networking drives event success',
        message: `Events with strong networking (>50 quality score) average ${avgHighScore.toFixed(0)} overall vs ${avgLowScore.toFixed(0)} for weak networking events.`,
      });
    }
  }

  // Pattern: Session count vs networking
  const sessionCounts = sorted.map(a => ({
    sessions: a.speakers.length,
    networking: a.networking.quality_score,
    name: a.event.name,
  }));

  // Find best networking event and check session count
  const bestNet = sessionCounts.reduce((best, e) =>
    e.networking > best.networking ? e : best, sessionCounts[0]);
  const worstNet = sessionCounts.reduce((worst, e) =>
    e.networking < worst.networking ? e : worst, sessionCounts[0]);

  if (bestNet.sessions !== worstNet.sessions) {
    patterns.push({
      type: 'insight',
      title: 'Session count affects networking',
      message: `"${bestNet.name}" had ${bestNet.sessions} speakers and networking score ${bestNet.networking.toFixed(0)}, while "${worstNet.name}" had ${worstNet.sessions} speakers and score ${worstNet.networking.toFixed(0)}.`,
    });
  }

  // Pattern: Recurring speakers performance
  const allSpeakers = sorted.flatMap(a => a.speakers);
  const speakerCounts = {};
  allSpeakers.forEach(sp => {
    if (!speakerCounts[sp.speaker_id]) {
      speakerCounts[sp.speaker_id] = { name: sp.name, scores: [], count: 0 };
    }
    speakerCounts[sp.speaker_id].scores.push(sp.impact_score);
    speakerCounts[sp.speaker_id].count++;
  });

  Object.values(speakerCounts).forEach(sp => {
    if (sp.count >= 2) {
      const avg = sp.scores.reduce((a, b) => a + b, 0) / sp.scores.length;
      patterns.push({
        type: 'speaker_pattern',
        title: `Recurring speaker: ${sp.name}`,
        message: `Appeared in ${sp.count} events with average impact score ${avg.toFixed(0)}/100. ${avg > 60 ? 'Consistent performer — keep booking.' : 'Consider alternatives.'}`,
      });
    }
  });

  return patterns;
}
