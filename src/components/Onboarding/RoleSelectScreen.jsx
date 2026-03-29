/**
 * RoleSelectScreen.jsx
 * Entry screen — user selects their role: subject or family member.
 */

import { useState } from 'react';

export default function RoleSelectScreen({
  onSelectSubject,
  onSelectFamily,
  onDemoSubject,
  onDemoFamily,
}) {
  const [selected, setSelected] = useState(null);

  const handleNext = () => {
    if (selected === 'subject') onSelectSubject();
    else if (selected === 'family') onSelectFamily();
  };

  return (
    <div className="screen pad center">
      {/* Logo */}
      <div className="logo-block">
        <div className="logo-icon">🌤️</div>
        <h1 className="logo-title">MenoWeather</h1>
        <p className="logo-sub">Track your menopause journey, one day at a time</p>
      </div>

      <div className="divider-label">How would you like to start?</div>

      {/* Subject card */}
      <RoleCard
        id="subject"
        icon="🌸"
        title="I'm tracking my own symptoms"
        desc="Log daily check-ins and receive a personalized AI report."
        selected={selected === 'subject'}
        color="coral"
        onSelect={() => setSelected('subject')}
      />

      {/* Family card */}
      <RoleCard
        id="family"
        icon="🤝"
        title="I'm a family member or partner"
        desc="See how she's doing today and learn how to help."
        selected={selected === 'family'}
        color="green"
        onSelect={() => setSelected('family')}
      />

      {/* Continue button */}
      <button
        className={`btn ${selected ? (selected === 'subject' ? 'btn-primary' : 'btn-green') : 'btn-off'}`}
        onClick={handleNext}
        disabled={!selected}
      >
        {selected === 'subject' ? 'Get Started' : selected === 'family' ? 'Connect' : 'Select a role'}
      </button>

      {/* Demo shortcuts */}
      <p className="demo-link">
        Try the demo:{' '}
        <span onClick={onDemoSubject}>Subject view</span>
        {' · '}
        <span onClick={onDemoFamily}>Family view</span>
      </p>
    </div>
  );
}

function RoleCard({ id, icon, title, desc, selected, color, onSelect }) {
  return (
    <div
      className={`role-card ${selected ? `selected-${color}` : ''}`}
      onClick={onSelect}
    >
      <div className={`role-icon bg-${color}-light`}>{icon}</div>
      <div className="role-body">
        <div className="role-title">{title}</div>
        <div className="role-desc">{desc}</div>
      </div>
      <div className={`role-check ${selected ? `check-${color}` : ''}`} />
    </div>
  );
}
