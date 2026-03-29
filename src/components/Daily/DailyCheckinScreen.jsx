import SubjectTabBar from '../SubjectTabBar.jsx';
/**
 * DailyCheckinScreen.jsx
 * Daily check-in with ①②③ structure:
 *   ① Overall state 1–5  (required) — sets weather + current status text only
 *   ② EWMA Top-3 auto-placed  (required) — source for care cards
 *   ③ AI personalized free text  (optional) — report sentiment analysis only
 */

import { useState, useEffect } from 'react';
import { buildDailyPopupPool } from '../../lib/ewma.js';
import { SCORE_TO_WEATHER, WEATHER_DEFS } from '../../lib/weatherSystem.js';

export default function DailyCheckinScreen({
  profile, top3, ewmaScores, existingCheckin, onSubmit, onBack,
  onNavigate, SCREENS, onSettings,
}) {
  const p = profile;

  // Form state
  const [stateScore,  setStateScore]  = useState(existingCheckin?.moodEmoji ?? null);
  const [symptoms,    setSymptoms]    = useState({});
  const [journalText, setJournalText] = useState(existingCheckin?.journalText ?? '');
  const [bladder,     setBladder]     = useState(existingCheckin?.bladderFrequency ?? null);

  // Popup pool preview
  const [pool, setPool] = useState([]);
  useEffect(() => {
    if (top3?.length) setPool(buildDailyPopupPool(top3, existingCheckin));
  }, [top3]);

  const wState = stateScore ? (SCORE_TO_WEATHER[stateScore] ?? 'W3') : null;
  const wd     = wState ? WEATHER_DEFS[wState] : null;
  const canSubmit = stateScore !== null;

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmit({
      moodEmoji:      stateScore,
      hotFlashScore:  symptoms[1] ?? Math.round(ewmaScores[1] ?? 3),
      sleepQuality:   symptoms[2] ?? Math.round(ewmaScores[2] ?? 3),
      sleepHours:     p?.avgSleepHours === 'Under 5h' ? 4.5 : p?.avgSleepHours === '7h or more' ? 7.5 : 6,
      brainFogScore:  symptoms[4] ?? Math.round(ewmaScores[4] ?? 3),
      jointPainScore: symptoms[6] ?? Math.round(ewmaScores[6] ?? 3),
      fatigue:        symptoms[5] ?? Math.round(ewmaScores[5] ?? 3),
      headachePresent: symptoms[7] !== undefined ? symptoms[7] === 5 : false,
      bladderFrequency: bladder,
      journalText,
      rawSymptoms: symptoms,
    });
  };

  return (
    <div className="screen-container">
      <div className="topbar">
        <button className="back-link" onClick={onBack}>← Home</button>
        <span className="topbar-title">Today's Check-in</span>
        <div style={{ width: 36 }} />
      </div>

      <div className="screen pad">

        {/* ──── ① Overall State ──────────────────────────── */}
        <div className="section-tag">① Overall state today (required) · Sets weather only — not care cards</div>

        <div className="emoji-row">
          {[
            ['😞','Struggling',1],['😔','Rough',2],['😐','Okay',3],['🙂','Good',4],['😊','Great',5]
          ].map(([e,l,v]) => (
            <button
              key={v}
              className={`emoji-btn ${stateScore === v ? 'sel' : ''}`}
              onClick={() => setStateScore(v)}
            >
              {e}<span>{l}</span>
            </button>
          ))}
        </div>

        {wd && (
          <div className="weather-preview">
            <span style={{ fontSize: 20 }}>{wd.icon}</span>
            <span>Family will see: <strong>{wd.title}</strong> — "{wd.desc}"</span>
          </div>
        )}

        <hr className="divider" />

        {/* ──── ② Top-3 Symptoms ─────────────────────────── */}
        <div className="section-tag">② Top 3 symptoms — auto-selected by EWMA score · Source for care cards</div>
        <p className="section-hint">Your responses update the EWMA scores (α = 0.7)</p>

        {(top3 ?? []).map((sy, i) => {
          const isYN  = [4, 6, 7].includes(sy.id);
          const curVal = symptoms[sy.id] ?? Math.round(ewmaScores[sy.id] ?? 3);
          const curEwma = (ewmaScores[sy.id] ?? 3).toFixed(1);

          return (
            <div key={sy.id} className={`slider-card ${symptoms[sy.id] !== undefined ? 'active' : ''}`}>
              <div className="sl-top">
                <span className="sl-name">{sy.emoji} {sy.name}</span>
                <span className="sl-val">{isYN ? (symptoms[sy.id] === 5 ? 'Yes' : symptoms[sy.id] === 1 ? 'No' : '—') : curVal}</span>
              </div>

              {isYN ? (
                <div className="yn-group">
                  <button className={`yn-btn ${symptoms[sy.id] === 5 ? 'yes' : ''}`}
                    onClick={() => setSymptoms(p => ({ ...p, [sy.id]: 5 }))}>
                    Yes
                  </button>
                  <button className={`yn-btn ${symptoms[sy.id] === 1 ? 'no' : ''}`}
                    onClick={() => setSymptoms(p => ({ ...p, [sy.id]: 1 }))}>
                    No
                  </button>
                </div>
              ) : (
                <input
                  type="range" min={1} max={5}
                  value={curVal}
                  style={{ '--pct': `${((curVal - 1) / 4) * 100}%` }}
                  onChange={e => setSymptoms(p => ({ ...p, [sy.id]: parseInt(e.target.value) }))}
                />
              )}

              <div className="sl-labels">
                <span>None / Good</span>
                <span>Severe</span>
              </div>
            </div>
          );
        })}

        {/* Bladder (if applicable — never in family view directly) */}
        {p?.bladderIssue && (
          <div className="field">
            <label className="f-label">🚻 Bathroom frequency today</label>
            <div className="toggle-group">
              {['Normal', 'More than usual', 'Less than usual'].map(v => (
                <button key={v} className={`tb ${bladder === v ? 'sel' : ''}`} onClick={() => setBladder(v)}>{v}</button>
              ))}
            </div>
          </div>
        )}

        <hr className="divider" />

        {/* ──── ③ AI Free Text ───────────────────────────── */}
        <div className="section-tag">③ Optional note — used in report sentiment analysis only · Not shown to family</div>
        <p className="ai-question">{getAIQuestion(stateScore, top3?.[0])}</p>
        <textarea
          className="journal-input"
          placeholder="Write freely..."
          rows={5}
          value={journalText}
          onChange={e => setJournalText(e.target.value)}
        />

    

        <button
          className={`btn ${canSubmit ? 'btn-primary' : 'btn-off'}`}
          style={{ marginTop: 16 }}
          onClick={handleSubmit}
          disabled={!canSubmit}
        >
          Save today's check-in ✓
        </button>
        <div style={{ height: 10 }} />
      </div>
      <SubjectTabBar
        active={SCREENS?.DAILY_CHECKIN}
        onNavigate={onNavigate}
        SCREENS={SCREENS}
        onSettings={onSettings}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// AI question generator (③)
// ---------------------------------------------------------------------------
function getAIQuestion(score, top1) {
  if (!score)          return '"How was your day overall?"';
  if (score <= 2)      return '"It sounds like today was tough. What was the hardest part?"';
  if (score >= 4)      return '"You\'re having a good day! What helped make it that way?"';
  if (!top1)           return '"How are you feeling right now?"';
  const QUESTIONS = {
    'Hot Flashes & Heat Waves': '"Did you notice when the hot flashes were worst today?"',
    'Sleep Disturbances':       '"Last night\'s sleep — what made it harder than usual?"',
    'Mood Swings':              '"Was there a moment today when your mood shifted suddenly?"',
    'Brain Fog':                '"What task felt hardest to focus on today?"',
    'Aches & Pains':            '"Which part of your body felt most uncomfortable today?"',
    'Fatigue':                  '"What drained your energy most today?"',
    'Headaches & Dizziness':    '"How long did the headache or dizziness last?"',
  };
  return QUESTIONS[top1.name] ?? '"How are you managing today?"';
}
