// App shell — bottom tabs, screen switcher, phone frame (theme-aware)
function BottomTabs({ active, onChange, tweaks, t }) {
  const tabs = [
    { id: 'habits', label: 'Today',   Icon: Icon.Habit },
    { id: 'books',  label: 'Library', Icon: Icon.Book  },
    { id: 'films',  label: 'Cinema',  Icon: Icon.Film  },
  ];
  
  const bgSolid = t.bg;
  const bgFade = tweaks.translucentTab
    ? `linear-gradient(180deg, ${hexToRgba(t.bg, 0)} 0%, ${hexToRgba(t.bg, 0.85)} 40%, ${t.bg} 100%)`
    : t.bg;
  
  return (
    <div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0,
      paddingBottom: 28, paddingTop: 10,
      background: bgFade,
      boxShadow: tweaks.translucentTab ? 'none' : `inset 0 1px 0 ${t.ring}`,
      backdropFilter: tweaks.translucentTab ? 'blur(12px)' : 'none',
    }}>
      <div style={{
        display: 'flex', justifyContent: 'space-around', alignItems: 'center',
        padding: '0 16px',
      }}>
        {tabs.map(tab => {
          const isActive = active === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              style={{
                background: 'transparent', border: 'none', cursor: 'pointer',
                padding: '8px 16px', borderRadius: 14,
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                gap: 4, minWidth: 72,
                transition: 'transform 120ms',
              }}
              onMouseDown={e => e.currentTarget.style.transform = 'scale(0.96)'}
              onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              <tab.Icon size={22} color={isActive ? t.accent : t.tabInactive} filled={isActive}/>
              <div style={{
                fontFamily: 'Inter, system-ui', fontSize: 10.5, fontWeight: 500,
                letterSpacing: 0.3,
                color: isActive ? t.tabText : t.tabInactive,
              }}>{tab.label}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function hexToRgba(hex, a) {
  const h = hex.replace('#','');
  const r = parseInt(h.substring(0,2),16);
  const g = parseInt(h.substring(2,4),16);
  const b = parseInt(h.substring(4,6),16);
  return `rgba(${r},${g},${b},${a})`;
}

function StatusBar({ t }) {
  const c = t.ink;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '16px 28px 6px', height: 44, boxSizing: 'border-box',
      position: 'relative', zIndex: 2,
    }}>
      <span style={{
        fontFamily: '-apple-system, "SF Pro", system-ui', fontWeight: 600,
        fontSize: 15, color: c, letterSpacing: -0.2,
      }}>9:41</span>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <svg width="17" height="11" viewBox="0 0 17 11">
          <rect x="0" y="7" width="3" height="4" rx="0.5" fill={c}/>
          <rect x="4.5" y="5" width="3" height="6" rx="0.5" fill={c}/>
          <rect x="9" y="2.5" width="3" height="8.5" rx="0.5" fill={c}/>
          <rect x="13.5" y="0" width="3" height="11" rx="0.5" fill={c}/>
        </svg>
        <svg width="15" height="11" viewBox="0 0 15 11">
          <path d="M7.5 2.5c1.9 0 3.7.7 5.1 2L13.7 3.4C11.9 1.8 9.8 1 7.5 1S3.1 1.8 1.3 3.4L2.4 4.5C3.8 3.2 5.6 2.5 7.5 2.5z" fill={c}/>
          <path d="M7.5 5.5c1.1 0 2.1.4 2.9 1.2l1.1-1.1C10.3 4.4 8.9 3.8 7.5 3.8S4.7 4.4 3.5 5.6l1.1 1.1c.8-.8 1.8-1.2 2.9-1.2z" fill={c}/>
          <circle cx="7.5" cy="9" r="1.3" fill={c}/>
        </svg>
        <svg width="24" height="11" viewBox="0 0 24 11">
          <rect x="0.3" y="0.3" width="20.4" height="10.4" rx="2.7" stroke={c} strokeOpacity="0.35" fill="none"/>
          <rect x="1.5" y="1.5" width="17.5" height="8" rx="1.5" fill={c}/>
          <path d="M22 3.5v4c.7-.3 1.3-1 1.3-2s-.6-1.7-1.3-2z" fill={c} fillOpacity="0.4"/>
        </svg>
      </div>
    </div>
  );
}

function PhoneShell({ tweaks, active, setActive, dark }) {
  const [prev, setPrev] = React.useState(active);
  const [phase, setPhase] = React.useState('idle');
  const [detail, setDetail] = React.useState(null);
  const t = window.useTheme(dark);
  
  React.useEffect(() => {
    if (active !== prev) {
      setPhase('out');
      const t1 = setTimeout(() => { setPrev(active); setPhase('in'); }, 80);
      const t2 = setTimeout(() => setPhase('idle'), 260);
      return () => { clearTimeout(t1); clearTimeout(t2); };
    }
  }, [active]);
  
  const openBook = (book) => setDetail({ type: 'book', data: book });
  const openFilm = (film) => setDetail({ type: 'film', data: film });
  const closeDetail = () => setDetail(null);
  
  const screens = {
    habits: <HabitsScreen t={t}/>,
    books:  <BooksScreen onOpenBook={openBook} t={t}/>,
    films:  <FilmsScreen onOpenFilm={openFilm} t={t}/>,
  };
  
  const opacity = phase === 'out' ? 0 : 1;
  const translate = phase === 'out' ? 4 : 0;
  
  const bezelOuter = dark ? '#050402' : '#141413';
  const bezelInner = dark ? '#1a1813' : '#2a2a28';
  
  return (
    <div style={{
      width: 390, height: 844, borderRadius: 54, overflow: 'hidden',
      background: t.bg,
      position: 'relative',
      boxShadow: `0 0 0 10px ${bezelOuter}, 0 0 0 11px ${bezelInner}, 0 40px 80px rgba(20,20,19,0.28), 0 10px 30px rgba(20,20,19,0.12)`,
      fontFamily: 'Inter, system-ui',
      color: t.ink,
      WebkitFontSmoothing: 'antialiased',
      transition: 'background 300ms ease, color 300ms ease',
    }}>
      <div style={{
        position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)',
        width: 118, height: 34, borderRadius: 22, background: '#0a0907', zIndex: 50,
      }}/>
      <StatusBar t={t}/>
      
      <div style={{
        position: 'absolute', top: 44, left: 0, right: 0, bottom: 76,
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%', overflowY: 'auto', overflowX: 'hidden',
          opacity,
          transform: `translateY(${translate}px)`,
          transition: 'opacity 120ms ease-out, transform 120ms ease-out',
          scrollbarWidth: 'none',
        }} className="screen-scroll">
          {screens[prev]}
        </div>
      </div>
      
      {detail && detail.type === 'book' && (
        <BookDetail book={detail.data} onClose={closeDetail} dark={dark}/>
      )}
      {detail && detail.type === 'film' && (
        <FilmDetail film={detail.data} onClose={closeDetail} dark={dark}/>
      )}
      
      <BottomTabs active={active} onChange={(id) => { closeDetail(); setActive(id); }} tweaks={tweaks} t={t}/>
      
      <div style={{
        position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)',
        width: 134, height: 5, borderRadius: 3, background: dark ? '#f2ecdb' : '#141413',
        opacity: 0.75, zIndex: 70,
      }}/>
    </div>
  );
}

window.PhoneShell = PhoneShell;
window.BottomTabs = BottomTabs;
