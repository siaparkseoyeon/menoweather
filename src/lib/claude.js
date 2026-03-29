/**
 * claude.js
 * Core Claude API integration for MenoWeather.
 * All AI-powered features route through this module.
 *
 * Model: claude-sonnet-4-20250514
 * API:   https://api.anthropic.com/v1/messages
 */

import {
  buildReportSystemPrompt,
  buildReportUserContent,
} from '../prompts/reportPrompt.js';
import {
  buildCareCardSystemPrompt,
  buildCareCardUserContent,
} from '../prompts/careCardPrompt.js';
import {
  buildEncyclopediaSystemPrompt,
  buildEncyclopediaUserContent,
} from '../prompts/encyclopediaPrompt.js';

const CLAUDE_MODEL  = 'claude-sonnet-4-20250514';
const MAX_TOKENS    = 1000;
const API_ENDPOINT = import.meta.env.DEV
  ? '/anthropic/v1/messages'   // proxied in dev (avoids CORS)
  : 'https://api.anthropic.com/v1/messages'; // direct in production

// ---------------------------------------------------------------------------
// Internal: base fetch wrapper
// ---------------------------------------------------------------------------

/**
 * Send a request to the Claude API.
 * Returns the raw Response so callers can choose streaming vs. non-streaming.
 *
 * @param {object} body - Full messages API request body (excluding model/max_tokens)
 * @param {boolean} stream - Enable server-sent-events streaming
 * @returns {Promise<Response>}
 */
async function callClaude(body, stream = false) {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
  if (!apiKey || apiKey === 'your_key_here') {
    throw new Error('NO_API_KEY');
  }

  const response = await fetch(API_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-allow-browser': 'true',
    },
    body: JSON.stringify({
      model:      CLAUDE_MODEL,
      max_tokens: MAX_TOKENS,
      stream,
      ...body,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(
      `Claude API error ${response.status}: ${err?.error?.message ?? 'Unknown error'}`
    );
  }

  return response;
}

// ---------------------------------------------------------------------------
// 1. Weekly Report  (streaming)
// ---------------------------------------------------------------------------

/**
 * Generate a personalized weekly symptom report.
 * Returns a ReadableStream of server-sent events.
 * Use readStream() below to consume it.
 *
 * @param {object} profile     - User onboarding profile
 * @param {object} ewmaScores  - { [symptomId]: float } current EWMA scores
 * @param {Array}  history     - Array of last 7 daily check-in objects
 * @returns {Promise<ReadableStream>}
 */
export async function generateReport(profile, ewmaScores, history) {
  const response = await callClaude(
    {
      system:   buildReportSystemPrompt(profile),
      messages: [
        {
          role:    'user',
          content: buildReportUserContent(ewmaScores, history),
        },
      ],
    },
    true // streaming
  );
  return response.body;
}

// ---------------------------------------------------------------------------
// 2. Care Card (non-streaming — short output)
// ---------------------------------------------------------------------------

/**
 * Dynamically generate a single care card message for the family view.
 * Replaces the static 48-cell CARE_MATRIX with AI-personalized content.
 *
 * @param {string} symptomEmoji   - e.g. "😴"
 * @param {string} symptomName    - e.g. "Sleep Deprivation"
 * @param {string} weatherState   - "W1"–"W6"
 * @param {object} profile        - User profile (for race/HRT/stage context)
 * @returns {Promise<string>}     - Care card message (1–2 sentences, English)
 */
export async function generateCareCard(
  symptomEmoji,
  symptomName,
  weatherState,
  profile
) {
  const response = await callClaude({
    system:   buildCareCardSystemPrompt(profile),
    messages: [
      {
        role:    'user',
        content: buildCareCardUserContent(symptomEmoji, symptomName, weatherState),
      },
    ],
  });

  const data    = await response.json();
  const content = data.content?.[0]?.text ?? '';
  return content.trim();
}

// ---------------------------------------------------------------------------
// 3. Encyclopedia AI Overlay (non-streaming — short output)
// ---------------------------------------------------------------------------

/**
 * Generate a one-line personalized overlay for a symptom catalog card.
 * Explains *why* this symptom is relevant to the user right now.
 *
 * @param {object} encyclopediaEntry - Full entry from ENCYCLOPEDIA_12
 * @param {object} profile           - User profile
 * @param {number} ewmaScore         - Current EWMA score for this symptom
 * @param {number} popupBonus        - Today's popup bonus score for this symptom
 * @returns {Promise<string>}        - Max 40 chars, no diagnosis language
 */
export async function generateEncyclopediaOverlay(
  encyclopediaEntry,
  profile,
  ewmaScore,
  popupBonus
) {
  const response = await callClaude({
    system:   buildEncyclopediaSystemPrompt(profile),
    messages: [
      {
        role:    'user',
        content: buildEncyclopediaUserContent(encyclopediaEntry, ewmaScore, popupBonus),
      },
    ],
  });

  const data    = await response.json();
  const content = data.content?.[0]?.text ?? '';
  return content.trim().slice(0, 80); // hard cap for UI safety
}

// ---------------------------------------------------------------------------
// Utility: consume a streaming response
// ---------------------------------------------------------------------------

/**
 * Read a Claude SSE stream and call onChunk for each text delta.
 * Resolves with the full accumulated text when the stream ends.
 *
 * Usage:
 *   const stream = await generateReport(profile, scores, history);
 *   const full   = await readStream(stream, (chunk) => setDisplayText(t => t + chunk));
 *
 * @param {ReadableStream} stream
 * @param {(chunk: string) => void} onChunk - called for every text delta
 * @returns {Promise<string>} - full accumulated text
 */
export async function readStream(stream, onChunk) {
  const reader  = stream.getReader();
  const decoder = new TextDecoder();
  let   fullText = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const lines = decoder.decode(value).split('\n');

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const data = line.slice(6).trim();
      if (data === '[DONE]') continue;

      try {
        const parsed = JSON.parse(data);
        // Handle both message_delta and content_block_delta formats
        const text =
          parsed?.delta?.text ??
          parsed?.content?.[0]?.text ??
          '';

        if (text) {
          fullText += text;
          onChunk(text);
        }
      } catch {
        // Ignore malformed SSE lines
      }
    }
  }

  return fullText;
}
