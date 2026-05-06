// Minimal line icons — 1.5px stroke, calm
const Icon = {
  Home: ({ size = 22, color = 'currentColor', filled = false }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M4 11.5L12 5l8 6.5V19a1 1 0 01-1 1h-4v-6h-6v6H5a1 1 0 01-1-1v-7.5z"
        stroke={color} strokeWidth="1.4" strokeLinejoin="round"
        fill={filled ? color : 'none'} fillOpacity={filled ? 0.08 : 0}/>
    </svg>
  ),
  Book: ({ size = 22, color = 'currentColor', filled = false }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M5 4.5A1.5 1.5 0 016.5 3H18a1 1 0 011 1v15.5a.5.5 0 01-.5.5H6.5A1.5 1.5 0 015 18.5v-14z"
        stroke={color} strokeWidth="1.4" strokeLinejoin="round"
        fill={filled ? color : 'none'} fillOpacity={filled ? 0.08 : 0}/>
      <path d="M5 17.5A1.5 1.5 0 016.5 16H19" stroke={color} strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  ),
  Film: ({ size = 22, color = 'currentColor', filled = false }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="3.5" y="4.5" width="17" height="15" rx="2" stroke={color} strokeWidth="1.4"
        fill={filled ? color : 'none'} fillOpacity={filled ? 0.08 : 0}/>
      <path d="M8 4.5v15M16 4.5v15M3.5 9h4M3.5 15h4M16.5 9h4M16.5 15h4M8 12h8"
        stroke={color} strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  ),
  Habit: ({ size = 22, color = 'currentColor', filled = false }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="8.2" stroke={color} strokeWidth="1.4"
        fill={filled ? color : 'none'} fillOpacity={filled ? 0.08 : 0}/>
      <path d="M8.5 12.5l2.5 2.5 4.5-5" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  Search: ({ size = 20, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="11" cy="11" r="6.5" stroke={color} strokeWidth="1.5"/>
      <path d="M16 16l4 4" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  Plus: ({ size = 20, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 5v14M5 12h14" stroke={color} strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  ),
  Flame: ({ size = 16, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 3c0 4-4 5-4 9a4 4 0 008 0c0-2-1-3-1-5 0 2-1.5 3-3 3 0-3 3-4 0-7z"
        stroke={color} strokeWidth="1.3" strokeLinejoin="round" fill={color} fillOpacity="0.08"/>
    </svg>
  ),
  Star: ({ size = 14, color = 'currentColor', filled = true }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 3.5l2.6 5.6 6 .7-4.5 4.1 1.2 6-5.3-2.9-5.3 2.9 1.2-6-4.5-4.1 6-.7L12 3.5z"
        stroke={color} strokeWidth="1.2" strokeLinejoin="round"
        fill={filled ? color : 'none'}/>
    </svg>
  ),
  Dot3: ({ size = 18, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="5" cy="12" r="1.6" fill={color}/>
      <circle cx="12" cy="12" r="1.6" fill={color}/>
      <circle cx="19" cy="12" r="1.6" fill={color}/>
    </svg>
  ),
  Chevron: ({ size = 14, color = 'currentColor', dir = 'right' }) => {
    const rot = { right: 0, left: 180, up: -90, down: 90 }[dir];
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ transform: `rotate(${rot}deg)` }}>
        <path d="M9 5l7 7-7 7" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    );
  },
  Bookmark: ({ size = 18, color = 'currentColor', filled = false }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M6 4.5h12v16l-6-3.5-6 3.5v-16z" stroke={color} strokeWidth="1.4" strokeLinejoin="round"
        fill={filled ? color : 'none'}/>
    </svg>
  ),
  Sparkle: ({ size = 14, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 3v6M12 15v6M3 12h6M15 12h6M6 6l4 4M14 14l4 4M18 6l-4 4M10 14l-4 4"
        stroke={color} strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  ),
};

window.Icon = Icon;
