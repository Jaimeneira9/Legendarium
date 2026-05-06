// BookCover — procedural, warm, editorial
// No copyrighted artwork. Each cover is generated from hue + title/author strings.
function BookCover({ book, width = 132, height }) {
  const h = height || Math.round(width * 1.5);
  const { hue, tone, title, author } = book;
  
  // Paper/cloth palettes by tone
  const palettes = {
    warm:   { bg: `oklch(0.42 0.08 ${hue})`, ink: '#f5f0e3', rule: '#d4b896' },
    deep:   { bg: `oklch(0.28 0.06 ${hue})`, ink: '#e8dcc5', rule: '#a88968' },
    forest: { bg: `oklch(0.35 0.05 ${hue})`, ink: '#efe8d4', rule: '#b8a37a' },
    cold:   { bg: `oklch(0.38 0.04 ${hue})`, ink: '#e9e4d5', rule: '#a89e85' },
    plum:   { bg: `oklch(0.30 0.06 ${hue})`, ink: '#ecdfce', rule: '#a88d72' },
    sky:    { bg: `oklch(0.48 0.05 ${hue})`, ink: '#f0e9d6', rule: '#c3b192' },
  };
  const p = palettes[tone] || palettes.warm;
  
  // Layout vars scaled from width
  const s = width / 132;
  const pad = 12 * s;
  const fs = Math.max(10, 13 * s);
  const fsSmall = Math.max(8, 9 * s);
  
  // Break title: at most 3 lines, hyphenate long single words
  const words = title.split(' ');
  const lines = [];
  let cur = '';
  words.forEach(w => {
    const test = cur ? cur + ' ' + w : w;
    if (test.length > 14 && cur) { lines.push(cur); cur = w; }
    else cur = test;
  });
  if (cur) lines.push(cur);
  const displayLines = lines.slice(0, 4);
  
  return (
    <div style={{
      width, height: h, borderRadius: 6 * s,
      background: p.bg,
      position: 'relative', overflow: 'hidden',
      boxShadow: `0 0 0 1px rgba(20,20,19,0.08), inset 0 0 0 1px rgba(255,255,255,0.04)`,
      display: 'flex', flexDirection: 'column',
      padding: pad, boxSizing: 'border-box',
      color: p.ink,
    }}>
      {/* subtle cloth texture */}
      <div style={{
        position: 'absolute', inset: 0,
        background: `repeating-linear-gradient(90deg, transparent 0 2px, rgba(255,255,255,0.015) 2px 3px), repeating-linear-gradient(0deg, transparent 0 2px, rgba(0,0,0,0.03) 2px 3px)`,
        pointerEvents: 'none',
      }}/>
      {/* spine shadow */}
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0, width: 4 * s,
        background: 'linear-gradient(90deg, rgba(0,0,0,0.22), transparent)',
        pointerEvents: 'none',
      }}/>
      
      {/* top rule */}
      <div style={{
        height: 1, background: p.rule, opacity: 0.5, marginBottom: pad * 0.8,
      }}/>
      
      {/* title */}
      <div style={{
        fontFamily: '"Source Serif 4", "Source Serif Pro", Georgia, serif',
        fontWeight: 500, fontSize: fs, lineHeight: 1.15,
        letterSpacing: 0.2,
        flex: 1,
      }}>
        {displayLines.map((l, i) => (
          <div key={i} style={{ fontStyle: i === 0 && displayLines.length > 1 ? 'normal' : 'normal' }}>{l}</div>
        ))}
      </div>
      
      {/* bottom author */}
      <div>
        <div style={{ height: 1, background: p.rule, opacity: 0.5, marginBottom: pad * 0.5 }}/>
        <div style={{
          fontFamily: 'Inter, system-ui', fontWeight: 400,
          fontSize: fsSmall, letterSpacing: 0.8,
          textTransform: 'uppercase', opacity: 0.82,
        }}>{author}</div>
      </div>
    </div>
  );
}

// FilmPoster — procedural, cinematic placeholder
function FilmPoster({ film, width = 132, height }) {
  const h = height || Math.round(width * 1.48);
  const { hue, title, director, year } = film;
  const s = width / 132;
  
  // Cinematic gradient
  const bg1 = `oklch(0.28 0.08 ${hue})`;
  const bg2 = `oklch(0.55 0.12 ${(hue + 30) % 360})`;
  const ink = '#f5f0e3';
  
  return (
    <div style={{
      width, height: h, borderRadius: 6 * s,
      position: 'relative', overflow: 'hidden',
      boxShadow: `0 0 0 1px rgba(20,20,19,0.1)`,
      background: `linear-gradient(165deg, ${bg1} 0%, ${bg2} 100%)`,
    }}>
      {/* film grain / bars */}
      <div style={{
        position: 'absolute', inset: 0,
        background: `repeating-linear-gradient(90deg, transparent 0 3px, rgba(0,0,0,0.06) 3px 4px)`,
      }}/>
      {/* vignette */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse at 50% 30%, transparent 0%, rgba(0,0,0,0.45) 100%)',
      }}/>
      
      {/* centered mark: a geometric film motif */}
      <div style={{
        position: 'absolute', top: '30%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 48 * s, height: 48 * s,
        borderRadius: '50%',
        border: `1px solid ${ink}`, opacity: 0.5,
      }}/>
      <div style={{
        position: 'absolute', top: '30%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 1, height: 48 * s,
        background: ink, opacity: 0.5,
      }}/>
      
      {/* bottom title block */}
      <div style={{
        position: 'absolute', bottom: 12 * s, left: 12 * s, right: 12 * s,
        color: ink,
      }}>
        <div style={{
          fontFamily: '"Source Serif 4", Georgia, serif', fontWeight: 500,
          fontSize: 13 * s, lineHeight: 1.15, letterSpacing: 0.1,
          marginBottom: 4 * s,
        }}>{title}</div>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
          fontFamily: 'Inter, system-ui', fontSize: 9 * s,
          letterSpacing: 0.8, textTransform: 'uppercase', opacity: 0.75,
        }}>
          <span>{director.split(' ').slice(-1)[0]}</span>
          <span>{year}</span>
        </div>
      </div>
    </div>
  );
}

window.BookCover = BookCover;
window.FilmPoster = FilmPoster;
