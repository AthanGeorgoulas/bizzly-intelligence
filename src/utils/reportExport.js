import { jsPDF } from 'jspdf';

function buildReport(eventData) {
  const { parsed, analysis, insights, recommendations } = eventData;
  const { event } = parsed;
  const { scores, attendance, networking, speakers, sponsors } = analysis;
  return {
    event: { name: event.name, date: event.date, location: event.location, type: event.type },
    scores: { overall: scores.total, attendance: scores.breakdown.attendance, networking: scores.breakdown.networking, speakers: scores.breakdown.speaker, sponsors: scores.breakdown.sponsor },
    attendance: { invited: attendance.total_invited, rsvp_yes: attendance.rsvp_yes, attended: attendance.attended, no_shows: attendance.no_shows, attendance_rate: attendance.attendance_rate },
    networking: { total_interactions: networking.total_interactions, connections: networking.accepted, meetings: networking.meetings_booked, follow_ups: networking.follow_ups, quality_score: networking.quality_score, acceptance_rate: networking.acceptance_rate },
    speakers: speakers.map(s => ({ name: s.name, topic: s.topic, impact: s.impact_score, fill_rate: s.fill_rate, networking_triggered: s.networking_triggered })),
    sponsors: sponsors.map(s => ({ name: s.name, tier: s.tier, roi_score: s.roi_score, leads: s.leads_collected, lead_quality: s.lead_quality })),
    insights: insights.map(i => ({ severity: i.severity, title: i.title, message: i.message })),
    recommendations: recommendations.map(r => ({ priority: r.priority, title: r.title, actions: r.actions })),
  };
}

export async function exportPDF(eventData) {
  const r = buildReport(eventData);
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const m = 20;
  const w = doc.internal.pageSize.getWidth();
  let y = 20;
  const chk = (n = 20) => { if (y + n > 270) { doc.addPage(); y = 20; } };

  doc.setFontSize(20); doc.setFont('helvetica', 'bold'); doc.setTextColor(47, 107, 255);
  doc.text('Event Intelligence Report', m, y); y += 10;
  doc.setFontSize(14); doc.setTextColor(15, 15, 16); doc.text(r.event.name, m, y); y += 7;
  doc.setFontSize(10); doc.setTextColor(107, 101, 96);
  doc.text([r.event.date, r.event.location, r.event.type].filter(Boolean).join(' · '), m, y); y += 12;

  doc.setFontSize(13); doc.setFont('helvetica', 'bold'); doc.setTextColor(15, 15, 16);
  doc.text('Event Success Scores', m, y); y += 8;
  doc.setFontSize(10); doc.setFont('helvetica', 'normal');
  doc.text(`Overall: ${r.scores.overall}/100`, m, y); y += 5;
  doc.text(`Attendance: ${r.scores.attendance}/100    Networking: ${r.scores.networking}/100`, m, y); y += 5;
  doc.text(`Speakers: ${r.scores.speakers}/100    Sponsors: ${r.scores.sponsors}/100`, m, y); y += 10;

  chk(25); doc.setFontSize(13); doc.setFont('helvetica', 'bold');
  doc.text('Attendance', m, y); y += 7;
  doc.setFontSize(10); doc.setFont('helvetica', 'normal');
  doc.text(`Invited: ${r.attendance.invited}  |  RSVP: ${r.attendance.rsvp_yes}  |  Attended: ${r.attendance.attended}  |  No-shows: ${r.attendance.no_shows}`, m, y); y += 5;
  doc.text(`Attendance rate: ${r.attendance.attendance_rate.toFixed(1)}%`, m, y); y += 10;

  chk(25); doc.setFontSize(13); doc.setFont('helvetica', 'bold');
  doc.text('Networking', m, y); y += 7;
  doc.setFontSize(10); doc.setFont('helvetica', 'normal');
  doc.text(`Interactions: ${r.networking.total_interactions}  |  Connections: ${r.networking.connections}  |  Meetings: ${r.networking.meetings}`, m, y); y += 5;
  doc.text(`Quality: ${r.networking.quality_score.toFixed(0)}/100  |  Acceptance: ${r.networking.acceptance_rate.toFixed(0)}%`, m, y); y += 10;

  chk(15 + r.speakers.length * 6); doc.setFontSize(13); doc.setFont('helvetica', 'bold');
  doc.text('Speakers', m, y); y += 7;
  doc.setFontSize(9); doc.setFont('helvetica', 'normal');
  r.speakers.forEach(s => { chk(6); doc.text(`${s.name} — Impact: ${s.impact.toFixed(0)}, Fill: ${s.fill_rate.toFixed(0)}%`, m, y); y += 5; });
  y += 5;

  if (r.sponsors.length > 0) {
    chk(15 + r.sponsors.length * 6); doc.setFontSize(13); doc.setFont('helvetica', 'bold');
    doc.text('Sponsors', m, y); y += 7;
    doc.setFontSize(9); doc.setFont('helvetica', 'normal');
    r.sponsors.forEach(s => { chk(6); doc.text(`${s.name} (${s.tier}) — ROI: ${s.roi_score.toFixed(0)}, Leads: ${s.leads}`, m, y); y += 5; });
    y += 5;
  }

  chk(15); doc.setFontSize(13); doc.setFont('helvetica', 'bold');
  doc.text('Key Insights', m, y); y += 7;
  doc.setFontSize(9); doc.setFont('helvetica', 'normal');
  r.insights.forEach(ins => {
    chk(12);
    const p = ins.severity === 'critical' ? '!!' : ins.severity === 'warning' ? '!' : '+';
    doc.text(`${p} ${ins.title}`, m, y); y += 4;
    doc.splitTextToSize(ins.message, w - m * 2).forEach(l => { chk(5); doc.text(l, m + 4, y); y += 4; });
    y += 2;
  });

  chk(15); doc.setFontSize(13); doc.setFont('helvetica', 'bold');
  doc.text('Recommendations', m, y); y += 7;
  doc.setFontSize(9); doc.setFont('helvetica', 'normal');
  r.recommendations.forEach(rec => {
    chk(10 + rec.actions.length * 5);
    doc.setFont('helvetica', 'bold'); doc.text(`[${rec.priority.toUpperCase()}] ${rec.title}`, m, y); y += 5;
    doc.setFont('helvetica', 'normal');
    rec.actions.forEach(a => { chk(5); doc.text(`> ${a}`, m + 4, y); y += 4; });
    y += 3;
  });

  const pc = doc.getNumberOfPages();
  for (let i = 1; i <= pc; i++) {
    doc.setPage(i); doc.setFontSize(8); doc.setTextColor(141, 132, 124);
    doc.text(`Event Intelligence Engine`, m, 285);
    doc.text(`Page ${i}/${pc}`, w - m, 285, { align: 'right' });
  }

  doc.save(`${r.event.name.replace(/[^a-zA-Z0-9]/g, '_')}_report.pdf`);
}
