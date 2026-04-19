import { motion } from 'framer-motion';
import { HashRouter, Routes, Route, Link } from 'react-router-dom';
import HomePage from './pages/HomePage';
import ResultPage from './pages/ResultPage';
import AdminPage from './pages/AdminPage';
import AiChatPage from './pages/AiChatPage';
import IntroPage from './pages/IntroPage';
import { startSession, endSession, trackEvent, EventTypes } from './utils/analytics';
import { useEffect, useState } from 'react';
import { COLOR_TOKENS, RADIUS_TOKENS, SHADOW_TOKENS, MOTION_TOKENS } from './theme/designTokens';

const VISUAL_PRESET = {
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
};

// 会话时间追踪
let sessionStartTime = Date.now();
const INTRO_SEEN_KEY = 'wuxing-intro-seen';

export default function App() {
  const preset = VISUAL_PRESET;
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
    <HashRouter unstable_useTransitions={false}>
      <div
        data-app-shell="wuxing-v2"
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
              'linear-gradient(rgba(255,255,255,0.24) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.24) 1px, transparent 1px)',
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
          background: 'radial-gradient(circle, rgba(57,198,255,0.16) 0%, transparent 72%)',
          animation: 'float 10s ease-in-out infinite reverse',
          pointerEvents: 'none', zIndex: 0,
        }} />
        <div style={{
          position: 'fixed', top: '40%', left: '5%',
          width: '100px', height: '100px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(155,123,255,0.14) 0%, transparent 72%)',
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
            opacity: 0.16,
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
            opacity: 0.14,
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />

        {/* 顶部导航 */}
        <header style={{
          position: 'sticky', top: 0, zIndex: 100,
          background: 'linear-gradient(180deg, rgba(252,250,253,0.92) 0%, rgba(248,245,250,0.88) 100%)',
          backdropFilter: 'blur(22px)',
          WebkitBackdropFilter: 'blur(22px)',
          borderBottom: '1px solid rgba(140, 132, 152, 0.12)',
          boxShadow: '0 4px 24px rgba(72, 64, 88, 0.06)',
          paddingLeft: 'max(20px, env(safe-area-inset-left))',
          paddingRight: 'max(20px, env(safe-area-inset-right))',
          paddingTop: 'env(safe-area-inset-top)',
        }}>
          <div className="max-w-[1200px] mx-auto px-3 sm:px-5 md:px-10 flex flex-wrap items-center justify-between gap-y-2.5 gap-x-2 min-h-14 md:min-h-16 py-2.5 md:py-0">
            {/* Logo — 设计稿：英文副标 + 中文主标（移动端亦显示） */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="min-w-0 flex-1 sm:flex-initial"
              style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}
            >
              <div style={{
                width: '34px', height: '34px', borderRadius: '11px',
                background: preset.logoGradient,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '17px',
                boxShadow: '0 8px 18px rgba(200, 120, 140, 0.22)',
              }}>
                ✨
              </div>
              <div className="min-w-0">
                <p style={{
                  fontFamily: 'Space Grotesk, sans-serif',
                  fontSize: '9px', letterSpacing: '0.18em',
                  color: '#9B96A8', textTransform: 'uppercase',
                  marginBottom: '2px',
                  lineHeight: 1,
                }}>
                  WUXING · COLOR
                </p>
                <h1 style={{
                  fontFamily: 'Outfit, Noto Sans SC, sans-serif',
                  fontSize: '15px', fontWeight: 800,
                  color: '#3D3A45', letterSpacing: '-0.02em',
                  lineHeight: 1.15,
                  margin: 0,
                }}>
                  五行·色彩·运势
                </h1>
              </div>
            </motion.div>

            {/* 导航 — Morandi 胶囊按钮 */}
            <motion.nav
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex flex-wrap items-center justify-end gap-1.5 w-full sm:w-auto shrink-0"
            >
              {[
                { to: '/', label: '首页', icon: '🏠', color: ACCENT },
                { to: '/ai-chat', label: 'AI 解读', icon: '🤖', color: TINTS.purple },
                { to: '/admin', label: '管理', icon: '⚙️', color: TINTS.indigo },
              ].map(({ to, label, icon, color }) => (
                <Link key={to} to={to}
                  className="px-2.5 sm:px-3 md:px-5 py-1.5 sm:py-2 text-[11px] sm:text-xs md:text-sm font-semibold rounded-full sm:rounded-xl flex items-center gap-0.5 sm:gap-1 md:gap-2 transition-all whitespace-nowrap"
                  style={{
                    color: color,
                    textDecoration: 'none',
                    background: 'linear-gradient(180deg, rgba(255,255,255,0.94), rgba(248,246,250,0.88))',
                    border: `1px solid rgba(130, 122, 142, 0.14)`,
                    boxShadow: '0 6px 14px rgba(72, 64, 82, 0.06)',
                  }}
                  onMouseEnter={e => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.background = `${color}14`;
                    el.style.transform = 'translateY(-1px)';
                    el.style.boxShadow = '0 12px 24px rgba(76,90,176,0.16)';
                    el.style.transition = MOTION_TOKENS.uiEase;
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.background = 'rgba(255,255,255,0.72)';
                    el.style.transform = 'translateY(0)';
                    el.style.boxShadow = '0 8px 18px rgba(76,90,176,0.12)';
                  }}
                >
                  <span>{icon}</span> <span>{label}</span>
                </Link>
              ))}
            </motion.nav>
          </div>
        </header>

        {/* 主内容 */}
        <main
          className="max-w-[1200px] w-[calc(100%-0.75rem)] sm:w-[calc(100%-1rem)] md:w-auto mx-auto px-3 sm:px-4 md:px-10 py-4 sm:py-6 md:py-12 pb-[max(5rem,env(safe-area-inset-bottom))] md:pb-24 relative z-10"
          style={{
            background: 'linear-gradient(165deg, rgba(255,255,255,0.82) 0%, rgba(252,249,251,0.72) 45%, rgba(248,246,252,0.78) 100%)',
            backgroundBlendMode: 'normal',
            border: '1px solid rgba(160, 152, 172, 0.14)',
            borderRadius: RADIUS_TOKENS.xxl,
            boxShadow: '0 20px 56px rgba(72, 64, 88, 0.08), 0 1px 0 rgba(255,255,255,0.75) inset',
            backdropFilter: 'blur(14px)',
            WebkitBackdropFilter: 'blur(14px)',
            marginTop: '12px',
            marginBottom: '20px',
          }}
        >
          <Routes>
            <Route path="/" element={
              showIntro ? (
                <IntroPage onEnter={handleEnterHome} />
              ) : (
                <HomePage />
              )
            } />
            <Route path="/result/:userId" element={<ResultPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/ai-chat" element={<AiChatPage />} />
          </Routes>
        </main>

        {/* 底部 */}
        <footer style={{
          borderTop: '1px solid rgba(255,255,255,0.75)',
          padding: '20px max(16px, env(safe-area-inset-left)) calc(24px + env(safe-area-inset-bottom)) max(16px, env(safe-area-inset-right))',
          maxWidth: '1200px', margin: '0 auto',
          position: 'relative', zIndex: 1,
          borderRadius: `${RADIUS_TOKENS.xl} ${RADIUS_TOKENS.xl} 0 0`,
          background: 'linear-gradient(135deg, rgba(248,251,255,0.64), rgba(255,255,255,0.78))',
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
