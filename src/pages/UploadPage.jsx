import { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Upload, FileJson, AlertCircle } from 'lucide-react';

export default function UploadPage() {
  const { loadEvent, error, dispatch } = useApp();
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef(null);

  const handleFiles = async (files) => {
    for (const file of files) {
      if (!file.name.endsWith('.json')) {
        dispatch({ type: 'SET_ERROR', payload: `"${file.name}" is not a JSON file.` });
        continue;
      }
      try {
        const text = await file.text();
        const json = JSON.parse(text);
        loadEvent(json);
      } catch (e) {
        dispatch({ type: 'SET_ERROR', payload: `Failed to parse "${file.name}": ${e.message}` });
      }
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const onDragOver = (e) => { e.preventDefault(); setDragging(true); };
  const onDragLeave = () => setDragging(false);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Load Event Data</h1>
        <p className="page-subtitle">Upload one or more event JSON files to start analyzing</p>
      </div>

      {error && (
        <div style={{
          background: 'var(--bz-danger-dim)',
          border: '1px solid rgba(255,71,87,0.3)',
          borderRadius: 'var(--bz-radius-md)',
          padding: '14px 18px',
          marginBottom: 24,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          fontSize: 13,
          color: 'var(--bz-danger)',
        }}>
          <AlertCircle size={16} />
          {error}
          <button
            onClick={() => dispatch({ type: 'CLEAR_ERROR' })}
            style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--bz-danger)', cursor: 'pointer', fontSize: 18 }}
          >×</button>
        </div>
      )}

      <div
        className={`upload-zone ${dragging ? 'dragging' : ''}`}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onClick={() => fileRef.current?.click()}
      >
        <input
          ref={fileRef}
          type="file"
          accept=".json"
          multiple
          style={{ display: 'none' }}
          onChange={(e) => handleFiles(e.target.files)}
        />
        <div style={{ marginBottom: 16 }}>
          <Upload size={48} color="var(--bz-text-muted)" strokeWidth={1.2} />
        </div>
        <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>
          Drop JSON files here or click to upload
        </div>
        <div style={{ fontSize: 13, color: 'var(--bz-text-muted)' }}>
          Accepts structured event JSON with participants, sessions, networking data
        </div>
      </div>

      <div style={{ marginTop: 40 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Expected JSON structure</h3>
        <div className="card" style={{ fontFamily: 'var(--bz-font-mono)', fontSize: 12, lineHeight: 1.8, color: 'var(--bz-text-secondary)' }}>
          <pre style={{ whiteSpace: 'pre-wrap' }}>{`{
  "event": {
    "id": "evt_001",
    "name": "Tech Connect 2025",
    "date": "2025-03-15",
    "location": "Istanbul, Turkey",
    "type": "conference",
    "total_invited": 200
  },
  "participants": [
    {
      "user_id": "u_001",
      "name": "Alice Chen",
      "role": "founder",
      "industry": "SaaS",
      "goals": ["networking", "fundraising"],
      "interests": ["AI", "fintech"],
      "networking_intent": "high",
      "invited": true,
      "rsvp_status": "yes",
      "attended": true,
      "ticket_type": "vip",
      "entry_source": "invite",
      "behavior": {
        "app_opens": 12,
        "profile_views": 8,
        "session_joins": 3,
        "time_spent_total": 240,
        "sponsor_clicks": 2
      }
    }
  ],
  "sessions": [...],
  "speakers": [...],
  "networking": [...],
  "sponsors": [...]
}`}</pre>
        </div>
      </div>
    </div>
  );
}
