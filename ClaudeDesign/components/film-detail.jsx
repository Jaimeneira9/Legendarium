// FilmDetail — animated clapperboard reveal, then ficha técnica
function FilmDetail({ film, onClose, dark }) {
  const [phase, setPhase] = React.useState('entry');
  
  React.useEffect(() => {
    const t1 = setTimeout(() => setPhase('clap'),  120);
    const t2 = setTimeout(() => setPhase('open'),  680);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);
  
  const close = () => {
    setPhase('closing');
    setTimeout(() => onClose(), 300);
  };
  
  const sticksAngle =
    phase === 'entry' ? -26 :
    phase === 'clap'  ? 0 :
    phase === 'open'  ? -72 :
    phase === 'closing' ? -26 : 0;
  
  const contentOpacity = phase === 'open' ? 1 : 0;
  
  const t = dark ? {
    bg: '#1a1813', panel: '#23201a', ring: '#332e25', ringSoft: '#332e25',
    ink: '#f2ecdb', muted: '#8a8478', accent: '#e07a52',
  } : {
    bg: '#f5f4ed', panel: '#faf9f5', ring: '#eae6d6', ringSoft: '#eae6d6',
    ink: '#141413', muted: '#8a8478', accent: '#c96442',
  };
  
  const BOARD_W = 320;
  const BOARD_H = 200;
  const STICK_H = 44;
  
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
        }}>Ficha · Cine</div>
        <div style={{ width: 36 }}/>
      </div>
      
      <div className="screen-scroll" style={{ flex: 1, overflowY: 'auto', paddingBottom: 40 }}>
        <div style={{ padding: '24px 20px 16px', display: 'flex', justifyContent: 'center' }}>
          <div style={{ position: 'relative', width: BOARD_W, height: BOARD_H + STICK_H }}>
            <div style={{
              position: 'absolute', top: STICK_H, left: 0, right: 0, height: BOARD_H,
              background: '#141413', borderRadius: 8,
              boxShadow: '0 0 0 1px #2a2a28, 0 10px 26px rgba(20,20,19,0.18)',
              padding: '16px 18px 14px', boxSizing: 'border-box',
              display: 'flex', flexDirection: 'column', color: '#f5f0e3', overflow: 'hidden',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <div>
                  <div style={{
                    fontFamily: 'Inter, system-ui', fontSize: 9, fontWeight: 600,
                    letterSpacing: 1.8, textTransform: 'uppercase',
                    color: 'rgba(245,240,227,0.55)', marginBottom: 3,
                  }}>Scene</div>
                  <div style={{
                    fontFamily: '"Source Serif 4", Georgia, serif',
                    fontSize: 22, fontWeight: 500, letterSpacing: -0.3,
                  }}>{String(film.id).padStart(2, '0')}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{
                    fontFamily: 'Inter, system-ui', fontSize: 9, fontWeight: 600,
                    letterSpacing: 1.8, textTransform: 'uppercase',
                    color: 'rgba(245,240,227,0.55)', marginBottom: 3,
                  }}>Take</div>
                  <div style={{
                    fontFamily: '"Source Serif 4", Georgia, serif',
                    fontSize: 22, fontWeight: 500, letterSpacing: -0.3,
                  }}>01</div>
                </div>
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div style={{
                  fontFamily: '"Source Serif 4", Georgia, serif',
                  fontSize: 22, fontWeight: 500, lineHeight: 1.1, letterSpacing: -0.3, marginBottom: 4,
                }}>{film.title}</div>
                <div style={{
                  fontFamily: 'Inter, system-ui', fontSize: 11.5,
                  color: 'rgba(245,240,227,0.72)', letterSpacing: 0.1,
                }}>dir. {film.director}</div>
              </div>
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
                paddingTop: 10, boxShadow: 'inset 0 1px 0 rgba(245,240,227,0.12)',
              }}>
                <div style={{
                  fontFamily: 'Inter, system-ui', fontSize: 9.5, fontWeight: 500,
                  letterSpacing: 1.6, textTransform: 'uppercase',
                  color: 'rgba(245,240,227,0.55)',
                }}>{film.year} · {film.runtime}m</div>
                <div style={{
                  fontFamily: 'Inter, system-ui', fontSize: 9.5, fontWeight: 500,
                  letterSpacing: 1.6, textTransform: 'uppercase',
                  color: 'rgba(245,240,227,0.55)',
                }}>{film.country}</div>
              </div>
            </div>
            
            <div style={{
              position: 'absolute', left: 0, top: STICK_H,
              width: BOARD_W, height: STICK_H,
              transformOrigin: 'left top',
              transform: `rotate(${sticksAngle}deg)`,
              transition: phase === 'clap'
                ? 'transform 200ms cubic-bezier(.8,.2,.3,1.2)'
                : 'transform 500ms cubic-bezier(.45,.1,.25,1)',
              zIndex: 4,
            }}>
              <div style={{
                position: 'absolute', inset: 0,
                background: 'repeating-linear-gradient(115deg, #141413 0 14px, #f5f0e3 14px 28px)',
                borderRadius: '8px 8px 2px 2px',
                boxShadow: '0 0 0 1px #2a2a28, 0 4px 14px rgba(20,20,19,0.22)',
              }}/>
              <div style={{
                position: 'absolute', left: 6, bottom: -4,
                width: 10, height: 10, borderRadius: '50%',
                background: t.accent, boxShadow: '0 0 0 1px #2a2a28',
              }}/>
            </div>
            
            {phase === 'clap' && (
              <div style={{
                position: 'absolute', left: 0, right: 0, top: STICK_H - 2,
                height: 6, borderRadius: 3, background: '#faf9f5',
                animation: 'clapFlash 260ms ease-out forwards',
              }}/>
            )}
            <style>{`
              @keyframes clapFlash {
                0%   { opacity: 0.0; transform: scaleY(0.3); }
                30%  { opacity: 0.9; transform: scaleY(1); }
                100% { opacity: 0;   transform: scaleY(1); }
              }
            `}</style>
          </div>
        </div>
        
        <div style={{
          opacity: contentOpacity,
          transform: contentOpacity ? 'translateY(0)' : 'translateY(8px)',
          transition: 'opacity 400ms ease-out, transform 400ms ease-out',
        }}>
          <div style={{ padding: '20px 28px 0', textAlign: 'center' }}>
            <div style={{
              fontFamily: '"Source Serif 4", Georgia, serif',
              fontSize: 17, fontStyle: 'italic', color: t.ink,
              lineHeight: 1.4, letterSpacing: 0.1, marginBottom: 14,
            }}>&ldquo;{film.tagline}&rdquo;</div>
            <StarRating value={film.rating} size={16} t={t}/>
          </div>
          
          <div style={{ padding: '28px 24px 0' }}>
            <div style={{
              background: t.panel, borderRadius: 18,
              boxShadow: `0 0 0 1px ${t.ring}`, padding: 20,
            }}>
              <div style={{
                fontFamily: 'Inter, system-ui', fontSize: 10, fontWeight: 500,
                color: t.accent, letterSpacing: 1.4, textTransform: 'uppercase', marginBottom: 14,
              }}>Credits</div>
              {[
                ['Director',       film.director],
                ['Cinematography', film.cinematographer],
                ['Music',          film.composer],
                ['Cast',           film.cast.join(' · ')],
                ['Language',       film.language],
                ['Runtime',        `${film.runtime} minutes`],
              ].map(([k, v], i, arr) => (
                <div key={k} style={{
                  display: 'flex', gap: 12, padding: '10px 0',
                  boxShadow: i < arr.length - 1 ? `inset 0 -1px 0 ${t.ring}` : 'none',
                }}>
                  <div style={{
                    width: 110, flexShrink: 0,
                    fontFamily: 'Inter, system-ui', fontSize: 10, fontWeight: 500,
                    color: t.muted, letterSpacing: 1.2, textTransform: 'uppercase', paddingTop: 2,
                  }}>{k}</div>
                  <div style={{
                    flex: 1, fontFamily: '"Source Serif 4", Georgia, serif',
                    fontSize: 14, color: t.ink, lineHeight: 1.4, letterSpacing: -0.1,
                  }}>{v}</div>
                </div>
              ))}
            </div>
          </div>
          
          <div style={{ padding: '14px 24px 0' }}>
            <div style={{
              background: t.panel, borderRadius: 18,
              boxShadow: `0 0 0 1px ${t.ring}`, padding: 18,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <div>
                <div style={{
                  fontFamily: 'Inter, system-ui', fontSize: 10, fontWeight: 500,
                  color: t.muted, letterSpacing: 1.4, textTransform: 'uppercase', marginBottom: 4,
                }}>Seen</div>
                <div style={{
                  fontFamily: '"Source Serif 4", Georgia, serif',
                  fontSize: 15, color: t.ink, letterSpacing: -0.1,
                }}>{film.watchedOn}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{
                  fontFamily: 'Inter, system-ui', fontSize: 10, fontWeight: 500,
                  color: t.muted, letterSpacing: 1.4, textTransform: 'uppercase', marginBottom: 4,
                }}>At</div>
                <div style={{
                  fontFamily: '"Source Serif 4", Georgia, serif',
                  fontSize: 15, color: t.ink, letterSpacing: -0.1,
                }}>{film.venue}</div>
              </div>
            </div>
          </div>
          
          <div style={{ padding: '14px 24px 0' }}>
            <div style={{
              background: t.panel, borderRadius: 18,
              boxShadow: `0 0 0 1px ${t.ring}`, padding: 18,
            }}>
              <div style={{
                fontFamily: 'Inter, system-ui', fontSize: 10, fontWeight: 500,
                color: t.accent, letterSpacing: 1.4, textTransform: 'uppercase', marginBottom: 8,
              }}>Marginalia</div>
              <div style={{
                fontFamily: '"Source Serif 4", Georgia, serif',
                fontSize: 14.5, fontStyle: 'italic', color: t.ink,
                lineHeight: 1.5, letterSpacing: 0.05,
              }}>{film.thought}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

window.FilmDetail = FilmDetail;
