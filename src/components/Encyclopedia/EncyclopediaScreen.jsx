import FamilyTabBar from '../FamilyTabBar.jsx';
import SubjectTabBar from '../SubjectTabBar.jsx';
/**
 * EncyclopediaScreen.jsx
 * Symptom encyclopedia with personalized sorting (relevance_score v3.1).
 * Supports alias search, badge system, and AI one-line overlays.
 */

import { useState, useMemo, useEffect } from 'react';
import { ENCYCLOPEDIA_12, SEARCH_ALIAS_MAP } from '../../lib/constants.js';
import { generateEncyclopediaOverlay } from '../../lib/claude.js';

// ---------------------------------------------------------------------------
// Relevance score calculator (full v3.1 logic)
// ---------------------------------------------------------------------------
function calcRelevanceScore(enc, profile, ewmaScores, popupBonus) {
  const sId    = enc.id;
  const p      = profile ?? {};
  const months = p.lastPeriodDate
    ? Math.floor((Date.now() - new Date(p.lastPeriodDate)) / (1000*60*60*24*30))
    : 12;
  const stage  = months >= 12 ? 'menopause' : 'perimenopause';

  // Base score
  const baseScore = ewmaScores?.[sId] ?? 2;

  // symptom_match_score with multipliers
  let matchScore = baseScore;
  if (isCoreSymptom(sId, p))        matchScore *= 1.5; // core symptom × 1.5
  if ((popupBonus?.[sId] ?? 0) > 0) matchScore *= 1.3; // popup-triggered × 1.3

  let score = matchScore;

  // popup_boost
  score += (popupBonus?.[sId] ?? 0) * 0.5;

  // stage_match_bonus
  if ((stage === 'perimenopause' && sId <= 3) || (stage === 'menopause' && sId >= 4)) score += 1.0;

  // topic_boost (HRT)
  if (p.hrt && enc.articles.some(a => a.hrt)) score += 0.5;

  // topic_boost (joint exercise)
  if ((ewmaScores?.[6] ?? 0) >= 3 && sId === 6) score += 0.5;

  // Race adjustments
  const race = p.race;
  if (race === 'black'    && (sId === 1 || sId === 12)) score += 1.0;
  if (race === 'asian'    && sId === 6)                 score += 0.8;
  if (race === 'hispanic' && sId === 3)                 score += 0.8;
  if (race === 'white'    && sId === 9)                 score += 0.5;
  if ((p.age ?? 50) >= 55 && (sId === 5 || sId === 12)) score += 0.5;

  // Special clinical flags (Part 7)
  if ((ewmaScores?.[4] ?? 0) >= 4 && sId === 4)                                       score += 2.0;
  if ((ewmaScores?.[2] ?? 0) >= 4 && (ewmaScores?.[11] ?? 0) >= 4 && (sId === 2 || sId === 11)) score += 1.0;
  if ((ewmaScores?.[1] ?? 0) >= 4 && (ewmaScores?.[5]  ?? 0) >= 4 && sId === 12)      score += 1.0;

  // recency penalty: handled externally via recentlyViewed prop

  return score;
}

function isCoreSymptom(sId, p) {
  const map = {
    1: (p.baselineHotFlash  ?? 0) >= 3,
    2: (p.baselineSleep     ?? 0) >= 3,
    3: (p.baselineMood      ?? 0) >= 3,
    4: (p.baselineBrainFog  ?? 0) >= 3,
    5: (p.baselineHeadache  ?? 0) >= 3,
    6: (p.baselineJointPain ?? 0) >= 3,
    7: !!p.bladderIssue,
    8: !!p.vaginalDryness,
    9: !!p.weightGain,
    10: !!p.skinHairChange,
  };
  return map[sId] ?? false;
}

function getBadges(enc, profile, ewmaScores, popupBonus) {
  const sId    = enc.id;
  const score  = ewmaScores?.[sId] ?? 0;
  const badges = [];
  if (isCoreSymptom(sId, profile))     badges.push({ cls: 'b-pink',   text: 'My key symptom' });
  if ((popupBonus?.[sId] ?? 0) > 0)    badges.push({ cls: 'b-orange', text: 'Read now' });
  if (score >= 4 && sId <= 7)          badges.push({ cls: 'b-orange', text: 'Attention today' });
  if (score < 2.0 && sId <= 6)         badges.push({ cls: 'b-green',  text: 'Improving' });
  if ((ewmaScores?.[1] ?? 0) >= 4 && sId === 1) badges.push({ cls: 'b-red', text: 'Consult provider' });
  if ((ewmaScores?.[5] ?? 0) >= 4 && sId === 5) badges.push({ cls: 'b-red', text: 'Consult provider' });
  return badges;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function EncyclopediaScreen({
  profile, ewmaScores, popupBonus, onSelectSymptom, onBack, isFamily = false,
  onNavigate, SCREENS, onSettings, onLearn, onTrend,
}) {
  const [query,         setQuery]         = useState('');
  const [aiOverlays,    setAiOverlays]    = useState({});
  const [recentlyViewed, setRecentlyViewed] = useState([]);

  // Sort by relevance, apply recency penalty
  const sorted = useMemo(() => {
    return [...ENCYCLOPEDIA_12]
      .map(e => {
        let score = calcRelevanceScore(e, profile, ewmaScores, popupBonus);
        if (recentlyViewed.includes(e.id)) score -= 0.5;
        return { ...e, relevanceScore: score };
      })
      .sort((a, b) => b.relevanceScore - a.relevanceScore);
  }, [profile, ewmaScores, popupBonus, recentlyViewed]);

  // Search filter with alias expansion
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sorted;
    let canonical = q;
    for (const [alias, target] of Object.entries(SEARCH_ALIAS_MAP)) {
      if (q.includes(alias)) { canonical = target.toLowerCase(); break; }
    }
    return sorted.filter(e =>
      e.name.toLowerCase().includes(canonical) ||
      e.nameEn.toLowerCase().includes(canonical) ||
      e.articles.some(a => a.title.toLowerCase().includes(canonical) || a.tags.some(t => t.toLowerCase().includes(canonical)))
    );
  }, [sorted, query]);

  // Load AI overlays for top 6 on mount
  useEffect(() => {
    if (!profile) return;
    sorted.slice(0, 6).forEach(async (enc) => {
      if (aiOverlays[enc.id]) return;
      try {
        const text = await generateEncyclopediaOverlay(enc, profile, ewmaScores?.[enc.id] ?? 2, popupBonus?.[enc.id] ?? 0);
        setAiOverlays(prev => ({ ...prev, [enc.id]: text }));
      } catch { /* fail silently — static fallback shown */ }
    });
  }, []); // eslint-disable-line

  const handleSelect = (id) => {
    setRecentlyViewed(prev => [...new Set([...prev, id])]);
    onSelectSymptom(id);
  };

  return (
    <div className="screen-container">
      <div className="topbar">
        <span className="topbar-title">📖 Symptom Encyclopedia</span>
        <button className="icon-btn" onClick={() => setRecentlyViewed([])} title="Reset recency">🔄</button>
      </div>

      {/* Search */}
      <div className="search-area">
        <div className="search-bar">
          <span className="search-icon">🔍</span>
          <input
            placeholder="Search symptoms or topics (e.g. hot flash, insomnia, Kegel)"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          {query && <button className="search-clear" onClick={() => setQuery('')}>✕</button>}
        </div>
        <div className="alias-tags">
          {['hot flash', 'brain fog', 'insomnia', 'joint pain', 'fatigue'].map(k => (
            <span key={k} className="alias-tag" onClick={() => setQuery(k)}>{k}</span>
          ))}
        </div>
      </div>

      <div className="screen pad" style={{ paddingTop: 4 }}>
        {filtered.length === 0 ? (
          <NoResults query={query} sorted={sorted} onSuggest={setQuery} />
        ) : (
          filtered.map((enc, i) => (
            <EncycCard
              key={enc.id}
              enc={enc}
              badges={getBadges(enc, profile, ewmaScores, popupBonus)}
              aiOverlay={aiOverlays[enc.id] ?? null}
              query={query}
              onSelect={() => handleSelect(enc.id)}
              delay={i * 0.04}
            />
          ))
        )}
        <div style={{ height: 10 }} />
      </div>

      {/* Bottom nav */}
      {isFamily ? (
        <FamilyTabBar active="learn" onHome={onBack} onLearn={null} onTrend={onTrend} onSettings={onSettings} />
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

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function EncycCard({ enc, badges, aiOverlay, query, onSelect, delay }) {
  const isHighlighted = badges.some(b => b.cls === 'b-orange');
  const hl = (text) => {
    if (!query.trim()) return text;
    const re = new RegExp(`(${query.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(re, '<mark>$1</mark>');
  };

  return (
    <div
      className={`encyc-card ${isHighlighted ? 'highlighted' : ''} anim`}
      style={{ animationDelay: `${delay}s` }}
      onClick={onSelect}
    >
      <div className="encyc-top">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
          <span style={{ fontSize: 26 }}>{enc.emoji}</span>
          <div>
            <p className="encyc-name" dangerouslySetInnerHTML={{ __html: hl(enc.name) }} />
            <p className="encyc-count">{enc.articles.length} articles · score {enc.relevanceScore.toFixed(1)}</p>
          </div>
        </div>
        <span style={{ color: 'var(--light)', fontSize: 14 }}>›</span>
      </div>

      {badges.length > 0 && (
        <div className="enc-badge-row">
          {badges.map((b, i) => <span key={i} className={b.cls}>{b.text}</span>)}
        </div>
      )}

      <p className="encyc-ai">
        {aiOverlay ? `✨ ${aiOverlay}` : `${enc.desc} — tap to explore articles`}
      </p>
    </div>
  );
}

function NoResults({ query, sorted, onSuggest }) {
  return (
    <div className="no-results">
      <p style={{ fontSize: 32, marginBottom: 10 }}>🔍</p>
      <p className="no-results-title">No results for "{query}"</p>
      <p className="no-results-hint">Did you mean one of these?</p>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
        {sorted.slice(0, 3).map(e => (
          <span key={e.id} className="alias-tag" onClick={() => onSuggest(e.name)}>
            {e.emoji} {e.name}
          </span>
        ))}
      </div>
      <p className="no-results-ai-hint">Not finding what you need?</p>
      <button className="btn btn-primary" style={{ marginTop: 8 }} onClick={() => {}}>
        💬 Ask Claude
      </button>
    </div>
  );
}
