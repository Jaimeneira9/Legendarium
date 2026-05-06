// Tweaks panel — floating bottom-right
function TweaksPanel({ open, tweaks, setTweaks, active, setActive }) {
  if (!open) return null;
  
  const row = (label, children) => (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '10px 0', gap: 12,
    }}>
      <div style={{
        fontFamily: 'Inter, system-ui', fontSize: 12, color: '#141413',
        fontWeight: 500, letterSpacing: -0.1,
      }}>{label}</div>
      {children}
    </div>
  );
  
  const Toggle = ({ value, onChange }) => (
    <button
      onClick={() => onChange(!value)}
      style={{
        width: 36, height: 20, borderRadius: 10, border: 'none', padding: 2,
        background: value ? '#c96442' : '#e6e0ce', cursor: 'pointer',
        display: 'flex', alignItems: 'center',
        justifyContent: value ? 'flex-end' : 'flex-start',
        transition: 'background 150ms',
      }}>
      <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#faf9f5',
        boxShadow: '0 0 0 1px rgba(20,20,19,0.1)' }}/>
    </button>
  );
  
  const Segment = ({ options, value, onChange }) => (
    <div style={{
      display: 'flex', background: '#f5f4ed', borderRadius: 8, padding: 2,
      boxShadow: '0 0 0 1px #eae6d6',
    }}>
      {options.map(o => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          style={{
            fontFamily: 'Inter, system-ui', fontSize: 11, fontWeight: 500,
            padding: '4px 9px', borderRadius: 6, border: 'none', cursor: 'pointer',
            background: value === o.value ? '#faf9f5' : 'transparent',
            boxShadow: value === o.value ? '0 0 0 1px #eae6d6' : 'none',
            color: '#141413',
            letterSpacing: -0.1,
          }}>{o.label}</button>
      ))}
    </div>
  );
  
  return (
    <div style={{
      position: 'fixed', right: 24, bottom: 24, width: 280,
      background: '#faf9f5', borderRadius: 16,
      boxShadow: '0 0 0 1px #eae6d6, 0 20px 40px rgba(20,20,19,0.08)',
      padding: '16px 18px',
      fontFamily: 'Inter, system-ui', zIndex: 1000,
      color: '#141413',
    }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
        marginBottom: 8,
      }}>
        <div style={{
          fontFamily: '"Source Serif 4", Georgia, serif',
          fontSize: 18, fontWeight: 500, color: '#141413', letterSpacing: -0.3,
        }}>Tweaks</div>
        <div style={{ fontSize: 10, color: '#8a8478', letterSpacing: 1.2, textTransform: 'uppercase' }}>Legendarium</div>
      </div>
      
      {row('Jump to tab',
        <Segment
          value={active}
          onChange={setActive}
          options={[
            { value: 'habits', label: 'Today' },
            { value: 'books',  label: 'Library' },
            { value: 'films',  label: 'Cinema' },
          ]}
        />
      )}
      
      <div style={{ height: 1, background: '#eae6d6', margin: '6px 0' }}/>
      
      {row('Midnight mode',
        <Toggle value={tweaks.dark} onChange={v => setTweaks({ ...tweaks, dark: v })}/>
      )}
      
      {row('Translucent tab bar',
        <Toggle value={tweaks.translucentTab} onChange={v => setTweaks({ ...tweaks, translucentTab: v })}/>
      )}
    </div>
  );
}

window.TweaksPanel = TweaksPanel;
