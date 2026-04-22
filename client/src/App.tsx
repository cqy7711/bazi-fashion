import { motion } from 'framer-motion';
import { HashRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import HomePage from './pages/HomePage';
import ResultPage from './pages/ResultPage';
import AdminPage from './pages/AdminPage';
import AiChatPage from './pages/AiChatPage';
import IntroPage from './pages/IntroPage';
import FeedbackPage from './pages/FeedbackPage';
import DayunTrendPage from './pages/DayunTrendPage';
import { startSession, endSession, trackEvent, EventTypes } from './utils/analytics';
import { useEffect, useState } from 'react';
import { COLOR_TOKENS, RADIUS_TOKENS, SHADOW_TOKENS, MOTION_TOKENS, IOS_TOKENS } from './theme/designTokens';
import { Home, Sparkles, Settings, MessageSquare, PanelBottomClose, PanelBottomOpen, LineChart } from 'lucide-react';

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
  const isIOSDevice = typeof navigator !== 'undefined' && /iP(hone|od|ad)/i.test(navigator.userAgent);
  const [tabBarCollapsed, setTabBarCollapsed] = useState(false);

  const [showIntro, setShowIntro] = useState(() => {
    try {
      return sessionStorage.getItem(INTRO_SEEN_KEY) !== '1';
    } catch {
      return true;
    }
  });
  const CURRENT_RECORD_KEY = 'wuxing-current-record-id';
  const [currentRecordId, setCurrentRecordId] = useState<string | null>(() => {
    try {
      return sessionStorage.getItem(CURRENT_RECORD_KEY);
    } catch {
      return null;
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

  useEffect(() => {
    const sync = () => {
      try {
        setCurrentRecordId(sessionStorage.getItem(CURRENT_RECORD_KEY));
      } catch {
        // ignore
      }
    };
    window.addEventListener('wuxing-current-record-changed', sync as EventListener);
    window.addEventListener('hashchange', sync);
    return () => {
      window.removeEventListener('wuxing-current-record-changed', sync as EventListener);
      window.removeEventListener('hashchange', sync);
    };
  }, []);

  // 高级导航组件
  const NavLinks = () => {
    const location = useLocation();
    const navItems = [
      { to: '/', label: '首页', Icon: Home, gradient: ['#FF6B9D', '#C084FC'], glowColor: 'rgba(255,107,157,0.35)' },
      { to: '/ai-chat', label: 'AI 解读', Icon: Sparkles, gradient: ['#818CF8', '#C084FC'], glowColor: 'rgba(129,140,248,0.35)' },
      { to: currentRecordId ? `/dayun/${encodeURIComponent(currentRecordId)}` : '/dayun', label: '大运走势', Icon: LineChart, gradient: ['#F59E0B', '#FBBF24'], glowColor: 'rgba(245,158,11,0.35)' },
      // 新增“反馈”入口，方便用户在导航栏中快速提交建议。
      { to: '/feedback', label: '反馈', Icon: MessageSquare, gradient: ['#34D399', '#60A5FA'], glowColor: 'rgba(52,211,153,0.35)' },
      { to: '/admin', label: '管理', Icon: Settings, gradient: ['#6366F1', '#818CF8'], glowColor: 'rgba(99,102,241,0.35)' },
    ];
    const activeItem = navItems.find(({ to }) => (
      to === '/dayun'
        ? location.pathname.startsWith('/dayun')
        : location.pathname === to || (to === '/' && location.pathname === '')
    )) ?? navItems[0];

    return (
      <motion.nav
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
        style={{
          display: 'flex',
          justifyContent: tabBarCollapsed ? 'space-between' : 'space-between',
          alignItems: 'center',
          gap: tabBarCollapsed ? '8px' : '6px',
          width: tabBarCollapsed ? '168px' : '100%',
          padding: tabBarCollapsed
            ? (isIOSDevice ? '5px 9px calc(5px + env(safe-area-inset-bottom))' : '8px 10px calc(8px + env(safe-area-inset-bottom))')
            : (isIOSDevice ? '5px 9px calc(5px + env(safe-area-inset-bottom))' : '8px 10px calc(8px + env(safe-area-inset-bottom))'),
          borderRadius: tabBarCollapsed ? '24px' : IOS_TOKENS.radius.sheet,
          background: tabBarCollapsed
            ? 'linear-gradient(145deg, rgba(255,255,255,0.93), rgba(247,244,253,0.9))'
            : 'linear-gradient(145deg, rgba(255,255,255,0.88), rgba(246,244,252,0.82))',
          border: '1px solid rgba(158,150,182,0.2)',
          boxShadow: tabBarCollapsed
            ? '0 10px 24px rgba(80,68,111,0.2), inset 0 1px 0 rgba(255,255,255,0.88)'
            : '0 12px 30px rgba(84,70,124,0.16), inset 0 1px 0 rgba(255,255,255,0.8)',
          backdropFilter: 'blur(20px) saturate(1.08)',
          WebkitBackdropFilter: 'blur(20px) saturate(1.08)',
          transition: 'all 0.24s ease',
        }}
      >
        {tabBarCollapsed ? (
          <>
            <Link
              to={activeItem.to}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                minHeight: isIOSDevice ? '33px' : '38px',
                padding: isIOSDevice ? '4px 9px' : '6px 10px',
                borderRadius: '14px',
                textDecoration: 'none',
                background: `linear-gradient(145deg, ${activeItem.gradient[0]}20, ${activeItem.gradient[1]}1A)`,
                border: `1px solid ${activeItem.gradient[0]}38`,
                boxShadow: `0 6px 14px ${activeItem.glowColor.replace('0.35', '0.2')}`,
              }}
            >
              <div style={{
                width: isIOSDevice ? '18px' : '20px',
                height: isIOSDevice ? '18px' : '20px',
                borderRadius: '7px',
                background: `linear-gradient(145deg, ${activeItem.gradient[0]}, ${activeItem.gradient[1]})`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <activeItem.Icon size={isIOSDevice ? 11 : 12} strokeWidth={2.2} color="#fff" />
              </div>
              <span style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif',
                fontSize: '0.64rem',
                fontWeight: 700,
                color: '#3F3656',
                whiteSpace: 'nowrap',
              }}>
                {activeItem.label}
              </span>
            </Link>
            <button
              type="button"
              onClick={() => setTabBarCollapsed(false)}
              aria-label="展开导航栏"
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '999px',
                border: '1px solid rgba(139,128,171,0.24)',
                background: 'linear-gradient(145deg, rgba(255,255,255,0.96), rgba(245,242,251,0.92))',
                color: '#6F678A',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 10px rgba(76,66,106,0.15)',
                cursor: 'pointer',
              }}
            >
              <PanelBottomOpen size={isIOSDevice ? 13 : 14} />
            </button>
          </>
        ) : (
          <>
            {navItems.map(({ to, label, Icon, gradient, glowColor }) => {
              const isActive = to === '/dayun'
                ? location.pathname.startsWith('/dayun')
                : location.pathname === to || (to === '/' && location.pathname === '');
              return (
                <Link key={to} to={to}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '3px',
                    minHeight: isIOSDevice ? '38px' : '44px',
                    minWidth: isIOSDevice ? '56px' : '62px',
                    padding: isIOSDevice ? '4px 8px' : '6px 8px',
                    borderRadius: IOS_TOKENS.radius.control,
                    textDecoration: 'none',
                    background: isActive
                      ? `linear-gradient(145deg, ${gradient[0]}20, ${gradient[1]}1A)`
                      : 'transparent',
                    border: isActive ? `1px solid ${gradient[0]}40` : '1px solid transparent',
                    boxShadow: isActive
                      ? `0 6px 14px ${glowColor.replace('0.35', '0.2')}`
                      : 'none',
                    transition: 'all 0.22s cubic-bezier(0.25,0.46,0.45,0.94)',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={e => {
                    const el = e.currentTarget as HTMLElement;
                    if (!isActive) {
                      el.style.background = `linear-gradient(145deg, ${gradient[0]}14, ${gradient[1]}12)`;
                      el.style.borderColor = `${gradient[0]}22`;
                      el.style.transform = 'translateY(-1px)';
                      el.style.boxShadow = `0 6px 16px ${glowColor.replace('0.35', '0.15')}`;
                    }
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget as HTMLElement;
                    if (!isActive) {
                      el.style.background = 'transparent';
                      el.style.borderColor = 'transparent';
                      el.style.transform = 'translateY(0)';
                      el.style.boxShadow = 'none';
                    }
                  }}
                >
                  <div style={{
                    width: isIOSDevice ? '22px' : '24px',
                    height: isIOSDevice ? '22px' : '24px',
                    borderRadius: '8px',
                    background: isActive
                      ? `linear-gradient(145deg, ${gradient[0]}, ${gradient[1]})`
                      : `linear-gradient(145deg, ${gradient[0]}C7, ${gradient[1]}C7)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: isActive ? `0 4px 12px ${glowColor.replace('0.35', '0.24')}` : `0 3px 8px ${glowColor.replace('0.35', '0.18')}`,
                  }}>
                    <Icon size={isIOSDevice ? 13 : 14} strokeWidth={2.2} color="#fff" />
                  </div>
                  <span style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif',
                    fontSize: isIOSDevice ? '0.61rem' : '0.64rem', fontWeight: isActive ? 700 : 600,
                    color: isActive ? '#3F3656' : '#4D4860',
                    letterSpacing: '-0.01em',
                    whiteSpace: 'nowrap',
                  }}>
                    {label}
                  </span>
                </Link>
              );
            })}
            <button
              type="button"
              onClick={() => setTabBarCollapsed(true)}
              aria-label="收起导航栏"
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '999px',
                border: '1px solid rgba(139,128,171,0.22)',
                background: 'linear-gradient(145deg, rgba(255,255,255,0.9), rgba(244,241,251,0.86))',
                color: '#6F678A',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 10px rgba(76,66,106,0.12)',
                cursor: 'pointer',
              }}
            >
              <PanelBottomClose size={isIOSDevice ? 13 : 14} />
            </button>
          </>
        )}
      </motion.nav>
    );
  };

  return (
    <HashRouter unstable_useTransitions={false}>
      <div
        data-app-shell="wuxing-v2"
        style={{
          background: preset.pageBg,
          color: COLOR_TOKENS.text.primary,
          fontSize: isIOSDevice ? '18px' : undefined,
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

        {/* iOS-style top bar */}
        <header style={{
          position: 'sticky', top: 0, zIndex: 100,
          background: 'linear-gradient(180deg, rgba(252,250,253,0.94) 0%, rgba(248,245,250,0.9) 100%)',
          backdropFilter: 'blur(18px)',
          WebkitBackdropFilter: 'blur(18px)',
          borderBottom: '1px solid rgba(140, 132, 152, 0.14)',
          boxShadow: '0 6px 20px rgba(72, 64, 88, 0.08)',
          paddingLeft: 'max(14px, env(safe-area-inset-left))',
          paddingRight: 'max(14px, env(safe-area-inset-right))',
          paddingTop: 'env(safe-area-inset-top)',
        }}>
          <div className="max-w-[1200px] mx-auto px-1 sm:px-3 md:px-6 flex items-center justify-between min-h-12 md:min-h-14 py-2">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '26px', height: '26px', borderRadius: '8px',
                background: `linear-gradient(135deg, ${TINTS.coral}, ${TINTS.purple})`,
                color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.8rem', fontWeight: 700,
              }}>☯</div>
              <span
                style={{
                  fontSize: IOS_TOKENS.typography.title,
                  fontWeight: 650,
                  letterSpacing: '0.015em',
                  color: '#2F2B40',
                  display: 'inline-flex',
                  alignItems: 'baseline',
                  gap: '0.18em',
                  whiteSpace: 'nowrap',
                }}
              >
                <span style={{ color: '#2F2B40' }}>WUXING</span>
                <span style={{ color: '#A79FC2', fontWeight: 500 }}>·</span>
                <span style={{ color: '#6A7DE3' }}>COLOR</span>
                <span style={{ color: '#A79FC2', fontWeight: 500 }}>·</span>
                <span style={{ color: '#AA65D8' }}>FORTUNE</span>
              </span>
            </div>
            <span style={{ fontSize: IOS_TOKENS.typography.caption, color: '#8E88A6' }}>iOS Edition</span>
          </div>
        </header>

        {/* 主内容 */}
        <main
          className="max-w-[1200px] w-[calc(100%-0.75rem)] sm:w-[calc(100%-1rem)] md:w-auto mx-auto px-3 sm:px-4 md:px-10 py-4 sm:py-6 md:py-10 md:pb-24 relative z-10"
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
            paddingBottom: tabBarCollapsed
              ? (isIOSDevice ? 'max(4.2rem, env(safe-area-inset-bottom))' : 'max(5rem, env(safe-area-inset-bottom))')
              : (isIOSDevice ? 'max(5.3rem, env(safe-area-inset-bottom))' : 'max(6.5rem, env(safe-area-inset-bottom))'),
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
            <Route path="/dayun" element={<DayunTrendPage />} />
            <Route path="/dayun/:userId" element={<DayunTrendPage />} />
            <Route path="/feedback" element={<FeedbackPage />} />
          </Routes>
        </main>

        {/* iOS bottom tab bar */}
        <div style={{
          position: 'fixed',
          left: 'max(10px, env(safe-area-inset-left))',
          right: 'max(10px, env(safe-area-inset-right))',
          bottom: 0,
          zIndex: 120,
          paddingBottom: tabBarCollapsed
            ? (isIOSDevice ? 'max(4px, env(safe-area-inset-bottom))' : 'max(6px, env(safe-area-inset-bottom))')
            : (isIOSDevice ? 'max(6px, env(safe-area-inset-bottom))' : 'max(8px, env(safe-area-inset-bottom))'),
          transition: 'all 0.24s ease',
        }}>
          <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', justifyContent: 'center' }}>
            <NavLinks />
          </div>
        </div>

        {/* 底部 */}
        <footer style={{
          borderTop: '1px solid rgba(255,255,255,0.75)',
          padding: '20px max(16px, env(safe-area-inset-left)) calc(106px + env(safe-area-inset-bottom)) max(16px, env(safe-area-inset-right))',
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
                fontSize: '0.88rem', boxShadow: SHADOW_TOKENS.glowSoft,
              }}>☯</div>
              <span style={{
                fontFamily: 'Outfit, sans-serif',
                fontSize: '0.81rem', color: '#6D628A', fontWeight: 600,
              }}>
用色彩读懂你的五行命理
              </span>
            </div>
            <p style={{
              fontFamily: 'Outfit, sans-serif',
              fontSize: '0.69rem', color: '#9FA3BE',
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
