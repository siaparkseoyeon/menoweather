/**
 * FamilyTabBar.jsx
 * 가족 버전 공통 하단 탭바
 * 모든 가족 화면에서 import해서 사용
 * 탭: 🏠 Home | 📚 Learn | 📈 Trends | ⚙️ Settings
 */

export default function FamilyTabBar({ active, onHome, onLearn, onTrend, onSettings }) {
  const tabs = [
    { key: 'home',     icon: '🏠', label: 'Home',     fn: onHome     },
    { key: 'learn',    icon: '📚', label: 'Learn',    fn: onLearn    },
    { key: 'trends',   icon: '📈', label: 'Trends',   fn: onTrend    },
    { key: 'settings', icon: '⚙️', label: 'Settings', fn: onSettings },
  ];

  return (
    <nav className="tab-bar">
      {tabs.map(t => (
        <button
          key={t.key}
          className={`tab-item ${active === t.key ? 'active' : ''}`}
          onClick={() => t.fn && t.fn()}
        >
          <span className="tab-icon">{t.icon}</span>
          <span className="tab-label">{t.label}</span>
        </button>
      ))}
    </nav>
  );
}
