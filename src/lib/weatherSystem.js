/**
 * weatherSystem.js
 * Determines the weather state (W1–W6) shown in the family view.
 *
 * Priority order (P1 wins over P2, etc.):
 *   P1 — Alone mode (Q11 "yes") → W6 Foggy (overrides everything)
 *   P2 — [reserved for future wearable heart-rate override]
 *   P3 — Latest mood popup response (Q01 / Q09 / Q12)
 *   P4 — Today's daily check-in state score (①)
 *   P5 — Yesterday's last valid state
 *   P6 — Default: W3 Overcast (neutral)
 */

// ---------------------------------------------------------------------------
// Weather state definitions
// ---------------------------------------------------------------------------

export const WEATHER_DEFS = {
  W1: {
    icon:       '☀️',
    label:      'Clear',
    title:      'Having a great day',
    desc:       'She is feeling really good today.',
    bg:         'linear-gradient(135deg,#FFFDE7,#FFF9C4)',
    scoreColor: '#F57F17',
  },
  W2: {
    icon:       '🌤️',
    label:      'Partly Cloudy',
    title:      'Doing okay',
    desc:       'She is getting through the day without major issues.',
    bg:         'linear-gradient(135deg,#FFF8E1,#FFECB3)',
    scoreColor: '#FF8F00',
  },
  W3: {
    icon:       '☁️',
    label:      'Overcast',
    title:      'A little tired today',
    desc:       'She seems a bit worn out.',
    bg:         'linear-gradient(135deg,#F5F5F5,#EEEEEE)',
    scoreColor: '#757575',
  },
  W4: {
    icon:       '🌧️',
    label:      'Rainy',
    title:      'Having a rough day',
    desc:       'Today is harder than usual.',
    bg:         'linear-gradient(135deg,#E3F2FD,#BBDEFB)',
    scoreColor: '#1565C0',
  },
  W5: {
    icon:       '⛈️',
    label:      'Stormy',
    title:      'Having a very hard day',
    desc:       'She needs extra care today. Please be gentle.',
    bg:         'linear-gradient(135deg,#EDE7F6,#D1C4E9)',
    scoreColor: '#4527A0',
  },
  W6: {
    icon:       '🌫️',
    label:      'Foggy',
    title:      'Needs alone time',
    desc:       'She needs some quiet time to herself right now.',
    bg:         'linear-gradient(135deg,#F3E5F5,#E1BEE7)',
    scoreColor: '#6A1B9A',
  },
};

export const WEATHER_LABELS = Object.fromEntries(
  Object.entries(WEATHER_DEFS).map(([k, v]) => [k, v.label])
);

// Maps a 1–5 mood score to a weather state
export const SCORE_TO_WEATHER = { 5: 'W1', 4: 'W2', 3: 'W3', 2: 'W4', 1: 'W5' };

// ---------------------------------------------------------------------------
// Weather state resolver
// ---------------------------------------------------------------------------

/**
 * Determine the current weather state for the family view.
 *
 * @param {object} params
 * @param {boolean} params.aloneMode         - Q11 "yes" was answered
 * @param {number|null} params.latestMoodPopup - Most recent mood popup score (1–5)
 * @param {object|null} params.todayCheckin    - Today's daily check-in object
 * @param {object|null} params.yesterdayCheckin - Yesterday's check-in (fallback)
 * @returns {string}  Weather state key: "W1"–"W6"
 */
export function getWeatherState({ aloneMode, latestMoodPopup, todayCheckin, yesterdayCheckin }) {
  // P1: Alone mode — highest priority, overrides everything
  if (aloneMode) return 'W6';

  // P3: Most recent mood popup response
  if (latestMoodPopup != null) {
    return SCORE_TO_WEATHER[latestMoodPopup] ?? 'W3';
  }

  // P4: Today's daily check-in state score
  if (todayCheckin?.moodEmoji != null) {
    return SCORE_TO_WEATHER[todayCheckin.moodEmoji] ?? 'W3';
  }

  // P5: Yesterday's last valid data
  if (yesterdayCheckin?.moodEmoji != null) {
    return SCORE_TO_WEATHER[yesterdayCheckin.moodEmoji] ?? 'W3';
  }

  // P6: Default neutral state
  return 'W3';
}
