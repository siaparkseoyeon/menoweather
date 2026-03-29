/**
 * SubjectTabBar.jsx
 * 대상자 버전 공통 하단 탭바
 * 모든 대상자 화면에서 import해서 사용
 */

export default function SubjectTabBar({ active, onNavigate, SCREENS, onSettings }) {
  const tabs = [
    { key: SCREENS?.SUBJECT_HOME,  icon: '🏠', label: 'Home'     },
    { key: SCREENS?.DAILY_CHECKIN, icon: '✍️', label: 'Check-in' },
    { key: SCREENS?.REPORT,        icon: '📊', label: 'Report'   },
    { key: SCREENS?.ENCYCLOPEDIA,  icon: '📖', label: 'Learn'    },
  ];

  return (
    <nav className="tab-bar">
      {tabs.map(t => (
        <button
          key={t.key}
          className={`tab-item ${active === t.key ? 'active' : ''}`}
          onClick={() => onNavigate && t.key && onNavigate(t.key)}
        >
          <span className="tab-icon">{t.icon}</span>
          <span className="tab-label">{t.label}</span>
        </button>
      ))}
      <button
        className={`tab-item ${active === 'settings' ? 'active' : ''}`}
        onClick={() => onSettings && onSettings()}
      >
        <span className="tab-icon">⚙️</span>
        <span className="tab-label">Settings</span>
      </button>
    </nav>
  );
}
