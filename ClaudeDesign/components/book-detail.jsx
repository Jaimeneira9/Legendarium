// BookDetail — simplified: a single right-hand leaf that opens from the spine,
// revealing the ficha técnica. Fits comfortably inside the phone frame.

function BookDetail({ book, onClose, dark }) {
  const [phase, setPhase] = React.useState('closed'); // closed → open → closing
  
  React.useEffect(() => {
    const t = setTimeout(() => setPhase('open'), 60);
    return () => clearTimeout(t);
  }, []);
  
  const close = () => {
    setPhase('closing');
    setTimeout(() => onClose(), 520);
  };
  
  // Theme
  const t = dark ? {
    bg: '#14130f', panel: '#1d1b15', ring: '#2e2a22', ink: '#f2ecdb',
    muted: '#8d8777', ruleSoft: '#2a271f', accent: '#d67a58',
  } : {
    bg: '#f5f4ed', panel: '#faf9f5', ring: '#eae6d6', ink: '#141413',
    muted: '#8a8478', ruleSoft: '#e6ddc6', accent: '#c96442',
  };
  
  // Cover palette
  const palettes = {
    warm:   { bg: `oklch(0.42 0.08 ${book.hue})`, ink: '#f5f0e3', rule: '#d4b896' },
    deep:   { bg: `oklch(0.28 0.06 ${book.hue})`, ink: '#e8dcc5', rule: '#a88968' },
    forest: { bg: `oklch(0.35 0.05 ${book.hue})`, ink: '#efe8d4', rule: '#b8a37a' },
    cold:   { bg: `oklch(0.38 0.04 ${book.hue})`, ink: '#e9e4d5', rule: '#a89e85' },
    plum:   { bg: `oklch(0.30 0.06 ${book.hue})`, ink: '#ecdfce', rule: '#a88d72' },
    sky:    { bg: `oklch(0.48 0.05 ${book.hue})`, ink: '#f0e9d6', rule: '#c3b192' },
  };
  const p = palettes[book.tone] || palettes.warm;
  
  // Geometry — sized to fit 390px phone with 24px margins
  const LEAF_W = 260;
  const LEAF_H = 360;
  
  // Cover rotation: closed = 0 (visible over the page), open = -165 (off to left)
  const coverRotY = phase === 'open' ? -165 : 0;
  const contentOpacity = phase === 'open' ? 1 : 0;
  
  return (
    <div style={{
      position: 'absolute', inset: 0, background: t.bg,
      overflow: 'hidden', zIndex: 40,
      display: 'flex', flexDirection: 'column',
      animation: phase === 'closing' ? 'fadeOut 220ms forwards' : 'fadeIn 200ms',
    }}>
      <style>{`
        @keyframes fadeIn  { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fadeOut { to   { opacity: 0; } }
      `}</style>
      
      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '14px 20px 0', zIndex: 5,
      }}>
        <button onClick={close} style={{
          width: 36, height: 36, borderRadius: '50%', border: 'none',
          background: t.panel, boxShadow: `0 0 0 1px ${t.ring}`,
          cursor: 'pointer', padding: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M3 3l8 8M11 3l-8 8" stroke={t.ink} strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>
        <div style={{
          fontFamily: 'Inter, system-ui', fontSize: 11, fontWeight: 500,
          color: t.muted, letterSpacing: 1.4, textTransform: 'uppercase',
        }}>Ficha · Libro</div>
        <div style={{ width: 36 }}/>
      </div>
      
      <div className="screen-scroll" style={{ flex: 1, overflowY: 'auto', paddingBottom: 40 }}>
        {/* Book stage — centered, single leaf */}
        <div style={{
          perspective: 1600, perspectiveOrigin: '0% 50%',
          padding: '24px 0 20px',
          display: 'flex', justifyContent: 'center',
        }}>
          <div style={{
            position: 'relative', width: LEAF_W, height: LEAF_H,
          }}>
            {/* Spine shadow */}
            <div style={{
              position: 'absolute', left: -3, top: 8, bottom: 8,
              width: 6, background: `linear-gradient(90deg, rgba(0,0,0,0.18), transparent)`,
              borderRadius: 3, filter: 'blur(2px)',
            }}/>
            
            {/* The page (recto) — visible underneath */}
            <div style={{
              position: 'absolute', inset: 0,
              background: t.panel,
              borderRadius: '0 6px 6px 0',
              boxShadow: `inset 10px 0 20px -10px ${dark ? 'rgba(0,0,0,0.6)' : 'rgba(20,20,19,0.16)'}, 0 0 0 1px ${t.ring}`,
              padding: '32px 28px 28px',
              display: 'flex', flexDirection: 'column',
              opacity: contentOpacity,
              transition: 'opacity 280ms 340ms ease-out',
              position: 'absolute',
            }}>
              <div style={{
                fontFamily: 'Inter, system-ui', fontSize: 9.5, fontWeight: 500,
                color: t.muted, letterSpacing: 1.6, textTransform: 'uppercase',
                marginBottom: 10,
              }}>Title page</div>
              <div style={{
                fontFamily: '"Source Serif 4", Georgia, serif',
                fontSize: 22, fontWeight: 500, color: t.ink,
                lineHeight: 1.1, letterSpacing: -0.3, marginBottom: 6,
              }}>{book.title}</div>
              <div style={{
                fontFamily: '"Source Serif 4", Georgia, serif',
                fontSize: 13, fontStyle: 'italic', color: t.muted,
                marginBottom: 18,
              }}>by {book.author}</div>
              
              <div style={{ height: 1, background: t.ruleSoft, marginBottom: 16 }}/>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', rowGap: 11, columnGap: 12 }}>
                {[
                  ['Year', book.year],
                  ['Pages', book.pages],
                  ['Genre', book.genre],
                  ['Publisher', book.publisher],
                ].map(([k, v]) => (
                  <div key={k}>
                    <div style={{
                      fontFamily: 'Inter, system-ui', fontSize: 9, fontWeight: 500,
                      color: t.muted, letterSpacing: 1.4, textTransform: 'uppercase',
                      marginBottom: 3,
                    }}>{k}</div>
                    <div style={{
                      fontFamily: '"Source Serif 4", Georgia, serif',
                      fontSize: 13, color: t.ink, letterSpacing: -0.1,
                    }}>{v}</div>
                  </div>
                ))}
              </div>
              
              <div style={{ flex: 1 }}/>
              
              <div style={{
                paddingTop: 14, boxShadow: `inset 0 1px 0 ${t.ruleSoft}`,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <div style={{
                  fontFamily: 'Inter, system-ui', fontSize: 9, fontWeight: 500,
                  color: t.muted, letterSpacing: 1.4, textTransform: 'uppercase',
                }}>My rating</div>
                {book.rating > 0 ? (
                  <StarRating value={book.rating} size={13}/>
                ) : (
                  <span style={{
                    fontFamily: '"Source Serif 4", Georgia, serif', fontSize: 12,
                    fontStyle: 'italic', color: t.muted,
                  }}>unread</span>
                )}
              </div>
              <div style={{
                position: 'absolute', bottom: 12, right: 16,
                fontFamily: '"Source Serif 4", Georgia, serif', fontSize: 10, color: t.muted,
              }}>iii</div>
            </div>
            
            {/* Cover — flips open from spine (left edge) */}
            <div style={{
              position: 'absolute', inset: 0,
              transformOrigin: 'left center',
              transform: `rotateY(${coverRotY}deg)`,
              transition: phase === 'closing'
                ? 'transform 500ms cubic-bezier(.4,.0,.6,1)'
                : 'transform 850ms cubic-bezier(.55,.05,.3,1)',
              transformStyle: 'preserve-3d',
              zIndex: 3,
            }}>
              {/* front face */}
              <div style={{
                position: 'absolute', inset: 0,
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
                background: p.bg,
                borderRadius: '2px 6px 6px 2px',
                padding: '28px 22px',
                display: 'flex', flexDirection: 'column',
                color: p.ink,
                boxShadow: '0 0 0 1px rgba(20,20,19,0.12), 4px 6px 18px rgba(20,20,19,0.22)',
                overflow: 'hidden',
              }}>
                <div style={{
                  position: 'absolute', inset: 0,
                  background: `repeating-linear-gradient(90deg, transparent 0 2px, rgba(255,255,255,0.02) 2px 3px), repeating-linear-gradient(0deg, transparent 0 2px, rgba(0,0,0,0.04) 2px 3px)`,
                }}/>
                <div style={{
                  position: 'absolute', left: 0, top: 0, bottom: 0, width: 8,
                  background: 'linear-gradient(90deg, rgba(0,0,0,0.3), transparent)',
                }}/>
                
                <div style={{ height: 1, background: p.rule, opacity: 0.55, marginBottom: 22, position: 'relative' }}/>
                
                <div style={{
                  fontFamily: '"Source Serif 4", Georgia, serif',
                  fontWeight: 500, fontSize: 26, lineHeight: 1.12,
                  letterSpacing: 0.2, position: 'relative', flex: 1,
                }}>{book.title}</div>
                
                <div style={{ position: 'relative' }}>
                  <div style={{ height: 1, background: p.rule, opacity: 0.55, marginBottom: 12 }}/>
                  <div style={{
                    fontFamily: 'Inter, system-ui', fontWeight: 400,
                    fontSize: 10, letterSpacing: 1.6,
                    textTransform: 'uppercase', opacity: 0.85,
                  }}>{book.author}</div>
                </div>
              </div>
              
              {/* back of cover */}
              <div style={{
                position: 'absolute', inset: 0,
                transform: 'rotateY(180deg)',
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
                background: t.panel,
                borderRadius: '6px 2px 2px 6px',
                boxShadow: `0 0 0 1px ${t.ring}, inset -8px 0 18px -8px ${dark ? 'rgba(0,0,0,0.6)' : 'rgba(20,20,19,0.12)'}`,
              }}/>
            </div>
          </div>
        </div>
        
        {/* Epigraph + reading log (below the leaf) */}
        <div style={{ padding: '16px 24px 0' }}>
          {book.quote && (
            <div style={{
              padding: '0 8px',
              fontFamily: '"Source Serif 4", Georgia, serif',
              fontSize: 15, fontStyle: 'italic', color: t.ink,
              lineHeight: 1.5, letterSpacing: 0.05,
              textAlign: 'center', marginBottom: 22,
            }}>&ldquo;{book.quote}&rdquo;
              <div style={{
                marginTop: 6, fontSize: 11, fontStyle: 'normal',
                fontFamily: 'Inter, system-ui', color: t.muted, letterSpacing: 1,
                textTransform: 'uppercase',
              }}>— {book.author}</div>
            </div>
          )}
          
          <div style={{
            background: t.panel, borderRadius: 18, padding: 18,
            boxShadow: `0 0 0 1px ${t.ring}`,
            marginBottom: 12,
          }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
              marginBottom: 10,
            }}>
              <div style={{
                fontFamily: '"Source Serif 4", Georgia, serif',
                fontSize: 22, fontWeight: 500, color: t.ink, letterSpacing: -0.3,
              }}>
                {book.currentPage}<span style={{ color: t.muted, fontSize: 14 }}> / {book.pages}</span>
              </div>
              <div style={{
                fontFamily: '"Source Serif 4", Georgia, serif',
                fontSize: 13, fontStyle: 'italic', color: t.accent,
              }}>{Math.round(book.prog * 100)}% read</div>
            </div>
            <div style={{ height: 2, background: t.ring, borderRadius: 1, overflow: 'hidden' }}>
              <div style={{ width: `${book.prog * 100}%`, height: '100%', background: t.accent }}/>
            </div>
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              marginTop: 12,
              fontFamily: 'Inter, system-ui', fontSize: 11, color: t.muted,
            }}>
              {book.started && <span>Started {book.started}</span>}
              {book.finished ? <span>Finished {book.finished}</span> : <span>{book.prog > 0 ? 'In progress' : 'Queued'}</span>}
            </div>
          </div>
          
          {book.note && (
            <div style={{
              background: t.panel, borderRadius: 18, padding: 18,
              boxShadow: `0 0 0 1px ${t.ring}`,
            }}>
              <div style={{
                fontFamily: 'Inter, system-ui', fontSize: 10, fontWeight: 500,
                color: t.accent, letterSpacing: 1.4, textTransform: 'uppercase',
                marginBottom: 8,
              }}>Marginalia</div>
              <div style={{
                fontFamily: '"Source Serif 4", Georgia, serif',
                fontSize: 14.5, fontStyle: 'italic', color: t.ink,
                lineHeight: 1.5, letterSpacing: 0.05,
              }}>{book.note}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

window.BookDetail = BookDetail;
