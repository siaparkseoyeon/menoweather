/**
 * SubjectHomeScreen.jsx
 * Main dashboard for the subject (woman tracking her own symptoms).
 * Shows today's weather state, EWMA Top-3, timeline, and quick actions.
 */

import { useState } from 'react';
import { getWeatherState, WEATHER_DEFS } from '../../lib/weatherSystem.js';
import { buildDailyPopupPool } from '../../lib/ewma.js';
import StatusPopup from '../Popup/StatusPopup.jsx';

export default function SubjectHomeScreen({
  profile, ewmaScores, top3, todayCheckin, history,
  aloneMode, ghostMode, latestMoodPopup, popupBonus, dailyBonus, lastUpdated,
  onPopupResponse, onNavigate, SCREENS, onSettings,
  pendingFamilyPopup, onFamilyPopupDismissed,
}) {
  const [showPopup,  setShowPopup]  = useState(false);
  const [popupQtype, setPopupQtype] = useState('Q01');

  const p   = profile;
  const wState = getWeatherState({ aloneMode, latestMoodPopup, todayCheckin, yesterdayCheckin: history?.slice(-1)[0] });
  const wd     = WEATHER_DEFS[wState];
  const pct    = getProgressPct(p);
  const endYear = getEstimatedEndYear(p);

  // Auto-show family popup when received
  const [familyPopupShown, setFamilyPopupShown] = useState(false);
  if (pendingFamilyPopup && !familyPopupShown && !showPopup) {
    setFamilyPopupShown(true);
    setPopupQtype('Q01');
    setShowPopup(true);
  }
  if (!pendingFamilyPopup && familyPopupShown) {
    setFamilyPopupShown(false);
  }

  const handleDemoPopup = () => {
    if (!top3?.length) return;
    const pool = buildDailyPopupPool(top3, todayCheckin);
    const usedCount = Object.keys(popupBonus).length;
    const slot = pool[usedCount % pool.length];
    setPopupQtype(slot.qtype);
    setShowPopup(true);
  };

  return (
    <div className="screen-container">
      {/* Top bar */}
      <div className="topbar">
        <div>
          <p className="topbar-sup">Good to see you 👋</p>
          <p className="topbar-title">{p?.displayName}'s Today</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="icon-btn" onClick={handleDemoPopup} title="Trigger popup demo">🔔</button>
          <button className="icon-btn" onClick={() => onNavigate(SCREENS.REPORT)}>📊</button>
        </div>
      </div>

      <div className="screen pad">
        {/* Weather card */}
        <div className="weather-card anim" style={{ background: wd.bg }}>
          <p className="weather-card-label" style={{ color: wd.scoreColor }}>Today's MenoWeather</p>
          <div style={{ textAlign: 'center', padding: '10px 0 4px' }}>
            <span style={{ fontSize: 96, lineHeight: 1, display: 'block' }}>{wd.icon}</span>
            <p className="weather-card-title" style={{ textAlign: 'center', marginTop: 8 }}>{wd.title}</p>
            <p className="weather-card-desc" style={{ textAlign: 'center' }}>{wd.desc}</p>
          </div>
          <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 5 }}>
            {(top3 ?? []).map(s => (
              <div key={s.id} className="top3-row">
                <span>{s.emoji} {s.name}</span>
                <div className="mini-bar">
                  <div className="mini-bar-fill" style={{ width: `${(s.score / 5) * 100}%` }} />
                </div>
                <span className="mini-score">{s.score?.toFixed(1)}</span>
              </div>
            ))}
          </div>
          <button
            className="weather-cta"
            onClick={() => onNavigate(SCREENS.DAILY_CHECKIN)}
          >
            {todayCheckin ? "Today's check-in complete ✓ · Edit" : '✍️ Start today\'s check-in'}
          </button>
        </div>

        {/* Timeline card */}
        <div className="card anim">
          <div className="card-header-row">
            <p className="card-label">My menopause journey</p>
            <p className="card-sub">{pct}% through</p>
          </div>
          <div className="timeline-bar">
            <div className="timeline-fill" style={{ width: `${pct}%` }} />
            <div className="timeline-dot" style={{ left: `${pct}%` }} />
          </div>
          <div className="timeline-labels">
            <span>Start · {p?.lastPeriodDate?.slice(0, 7) ?? ''}</span>
            <span>~{endYear} estimated end</span>
          </div>
        </div>

        {/* EWMA score summary */}
        <div className="card anim">
          <p className="card-label">Current EWMA scores (Top 3)</p>
          {(top3 ?? []).map(s => (
            <div key={s.id} className="ewma-row">
              <span className="ewma-name">{s.emoji} {s.name}</span>
              <div className="ewma-bar-wrap">
                <div className="ewma-bar" style={{ width: `${(s.score / 5) * 100}%` }} />
              </div>
              <span className="ewma-score">{s.score?.toFixed(1)}</span>
            </div>
          ))}
          <p className="ewma-note">Updated with each check-in (α = 0.7)</p>
        </div>
      </div>

      {/* Bottom nav */}
      <BottomNav active="home" onNavigate={onNavigate} SCREENS={SCREENS} onSettings={onSettings} />

      {/* Popup overlay */}
      {showPopup && (
        <StatusPopup
          qtypeKey={popupQtype}
          isFamilyRequest={pendingFamilyPopup && familyPopupShown}
          onRespond={(key, val) => {
            onPopupResponse(key, val);
            setShowPopup(false);
            if (pendingFamilyPopup) onFamilyPopupDismissed();
            // App.jsx will auto-navigate back to family view
          }}
          onDismiss={() => {
            onPopupResponse(popupQtype, null);
            setShowPopup(false);
            if (pendingFamilyPopup) onFamilyPopupDismissed();
          }}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Bottom navigation
// ---------------------------------------------------------------------------
export function BottomNav({ active, onNavigate, SCREENS, onSettings }) {
  const tabs = [
    { key: SCREENS.SUBJECT_HOME,  icon: '🏠', label: 'Home'      },
    { key: SCREENS.DAILY_CHECKIN, icon: '✍️', label: 'Check-in' },
    { key: SCREENS.REPORT,        icon: '📊', label: 'Report'    },
    { key: SCREENS.ENCYCLOPEDIA,  icon: '📖', label: 'Learn'     },
  ];

  return (
    <nav className="tab-bar">
      {tabs.map(t => (
        <button
          key={t.key}
          className={`tab-item ${active === t.key ? 'active' : ''}`}
          onClick={() => onNavigate(t.key)}
        >
          <span className="tab-icon">{t.icon}</span>
          <span className="tab-label">{t.label}</span>
        </button>
      ))}
      <button
        className={`tab-item ${active === 'settings' ? 'active' : ''}`}
        onClick={() => onSettings && onSettings()}
      >
        <span className="tab-icon">⚙️</span>
        <span className="tab-label">Settings</span>
      </button>
    </nav>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function getEstimatedEndYear(p) {
  if (!p) return new Date().getFullYear() + 5;
  const offset     = { black: -2 }[p.race] ?? 0;
  const onsetYears = { 'Under 6 months': 0.5, '1 year': 1, '2+ years': 2 }[p.symptomOnsetDuration] ?? 1;
  return Math.round(new Date().getFullYear() - onsetYears + 5.5 + offset);
}

function getProgressPct(p) {
  if (!p?.lastPeriodDate) return 0;
  const start = new Date(p.lastPeriodDate).getFullYear();
  const end   = getEstimatedEndYear(p);
  const now   = new Date().getFullYear();
  return Math.min(100, Math.max(0, Math.round((now - start) / (end - start) * 100)));
}
