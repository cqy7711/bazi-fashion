import { motion } from 'framer-motion';
import { HashRouter, Routes, Route } from 'react-router-dom';
import HomePageNew from './pages/HomePageNew';
import HomePage from './pages/HomePage';
import ResultPage from './pages/ResultPage';
import AdminPage from './pages/AdminPage';
import AiChatPage from './pages/AiChatPage';
import IntroPage from './pages/IntroPage';
import { startSession, endSession, trackEvent, EventTypes } from './utils/analytics';
import { useEffect, useState } from 'react';
import { COLOR_TOKENS, RADIUS_TOKENS, SHADOW_TOKENS, MOTION_TOKENS } from './theme/designTokens';

type VisualMode = 'vivid' | 'premium';
const VISUAL_MODE_KEY = 'visual-mode';
const VISUAL_PRESETS: Record<VisualMode, {
  accent: string;
  tints: { coral: string; orange: string; yellow: string; green: string; blue: string; purple: string; indigo: string };
  pageBg: string;
  glow: string;
  logoGradient: string;
}> = {
  vivid: {
    accent: COLOR_TOKENS.brand.coral,
    tints: {
      coral: COLOR_TOKENS.brand.coral,
      orange: COLOR_TOKENS.brand.orange,
      yellow: COLOR_TOKENS.brand.yellow,
      green: COLOR_TOKENS.brand.green,
      blue: COLOR_TOKENS.brand.blue,
      purple: COLOR_TOKENS.brand.purple,
      indigo: COLOR_TOKENS.brand.indigo,
    },
    pageBg:
      'radial-gradient(circle at 16% 14%, rgba(255,92,168,0.2) 0%, transparent 28%), radial-gradient(circle at 84% 18%, rgba(44,203,255,0.2) 0%, transparent 30%), radial-gradient(circle at 52% 90%, rgba(143,104,255,0.14) 0%, transparent 30%), linear-gradient(145deg, #fdf8ff 0%, #f3f8ff 40%, #f7fcff 100%)',
    glow: 'radial-gradient(circle, rgba(255,92,168,0.16) 0%, transparent 72%)',
    logoGradient: `linear-gradient(135deg, ${COLOR_TOKENS.brand.coral}, ${COLOR_TOKENS.brand.orange})`,
  },
  premium: {
    accent: COLOR_TOKENS.brand.indigo,
    tints: {
      coral: '#7C7CFF',
      orange: '#0A84FF',
      yellow: '#64D2FF',
      green: '#30D158',
      blue: '#5AC8FA',
      purple: '#BF5AF2',
      indigo: '#5E5CE6',
    },
    pageBg:
      'radial-gradient(circle at 14% 14%, rgba(94,92,230,0.22) 0%, transparent 30%), radial-gradient(circle at 84% 20%, rgba(10,132,255,0.2) 0%, transparent 32%), radial-gradient(circle at 52% 90%, rgba(191,90,242,0.14) 0%, transparent 30%), linear-gradient(145deg, #f6f8ff 0%, #f2f7ff 42%, #f7fbff 100%)',
    glow: 'radial-gradient(circle, rgba(94,92,230,0.18) 0%, transparent 72%)',
    logoGradient: 'linear-gradient(135deg, #5E5CE6, #0A84FF)',
  },
};

// 会话时间追踪
let sessionStartTime = Date.now();
const INTRO_SEEN_KEY = 'wuxing-intro-seen';

export default function App() {
  const [visualMode, setVisualMode] = useState<VisualMode>(() => {
    try {
      const v = localStorage.getItem(VISUAL_MODE_KEY);
      return v === 'premium' ? 'premium' : 'vivid';
    } catch {
      return 'vivid';
    }
  });
  const preset = VISUAL_PRESETS[visualMode];
  const isVivid = visualMode === 'vivid';
  const ACCENT = preset.accent;
  const TINTS = preset.tints;

  const [showIntro, setShowIntro] = useState(() => {
    try {
      return sessionStorage.getItem(INTRO_SEEN_KEY) !== '1';
    } catch {
      return true;
    }
  });

  const handleEnterHome = () => {
    setShowIntro(false);
    try {
      sessionStorage.setItem(INTRO_SEEN_KEY, '1');
    } catch {
      // ignore sessionStorage errors
    }
  };

  useEffect(() => {
    try {
      localStorage.setItem(VISUAL_MODE_KEY, visualMode);
    } catch {
      // ignore localStorage errors
    }
  }, [visualMode]);

  useEffect(() => {
    sessionStartTime = Date.now();
    startSession();

    trackEvent({
      eventType: EventTypes.PAGE_VIEW,
      page: window.location.hash.replace('#', '') || '/',
    });

    const handleBeforeUnload = () => {
      const duration = Math.round((Date.now() - sessionStartTime) / 1000);
      endSession(duration);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      const duration = Math.round((Date.now() - sessionStartTime) / 1000);
      endSession(duration);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  return (
    <HashRouter>
      <div
        style={{
          background: preset.pageBg,
          color: COLOR_TOKENS.text.primary,
          minHeight: '100vh',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* 彩色网格叠层 */}
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundImage:
              isVivid
                ? 'linear-gradient(rgba(255,255,255,0.24) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.24) 1px, transparent 1px)'
                : 'linear-gradient(rgba(255,255,255,0.35) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.35) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
            maskImage: 'radial-gradient(circle at center, black 20%, transparent 78%)',
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />
        {/* 浮动装饰球 */}
        <div style={{
          position: 'fixed', top: '10%', right: '-40px',
          width: '200px', height: '200px',
          borderRadius: '50%',
          background: preset.glow,
          animation: 'float 8s ease-in-out infinite',
          pointerEvents: 'none', zIndex: 0,
        }} />
        <div style={{
          position: 'fixed', bottom: '10%', left: '-60px',
          width: '300px', height: '300px',
          borderRadius: '50%',
          background: isVivid ? 'radial-gradient(circle, rgba(57,198,255,0.16) 0%, transparent 72%)' : 'radial-gradient(circle, rgba(57,198,255,0.22) 0%, transparent 72%)',
          animation: 'float 10s ease-in-out infinite reverse',
          pointerEvents: 'none', zIndex: 0,
        }} />
        <div style={{
          position: 'fixed', top: '40%', left: '5%',
          width: '100px', height: '100px',
          borderRadius: '50%',
          background: isVivid ? 'radial-gradient(circle, rgba(155,123,255,0.14) 0%, transparent 72%)' : 'radial-gradient(circle, rgba(155,123,255,0.2) 0%, transparent 72%)',
          animation: 'float 7s ease-in-out infinite 2s',
          pointerEvents: 'none', zIndex: 0,
        }} />
        <motion.div
          initial={{ scale: 0.9, rotate: -8 }}
          animate={{ scale: [0.9, 1.06, 0.92], rotate: [-8, 8, -8] }}
          transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            position: 'fixed',
            top: '18%',
            left: '7%',
            width: '72px',
            height: '72px',
            borderRadius: '22px',
            background: `linear-gradient(135deg, ${TINTS.yellow}, ${TINTS.orange})`,
            opacity: isVivid ? 0.16 : 0.22,
            filter: 'blur(0.4px)',
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />
        <motion.div
          initial={{ scale: 1 }}
          animate={{ scale: [1, 1.2, 1], y: [0, -12, 0] }}
          transition={{ duration: 7.5, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            position: 'fixed',
            bottom: '18%',
            right: '9%',
            width: '64px',
            height: '64px',
            borderRadius: '999px',
            background: `linear-gradient(135deg, ${TINTS.green}, ${TINTS.blue})`,
            opacity: isVivid ? 0.14 : 0.2,
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />

        {/* 顶部导航 */}
        <header style={{
          position: 'sticky', top: 0, zIndex: 100,
          background: visualMode === 'premium' ? 'rgba(248,250,255,0.78)' : 'rgba(250,252,255,0.78)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: `1.5px solid ${TINTS.indigo}22`,
          boxShadow: SHADOW_TOKENS.glassHeader,
        }}>
          <div className="max-w-[1200px] mx-auto px-5 md:px-10 flex items-center justify-between h-14 md:h-16">
            {/* Logo */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}
            >
              <div style={{
                width: '32px', height: '32px', borderRadius: '10px',
                background: preset.logoGradient,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '16px',
                boxShadow: visualMode === 'vivid' ? '0 10px 20px rgba(255,92,168,0.3)' : '0 10px 20px rgba(92,99,255,0.28)',
              }}>
                ✨
              </div>
              <div>
                <h1 style={{
                  fontFamily: 'Outfit, Noto Sans SC, sans-serif',
                  fontSize: '14px', fontWeight: 800,
                  color: COLOR_TOKENS.text.primary, letterSpacing: '-0.02em',
                  lineHeight: 1.2,
                }}>
                  五行色彩搭配
                </h1>
                <p style={{
                  fontFamily: 'Space Grotesk, sans-serif',
                  fontSize: '8px', letterSpacing: '0.15em',
                  color: '#A0A8C0', textTransform: 'uppercase',
                  marginTop: '1px',
                }}>
                  WUXING · COLOR
                </p>
              </div>
            </motion.div>

            {/* 导航 */}
            <motion.nav
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-1"
            >
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px', borderRadius: '999px', background: isVivid ? 'rgba(247,250,255,0.78)' : 'rgba(255,255,255,0.7)', border: `1px solid ${TINTS.indigo}25`, marginRight: '6px' }}>
                {([
                  { id: 'vivid', label: '活力版' },
                  { id: 'premium', label: '高级版' },
                ] as const).map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setVisualMode(m.id)}
                    style={{
                      border: 'none',
                      cursor: 'pointer',
                      borderRadius: '999px',
                      padding: '4px 10px',
                      fontFamily: 'Outfit, sans-serif',
                      fontSize: '11px',
                      fontWeight: 700,
                      color: visualMode === m.id ? '#FFFFFF' : '#6D7392',
                      background: visualMode === m.id
                        ? (isVivid ? `linear-gradient(135deg, ${TINTS.coral}, ${TINTS.purple})` : `linear-gradient(135deg, ${TINTS.indigo}, ${TINTS.purple})`)
                        : 'transparent',
                      boxShadow: visualMode === m.id ? `0 8px 14px ${TINTS.indigo}2f` : 'none',
                      transition: MOTION_TOKENS.uiEase,
                    }}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
              {[
                { href: '#/', label: '首页', icon: '🏠', color: ACCENT },
                { href: '/#/ai-chat', label: 'AI 命理', icon: '🤖', color: TINTS.purple },
                { href: '/#/admin', label: '管理', icon: '⚙️', color: TINTS.indigo },
              ].map(({ href, label, icon, color }) => (
                <a key={href} href={href}
                  className="px-3 md:px-5 py-2 text-xs md:text-sm font-semibold rounded-xl flex items-center gap-1 md:gap-2 transition-all"
                  style={{
                    color: color,
                    textDecoration: 'none',
                    background: isVivid ? 'rgba(255,255,255,0.72)' : `${color}16`,
                    border: isVivid ? `1px solid ${color}26` : `1px solid ${color}2f`,
                    boxShadow: isVivid ? '0 8px 18px rgba(76,90,176,0.12)' : `0 6px 18px ${color}1f`,
                  }}
                  onMouseEnter={e => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.background = isVivid ? `${color}14` : `${color}2a`;
                    el.style.transform = 'translateY(-1px)';
                    el.style.boxShadow = isVivid ? '0 12px 24px rgba(76,90,176,0.16)' : `0 10px 22px ${color}2c`;
                    el.style.transition = MOTION_TOKENS.uiEase;
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.background = isVivid ? 'rgba(255,255,255,0.72)' : `${color}16`;
                    el.style.transform = 'translateY(0)';
                    el.style.boxShadow = isVivid ? '0 8px 18px rgba(76,90,176,0.12)' : `0 6px 18px ${color}1f`;
                  }}
                >
                  <span>{icon}</span> <span>{label}</span>
                </a>
              ))}
            </motion.nav>
          </div>
        </header>

        {/* 主内容 */}
        <main
          className="max-w-[1200px] mx-auto px-4 md:px-10 py-6 md:py-12 pb-20 md:pb-24 relative z-10"
          style={{
            background: visualMode === 'premium'
              ? 'linear-gradient(160deg, rgba(248,250,255,0.74), rgba(241,246,255,0.56))'
              : 'linear-gradient(160deg, rgba(255,255,255,0.68), rgba(255,255,255,0.5))',
            backgroundBlendMode: 'normal',
            border: `1.5px solid ${TINTS.indigo}22`,
            borderRadius: RADIUS_TOKENS.xxl,
            boxShadow: isVivid ? '0 26px 70px rgba(74,83,156,0.12)' : SHADOW_TOKENS.glassCard,
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            marginTop: '14px',
            marginBottom: '20px',
          }}
        >
          <Routes>
            <Route path="/" element={
              showIntro ? (
                <IntroPage onEnter={handleEnterHome} visualMode={visualMode} />
              ) : (
                <HomePage visualMode={visualMode} />
              )
            } />
            <Route path="/result/:userId" element={<ResultPage visualMode={visualMode} />} />
            <Route path="/admin" element={<AdminPage visualMode={visualMode} />} />
            <Route path="/ai-chat" element={<AiChatPage visualMode={visualMode} />} />
          </Routes>
        </main>

        {/* 底部 */}
        <footer style={{
          borderTop: '1px solid rgba(255,255,255,0.75)',
          padding: '24px 20px',
          maxWidth: '1200px', margin: '0 auto',
          position: 'relative', zIndex: 1,
          borderRadius: `${RADIUS_TOKENS.xl} ${RADIUS_TOKENS.xl} 0 0`,
          background: visualMode === 'premium'
            ? 'linear-gradient(135deg, rgba(244,247,255,0.62), rgba(250,252,255,0.78))'
            : 'linear-gradient(135deg, rgba(248,251,255,0.64), rgba(255,255,255,0.78))',
          backdropFilter: 'blur(10px)',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexWrap: 'wrap', gap: '16px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '28px', height: '28px', borderRadius: '8px',
                background: `linear-gradient(135deg, ${TINTS.coral}, ${TINTS.orange})`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '14px', boxShadow: SHADOW_TOKENS.glowSoft,
              }}>☯</div>
              <span style={{
                fontFamily: 'Outfit, sans-serif',
                fontSize: '13px', color: '#6D628A', fontWeight: 600,
              }}>
用色彩读懂你的五行命理
              </span>
            </div>
            <p style={{
              fontFamily: 'Outfit, sans-serif',
              fontSize: '11px', color: '#9FA3BE',
            }}>
              内容仅供娱乐参考 · 八字测算结果仅供参考
            </p>
          </div>
        </footer>
        <style>{`
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-14px); }
          }
        `}</style>
      </div>
    </HashRouter>
  );
}
