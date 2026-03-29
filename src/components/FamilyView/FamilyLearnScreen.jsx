import FamilyTabBar from '../FamilyTabBar.jsx';
/**
 * FamilyLearnScreen.jsx
 * Educational hub for family members — explains menopause symptoms
 * in plain language with practical guidance.
 */

const CARDS = [
  { icon: '🧠', bg: 'var(--green-bg)',  title: 'Brain fog & memory lapses',         sub: 'Why she forgets and how to help without frustrating her', detail: "Brain fog is caused by declining estrogen affecting neurotransmitter activity. Avoid saying 'You already told me that.' Instead, write down shared plans and offer gentle reminders. It will improve over time." },
  { icon: '💤', bg: '#EBF2F7',          title: 'Sleep disturbances',                sub: 'Why she\'s tired and what disrupts her nights',            detail: "Hot flashes and night sweats can wake her multiple times a night. Keep the bedroom cool (65–68°F / 18–20°C), avoid heavy meals late at night, and let her sleep in when possible. Morning energy is her most fragile resource." },
  { icon: '🌊', bg: '#FFF5E6',          title: 'Mood swings',                       sub: 'What drives them and how to respond',                      detail: "Mood changes are hormonal — not personal. Don't take sudden irritability or tearfulness as a reflection of your relationship. Listening without trying to 'fix' is the most powerful thing you can do. Space when she asks for it is love, not rejection." },
  { icon: '🌡️', bg: '#FFEEE8',         title: 'Hot flashes & heat waves',          sub: 'Understanding sudden temperature surges',                  detail: "Hot flashes can come without warning and last 1–5 minutes. Triggers include spicy food, alcohol, caffeine, and warm rooms. Keeping the house cool, having a fan nearby, and not teasing her about sweating will all help enormously." },
  { icon: '🥴', bg: 'var(--purple-bg)', title: 'Joint pain & body aches',          sub: 'Why her body hurts and how to help physically',            detail: "Estrogen has anti-inflammatory properties. As it declines, joints can feel stiffer and more painful — especially in the morning. Taking over heavy lifting, helping with stairs, and offering a warm compress or massage are concrete acts of care." },
  { icon: '💓', bg: '#FDEEE6',         title: 'Heart palpitations',               sub: 'When her heart races and what it usually means',           detail: "Occasional racing heart is common during menopause and usually harmless. However, if palpitations are frequent, last more than a few minutes, or come with chest pain, she should see a doctor. Your calm reaction helps her stay calm too." },
  { icon: '📖', bg: 'var(--warm-100)', title: 'Menopause 101',                   sub: 'What is menopause and what to expect',                     detail: "Menopause is a natural biological transition, not a disease. The perimenopause phase (leading up to it) typically lasts 4–7 years. Symptoms vary widely between women. Your understanding and patience are the most valuable things you can offer." },
];

export default function FamilyLearnScreen({ onBack }) {
  return (
    <div className="screen-container">
      <div className="topbar" style={{ background: 'var(--green-bg)' }}>
        <button className="back-link" onClick={onBack}>← Home</button>
        <span className="topbar-title">Learning Hub</span>
        <div style={{ width: 36 }} />
      </div>

      <div className="screen pad">
        <p className="s-tag">LEARNING HUB</p>
        <h2 className="s-title">Understanding<br />menopause together 📚</h2>
        <p className="s-desc">Plain-language guides for partners and family members.</p>

        {CARDS.map((c, i) => (
          <LearnCard key={i} {...c} />
        ))}

        <div style={{ height: 10 }} />
      </div>

      <FamilyTabBar active="learn" onHome={onBack} onLearn={null} onTrend={null} onSettings={null} />
    </div>
  );
}

function LearnCard({ icon, bg, title, sub, detail }) {
  return (
    <details className="learn-card">
      <summary>
        <div className="lc-top">
          <div className="lc-icon" style={{ background: bg }}>{icon}</div>
          <div>
            <p className="lc-title">{title}</p>
            <p className="lc-sub">{sub}</p>
          </div>
        </div>
      </summary>
      <p className="learn-detail">{detail}</p>
    </details>
  );
}
