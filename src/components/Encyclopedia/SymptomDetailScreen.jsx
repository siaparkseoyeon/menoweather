import FamilyTabBar from '../FamilyTabBar.jsx';
import SubjectTabBar from '../SubjectTabBar.jsx';
/**
 * SymptomDetailScreen.jsx
 * Detailed view for a single encyclopedia symptom entry.
 * Shows EWMA score bar, AI overlay, article list with tags, and source info.
 */

import { useState, useEffect } from 'react';
import { ENCYCLOPEDIA_12 } from '../../lib/constants.js';
import { generateEncyclopediaOverlay } from '../../lib/claude.js';

export default function SymptomDetailScreen({
  encId, profile, ewmaScores, popupBonus, onBack, isFamily = false,
  onNavigate, SCREENS, onSettings, onLearn, onTrend,
}) {
  const enc    = ENCYCLOPEDIA_12.find(e => e.id === encId);
  const score  = ewmaScores?.[encId] ?? 0;
  const bonus  = popupBonus?.[encId] ?? 0;

  const [aiOverlay, setAiOverlay] = useState(null);

  useEffect(() => {
    if (!enc || !profile) return;
    generateEncyclopediaOverlay(enc, profile, score, bonus)
      .then(text => setAiOverlay(text))
      .catch(() => {});
  }, [encId]);

  if (!enc) return <div className="screen pad"><p>Symptom not found.</p></div>;

  const pct          = Math.round((score / 5) * 100);
  const isSensitive  = encId === 7 || encId === 8; // bladder / vaginal dryness

  return (
    <div className="screen-container">
      <div className="topbar">
        <button className="back-link" onClick={onBack}>← Encyclopedia</button>
        <span className="topbar-title">{enc.name}</span>
        <div style={{ width: 36 }} />
      </div>

      <div className="screen pad">
        {/* Header card */}
        <div className="card anim">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
            <span style={{ fontSize: 36 }}>{enc.emoji}</span>
            <div>
              <p style={{ fontFamily: 'serif', fontSize: 18, fontWeight: 700, color: 'var(--deep)' }}>{enc.name}</p>
              <p style={{ fontSize: 12, color: 'var(--mid)', fontWeight: 300 }}>{enc.nameEn} · {enc.desc}</p>
            </div>
          </div>

          {/* EWMA score bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <span style={{ fontSize: 11, color: 'var(--light)', minWidth: 100 }}>Current EWMA score</span>
            <div style={{ flex: 1, height: 6, background: 'var(--warm-200)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ width: `${pct}%`, height: '100%', background: score >= 4 ? 'var(--coral)' : score >= 3 ? 'var(--peach)' : 'var(--green)', borderRadius: 3 }} />
            </div>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--coral)', minWidth: 28 }}>{score.toFixed(1)}</span>
          </div>

          {/* AI overlay */}
          <div style={{ background: 'white', borderRadius: 10, padding: '10px 12px', fontSize: 12, color: 'var(--mid)', fontStyle: 'italic', lineHeight: 1.6 }}>
            ✨ {aiOverlay ?? `${enc.desc} — check the articles below for more.`}
          </div>

          {isSensitive && (
            <p style={{ marginTop: 8, fontSize: 11, color: 'var(--light)' }}>
              🔒 This information is never shown in the family view.
            </p>
          )}
        </div>

        {/* Article list */}
        <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--mid)', marginBottom: 8 }}>
          Related articles ({enc.articles.length})
        </p>
        <div className="report-section anim" style={{ padding: '4px 0' }}>
          {enc.articles.map((art, i) => (
            <div key={i} className="article-item" style={{ padding: '12px 20px' }}>
              <p className="art-source">{art.source}</p>
              <p className="art-title">{art.title}</p>
              <div className="art-tags">
                {art.tags.map(t => <span key={t} className="art-tag">{t}</span>)}
                {art.hrt && <span className="art-tag" style={{ background: '#FFF9C4', color: '#7A6000' }}>HRT-related</span>}
              </div>
            </div>
          ))}
        </div>

        {/* Source note */}
        <div className="info-box" style={{ background: 'var(--blue-bg)', marginTop: 10 }}>
          <span>📚</span>
          <span style={{ fontSize: 11.5, lineHeight: 1.6, fontWeight: 300 }}>
            Articles are curated from Mayo Clinic, NAMS, ACOG, NIH, and Harvard Health.
            Always consult your healthcare provider for personalized guidance.
          </span>
        </div>

        <div style={{ height: 10 }} />
      </div>

      {/* Bottom nav */}
      {isFamily ? (
        <FamilyTabBar active="learn" onHome={onBack} onLearn={onLearn} onTrend={onTrend} onSettings={onSettings} />
      ) : (
        <SubjectTabBar
          active={SCREENS?.ENCYCLOPEDIA}
          onNavigate={onNavigate}
          SCREENS={SCREENS}
          onSettings={onSettings}
        />
      )}
    </div>
  );
}
