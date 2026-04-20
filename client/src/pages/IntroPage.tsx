import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, Palette, Gem, Shirt, Star, ArrowRight, Compass, Sparkle,
  TrendingUp, MessageCircle, Layers, Eye, Shield, Clock, Zap,
  Heart, BarChart3, BookOpen, Sun, Moon, Lock
} from 'lucide-react';
import { COLOR_TOKENS, SHADOW_TOKENS, RADIUS_TOKENS, MOTION_TOKENS } from '../theme/designTokens';

// 渐变色配置
const GRADIENT = {
  primary: `linear-gradient(135deg, ${COLOR_TOKENS.brand.coral} 0%, ${COLOR_TOKENS.brand.orange} 50%, ${COLOR_TOKENS.brand.yellow} 100%)`,
  purple: `linear-gradient(135deg, ${COLOR_TOKENS.brand.purple} 0%, ${COLOR_TOKENS.brand.blue} 100%)`,
  ocean: `linear-gradient(135deg, ${COLOR_TOKENS.brand.blue} 0%, ${COLOR_TOKENS.brand.green} 100%)`,
  dark: 'linear-gradient(145deg, #0D0D1A 0%, #1A1535 40%, #0F1A2E 100%)',
  gold: `linear-gradient(135deg, #FFB347 0%, #FFCC33 50%, #FFE066 100%)`,
};

const TOTAL_SLIDES = 4;

// 第一页：五行元素配置
const FIVE_ELEMENTS = [
  { name: '木', color: '#4ADE80', glow: 'rgba(74,222,128,0.35)', desc: '生机', symbol: '🌿' },
  { name: '火', color: '#FF6B6B', glow: 'rgba(255,107,107,0.35)', desc: '热情', symbol: '🔥' },
  { name: '土', color: '#FFD93D', glow: 'rgba(255,217,61,0.35)', desc: '厚德', symbol: '⛰️' },
  { name: '金', color: '#A8B8D0', glow: 'rgba(168,184,208,0.35)', desc: '刚毅', symbol: '⚔️' },
  { name: '水', color: '#60C0FF', glow: 'rgba(96,192,255,0.35)', desc: '灵动', symbol: '💧' },
];

// 第二页：核心功能卡片
const CORE_FEATURES = [
  {
    icon: <Star size={24} />,
    title: '八字命盘',
    desc: '四柱八字 · 格局判断 · 十二长生 · 神煞分析',
    color: '#FF7A5C',
    bg: 'rgba(255,122,92,0.12)',
    badge: '深度分析',
  },
  {
    icon: <TrendingUp size={24} />,
    title: '大运 K 线',
    desc: '人生大运走势图 · 100 岁运势全覆盖 · 流年吉凶',
    color: '#FFB347',
    bg: 'rgba(255,179,71,0.12)',
    badge: '可视化',
  },
  {
    icon: <Palette size={24} />,
    title: '今日穿搭',
    desc: '流日配色 + 实时天气 · 职场/日常/聚会/节日',
    color: '#FF9D6B',
    bg: 'rgba(255,157,107,0.12)',
    badge: '每日更新',
  },
  {
    icon: <Gem size={24} />,
    title: '开运手串',
    desc: '身强/身弱策略 · 场景适配 · 流日能量推荐',
    color: '#9D6BFF',
    bg: 'rgba(157,107,255,0.12)',
    badge: '精选推荐',
  },
  {
    icon: <MessageCircle size={24} />,
    title: 'AI 命理解读',
    desc: 'DeepSeek 驱动 · 流式对话 · 事业/感情/财运',
    color: '#6BD4FF',
    bg: 'rgba(107,212,255,0.12)',
    badge: '随时追问',
  },
];

// 第三页：亮点特性
const HIGHLIGHTS = [
  {
    icon: <Sun size={20} />,
    title: '实时天气联动',
    desc: '自动获取所在城市天气，晴天/雨天/阴天穿搭配色各不同',
    color: '#FFD93D',
    bg: 'rgba(255,217,61,0.1)',
  },
  {
    icon: <Layers size={20} />,
    title: '六种语言风格',
    desc: '正常 / 股市风 / 游戏风 / 童话风 / 运势风 / 职场风 随心切换',
    color: '#8F68FF',
    bg: 'rgba(143,104,255,0.1)',
  },
  {
    icon: <Compass size={20} />,
    title: '真太阳时校正',
    desc: '根据出生城市经度自动校正时辰，排盘更精准',
    color: '#2CCBFF',
    bg: 'rgba(44,203,255,0.1)',
  },
  {
    icon: <Shield size={20} />,
    title: '隐私安全',
    desc: '免费使用、无需注册、数据不外传、纯本地存储',
    color: '#1FE6A8',
    bg: 'rgba(31,230,168,0.1)',
  },
];

// 第四页：使用步骤
const STEPS = [
  { num: '01', title: '填写生辰', desc: '年月日时 + 性别 + 城市，30 秒搞定', color: '#FF7A5C', icon: <BookOpen size={18} /> },
  { num: '02', title: '查看命盘', desc: '八字命盘、大运 K 线、四维运势分析', color: '#FFB347', icon: <Eye size={18} /> },
  { num: '03', title: '获取方案', desc: '今日配色穿搭 + 开运手串 + AI 命理追问', color: '#9D6BFF', icon: <Zap size={18} /> },
];

export default function IntroPage({ onEnter }: { onEnter: () => void }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowContent(true), 200);
    return () => clearTimeout(timer);
  }, []);

  // 触摸滑动支持
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }, []);
  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStart.current) return;
    const dx = e.changedTouches[0].clientX - touchStart.current.x;
    const dy = e.changedTouches[0].clientY - touchStart.current.y;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50) {
      if (dx < 0 && currentSlide < TOTAL_SLIDES - 1) setCurrentSlide(p => p + 1);
      if (dx > 0 && currentSlide > 0) setCurrentSlide(p => p - 1);
    }
    touchStart.current = null;
  }, [currentSlide]);

  const goNext = () => {
    if (currentSlide < TOTAL_SLIDES - 1) {
      setCurrentSlide(prev => prev + 1);
    } else {
      onEnter();
    }
  };

  const goBack = () => {
    if (currentSlide > 0) setCurrentSlide(prev => prev - 1);
  };

  const introGradient =
    'radial-gradient(ellipse at 20% 0%, rgba(255,122,92,0.18) 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, rgba(157,107,255,0.15) 0%, transparent 45%), radial-gradient(ellipse at 50% 80%, rgba(107,212,255,0.12) 0%, transparent 50%)';

  const btnLabel = currentSlide === TOTAL_SLIDES - 1 ? '开始体验' : '下一步';
  const showBack = currentSlide > 0;

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      style={{
        minHeight: '100vh',
        background: GRADIENT.dark,
        color: '#FFFFFF',
        overflow: 'hidden',
        position: 'relative',
        userSelect: 'none',
      }}
    >
      {/* 背景装饰 */}
      <div style={{
        position: 'fixed', inset: 0,
        background: introGradient,
        pointerEvents: 'none',
      }} />
      {/* 粒子装饰 */}
      <div style={{
        position: 'fixed', top: '12%', right: '-20px',
        width: '180px', height: '180px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(255,122,92,0.14) 0%, transparent 70%)',
        animation: 'introFloat 8s ease-in-out infinite',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'fixed', bottom: '15%', left: '-40px',
        width: '220px', height: '220px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(157,107,255,0.12) 0%, transparent 70%)',
        animation: 'introFloat 10s ease-in-out infinite reverse',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'fixed', top: '45%', left: '60%',
        width: '100px', height: '100px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(44,203,255,0.1) 0%, transparent 70%)',
        animation: 'introFloat 7s ease-in-out infinite 2s',
        pointerEvents: 'none',
      }} />

      {/* 顶部品牌栏 */}
      <AnimatePresence>
        {showContent && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            style={{
              padding: '44px 24px 0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
            }}
          >
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 12 }}
              style={{
                width: '36px', height: '36px',
                background: GRADIENT.primary,
                borderRadius: '11px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 8px 20px rgba(255,122,92,0.3)',
              }}
            >
              <Sparkles size={20} color="#FFFFFF" />
            </motion.div>
            <div>
              <p style={{
                fontFamily: 'Space Grotesk, sans-serif',
                fontSize: '8px', letterSpacing: '0.18em',
                color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase',
                lineHeight: 1, marginBottom: '1px',
              }}>WUXING · COLOR</p>
              <p style={{
                fontFamily: 'Outfit, Noto Sans SC, sans-serif',
                fontSize: '0.94remrem', fontWeight: 800,
                color: '#FFFFFF', letterSpacing: '-0.02em', lineHeight: 1.1,
              }}>五行·色彩·运势</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 页面指示器 - 顶部 */}
      <AnimatePresence>
        {showContent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            style={{
              display: 'flex', justifyContent: 'center', gap: '6px',
              padding: '16px 0 0',
            }}
          >
            {Array.from({ length: TOTAL_SLIDES }).map((_, i) => (
              <div
                key={i}
                onClick={() => setCurrentSlide(i)}
                style={{
                  width: currentSlide === i ? '28px' : '6px',
                  height: '6px',
                  borderRadius: '3px',
                  background: currentSlide === i
                    ? GRADIENT.primary
                    : 'rgba(255,255,255,0.15)',
                  transition: 'all 0.4s cubic-bezier(0.22, 1, 0.36, 1)',
                  cursor: 'pointer',
                }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 跳过按钮 */}
      <AnimatePresence>
        {showContent && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            onClick={onEnter}
            style={{
              position: 'fixed', top: '20px', right: '20px',
              padding: '6px 14px',
              background: 'linear-gradient(145deg, rgba(255,255,255,0.12), rgba(255,255,255,0.04))',
              border: '1px solid rgba(255,255,255,0.18)',
              borderRadius: '20px',
              color: 'rgba(255,255,255,0.5)',
              fontSize: '0.75remrem', cursor: 'pointer',
              fontFamily: 'Outfit, sans-serif',
              backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
              zIndex: 10,
            }}
          >跳过</motion.button>
        )}
      </AnimatePresence>

      {/* 内容区域 */}
      <div style={{ maxWidth: '420px', margin: '0 auto', padding: '0 20px' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            style={{ minHeight: currentSlide === 1 ? 'auto' : '420px' }}
          >
            {/* ========== Slide 0: 品牌理念 + 五行 ========== */}
            {currentSlide === 0 && (
              <div style={{ paddingTop: '16px' }}>
                {/* 标题 */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  style={{ textAlign: 'center', marginBottom: '28px' }}
                >
                  <h2 style={{
                    fontSize: '1.75remrem', fontWeight: 800, marginBottom: '10px',
                    fontFamily: 'Outfit, Noto Sans SC, sans-serif',
                    background: GRADIENT.primary,
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                    lineHeight: 1.2,
                  }}>用色彩读懂你的命理</h2>
                  <p style={{
                    fontSize: '0.81remrem', color: 'rgba(255,255,255,0.45)',
                    fontFamily: 'Outfit, sans-serif', lineHeight: 1.5,
                  }}>
                    基于八字五行，每日生成<span style={{ color: '#FF9D6B' }}>可执行的穿搭方案</span>
                  </p>
                </motion.div>

                {/* 五行环形卡片 */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.25 }}
                  style={{
                    display: 'flex', justifyContent: 'center', gap: '10px',
                    marginBottom: '24px', flexWrap: 'wrap',
                  }}
                >
                  {FIVE_ELEMENTS.map((el, i) => (
                    <motion.div
                      key={el.name}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + i * 0.08 }}
                      whileHover={{ scale: 1.06, y: -2 }}
                      style={{
                        width: '58px', height: '74px',
                        background: `linear-gradient(160deg, ${el.color}18, ${el.color}08)`,
                        borderRadius: '16px',
                        display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center',
                        border: `1px solid ${el.color}35`,
                        boxShadow: `0 8px 20px ${el.glow}`,
                        cursor: 'default',
                      }}
                    >
                      <span style={{ fontSize: '0.75remrem', marginBottom: '3px' }}>{el.symbol}</span>
                      <span style={{ fontSize: '1.38remrem', fontWeight: 900, color: el.color, lineHeight: 1, fontFamily: 'Outfit, sans-serif' }}>
                        {el.name}
                      </span>
                      <span style={{ fontSize: '0.56remrem', color: 'rgba(255,255,255,0.5)', marginTop: '3px', fontFamily: 'Outfit' }}>
                        {el.desc}
                      </span>
                    </motion.div>
                  ))}
                </motion.div>

                {/* 理念卡片 */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.65 }}
                  style={{
                    background: 'linear-gradient(160deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02))',
                    borderRadius: '20px', padding: '20px 22px',
                    border: '1px solid rgba(255,255,255,0.12)',
                    backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                    <Heart size={16} color="#FF7A5C" />
                    <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '0.88remrem', fontWeight: 700, color: '#FFE0CC' }}>
                      不只是算命，是生活指南
                    </span>
                  </div>
                  <p style={{
                    fontSize: '0.81remrem', lineHeight: 1.8, color: 'rgba(255,255,255,0.6)',
                    fontFamily: 'Outfit, Noto Sans SC, sans-serif', margin: 0,
                  }}>
                    每天结合你的<span style={{ color: '#FF7A5C' }}>八字命理</span>、<span style={{ color: '#FFD93D' }}>流日五行</span>和<span style={{ color: '#6BD4FF' }}>实时天气</span>，生成精准穿搭配色方案和开运手串推荐。人生大运K线图一目了然，AI命理师随时为你解读。
                  </p>
                </motion.div>
              </div>
            )}

            {/* ========== Slide 1: 六大核心功能 ========== */}
            {currentSlide === 1 && (
              <div style={{ paddingTop: '8px' }}>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  style={{
                    fontSize: '0.75remrem', color: 'rgba(255,255,255,0.4)',
                    textAlign: 'center', marginBottom: '16px',
                    fontFamily: 'Outfit, sans-serif',
                  }}
                >
                  六大核心功能 · 让命理融入每一天
                </motion.p>

                <div style={{ display: 'grid', gap: '10px' }}>
                  {CORE_FEATURES.map((f, i) => (
                    <motion.div
                      key={f.title}
                      initial={{ opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.15 + i * 0.08 }}
                      style={{
                        background: `linear-gradient(155deg, ${f.bg}, rgba(255,255,255,0.02))`,
                        borderRadius: '16px', padding: '14px 16px',
                        border: `1px solid ${f.color}25`,
                        display: 'flex', alignItems: 'center', gap: '12px',
                        backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
                        boxShadow: `0 8px 16px ${f.color}15`,
                      }}
                    >
                      <div style={{
                        width: '44px', height: '44px',
                        background: `${f.color}20`,
                        borderRadius: '12px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: f.color, flexShrink: 0,
                      }}>
                        {f.icon}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                          <h4 style={{
                            fontSize: '0.88remrem', fontWeight: 700, margin: 0,
                            fontFamily: 'Outfit, Noto Sans SC, sans-serif', color: '#FFFFFF',
                          }}>{f.title}</h4>
                          <span style={{
                            fontSize: '0.56remrem', fontWeight: 600, padding: '1px 6px',
                            borderRadius: '6px',
                            background: `${f.color}22`,
                            color: f.color,
                            fontFamily: 'Outfit, sans-serif',
                            whiteSpace: 'nowrap',
                          }}>{f.badge}</span>
                        </div>
                        <p style={{
                          fontSize: '0.69remrem', color: 'rgba(255,255,255,0.5)',
                          lineHeight: 1.4, fontFamily: 'Outfit, Noto Sans SC, sans-serif', margin: 0,
                        }}>
                          {f.desc}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* ========== Slide 2: 亮点特性 ========== */}
            {currentSlide === 2 && (
              <div style={{ paddingTop: '12px' }}>
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  style={{ textAlign: 'center', marginBottom: '24px' }}
                >
                  <h3 style={{
                    fontSize: '1.25remrem', fontWeight: 800, marginBottom: '6px',
                    fontFamily: 'Outfit, Noto Sans SC, sans-serif',
                    color: '#FFFFFF',
                  }}>每一处细节都经过打磨</h3>
                  <p style={{
                    fontSize: '0.75remrem', color: 'rgba(255,255,255,0.4)',
                    fontFamily: 'Outfit, sans-serif',
                  }}>专业命理算法 + 现代设计体验</p>
                </motion.div>

                <div style={{ display: 'grid', gap: '12px' }}>
                  {HIGHLIGHTS.map((h, i) => (
                    <motion.div
                      key={h.title}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 + i * 0.1 }}
                      style={{
                        padding: '16px 18px',
                        borderRadius: '18px',
                        border: `1px solid ${h.color}20`,
                        background: `linear-gradient(155deg, ${h.bg}, rgba(255,255,255,0.02))`,
                        boxShadow: `0 12px 24px rgba(0,0,0,0.15)`,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                        <div style={{
                          width: '38px', height: '38px',
                          background: `${h.color}18`,
                          borderRadius: '10px',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: h.color, flexShrink: 0, marginTop: '2px',
                        }}>
                          {h.icon}
                        </div>
                        <div>
                          <h4 style={{
                            fontSize: '0.88remrem', fontWeight: 700, marginBottom: '4px',
                            fontFamily: 'Outfit, Noto Sans SC, sans-serif', color: '#FFFFFF', margin: 0,
                          }}>{h.title}</h4>
                          <p style={{
                            fontSize: '0.75remrem', lineHeight: 1.6,
                            color: 'rgba(255,255,255,0.55)',
                            fontFamily: 'Outfit, Noto Sans SC, sans-serif', margin: 0,
                          }}>{h.desc}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* 技术标签 */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7 }}
                  style={{
                    display: 'flex', justifyContent: 'center', gap: '8px',
                    marginTop: '20px', flexWrap: 'wrap',
                  }}
                >
                  {['DeepSeek AI', 'Open-Meteo 天气', '真太阳时', 'SQLite 本地'].map(tag => (
                    <span key={tag} style={{
                      padding: '4px 10px', borderRadius: '8px',
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      fontSize: '0.63remrem', color: 'rgba(255,255,255,0.4)',
                      fontFamily: 'Outfit, sans-serif',
                    }}>{tag}</span>
                  ))}
                </motion.div>
              </div>
            )}

            {/* ========== Slide 3: 开始使用 ========== */}
            {currentSlide === 3 && (
              <div style={{ paddingTop: '20px', textAlign: 'center' }}>
                {/* 大图标 */}
                <motion.div
                  initial={{ scale: 0, rotate: -90 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 180, damping: 12 }}
                  style={{
                    width: '100px', height: '100px',
                    background: GRADIENT.primary,
                    borderRadius: '50%',
                    margin: '0 auto 24px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 16px 40px rgba(255,122,92,0.35)',
                    position: 'relative',
                  }}
                >
                  <Sparkle size={44} color="#FFFFFF" />
                  {/* 外环 */}
                  <div style={{
                    position: 'absolute', inset: '-6px', borderRadius: '50%',
                    border: '1.5px solid rgba(255,122,92,0.2)',
                  }} />
                </motion.div>

                <motion.h2
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  style={{
                    fontSize: '1.38remrem', fontWeight: 800, marginBottom: '8px',
                    fontFamily: 'Outfit, Noto Sans SC, sans-serif',
                  }}
                >
                  开启你的专属运势
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  style={{
                    fontSize: '0.81remrem', color: 'rgba(255,255,255,0.45)',
                    fontFamily: 'Outfit, sans-serif', marginBottom: '24px',
                    lineHeight: 1.5,
                  }}
                >
                  输入生辰，即刻解锁命盘分析、大运走势、穿搭配色与 AI 命理
                </motion.p>

                {/* 三步流程 */}
                <div style={{ display: 'grid', gap: '10px', textAlign: 'left' }}>
                  {STEPS.map((s, i) => (
                    <motion.div
                      key={s.num}
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.35 + i * 0.08 }}
                      style={{
                        padding: '14px 16px', borderRadius: '16px',
                        border: `1px solid ${s.color}25`,
                        background: `linear-gradient(155deg, ${s.color}10, rgba(255,255,255,0.02))`,
                        display: 'flex', alignItems: 'center', gap: '12px',
                        boxShadow: `0 8px 16px ${s.color}12`,
                      }}
                    >
                      <div style={{
                        width: '36px', height: '36px',
                        borderRadius: '10px',
                        background: `${s.color}20`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: s.color, flexShrink: 0,
                      }}>
                        {s.icon}
                      </div>
                      <div>
                        <p style={{ margin: 0, fontFamily: 'Outfit, Noto Sans SC, sans-serif', fontSize: '0.81remrem', fontWeight: 700, color: '#FFFFFF' }}>
                          {s.title}
                        </p>
                        <p style={{ margin: '2px 0 0', fontFamily: 'Outfit, Noto Sans SC, sans-serif', fontSize: '0.69remrem', color: 'rgba(255,255,255,0.5)' }}>
                          {s.desc}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* 信任标签 */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7 }}
                  style={{
                    display: 'flex', justifyContent: 'center', gap: '8px',
                    marginTop: '20px', flexWrap: 'wrap',
                  }}
                >
                  {[
                    { label: '免费使用', icon: <Sparkle size={10} /> },
                    { label: '无需注册', icon: <Shield size={10} /> },
                    { label: '数据安全', icon: <Lock size={10} /> },
                  ].map(tag => (
                    <span key={tag.label} style={{
                      padding: '5px 12px', borderRadius: '20px',
                      background: 'rgba(255,255,255,0.08)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      fontSize: '0.69remrem', color: 'rgba(255,255,255,0.6)',
                      fontFamily: 'Outfit, Noto Sans SC, sans-serif',
                      display: 'inline-flex', alignItems: 'center', gap: '4px',
                    }}>
                      {tag.icon} {tag.label}
                    </span>
                  ))}
                </motion.div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* 底部操作栏 */}
      <AnimatePresence>
        {showContent && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            style={{
              position: 'fixed', bottom: 0, left: 0, right: 0,
              padding: '0 24px 28px',
              background: 'linear-gradient(to top, rgba(13,13,26,1) 0%, rgba(13,13,26,0.95) 60%, rgba(13,13,26,0) 100%)',
              zIndex: 10,
            }}
          >
            {/* 页码 */}
            <p style={{
              textAlign: 'center', fontSize: '0.69remrem', color: 'rgba(255,255,255,0.25)',
              fontFamily: 'Outfit, sans-serif', marginBottom: '14px',
            }}>
              {currentSlide + 1} / {TOTAL_SLIDES}
            </p>

            {/* 按钮组 */}
            <div style={{ display: 'flex', gap: '10px' }}>
              {showBack && (
                <motion.button
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  onClick={goBack}
                  style={{
                    flex: '0 0 auto', width: '56px',
                    padding: '16px', background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: '16px', color: 'rgba(255,255,255,0.7)',
                    fontSize: '0.88remrem', cursor: 'pointer', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'Outfit, sans-serif',
                    backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
                  }}
                >←</motion.button>
              )}
              <motion.button
                onClick={goNext}
                whileHover={{ y: -2, scale: 1.01 }}
                whileTap={{ y: 0, scale: 0.97 }}
                style={{
                  flex: 1,
                  padding: '16px',
                  background: currentSlide === TOTAL_SLIDES - 1 ? GRADIENT.primary : GRADIENT.primary,
                  border: 'none', borderRadius: '16px',
                  color: '#FFFFFF', fontSize: '0.94remrem', fontWeight: 700,
                  cursor: 'pointer', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', gap: '8px',
                  fontFamily: 'Outfit, Noto Sans SC, sans-serif',
                  boxShadow: '0 12px 28px rgba(255,122,92,0.35)',
                  transition: MOTION_TOKENS.uiEase,
                }}
              >
                {btnLabel}
                {currentSlide < TOTAL_SLIDES - 1 && <ArrowRight size={18} />}
                {currentSlide === TOTAL_SLIDES - 1 && <Sparkle size={18} />}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes introFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-16px); }
        }
      `}</style>
    </div>
  );
}
