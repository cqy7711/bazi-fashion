export const COLOR_TOKENS = {
  brand: {
    coral: '#FF5CA8',
    orange: '#FF8A3D',
    yellow: '#FFD93D',
    green: '#1FE6A8',
    blue: '#2CCBFF',
    purple: '#8F68FF',
    indigo: '#5B5CFF',
  },
  text: {
    primary: '#1A1A2E',
    muted: '#A0A8C0',
  },
};

export const RADIUS_TOKENS = {
  lg: '20px',
  xl: '24px',
  xxl: '34px',
  pill: '9999px',
};

export const SHADOW_TOKENS = {
  glowSoft: '0 8px 18px rgba(255,92,168,0.24)',
  glowStrong: '0 10px 20px rgba(255,92,168,0.32)',
  glassCard: '0 30px 90px rgba(60,42,120,0.08)',
  glassHeader: '0 8px 30px rgba(78,45,133,0.08)',
  cardSoft: '0 10px 20px rgba(92,69,154,0.08)',
};

export const MOTION_TOKENS = {
  uiEase: 'all 0.18s cubic-bezier(0.22, 1, 0.36, 1)',
};

export const IOS_TOKENS = {
  spacing: {
    xs: '6px',
    sm: '10px',
    md: '14px',
    lg: '18px',
    xl: '24px',
  },
  radius: {
    card: '20px',
    sheet: '24px',
    control: '14px',
    pill: '9999px',
  },
  typography: {
    // iOS: bump typography by ~2px (user request: "等比调大2号")
    navLabel: '0.805rem',
    title: '1.145rem',
    subtitle: '0.865rem',
    body: '1.005rem',
    caption: '0.805rem',
  },
  blur: {
    nav: 'blur(16px)',
    card: 'blur(12px)',
  },
  safeArea: {
    bottom: 'calc(78px + env(safe-area-inset-bottom))',
  },
} as const;
