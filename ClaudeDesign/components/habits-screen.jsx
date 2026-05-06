function ScreenHeader({ eyebrow, title, trailing, t }) {
  return (
    <div style={{ padding: '14px 24px 22px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          {eyebrow && (
            <div style={{
              fontFamily: 'Inter, system-ui', fontSize: 11, fontWeight: 500,
              color: t.muted, letterSpacing: 1.6, textTransform: 'uppercase',
              marginBottom: 6,
            }}>{eyebrow}</div>
          )}
          <div style={{
            fontFamily: '"Source Serif 4", Georgia, serif',
            fontSize: 32, fontWeight: 500, color: t.ink,
            lineHeight: 1.05, letterSpacing: -0.6,
          }}>{title}</div>
        </div>
        {trailing}
      </div>
    </div>
  );
}

function makePill(t) {
  return {
    width: 36, height: 36, borderRadius: '50%',
    background: t.panel, border: 'none',
    boxShadow: `0 0 0 1px ${t.ring}`,
    cursor: 'pointer', padding: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  };
}

function HabitsScreen({ t }) {
  const [checked, setChecked] = React.useState({});
  const toggle = (id) => setChecked(c => ({ ...c, [id]: !c[id] }));
  
  const today = new Date();
  const dayName = today.toLocaleDateString('en-US', { weekday: 'long' });
  const dateStr = today.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  
  const doneCount = Object.values(checked).filter(Boolean).length;
  const total = window.HABITS.length;
  
  return (
    <div style={{ paddingBottom: 40 }}>
      <ScreenHeader
        t={t}
        eyebrow={`${dayName} · ${dateStr}`}
        title="Today's practice"
        trailing={<button style={makePill(t)}><Icon.Plus size={16} color={t.ink}/></button>}
      />
      <div style={{ padding: '0 24px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
          <div style={{ fontFamily: 'Inter, system-ui', fontSize: 12, color: t.muted, letterSpacing: 0.3 }}>
            <span style={{ color: t.ink, fontWeight: 500 }}>{doneCount}</span> of {total} complete
          </div>
          <div style={{ fontFamily: '"Source Serif 4", Georgia, serif', fontSize: 13, fontStyle: 'italic', color: t.muted }}>
            &ldquo;A little, daily.&rdquo;
          </div>
        </div>
        <div style={{ height: 3, background: t.ring, borderRadius: 2, overflow: 'hidden' }}>
          <div style={{
            width: `${(doneCount / total) * 100}%`, height: '100%',
            background: t.accent, transition: 'width 400ms cubic-bezier(.2,.8,.2,1)',
          }}/>
        </div>
      </div>
      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {window.HABITS.map(h => (
          <HabitCard key={h.id} habit={h} t={t}
            checked={!!checked[h.id]} onToggle={() => toggle(h.id)}/>
        ))}
      </div>
      <div style={{
        margin: '28px 24px 0', paddingTop: 20,
        boxShadow: `inset 0 1px 0 ${t.ring}`,
        fontFamily: '"Source Serif 4", Georgia, serif',
        fontSize: 13, fontStyle: 'italic', color: t.muted,
        lineHeight: 1.5, letterSpacing: 0.1,
      }}>
        You&rsquo;ve kept <span style={{ color: t.ink, fontStyle: 'normal', fontWeight: 500 }}>six rituals</span> alive
        through the quiet weeks of April. The longest, reading, is on its 47th dawn.
      </div>
    </div>
  );
}

window.HabitsScreen = HabitsScreen;
window.ScreenHeader = ScreenHeader;
window.makePill = makePill;
