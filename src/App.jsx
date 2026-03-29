/**
 * App.jsx
 * Root component — handles screen routing and global state.
 * No external router library needed for this single-page app structure.
 */

import { useState } from 'react';
import { useEWMA } from './hooks/useEWMA.js';
import { SubjectSettingsScreen, FamilySettingsScreen } from './components/Settings/SettingsScreen.jsx';

// Screens
import RoleSelectScreen    from './components/Onboarding/RoleSelectScreen.jsx';
import OnboardingScreen    from './components/Onboarding/OnboardingScreen.jsx';
import FamilyCodeScreen    from './components/Onboarding/FamilyCodeScreen.jsx';
import SubjectHomeScreen   from './components/Daily/SubjectHomeScreen.jsx';
import DailyCheckinScreen  from './components/Daily/DailyCheckinScreen.jsx';
import ReportScreen        from './components/Report/ReportScreen.jsx';
import FamilyHomeScreen    from './components/FamilyView/FamilyHomeScreen.jsx';
import FamilyLearnScreen   from './components/FamilyView/FamilyLearnScreen.jsx';
import FamilyTrendScreen  from './components/FamilyView/FamilyTrendScreen.jsx';
import EncyclopediaScreen  from './components/Encyclopedia/EncyclopediaScreen.jsx';
import SymptomDetailScreen from './components/Encyclopedia/SymptomDetailScreen.jsx';

// Demo history for seeding the report when no real history exists
const DEMO_HISTORY = [
  { date: '2024-01-15', moodEmoji: 3, hotFlashScore: 4, sleepHours: 5.5, sleepQuality: 3, brainFogScore: 3, headachePresent: false, jointPainScore: 3 },
  { date: '2024-01-16', moodEmoji: 2, hotFlashScore: 5, sleepHours: 4.5, sleepQuality: 2, brainFogScore: 4, headachePresent: true,  jointPainScore: 4 },
  { date: '2024-01-17', moodEmoji: 3, hotFlashScore: 4, sleepHours: 5.0, sleepQuality: 3, brainFogScore: 3, headachePresent: false, jointPainScore: 3 },
  { date: '2024-01-18', moodEmoji: 4, hotFlashScore: 3, sleepHours: 6.0, sleepQuality: 4, brainFogScore: 2, headachePresent: false, jointPainScore: 2 },
  { date: '2024-01-19', moodEmoji: 2, hotFlashScore: 5, sleepHours: 4.0, sleepQuality: 2, brainFogScore: 4, headachePresent: true,  jointPainScore: 4 },
  { date: '2024-01-20', moodEmoji: 3, hotFlashScore: 4, sleepHours: 5.5, sleepQuality: 3, brainFogScore: 3, headachePresent: false, jointPainScore: 3 },
  { date: '2024-01-21', moodEmoji: 3, hotFlashScore: 4, sleepHours: 5.0, sleepQuality: 3, brainFogScore: 3, headachePresent: false, jointPainScore: 3 },
];

// ---------------------------------------------------------------------------
// Screen names (used as routing keys)
// ---------------------------------------------------------------------------
const SCREENS = {
  ROLE_SELECT:     'role_select',
  ONBOARDING:      'onboarding',
  FAMILY_CODE:     'family_code',
  SUBJECT_HOME:    'subject_home',
  DAILY_CHECKIN:   'daily_checkin',
  REPORT:          'report',
  FAMILY_HOME:     'family_home',
  FAMILY_LEARN:           'family_learn',
  FAMILY_SYMPTOM_DETAIL:  'family_symptom_detail',
  FAMILY_TREND:    'family_trend',
  ENCYCLOPEDIA:    'encyclopedia',
  SYMPTOM_DETAIL:  'symptom_detail',
  SETTINGS:        'settings',
};

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------

export default function App() {
  const [screen,       setScreen]       = useState(SCREENS.ROLE_SELECT);
  const [role,         setRole]         = useState(null);   // 'subject' | 'family'
  const [profile,      setProfile]      = useState(null);
  const [todayCheckin, setTodayCheckin] = useState(null);
  const [history,      setHistory]      = useState(DEMO_HISTORY);
  const [selectedEncId,setSelectedEncId]= useState(null);

  // Family-view realtime state
  const [aloneMode,       setAloneMode]       = useState(false);
  const [ghostMode,       setGhostMode]       = useState(false);
  const [nullCount,       setNullCount]       = useState(0);
  const [latestMoodPopup, setLatestMoodPopup] = useState(null);
  const [popupBonus,      setPopupBonus]      = useState({});
  const [dailyBonus,      setDailyBonus]      = useState({});
  const [lastUpdated,     setLastUpdated]     = useState(null);
  const [pendingFamilyPopup, setPendingFamilyPopup] = useState(false); // family → subject popup
  const [returnToFamily,    setReturnToFamily]    = useState(false);  // after response, go back to family

  const { scores: ewmaScores, top3, initFromProfile, applyResponses } = useEWMA(profile);

  // ---------------------------------------------------------------------------
  // Family sends popup to subject
  // ---------------------------------------------------------------------------
  const handleFamilySendPopup = (action) => {
    setPendingFamilyPopup(true);
    if (action === 'switch') {
      // User tapped the hint — switch to subject view
      setReturnToFamily(true);
      go(SCREENS.SUBJECT_HOME);
    }
  };

  // ---------------------------------------------------------------------------
  // Navigation helpers
  // ---------------------------------------------------------------------------

  const go = (nextScreen, params = {}) => {
    if (params.selectedEncId !== undefined) setSelectedEncId(params.selectedEncId);
    setScreen(nextScreen);
  };

  // ---------------------------------------------------------------------------
  // Onboarding completion
  // ---------------------------------------------------------------------------

  const handleOnboardingComplete = (completedProfile) => {
    setProfile(completedProfile);
    setRole('subject');
    initFromProfile(completedProfile);
    go(SCREENS.SUBJECT_HOME);
  };

  const handleFamilyConnect = (subjectProfile) => {
    setProfile(subjectProfile);
    setRole('family');
    go(SCREENS.FAMILY_HOME);
  };

  // ---------------------------------------------------------------------------
  // Daily check-in submission
  // ---------------------------------------------------------------------------

  const handleDailySubmit = (checkin) => {
    setTodayCheckin(checkin);
    setLastUpdated(Date.now());

    // Build EWMA response map from check-in
    const responses = {};
    if (checkin.hotFlashScore)  responses[1] = checkin.hotFlashScore;
    if (checkin.sleepQuality)   responses[2] = checkin.sleepQuality;
    if (checkin.moodEmoji)      responses[3] = checkin.moodEmoji;
    if (checkin.brainFogScore)  responses[4] = checkin.brainFogScore;
    if (checkin.fatigue)        responses[5] = checkin.fatigue;
    if (checkin.jointPainScore) responses[6] = checkin.jointPainScore;
    if (checkin.headachePresent !== null)
      responses[7] = checkin.headachePresent;

    applyResponses(responses);

    // Daily bonus for family emoji score
    const bonus = {};
    Object.entries(responses).forEach(([id, val]) => {
      bonus[Number(id)] = val >= 3 ? 1 : 0;
    });
    setDailyBonus(bonus);

    // Persist to history
    setHistory(prev => [
      ...prev.slice(-6),
      { ...checkin, date: new Date().toISOString() },
    ]);

    go(SCREENS.SUBJECT_HOME);
  };

  // ---------------------------------------------------------------------------
  // Popup response handling
  // ---------------------------------------------------------------------------

  const handlePopupResponse = (qtypeKey, val) => {
    // If this response was triggered by family, go back to family view after
    if (returnToFamily && val !== null) {
      setReturnToFamily(false);
      setPendingFamilyPopup(false);
      setTimeout(() => go(SCREENS.FAMILY_HOME), 800);
    }
    if (val === null) {
      // Null response (dismissed)
      const newCount = nullCount + 1;
      setNullCount(newCount);
      if (newCount >= 2) setGhostMode(true);
      return;
    }

    setNullCount(0);
    setGhostMode(false);
    setLastUpdated(Date.now());

    // Mood popup → update weather
    if (['Q01', 'Q09', 'Q12'].includes(qtypeKey) && typeof val === 'number') {
      setLatestMoodPopup(val);
    }

    // Alone mode
    if (qtypeKey === 'Q11') {
      setAloneMode(val === true);
      return;
    }

    // Symptom popup bonus
    const BONUS_MAP = { Q02: 2, Q03: 1, Q04: 3, Q05: 4, Q06: 5, Q07: 6, Q08: 7 };
    if (BONUS_MAP[qtypeKey] && val === true) {
      const sid = BONUS_MAP[qtypeKey];
      setPopupBonus(prev => ({ ...prev, [sid]: (prev[sid] ?? 0) + 2 }));
    }
  };

  // ---------------------------------------------------------------------------
  // Screen renderer
  // ---------------------------------------------------------------------------

  const sharedSubjectProps = {
    profile,
    ewmaScores,
    top3,
    todayCheckin,
    history,
    aloneMode,
    ghostMode,
    latestMoodPopup,
    popupBonus,
    dailyBonus,
    lastUpdated,
    onPopupResponse: handlePopupResponse,
  };

  switch (screen) {

    case SCREENS.ROLE_SELECT:
      return (
        <RoleSelectScreen
          onSelectSubject={() => go(SCREENS.ONBOARDING)}
          onSelectFamily={() => go(SCREENS.FAMILY_CODE)}
          onDemoSubject={() => {
            setRole('subject');
            setProfile(getDemoProfile());
            initFromProfile(getDemoProfile());
            go(SCREENS.SUBJECT_HOME);
          }}
          onDemoFamily={() => {
            setRole('family');
            setProfile(getDemoProfile());
            go(SCREENS.FAMILY_HOME);
          }}
        />
      );

    case SCREENS.ONBOARDING:
      return (
        <OnboardingScreen
          onComplete={handleOnboardingComplete}
          onBack={() => go(SCREENS.ROLE_SELECT)}
        />
      );

    case SCREENS.FAMILY_CODE:
      return (
        <FamilyCodeScreen
          onConnect={handleFamilyConnect}
          onBack={() => go(SCREENS.ROLE_SELECT)}
        />
      );

    case SCREENS.SUBJECT_HOME:
      return (
        <SubjectHomeScreen
          {...sharedSubjectProps}
          onNavigate={(dest) => go(dest)}
          SCREENS={SCREENS}
          onSettings={() => go(SCREENS.SETTINGS)}
          pendingFamilyPopup={pendingFamilyPopup}
          onFamilyPopupDismissed={() => setPendingFamilyPopup(false)}
        />
      );

    case SCREENS.DAILY_CHECKIN:
      return (
        <DailyCheckinScreen
          profile={profile}
          top3={top3}
          ewmaScores={ewmaScores}
          existingCheckin={todayCheckin}
          onSubmit={handleDailySubmit}
          onBack={() => go(SCREENS.SUBJECT_HOME)}
          onNavigate={(dest) => go(dest)}
          SCREENS={SCREENS}
          onSettings={() => go(SCREENS.SETTINGS)}
        />
      );

    case SCREENS.REPORT:
      return (
        <ReportScreen
          profile={profile}
          ewmaScores={ewmaScores}
          history={history}
          onBack={() => go(SCREENS.SUBJECT_HOME)}
          onNavigate={(dest) => go(dest)}
          SCREENS={SCREENS}
          onSettings={() => go(SCREENS.SETTINGS)}
        />
      );

    case SCREENS.FAMILY_HOME:
      return (
        <FamilyHomeScreen
          {...sharedSubjectProps}
          onLearn={() => go(SCREENS.FAMILY_LEARN)}
          onTrend={() => go(SCREENS.FAMILY_TREND)}
          onSettings={() => go(SCREENS.SETTINGS)}
          onSendPopup={handleFamilySendPopup}
          popupSentConfirm={pendingFamilyPopup}
        />
      );

    case SCREENS.FAMILY_LEARN:
      return (
        <EncyclopediaScreen
          profile={profile}
          ewmaScores={ewmaScores}
          popupBonus={popupBonus}
          onSelectSymptom={(id) => go(SCREENS.FAMILY_SYMPTOM_DETAIL, { selectedEncId: id })}
          onBack={() => go(SCREENS.FAMILY_HOME)}
          isFamily={true}
          onLearn={null}
          onTrend={() => go(SCREENS.FAMILY_TREND)}
          onSettings={() => go(SCREENS.SETTINGS)}
        />
      );

    case SCREENS.FAMILY_SYMPTOM_DETAIL:
      return (
        <SymptomDetailScreen
          encId={selectedEncId}
          profile={profile}
          ewmaScores={ewmaScores}
          popupBonus={popupBonus}
          onBack={() => go(SCREENS.FAMILY_LEARN)}
          isFamily={true}
          onLearn={() => go(SCREENS.FAMILY_LEARN)}
          onTrend={() => go(SCREENS.FAMILY_TREND)}
          onSettings={() => go(SCREENS.SETTINGS)}
        />
      );

    case SCREENS.FAMILY_TREND:
      return (
        <FamilyTrendScreen
          profile={profile}
          onBack={() => go(SCREENS.FAMILY_HOME)}
          onLearn={() => go(SCREENS.FAMILY_LEARN)}
          onSettings={() => go(SCREENS.SETTINGS)}
        />
      );

    case SCREENS.ENCYCLOPEDIA:
      return (
        <EncyclopediaScreen
          profile={profile}
          ewmaScores={ewmaScores}
          popupBonus={popupBonus}
          onSelectSymptom={(id) => go(SCREENS.SYMPTOM_DETAIL, { selectedEncId: id })}
          onBack={() => go(SCREENS.SUBJECT_HOME)}
          onNavigate={(dest) => go(dest)}
          SCREENS={SCREENS}
          onSettings={() => go(SCREENS.SETTINGS)}
        />
      );

    case SCREENS.SYMPTOM_DETAIL:
      return (
        <SymptomDetailScreen
          encId={selectedEncId}
          profile={profile}
          ewmaScores={ewmaScores}
          popupBonus={popupBonus}
          onBack={() => go(SCREENS.ENCYCLOPEDIA)}
          onNavigate={(dest) => go(dest)}
          SCREENS={SCREENS}
          onSettings={() => go(SCREENS.SETTINGS)}
        />
      );

    case SCREENS.SETTINGS:
      return role === 'family' ? (
        <FamilySettingsScreen
          profile={profile}
          onBack={() => go(SCREENS.FAMILY_HOME)}
          onLearn={() => go(SCREENS.FAMILY_LEARN)}
          onTrend={() => go(SCREENS.FAMILY_TREND)}
        />
      ) : (
        <SubjectSettingsScreen
          profile={profile}
          onBack={() => go(SCREENS.SUBJECT_HOME)}
          onNavigate={(dest) => go(dest)}
          SCREENS={SCREENS}
        />
      );

    default:
      return <RoleSelectScreen onSelectSubject={() => go(SCREENS.ONBOARDING)} />;
  }
}

// ---------------------------------------------------------------------------
// Demo profile (bypasses onboarding for quick demo)
// ---------------------------------------------------------------------------

function getDemoProfile() {
  return {
    displayName:          'Jane',
    age:                  52,
    heightCm:             162,
    weightKg:             62,
    lastPeriodDate:       '2023-08-15',
    menstrualChange:      'stopped',
    symptomOnsetDuration: '1 year',
    baselineHotFlash:     4,
    baselineSleep:        4,
    baselineMood:         3,
    baselineBrainFog:     3,
    baselineHeadache:     2,
    baselineJointPain:    3,
    baseFatigue:          3,
    baseHeartPalp:        2,
    bladderIssue:         true,
    bladderTypes:         ['nocturia'],
    vaginalDryness:       false,
    weightGain:           true,
    skinHairChange:       true,
    hrt:                  false,
    medications:          'Calcium supplement, Vitamin D',
    avgSleepHours:        '5-7h',
    exerciseFrequency:    '1-2x per week',
    smokingStatus:        'never',
    race:                 'asian',
    inviteCode:           'MW2K9RXT',
    stage:                'menopause',
  };
}
