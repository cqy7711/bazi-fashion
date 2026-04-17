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

const ACCENT = '#FF6B9D';
const TINTS = {
  coral: '#FF6B9D',
  orange: '#FF9D6B',
  yellow: '#FFD666',
  green: '#22C55E',
  blue: '#6BD4FF',
  purple: '#9D6BFF',
};

// 会话时间追踪
let sessionStartTime = Date.now();

export default function App() {
  const [showIntro, setShowIntro] = useState(true);

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
      <div style={{ backgroundColor: '#FFFFFF', color: '#1A1A2E', minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
        {/* 浮动装饰球 */}
        <div style={{
          position: 'fixed', top: '10%', right: '-40px',
          width: '200px', height: '200px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,107,157,0.12) 0%, transparent 70%)',
          animation: 'float 8s ease-in-out infinite',
          pointerEvents: 'none', zIndex: 0,
        }} />
        <div style={{
          position: 'fixed', bottom: '10%', left: '-60px',
          width: '300px', height: '300px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(107,212,255,0.1) 0%, transparent 70%)',
          animation: 'float 10s ease-in-out infinite reverse',
          pointerEvents: 'none', zIndex: 0,
        }} />
        <div style={{
          position: 'fixed', top: '40%', left: '5%',
          width: '100px', height: '100px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(157,107,255,0.08) 0%, transparent 70%)',
          animation: 'float 7s ease-in-out infinite 2s',
          pointerEvents: 'none', zIndex: 0,
        }} />

        {/* 顶部导航 */}
        <header style={{
          position: 'sticky', top: 0, zIndex: 100,
          background: 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(232,234,246,0.8)',
          boxShadow: '0 1px 12px rgba(0,0,0,0.04)',
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
                background: 'linear-gradient(135deg, #FF6B9D, #FF9D6B)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '16px',
                boxShadow: '0 4px 12px rgba(255,107,157,0.3)',
              }}>
                ✨
              </div>
              <div>
                <h1 style={{
                  fontFamily: 'Outfit, Noto Sans SC, sans-serif',
                  fontSize: '14px', fontWeight: 800,
                  color: '#1A1A2E', letterSpacing: '-0.02em',
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
              {[
                { href: '/', label: '首页', icon: '🏠', color: ACCENT },
                { href: '/#/ai-chat', label: 'AI 命理', icon: '🤖', color: TINTS.purple },
                { href: '/#/admin', label: '管理', icon: '⚙️', color: TINTS.blue },
              ].map(({ href, label, icon, color }) => (
                <a key={href} href={href}
                  className="px-3 md:px-5 py-2 text-xs md:text-sm font-medium rounded-xl flex items-center gap-1 md:gap-2 transition-all"
                  style={{
                    color: color,
                    textDecoration: 'none',
                    background: `${color}10`,
                  }}
                  onMouseEnter={e => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.background = `${color}20`;
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.background = `${color}10`;
                  }}
                >
                  <span>{icon}</span> <span>{label}</span>
                </a>
              ))}
            </motion.nav>
          </div>
        </header>

        {/* 主内容 */}
        <main className="max-w-[1200px] mx-auto px-4 md:px-10 py-6 md:py-12 pb-20 md:pb-24 relative z-10">
          <Routes>
            <Route path="/" element={
              showIntro ? (
                <IntroPage onEnter={() => setShowIntro(false)} />
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
          borderTop: '1px solid #F0F1F8',
          padding: '24px 20px',
          maxWidth: '1200px', margin: '0 auto',
          position: 'relative', zIndex: 1,
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexWrap: 'wrap', gap: '16px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '28px', height: '28px', borderRadius: '8px',
                background: 'linear-gradient(135deg, #FF6B9D, #FF9D6B)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '14px', boxShadow: '0 2px 8px rgba(255,107,157,0.2)',
              }}>☯</div>
              <span style={{
                fontFamily: 'Outfit, sans-serif',
                fontSize: '13px', color: '#8A92A8', fontWeight: 500,
              }}>
用色彩读懂你的五行命理
              </span>
            </div>
            <p style={{
              fontFamily: 'Outfit, sans-serif',
              fontSize: '11px', color: '#C0C5D8',
            }}>
              内容仅供娱乐参考 · 八字测算结果仅供参考
            </p>
          </div>
        </footer>
      </div>
    </HashRouter>
  );
}
