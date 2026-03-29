import FamilyTabBar from '../FamilyTabBar.jsx';
/**
 * FamilyTrendScreen.jsx
 * 가족용 증상 추이 트래킹 화면
 * 공유 콘텐츠: FamilyTrendContent
 */

import FamilyTrendContent from './FamilyTrendContent.jsx';

export default function FamilyTrendScreen({ profile, onBack, onLearn, onSettings }) {
  return (
    <div className="screen-container">
      <div className="topbar" style={{ background: 'var(--green-bg)' }}>
        <button className="back-link" onClick={onBack}>← Home</button>
        <span className="topbar-title">{profile?.displayName ?? 'Jane'}\'s Trends</span>
        <div style={{ width: 36 }}/>
      </div>

      <div className="screen pad" style={{ paddingTop: 12 }}>
        <FamilyTrendContent profile={profile} isFamily={true} />
        <div style={{ height: 16 }}/>
      </div>

      <FamilyTabBar active="trends" onHome={onBack} onLearn={onLearn} onTrend={null} onSettings={onSettings} />
    </div>
  );
}
