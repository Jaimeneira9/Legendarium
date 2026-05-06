function RingCheckbox({ checked, onClick, size = 28, t }) {
  return (
    <button onClick={onClick} style={{
      width: size, height: size, borderRadius: '50%',
      background: checked ? t.accent : 'transparent',
      boxShadow: checked
        ? `0 0 0 1px ${t.accent}, inset 0 0 0 2px ${t.panel}`
        : `0 0 0 1.5px ${t.radio}`,
      border: 'none', cursor: 'pointer',
      transition: 'all 180ms cubic-bezier(.2,.8,.2,1)',
      padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
    }} aria-checked={checked} role="checkbox">
      {checked && (
        <svg width={size * 0.45} height={size * 0.45} viewBox="0 0 12 12" fill="none">
          <path d="M2 6.2L5 9l5-6" stroke={t.panel} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )}
    </button>
  );
}

function HabitCard({ habit, checked, onToggle, t }) {
  return (
    <div onClick={onToggle} style={{
      background: t.panel, borderRadius: 18,
      padding: '18px 18px 18px 16px',
      boxShadow: `0 0 0 1px ${t.ring}`,
      display: 'flex', alignItems: 'center', gap: 16,
      cursor: 'pointer', transition: 'box-shadow 180ms',
      position: 'relative',
    }}
    onMouseEnter={e => e.currentTarget.style.boxShadow = `0 0 0 1px ${t.ringStrong}`}
    onMouseLeave={e => e.currentTarget.style.boxShadow = `0 0 0 1px ${t.ring}`}>
      <RingCheckbox t={t} checked={checked} onClick={(e) => { e.stopPropagation(); onToggle(); }}/>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: 'Inter, system-ui', fontSize: 16, fontWeight: 500,
          color: t.ink, letterSpacing: -0.1,
          textDecoration: checked ? 'line-through' : 'none',
          textDecorationColor: t.accent, textDecorationThickness: '1px',
          opacity: checked ? 0.55 : 1, transition: 'opacity 200ms',
        }}>{habit.label}</div>
        {habit.note && (
          <div style={{
            fontFamily: 'Inter, system-ui', fontSize: 12.5,
            color: t.muted, marginTop: 3,
          }}>{habit.note}</div>
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', flexShrink: 0 }}>
        <div style={{
          fontFamily: '"Source Serif 4", Georgia, serif',
          fontSize: 28, fontWeight: 500, color: t.ink,
          lineHeight: 1, letterSpacing: -0.5,
          fontFeatureSettings: '"lnum", "tnum"',
        }}>{habit.streak}</div>
        <div style={{
          fontFamily: 'Inter, system-ui', fontSize: 10, fontWeight: 500,
          color: t.muted, letterSpacing: 1.2, textTransform: 'uppercase', marginTop: 2,
        }}>day streak</div>
      </div>
    </div>
  );
}

window.RingCheckbox = RingCheckbox;
window.HabitCard = HabitCard;
