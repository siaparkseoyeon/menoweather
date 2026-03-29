/**
 * FamilyTrendContent.jsx
 * 트렌드 콘텐츠 공유 컴포넌트
 * ReportScreen(대상자)과 FamilyTrendScreen(가족) 양쪽에서 사용
 */

import { useState, useEffect, useRef } from 'react';
import AIInsightSection from './AIInsightSection.jsx';

// ─────────────────────────────────────────────
// 상수
// ─────────────────────────────────────────────
const ALLOWED = [
  { id: 'hotflash',  name: 'Hot Flashes',       emoji: '😳', color: '#E8793A', dimColor: '#FDEEE6' },
  { id: 'sleep',     name: 'Sleep Disturbances', emoji: '😴', color: '#7AA8C4', dimColor: '#EBF2F7' },
  { id: 'mood_sym',  name: 'Mood Swings',        emoji: '😤', color: '#C46B9A', dimColor: '#FDEEF6' },
  { id: 'brainfog',  name: 'Focus & Memory',     emoji: '😵', color: '#7AAE9B', dimColor: '#EBF4F1' },
  { id: 'fatigue',   name: 'Fatigue',            emoji: '😩', color: '#B89040', dimColor: '#FBF3E0' },
  { id: 'joint',     name: 'Aches & Pains',      emoji: '🥴', color: '#9A7AB4', dimColor: '#F2EBF7' },
  { id: 'headache',  name: 'Headaches',          emoji: '🤕', color: '#C4847A', dimColor: '#FDEEE8' },
];

const SCORE_LABEL = { 5: 'Very Hard', 4: 'Hard', 3: 'Moderate', 2: 'Good', 1: 'Comfortable' };

const TOOLTIP_CARE = {
  sleep:    'Keep mornings quiet for her.',
  hotflash: 'Lower the room temperature.',
  mood_sym: 'Stay calmly by her side.',
  brainfog: 'Leave notes instead of reminders.',
  fatigue:  'Share household tasks today.',
  joint:    'Carry heavy things for her.',
  headache: 'Reduce noise and bright lights.',
};

const PERIOD_TABS = [
  { key: '7d',  label: '7 Days'   },
  { key: '30d', label: '30 Days'  },
  { key: '3m',  label: '3 Months' },
  { key: '1y',  label: '1 Year'   },
];

// ─────────────────────────────────────────────
// 데모 데이터 생성
// ─────────────────────────────────────────────
function generateDemoData(days) {
  const result = [];
  const now = new Date();
  let prevScores = { hotflash: 4.2, sleep: 3.9, mood_sym: 2.8, brainfog: 3.1, fatigue: 3.5, joint: 2.9, headache: 2.3 };
  let prevMood = 3.5;

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(now.getDate() - i);
    const scores = {};
    ALLOWED.forEach(s => {
      const delta = (Math.random() - 0.48) * 0.6;
      prevScores[s.id] = Math.max(1, Math.min(5, prevScores[s.id] * 0.7 + (prevScores[s.id] + delta) * 0.3));
      scores[s.id] = parseFloat(prevScores[s.id].toFixed(2));
    });
    const moodRaw = Math.max(1, Math.min(5, prevMood * 0.7 + (prevMood + (Math.random() - 0.5) * 0.8) * 0.3));
    prevMood = moodRaw;
    result.push({
      date,
      dateStr: `${date.getMonth() + 1}/${date.getDate()}`,
      scores,
      mood_raw: parseFloat(moodRaw.toFixed(2)),
      mood_display: parseFloat((6 - moodRaw).toFixed(2)),
    });
  }
  return result;
}

function aggregateMonthly(data) {
  const months = {};
  data.forEach(d => {
    const key = d.date.toLocaleString('en', { month: 'short', year: '2-digit' });
    if (!months[key]) months[key] = { dateStr: key, scores: {}, mood_display: [], _counts: {} };
    ALLOWED.forEach(s => {
      months[key].scores[s.id] = (months[key].scores[s.id] || 0) + d.scores[s.id];
      months[key]._counts[s.id] = (months[key]._counts[s.id] || 0) + 1;
    });
    months[key].mood_display.push(d.mood_display);
  });
  return Object.values(months).map(m => ({
    ...m,
    scores: Object.fromEntries(ALLOWED.map(s => [s.id, parseFloat((m.scores[s.id] / m._counts[s.id]).toFixed(2))])),
    mood_display: parseFloat((m.mood_display.reduce((a, b) => a + b, 0) / m.mood_display.length).toFixed(2)),
  }));
}

function getTop3(data) {
  return ALLOWED.map(s => ({
    ...s,
    avg: data.reduce((sum, d) => sum + d.scores[s.id], 0) / data.length,
  })).sort((a, b) => b.avg - a.avg).slice(0, 3);
}

function buildFlowSegments(data, top3Ids) {
  const segments = [];
  let cur = null;
  data.forEach((d, i) => {
    const top1Id = ALLOWED
      .filter(s => top3Ids.includes(s.id))
      .sort((a, b) => d.scores[b.id] - d.scores[a.id])[0]?.id;
    if (!cur || cur.id !== top1Id) {
      if (cur) segments.push({ ...cur, end: i - 1, count: i - cur.start });
      cur = { id: top1Id, start: i };
    }
  });
  if (cur) segments.push({ ...cur, end: data.length - 1, count: data.length - cur.start });
  return segments.map(s => ({ ...s, pct: (s.count / data.length) * 100 }));
}

// ─────────────────────────────────────────────
// Main export
// ─────────────────────────────────────────────
export default function FamilyTrendContent({ profile, ewmaScores, history, isFamily = false }) {
  const [period,  setPeriod]  = useState('30d');
  const [tooltip, setTooltip] = useState(null);
  const canvasRef = useRef(null);
  const chartRef  = useRef(null);

  // ★ 데이터를 ref로 고정 — 스트리밍 리렌더링 시 재생성 방지
  const dataCache = useRef({});
  const getRawData = (p) => {
    if (!dataCache.current[p]) {
      const days = p === '7d' ? 7 : p === '30d' ? 30 : p === '3m' ? 90 : 365;
      dataCache.current[p] = generateDemoData(days);
    }
    return dataCache.current[p];
  };

  const rawData = getRawData(period);

  const data     = period === '1y' ? aggregateMonthly(rawData) : rawData;
  const top3     = getTop3(data);
  const top3Ids  = top3.map(s => s.id);
  const segments = buildFlowSegments(data, top3Ids);

  // 요약 카드
  const avgMoodDisplay = data.reduce((s, d) => s + d.mood_display, 0) / data.length;
  const worstDay       = [...data].sort((a, b) => b.mood_display - a.mood_display)[0];
  const top1Avg        = top3[0]?.avg.toFixed(1) ?? '—';
  const top2Score      = top3[1]?.avg.toFixed(1) ?? '—';

  useEffect(() => {
    if (!canvasRef.current) return;
    const loadChart = async () => {
      if (typeof window.Chart === 'undefined') {
        await new Promise(resolve => {
          const s = document.createElement('script');
          s.src = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.0/chart.umd.min.js';
          s.onload = resolve;
          document.head.appendChild(s);
        });
      }
      if (chartRef.current) chartRef.current.destroy();

      chartRef.current = new window.Chart(canvasRef.current, {
        type: 'line',
        data: {
          labels: data.map(d => d.dateStr ?? ''),
          datasets: [
            { label: 'Mood', data: data.map(d => d.mood_display), borderColor: '#C9A227', borderWidth: 2.5, pointRadius: 0, tension: 0.4, fill: false, order: 0 },
            { label: top3[0]?.name, data: data.map(d => d.scores[top3[0]?.id]), borderColor: '#534AB7', borderWidth: 1.5, pointRadius: 0, tension: 0.4, order: 1 },
            { label: top3[1]?.name, data: data.map(d => d.scores[top3[1]?.id]), borderColor: '#7F77DD', borderWidth: 1.5, pointRadius: 0, tension: 0.4, order: 2 },
            { label: top3[2]?.name, data: data.map(d => d.scores[top3[2]?.id]), borderColor: '#AFA9EC', borderWidth: 1.5, borderDash: [4, 3], pointRadius: 0, tension: 0.4, order: 3 },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: { mode: 'index', intersect: false },
          onClick: (_, els) => {
            if (!els.length) return;
            const idx = els[0].index;
            const d = data[idx];
            setTooltip({
              dateStr: d.dateStr,
              mood: SCORE_LABEL[Math.round(d.mood_display)] ?? '—',
              symptoms: top3.map(s => ({ name: s.name, label: SCORE_LABEL[Math.round(d.scores[s.id])] ?? '—', emoji: s.emoji })),
              care: TOOLTIP_CARE[top3[0]?.id] ?? '',
            });
          },
          plugins: { legend: { display: false }, tooltip: { enabled: false } },
          scales: {
            x: { grid: { display: false }, ticks: { font: { size: 10 }, color: '#B89882', maxTicksLimit: 6 } },
            y: { min: 1, max: 5, grid: { color: 'rgba(237,217,197,.4)' }, ticks: { stepSize: 1, font: { size: 10 }, color: '#B89882', callback: v => SCORE_LABEL[v] ?? '' } },
          },
        },
      });
    };
    loadChart();
    return () => { if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null; } };
  }, [period]);

  return (
    <div>
      {/* 기간 탭 */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        {PERIOD_TABS.map(t => (
          <button key={t.key} onClick={() => setPeriod(t.key)} style={{
            flex: 1, padding: '8px 0', border: 'none', borderRadius: 10, cursor: 'pointer',
            fontSize: 12, fontWeight: period === t.key ? 600 : 400,
            background: period === t.key ? 'var(--coral)' : 'white',
            color: period === t.key ? 'white' : 'var(--mid)',
            boxShadow: period === t.key ? '0 3px 10px rgba(212,113,90,.3)' : '0 1px 4px var(--shadow)',
            transition: 'all .2s',
          }}>{t.label}</button>
        ))}
      </div>

      {/* 요약 카드 4개 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
        <SummaryCard label="Avg. Mood"         value={SCORE_LABEL[Math.round(avgMoodDisplay)] ?? '—'} sub={avgMoodDisplay.toFixed(1) + ' / 5.0'} color="#C9A227"       icon="🌡️" />
        <SummaryCard label="Top Symptom Avg"   value={top3[0]?.name ?? '—'}                           sub={top1Avg + ' / 5.0'}                    color="#534AB7"       icon={top3[0]?.emoji ?? '😳'} />
        <SummaryCard label="Hardest Day"       value={worstDay?.dateStr ?? '—'}                       sub={SCORE_LABEL[Math.round(worstDay?.mood_display)] ?? '—'} color="var(--coral)" icon="📅" />
        <SummaryCard label="2nd Symptom"       value={top3[1]?.name ?? '—'}                           sub={top2Score + ' / 5.0'}                  color="#7F77DD"       icon={top3[1]?.emoji ?? '😴'} />
      </div>

      {/* 추이 그래프 */}
      <div className="card" style={{ padding: '16px 16px 12px', marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <p className="card-label" style={{ marginBottom: 0 }}>Symptom Trend</p>
          <div style={{ display: 'flex', gap: 8 }}>
            <LegendDot color="#C9A227" label="Mood" />
            {top3.map((s, i) => <LegendDot key={s.id} color={['#534AB7','#7F77DD','#AFA9EC'][i]} label={s.emoji} />)}
          </div>
        </div>
        <div style={{ position: 'relative', height: 180 }}>
          <canvas ref={canvasRef} />
        </div>
        <p style={{ fontSize: 10, color: 'var(--light)', textAlign: 'center', marginTop: 4 }}>
          ↑ Higher = More difficulty · Tap chart to inspect
        </p>
        {tooltip && (
          <div style={{ background: 'var(--deep)', color: 'white', borderRadius: 12, padding: '12px 14px', fontSize: 11, lineHeight: 1.7, marginTop: 10, boxShadow: '0 4px 16px rgba(0,0,0,.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <p style={{ fontWeight: 600, fontSize: 12 }}>{tooltip.dateStr}</p>
              <button onClick={() => setTooltip(null)} style={{ background: 'rgba(255,255,255,.2)', border: 'none', color: 'white', width: 22, height: 22, borderRadius: '50%', cursor: 'pointer', fontSize: 12 }}>✕</button>
            </div>
            <p style={{ color: '#C9A227' }}>Mood: {tooltip.mood}</p>
            {tooltip.symptoms.map(s => <p key={s.name}>{s.emoji} {s.name.split(' ')[0]}: {s.label}</p>)}
            {tooltip.care && <><div style={{ height: 1, background: 'rgba(255,255,255,.2)', margin: '7px 0' }}/><p style={{ color: '#EDD9C5', fontStyle: 'italic' }}>💛 {tooltip.care}</p></>}
          </div>
        )}
      </div>

      {/* 흐름 바 */}
      <div className="card" style={{ padding: '14px 16px', marginBottom: 12 }}>
        <p className="card-label" style={{ marginBottom: 10 }}>Top Symptom by Period</p>
        <div style={{ height: 32, borderRadius: 8, overflow: 'hidden', display: 'flex' }}>
          {segments.map((seg, i) => {
            const sym = ALLOWED.find(s => s.id === seg.id);
            return (
              <div key={i} style={{ width: `${seg.pct}%`, background: sym?.dimColor ?? '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRight: '1px solid rgba(255,255,255,.6)', overflow: 'hidden' }}>
                {seg.pct > 10 && <span style={{ fontSize: 10, color: sym?.color, fontWeight: 600, whiteSpace: 'nowrap', padding: '0 4px' }}>{sym?.emoji} {seg.pct > 18 ? sym?.name?.split(' ')[0] : ''}</span>}
              </div>
            );
          })}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px 10px', marginTop: 8 }}>
          {ALLOWED.filter(s => segments.some(seg => seg.id === s.id)).map(s => (
            <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 10, height: 10, borderRadius: 3, background: s.dimColor, border: `1.5px solid ${s.color}` }}/>
              <span style={{ fontSize: 10, color: 'var(--mid)' }}>{s.emoji} {s.name.split(' ')[0]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* TOP 3 카드 */}
      <p className="card-label" style={{ marginBottom: 8 }}>Top 3 Symptoms · {PERIOD_TABS.find(t => t.key === period)?.label}</p>
      {top3.map((s, i) => (
        <div key={s.id} className="card" style={{ padding: '14px 18px', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: ['#534AB7','#7F77DD','#AFA9EC'][i], display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 12, flexShrink: 0 }}>#{i + 1}</div>
            <span style={{ fontSize: 22 }}>{s.emoji}</span>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--deep)' }}>{s.name}</p>
              <p style={{ fontSize: 11, color: 'var(--light)', fontWeight: 300 }}>{SCORE_LABEL[Math.round(s.avg)]} level</p>
            </div>
            <span style={{ fontFamily: 'serif', fontSize: 18, fontWeight: 700, color: ['#534AB7','#7F77DD','#AFA9EC'][i] }}>
              {s.avg.toFixed(1)}<span style={{ fontSize: 11, fontWeight: 300, color: 'var(--light)' }}>/5.0</span>
            </span>
          </div>
          <div style={{ height: 5, background: 'var(--warm-200)', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ height: '100%', borderRadius: 3, width: `${(s.avg / 5) * 100}%`, background: ['#534AB7','#7F77DD','#AFA9EC'][i], transition: 'width .6s ease' }}/>
          </div>
          {isFamily && (
            <div style={{ marginTop: 10, background: 'var(--warm-100)', borderRadius: 8, padding: '8px 12px', fontSize: 11.5, color: 'var(--mid)', lineHeight: 1.5 }}>
              💛 {TOOLTIP_CARE[s.id] ?? 'Be patient and understanding.'}
            </div>
          )}
        </div>
      ))}

      {/* AI Insight */}
      <div className="card" style={{ padding: '16px 18px', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span style={{ fontSize: 18 }}>✨</span>
          <p className="card-label" style={{ marginBottom: 0 }}>AI Insights</p>
          <span style={{ marginLeft: 'auto', fontSize: 10, background: '#FFF0E8', color: 'var(--coral)', padding: '2px 8px', borderRadius: 10, fontWeight: 500 }}>Claude AI</span>
        </div>
        <p style={{ fontSize: 11.5, color: 'var(--light)', lineHeight: 1.5, marginBottom: 14, fontWeight: 300 }}>
          Pattern analysis & 7-day forecast based on your symptom history.
        </p>
        <AIInsightSection data={data} top3={top3} profile={profile} />
      </div>

      {/* 여정 진행바 */}
      {period !== '7d' && (
        <div className="card" style={{ padding: '14px 18px', marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <p className="card-label" style={{ marginBottom: 0 }}>Menopause Journey</p>
            <span style={{ fontSize: 12, color: 'var(--coral)', fontWeight: 500 }}>~40% through</span>
          </div>
          <div style={{ height: 8, background: 'var(--warm-200)', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ width: '40%', height: '100%', background: 'linear-gradient(90deg, var(--peach), var(--coral))', borderRadius: 4 }}/>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5, fontSize: 11, color: 'var(--light)' }}>
            <span>Start · {profile?.lastPeriodDate?.slice(0, 7) ?? '2023-08'}</span>
            <span>~2028 estimated end</span>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryCard({ label, value, sub, color, icon }) {
  return (
    <div style={{ background: 'white', borderRadius: 16, padding: '14px 14px 12px', boxShadow: '0 2px 10px var(--shadow)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        <span style={{ fontSize: 16 }}>{icon}</span>
        <span style={{ fontSize: 10, color: 'var(--light)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</span>
      </div>
      <p style={{ fontSize: 13, fontWeight: 600, color, lineHeight: 1.3, marginBottom: 2 }}>{value}</p>
      <p style={{ fontSize: 11, color: 'var(--light)', fontWeight: 300 }}>{sub}</p>
    </div>
  );
}

function LegendDot({ color, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }}/>
      <span style={{ fontSize: 10, color: 'var(--light)' }}>{label}</span>
    </div>
  );
}
