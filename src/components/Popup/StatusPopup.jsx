/**
 * StatusPopup.jsx
 * Lightweight popup for all 12 question types.
 * Appears when triggered (system or family-initiated).
 * Designed to complete in 5–10 seconds.
 */

import { Q_TYPES } from '../../lib/constants.js';

export default function StatusPopup({ qtypeKey, onRespond, onDismiss, isFamilyRequest = false }) {
  const qt = Q_TYPES[qtypeKey];
  if (!qt) return null;

  const isScore = qt.type === '1-5';

  return (
    <div className="popup-overlay show" onClick={(e) => e.target === e.currentTarget && onDismiss()}>
      <div className="popup-sheet">
        <div className="popup-drag" onClick={onDismiss} style={{ cursor: 'pointer' }} />

        <p className="pop-qtype">{qt.label.toUpperCase()}</p>
        <h3 className="pop-q">{qt.question}</h3>

        {isScore ? (
          <div className="emoji-row">
            {[
              ['😊', 'Great',   5],
              ['🙂', 'Good',    4],
              ['😐', 'Okay',    3],
              ['😔', 'Rough',   2],
              ['😞', 'Struggling', 1],
            ].map(([e, l, v]) => (
              <button key={v} className="emoji-btn" onClick={() => onRespond(qtypeKey, v)}>
                {e}<span>{l}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="yn-group">
            <button className="yn-btn yes" onClick={() => onRespond(qtypeKey, true)}>Yes</button>
            <button className="yn-btn no"  onClick={() => onRespond(qtypeKey, false)}>No</button>
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: 14 }}>
          <span
            style={{ fontSize: 12, color: 'var(--light)', cursor: 'pointer' }}
            onClick={onDismiss}
          >
            Skip for now
          </span>
        </div>

      </div>
    </div>
  );
}
