import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Palette, Gem, Shirt, Star, ArrowRight, Play, Moon, Sun, Wind } from 'lucide-react';

// 渐变色配置
const GRADIENT = {
  primary: 'linear-gradient(135deg, #FF6B9D 0%, #FF9D6B 50%, #FFD666 100%)',
  purple: 'linear-gradient(135deg, #9D6BFF 0%, #6BD4FF 100%)',
  dark: 'linear-gradient(135deg, #1A1A2E 0%, #2D2D44 100%)',
};

const FEATURES = [
  {
    icon: <Sparkles size={28} />,
    title: '八字命盘分析',
    desc: '输入生辰八字，精准解读你的五行属性与命格特质',
    color: '#FF6B9D',
    bg: 'rgba(255,107,157,0.1)',
  },
  {
    icon: <Palette size={28} />,
    title: '今日色彩搭配',
    desc: '根据流日五行，智能推荐最适合你的穿搭配色方案',
    color: '#FF9D6B',
    bg: 'rgba(255,157,107,0.1)',
  },
  {
    icon: <Gem size={28} />,
    title: '开运手串推荐',
    desc: '结合命理与五行，为你精选旺运增势的珠宝手串',
    color: '#9D6BFF',
    bg: 'rgba(157,107,255,0.1)',
  },
  {
    icon: <Shirt size={28} />,
    title: '场景穿搭灵感',
    desc: '职场、日常、聚会、节日，4大场景全方位覆盖',
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

export default function IntroPage({ onEnter }: { onEnter: () => void }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showContent, setShowContent] = useState(false);

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
        background: 'radial-gradient(circle at 20% 20%, rgba(255,107,157,0.15) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(157,107,255,0.15) 0%, transparent 50%)',
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
                borderRadius: '24px',
                margin: '0 auto 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 32px rgba(255,107,157,0.4)',
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
                        borderRadius: '16px',
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
                    background: 'rgba(255,255,255,0.05)',
                    borderRadius: '20px',
                    padding: '24px',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}
                >
                  <h3 style={{
                    fontSize: '18px', fontWeight: 700, marginBottom: '12px',
                    fontFamily: 'Outfit, sans-serif',
                  }}>
                    什么是五行色彩？
                  </h3>
                  <p style={{
                    fontSize: '14px', lineHeight: 1.7, color: 'rgba(255,255,255,0.7)',
                    fontFamily: 'Outfit, sans-serif',
                  }}>
                    根据中国传统命理学的五行理论，结合你的生辰八字，分析你的五行属性，<span style={{ color: '#FF6B9D' }}>为你量身定制</span>最适合的穿搭色彩与风格。
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
                        background: feature.bg,
                        borderRadius: '16px',
                        padding: '16px',
                        border: `1px solid ${feature.color}30`,
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '14px',
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
                    boxShadow: '0 12px 48px rgba(255,107,157,0.4)',
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

                {/* 装饰性数字 */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: '32px',
                  marginTop: '24px',
                }}>
                  {[
                    { num: '50+', label: '五行配色' },
                    { num: '4', label: '穿搭场景' },
                    { num: '∞', label: '每日更新' },
                  ].map((item, i) => (
                    <motion.div
                      key={item.label}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 + i * 0.1 }}
                      style={{ textAlign: 'center' }}
                    >
                      <div style={{
                        fontSize: '28px', fontWeight: 800,
                        background: GRADIENT.primary,
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        fontFamily: 'Outfit, sans-serif',
                      }}>
                        {item.num}
                      </div>
                      <div style={{
                        fontSize: '11px', color: 'rgba(255,255,255,0.5)',
                        fontFamily: 'Outfit, sans-serif',
                      }}>
                        {item.label}
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
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              style={{
                width: '100%',
                padding: '16px',
                background: GRADIENT.primary,
                border: 'none',
                borderRadius: '16px',
                color: '#FFFFFF',
                fontSize: '16px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                fontFamily: 'Outfit, sans-serif',
                boxShadow: '0 8px 24px rgba(255,107,157,0.4)',
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
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '20px',
              color: 'rgba(255,255,255,0.6)',
              fontSize: '12px',
              cursor: 'pointer',
              fontFamily: 'Outfit, sans-serif',
            }}
          >
            跳过
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
