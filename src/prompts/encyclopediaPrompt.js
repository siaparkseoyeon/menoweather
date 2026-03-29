/**
 * encyclopediaPrompt.js
 * Builds prompts for the symptom encyclopedia AI overlay.
 *
 * Generates a one-line personalized message per symptom card explaining
 * *why this symptom is relevant to this user right now*.
 */

// ---------------------------------------------------------------------------
// System prompt
// ---------------------------------------------------------------------------

/**
 * @param {object} profile - User onboarding profile
 * @returns {string}
 */
export function buildEncyclopediaSystemPrompt(profile) {
  return `You write ultra-short, personalized one-line messages for a menopause
symptom encyclopedia app.

=== USER CONTEXT ===
Age:      ${profile.age}
Stage:    ${profile.stage ?? 'menopause transition'}
HRT:      ${profile.hrt ? 'on HRT' : 'not on HRT'}
Race:     ${profile.race ?? 'not specified'}

=== YOUR TASK ===
Given a symptom's current EWMA score and today's popup activity,
write ONE line (max 80 characters) that explains why this symptom
is relevant to this person right now.

=== RULES ===
- No diagnostic language ("you have", "you are suffering from")
- Use: "looks like", "may be worth", "based on recent data"
- Warm, concise, and directly helpful
- No period at the end unless it reads naturally
- All output in English
- Return ONLY the one-line message, nothing else`;
}

// ---------------------------------------------------------------------------
// User content builder
// ---------------------------------------------------------------------------

/**
 * @param {object} entry      - Encyclopedia entry (id, name, nameEn, desc)
 * @param {number} ewmaScore  - Current EWMA score for this symptom
 * @param {number} popupBonus - Today's popup bonus (0 = not triggered today)
 * @returns {string}
 */
export function buildEncyclopediaUserContent(entry, ewmaScore, popupBonus) {
  const severity = getSeverityLabel(ewmaScore);
  const triggered = popupBonus > 0
    ? 'This symptom was triggered in today\'s check-in popup.'
    : 'Not triggered in today\'s popup.';

  return `Symptom:        ${entry.emoji} ${entry.nameEn} (${entry.desc})
EWMA Score:     ${ewmaScore.toFixed(1)}/5.0 — ${severity}
Today's popup:  ${triggered}

Write the one-line overlay message.`;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getSeverityLabel(score) {
  if (score >= 4.5) return 'severe';
  if (score >= 3.5) return 'high';
  if (score >= 2.5) return 'moderate';
  if (score >= 1.5) return 'mild';
  return 'minimal';
}
