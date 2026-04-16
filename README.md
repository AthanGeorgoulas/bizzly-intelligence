# Bizzly Event Intelligence

A client-side B2B Event Intelligence dashboard that analyzes event performance through 6 data layers: Profile, Attendance, Behavior, Sessions/Speakers, Networking, and Sponsors.

## Features

- **Upload JSON** — Drag & drop event data files
- **Event Success Score** — Weighted composite (Attendance 25%, Networking 35%, Speakers 20%, Sponsors 20%)
- **Networking Quality** — Depth-weighted scoring (request → accept → message → meeting → follow-up)
- **Speaker Impact** — Fill rate + networking trigger analysis
- **Sponsor ROI** — Full funnel conversion with lead quality scoring
- **Intelligence Layer** — Rule-based insights + cross-event pattern detection
- **Multi-event Comparison** — Side-by-side metrics, trends, and patterns

## Setup

```bash
npm install
npm run dev
```

## Deploy to GitHub Pages

Push to `main` — the GitHub Actions workflow handles the rest.

Or manually:
```bash
npm run build
```

## JSON Schema

See the Upload page for the expected data structure. Each event JSON contains:

- `event` — metadata (name, date, location)
- `participants` — profile, attendance, behavior per user
- `sessions` — session data with speaker links and attendee lists
- `speakers` — speaker profiles and tags
- `networking` — granular interaction records (from → to, with depth)
- `sponsors` — booth visits, leads, meetings, impressions

## Tech Stack

React + Vite, Recharts, Lucide Icons
