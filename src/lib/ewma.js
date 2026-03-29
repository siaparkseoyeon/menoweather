/**
 * ewma.js
 * Exponentially Weighted Moving Average (EWMA) scoring engine.
 *
 * Tracks symptom severity over time, giving more weight to recent responses
 * while preserving historical trends to prevent score whiplash.
 *
 * Formula:  new_score = (prev_score × α) + (today_response × (1 − α))
 *           α = 0.7  →  70% historical weight, 30% today
 *
 * Example (hot flash, baseline 4.0, three days of score 2):
 *   Day 1: (4.0 × 0.7) + (2 × 0.3) = 3.4
 *   Day 2: (3.4 × 0.7) + (2 × 0.3) = 2.98
 *   Day 3: (2.98 × 0.7) + (3 × 0.3) = 2.99
 *   → Score falls gradually, not instantly
 */

// EWMA smoothing factor — higher = more historical weight
const ALPHA = 0.7;
const BETA  = 1 - ALPHA; // 0.3

// Yes/No responses are converted to numeric before EWMA
const YN_YES = 5;
const YN_NO  = 1;

// Tier definitions for tiebreaking Top-3 selection
export const SYMPTOM_TIERS = {
  1: 1, // Hot Flashes
  2: 1, // Sleep Disturbances
  3: 1, // Mood Swings
  4: 2, // Brain Fog
  5: 2, // Fatigue
  6: 2, // Aches & Pains
  7: 3, // Headaches
  8: 3, // Bladder Issues
  9: 3, // Other
};

// ---------------------------------------------------------------------------
// Core EWMA functions
// ---------------------------------------------------------------------------

/**
 * Update a single symptom's EWMA score given today's response.
 *
 * @param {number} prevScore  - Previous EWMA score (1–5)
 * @param {number} todayValue - Today's response (1–5) or boolean (yes/no)
 * @returns {number}          - New EWMA score, rounded to 2 decimal places
 */
export function updateEWMA(prevScore, todayValue) {
  // Convert boolean (yes/no) responses to numeric
  const numericValue =
    todayValue === true  ? YN_YES :
    todayValue === false ? YN_NO  :
    Number(todayValue);

  const newScore = prevScore * ALPHA + numericValue * BETA;
  return parseFloat(newScore.toFixed(2));
}

/**
 * Initialize EWMA scores from onboarding baselines.
 * Returns a fresh scores object keyed by symptom ID.
 *
 * @param {object} profile - Onboarding profile
 * @returns {object}       - { [symptomId]: number }
 */
export function initEWMAFromOnboarding(profile) {
  return {
    1:  profile.baselineHotFlash  ?? 3,
    2:  profile.baselineSleep     ?? 3,
    3:  profile.baselineMood      ?? 3,
    4:  profile.baselineBrainFog  ?? 3,
    5:  profile.baseFatigue       ?? 3,
    6:  profile.baselineJointPain ?? 3,
    7:  profile.baselineHeadache  ?? 2,
    8:  profile.bladderIssue ? 3 : 1,   // bool → numeric
    9:  profile.weightGain   ? 2 : 1,
    10: profile.skinHairChange ? 2 : 1,
    11: profile.baseFatigue   ?? 3,
    12: profile.baseHeartPalp ?? 2,
  };
}

/**
 * Apply today's daily check-in responses to update all EWMA scores.
 *
 * @param {object} currentScores - { [symptomId]: number }
 * @param {object} responses     - { [symptomId]: number | boolean }
 * @returns {object}             - Updated scores (does not mutate input)
 */
export function applyDailyResponses(currentScores, responses) {
  const updated = { ...currentScores };

  for (const [id, value] of Object.entries(responses)) {
    const numId = Number(id);
    if (updated[numId] !== undefined && value !== null && value !== undefined) {
      updated[numId] = updateEWMA(updated[numId], value);
    }
  }

  return updated;
}

// ---------------------------------------------------------------------------
// Top-3 selection
// ---------------------------------------------------------------------------

/**
 * Select the top 3 symptoms by EWMA score.
 * Tiebreaker: Tier 1 > Tier 2 > Tier 3, then by symptom ID (ascending).
 *
 * @param {object} scores            - { [symptomId]: number }
 * @param {object} [symptomMeta=[]]  - Array of { id, name, emoji, tier }
 * @returns {Array}                  - Top 3 symptom objects with .score attached
 */
export function getTop3(scores, symptomMeta = []) {
  const metaMap = Object.fromEntries(symptomMeta.map(s => [s.id, s]));

  return Object.entries(scores)
    .filter(([id]) => Number(id) <= 8) // exclude non-displayable
    .map(([id, score]) => ({
      id:    Number(id),
      score,
      tier:  SYMPTOM_TIERS[Number(id)] ?? 3,
      ...( metaMap[Number(id)] ?? {} ),
    }))
    .sort((a, b) => {
      const scoreDiff = b.score - a.score;
      if (Math.abs(scoreDiff) > 0.001) return scoreDiff;
      if (a.tier !== b.tier) return a.tier - b.tier;
      return a.id - b.id;
    })
    .slice(0, 3);
}

// ---------------------------------------------------------------------------
// Daily popup pool builder (no-repeat scheduling)
// ---------------------------------------------------------------------------

/**
 * Build today's popup question pool.
 * Guarantees no question type repeats across all 5 daily slots.
 *
 * Slot assignment:
 *   1 — Top-1 symptom question
 *   2 — Mood check (Q01, or Q09 if already used)
 *   3 — Top-2 symptom (fallback to Top-3 or general pool if duplicate)
 *   4 — Unused general check
 *   5 — Conditional: Q11 (alone check) if mood low, else Q12 (evening wrap-up)
 *
 * @param {Array}   top3         - Output of getTop3()
 * @param {object}  todayCheckin - Today's daily check-in (may be null)
 * @returns {Array}              - [{ slot, qtype }] — 5 items, all unique qtypes
 */
export function buildDailyPopupPool(top3, todayCheckin) {
  const SYMPTOM_TO_QTYPE = { 1:'Q03', 2:'Q02', 3:'Q04', 4:'Q05', 5:'Q06', 6:'Q07', 7:'Q08', 8:'Q06' };
  const GENERAL_POOL     = ['Q06', 'Q07', 'Q10', 'Q08'];

  const used = new Set();
  const pool = [];

  // Slot 1: Top-1 symptom question
  const q1 = SYMPTOM_TO_QTYPE[top3[0]?.id] ?? 'Q06';
  pool.push({ slot: 1, qtype: q1 });
  used.add(q1);

  // Slot 2: Mood check (Q01), fallback Q09
  const q2 = !used.has('Q01') ? 'Q01' : 'Q09';
  pool.push({ slot: 2, qtype: q2 });
  used.add(q2);

  // Slot 3: Top-2 symptom, de-duped
  let q3 = SYMPTOM_TO_QTYPE[top3[1]?.id] ?? 'Q06';
  if (used.has(q3)) q3 = SYMPTOM_TO_QTYPE[top3[2]?.id] ?? 'Q10';
  if (used.has(q3)) q3 = GENERAL_POOL.find(t => !used.has(t)) ?? 'Q10';
  pool.push({ slot: 3, qtype: q3 });
  used.add(q3);

  // Slot 4: First unused general check
  const q4 = GENERAL_POOL.find(t => !used.has(t)) ?? 'Q08';
  pool.push({ slot: 4, qtype: q4 });
  used.add(q4);

  // Slot 5: Conditional
  const moodLow = (todayCheckin?.moodEmoji ?? 3) <= 2;
  const q5      = moodLow ? 'Q11' : 'Q12';
  pool.push({ slot: 5, qtype: q5 });

  return pool;
}

// ---------------------------------------------------------------------------
// Emoji score for family-view face emoji selection
// ---------------------------------------------------------------------------

/**
 * Compute the display score for face emoji selection.
 * Combines EWMA base score with popup bonus and daily bonus.
 *
 * @param {number} ewmaScore   - Base EWMA score
 * @param {number} popupBonus  - Popup response bonus (0–2)
 * @param {number} dailyBonus  - Daily check-in bonus (0–1)
 * @returns {number}
 */
export function calcEmojiScore(ewmaScore, popupBonus = 0, dailyBonus = 0) {
  return ewmaScore + popupBonus + dailyBonus;
}

/**
 * Select up to 2 face emojis to display in the family view.
 * Only shows symptoms with emojiScore ≥ 3.0.
 *
 * @param {object} scores      - { [symptomId]: number }
 * @param {object} popupBonus  - { [symptomId]: number }
 * @param {object} dailyBonus  - { [symptomId]: number }
 * @param {boolean} ghostMode  - If true, returns ["👻"] regardless
 * @param {object}  symptomMeta - Array of symptom definitions
 * @returns {Array}            - Up to 2 items: { emoji, name, score }
 */
export function getActiveEmojis(scores, popupBonus, dailyBonus, ghostMode, symptomMeta) {
  if (ghostMode) return [{ emoji: '👻', name: 'No response', score: 0 }];

  const metaMap = Object.fromEntries((symptomMeta ?? []).map(s => [s.id, s]));

  return Object.entries(scores)
    .filter(([id]) => {
      const sid = Number(id);
      return sid >= 1 && sid <= 7; // only displayable symptoms
    })
    .map(([id, ewma]) => {
      const sid       = Number(id);
      const emojiScore = calcEmojiScore(ewma, popupBonus?.[sid] ?? 0, dailyBonus?.[sid] ?? 0);
      const meta      = metaMap[sid] ?? {};
      return { ...meta, score: emojiScore };
    })
    .filter(s => s.score >= 3.0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 2);
}
