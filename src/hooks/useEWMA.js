/**
 * useEWMA.js
 * React hook for managing EWMA symptom scores.
 * Persists scores to localStorage so they survive page reloads.
 */

import { useState, useCallback } from 'react';
import {
  initEWMAFromOnboarding,
  applyDailyResponses,
  getTop3,
  getActiveEmojis,
} from '../lib/ewma.js';
import { SYMPTOMS_9 } from '../lib/constants.js';

const STORAGE_KEY = 'mw_ewma_scores';

function loadStoredScores() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveScores(scores) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(scores));
  } catch {
    // Storage may be unavailable — fail silently
  }
}

/**
 * @param {object} profile - User onboarding profile (used to init scores)
 */
export function useEWMA(profile) {
  const [scores, setScores] = useState(() => {
    // Prefer stored scores; fall back to onboarding baseline
    return loadStoredScores() ?? (profile ? initEWMAFromOnboarding(profile) : {});
  });

  // Initialize scores from onboarding (called once after onboarding completes)
  const initFromProfile = useCallback((p) => {
    const initial = initEWMAFromOnboarding(p);
    setScores(initial);
    saveScores(initial);
  }, []);

  // Apply a full set of daily responses and persist
  const applyResponses = useCallback((responses) => {
    setScores((prev) => {
      const updated = applyDailyResponses(prev, responses);
      saveScores(updated);
      return updated;
    });
  }, []);

  // Derived values
  const top3        = getTop3(scores, SYMPTOMS_9);
  const activeEmojis = (popupBonus, dailyBonus, ghostMode) =>
    getActiveEmojis(scores, popupBonus, dailyBonus, ghostMode, SYMPTOMS_9);

  return {
    scores,
    top3,
    activeEmojis,
    initFromProfile,
    applyResponses,
  };
}
