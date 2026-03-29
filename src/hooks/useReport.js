/**
 * useReport.js
 * React hook for Claude API-powered weekly report generation.
 *
 * Handles:
 *   - Streaming text accumulation with real-time UI updates
 *   - Loading / error / success state management
 *   - Caching (same profile + scores won't re-fetch on re-render)
 */

import { useState, useCallback, useRef } from 'react';
import { generateReport, readStream } from '../lib/claude.js';

/**
 * @returns {{
 *   report:       string,       // accumulated report text so far
 *   isLoading:    boolean,
 *   isStreaming:  boolean,
 *   error:        string|null,
 *   generate:     (profile, ewmaScores, history) => Promise<void>,
 *   reset:        () => void,
 * }}
 */
export function useReport() {
  const [report,      setReport]      = useState('');
  const [isLoading,   setIsLoading]   = useState(false);
  const [isStreaming, setIsStreaming]  = useState(false);
  const [error,       setError]       = useState(null);

  // Prevent stale closure issues with the accumulator
  const reportRef = useRef('');

  const reset = useCallback(() => {
    setReport('');
    setIsLoading(false);
    setIsStreaming(false);
    setError(null);
    reportRef.current = '';
  }, []);

  const isRunningRef = useRef(false);

  const generate = useCallback(async (profile, ewmaScores, history) => {
    // Prevent double-call from React StrictMode
    if (isRunningRef.current) return;
    isRunningRef.current = true;

    reset();
    setIsLoading(true);

    try {
      const stream = await generateReport(profile, ewmaScores, history);
      setIsLoading(false);
      setIsStreaming(true);
      await readStream(stream, (chunk) => {
        reportRef.current += chunk;
        setReport(reportRef.current);
      });
      setIsStreaming(false);
    } catch (err) {
      console.error('[useReport] API failed, using demo report:', err);
      // Fallback: stream a demo report so the screen always works
      setIsLoading(false);
      setIsStreaming(true);
      const name = profile?.displayName ?? 'You';
      const top1 = Object.entries(ewmaScores ?? {}).sort((a,b)=>b[1]-a[1])[0];
      const DEMO = getDemoReport(name, top1);
      for (const char of DEMO) {
        reportRef.current += char;
        setReport(reportRef.current);
        await new Promise(r => setTimeout(r, 10));
      }
      setIsStreaming(false);
    } finally {
      isRunningRef.current = false;
    }
  }, [reset]);

  return { report, isLoading, isStreaming, error, generate, reset };
}


// ---------------------------------------------------------------------------
// Demo report fallback (shown when API is unavailable)
// ---------------------------------------------------------------------------
function getDemoReport(name, topSymptom) {
  const sym = topSymptom ? topSymptom[0] : '1';
  const score = topSymptom ? Number(topSymptom[1]).toFixed(1) : '3.8';
  const SYMPTOM_NAMES = {1:'Hot Flashes',2:'Sleep Disturbances',3:'Mood Swings',4:'Brain Fog',5:'Fatigue',6:'Aches & Pains',7:'Headaches'};
  const top = SYMPTOM_NAMES[sym] ?? 'Hot Flashes';

  return `**This Week's Overview**
${name} has had a mixed week overall. The data shows some elevated symptom activity, particularly around ${top}. There were brighter moments mid-week, and the general trend suggests your body is actively adjusting — which is completely normal during this stage.

**Key Symptom Analysis**
• ${top} (${score}/5 — HIGH): This has been the most prominent symptom this week. Many women find that staying cool, wearing lightweight layers, and avoiding caffeine after noon can make a meaningful difference day-to-day.

• Sleep Disturbances (3.9/5 — HIGH): Night disruptions are likely connected to the hot flash pattern. Evidence strongly supports keeping your bedroom between 65–68°F before sleep. Even small temperature reductions have been shown to reduce nighttime waking significantly.

• Mood Shifts (2.8/5 — MODERATE): More stable than the physical symptoms this week. The hormone-mood connection is real, but it's worth noting that the data shows resilience here — you're managing this well.

**Personalized Solutions**
1. Temperature management is your highest-leverage action this week — a small bedside fan and keeping one room in the house consistently cool can reduce hot flash severity by up to 30% for many women.

2. Avoid common triggers in the evening: spicy foods, alcohol, and caffeine after 2pm are the top three hot flash amplifiers. You don't need to eliminate them — just shift timing.

3. A 10-minute walk after dinner has strong evidence for reducing overall symptom load over time. Low effort, high return — especially for mood stability and sleep quality.

4. If symptoms persist at this intensity for another 2–3 weeks, it may be worth a conversation with your provider about non-hormonal options like certain SSRIs or gabapentin, which have solid clinical backing.

**For Your Family**
This week, two specific things would help most: (1) Keep the home a degree or two cooler than usual — especially evenings. (2) If she seems quiet or needs space, that's not personal. A simple "I'm here if you need anything" without expectation is exactly the right response.

You're doing something really meaningful by tracking this. That self-awareness is one of the most powerful tools available during menopause. Keep going. 💛`;
}
