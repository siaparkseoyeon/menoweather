# 🌤️ MenoWeather

> **AI-powered menopause symptom tracker with family view**
> Built with React + Claude API (Anthropic) + Supabase · Hackathon submission

---

## What It Does

MenoWeather helps women navigating menopause track symptoms over time —
and helps their families understand how to be supportive **without asking**.

| User | Experience |
|------|------------|
| **Subject (the woman)** | Daily check-ins, EWMA-tracked symptoms, AI weekly report |
| **Family / Partner** | Weather metaphor view — mood state, face emoji, personalized care cards |

The family never sees medical jargon. They see: *"It's a rainy day today. 😴😳 She needs the AC lower and quiet until noon."*

---

## Claude API Integration — 3 Features

### 1. Personalized Weekly Report *(streaming)*
```
Profile + EWMA scores + 7-day history
        ↓  Claude claude-sonnet-4-20250514
Narrative 600–800 word report (4 sections):
  • This Week's Overview
  • Key Symptom Analysis
  • Personalized Solutions
  • For Your Family
```
The system prompt injects race, HRT status, age, stage, medications, and exercise frequency
so every report is clinically-informed and never generic.

### 2. Dynamic Care Cards *(family view)*
```
Symptom emoji + Weather state + Profile
        ↓  Claude API
1–2 sentence actionable care instruction
(falls back to static matrix if offline)
```

### 3. Encyclopedia AI Overlay
```
Symptom entry + EWMA score + popup activity
        ↓  Claude API
One-line explanation of *why this matters to you right now*
```

---

## EWMA Scoring System

Each symptom is tracked with an **Exponentially Weighted Moving Average**:

```
new_score = (prev_score × 0.7) + (today_response × 0.3)
```

- Historical weight: **70%** — prevents score whiplash from one bad day
- Today's weight: **30%** — still captures real change over time
- Yes/No responses are converted: Yes = 5, No = 1, then same formula

The Top-3 symptoms (highest EWMA scores) drive: daily popup question selection,
care card generation, and encyclopedia sorting.

---

## Daily Popup System — No-Repeat Design

5 popups per day, each a different question type:

| Slot | Question | Rule |
|------|----------|------|
| 1 | Top-1 symptom | Symptom-specific |
| 2 | Q01 Mood check | Fixed (fallback: Q09) |
| 3 | Top-2 symptom | De-duped vs slot 1 |
| 4 | General check | First unused type |
| 5 | Q11 Alone? / Q12 Evening wrap | Conditional |

Each question type appears at most once per day — no repetition.

---

## Family View Weather System

6 weather states, determined by priority:

| Priority | Trigger | State |
|----------|---------|-------|
| P1 | Q11 "Yes" (alone mode) | 🌫️ Foggy |
| P3 | Latest mood popup score | ☀️ / 🌤️ / ☁️ / 🌧️ / ⛈️ |
| P4 | Daily check-in ① score | Same mapping |
| P5 | Yesterday's last valid | Same |
| P6 | Default | ☁️ Overcast |

---

## Tech Stack

```
Frontend     React 18 + Vite
AI           Claude claude-sonnet-4-20250514 (Anthropic API)
Database     Supabase (PostgreSQL + Realtime)
Deploy       Vercel
```

---

## Project Structure

```
src/
├── lib/
│   ├── claude.js          ← All Claude API calls + streaming reader
│   ├── ewma.js            ← EWMA engine, Top-3, popup pool builder
│   ├── weatherSystem.js   ← Weather state P1–P6 resolver
│   └── constants.js       ← Symptoms, Q_TYPES, CARE_MATRIX, ENCYCLOPEDIA_12
│
├── prompts/
│   ├── reportPrompt.js    ← Weekly report system prompt + user content
│   ├── careCardPrompt.js  ← Care card prompt
│   └── encyclopediaPrompt.js ← Encyclopedia overlay prompt
│
├── hooks/
│   ├── useReport.js       ← Streaming report state management
│   └── useEWMA.js         ← EWMA scores state + persistence
│
└── components/
    ├── Report/
    │   └── ReportScreen.jsx   ← Claude streaming UI
    └── FamilyView/
        └── CareCard.jsx       ← AI care card with static fallback
```

---

## Getting Started

```bash
# 1. Clone
git clone https://github.com/your-username/menoweather.git
cd menoweather

# 2. Install
npm install

# 3. Configure environment
cp .env.example .env.local
# Edit .env.local with your Anthropic API key and Supabase credentials

# 4. Run
npm run dev
```

---

## Research Foundation

- **EWMA scoring**: Adapted from time-series analysis for continuous symptom monitoring
- **Race/ethnicity adjustments**: Based on [SWAN study](https://www.swanstudy.org/) (Study of Women's Health Across the Nation)
- **Symptom catalog**: Aligned with [NAMS](https://www.menopause.org/) and [ACOG](https://www.acog.org/) guidelines
- **Family communication**: Informed by caregiver education research in chronic condition management

---

## Clinical Disclaimer

MenoWeather is a wellness tracking tool and does not provide medical advice.
All AI-generated content includes appropriate disclaimers and users are advised
to consult their healthcare provider for personalized guidance.

---

*Built for the [Hackathon Name] · Biology & Physical Health track*
