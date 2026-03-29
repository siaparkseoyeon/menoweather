import FamilyTabBar from '../FamilyTabBar.jsx';
/**
 * FamilyHomeScreen.jsx
 * Family view — shows weather state, face emojis, and AI-powered care cards.
 * All information derived from the subject's data; never shows medical jargon.
 */

import { useState } from 'react';
import { getWeatherState, WEATHER_DEFS } from '../../lib/weatherSystem.js';
import { getActiveEmojis } from '../../lib/ewma.js';
import { SYMPTOMS_9 } from '../../lib/constants.js';
import CareCard from './CareCard.jsx';

export default function FamilyHomeScreen({
  profile, ewmaScores, top3,
  aloneMode, ghostMode, latestMoodPopup,
  popupBonus, dailyBonus, lastUpdated,
  todayCheckin, history,
  onLearn, onSendPopup, popupSentConfirm, onSettings, onTrend,
}) {
  const p       = profile;
  const wState  = getWeatherState({
    aloneMode,
    latestMoodPopup,
    todayCheckin,
    yesterdayCheckin: history?.slice(-1)[0],
  });
  const wd      = WEATHER_DEFS[wState];
  const emojis  = getActiveEmojis(ewmaScores, popupBonus ?? {}, dailyBonus ?? {}, ghostMode, SYMPTOMS_9);
  const updAgo  = timeAgo(lastUpdated);

  // Top-2 symptoms for care cards (exclude bladder/other from family view)
  const careSymptoms = (top3 ?? [])
    .filter(s => s.id !== 8 && s.id !== 9 && s.emoji)
    .slice(0, 2);

  const [popupSent, setPopupSent] = useState(false);

  const handleSendPopup = () => {
    setPopupSent(true);
    // Trigger popup on subject's screen (via App state)
    if (onSendPopup) onSendPopup();
    setTimeout(() => setPopupSent(false), 3000);
  };

  return (
    <div className="screen-container">
      <div className="topbar" style={{ background: 'rgba(255,255,255,0.6)' }}>
        <div>
          <p className="topbar-sup">Family View 👨‍👩‍👧</p>
          <p className="topbar-title">{p?.displayName}'s Today</p>
        </div>
        <button className="icon-btn" onClick={onLearn}>📚</button>
      </div>

      <div className="screen pad">

        {/* Weather hero */}
        <div className="weather-hero anim" style={{ background: wd.bg }}>
          <p className="w-updated">{updAgo}</p>

          {/* 큰 이모지 — 실제 날씨 앱 스타일 */}
          <div style={{ textAlign: 'center', padding: '8px 0 4px' }}>
            <span style={{ fontSize: 96, lineHeight: 1, display: 'block' }}>{wd.icon}</span>
            <p className="w-title" style={{ textAlign: 'center', marginTop: 10 }}>{wd.title}</p>
            <p className="w-desc"  style={{ textAlign: 'center' }}>{wd.desc}</p>
          </div>

          {/* Face emojis — 가로 정렬로 변경 */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 12, flexWrap: 'wrap' }}>
            {emojis.length > 0
              ? emojis.map((e, i) => (
                  <div key={i} className="face-item" style={{ flexDirection: 'column', alignItems: 'center' }}>
                    <span>{e.emoji}</span>
                    <span>{e.name?.split(' ')[0] ?? ''}</span>
                  </div>
                ))
              : <p className="no-symptoms">No active symptoms ✓</p>
            }
          </div>
        </div>

        {/* Care cards */}
        {careSymptoms.length > 0 ? (
          <>
            <p className="care-section-label">Here's how to help today</p>
            <div className="care-grid">
              {careSymptoms.map(s => (
                <CareCard
                  key={s.id}
                  symptomEmoji={s.emoji}
                  symptomName={s.name}
                  weatherState={wState}
                  profile={p}
                  useAI={true}
                />
              ))}
            </div>
          </>
        ) : (
          <div className="info-box green">
            <span>✨</span>
            <span>{p?.displayName} seems to be doing okay today. No special care needed — just be yourself!</span>
          </div>
        )}

        {/* Send popup button — always visible */}
        <button
          className="popup-send-btn"
          style={{
            background: popupSent ? 'var(--green)' : aloneMode ? 'rgba(106,27,154,0.1)' : 'var(--green-bg)',
            color:      popupSent ? 'white' : aloneMode ? '#6A1B9A' : 'var(--green-dark)',
            transition: 'all 0.3s',
          }}
          onClick={handleSendPopup}
          disabled={popupSent}
        >
          {popupSent
            ? '✓ Popup sent to her phone!'
            : aloneMode
            ? '🌫️ Needs alone time — tap to check in anyway'
            : '💬 Ask how she\'s doing'}
        </button>
        {popupSent ? (
          <p
            className="popup-send-note"
            style={{ cursor: 'pointer', textDecoration: 'underline', color: 'var(--green-dark)', fontWeight: 500 }}
            onClick={() => { if (onSendPopup) onSendPopup('switch'); }}
          >
            👆 Tap here to switch to her view and see the popup!
          </p>
        ) : (
          <p className="popup-send-note">Max 2 per day · 90 min between sends</p>
        )}

        {/* Learn hub shortcut */}
        <p className="section-label" style={{ marginTop: 16 }}>Learn more</p>
        <div className="learn-card" onClick={onLearn}>
          <div className="lc-top">
            <div className="lc-icon" style={{ background: '#FFF0E8' }}>💛</div>
            <span className="lc-title">What families can do during menopause</span>
          </div>
          <p className="lc-sub">Practical ways to show up for her every day</p>
        </div>
      </div>

      {/* Bottom nav */}
      <FamilyTabBar active="home" onHome={null} onLearn={onLearn} onTrend={onTrend} onSettings={onSettings} />
    </div>
  );
}

function timeAgo(ts) {
  if (!ts) return 'Just now';
  const m = Math.floor((Date.now() - ts) / 60000);
  if (m < 1)  return 'Just now';
  if (m < 60) return `${m}m ago`;
  return `${Math.floor(m / 60)}h ago`;
}
