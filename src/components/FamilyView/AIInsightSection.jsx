/**
 * AIInsightSection.jsx
 * AI Insight 기능 (v3.0 설계서 기준)
 * ① 패턴 분석 4종 · ② 이번 주 7일 예보
 * Claude API → 스트리밍 없음, JSON 응답
 */

import { useState, useEffect, useRef } from 'react';

// ─────────────────────────────────────────────
// 날씨 아이콘 매핑 (Part 3-B)
// ─────────────────────────────────────────────
function scoreToWeather(score) {
  if (score <= 1.8) return { icon: '☀️', label: 'Clear',        code: 'W1', color: '#FFF9C4', text: '#A08000' };
  if (score <= 2.6) return { icon: '🌤️', label: 'Partly Cloudy', code: 'W2', color: '#FFF3CD', text: '#8A6D00' };
  if (score <= 3.4) return { icon: '☁️',  label: 'Overcast',     code: 'W3', color: '#F5F5F5', text: '#666'    };
  if (score <= 4.2) return { icon: '🌧️', label: 'Rainy',        code: 'W4', color: '#E3F2FD', text: '#1565C0' };
  return              { icon: '⛈️',  label: 'Stormy',       code: 'W5', color: '#EDE7F6', text: '#4527A0' };
}

const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

// ─────────────────────────────────────────────
// Claude API 호출
// ─────────────────────────────────────────────
async function callInsightAPI(prompt) {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;

  // Demo fallback if no API key
  if (!apiKey || apiKey === 'your_key_here') {
    await new Promise(r => setTimeout(r, 1200));
    return null; // triggers demo mode
  }

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-allow-browser': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }],
      system: `You are a menopause health data analyst for a family support app.
Analyze symptom EWMA data and return ONLY valid JSON. No markdown, no explanation.
Rules:
- Never use diagnostic language ("you may have", "suggests condition")
- Never mention: vaginal_dryness, bladder, weight, BMI, HRT details, skin, hair, smoking
- Never use the word "brainfog" → use "focus & memory difficulty"  
- Soften negative predictions: never say "will worsen" → say "may need extra care"
- All insight text must be warm, supportive, family-friendly`,
    }),
  });

  if (!res.ok) return null;
  const data = await res.json();
  const text = data.content?.[0]?.text ?? '';
  try {
    const clean = text.replace(/```json|```/g, '').trim();
    return JSON.parse(clean);
  } catch { return null; }
}

// ─────────────────────────────────────────────
// Demo data builders (when no API key)
// ─────────────────────────────────────────────
function getDemoInsights(name) {
  return {
    patterns: [
      {
        type: 'time_pattern',
        icon: '🕕',
        title: 'Evening Peak Pattern',
        body: `${name}'s hot flash symptoms are 1.7× stronger in the evening (6–9 PM). This is the most consistent pattern in the past 30 days.`,
        tip: '💛 Keep the home cooler in the evenings, especially after dinner.',
        confidence: 'high',
      },
      {
        type: 'weekday_pattern',
        icon: '📅',
        title: 'Mid-Week is Hardest',
        body: 'Wednesday and Thursday show consistently higher symptom scores — about 22% above the weekly average.',
        tip: '💛 Mid-week is a good time to ease up on plans and check in on her.',
        confidence: 'high',
      },
      {
        type: 'exercise_sleep',
        icon: '🏃',
        title: 'Exercise Improves Sleep',
        body: 'On days after light exercise, sleep quality scores improve by an average of 0.8 points. The correlation is consistent.',
        tip: '💛 A short walk together could make a real difference the next morning.',
        confidence: 'medium',
      },
      {
        type: 'seasonal',
        icon: '🌡️',
        title: 'Temperature Sensitivity',
        body: 'Hot flash scores rise with outdoor temperature. As warmer weather arrives, she may need extra support on hotter days.',
        tip: '💛 Keep the AC running on warm days — it\'s not a preference, it\'s relief.',
        confidence: 'medium',
      },
    ],
    forecast: Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const base = 3.1;
      const mult = [1.0, 1.05, 1.18, 1.22, 1.15, 0.9, 0.85][i];
      const score = parseFloat(Math.min(5, Math.max(1, base * mult)).toFixed(1));
      return {
        dow: DAYS[d.getDay()],
        date: `${d.getMonth()+1}/${d.getDate()}`,
        score,
        isToday: i === 0,
        confidence: i < 3 ? 'high' : i < 5 ? 'medium' : 'low',
      };
    }),
  };
}

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────
export default function AIInsightSection({ data, top3, profile }) {
  const [insights,  setInsights]  = useState(null);
  const [loading,   setLoading]   = useState(false);
  const [expanded,  setExpanded]  = useState(null);
  const hasGenerated = useRef(false); // ★ 한 번만 생성
  const name = profile?.displayName ?? 'Jane';

  useEffect(() => {
    if (!data?.length || !top3?.length) return;
    if (hasGenerated.current) return; // 이미 생성됨 — 스킵
    hasGenerated.current = true;
    generateInsights();
  }, []);

  const generateInsights = async () => {
    setLoading(true);
    try {
      // Build data summary for Claude
      const recentScores = data.slice(-14).map(d => ({
        date: d.dateStr,
        top3: top3.map(s => ({ sym: s.name, score: d.scores[s.id]?.toFixed(1) })),
        mood: d.mood_display?.toFixed(1),
      }));

      const avgByDow = {};
      data.forEach(d => {
        const dow = d.date ? DAYS[d.date.getDay()] : 'Mon';
        if (!avgByDow[dow]) avgByDow[dow] = [];
        avgByDow[dow].push(top3[0] ? d.scores[top3[0].id] : 3);
      });

      const prompt = `Analyze this menopause symptom EWMA data for "${name}" and generate insights.

Top 3 symptoms: ${top3.map(s => `${s.name}(avg:${s.avg.toFixed(1)})`).join(', ')}
Recent 14-day data sample: ${JSON.stringify(recentScores.slice(-7))}
Day-of-week averages for top symptom: ${JSON.stringify(Object.fromEntries(Object.entries(avgByDow).map(([k,v])=>[k,(v.reduce((a,b)=>a+b,0)/v.length).toFixed(1)])))}

Return JSON exactly like this:
{
  "patterns": [
    {
      "type": "time_pattern",
      "icon": "🕕",
      "title": "Short title (max 5 words)",
      "body": "1-2 sentence insight about the pattern. Warm, family-friendly tone.",
      "tip": "💛 One practical care tip for the family member.",
      "confidence": "high"
    },
    {
      "type": "weekday_pattern",
      "icon": "📅",
      "title": "Short title",
      "body": "Weekday pattern insight.",
      "tip": "💛 Care tip.",
      "confidence": "high"
    },
    {
      "type": "exercise_sleep",
      "icon": "🏃",
      "title": "Short title",
      "body": "Exercise-sleep correlation insight.",
      "tip": "💛 Care tip.",
      "confidence": "medium"
    },
    {
      "type": "seasonal",
      "icon": "🌡️",
      "title": "Short title",
      "body": "Temperature/seasonal insight.",
      "tip": "💛 Care tip.",
      "confidence": "medium"
    }
  ],
  "forecast": [
    {"dow": "Sun", "date": "M/D", "score": 2.8, "isToday": true, "confidence": "high"},
    {"dow": "Mon", "date": "M/D", "score": 3.1, "isToday": false, "confidence": "high"},
    {"dow": "Tue", "date": "M/D", "score": 3.5, "isToday": false, "confidence": "high"},
    {"dow": "Wed", "date": "M/D", "score": 3.8, "isToday": false, "confidence": "medium"},
    {"dow": "Thu", "date": "M/D", "score": 3.6, "isToday": false, "confidence": "medium"},
    {"dow": "Fri", "date": "M/D", "score": 3.2, "isToday": false, "confidence": "low"},
    {"dow": "Sat", "date": "M/D", "score": 2.9, "isToday": false, "confidence": "low"}
  ]
}`;

      const result = await callInsightAPI(prompt);
      setInsights(result ?? getDemoInsights(name));
    } catch {
      setInsights(getDemoInsights(name));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '28px 0', color: 'var(--mid)' }}>
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          border: '3px solid var(--warm-200)', borderTopColor: 'var(--coral)',
          animation: 'spin .8s linear infinite', margin: '0 auto 12px',
        }}/>
        <p style={{ fontSize: 13, fontWeight: 300 }}>Analyzing {name}'s patterns...</p>
      </div>
    );
  }

  if (!insights) return null;

  const { patterns, forecast } = insights;

  return (
    <div>
      {/* ── 섹션 헤더 ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <p className="card-label" style={{ marginBottom: 0, fontSize: 13 }}>
          ✨ AI Insights
        </p>
        <button
          onClick={generateInsights}
          style={{
            background: 'none', border: '1px solid var(--warm-200)',
            borderRadius: 8, padding: '4px 10px', fontSize: 11,
            color: 'var(--mid)', cursor: 'pointer',
          }}
        >
          Refresh
        </button>
      </div>

      {/* ── ① 패턴 분석 카드 ── */}
      {patterns?.map((p, i) => (
        <PatternCard
          key={p.type}
          pattern={p}
          isOpen={expanded === i}
          onToggle={() => setExpanded(expanded === i ? null : i)}
        />
      ))}

      {/* ── ② 이번 주 7일 예보 ── */}
      <div className="card" style={{ padding: '16px 18px', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
          <span style={{ fontSize: 16 }}>🔮</span>
          <p className="card-label" style={{ marginBottom: 0 }}>7-Day Forecast</p>
          <span style={{
            marginLeft: 'auto', fontSize: 10, color: 'var(--light)',
            background: 'var(--warm-100)', padding: '2px 8px', borderRadius: 10,
          }}>
            Based on her patterns
          </span>
        </div>

        {/* 예보 행 */}
        <div style={{ display: 'flex', gap: 3 }}>
          {forecast?.map((day, i) => {
            const w = scoreToWeather(day.score);
            return (
              <div key={i} style={{
                flex: 1, display: 'flex', flexDirection: 'column',
                alignItems: 'center', gap: 3,
                padding: '8px 2px',
                minWidth: 0,
                background: day.isToday ? 'var(--warm-100)' : 'transparent',
                borderRadius: 12,
                border: day.isToday ? '1.5px solid var(--warm-200)' : '1.5px solid transparent',
              }}>
                <span style={{
                  fontSize: 9.5, fontWeight: day.isToday ? 600 : 400,
                  color: day.isToday ? 'var(--coral)' : 'var(--mid)',
                  whiteSpace: 'nowrap',
                }}>
                  {day.isToday ? 'Today' : day.dow}
                </span>
                <span style={{ fontSize: 20 }}>{w.icon}</span>
                <span style={{ fontSize: 10.5, color: w.text, fontWeight: 500 }}>
                  {day.score}
                </span>
                <div style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: day.confidence === 'high' ? '#7AAE9B' : day.confidence === 'medium' ? '#E8943A' : 'var(--warm-200)',
                }} title={`${day.confidence} confidence`}/>
              </div>
            );
          })}
        </div>

        {/* 범례 */}
        <div style={{ display: 'flex', gap: 12, marginTop: 12, flexWrap: 'wrap' }}>
          {[['☀️','Low difficulty'],['☁️','Moderate'],['🌧️','Higher — check in']].map(([icon, label]) => (
            <span key={icon} style={{ fontSize: 10, color: 'var(--light)', display: 'flex', alignItems: 'center', gap: 3 }}>
              {icon} {label}
            </span>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 12, marginTop: 6 }}>
          {[['#7AAE9B','High confidence'],['#E8943A','Medium'],['var(--warm-200)','Low']].map(([color, label]) => (
            <span key={label} style={{ fontSize: 10, color: 'var(--light)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: color }}/>
              {label}
            </span>
          ))}
        </div>

        <p style={{ fontSize: 10.5, color: 'var(--light)', marginTop: 12, lineHeight: 1.5, fontStyle: 'italic' }}>
          * Forecast is based on her historical symptom patterns and day-of-week trends. It may need extra care if actuals differ.
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Pattern Card
// ─────────────────────────────────────────────
function PatternCard({ pattern, isOpen, onToggle }) {
  const CONF_COLORS = { high: '#7AAE9B', medium: '#E8943A', low: 'var(--light)' };
  const CONF_LABELS = { high: 'High confidence', medium: 'Medium', low: 'Low' };

  return (
    <div
      className="card"
      style={{ padding: 0, marginBottom: 10, overflow: 'hidden', cursor: 'pointer' }}
      onClick={onToggle}
    >
      {/* 헤더 행 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px' }}>
        <span style={{
          width: 36, height: 36, borderRadius: 10,
          background: 'var(--warm-100)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18, flexShrink: 0,
        }}>{pattern.icon}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--deep)', lineHeight: 1.3 }}>
            {pattern.title}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 3 }}>
            <div style={{
              width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
              background: CONF_COLORS[pattern.confidence],
            }}/>
            <span style={{ fontSize: 10, color: 'var(--light)' }}>
              {CONF_LABELS[pattern.confidence]}
            </span>
          </div>
        </div>
        <span style={{
          fontSize: 14, color: 'var(--light)',
          transform: isOpen ? 'rotate(180deg)' : 'none',
          transition: 'transform .2s',
        }}>›</span>
      </div>

      {/* 펼침 내용 */}
      {isOpen && (
        <div style={{
          padding: '0 18px 16px',
          borderTop: '1px solid var(--warm-100)',
          animation: 'fadeUp .2s ease',
        }}>
          <p style={{ fontSize: 13, color: 'var(--deep)', lineHeight: 1.7, marginBottom: 10, marginTop: 12 }}>
            {pattern.body}
          </p>
          <div style={{
            background: 'var(--green-bg)', borderRadius: 10,
            padding: '10px 13px', fontSize: 12.5,
            color: 'var(--green-dark)', lineHeight: 1.6,
          }}>
            {pattern.tip}
          </div>
        </div>
      )}
    </div>
  );
}
