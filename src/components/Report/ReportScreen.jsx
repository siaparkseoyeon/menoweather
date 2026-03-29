import SubjectTabBar from '../SubjectTabBar.jsx';
/**
 * ReportScreen.jsx
 * Weekly symptom report screen — powered by Claude API (streaming).
 *
 * Shows a personalized narrative report generated in real time.
 * Text streams in character-by-character for maximum "wow" effect.
 */

import { useEffect, useState } from 'react';
import { useReport } from '../../hooks/useReport.js';
import FamilyTrendContent from '../FamilyView/FamilyTrendContent.jsx';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * @param {object}   props
 * @param {object}   props.profile     - User onboarding profile
 * @param {object}   props.ewmaScores  - Current EWMA scores { [id]: float }
 * @param {Array}    props.history     - Last 7 daily check-ins
 * @param {Function} props.onBack      - Navigate back to home
 */
export default function ReportScreen({ profile, ewmaScores, history, onBack, onNavigate, SCREENS, onSettings }) {
  const { report, isLoading, isStreaming, error, generate, reset } = useReport();

  // Auto-generate on mount
  useEffect(() => {
    if (profile && ewmaScores) {
      generate(profile, ewmaScores, history ?? []);
    }
    return () => reset();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="screen-container">
      {/* Top bar */}
      <div className="topbar">
        <button className="back-btn" onClick={onBack}>← Home</button>
        <span className="topbar-title">Weekly Report</span>
        {/* Re-generate button */}
        {!isLoading && !isStreaming && (
          <button
            className="icon-btn"
            onClick={() => generate(profile, ewmaScores, history ?? [])}
            title="Regenerate report"
          >
            🔄
          </button>
        )}
      </div>

      <div className="screen pad">
        {/* Loading state */}
        {isLoading && (
          <div className="report-loading">
            <div className="loading-spinner" />
            <p>Analyzing your week with Claude...</p>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="report-error">
            <p>⚠️ {error}</p>
            <button
              className="btn btn-primary"
              onClick={() => generate(profile, ewmaScores, history ?? [])}
            >
              Try Again
            </button>
          </div>
        )}

        {/* Report text — streams in real time */}
        {(report || isStreaming) && (
          <div className="report-wrapper">
            {/* Profile summary card */}
            <ProfileSummaryCard profile={profile} ewmaScores={ewmaScores} />

            {/* ── Trend & AI Insight (중단) ── */}
            <FamilyTrendContent
              profile={profile}
              ewmaScores={ewmaScores}
              history={history}
            />

            {/* Streaming report text */}
            <div className="report-body">
              <ReportText text={report} isStreaming={isStreaming} />
            </div>

            {/* Disclaimer */}
            {!isStreaming && report && (
              <p className="report-disclaimer">
                This report is for informational purposes only and does not
                constitute medical advice. Please consult your healthcare
                provider for personalized guidance.
              </p>
            )}
          </div>
        )}
      </div>
      <SubjectTabBar
        active={SCREENS?.REPORT}
        onNavigate={onNavigate}
        SCREENS={SCREENS}
        onSettings={onSettings}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/**
 * Shows a compact profile + EWMA score summary above the report.
 */
function ProfileSummaryCard({ profile, ewmaScores }) {
  if (!profile) return null;

  const stageLabel = getStageLabel(profile);
  const top3 = getTop3Preview(ewmaScores);

  return (
    <div className="profile-summary-card">
      <div className="psc-header">
        <span className="psc-name">{profile.displayName}'s Week</span>
        <span className="psc-stage">{stageLabel}</span>
      </div>
      <div className="psc-scores">
        {top3.map(({ id, name, emoji, score }) => (
          <div key={id} className="psc-score-row">
            <span>{emoji} {name}</span>
            <ScoreBar score={score} />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Renders the streaming report text with a blinking cursor while streaming.
 * Applies basic formatting to section headers.
 */
function ReportText({ text, isStreaming }) {
  if (!text) return null;

  // Format **Section Header** as bold headings
  const formatted = text.replace(
    /\*\*([^*]+)\*\*/g,
    '<strong>$1</strong>'
  );

  return (
    <div
      className={`report-text ${isStreaming ? 'streaming' : 'complete'}`}
      dangerouslySetInnerHTML={{ __html: formatted + (isStreaming ? '<span class="cursor">▋</span>' : '') }}
    />
  );
}

/**
 * Horizontal bar showing symptom severity.
 */
function ScoreBar({ score }) {
  const pct     = Math.round((score / 5) * 100);
  const color   = score >= 4 ? '#D4715A' : score >= 3 ? '#E8A98A' : '#7AAE9B';

  return (
    <div className="score-bar-wrap">
      <div className="score-bar" style={{ width: `${pct}%`, background: color }} />
      <span className="score-label">{score?.toFixed(1)}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers (pure, no hooks)
// ---------------------------------------------------------------------------

function getStageLabel(profile) {
  if (!profile?.lastPeriodDate) return '';
  const months = Math.floor(
    (Date.now() - new Date(profile.lastPeriodDate)) / (1000 * 60 * 60 * 24 * 30)
  );
  return months >= 12 ? 'Menopause' : 'Perimenopause';
}

// Lightweight Top-3 without importing the full ewma module
function getTop3Preview(scores) {
  const NAMES = {
    1: { name: 'Hot Flashes',  emoji: '😳' },
    2: { name: 'Sleep',        emoji: '😴' },
    3: { name: 'Mood Swings',  emoji: '😤' },
    4: { name: 'Brain Fog',    emoji: '😵' },
    5: { name: 'Fatigue',      emoji: '😩' },
    6: { name: 'Aches & Pains',emoji: '🥴' },
    7: { name: 'Headaches',    emoji: '🤕' },
  };

  return Object.entries(scores ?? {})
    .filter(([id]) => Number(id) <= 7)
    .map(([id, score]) => ({ id: Number(id), score, ...(NAMES[Number(id)] ?? { name: `Symptom ${id}`, emoji: '•' }) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}
