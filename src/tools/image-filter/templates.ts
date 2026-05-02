export const CARD_TEMPLATES = [
  {
    id: 'christmas',
    label: 'Christmas',
    emoji: '🎄',
    overlay: `
      <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="100" height="100" fill="none" stroke="#ef4444" stroke-width="4"/>
        <text x="50" y="10" font-family="cursive" font-size="6" fill="#16a34a" text-anchor="middle">Merry Christmas</text>
        <circle cx="5" cy="5" r="3" fill="#fbbf24"/>
        <circle cx="95" cy="5" r="3" fill="#fbbf24"/>
        <circle cx="5" cy="95" r="3" fill="#fbbf24"/>
        <circle cx="95" cy="95" r="3" fill="#fbbf24"/>
        <path d="M0,0 L20,0 L0,20 Z" fill="#16a34a"/>
        <path d="M100,0 L80,0 L100,20 Z" fill="#16a34a"/>
      </svg>
    `
  },
  {
    id: 'birthday',
    label: 'Birthday',
    emoji: '🎂',
    overlay: `
      <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="100" height="100" fill="none" stroke="#3b82f6" stroke-width="4"/>
        <text x="50" y="95" font-family="sans-serif" font-weight="bold" font-size="5" fill="#3b82f6" text-anchor="middle">HAPPY BIRTHDAY!</text>
        <path d="M10,0 Q15,10 20,0 T30,0 T40,0 T50,0 T60,0 T70,0 T80,0 T90,0" fill="none" stroke="#f472b6" stroke-width="2"/>
      </svg>
    `
  },
  {
    id: 'polaroid',
    label: 'Polaroid',
    emoji: '📸',
    overlay: `
      <svg width="100%" height="100%" viewBox="0 0 100 120" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="100" height="120" fill="white"/>
        <rect x="5" y="5" width="90" height="90" fill="none" stroke="#eee" stroke-width="0.5"/>
      </svg>
    `
  }
];
