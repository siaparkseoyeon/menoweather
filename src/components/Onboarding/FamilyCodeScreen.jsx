/**
 * FamilyCodeScreen.jsx
 * Family member enters the 8-character invite code to connect.
 */

import { useState } from 'react';

// Demo profile used when the invite code matches the demo code
const DEMO_SUBJECT_PROFILE = {
  displayName: 'Jane', age: 52, race: 'asian', hrt: false,
  lastPeriodDate: '2023-08-15', stage: 'menopause',
  baselineHotFlash: 4, baselineSleep: 4, baselineMood: 3,
  baselineBrainFog: 3, baselineJointPain: 3, baseFatigue: 3,
  medications: 'Calcium, Vitamin D', exerciseFrequency: '1–2x per week',
  smokingStatus: 'never', inviteCode: 'MW2K9RXT',
};

export default function FamilyCodeScreen({ onConnect, onBack }) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  const handleConnect = () => {
    if (code.length !== 8) { setError('Please enter the full 8-character code.'); return; }
    // In production this would validate against Supabase.
    // For demo, any 8-char code connects to the demo profile.
    onConnect(DEMO_SUBJECT_PROFILE);
  };

  return (
    <div className="screen-container">
      <div className="topbar">
        <button className="back-link" onClick={onBack}>← Back</button>
        <span className="topbar-title">Connect</span>
        <div style={{ width: 36 }} />
      </div>

      <div className="screen pad center">
        <div style={{ fontSize: 52, marginBottom: 14 }}>🤝</div>
        <h2 className="s-title center">Enter the invite code</h2>
        <p className="s-desc center">
          Ask the person you're supporting for their 8-character code.
        </p>

        <div className="field" style={{ width: '100%' }}>
          <input
            type="text"
            placeholder="e.g. MW2K9RXT"
            maxLength={8}
            value={code}
            onChange={e => { setCode(e.target.value.toUpperCase()); setError(''); }}
            style={{ textAlign: 'center', fontSize: 22, letterSpacing: 5, fontWeight: 700 }}
          />
          {error && <p className="f-err">{error}</p>}
          <p className="f-hint" style={{ textAlign: 'center' }}>Not case-sensitive</p>
        </div>

        <button
          className={`btn ${code.length === 8 ? 'btn-green' : 'btn-off'}`}
          onClick={handleConnect}
          disabled={code.length !== 8}
        >
          Connect
        </button>

        <p className="demo-link">
          No code? <span onClick={() => onConnect(DEMO_SUBJECT_PROFILE)}>Use demo profile</span>
        </p>
      </div>
    </div>
  );
}
