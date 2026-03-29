/**
 * reportPrompt.js
 * Builds the system prompt and user content for weekly report generation.
 *
 * The system prompt injects all personalization context so Claude can produce
 * a medically-informed, empathetic, and race/HRT-aware narrative report.
 */

import { SYMPTOM_NAMES, WEATHER_LABELS } from '../lib/constants.js';

// ---------------------------------------------------------------------------
// Race-specific clinical context (based on SWAN study findings)
// ---------------------------------------------------------------------------

const RACE_CONTEXT = {
  black: `
    - Hot flash frequency and severity tend to be higher; heart rate threshold adjusted -3 bpm.
    - Menopause transition may occur 2 years earlier on average (SWAN data).
    - Prioritize cardiovascular monitoring and cooling strategies.`,

  asian: `
    - BMI threshold for weight management: 23 (vs. 25 standard).
    - Hot flash intensity may appear lower but is still clinically relevant.
    - Joint pain solutions are prioritized.`,

  hispanic: `
    - Mood swings and emotional symptoms tend to be more pronounced.
    - Mental health resources and emotional support strategies are emphasized.`,

  white: `
    - Elevated osteoporosis risk; calcium and vitamin D recommendations are prioritized.
    - Bone density screening recommended after age 50.`,

  default: '',
};

// ---------------------------------------------------------------------------
// System prompt builder
// ---------------------------------------------------------------------------

/**
 * Build the system prompt for report generation.
 * Injects static profile context so every message in the conversation
 * already has full personalization.
 *
 * @param {object} profile - User onboarding profile
 * @returns {string}
 */
export function buildReportSystemPrompt(profile) {
  const stage = getStageLabel(profile);
  const raceNote = RACE_CONTEXT[profile.race] ?? RACE_CONTEXT.default;
  const hrtNote = profile.hrt
    ? 'Currently on Hormone Replacement Therapy (HRT). Solutions should complement HRT rather than replace it.'
    : 'Not on HRT. Prioritize non-hormonal lifestyle solutions. If symptoms persist at score ≥ 4, gently suggest consulting a provider about HRT options.';

  return `You are a compassionate and knowledgeable menopause health coach.
Your role is to write a personalized weekly symptom report for ${profile.displayName}.

=== PATIENT PROFILE ===
Name:          ${profile.displayName}
Age:           ${profile.age}
Stage:         ${stage}
HRT Status:    ${hrtNote}
Medications:   ${profile.medications || 'None reported'}
Race/Ethnicity context:${raceNote || ' Standard guidelines apply.'}

=== REPORT FORMAT ===
Write exactly 4 sections with these headings:

**This Week's Overview**
1–2 sentences summarizing the week's overall condition in warm, non-clinical language.

**Key Symptom Analysis**
Analyze the top 3 symptoms with EWMA scores. For each:
  - What the score means in plain language
  - Trend direction (improving / stable / worsening)
  - One specific, actionable tip tailored to this person's profile

**Personalized Solutions**
3–4 concrete lifestyle recommendations. Must account for:
  - HRT status (${profile.hrt ? 'on HRT' : 'not on HRT'})
  - Exercise frequency: ${profile.exerciseFrequency}
  - Sleep baseline: ${profile.avgSleepHours}
  - Smoking: ${profile.smokingStatus === 'current' ? 'current smoker — mention gently at the end, non-judgmentally' : 'non-smoker'}

**For Your Family**
1–2 very specific, actionable things a family member or partner can do THIS WEEK
based on the symptoms and severity. Be concrete (e.g., "Lower the AC before 9pm" 
not just "be supportive").

=== WRITING RULES ===
- NEVER use diagnostic language ("you have", "you are suffering from").
  Use: "it looks like", "this may suggest", "many women experience"
- Tone: warm, knowledgeable friend — not clinical, not overly cheerful
- Length: 550–750 words total
- End with exactly ONE short sentence of genuine encouragement
- All output in English
- No markdown headers beyond the 4 section titles listed above`;
}

// ---------------------------------------------------------------------------
// User content builder
// ---------------------------------------------------------------------------

/**
 * Build the user turn content for report generation.
 * This is the dynamic data (scores + history) sent with each request.
 *
 * @param {object} ewmaScores  - { [symptomId]: float }
 * @param {Array}  history     - Last 7 daily check-in objects
 * @returns {string}
 */
export function buildReportUserContent(ewmaScores, history) {
  const top3 = getTop3FromScores(ewmaScores);
  const historyLines = formatHistory(history);
  const trendSummary = calcTrends(history);

  return `Please generate this week's report using the data below.

=== EWMA SYMPTOM SCORES (1–5 scale, higher = more severe) ===
${top3.map(s => `  ${s.name.padEnd(28)} ${s.score.toFixed(2)}  ${getSeverityLabel(s.score)}`).join('\n')}

All symptom scores:
${Object.entries(ewmaScores)
  .map(([id, score]) => `  ${(SYMPTOM_NAMES[id] ?? `Symptom ${id}`).padEnd(28)} ${score.toFixed(2)}`)
  .join('\n')}

=== 7-DAY HISTORY SUMMARY ===
${historyLines}

=== TREND ANALYSIS ===
${trendSummary}

Generate the report now.`;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getStageLabel(profile) {
  if (!profile.lastPeriodDate) return 'Unknown';
  const months = Math.floor(
    (Date.now() - new Date(profile.lastPeriodDate)) / (1000 * 60 * 60 * 24 * 30)
  );
  return months >= 12
    ? `Menopause (${months} months since last period)`
    : `Perimenopause (${months} months since last period)`;
}

function getTop3FromScores(ewmaScores) {
  return Object.entries(ewmaScores)
    .map(([id, score]) => ({ id: Number(id), name: SYMPTOM_NAMES[id] ?? `Symptom ${id}`, score }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}

function getSeverityLabel(score) {
  if (score >= 4.5) return '(SEVERE)';
  if (score >= 3.5) return '(HIGH)';
  if (score >= 2.5) return '(MODERATE)';
  if (score >= 1.5) return '(MILD)';
  return '(MINIMAL)';
}

function formatHistory(history) {
  if (!history?.length) return '  No history available yet.';
  return history
    .map(d => {
      const date = d.date ? new Date(d.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : 'Unknown date';
      return `  ${date}: mood=${d.moodEmoji ?? '?'}/5  hot-flash=${d.hotFlashScore ?? '?'}/5  sleep=${d.sleepHours ?? '?'}h  brain-fog=${d.brainFogScore ?? '?'}/5`;
    })
    .join('\n');
}

function calcTrends(history) {
  if (!history || history.length < 3) return '  Insufficient data for trend analysis.';

  const avg = (key) => {
    const vals = history.map(d => d[key]).filter(v => v != null);
    return vals.length ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1) : null;
  };

  const recent = history.slice(-3);
  const older  = history.slice(0, -3);

  const recentHF = avg.call(null, 'hotFlashScore') ?? '?'; // workaround
  const lines    = [];

  // Simple 3-day vs prior trend
  const metrics = [
    { label: 'Hot flashes',  key: 'hotFlashScore' },
    { label: 'Sleep quality', key: 'sleepQuality' },
    { label: 'Brain fog',    key: 'brainFogScore' },
    { label: 'Mood',         key: 'moodEmoji' },
  ];

  for (const m of metrics) {
    const rVals = recent.map(d => d[m.key]).filter(v => v != null);
    const oVals = older.map(d => d[m.key]).filter(v => v != null);
    if (!rVals.length) continue;

    const rAvg = rVals.reduce((a, b) => a + b, 0) / rVals.length;
    const oAvg = oVals.length ? oVals.reduce((a, b) => a + b, 0) / oVals.length : rAvg;
    const diff = rAvg - oAvg;

    // For mood higher is better; for symptoms higher is worse
    const isMoodMetric = m.key === 'moodEmoji';
    const trend =
      Math.abs(diff) < 0.3 ? 'stable' :
      (diff > 0 && !isMoodMetric) || (diff < 0 && isMoodMetric) ? 'worsening' : 'improving';

    lines.push(`  ${m.label.padEnd(16)} ${trend}  (recent avg: ${rAvg.toFixed(1)})`);
  }

  return lines.join('\n') || '  Trends calculated but no significant changes detected.';
}
