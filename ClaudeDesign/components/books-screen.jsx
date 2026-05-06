function BooksScreen({ onOpenBook, t }) {
  const [filter, setFilter] = React.useState('Reading');
  const filters = ['Reading', 'Finished', 'To read', 'All'];
  
  const list = window.BOOKS.filter(b => {
    if (filter === 'Reading')  return b.prog > 0 && b.prog < 1;
    if (filter === 'Finished') return b.prog === 1;
    if (filter === 'To read')  return b.prog === 0;
    return true;
  });
  const currentBook = window.BOOKS.find(b => b.prog > 0 && b.prog < 1);
  
  return (
    <div style={{ paddingBottom: 40 }}>
      <ScreenHeader t={t} eyebrow="The Library · 42 volumes" title="Your shelves"
        trailing={<button style={makePill(t)}><Icon.Search size={16} color={t.ink}/></button>}/>
      
      {currentBook && (
        <div onClick={() => onOpenBook && onOpenBook(currentBook)} style={{
          margin: '0 20px 28px', padding: 18,
          background: t.panel, borderRadius: 20,
          boxShadow: `0 0 0 1px ${t.ring}`,
          display: 'flex', gap: 18, alignItems: 'center', cursor: 'pointer',
        }}>
          <BookCover book={currentBook} width={78}/>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontFamily: 'Inter, system-ui', fontSize: 10, fontWeight: 500,
              color: t.accent, letterSpacing: 1.4, textTransform: 'uppercase', marginBottom: 6,
            }}>Now reading</div>
            <div style={{
              fontFamily: '"Source Serif 4", Georgia, serif',
              fontSize: 19, fontWeight: 500, color: t.ink,
              lineHeight: 1.2, letterSpacing: -0.2, marginBottom: 4,
            }}>{currentBook.title}</div>
            <div style={{
              fontFamily: 'Inter, system-ui', fontSize: 12.5, color: t.muted, marginBottom: 14,
            }}>{currentBook.author}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ flex: 1, height: 2, background: t.ring, borderRadius: 1, overflow: 'hidden' }}>
                <div style={{ width: `${currentBook.prog * 100}%`, height: '100%', background: t.accent }}/>
              </div>
              <div style={{
                fontFamily: '"Source Serif 4", Georgia, serif',
                fontSize: 13, fontWeight: 500, color: t.ink,
                fontFeatureSettings: '"lnum","tnum"',
              }}>{Math.round(currentBook.prog * 100)}<span style={{ color: t.muted, fontSize: 11 }}>%</span></div>
            </div>
          </div>
        </div>
      )}
      
      <div style={{ padding: '0 24px 20px', display: 'flex', gap: 6, overflowX: 'auto' }}>
        {filters.map(f => {
          const active = f === filter;
          return (
            <button key={f} onClick={() => setFilter(f)} style={{
              fontFamily: 'Inter, system-ui', fontSize: 13, fontWeight: 500,
              padding: '7px 14px', borderRadius: 999, border: 'none',
              background: active ? t.chipBg : 'transparent',
              color: active ? t.chipInk : t.muted,
              boxShadow: active ? 'none' : `0 0 0 1px ${t.ring}`,
              cursor: 'pointer', letterSpacing: -0.1,
              transition: 'all 150ms', whiteSpace: 'nowrap',
            }}>{f}</button>
          );
        })}
      </div>
      
      <div style={{
        padding: '0 24px', display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)', gap: '26px 18px',
      }}>
        {list.map(b => (
          <div key={b.id} onClick={() => onOpenBook && onOpenBook(b)} style={{ cursor: 'pointer' }}>
            <BookCover book={b} width={98}/>
            <div style={{
              marginTop: 10,
              fontFamily: '"Source Serif 4", Georgia, serif',
              fontSize: 14, fontWeight: 500, color: t.ink,
              lineHeight: 1.2, letterSpacing: -0.1,
              display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}>{b.title}</div>
            <div style={{
              marginTop: 2, fontFamily: 'Inter, system-ui', fontSize: 11, color: t.muted,
            }}>{b.author}</div>
            {b.prog > 0 && b.prog < 1 && (
              <div style={{ marginTop: 6, height: 1.5, background: t.ring, borderRadius: 1, overflow: 'hidden' }}>
                <div style={{ width: `${b.prog * 100}%`, height: '100%', background: t.accent }}/>
              </div>
            )}
            {b.prog === 1 && (
              <div style={{
                marginTop: 6,
                fontFamily: 'Inter, system-ui', fontSize: 9.5, fontWeight: 500,
                color: t.muted, letterSpacing: 1.2, textTransform: 'uppercase',
              }}>Finished · {b.year}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
window.BooksScreen = BooksScreen;
