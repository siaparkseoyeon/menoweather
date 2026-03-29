/**
 * OnboardingScreen.jsx
 * 6-step onboarding flow collecting all 22 profile data points.
 * Steps: Basic Info → Menstrual History → Symptoms → Other Symptoms → Lifestyle → Complete
 */

import { useState } from 'react';
import { initEWMAFromOnboarding } from '../../lib/ewma.js';

// Initial blank profile
const BLANK = {
  displayName: '', age: null, heightCm: null, weightKg: null,
  lastPeriodDate: '', menstrualChange: '', symptomOnsetDuration: '',
  baselineHotFlash: 3, baselineSleep: 3, baselineMood: 3,
  baselineBrainFog: 3, baselineHeadache: 2, baselineJointPain: 3,
  baseFatigue: 3, baseHeartPalp: 2,
  bladderIssue: null, bladderTypes: [], vaginalDryness: null,
  weightGain: null, skinHairChange: null,
  hrt: null, medications: '',
  avgSleepHours: '', exerciseFrequency: '', smokingStatus: '',
  race: null, inviteCode: '',
};

const STEP_LABELS = ['Basic Info', 'Menstrual History', 'Symptoms', 'Other Symptoms', 'Lifestyle', 'Done'];

export default function OnboardingScreen({ onComplete, onBack }) {
  const [step, setStep] = useState(1);
  const [ob,   setOb]   = useState({ ...BLANK });

  const update = (key, val) => setOb(prev => ({ ...prev, [key]: val }));
  const next   = () => setStep(s => s + 1);
  const back   = () => (step === 1 ? onBack() : setStep(s => s - 1));

  const pct = Math.round((step / 6) * 100);

  // Generate invite code on step 6
  if (step === 6 && !ob.inviteCode) {
    const code = Array.from({ length: 8 }, () =>
      'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 33)]
    ).join('');
    update('inviteCode', code);
    update('stage', ob.lastPeriodDate
      ? (Math.floor((Date.now() - new Date(ob.lastPeriodDate)) / (1000*60*60*24*30)) >= 12
        ? 'menopause' : 'perimenopause')
      : 'perimenopause'
    );
  }

  const handleComplete = () => {
    onComplete({ ...ob });
  };

  return (
    <div className="screen-container">
      {/* Progress header */}
      <div className="ob-header">
        <button className="back-link" onClick={back}>
          ← {step === 1 ? 'Back' : STEP_LABELS[step - 2]}
        </button>
        <div className="progress-meta">
          <span className="prog-label">STEP {step} / 6 · {STEP_LABELS[step - 1]}</span>
          <span className="prog-count">{step === 6 ? '✓ Done' : 'Almost there'}</span>
        </div>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className="screen pad" id="ob-body">
        {step === 1 && <Step1 ob={ob} update={update} onNext={next} />}
        {step === 2 && <Step2 ob={ob} update={update} onNext={next} />}
        {step === 3 && <Step3 ob={ob} update={update} onNext={next} />}
        {step === 4 && <Step4 ob={ob} update={update} onNext={next} />}
        {step === 5 && <Step5 ob={ob} update={update} onNext={next} />}
        {step === 6 && <Step6 ob={ob} onComplete={handleComplete} />}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 1 — Basic Info
// ---------------------------------------------------------------------------
function Step1({ ob, update, onNext }) {
  const bmi = ob.heightCm && ob.weightKg
    ? (ob.weightKg / Math.pow(ob.heightCm / 100, 2)).toFixed(1)
    : null;
  const isAsian = ob.race === 'asian';
  const bmiThreshold = isAsian ? 23 : 25;
  const valid = ob.displayName.trim().length > 0 && ob.age >= 30 && ob.age <= 80;

  return (
    <>
      <p className="s-tag">STEP 1</p>
      <h2 className="s-title">Let's start with<br />the basics 🌸</h2>
      <p className="s-desc">Your information is encrypted and used only for personalized analysis.</p>

      <Field label="Your name" required>
        <input
          type="text" placeholder="e.g. Jane, Mom" maxLength={20}
          value={ob.displayName}
          onChange={e => update('displayName', e.target.value.trim())}
        />
        <span className="f-hint">Shown in your report and family view</span>
      </Field>

      <Field label="Age" required>
        <div className="input-unit-wrap">
          <input
            type="number" placeholder="52" min={30} max={80}
            value={ob.age ?? ''}
            onChange={e => update('age', parseInt(e.target.value) || null)}
          />
          <span className="i-unit">yrs</span>
        </div>
        {ob.age < 40 && <p className="f-warn">Symptoms before 40 may indicate early menopause — a provider visit is recommended.</p>}
        {ob.age >= 60 && <p className="f-hint text-purple">Age 60+: new symptoms may have other causes — worth checking with your doctor.</p>}
      </Field>

      <hr className="divider" />
      <p className="f-label-group">Body measurements <span className="opt">Optional</span></p>

      <div className="field-row">
        <Field label="Height">
          <div className="input-unit-wrap">
            <input type="number" placeholder="162" min={130} max={210}
              value={ob.heightCm ?? ''}
              onChange={e => update('heightCm', parseFloat(e.target.value) || null)} />
            <span className="i-unit">cm</span>
          </div>
        </Field>
        <Field label="Weight">
          <div className="input-unit-wrap">
            <input type="number" placeholder="62" min={30} max={200}
              value={ob.weightKg ?? ''}
              onChange={e => update('weightKg', parseFloat(e.target.value) || null)} />
            <span className="i-unit">kg</span>
          </div>
        </Field>
      </div>

      {bmi && (
        <div className="info-box">
          <span>📊</span>
          <span>BMI {bmi} — {parseFloat(bmi) < bmiThreshold ? 'Normal range' : 'Weight management solutions will be prioritized'}{isAsian ? ' (Asian threshold: 23)' : ''}</span>
        </div>
      )}

      <button className={`btn ${valid ? 'btn-primary' : 'btn-off'}`} onClick={valid ? onNext : undefined}>
        Continue
      </button>
    </>
  );
}

// ---------------------------------------------------------------------------
// Step 2 — Menstrual History
// ---------------------------------------------------------------------------
function Step2({ ob, update, onNext }) {
  const months = ob.lastPeriodDate
    ? Math.floor((Date.now() - new Date(ob.lastPeriodDate)) / (1000*60*60*24*30))
    : null;
  const stage = months !== null ? (months >= 12 ? 'Menopause' : 'Perimenopause') : null;
  const valid = ob.lastPeriodDate && ob.menstrualChange && ob.symptomOnsetDuration;

  const raceOffset = { black: -2 }[ob.race] ?? 0;

  return (
    <>
      <p className="s-tag">STEP 2</p>
      <h2 className="s-title">Menstrual &amp;<br />menopause history 🌙</h2>
      <p className="s-desc">Approximate dates are fine — no need to be exact.</p>

      <Field label="Date of last period" required>
        <input
          type="date" value={ob.lastPeriodDate}
          max={new Date().toISOString().split('T')[0]}
          onChange={e => update('lastPeriodDate', e.target.value)}
        />
      </Field>

      {stage && (
        <div className="info-box">
          <span>🗓️</span>
          <span>
            <strong>{stage}</strong> — {months} month{months !== 1 ? 's' : ''} since last period.
            {raceOffset !== 0 && ` (Adjusted −${Math.abs(raceOffset)} yrs for ethnicity)`}
          </span>
        </div>
      )}

      <Field label="Recent cycle changes" required>
        <ToggleGroup
          options={['Irregular', 'Stopped completely', 'Still regular']}
          value={ob.menstrualChange}
          onChange={v => update('menstrualChange', v)}
        />
      </Field>

      <Field label="How long have you had symptoms?" required>
        <ToggleGroup
          options={['Under 6 months', '1 year', '2+ years']}
          value={ob.symptomOnsetDuration}
          onChange={v => update('symptomOnsetDuration', v)}
        />
      </Field>

      <Field label="Race / Ethnicity" hint="Optional · Helps improve analysis accuracy">
        <select value={ob.race ?? ''} onChange={e => update('race', e.target.value || null)}>
          <option value="">Prefer not to say</option>
          <option value="asian">Asian (East / Southeast / South)</option>
          <option value="white">White / Caucasian</option>
          <option value="black">Black / African American</option>
          <option value="hispanic">Hispanic / Latina</option>
          <option value="middle">Middle Eastern / North African</option>
          <option value="mixed">Multiracial</option>
        </select>
        {ob.race === 'black' && <p className="f-hint text-orange">Heart rate threshold adjusted −3 bpm · Menopause prediction −2 years (SWAN data)</p>}
        {ob.race === 'asian' && <p className="f-hint text-green">BMI threshold: 23 · Joint pain solutions prioritized</p>}
      </Field>

      <button className={`btn ${valid ? 'btn-primary' : 'btn-off'}`} onClick={valid ? onNext : undefined}>
        Continue
      </button>
    </>
  );
}

// ---------------------------------------------------------------------------
// Step 3 — Symptom Sliders
// ---------------------------------------------------------------------------
const SYMPTOM_SLIDERS = [
  { key: 'baselineHotFlash',  emoji: '😳', label: 'Hot Flashes & Heat Waves', lo: 'None',     hi: 'Very severe' },
  { key: 'baselineSleep',     emoji: '😴', label: 'Sleep Disturbances',       lo: 'Sleep well',hi: 'Very poor'   },
  { key: 'baselineMood',      emoji: '😤', label: 'Mood Swings',              lo: 'Stable',   hi: 'Very intense' },
  { key: 'baselineBrainFog',  emoji: '😵', label: 'Brain Fog',                lo: 'Sharp',    hi: 'Very foggy'   },
  { key: 'baselineHeadache',  emoji: '🤕', label: 'Headaches & Dizziness',    lo: 'None',     hi: 'Very severe'  },
  { key: 'baselineJointPain', emoji: '🥴', label: 'Aches & Pains',            lo: 'None',     hi: 'Very severe'  },
  { key: 'baseFatigue',       emoji: '😩', label: 'Fatigue & Low Energy',     lo: 'Energetic',hi: 'Exhausted'    },
  { key: 'baseHeartPalp',     emoji: '💓', label: 'Heart Palpitations',       lo: 'None',     hi: 'Frequent'     },
];

function Step3({ ob, update, onNext }) {
  return (
    <>
      <p className="s-tag">STEP 3</p>
      <h2 className="s-title">Rate your symptoms 📊</h2>
      <p className="s-desc">Based on the past 2 weeks. Move the slider to reflect your average.</p>

      {SYMPTOM_SLIDERS.map(s => (
        <SliderCard key={s.key} {...s} value={ob[s.key]} onChange={v => update(s.key, v)} />
      ))}

      <button className="btn btn-primary" onClick={onNext}>Continue</button>
    </>
  );
}

// ---------------------------------------------------------------------------
// Step 4 — Other Symptoms (yes/no)
// ---------------------------------------------------------------------------
function Step4({ ob, update, onNext }) {
  return (
    <>
      <p className="s-tag">STEP 4</p>
      <h2 className="s-title">Any other symptoms? 💬</h2>
      <p className="s-desc">Check everything that applies.</p>

      <Field label="Bladder issues (urgency, frequency, nocturia)">
        <YNGroup
          value={ob.bladderIssue}
          onChange={v => update('bladderIssue', v)}
          yesLabel="Yes" noLabel="No"
        />
        {ob.bladderIssue && (
          <CheckGroup
            options={['Nocturia (waking at night)', 'Hard to hold', 'Frequent urge']}
            selected={ob.bladderTypes}
            onChange={arr => update('bladderTypes', arr)}
          />
        )}
      </Field>

      <Field label="Weight gain or belly fat">
        <YNGroup value={ob.weightGain} onChange={v => update('weightGain', v)} />
      </Field>

      <Field label="Skin dryness / hair thinning">
        <YNGroup value={ob.skinHairChange} onChange={v => update('skinHairChange', v)} />
      </Field>

      <Field label="Vaginal dryness or intimate discomfort">
        <div className="info-box small"><span>🔒</span><span>Never shown in the family view.</span></div>
        <YNGroup value={ob.vaginalDryness} onChange={v => update('vaginalDryness', v)} />
      </Field>

      <button className="btn btn-primary" onClick={onNext}>Continue</button>
    </>
  );
}

// ---------------------------------------------------------------------------
// Step 5 — Lifestyle
// ---------------------------------------------------------------------------
function Step5({ ob, update, onNext }) {
  const valid = ob.hrt !== null && ob.avgSleepHours && ob.exerciseFrequency && ob.smokingStatus;

  return (
    <>
      <p className="s-tag">STEP 5</p>
      <h2 className="s-title">Health &amp; lifestyle 🌿</h2>

      <Field label="Are you currently on HRT?" required>
        <YNGroup
          value={ob.hrt}
          onChange={v => update('hrt', v)}
          yesLabel="Yes, I'm on HRT"
          noLabel="No"
        />
        {ob.hrt === false && (
          <p className="f-hint">If symptoms persist, talk to your provider about HRT options.</p>
        )}
      </Field>

      <Field label="Current medications or supplements" hint="Optional">
        <textarea
          placeholder="e.g. Calcium supplement, Blood pressure medication, Vitamin D"
          value={ob.medications}
          onChange={e => update('medications', e.target.value)}
          rows={3}
        />
        <span className="f-hint">Helps Claude tailor solutions that don't conflict.</span>
      </Field>

      <hr className="divider" />

      <Field label="Typical sleep duration" required>
        <ToggleGroup
          options={['Under 5h', '5–7h', '7h or more']}
          value={ob.avgSleepHours}
          onChange={v => update('avgSleepHours', v)}
        />
      </Field>

      <Field label="Exercise frequency" required>
        <ToggleGroup
          options={['Rarely', '1–2x per week', '3x+ per week']}
          value={ob.exerciseFrequency}
          onChange={v => update('exerciseFrequency', v)}
        />
      </Field>

      <Field label="Smoking" required>
        <ToggleGroup
          options={[['never', 'Never'], ['ex', 'Former smoker'], ['current', 'Current smoker']]}
          value={ob.smokingStatus}
          onChange={v => update('smokingStatus', v)}
          useValue
        />
      </Field>

      <button className={`btn ${valid ? 'btn-primary' : 'btn-off'}`} onClick={valid ? onNext : undefined}>
        Continue
      </button>
    </>
  );
}

// ---------------------------------------------------------------------------
// Step 6 — Complete
// ---------------------------------------------------------------------------
function Step6({ ob, onComplete }) {
  const bmi = ob.heightCm && ob.weightKg
    ? (ob.weightKg / Math.pow(ob.heightCm / 100, 2)).toFixed(1) : null;
  const months = ob.lastPeriodDate
    ? Math.floor((Date.now() - new Date(ob.lastPeriodDate)) / (1000*60*60*24*30)) : 0;
  const stage = months >= 12 ? 'Menopause' : 'Perimenopause';
  const hr = getHRThreshold(ob);
  const steps = getStepGoal(ob);

  const summaryRows = [
    ['Stage',                stage],
    ['Heart rate threshold', `${hr} bpm (hot flash detection)`],
    ['Daily step goal',      `${steps.toLocaleString()} steps`],
    bmi ? ['BMI', bmi] : null,
    ['HRT',                  ob.hrt ? 'Yes ✓' : 'No'],
    ob.race ? ['Ethnicity adjustments', 'Applied ✓'] : null,
  ].filter(Boolean);

  return (
    <>
      <div className="complete-hero">
        <div className="complete-icon">🎉</div>
        <h2 className="s-title center">{ob.displayName}, you're all set!</h2>
        <p className="s-desc center">Your personalized profile is ready.</p>
      </div>

      <div className="card">
        <p className="card-label">Your analysis profile</p>
        {summaryRows.map(([label, value]) => (
          <div key={label} className="summary-row">
            <span className="sr-label">{label}</span>
            <span className="sr-value">{value}</span>
          </div>
        ))}
      </div>

      <div className="invite-box">
        <p className="card-label">Family invite code 🤝</p>
        <p className="invite-hint">Share this code with your partner or family member.</p>
        <div className="invite-code">{ob.inviteCode}</div>
        <button
          className="copy-btn"
          onClick={() => navigator.clipboard?.writeText(ob.inviteCode).catch(() => {})}
        >
          Copy code
        </button>
      </div>

      <button className="btn btn-primary" onClick={onComplete}>
        Start MenoWeather
      </button>
    </>
  );
}

// ---------------------------------------------------------------------------
// Shared sub-components
// ---------------------------------------------------------------------------

function Field({ label, required, hint, children }) {
  return (
    <div className="field">
      {label && (
        <label className="f-label">
          {label}
          {required && <span className="req"> *</span>}
          {hint && <span className="opt"> · {hint}</span>}
        </label>
      )}
      {children}
    </div>
  );
}

function ToggleGroup({ options, value, onChange, useValue = false }) {
  return (
    <div className="toggle-group">
      {options.map(opt => {
        const [val, label] = Array.isArray(opt) ? opt : [opt, opt];
        const isSelected = useValue ? value === val : value === opt;
        return (
          <button
            key={val}
            className={`tb ${isSelected ? 'sel' : ''}`}
            onClick={() => onChange(useValue ? val : opt)}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

function YNGroup({ value, onChange, yesLabel = 'Yes', noLabel = 'No' }) {
  return (
    <div className="yn-group">
      <button className={`yn-btn ${value === true  ? 'yes' : ''}`} onClick={() => onChange(true)}>
        {yesLabel}
      </button>
      <button className={`yn-btn ${value === false ? 'no'  : ''}`} onClick={() => onChange(false)}>
        {noLabel}
      </button>
    </div>
  );
}

function CheckGroup({ options, selected, onChange }) {
  const toggle = (item) => {
    const next = selected.includes(item)
      ? selected.filter(x => x !== item)
      : [...selected, item];
    onChange(next);
  };
  return (
    <div className="check-group">
      {options.map(opt => (
        <div key={opt} className={`check-item ${selected.includes(opt) ? 'on' : ''}`} onClick={() => toggle(opt)}>
          <div className="check-box">{selected.includes(opt) ? '✓' : ''}</div>
          <span className="check-text">{opt}</span>
        </div>
      ))}
    </div>
  );
}

function SliderCard({ emoji, label, lo, hi, value, onChange }) {
  const pct = ((value - 1) / 4 * 100).toFixed(0);
  return (
    <div className="slider-card">
      <div className="sl-top">
        <span className="sl-name">{emoji} {label}</span>
        <span className="sl-val">{value}</span>
      </div>
      <input
        type="range" min={1} max={5} value={value}
        style={{ '--pct': `${pct}%` }}
        onChange={e => onChange(parseInt(e.target.value))}
      />
      <div className="sl-labels"><span>{lo}</span><span>{hi}</span></div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function getHRThreshold(p) {
  const base = { 1: 95, 2: 95, 3: 90, 4: 87, 5: 85 }[Math.min(Math.max(Math.round(p.baselineHotFlash), 1), 5)] ?? 90;
  return p.race === 'black' ? base - 3 : base;
}

function getStepGoal(p) {
  const base    = { 'Rarely': 3000, '1–2x per week': 5000, '3x+ per week': 8000 }[p.exerciseFrequency] ?? 5000;
  const reduced = { 'Rarely': 1500, '1–2x per week': 3000, '3x+ per week': 5000 }[p.exerciseFrequency] ?? 3000;
  return (p.baselineJointPain ?? 2) >= 4 ? Math.round(reduced * 0.5)
       : (p.baselineJointPain ?? 2) >= 3 ? Math.round(reduced * 0.7)
       : base;
}
