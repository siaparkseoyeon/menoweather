/**
 * careCardPrompt.js
 * Builds prompts for dynamic family-view care card generation.
 *
 * Replaces the static 48-cell CARE_MATRIX with AI-generated messages
 * that are personalized to the user's profile, current symptom, and
 * current weather/mood state.
 */

import { WEATHER_LABELS } from '../lib/constants.js';

// ---------------------------------------------------------------------------
// System prompt
// ---------------------------------------------------------------------------

/**
 * Build the system prompt for care card generation.
 *
 * @param {object} profile - User onboarding profile
 * @returns {string}
 */
export function buildCareCardSystemPrompt(profile) {
  const hrtContext = profile.hrt
    ? 'She is on HRT, so her symptoms may fluctuate less but are still real.'
    : 'She is not on HRT, so her symptoms can be more intense.';

  const raceContext = {
    asian:    'She may experience lower-intensity but still meaningful hot flashes.',
    black:    'Hot flash frequency and emotional sensitivity may be higher than average.',
    hispanic: 'Emotional symptoms tend to be more pronounced.',
    white:    'Bone and joint health are important to consider.',
  }[profile.race] ?? '';

  return `You write short, warm, and practical care card messages for family members
of a woman going through menopause.

=== ABOUT THIS PERSON ===
Name:    ${profile.displayName}
Age:     ${profile.age}
Stage:   ${profile.lastPeriodDate ? 'Menopause transition' : 'Menopause'}
HRT:     ${hrtContext}
${raceContext ? `Note:    ${raceContext}` : ''}

=== YOUR TASK ===
Write ONE care card message (2–3 sentences max) that tells a family member
exactly what to do or avoid right now, based on the symptom and mood state.

=== RULES ===
- Address the family member directly ("She needs...", "Try...", "Avoid...")
- Be SPECIFIC and ACTIONABLE — not vague ("be supportive")
- Warm but practical in tone
- No medical jargon
- All output in English
- Return ONLY the care card message, nothing else`;
}

// ---------------------------------------------------------------------------
// User content builder
// ---------------------------------------------------------------------------

/**
 * Build the user turn for care card generation.
 *
 * @param {string} symptomEmoji  - e.g. "😴"
 * @param {string} symptomName   - e.g. "Sleep Deprivation"
 * @param {string} weatherState  - "W1"–"W6"
 * @returns {string}
 */
export function buildCareCardUserContent(symptomEmoji, symptomName, weatherState) {
  const weatherLabel  = WEATHER_LABELS[weatherState] ?? weatherState;
  const weatherNote   = WEATHER_STATE_NOTES[weatherState] ?? '';

  return `Current symptom:  ${symptomEmoji} ${symptomName}
Current mood/weather state:  ${weatherLabel} ${weatherNote}

Write the care card message now.`;
}

// ---------------------------------------------------------------------------
// Weather state descriptions (context for Claude)
// ---------------------------------------------------------------------------

const WEATHER_STATE_NOTES = {
  W1: '(She is feeling good today — overall condition is clear/positive)',
  W2: '(She is doing okay — mild discomfort but managing well)',
  W3: '(She is feeling somewhat tired or heavy today)',
  W4: '(She is having a difficult day — lower mood and energy)',
  W5: '(She is having a very hard day — needs maximum care)',
  W6: '(She wants alone time right now — approach gently and minimally)',
};
