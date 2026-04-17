import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Palette, Gem, Shirt, Star, ArrowRight, Compass, Sparkle } from 'lucide-react';
import { COLOR_TOKENS, SHADOW_TOKENS, RADIUS_TOKENS, MOTION_TOKENS } from '../theme/designTokens';

// 渐变色配置
const GRADIENT = {
  primary: `linear-gradient(135deg, ${COLOR_TOKENS.brand.coral} 0%, ${COLOR_TOKENS.brand.orange} 50%, ${COLOR_TOKENS.brand.yellow} 100%)`,
  purple: `linear-gradient(135deg, ${COLOR_TOKENS.brand.purple} 0%, ${COLOR_TOKENS.brand.blue} 100%)`,
  dark: 'linear-gradient(145deg, #1A1A2E 0%, #2F234E 48%, #1D2D49 100%)',
};

const FEATURES = [
  {
    icon: <Sparkles size={28} />,
    title: '命盘深度解析',
    desc: '录入生辰后自动生成命盘，快速识别日主与五行强弱',
    color: '#FF7A5C',
    bg: 'rgba(255,122,92,0.1)',
  },
  {
    icon: <Palette size={28} />,
    title: '每日色彩策略',
    desc: '结合流日与天气给出场景配色，支持通勤/约会/聚会切换',
    color: '#FF9D6B',
    bg: 'rgba(255,157,107,0.1)',
  },
  {
    icon: <Gem size={28} />,
    title: '开运手串建议',
    desc: '按当日能量给出主推荐与次推荐，附功效与场景建议',
    color: '#9D6BFF',
    bg: 'rgba(157,107,255,0.1)',
  },
  {
    icon: <Shirt size={28} />,
    title: 'AI 命理问答',
    desc: '支持自然语言追问，获得更细的事业、感情、健康建议',
    color: '#6BD4FF',
    bg: 'rgba(107,212,255,0.1)',
  },
];

const FIVE_ELEMENTS = [
  { name: '木', color: '#4CAF50', desc: '生机勃发', bg: 'rgba(76,175,80,0.2)' },
  { name: '火', color: '#FF5252', desc: '热情洋溢', bg: 'rgba(255,82,82,0.2)' },
  { name: '土', color: '#FFC107', desc: '厚德载物', bg: 'rgba(255,193,7,0.2)' },
  { name: '金', color: '#90A4AE', desc: '刚毅果断', bg: 'rgba(144,164,174,0.2)' },
  { name: '水', color: '#42A5F5', desc: '灵动智慧', bg: 'rgba(66,165,245,0.2)' },
];

type VisualMode = 'vivid' | 'premium';

export default function IntroPage({ onEnter, visualMode = 'vivid' }: { onEnter: () => void; visualMode?: VisualMode }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showContent, setShowContent] = useState(false);
  const introGradient =
    visualMode === 'premium'
      ? 'radial-gradient(circle at 18% 16%, rgba(92,99,255,0.22) 0%, transparent 45%), radial-gradient(circle at 80% 84%, rgba(157,107,255,0.2) 0%, transparent 45%), radial-gradient(circle at 72% 24%, rgba(107,212,255,0.2) 0%, transparent 36%)'
      : 'radial-gradient(circle at 18% 16%, rgba(255,122,92,0.2) 0%, transparent 45%), radial-gradient(circle at 80% 84%, rgba(157,107,255,0.2) 0%, transparent 45%), radial-gradient(circle at 72% 24%, rgba(107,212,255,0.18) 0%, transparent 36%)';

  useEffect(() => {
    // 延迟显示内容
    const timer = setTimeout(() => setShowContent(true), 300);
    return () => clearTimeout(timer);
  }, []);

  const goNext = () => {
    if (currentSlide < 2) {
      setCurrentSlide(prev => prev + 1);
    } else {
      onEnter();
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: GRADIENT.dark,
      color: '#FFFFFF',
      overflow: 'hidden',
    }}>
      {/* 背景装饰 */}
      <div style={{
        position: 'fixed', inset: 0,
        background: introGradient,
        pointerEvents: 'none',
      }} />

      {/* Logo 和标题 */}
      <AnimatePresence>
        {showContent && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            style={{
              padding: '48px 24px 24px',
              textAlign: 'center',
            }}
          >
            {/* Logo */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
              style={{
                width: '80px', height: '80px',
                background: GRADIENT.primary,
                borderRadius: RADIUS_TOKENS.xl,
                margin: '0 auto 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: SHADOW_TOKENS.glowStrong,
              }}
            >
              <Sparkles size={40} color="#FFFFFF" />
            </motion.div>

            {/* 标题 */}
            <motion.h1
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              style={{
                fontSize: '32px', fontWeight: 800,
                marginBottom: '8px',
                background: GRADIENT.primary,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontFamily: 'Outfit, sans-serif',
              }}
            >
              五行色彩
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              style={{
                fontSize: '14px', color: 'rgba(255,255,255,0.6)',
                fontFamily: 'Outfit, sans-serif',
              }}
            >
              东方美学 × 时尚穿搭 × 命理智慧
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 内容区域 */}
      <div style={{
        maxWidth: '400px',
        margin: '0 auto',
        padding: '0 24px',
      }}>
        {/* 功能介绍 */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            style={{ minHeight: '380px' }}
          >
            {currentSlide === 0 && (
              <div style={{ paddingTop: '20px' }}>
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  style={{
                    fontSize: '13px', color: 'rgba(255,255,255,0.5)',
                    textAlign: 'center', marginBottom: '24px',
                    fontFamily: 'Outfit, sans-serif',
                  }}
                >
                  用东方智慧，开启你的专属时尚密码
                </motion.p>

                {/* 五行图示 */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 }}
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '12px',
                    marginBottom: '32px',
                  }}
                >
                  {FIVE_ELEMENTS.map((el, i) => (
                    <motion.div
                      key={el.name}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 + i * 0.1 }}
                      style={{
                        width: '56px', height: '72px',
                        background: el.bg,
                        borderRadius: RADIUS_TOKENS.lg,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: `1px solid ${el.color}40`,
                      }}
                    >
                      <span style={{ fontSize: '24px', fontWeight: 800, color: el.color }}>
                        {el.name}
                      </span>
                      <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.6)', marginTop: '4px' }}>
                        {el.desc}
                      </span>
                    </motion.div>
                  ))}
                </motion.div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                  style={{
                    background: 'linear-gradient(145deg, rgba(255,255,255,0.1), rgba(255,255,255,0.04))',
                    borderRadius: '20px',
                    padding: '24px',
                    border: '1px solid rgba(255,255,255,0.18)',
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)',
                    boxShadow: '0 18px 36px rgba(0,0,0,0.2)',
                  }}
                >
                  <h3 style={{
                    fontSize: '18px', fontWeight: 700, marginBottom: '12px',
                    fontFamily: 'Outfit, sans-serif',
                  }}>
                    为什么先看这页？
                  </h3>
                  <p style={{
                    fontSize: '14px', lineHeight: 1.7, color: 'rgba(255,255,255,0.7)',
                    fontFamily: 'Outfit, sans-serif',
                  }}>
                    我们会把八字信息转成每天可执行的穿搭与饰品建议，目标不是玄学堆叠，而是让你<span style={{ color: '#FF7A5C' }}>每天知道该怎么搭、为什么这么搭</span>。
                  </p>
                </motion.div>
              </div>
            )}

            {currentSlide === 1 && (
              <div style={{ paddingTop: '20px' }}>
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  style={{
                    fontSize: '13px', color: 'rgba(255,255,255,0.5)',
                    textAlign: 'center', marginBottom: '24px',
                    fontFamily: 'Outfit, sans-serif',
                  }}
                >
                  四大核心功能，全方位提升你的运势
                </motion.p>

                {/* 功能卡片 */}
                <div style={{ display: 'grid', gap: '12px' }}>
                  {FEATURES.map((feature, i) => (
                    <motion.div
                      key={feature.title}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + i * 0.1 }}
                      style={{
                        background: `linear-gradient(145deg, ${feature.bg}, rgba(255,255,255,0.04))`,
                        borderRadius: RADIUS_TOKENS.lg,
                        padding: '16px',
                        border: `1px solid ${feature.color}30`,
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '14px',
                        backdropFilter: 'blur(8px)',
                        WebkitBackdropFilter: 'blur(8px)',
                        boxShadow: `0 10px 20px ${feature.color}22`,
                      }}
                    >
                      <div style={{
                        width: '48px', height: '48px',
                        background: `${feature.color}20`,
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: feature.color,
                        flexShrink: 0,
                      }}>
                        {feature.icon}
                      </div>
                      <div>
                        <h4 style={{
                          fontSize: '15px', fontWeight: 700, marginBottom: '4px',
                          fontFamily: 'Outfit, sans-serif',
                        }}>
                          {feature.title}
                        </h4>
                        <p style={{
                          fontSize: '12px', color: 'rgba(255,255,255,0.6)',
                          lineHeight: 1.5, fontFamily: 'Outfit, sans-serif',
                        }}>
                          {feature.desc}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.75 }}
                  style={{
                    marginTop: '14px',
                    padding: '12px 14px',
                    borderRadius: '14px',
                    background: 'linear-gradient(145deg, rgba(255,255,255,0.12), rgba(255,255,255,0.06))',
                    border: '1px solid rgba(255,255,255,0.22)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                    <Compass size={14} color="#6BD4FF" />
                    <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '12px', fontWeight: 700, color: '#DCE8FF' }}>定位联动</span>
                  </div>
                  <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '11px', lineHeight: 1.5, color: 'rgba(255,255,255,0.65)', margin: 0 }}>
                    支持自动定位与手动选城，天气和流日会实时影响今日推荐结果。
                  </p>
                </motion.div>
              </div>
            )}

            {currentSlide === 2 && (
              <div style={{
                paddingTop: '40px',
                textAlign: 'center',
              }}>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200 }}
                  style={{
                    width: '120px', height: '120px',
                    background: GRADIENT.primary,
                    borderRadius: '50%',
                    margin: '0 auto 32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: SHADOW_TOKENS.glowStrong,
                  }}
                >
                  <Sparkles size={56} color="#FFFFFF" />
                </motion.div>

                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  style={{
                    fontSize: '24px', fontWeight: 800, marginBottom: '12px',
                    fontFamily: 'Outfit, sans-serif',
                  }}
                >
                  准备好开启你的
                  <span style={{ background: GRADIENT.primary, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    五行色彩之旅
                  </span>
                  了吗？
                </motion.h2>

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  style={{
                    fontSize: '14px', color: 'rgba(255,255,255,0.6)',
                    marginBottom: '40px', fontFamily: 'Outfit, sans-serif',
                  }}
                >
                  立即体验专属你的开运穿搭指南
                </motion.p>

                <div style={{ display: 'grid', gap: '10px', marginTop: '20px', textAlign: 'left' }}>
                  {[
                    { step: '01', title: '录入生辰信息', desc: '姓名、出生时间、出生地（省市）' },
                    { step: '02', title: '生成命盘与运势', desc: '自动完成五行分析与日运评分' },
                    { step: '03', title: '查看穿搭与手串建议', desc: '拿到可直接执行的今日方案' },
                  ].map((item, i) => (
                    <motion.div
                      key={item.step}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.55 + i * 0.08 }}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '12px',
                        border: '1px solid rgba(255,255,255,0.2)',
                        background: 'linear-gradient(145deg, rgba(255,255,255,0.12), rgba(255,255,255,0.05))',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                      }}
                    >
                      <span style={{
                        width: '30px',
                        height: '30px',
                        borderRadius: '999px',
                        background: 'rgba(255,255,255,0.16)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontFamily: 'Outfit, sans-serif',
                        fontSize: '11px',
                        fontWeight: 800,
                        color: '#FFD9EA',
                      }}>{item.step}</span>
                      <div>
                        <p style={{ margin: 0, fontFamily: 'Outfit, sans-serif', fontSize: '12px', fontWeight: 700, color: '#FFFFFF' }}>{item.title}</p>
                        <p style={{ margin: '2px 0 0', fontFamily: 'Outfit, sans-serif', fontSize: '10px', color: 'rgba(255,255,255,0.65)' }}>{item.desc}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* 底部按钮 */}
      <AnimatePresence>
        {showContent && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            style={{
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              padding: '24px',
              background: 'linear-gradient(to top, rgba(26,26,46,1) 0%, rgba(26,26,46,0) 100%)',
            }}
          >
            {/* 指示器 */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '8px',
              marginBottom: '20px',
            }}>
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  onClick={() => setCurrentSlide(i)}
                  style={{
                    width: currentSlide === i ? '24px' : '8px',
                    height: '8px',
                    borderRadius: '4px',
                    background: currentSlide === i ? GRADIENT.primary : 'rgba(255,255,255,0.2)',
                    transition: 'all 0.3s',
                    cursor: 'pointer',
                  }}
                />
              ))}
            </div>

            {/* 主按钮 */}
            <motion.button
              onClick={goNext}
              whileHover={{ y: -2, scale: 1.02 }}
              whileTap={{ y: 0, scale: 0.97 }}
              style={{
                width: '100%',
                padding: '16px',
                background: GRADIENT.primary,
                border: 'none',
                borderRadius: RADIUS_TOKENS.lg,
                color: '#FFFFFF',
                fontSize: '16px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                fontFamily: 'Outfit, sans-serif',
                boxShadow: '0 14px 28px rgba(255,122,92,0.38)',
                transition: MOTION_TOKENS.uiEase,
              }}
            >
              {currentSlide === 2 ? (
                <>开始体验</>
              ) : (
                <>
                  {currentSlide === 0 ? '了解更多' : '继续'}
                  <ArrowRight size={18} />
                </>
              )}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 跳过按钮 */}
      <AnimatePresence>
        {showContent && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            onClick={onEnter}
            style={{
              position: 'fixed',
              top: '24px',
              right: '24px',
              padding: '8px 16px',
              background: 'linear-gradient(145deg, rgba(255,255,255,0.16), rgba(255,255,255,0.08))',
              border: '1px solid rgba(255,255,255,0.28)',
              borderRadius: '20px',
              color: 'rgba(255,255,255,0.6)',
              fontSize: '12px',
              cursor: 'pointer',
              fontFamily: 'Outfit, sans-serif',
              boxShadow: '0 10px 20px rgba(16,12,38,0.26)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
            }}
          >
            跳过
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
