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
    title: '八字命盘 · 精准解读',
    desc: '输入生辰，一键生成专属命盘。五行强弱、日主特质、格局判断，全部可视化呈现',
    color: '#FF7A5C',
    bg: 'rgba(255,122,92,0.1)',
  },
  {
    icon: <Palette size={28} />,
    title: '今日色彩 · 天天不同',
    desc: '结合当天流日五行 + 实时天气，给出职场/约会/聚会的精准配色方案，穿对颜色事半功倍',
    color: '#FF9D6B',
    bg: 'rgba(255,157,107,0.1)',
  },
  {
    icon: <Gem size={28} />,
    title: '开运手串 · 精选推荐',
    desc: '根据身强/身弱和今日能量，智能推荐最适合的石头手串，附功效解释与适合场景',
    color: '#9D6BFF',
    bg: 'rgba(157,107,255,0.1)',
  },
  {
    icon: <Shirt size={28} />,
    title: 'AI 命理 · 随时追问',
    desc: '专属 AI 助理随时在线，事业、感情、财运、健康，用自然语言聊出你想知道的一切',
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
  const introGradient =
    'radial-gradient(circle at 18% 16%, rgba(255,122,92,0.2) 0%, transparent 45%), radial-gradient(circle at 80% 84%, rgba(157,107,255,0.2) 0%, transparent 45%), radial-gradient(circle at 72% 24%, rgba(107,212,255,0.18) 0%, transparent 36%)';

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
              八字命理 × 今日穿搭 × AI 开运
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
                  用你的生辰，解锁专属你的每日穿搭密码
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
                    不只是算命，更是生活指南
                  </h3>
                  <p style={{
                    fontSize: '14px', lineHeight: 1.7, color: 'rgba(255,255,255,0.7)',
                    fontFamily: 'Outfit, sans-serif',
                  }}>
                    基于你的八字五行，每天生成<span style={{ color: '#FF7A5C' }}>可直接执行的穿搭配色</span>，结合实时天气和流日运势，让你每出门一次，都是恰到好处的状态。
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
                  四大核心功能，让命理真正融入你的日常
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
                    <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '12px', fontWeight: 700, color: '#DCE8FF' }}>实时天气联动</span>
                  </div>
                  <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '11px', lineHeight: 1.5, color: 'rgba(255,255,255,0.65)', margin: 0 }}>
                    自动获取你所在城市的实时天气，天气五行会影响今日推荐结果，晴天/雨天/阴天推荐各有不同。
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
                  你的专属运势指南
                  <br />
                  <span style={{ background: GRADIENT.primary, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    只需 30 秒
                  </span>
                </motion.h2>

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  style={{
                    fontSize: '13px', color: 'rgba(255,255,255,0.55)',
                    marginBottom: '28px', fontFamily: 'Outfit, sans-serif',
                    lineHeight: 1.6,
                  }}
                >
                  输入生辰，立刻获得今日穿搭配色、开运手串和 AI 运势分析
                </motion.p>

                <div style={{ display: 'grid', gap: '10px', marginTop: '8px', textAlign: 'left' }}>
                  {[
                    { step: '01', title: '填写生辰八字', desc: '姓名、出生年月日时、性别，2 分钟搞定', color: '#FF7A5C' },
                    { step: '02', title: '查看今日运势', desc: '五行分析、日运评分、人生大运 K 线图', color: '#FF9D6B' },
                    { step: '03', title: '拿走今日方案', desc: '配色穿搭 + 开运手串 + AI 追问，随取随用', color: '#9D6BFF' },
                  ].map((item, i) => (
                    <motion.div
                      key={item.step}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.55 + i * 0.08 }}
                      style={{
                        padding: '12px 14px',
                        borderRadius: '14px',
                        border: `1px solid ${item.color}30`,
                        background: `linear-gradient(145deg, ${item.color}12, rgba(255,255,255,0.04))`,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                      }}
                    >
                      <span style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '999px',
                        background: `${item.color}28`,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontFamily: 'Outfit, sans-serif',
                        fontSize: '11px',
                        fontWeight: 800,
                        color: item.color,
                        flexShrink: 0,
                      }}>{item.step}</span>
                      <div>
                        <p style={{ margin: 0, fontFamily: 'Outfit, sans-serif', fontSize: '13px', fontWeight: 700, color: '#FFFFFF' }}>{item.title}</p>
                        <p style={{ margin: '2px 0 0', fontFamily: 'Outfit, sans-serif', fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}>{item.desc}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* 信任标签 */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.85 }}
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '10px',
                    marginTop: '18px',
                    flexWrap: 'wrap',
                  }}
                >
                  {['免费使用', '无需注册', '数据不外传'].map((tag) => (
                    <span key={tag} style={{
                      padding: '4px 12px',
                      borderRadius: '20px',
                      background: 'rgba(255,255,255,0.1)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      fontSize: '11px',
                      color: 'rgba(255,255,255,0.7)',
                      fontFamily: 'Outfit, sans-serif',
                    }}>{tag}</span>
                  ))}
                </motion.div>
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
