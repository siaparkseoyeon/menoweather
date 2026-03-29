import FamilyTabBar from '../FamilyTabBar.jsx';
import SubjectTabBar from '../SubjectTabBar.jsx';
import { useState } from 'react';

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const fmtH  = h => h === 0 ? '12 AM' : h < 12 ? `${h} AM` : h === 12 ? '12 PM' : `${h-12} PM`;

const S = {
  card: {
    background: 'white', borderRadius: 20,
    boxShadow: '0 2px 14px rgba(61,43,31,.08)',
    marginBottom: 16, overflow: 'visible',
    paddingBottom: 8,
  },
  sectionLabel: {
    fontSize: 11, fontWeight: 700, color: 'var(--peach)',
    letterSpacing: '1.2px', textTransform: 'uppercase',
    margin: '28px 0 12px', display: 'flex', alignItems: 'center', gap: 6,
  },
  row: {
    display: 'flex', alignItems: 'flex-start',
    gap: 14, padding: '20px 20px',
    boxSizing: 'border-box', width: '100%',
  },
  icon: { fontSize: 22, width: 32, textAlign: 'center', flexShrink: 0, paddingTop: 1 },
  body: { flex: 1, minWidth: 0, paddingRight: 12 },
  title: { fontSize: 14, fontWeight: 500, color: 'var(--deep)', display: 'block', lineHeight: 1.4, marginBottom: 5 },
  desc:  { fontSize: 12, color: 'var(--light)', display: 'block', lineHeight: 1.6, fontWeight: 300 },
  divider: { height: 1, background: 'var(--warm-100)', margin: '0 20px' },
  timeRow: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '8px 20px 20px', gap: 8,
  },
  timeLabel: { fontSize: 12, color: 'var(--light)' },
  timeSelects: { display: 'flex', alignItems: 'center', gap: 8 },
  timeSelect: {
    fontSize: 12, borderRadius: 10,
    border: '1.5px solid var(--warm-200)',
    background: 'var(--warm-100)', color: 'var(--deep)',
    padding: '8px 10px', width: 80, cursor: 'pointer',
    WebkitAppearance: 'none', appearance: 'none', textAlign: 'center',
  },
  infoBox: (bg, color) => ({
    margin: '0 20px 20px',
    background: bg, borderRadius: 12,
    padding: '14px 16px',
    fontSize: 12, color, lineHeight: 1.7, fontWeight: 300,
    transition: 'opacity .2s',
  }),
  headerBox: { padding: '20px 20px 14px', borderBottom: '1px solid var(--warm-100)' },
  symRow: {
    display: 'flex', alignItems: 'center',
    gap: 14, padding: '18px 20px',
    boxSizing: 'border-box', width: '100%',
  },
  privacyNote: {
    display: 'flex', gap: 14, background: 'var(--green-bg)',
    borderRadius: 18, padding: '18px 20px',
    fontSize: 12, color: 'var(--green-dark)', lineHeight: 1.7,
    marginBottom: 16,
  },
};

function Toggle({ value, onChange }) {
  return (
    <button onClick={onChange} style={{
      width: 48, height: 28, borderRadius: 14, border: 'none', flexShrink: 0,
      background: value ? 'var(--coral)' : 'var(--warm-200)',
      position: 'relative', cursor: 'pointer', transition: 'background .25s',
    }}>
      <span style={{
        position: 'absolute', top: 4,
        left: value ? 22 : 4, width: 20, height: 20,
        borderRadius: '50%', background: 'white',
        boxShadow: '0 1px 4px rgba(0,0,0,.2)',
        transition: 'left .25s', display: 'block',
      }}/>
    </button>
  );
}

function Row({ icon, title, desc, value, onChange, badge }) {
  return (
    <div style={S.row}>
      <span style={S.icon}>{icon}</span>
      <div style={S.body}>
        <span style={S.title}>{title}</span>
        {badge && (
          <span style={{
            display: 'inline-block', marginTop: 4, marginBottom: 4,
            fontSize: 10, fontWeight: 600, color: 'white',
            background: badge.color, padding: '2px 9px', borderRadius: 10,
          }}>{badge.text}</span>
        )}
        {desc && <span style={S.desc}>{desc}</span>}
      </div>
      <Toggle value={value} onChange={() => onChange(!value)} />
    </div>
  );
}

function TimeRange({ start, end, onStart, onEnd, visible }) {
  return (
    <div style={{ ...S.timeRow, opacity: visible ? 1 : 0.3, pointerEvents: visible ? 'auto' : 'none', transition: 'opacity .2s' }}>
      <span style={S.timeLabel}>Allowed hours</span>
      <div style={S.timeSelects}>
        <select style={S.timeSelect} value={start} onChange={e => onStart(+e.target.value)}>
          {HOURS.map(h => <option key={h} value={h}>{fmtH(h)}</option>)}
        </select>
        <span style={{ fontSize: 12, color: 'var(--light)' }}>–</span>
        <select style={S.timeSelect} value={end} onChange={e => onEnd(+e.target.value)}>
          {HOURS.map(h => <option key={h} value={h}>{fmtH(h)}</option>)}
        </select>
      </div>
    </div>
  );
}

function InfoBox({ children, bg = 'var(--warm-100)', color = 'var(--mid)', visible }) {
  return (
    <div style={{ ...S.infoBox(bg, color), opacity: visible ? 1 : 0, pointerEvents: visible ? 'auto' : 'none' }}>
      {children}
    </div>
  );
}

// ══════════════════════════════════════════
// SUBJECT SETTINGS
// ══════════════════════════════════════════
export function SubjectSettingsScreen({ profile, onBack, onNavigate, SCREENS }) {
  const [popupOn,   setPopupOn]   = useState(true);
  const [popupS,    setPopupS]    = useState(9);
  const [popupE,    setPopupE]    = useState(21);
  const [alertOn,   setAlertOn]   = useState(true);
  const [alertS,    setAlertS]    = useState(9);
  const [alertE,    setAlertE]    = useState(21);
  const [syncOn,    setSyncOn]    = useState(true);
  const [aloneMode, setAloneMode] = useState(false);
  const [medAlert,  setMedAlert]  = useState(true);
  const [sensitive, setSensitive] = useState(true);
  const [aiQ,       setAiQ]       = useState(true);

  const SYMPTOMS = [
    { id:1, emoji:'😳', name:'Hot Flashes' },
    { id:2, emoji:'😴', name:'Sleep Disturbances' },
    { id:3, emoji:'😤', name:'Mood Swings' },
    { id:4, emoji:'😵', name:'Brain Fog' },
    { id:5, emoji:'😩', name:'Fatigue' },
    { id:6, emoji:'🥴', name:'Aches & Pains' },
    { id:7, emoji:'🤕', name:'Headaches' },
    { id:8, emoji:'🌸', name:'Vaginal Dryness', locked: true },
    { id:9, emoji:'🚻', name:'Bladder Issues',  locked: true },
  ];
  const [shared, setShared] = useState(Object.fromEntries(SYMPTOMS.map(s => [s.id, true])));

  return (
    <div className="screen-container">
      <div className="topbar">
        <button className="back-link" onClick={onBack}>← Back</button>
        <span className="topbar-title">Settings</span>
        <div style={{ width: 36 }}/>
      </div>

      <div className="screen" style={{ padding: '8px 20px 40px' }}>

        {/* ── NOTIFICATIONS ── */}
        <p style={{ ...S.sectionLabel, marginTop: 8 }}>🔔 Notifications</p>
        <div style={S.card}>
          <Row icon="💬" title="Allow check-in popups"
            desc="Receive daily symptom check-in prompts during the allowed hours."
            value={popupOn} onChange={setPopupOn}/>
          <TimeRange start={popupS} end={popupE} onStart={setPopupS} onEnd={setPopupE} visible={popupOn}/>
          <div style={S.divider}/>
          <Row icon="📊" title="Status change alerts"
            desc="Get notified when your symptom condition changes significantly."
            value={alertOn} onChange={setAlertOn}/>
          <TimeRange start={alertS} end={alertE} onStart={setAlertS} onEnd={setAlertE} visible={alertOn}/>
        </div>

        {/* ── FAMILY SHARING ── */}
        <p style={S.sectionLabel}>👨‍👩‍👧 Family Sharing</p>
        <div style={S.card}>
          <Row icon="🔄" title="Family view live sync"
            desc="Send your daily emoji and status to the family app in real time."
            value={syncOn} onChange={setSyncOn}
            badge={!syncOn ? { text: 'Paused', color: 'var(--orange)' } : null}/>
          <InfoBox bg="var(--orange-bg)" color="var(--orange)" visible={!syncOn}>
            ⚠️ Family view is paused. Your family won't see any updates until you turn this back on.
          </InfoBox>
        </div>

        <div style={S.card}>
          <div style={S.headerBox}>
            <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--deep)', marginBottom: 5 }}>
              Symptom visibility for family
            </p>
            <p style={{ fontSize: 12, color: 'var(--light)', lineHeight: 1.5 }}>
              Toggle off to hide a symptom from the family view entirely.
            </p>
          </div>
          {SYMPTOMS.map((s, i) => (
            <div key={s.id}>
              {i > 0 && <div style={S.divider}/>}
              <div style={S.symRow}>
                <span style={{ fontSize: 22, width: 32, textAlign: 'center', flexShrink: 0 }}>{s.emoji}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ fontSize: 13.5, color: 'var(--deep)', display: 'block', lineHeight: 1.4 }}>{s.name}</span>
                  {s.locked && (
                    <span style={{ fontSize: 11, color: 'var(--light)', display: 'block', marginTop: 3 }}>
                      🔒 Always hidden from family
                    </span>
                  )}
                </div>
                {s.locked
                  ? <span style={{ fontSize: 11, color: 'var(--light)', fontStyle: 'italic', flexShrink: 0 }}>Locked</span>
                  : <Toggle value={shared[s.id]} onChange={() => setShared(p => ({ ...p, [s.id]: !p[s.id] }))}/>
                }
              </div>
            </div>
          ))}
        </div>

        {/* ── PRIVACY & AI ── */}
        <p style={S.sectionLabel}>🔒 Privacy & AI</p>
        <div style={S.card}>
          <Row icon="🌫️" title='"Alone time" mode'
            desc='Pauses all popups for 1 hour and sends your family an automatic "needs quiet time" message.'
            value={aloneMode} onChange={setAloneMode}
            badge={aloneMode ? { text: 'Active', color: 'var(--purple)' } : null}/>
          <InfoBox bg="var(--purple-bg)" color="var(--purple)" visible={aloneMode}>
            Popups are paused for 1 hour. Your family has been notified that you need quiet time.
          </InfoBox>
          <div style={S.divider}/>
          <Row icon="🏥" title="Medical consultation alerts"
            desc={<>When a symptom stays at 4–5 for 3+ days, show a provider recommendation popup.<br/><span style={{ color: 'var(--light)' }}>OFF — reminders appear in your report only.</span></>}
            value={medAlert} onChange={setMedAlert}/>
          <div style={S.divider}/>
          <Row icon="🌸" title="Sensitive symptoms in report"
            desc={<>Include vaginal dryness and similar items in your personal weekly report.<br/><span style={{ color: 'var(--coral)', fontSize: 11 }}>⚠️ These are always hidden from family — this only affects your own report.</span></>}
            value={sensitive} onChange={setSensitive}/>
          <div style={S.divider}/>
          <Row icon="✨" title="AI personalized daily question"
            desc={<>Claude generates a question based on yesterday's data (Daily check-in ③).<br/><span style={{ color: 'var(--light)' }}>OFF — Daily check-in shows sections ① + ② only.</span></>}
            value={aiQ} onChange={setAiQ}/>
        </div>

        <div style={{ height: 24 }}/>
      </div>

      <SubjectTabBar
        active="settings"
        onNavigate={onNavigate}
        SCREENS={SCREENS}
        onSettings={null}
      />
    </div>
  );
}

// ══════════════════════════════════════════
// FAMILY SETTINGS
// ══════════════════════════════════════════
export function FamilySettingsScreen({ profile, onBack, onLearn, onTrend }) {
  const p = profile ?? { displayName: 'Jane' };
  const [alertOn, setAlertOn] = useState(true);
  const [alertS,  setAlertS]  = useState(8);
  const [alertE,  setAlertE]  = useState(22);
  const [weather, setWeather] = useState(true);
  const [emojis,  setEmojis]  = useState(true);
  const [careAI,  setCareAI]  = useState(true);

  return (
    <div className="screen-container">
      <div className="topbar" style={{ background: 'var(--green-bg)' }}>
        <button className="back-link" onClick={onBack}>← Back</button>
        <span className="topbar-title">Settings</span>
        <div style={{ width: 36 }}/>
      </div>

      <div className="screen" style={{ padding: '8px 20px 40px' }}>

        {/* ── ALERTS ── */}
        <p style={{ ...S.sectionLabel, marginTop: 8 }}>🔔 Alerts</p>
        <div style={S.card}>
          <Row icon="📢" title="Receive status alerts"
            desc={`Get notified when ${p.displayName}'s condition changes significantly.`}
            value={alertOn} onChange={setAlertOn}/>
          <TimeRange start={alertS} end={alertE} onStart={setAlertS} onEnd={setAlertE} visible={alertOn}/>
        </div>

        {/* ── FAMILY VIEW ── */}
        <p style={S.sectionLabel}>🌤️ Family View</p>
        <div style={S.card}>
          <Row icon="🌤️" title="Weather status card"
            desc="Show today's MenoWeather state on the family home screen."
            value={weather} onChange={setWeather}/>
          <div style={S.divider}/>
          <Row icon="😳" title="Symptom face emojis"
            desc="Show active symptom emoji indicators on the weather card."
            value={emojis} onChange={setEmojis}/>
          <div style={S.divider}/>
          <Row icon="✨" title="AI-personalized care cards"
            desc="Claude generates a custom care message based on her current symptom and mood state."
            value={careAI} onChange={setCareAI}
            badge={careAI ? { text: 'Claude AI', color: 'var(--coral)' } : null}/>
          <InfoBox visible={!careAI}>
            Care cards will show standard messages instead of AI-generated ones.
          </InfoBox>
        </div>

        {/* ── PRIVACY NOTE ── */}
        <div style={S.privacyNote}>
          <span style={{ fontSize: 20, flexShrink: 0 }}>🔒</span>
          <div>
            <p style={{ fontWeight: 600, marginBottom: 5, fontSize: 13.5 }}>Privacy is always protected</p>
            <p style={{ fontWeight: 300, fontSize: 12, lineHeight: 1.7 }}>
              Sensitive symptoms — including vaginal dryness and bladder details — are never shown in the family view, regardless of any setting here. This is enforced at the system level and cannot be changed.
            </p>
          </div>
        </div>

        <div style={{ height: 24 }}/>
      </div>

      <FamilyTabBar active="settings" onHome={onBack} onLearn={onLearn} onTrend={onTrend} onSettings={null} />
    </div>
  );
}
