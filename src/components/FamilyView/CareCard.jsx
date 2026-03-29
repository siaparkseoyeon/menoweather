/**
 * CareCard.jsx
 * Family-view care card — powered by Claude API.
 *
 * Falls back to the static CARE_MATRIX if the API is unavailable,
 * ensuring the family view always shows something useful.
 */

import { useState, useEffect } from 'react';
import { generateCareCard } from '../../lib/claude.js';
import { CARE_MATRIX, CARE_CARD_CSS } from '../../lib/constants.js';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * @param {object} props
 * @param {string} props.symptomEmoji   - e.g. "😴"
 * @param {string} props.symptomName    - e.g. "Sleep Disturbances"
 * @param {string} props.weatherState   - "W1"–"W6"
 * @param {object} props.profile        - User profile (for personalization)
 * @param {boolean} props.useAI         - If false, always use static fallback
 */
export default function CareCard({
  symptomEmoji,
  symptomName,
  weatherState,
  profile,
  useAI = true,
}) {
  const [message,   setMessage]   = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [usedAI,    setUsedAI]    = useState(false);

  const cssClass = CARE_CARD_CSS[symptomEmoji] ?? 'mood';

  useEffect(() => {
    let cancelled = false;

    async function fetchCard() {
      // Static fallback: use immediately so UI is never blank
      const staticMsg = CARE_MATRIX[symptomEmoji]?.[weatherState] ?? '';
      setMessage(staticMsg);

      if (!useAI || !profile) return;

      setIsLoading(true);
      try {
        const aiMsg = await generateCareCard(
          symptomEmoji,
          symptomName,
          weatherState,
          profile
        );
        if (!cancelled && aiMsg) {
          setMessage(aiMsg);
          setUsedAI(true);
        }
      } catch (err) {
        // Silently keep the static fallback — never show an error in family view
        console.warn('[CareCard] AI generation failed, using static fallback:', err.message);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    fetchCard();
    return () => { cancelled = true; };
  }, [symptomEmoji, symptomName, weatherState, profile, useAI]);

  return (
    <div className={`care-card ${cssClass}`}>
      <div className="care-badge">
        {symptomEmoji}
        <span className="care-badge-label">{symptomName}</span>
        {usedAI && <span className="ai-badge" title="Personalized by Claude">✨</span>}
      </div>

      <div className="care-msg">
        {isLoading ? (
          <span className="care-loading">Personalizing...</span>
        ) : (
          message
        )}
      </div>
    </div>
  );
}
