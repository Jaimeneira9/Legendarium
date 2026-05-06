function StarRating({ value, size = 12, t }) {
  const coral = '#e89a7c';
  const empty = t ? t.ring : '#e6e0ce';
  const full = Math.floor(value);
  const half = value - full >= 0.5;
  return (
    <div style={{ display: 'inline-flex', gap: 2, alignItems: 'center' }}>
      {[0,1,2,3,4].map(i => {
        if (i < full) return <Icon.Star key={i} size={size} color={coral} filled={true}/>;
        if (i === full && half) {
          return (
            <div key={i} style={{ position: 'relative', width: size, height: size }}>
              <div style={{ position: 'absolute', inset: 0 }}><Icon.Star size={size} color={empty} filled={true}/></div>
              <div style={{ position: 'absolute', inset: 0, width: size/2, overflow: 'hidden' }}>
                <Icon.Star size={size} color={coral} filled={true}/>
              </div>
            </div>
          );
        }
        return <Icon.Star key={i} size={size} color={empty} filled={true}/>;
      })}
    </div>
  );
}

function FilmsScreen({ onOpenFilm, t }) {
  const [view, setView] = React.useState('All');
  const views = ['All', 'Favorites', 'Watchlist'];
  const featured = window.FILMS[0];
  
  return (
    <div style={{ paddingBottom: 40 }}>
      <ScreenHeader t={t} eyebrow="The Cinema · 128 viewings" title="Your screenings"
        trailing={<button style={makePill(t)}><Icon.Plus size={16} color={t.ink}/></button>}/>
      
      <div onClick={() => onOpenFilm && onOpenFilm(featured)} style={{
        margin: '0 20px 26px', borderRadius: 20, overflow: 'hidden',
        boxShadow: `0 0 0 1px ${t.ring}`, background: t.panel, cursor: 'pointer',
      }}>
        <div style={{ padding: 18, display: 'flex', gap: 16, alignItems: 'center' }}>
          <FilmPoster film={featured} width={88}/>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontFamily: 'Inter, system-ui', fontSize: 10, fontWeight: 500,
              color: t.accent, letterSpacing: 1.4, textTransform: 'uppercase', marginBottom: 6,
            }}>Last watched · Tuesday</div>
            <div style={{
              fontFamily: '"Source Serif 4", Georgia, serif',
              fontSize: 19, fontWeight: 500, color: t.ink,
              lineHeight: 1.2, letterSpacing: -0.2, marginBottom: 4,
            }}>{featured.title}</div>
            <div style={{
              fontFamily: 'Inter, system-ui', fontSize: 12.5, color: t.muted, marginBottom: 10,
            }}>{featured.director} · {featured.year}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <StarRating value={featured.rating} size={13} t={t}/>
              <span style={{
                fontFamily: '"Source Serif 4", Georgia, serif',
                fontSize: 13, fontStyle: 'italic', color: t.muted,
              }}>&ldquo;Spellbound.&rdquo;</span>
            </div>
          </div>
        </div>
      </div>
      
      <div style={{ padding: '0 24px 20px', display: 'flex', gap: 6 }}>
        {views.map(v => {
          const active = v === view;
          return (
            <button key={v} onClick={() => setView(v)} style={{
              fontFamily: 'Inter, system-ui', fontSize: 13, fontWeight: 500,
              padding: '7px 14px', borderRadius: 999, border: 'none',
              background: active ? t.chipBg : 'transparent',
              color: active ? t.chipInk : t.muted,
              boxShadow: active ? 'none' : `0 0 0 1px ${t.ring}`,
              cursor: 'pointer', letterSpacing: -0.1, transition: 'all 150ms',
            }}>{v}</button>
          );
        })}
      </div>
      
      <div style={{
        padding: '0 24px', display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px 14px',
      }}>
        {window.FILMS.map(f => (
          <div key={f.id} onClick={() => onOpenFilm && onOpenFilm(f)} style={{ cursor: 'pointer' }}>
            <FilmPoster film={f} width={98}/>
            <div style={{
              marginTop: 10,
              fontFamily: '"Source Serif 4", Georgia, serif',
              fontSize: 14, fontWeight: 500, color: t.ink,
              lineHeight: 1.2, letterSpacing: -0.1,
              display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}>{f.title}</div>
            <div style={{
              marginTop: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <StarRating value={f.rating} size={10} t={t}/>
              <div style={{
                fontFamily: 'Inter, system-ui', fontSize: 10, color: t.muted,
                fontFeatureSettings: '"lnum","tnum"',
              }}>{f.year}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

window.StarRating = StarRating;
window.FilmsScreen = FilmsScreen;
