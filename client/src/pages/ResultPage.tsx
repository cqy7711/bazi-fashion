import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, ArrowLeft, TrendingUp, Users, Heart, Activity, Sparkles, Edit2, X, ChevronDown } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, ReferenceLine, Cell } from 'recharts';
import type { UserBirthInfo, FiveElementsAnalysis, LanguageStyle } from '../../shared/types';

const ELEMENT_NAMES: Record<string, string> = { wood: '木', fire: '火', earth: '土', metal: '金', water: '水' };
const ELEMENT_COLORS: Record<string, string> = {
  wood: '#00C47A', fire: '#FF6B6B', earth: '#D4A000',
  metal: '#7B8FA8', water: '#00A8E8',
};
const ELEMENT_BG: Record<string, string> = {
  wood: 'rgba(0,196,122,0.12)', fire: 'rgba(255,107,107,0.12)',
  earth: 'rgba(212,160,0,0.12)', metal: 'rgba(123,143,168,0.12)', water: 'rgba(0,168,232,0.12)',
};
const USER_ID = 'user_default';

const PALETTE = {
  coral: '#FF6B9D', coralLight: 'rgba(255,107,157,0.1)',
  orange: '#FF9D6B', orangeLight: 'rgba(255,157,107,0.1)',
  yellow: '#FFD666', yellowLight: 'rgba(255,214,102,0.12)',
  green: '#6BFF9D', greenLight: 'rgba(107,255,157,0.1)',
  blue: '#6BD4FF', blueLight: 'rgba(107,212,255,0.1)',
  purple: '#9D6BFF', purpleLight: 'rgba(157,107,255,0.1)',
  text: '#1A1A2E', textSecondary: '#6B7280', textMuted: '#A0A8C0',
  border: '#F0F1F8', cardBg: '#FFFFFF',
};

const styleLabels: Record<LanguageStyle, string> = {
  normal: '大白话', stock: '📈 股民', game: '🎮 游戏',
  fairytale: '🧚 童话', fortune: '🔮 算命师', workplace: '💼 职场',
};

function cn(...c: (string | boolean | undefined)[]) { return c.filter(Boolean).join(' '); }

// ─── 每日运势计算 ────────────────────────────────────────────────────────────
interface DailyFortune {
  total: number;
  totalLabel: string;
  totalColor: string;
  career: { score: number; label: string; desc: string; color: string; icon: string };
  wealth: { score: number; label: string; desc: string; color: string; icon: string };
  love: { score: number; label: string; desc: string; color: string; icon: string };
  health: { score: number; label: string; desc: string; color: string; icon: string };
  luckyColor: { name: string; hex: string; reason: string };
  luckyNumber: { num: number; reason: string };
  luckyTime: string;
  luckyDirection: string;
  avoidTime: string;
  avoidDirection: string;
  tips: string[];
}

function getScoreLabel(score: number): string {
  if (score >= 85) return '大吉';
  if (score >= 70) return '吉';
  if (score >= 55) return '小吉';
  if (score >= 45) return '平';
  if (score >= 30) return '小凶';
  return '凶';
}

function getScoreColor(score: number): string {
  if (score >= 85) return '#00C47A';
  if (score >= 70) return '#FF9D6B';
  if (score >= 55) return '#FFD666';
  if (score >= 45) return '#A0A8C0';
  if (score >= 30) return '#FF9D6B';
  return '#FF6B6B';
}

function deriveDailyFortune(userInfo: UserBirthInfo, bazi: any, fiveEls: any): DailyFortune {
  const favorable = userInfo.favorableElements || [];
  const unfavorable = userInfo.unfavorableElements || [];
  const dm = bazi.dayMasterElement; // 木 火 土 金 水

  // 四维基础分（根据喜忌神）
  const favScore = Math.min(100, 45 + favorable.length * 12);
  const unfavPenalty = unfavorable.length * 6;
  const dmBonus = { wood: 5, fire: 4, earth: 6, metal: 3, water: 7 }[dm] || 0;
  const base = Math.max(30, favScore - unfavPenalty + dmBonus);

  // 根据八字强弱调整
  const bodyScore = userInfo.bodyStrengthScore || 55;
  const bodyFactor = bodyScore > 70 ? 5 : bodyScore < 40 ? -3 : 0;
  const total = Math.min(100, Math.max(28, Math.round(base + bodyFactor)));

  const totalLabel = getScoreLabel(total);
  const totalColor = getScoreColor(total);

  // 事业：喜用神多+身强=高
  const careerScore = Math.min(100, Math.round(base + (favorable.includes(dm) ? 8 : -5)));
  // 财运：土金水多有利
  const wealthScore = Math.min(100, Math.round(base - 2 + ((fiveEls.earth || 0) > 2 ? 6 : 0) + ((fiveEls.metal || 0) > 2 ? 4 : 0)));
  // 感情：木火旺相生
  const loveScore = Math.min(100, Math.round(base + (['wood', 'fire'].includes(dm) ? 5 : -3)));
  // 健康：五行平衡
  const maxEl = Math.max(...Object.values(fiveEls) as number[]);
  const minEl = Math.min(...Object.values(fiveEls) as number[]);
  const balance = maxEl - minEl;
  const healthScore = Math.min(100, Math.round(base - Math.round(balance * 2)));

  const elDesc: Record<string, Record<string, string>> = {
    wood: { career: '木气生发，创造力强，宜文化创意、互联网、出版传媒。', wealth: '正财稳定，正偏财运尚可，忌投机。', love: '木主仁，感情细腻浪漫，社交活跃期。', health: '注意肝胆、神经系统、情绪调节。' },
    fire: { career: '火气旺盛，竞争心强，宜销售、演讲、法律、政治。', wealth: '财来财去，偏财运旺，忌高风险投资。', love: '火主礼，热情主动，姻缘易现，🔥年尤利。', health: '注意心脏、血液循环、眼睛健康。' },
    earth: { career: '土气厚重，稳扎稳打，宜建筑、地产、农业、管理。', wealth: '土主信，财运稳健积累，不宜冒险求财。', love: '土主信，感情稳重务实，婚配多以相亲为主。', health: '注意脾胃消化、饮食规律，皮肤易过敏。' },
    metal: { career: '金气清朗，决策力强，宜金融、科技、法律、外交。', wealth: '金主义，财运清正，利正财，偏财有波动。', love: '金主义，感情果断利落，注意避免冷落伴侣。', health: '注意肺部呼吸系统、骨骼、牙齿健康。' },
    water: { career: '水气流通，适应力强，宜贸易、物流、航海、媒体。', wealth: '水主智，财运流通性强，利于贸易与流通行业。', love: '水主智，感情多波折或晚婚居多，早年勿急。', health: '注意肾脏泌尿系统、耳力、冬季防寒。' },
  };

  const careerColor = getScoreColor(careerScore);
  const wealthColor = getScoreColor(wealthScore);
  const loveColor = getScoreColor(loveScore);
  const healthColor = getScoreColor(healthScore);

  // 幸运色
  const luckyColors: Record<string, { name: string; hex: string }> = {
    wood: { name: '青绿色', hex: '#00C47A' },
    fire: { name: '朱红色', hex: '#FF6B6B' },
    earth: { name: '黄棕色', hex: '#D4A000' },
    metal: { name: '银白色', hex: '#7B8FA8' },
    water: { name: '深蓝色', hex: '#00A8E8' },
  };
  const luckyColor = luckyColors[dm] || luckyColors.water;

  // 幸运数字
  const luckyNumbers: Record<string, number[]> = {
    wood: [1, 2, 3], fire: [3, 9, 7], earth: [5, 0, 8],
    metal: [4, 5, 9], water: [1, 6, 7],
  };
  const luckyNums = luckyNumbers[dm] || [1, 6];
  const luckyNumber = luckyNums[Math.floor(Math.random() * luckyNums.length)]; // deterministic-ish via day

  // 吉时凶时（地支对应时辰）
  const timeMap: Record<number, string> = { 0: '子时', 1: '丑时', 2: '寅时', 3: '卯时', 4: '辰时', 5: '巳时', 6: '午时', 7: '未时', 8: '申时', 9: '酉时', 10: '戌时', 11: '亥时' };
  const favHours: Record<string, number[]> = { wood: [2, 3, 4, 5], fire: [6, 7, 10, 11], earth: [0, 1, 8, 9], metal: [4, 5, 8, 9], water: [0, 1, 2, 3] };
  const favH = favHours[dm] || [1, 6];
  const luckyTime = `${timeMap[favH[0]]}（${favH[0]}:00-${favH[0] + 1}:00）· ${timeMap[favH[1]]}（${favH[1]}:00-${favH[1] + 1}:00）`;
  const avoidTime = `${timeMap[(favH[2] + 6) % 12]}（${timeMap[(favH[2] + 6) % 12]}）`;

  // 吉祥方位
  const directionMap: Record<string, { lucky: string; avoid: string }> = {
    wood: { lucky: '东方（事业）· 北方（人脉）', avoid: '西南方' },
    fire: { lucky: '南方（名望）· 东方（学业）', avoid: '西北方' },
    earth: { lucky: '东北/西南（稳重）· 中央', avoid: '正东方' },
    metal: { lucky: '西方（财帛）· 西北（官贵）', avoid: '正东方' },
    water: { lucky: '北方（智慧）· 西方（财运）', avoid: '正南方' },
  };
  const { lucky: luckyDirection, avoid: avoidDirection } = directionMap[dm] || directionMap.wood;

  const tips = [
    elDesc[dm].career,
    elDesc[dm].health,
    total >= 70 ? `今日${totalLabel}，宜大胆推进计划。` : `今日${totalLabel}，宜静心养性，保守行事。`,
  ];

  return {
    total, totalLabel, totalColor,
    career: { score: careerScore, label: getScoreLabel(careerScore), desc: elDesc[dm].career, color: careerColor, icon: '📈' },
    wealth: { score: wealthScore, label: getScoreLabel(wealthScore), desc: elDesc[dm].wealth, color: wealthColor, icon: '💰' },
    love: { score: loveScore, label: getScoreLabel(loveScore), desc: elDesc[dm].love, color: loveColor, icon: '💕' },
    health: { score: healthScore, label: getScoreLabel(healthScore), desc: elDesc[dm].health, color: healthColor, icon: '💪' },
    luckyColor: { name: luckyColor.name, hex: luckyColor.hex, reason: `五行${ELEMENT_NAMES[dm]}主导日，宜${luckyColor.name}` },
    luckyNumber: { num: luckyNumber, reason: `${ELEMENT_NAMES[dm]}之数，助运${luckyNumber}号` },
    luckyTime, luckyDirection, avoidTime, avoidDirection,
    tips,
  };
}

// ─── 环形图 ─────────────────────────────────────────────────────────────────
function ScoreRing({ score, label, color, size = 96 }: { score: number; label: string; color: string; size?: number }) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - score / 100);
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#F0F1F8" strokeWidth={7} />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color}
          strokeWidth={7} strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          strokeLinecap="round"
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: size < 90 ? '18px' : '22px', fontWeight: 900, color }}>{score}</span>
        {size >= 96 && <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '11px', color: css.textMuted, marginTop: '-2px' }}>{label}</span>}
      </div>
    </div>
  );
}

// ─── 编辑用户信息弹窗 ───────────────────────────────────────────────────────
function EditUserModal({ userInfo, onSave, onClose }: { userInfo: UserBirthInfo; onSave: (u: UserBirthInfo) => void; onClose: () => void }) {
  const [form, setForm] = useState({
    name: userInfo.name,
    birthYear: userInfo.birthYear,
    birthMonth: userInfo.birthMonth,
    birthDay: userInfo.birthDay,
    birthHour: userInfo.birthHour,
    gender: userInfo.gender,
    calendarType: userInfo.calendarType,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const years = Array.from({ length: 80 }, (_, i) => 2025 - i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const days31 = Array.from({ length: 31 }, (_, i) => i + 1);
  const days30 = Array.from({ length: 30 }, (_, i) => i + 1);
  const daysFeb = Array.from({ length: 29 }, (_, i) => i + 1);
  const days = form.birthMonth === 2 ? daysFeb : [1, 3, 5, 7, 8, 10, 12].includes(form.birthMonth) ? days31 : days30;

  const handleSave = async () => {
    if (!form.name.trim()) { setError('请输入姓名'); return; }
    setSaving(true);
    try {
      const res = await fetch(`/api/users/${USER_ID}/birth-info/${userInfo.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const updated = await res.json();
      if (!updated.error) { onSave(updated); onClose(); }
      else setError('保存失败，请重试');
    } catch { setError('网络错误，请重试'); }
    finally { setSaving(false); }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '20px',
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          onClick={e => e.stopPropagation()}
          style={{
            background: '#FFFFFF', borderRadius: '24px', padding: '28px',
            width: '100%', maxWidth: '420px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '10px',
                background: `${css.accent}18`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Edit2 style={{ width: '18px', height: '18px', color: css.accent }} />
              </div>
              <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '18px', fontWeight: 800, color: css.text }}>编辑个人信息</h3>
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: css.textMuted, padding: '4px' }}>
              <X style={{ width: '20px', height: '20px' }} />
            </button>
          </div>

          {/* 姓名 */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontFamily: 'Outfit, sans-serif', fontSize: '13px', fontWeight: 700, color: css.textSecondary, display: 'block', marginBottom: '6px' }}>姓名</label>
            <input
              type="text" value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              style={{
                width: '100%', padding: '12px 16px', borderRadius: '14px',
                border: '1.5px solid #F0F1F8', background: '#F8F9FC',
                fontFamily: 'Outfit, sans-serif', fontSize: '15px', color: css.text,
                outline: 'none', boxSizing: 'border-box',
              }}
              placeholder="请输入姓名"
            />
          </div>

          {/* 出生日期 */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontFamily: 'Outfit, sans-serif', fontSize: '13px', fontWeight: 700, color: css.textSecondary, display: 'block', marginBottom: '6px' }}>出生日期</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
              <select value={form.birthYear} onChange={e => setForm(f => ({ ...f, birthYear: Number(e.target.value) }))}
                style={{ padding: '10px 12px', borderRadius: '12px', border: '1.5px solid #F0F1F8', background: '#F8F9FC', fontFamily: 'Outfit, sans-serif', fontSize: '14px', color: css.text, outline: 'none' }}>
                {years.map(y => <option key={y} value={y}>{y}年</option>)}
              </select>
              <select value={form.birthMonth} onChange={e => setForm(f => ({ ...f, birthMonth: Number(e.target.value) }))}
                style={{ padding: '10px 12px', borderRadius: '12px', border: '1.5px solid #F0F1F8', background: '#F8F9FC', fontFamily: 'Outfit, sans-serif', fontSize: '14px', color: css.text, outline: 'none' }}>
                {months.map(m => <option key={m} value={m}>{m}月</option>)}
              </select>
              <select value={form.birthDay} onChange={e => setForm(f => ({ ...f, birthDay: Number(e.target.value) }))}
                style={{ padding: '10px 12px', borderRadius: '12px', border: '1.5px solid #F0F1F8', background: '#F8F9FC', fontFamily: 'Outfit, sans-serif', fontSize: '14px', color: css.text, outline: 'none' }}>
                {days.map(d => <option key={d} value={d}>{d}日</option>)}
              </select>
            </div>
          </div>

          {/* 出生时辰 */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontFamily: 'Outfit, sans-serif', fontSize: '13px', fontWeight: 700, color: css.textSecondary, display: 'block', marginBottom: '6px' }}>出生时辰</label>
            <select value={form.birthHour} onChange={e => setForm(f => ({ ...f, birthHour: Number(e.target.value) }))}
              style={{ width: '100%', padding: '12px 16px', borderRadius: '14px', border: '1.5px solid #F0F1F8', background: '#F8F9FC', fontFamily: 'Outfit, sans-serif', fontSize: '14px', color: css.text, outline: 'none' }}>
              {Array.from({ length: 24 }, (_, i) => i).map(h => (
                <option key={h} value={h}>{h.toString().padStart(2, '0')}:00 — {(h + 1).toString().padStart(2, '0')}:00</option>
              ))}
            </select>
          </div>

          {/* 性别 */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontFamily: 'Outfit, sans-serif', fontSize: '13px', fontWeight: 700, color: css.textSecondary, display: 'block', marginBottom: '8px' }}>性别</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              {(['male', 'female'] as const).map(g => (
                <motion.button key={g} onClick={() => setForm(f => ({ ...f, gender: g }))}
                  whileTap={{ scale: 0.97 }}
                  style={{
                    flex: 1, padding: '12px', borderRadius: '14px',
                    cursor: 'pointer', fontFamily: 'Outfit, sans-serif',
                    fontSize: '14px', fontWeight: 700,
                    background: form.gender === g ? `${css.accent}18` : '#F8F9FC',
                    color: form.gender === g ? css.accent : css.textMuted,
                    border: `1.5px solid ${form.gender === g ? css.accent : '#F0F1F8'}`,
                    transition: 'all 0.2s',
                  }}>
                  {g === 'male' ? '♂ 男' : '♀ 女'}
                </motion.button>
              ))}
            </div>
          </div>

          {/* 历法 */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontFamily: 'Outfit, sans-serif', fontSize: '13px', fontWeight: 700, color: css.textSecondary, display: 'block', marginBottom: '8px' }}>历法</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              {(['solar', 'lunar'] as const).map(c => (
                <motion.button key={c} onClick={() => setForm(f => ({ ...f, calendarType: c }))}
                  whileTap={{ scale: 0.97 }}
                  style={{
                    flex: 1, padding: '12px', borderRadius: '14px',
                    cursor: 'pointer', fontFamily: 'Outfit, sans-serif',
                    fontSize: '14px', fontWeight: 700,
                    background: form.calendarType === c ? `${css.accent}18` : '#F8F9FC',
                    color: form.calendarType === c ? css.accent : css.textMuted,
                    border: `1.5px solid ${form.calendarType === c ? css.accent : '#F0F1F8'}`,
                    transition: 'all 0.2s',
                  }}>
                  {c === 'solar' ? '☀️ 阳历' : '🌙 阴历'}
                </motion.button>
              ))}
            </div>
          </div>

          {error && <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '13px', color: '#FF6B6B', marginBottom: '12px', textAlign: 'center' }}>{error}</p>}

          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={onClose}
              style={{ flex: 1, padding: '14px', borderRadius: '14px', background: '#F8F9FC', border: '1.5px solid #F0F1F8', cursor: 'pointer', fontFamily: 'Outfit, sans-serif', fontSize: '14px', fontWeight: 700, color: css.textMuted }}>
              取消
            </button>
            <motion.button
              onClick={handleSave} whileTap={{ scale: 0.97 }}
              style={{
                flex: 2, padding: '14px', borderRadius: '14px',
                background: `linear-gradient(135deg, ${css.accent}, ${PALETTE.orange})`,
                border: 'none', cursor: 'pointer',
                fontFamily: 'Outfit, sans-serif', fontSize: '14px', fontWeight: 800,
                color: '#FFFFFF', boxShadow: `0 4px 16px rgba(255,107,157,0.35)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              }}>
              {saving ? <><motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity }}><Loader2 style={{ width: '16px', height: '16px' }} /></motion.div>保存中...</> : '💾 保存更新'}
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── Shared Styles ────────────────────────────────────────────────────────────
const css = {
  bg: '#FFFFFF',
  cardBg: '#FFFFFF',
  border: '#F0F1F8',
  text: '#1A1A2E',
  textSecondary: '#6B7280',
  textMuted: '#A0A8C0',
  accent: '#FF6B9D',
  accentDim: 'rgba(255,107,157,0.1)',
  accentBorder: 'rgba(255,107,157,0.3)',
};

function cardStyle(extra?: React.CSSProperties): React.CSSProperties {
  return {
    background: '#FFFFFF',
    borderRadius: '20px',
    border: '1px solid #F0F1F8',
    boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
    ...(extra || {}),
  };
}

// ─── Components ───────────────────────────────────────────────────────────────
function GlassCard({ children, className = '', style = {} as React.CSSProperties }: {
  children: React.ReactNode; className?: string; style?: React.CSSProperties;
}) {
  return (
    <div className={cn('rounded-[20px]', className)} style={cardStyle(style)}>
      {children}
    </div>
  );
}

function SectionTitle({ children, icon }: { children: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
      {icon && <span style={{ fontSize: '16px' }}>{icon}</span>}
      <h2 style={{
        fontFamily: 'Outfit, sans-serif',
        fontSize: '13px', fontWeight: 700,
        letterSpacing: '0.18em', textTransform: 'uppercase',
        color: css.textMuted,
      }}>
        {children}
      </h2>
      <div style={{ flex: 1, height: '1px', background: `linear-gradient(90deg, #F0F1F8, transparent)` }} />
    </div>
  );
}

function ElementBadge({ el }: { el: string }) {
  const hex = ELEMENT_COLORS[el] || css.accent;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '4px 12px', borderRadius: '9999px',
      fontSize: '13px', fontWeight: 700,
      fontFamily: 'Outfit, sans-serif',
      background: hex + '15', color: hex,
      border: `1px solid ${hex}30`,
    }}>
      {ELEMENT_NAMES[el]}
    </span>
  );
}

function PillarCell({ label, pillar, shiShen, highlight = false }: {
  label: string; pillar: string; shiShen: string; highlight?: boolean;
}) {
  const shiShenColor = SHISHEN_COLORS[shiShen] || css.textMuted;
  return (
    <div style={{
      textAlign: 'center', padding: '20px 12px', borderRadius: '16px',
      background: highlight ? `${css.accent}0A` : '#F8F9FC',
      border: highlight ? `2px solid ${css.accent}40` : '1px solid #F0F1F8',
      transition: 'all 0.2s',
    }}>
      <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '8px', color: css.textMuted }}>{label}</p>
      <p style={{
        fontSize: '28px', fontWeight: 900, marginBottom: '8px',
        color: highlight ? css.accent : css.text,
        fontFamily: 'Outfit, sans-serif',
      }}>{pillar}</p>
      <span style={{
        display: 'inline-block', padding: '3px 10px', borderRadius: '9999px',
        fontSize: '12px', fontWeight: 600,
        background: shiShenColor + '15', color: shiShenColor,
        border: `1px solid ${shiShenColor}30`,
        fontFamily: 'Outfit, sans-serif',
      }}>
        {shiShen}
      </span>
    </div>
  );
}

const SHISHEN_COLORS: Record<string, string> = {
  '比肩': '#00C47A', '劫财': '#00C47A',
  '食神': '#FF6B6B', '伤官': '#FF6B6B',
  '偏财': '#D4A000', '正财': '#D4A000',
  '七杀': '#FF6B6B', '正官': '#00A8E8',
  '偏印': '#00A8E8', '正印': '#00A8E8',
};

// ─── Data Functions ───────────────────────────────────────────────────────────
function getMingGe(monthStem: string, monthBranch: string): { name: string; special: boolean; desc: string; type: string } {
  const descs: Record<string, string> = {
    '正官格': '官星得用，贵气自来。事业上有责任心，适合从政、管理、法律类工作。',
    '七杀格': '果断刚强，魄力惊人。敢于挑战，适合军警、外科医生、企业高管。',
    '正印格': '慈爱善良，学识渊博。心地厚道，适合教育、研究、医护等工作。',
    '偏印格': '思维独特，直觉敏锐。善于独立思考，适合策划、艺术创作类工作。',
    '食神格': '温和仁慈，才华横溢。性格温和，适合艺术、文化、餐饮等工作。',
    '伤官格': '聪明伶俐，创造力强。思维活跃，适合艺术、设计、演艺等创意工作。',
    '正财格': '勤俭持家，财运稳定。为人务实，适合财务、商业等稳定工作。',
    '偏财格': '善于理财，财运起伏。有商业头脑，适合金融、投资、销售、贸易等工作。',
    '比肩格': '独立自信，意志坚定。自我依靠，适合自主创业、专业技术类工作。',
    '劫财格': '敢闯敢拼，行动力强。善于竞争，适合销售、体育、创业等挑战性工作。',
  };
  const geMap: Record<string, string> = {
    '正官': '正官格', '七杀': '七杀格', '正印': '正印格', '偏印': '偏印格',
    '食神': '食神格', '伤官': '伤官格', '正财': '正财格', '偏财': '偏财格',
    '比肩': '比肩格', '劫财': '劫财格',
  };
  const ge = geMap[monthBranch] || '普通格';
  const special = ['正官格', '七杀格', '食神格', '伤官格'].includes(ge);
  const types: Record<string, string> = {
    '正官格': 'lead', '七杀格': 'power', '正印格': 'wisdom', '偏印格': 'mystic',
    '食神格': 'talent', '伤官格': 'creative', '正财格': 'stable', '偏财格': 'adventure',
    '比肩格': 'independent', '劫财格': 'competitive',
  };
  return { name: ge, special, desc: descs[ge] || '命局平稳，运势中和，适合各类工作。', type: types[ge] || 'normal' };
}

interface DayunData { age: number; endAge: number; ganZhi: string; element: string; score: number; year: number; yearEnd: number; favorableElements?: string[]; }
function generateDayunData(userInfo: UserBirthInfo): DayunData[] {
  const bazi = userInfo.baziResult;
  if (!bazi) return [];
  const stems = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
  const branches = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
  const stemEls: Record<string, string> = { '甲': 'wood', '乙': 'wood', '丙': 'fire', '丁': 'fire', '戊': 'earth', '己': 'earth', '庚': 'metal', '辛': 'metal', '壬': 'water', '癸': 'water' };
  const isYangYear = ['甲', '丙', '戊', '庚', '壬'].includes(bazi.yearPillar[0]);
  const isForward = (isYangYear && userInfo.gender === 'male') || (!isYangYear && userInfo.gender === 'female');
  const JIE: Record<number, number> = { 1: 6, 2: 4, 3: 6, 4: 5, 5: 6, 6: 6, 7: 7, 8: 8, 9: 8, 10: 8, 11: 7, 12: 7 };
  const birthDate = new Date(userInfo.birthYear, userInfo.birthMonth - 1, userInfo.birthDay);
  let days = Math.round((new Date(userInfo.birthYear, userInfo.birthMonth - 1, JIE[userInfo.birthMonth]).getTime() - birthDate.getTime()) / 86400000);
  days = Math.abs(days);
  const qiyunAge = Math.floor(days / 3) + (days % 3) * 4 / 12;
  const qiyunYear = new Date(birthDate.getFullYear(), birthDate.getMonth() + Math.floor(qiyunAge * 12), 1).getFullYear();
  const favorable = userInfo.favorableElements || [];
  const baziDmEl = bazi.dayMasterElement;
  const startSi = stems.indexOf(bazi.monthPillar[0]);
  const startBi = branches.indexOf(bazi.monthPillar[1]);
  const data: DayunData[] = [];
  let prevScore = 50;
  for (let i = 0; i < 8; i++) {
    const off = isForward ? i + 1 : -(i + 1);
    const si = (startSi + off + 10) % 10;
    const bi = (startBi + off + 12) % 12;
    const gz = stems[si] + branches[bi];
    const el = stemEls[stems[si]];
    const age = Math.floor(qiyunAge) + i * 10;
    const isFav = favorable.includes(el);
    let base = 50 + (isFav ? 18 : -10) + (el === baziDmEl ? 5 : 0) + (Math.random() - 0.5) * 15;
    base = Math.max(25, Math.min(90, base));
    if (i > 0) base = prevScore + (base - prevScore) * 0.6 + (Math.random() - 0.5) * 10;
    const score = Math.round(Math.max(25, Math.min(90, base)));
    prevScore = score;
    data.push({ age, endAge: age + 9, ganZhi: gz, element: el, score, year: qiyunYear + i * 10, yearEnd: qiyunYear + (i + 1) * 10, favorableElements: favorable });
  }
  return data;
}

function getFortuneAnalysis(style: LanguageStyle, dmEl: string, fav: string[], unfav: string[]) {
  const favN = fav.map(e => ELEMENT_NAMES[e]).join('、');
  const unfavN = unfav.map(e => ELEMENT_NAMES[e]).join('、');
  const dm = ELEMENT_NAMES[dmEl] || '木';
  const content: Record<LanguageStyle, { career: string; family: string; marriage: string; health: string }> = {
    normal: {
      career: `${dm}日主，搭配${favN}，事业上${favN.includes('金') || favN.includes('水') ? '适合金融、科技、流通领域发展。' : favN.includes('木') || favN.includes('火') ? '适合文化、教育、创意领域。' : '适合稳定发展，逐步积累。'}忌${unfavN}过重的行业。`,
      family: `命局${favN.includes('土') ? '显示重视家庭，与家人关系融洽。' : favN.includes('水') ? '情感表达丰富，注意情绪管理。' : '性格独立，需平衡家庭与个人空间。'}`,
      marriage: `${dm}日主的人${favN.includes('火') ? '热情主动，感情丰富。' : favN.includes('水') ? '温柔细腻，需要安全感。' : '稳重踏实，值得信赖。'}`,
      health: `${dm}日主需注意${dmEl === 'wood' ? '肝胆、神经系统。' : dmEl === 'fire' ? '心脏、眼睛。' : dmEl === 'earth' ? '脾胃、消化系统。' : dmEl === 'metal' ? '肺、呼吸系统。' : '肾、泌尿系统。'}保养。`,
    },
    stock: {
      career: `${dm}日走${favN}势，${favN.includes('金') || favN.includes('水') ? '金融、科技板块利好，适合加仓。' : favN.includes('木') || favN.includes('火') ? '文化创意板块值得布局。' : '低估值稳健标的为主。'}注意回避${unfavN}相关板块。`,
      family: `${favN.includes('水') ? '家庭账户需控仓，注意情绪波动影响判断。' : '家庭关系稳定，适合长期持有。'}`,
      marriage: `${dm}日主感情线${favN.includes('火') ? '强势，但需设置止损线（控制情绪）。' : '稳步推进，适合长线经营。'}`,
      health: `健康管理：${dmEl === 'wood' ? '肝胆指标' : dmEl === 'fire' ? '心血管' : dmEl === 'earth' ? '消化系统' : dmEl === 'metal' ? '呼吸系统' : '肾功能'}需定期检查。`,
    },
    game: {
      career: `${dm}属性，${favN}是主力技能！${favN.includes('金') || favN.includes('水') ? '金融科技流，核心输出！' : favN.includes('木') || favN.includes('火') ? '文创天赋流，后期大C！' : '稳健发育流，适合辅助位。'}${unfavN}是debuff，记得绕开！`,
      family: `${favN.includes('水') ? '家庭关系有隐藏支线剧情，建议多花时间解锁。' : '家庭是稳定的增益buff，好好维护。'}`,
      marriage: `${dm}日主桃花运${favN.includes('火') ? '强势Carry，但别上头！' : '稳步发育，适合细水长流。'}`,
      health: `HP值：${dmEl === 'wood' ? '肝/神经系统' : dmEl === 'fire' ? '心脏/眼睛' : dmEl === 'earth' ? '消化系统' : dmEl === 'metal' ? '肺/呼吸' : '肾/泌尿'}需要日常维护，别忘了吃补剂！`,
    },
    fairytale: {
      career: `${dm}小精灵，你的命运花园里${favN}是最珍贵的花朵！${favN.includes('金') || favN.includes('水') ? '金融和知识的泉水在等你发现。' : favN.includes('木') || favN.includes('火') ? '创意和艺术的阳光照耀着你。' : '大地的果实会给你带来稳定的幸福。'}`,
      family: `${dm}小天使，你的家庭是一片小小的魔法森林，${favN.includes('水') ? '记得给情感的小溪留出空间。' : '守护好每一棵树的成长。'}`,
      marriage: `${dm}日主，你的爱情是一颗等待发芽的种子，${favN.includes('火') ? '热烈的阳光会让它绽放。' : '需要耐心地用温柔浇灌。'}`,
      health: `小精灵要好好照顾自己：${dmEl === 'wood' ? '森林之心（肝胆）' : dmEl === 'fire' ? '太阳之眼（心脏）' : dmEl === 'earth' ? '大地之腹（脾胃）' : dmEl === 'metal' ? '天空之肺' : '月亮之泉（肾）'}需要你的关注。`,
    },
    fortune: {
      career: `${dm}日主，贫道夜观天象，你命中${favN}旺盛，${favN.includes('金') || favN.includes('水') ? '金水相生，财源广进，适合商贾金融之路。' : favN.includes('木') || favN.includes('火') ? '木火通明，才华显露，宜文教艺术之途。' : '土气厚重，宜稳扎稳打。'}切记避开${unfavN}之方。`,
      family: `命格显示${dm}日主${favN.includes('土') ? '与长辈缘分深厚，家宅安稳。' : favN.includes('水') ? '情感细腻，需防桃花劫。' : '独立自主，宅运平稳。'}`,
      marriage: `${dm}日主，${favN.includes('火') ? '官星/夫星旺盛，姻缘早至，然需防情深不寿。' : favN.includes('水') ? '正缘在远方，需耐心等待，不可强求。' : '婚姻平稳，正缘需待时机。'}`,
      health: `施主须注意${dmEl === 'wood' ? '肝胆经络，易有郁结之症。' : dmEl === 'fire' ? '心火过旺，宜静心养神。' : dmEl === 'earth' ? '脾胃运化，需饮食有节。' : dmEl === 'metal' ? '肺金较弱，秋冬季宜进补。' : '肾水不足，宜早睡养精。'}`,
    },
    workplace: {
      career: `${dm}日主，${favN}是你的核心竞争优势。${favN.includes('金') || favN.includes('水') ? '适合战略规划、资本运作类岗位。' : favN.includes('木') || favN.includes('火') ? '适合内容创作、品牌运营、市场策划方向。' : '适合行政管理、财务、法务等稳定型岗位。'}${unfavN}属性领域建议战略性回避。`,
      family: `${dm}职场人格需要${favN.includes('水') ? '在家庭中建立清晰的边界感，避免工作情绪入侵家庭。' : '稳定的家庭支持是你职场表现的基石。'}`,
      marriage: `${dm}日主在感情中${favN.includes('火') ? '是主导型选手，注意给伴侣留出成长空间。' : '善于长期经营，稳定的陪伴是你最大的优势。'}`,
      health: `职场高压人群建议：${dmEl === 'wood' ? '肝脏排毒（加班护肝）。' : dmEl === 'fire' ? '心血管健康（少熬夜）。' : dmEl === 'earth' ? '肠胃调理（外卖要少吃）。' : dmEl === 'metal' ? '呼吸系统（空调房多通风）。' : '腰肾保养（不要久坐）。'}`,
    },
  };
  return content[style] || content.normal;
}

// ─── Fortune Card ─────────────────────────────────────────────────────────────
const CARD_ICONS: Record<string, React.ReactNode> = {
  career: <TrendingUp style={{ width: '20px', height: '20px' }} />,
  family: <Users style={{ width: '20px', height: '20px' }} />,
  marriage: <Heart style={{ width: '20px', height: '20px' }} />,
  health: <Activity style={{ width: '20px', height: '20px' }} />,
};
const CARD_COLORS: Record<string, { hex: string; grad: string }> = {
  career: { hex: '#FF9D6B', grad: 'linear-gradient(135deg, rgba(255,157,107,0.1), rgba(255,157,107,0.03))' },
  family: { hex: '#6BD4FF', grad: 'linear-gradient(135deg, rgba(107,212,255,0.1), rgba(107,212,255,0.03))' },
  marriage: { hex: '#FF6B9D', grad: 'linear-gradient(135deg, rgba(255,107,157,0.1), rgba(255,107,157,0.03))' },
  health: { hex: '#00C47A', grad: 'linear-gradient(135deg, rgba(0,196,122,0.1), rgba(0,196,122,0.03))' },
};
const CARD_LABELS: Record<string, string> = {
  career: '事业运势', family: '家庭关系', marriage: '婚姻感情', health: '健康养生',
};

function FortuneCard({ cardKey, label, text, color, icon }: { cardKey: string; label: string; text: string; color: string; icon: React.ReactNode }) {
  return (
    <motion.div whileHover={{ y: -3, scale: 1.01 }} transition={{ type: 'spring', stiffness: 400, damping: 25 }}>
      <div style={{
        padding: '24px',
        borderRadius: '20px',
        background: CARD_COLORS[cardKey]?.grad || PALETTE.coralLight,
        border: `1.5px solid ${(CARD_COLORS[cardKey]?.hex || css.accent) + '25'}`,
        boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '14px' }}>
          <div style={{
            width: '44px', height: '44px', borderRadius: '14px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: (CARD_COLORS[cardKey]?.hex || css.accent) + '18',
            color: CARD_COLORS[cardKey]?.hex || css.accent,
          }}>
            {icon}
          </div>
          <h5 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '16px', fontWeight: 700, color: css.text }}>{label}</h5>
        </div>
        <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '15px', lineHeight: 1.8, color: css.textSecondary }}>{text}</p>
      </div>
    </motion.div>
  );
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
// ─── K线图组件（每十年大运蜡烛） ─────────────────────────────────────────────
interface CandlestickData {
  ganZhi: string;
  element: string;
  age: number;
  endAge: number;
  year: number;
  yearEnd: number;
  open: number;
  close: number;
  high: number;
  low: number;
  score: number;
  favorable: boolean;
  desc: string;
}

function generateCandlestickData(dayunData: DayunData[]): CandlestickData[] {
  return dayunData.map((d, i) => {
    const prev = i > 0 ? dayunData[i - 1].score : d.score;
    const open = Math.min(prev, d.score);
    const close = Math.max(prev, d.score);
    const high = d.score + 5;
    const low = Math.max(25, Math.min(prev, d.score) - 5);
    const favorable = d.score >= 55;
    const elemDesc: Record<string, string> = {
      wood: d.favorableElements?.includes('wood') ? '木气旺盛，创造力强，适合文化创意领域。' : '木气受阻，注意肝胆健康与情绪调节。',
      fire: d.favorableElements?.includes('fire') ? '火气旺盛，行动力强，适合竞争拼搏。' : '火气过旺，注意心脏健康与急躁情绪。',
      earth: d.favorableElements?.includes('earth') ? '土气厚重，财运稳定，适合积累沉淀。' : '土气过重，消化系统需注意。',
      metal: d.favorableElements?.includes('metal') ? '金气清朗，思维清晰，适合金融科技。' : '金气受制，肺与呼吸系统需保养。',
      water: d.favorableElements?.includes('water') ? '水气流通，财运亨通，适合流通贸易。' : '水气不足，肾与泌尿系统需注意。',
    };
    const element = d.element;
    const isUp = d.score >= prev;
    const trend: Record<string, { label: string; icon: string; detail: string }> = {
      career: {
        label: isUp ? '事业上升期 ✦' : '事业调整期 ·',
        icon: '📈',
        detail: isUp
          ? '这十年运势上扬，适合主动出击、拓展事业版图。流年与命局相生，工作中有贵人相助，晋升或创业机会增多。'
          : '运势有所回落，宜稳扎稳打，保守经营。避免激进决策，注重积累内功，守成为主。',
      },
      health: {
        label: isUp ? '健康良好 ✦' : '健康需注意 ·',
        icon: '💪',
        detail: isUp
          ? '身体状态良好，精力充沛，抵抗力强。可趁此机会加强锻炼，建立健康生活习惯。'
          : '身体抵抗力有所下降，注意作息规律，避免过度劳累。尤其是' + ELEMENT_NAMES[element] + '属性对应的脏腑需重点保养。',
      },
      wealth: {
        label: isUp ? '财运上升 ✦' : '财运调整 ·',
        icon: '💰',
        detail: isUp
          ? '财运亨通，投资理财多有斩获。但也需注意理财风险，稳健为主，避免投机取巧。'
          : '财务上有些压力，支出增多或收入波动。宜节约开支，量入为出，不宜做大额投资。',
      },
      relationships: {
        label: isUp ? '人际关系活跃 ✦' : '人际关系平淡 ·',
        icon: '🤝',
        detail: isUp
          ? '人脉活跃，社交运强，容易结识志同道合的朋友或合作伙伴，贵人运明显。'
          : '社交圈相对稳定，不必刻意拓展人脉，专注于自我提升，沉淀期也是积累期。',
      },
    };

    const careerTrend = trend.career;
    const healthTrend = trend.health;
    const wealthTrend = trend.wealth;
    const relTrend = trend.relationships;

    const desc = `${ELEMENT_NAMES[element]}运主导期。${careerTrend.label}，${healthTrend.label}。${wealthTrend.detail} ${relTrend.detail}`;

    return { ...d, open, close, high, low, favorable, desc };
  });
}

function CandlestickChart({ data }: { data: CandlestickData[] }) {
  const [hovered, setHovered] = useState<number | null>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; data: CandlestickData } | null>(null);

  const width = 100;  // 每个蜡烛宽度
  const gap = 28;       // 蜡烛间距
  const chartHeight = 220;
  const paddingTop = 24;
  const paddingBottom = 40;
  const minScore = 20;
  const maxScore = 100;
  const scale = (v: number) =>
    paddingTop + ((maxScore - v) / (maxScore - minScore)) * (chartHeight - paddingTop - paddingBottom);

  const totalWidth = data.length * width + (data.length - 1) * gap + 40;
  const svgHeight = chartHeight;

  // 50分基准线Y
  const midY = scale(50);

  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      <svg
        width={totalWidth}
        height={svgHeight}
        style={{ display: 'block', minWidth: totalWidth }}
        onMouseLeave={() => { setHovered(null); setTooltip(null); }}
      >
        {/* 网格线 */}
        {[30, 50, 70, 90].map(v => (
          <g key={v}>
            <line
              x1={20} y1={scale(v)} x2={totalWidth - 20} y2={scale(v)}
              stroke={v === 50 ? '#F59E0B' : '#F0F1F8'}
              strokeWidth={v === 50 ? 1.5 : 1}
              strokeDasharray={v === 50 ? '4 4' : 'none'}
            />
            <text x={totalWidth - 14} y={scale(v) + 4} textAnchor="end"
              style={{ fontFamily: 'Outfit, sans-serif', fontSize: 11, fill: v === 50 ? '#F59E0B' : css.textMuted, fontWeight: v === 50 ? 700 : 400 }}>
              {v}
            </text>
          </g>
        ))}

        {/* 蜡烛 */}
        {data.map((d, i) => {
          const x = 20 + i * (width + gap);
          const cx = x + width / 2;
          const bodyTop = scale(Math.max(d.open, d.close));
          const bodyBottom = scale(Math.min(d.open, d.close));
          const bodyH = Math.max(bodyBottom - bodyTop, 4);
          const wickTop = scale(d.high);
          const wickBottom = scale(d.low);
          const isUp = d.close >= d.open;
          const isHovered = hovered === i;
          const color = d.favorable ? (isUp ? '#00C47A' : '#FF9D6B') : (isUp ? '#00A8E8' : '#FF6B6B');

          return (
            <g key={d.ganZhi} onMouseEnter={() => { setHovered(i); setTooltip({ x: cx, y: scale(d.score), data: d }); }} style={{ cursor: 'pointer' }}>
              {/* 影线（上引线+下引线） */}
              <line x1={cx} y1={wickTop} x2={cx} y2={bodyTop} stroke={color} strokeWidth={1.5} opacity={0.8} />
              <line x1={cx} y1={bodyBottom} x2={cx} y2={wickBottom} stroke={color} strokeWidth={1.5} opacity={0.8} />
              {/* 蜡烛体 */}
              <rect
                x={x + 2} y={bodyTop} width={width - 4} height={bodyH}
                fill={isUp ? color : color} fillOpacity={isUp ? 1 : 0.85}
                stroke={color} strokeWidth={isHovered ? 2 : 1.5}
                rx={3}
                filter={isHovered ? `drop-shadow(0 0 6px ${color}60)` : undefined}
              />
              {/* 十字线（hover时） */}
              {isHovered && (
                <>
                  <line x1={cx} y1={paddingTop} x2={cx} y2={chartHeight - paddingBottom} stroke={color} strokeWidth={1} strokeDasharray="3 3" opacity={0.4} />
                  <line x1={20} y1={scale(d.score)} x2={totalWidth - 20} y2={scale(d.score)} stroke={color} strokeWidth={1} strokeDasharray="3 3" opacity={0.4} />
                </>
              )}
              {/* 标签 */}
              <text x={cx} y={chartHeight - 8} textAnchor="middle"
                style={{ fontFamily: 'Outfit, sans-serif', fontSize: 13, fontWeight: 700, fill: isHovered ? color : css.textMuted }}>
                {d.ganZhi}
              </text>
            </g>
          );
        })}

        {/* Tooltip（SVG内浮层） */}
        {tooltip && (() => {
          const t = tooltip;
          const tx = t.x > totalWidth / 2 ? t.x - 160 : t.x + 16;
          const ty = Math.max(10, t.y - 60);
          return (
            <foreignObject x={tx} y={ty} width={160} height={180} style={{ overflow: 'visible' }}>
              <div style={{
                background: '#FFFFFF', border: `1.5px solid ${t.data.favorable ? '#00C47A30' : '#FF6B6B30'}`,
                borderRadius: 12, padding: '12px 14px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
                fontFamily: 'Outfit, sans-serif', fontSize: 13, lineHeight: 1.6,
              }}>
                <p style={{ fontWeight: 700, marginBottom: 4, color: css.text }}>{t.data.ganZhi}</p>
                <p style={{ color: css.textMuted, fontSize: 12, marginBottom: 6 }}>{t.data.year}–{t.data.yearEnd}年 · {t.data.age}–{t.data.endAge}岁</p>
                <p style={{ fontWeight: 800, fontSize: 20, color: t.data.favorable ? '#00C47A' : '#FF6B6B' }}>{t.data.score}分</p>
                <p style={{ fontSize: 12, color: css.textSecondary, marginTop: 4 }}>开:{t.data.open} 收:{t.data.close}</p>
              </div>
            </foreignObject>
          );
        })()}
      </svg>

      {/* 底部图例 */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '8px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: 12, height: 12, background: '#00C47A', borderRadius: 2 }} />
          <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: 12, color: css.textMuted }}>吉运</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: 12, height: 12, background: '#FF6B6B', borderRadius: 2 }} />
          <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: 12, color: css.textMuted }}>平/逆</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: 12, height: 1, background: '#F59E0B' }} />
          <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: 12, color: css.textMuted }}>50分基准</span>
        </div>
      </div>
    </div>
  );
}

// 十年详细运势卡片
function DecadeCard({ data, index }: { data: CandlestickData; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const isUp = data.close >= data.open;
  const color = data.favorable ? '#00C47A' : '#FF6B6B';
  const lightBg = data.favorable ? 'rgba(0,196,122,0.06)' : 'rgba(255,107,107,0.06)';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, duration: 0.4 }}
      style={{
        borderRadius: '16px',
        border: `1.5px solid ${isUp ? color + '40' : '#F0F1F8'}`,
        background: expanded ? lightBg : '#FFFFFF',
        boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
        overflow: 'hidden',
        transition: 'all 0.25s ease',
      }}
    >
      {/* 卡片头部 */}
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          width: '100%', padding: '16px 20px',
          display: 'flex', alignItems: 'center', gap: '14px',
          background: 'none', border: 'none', cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        {/* K线迷你图 */}
        <div style={{ width: '36px', height: '48px', flexShrink: 0, position: 'relative' }}>
          <svg width="36" height="48" style={{ display: 'block' }}>
            {(() => {
              const bw = 12, bx = 12, bt = Math.max(scaleY(data.open, 48), scaleY(data.close, 48)), bh = Math.max(Math.abs(scaleY(data.open, 48) - scaleY(data.close, 48)), 2), by = scaleY(data.close, 48);
              const wickX = bx + bw / 2;
              return <>
                <line x1={wickX} y1={scaleY(data.high, 48)} x2={wickX} y2={bt} stroke={color} strokeWidth={1.5} />
                <line x1={wickX} y1={by + bh} x2={wickX} y2={scaleY(data.low, 48)} stroke={color} strokeWidth={1.5} />
                <rect x={bx} y={by} width={bw} height={bh} fill={color} fillOpacity={isUp ? 1 : 0.8} stroke={color} strokeWidth={1} rx={2} />
              </>;
            })()}
          </svg>
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '16px', fontWeight: 800, color: css.text }}>{data.ganZhi}</span>
            <span style={{
              padding: '2px 8px', borderRadius: '9999px',
              fontSize: '11px', fontWeight: 700,
              background: ELEMENT_COLORS[data.element] + '18',
              color: ELEMENT_COLORS[data.element],
              border: `1px solid ${ELEMENT_COLORS[data.element]}30`,
              fontFamily: 'Outfit, sans-serif',
            }}>
              {ELEMENT_NAMES[data.element]}
            </span>
          </div>
          <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '13px', color: css.textMuted }}>
            {data.year}–{data.yearEnd}年 · {data.age}–{data.endAge}岁
          </span>
        </div>

        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <span style={{
            fontFamily: 'Outfit, sans-serif', fontSize: '22px', fontWeight: 900,
            color, display: 'block',
          }}>
            {data.score}
          </span>
          <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '12px', color: css.textMuted }}>分</span>
        </div>

        <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}
          style={{ color: css.textMuted, fontSize: '16px', flexShrink: 0 }}>
          ▼
        </motion.div>
      </button>

      {/* 展开详情 */}
      <motion.div
        initial={false}
        animate={{ height: expanded ? 'auto' : 0, opacity: expanded ? 1 : 0 }}
        transition={{ duration: 0.25, ease: 'easeInOut' }}
        style={{ overflow: 'hidden' }}
      >
        <div style={{ padding: '0 20px 18px', borderTop: `1px solid ${isUp ? color + '20' : '#F0F1F8'}`, paddingTop: '14px' }}>
          {/* 摘要标签 */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
            <span style={{
              padding: '5px 12px', borderRadius: '9999px', fontSize: '13px', fontWeight: 600,
              background: color + '18', color, border: `1px solid ${color}30`,
              fontFamily: 'Outfit, sans-serif',
            }}>
              {isUp ? '✦ 上升期' : '· 调整期'}
            </span>
            <span style={{
              padding: '5px 12px', borderRadius: '9999px', fontSize: '13px', fontWeight: 600,
              background: '#F0F1F8', color: css.textMuted, border: '1px solid #E8EAF0',
              fontFamily: 'Outfit, sans-serif',
            }}>
              {data.close >= data.open ? `↑ ${Math.abs(data.close - data.open)}分` : `↓ ${Math.abs(data.close - data.open)}分`}
            </span>
          </div>

          {/* 五行说明 */}
          <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '15px', lineHeight: 1.8, color: css.textSecondary, marginBottom: '14px' }}>
            {data.desc}
          </p>

          {/* 四维详细 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {[
              { icon: '📈', label: '事业', text: isUp ? '上升期，适合主动出击，晋升或创业机会增多。' : '调整期，宜稳扎稳打，避免激进决策。', color: '#FF9D6B' },
              { icon: '💰', label: '财运', text: isUp ? '财运转好，投资理财多有斩获。' : '财务承压，量入为出，不宜大额投资。', color: '#D4A000' },
              { icon: '💪', label: '健康', text: isUp ? '精力充沛，抵抗力强，可加强锻炼。' : `注意${ELEMENT_NAMES[data.element]}属性对应脏腑保养。`, color: '#00C47A' },
              { icon: '🤝', label: '人际', text: isUp ? '贵人运强，社交活跃，利合作拓展。' : '关系稳定，沉淀积累，专注自我提升。', color: '#6BD4FF' },
            ].map(item => (
              <div key={item.label} style={{
                padding: '10px 12px', borderRadius: '12px',
                background: '#F8F9FC',
                border: '1px solid #F0F1F8',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '5px' }}>
                  <span style={{ fontSize: '13px' }}>{item.icon}</span>
                  <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '13px', fontWeight: 700, color: css.text }}>{item.label}</span>
                </div>
                <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '13px', lineHeight: 1.6, color: css.textSecondary }}>{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function scaleY(v: number, h: number) {
  const min = 20, max = 100;
  return 6 + ((max - v) / (max - min)) * (h - 14);
}

// ─── Custom X Axis Tick for Five Elements ─────────────────────────────────────
function FiveElementXAxisTick({ x, y, payload }: any) {
  const elMap: Record<string, string> = { '木': 'wood', '火': 'fire', '土': 'earth', '金': 'metal', '水': 'water' };
  const color = ELEMENT_COLORS[elMap[payload.value] || ''] || css.textSecondary;
  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={0} y={0} dy={14}
        textAnchor="middle"
        style={{ fontFamily: 'Outfit, sans-serif', fontSize: 15, fontWeight: 700, fill: color }}
      >
        {payload.value}
      </text>
    </g>
  );
}

// ─── Custom Tooltip ────────────────────────────────────────────────────────────
function FiveElementTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const pct = payload[0]?.payload?.pct || 0;
  const elMap: Record<string, string> = { '木': 'wood', '火': 'fire', '土': 'earth', '金': 'metal', '水': 'water' };
  const color = ELEMENT_COLORS[elMap[label] || ''] || css.text;
  return (
    <div style={{ background: '#FFFFFF', border: '1px solid #F0F1F8', borderRadius: 12, padding: '10px 16px', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }}>
      <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '15px', fontWeight: 700, color, marginBottom: '4px' }}>{label}</p>
      <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '13px', color: css.textSecondary }}>{pct}%</p>
    </div>
  );
}

function DayunTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;
  const color = ELEMENT_COLORS[d.element] || css.accent;
  const score = d.score;
  return (
    <div style={{ background: '#FFFFFF', border: '1px solid #F0F1F8', borderRadius: 12, padding: '10px 16px', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }}>
      <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '15px', fontWeight: 700, color: css.text, marginBottom: '4px' }}>{d.ganZhi}</p>
      <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '13px', color: css.textSecondary, lineHeight: 1.6 }}>
        年份: {d.year}–{d.yearEnd}<br />
        年龄: {d.age}–{d.endAge}岁
      </p>
      <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '14px', fontWeight: 700, color, marginTop: '6px' }}>运势: {score}分</p>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ResultPage() {
  const { userId } = useParams<{ userId: string }>();
  const [userInfo, setUserInfo] = useState<UserBirthInfo | null>(null);
  const [analysis, setAnalysis] = useState<FiveElementsAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [style, setStyle] = useState<LanguageStyle>('normal');
  const [showEdit, setShowEdit] = useState(false);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    Promise.all([
      fetch(`/api/users/${USER_ID}/birth-info/${userId}`).then(r => r.json()),
      fetch(`/api/users/${USER_ID}/five-elements-analysis?recordId=${userId}`).then(r => r.json()),
    ]).then(([info, ana]) => {
      if (!info.error) { setUserInfo(info); setStyle(info.languageStyle || 'normal'); }
      if (!ana.error) setAnalysis(ana);
    }).catch(console.error).finally(() => setLoading(false));
  }, [userId]);

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 20px', gap: '16px' }}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        style={{
          width: '64px', height: '64px', borderRadius: '20px',
          background: `linear-gradient(135deg, ${css.accent}, ${PALETTE.orange})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '32px', fontWeight: 900,
          boxShadow: '0 8px 32px rgba(255,107,157,0.3)',
        }}>
        ☯
      </motion.div>
      <motion.p
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.5, repeat: Infinity }}
        style={{ fontFamily: 'Outfit, sans-serif', fontSize: '15px', color: css.textMuted }}>
        八字解读中...
      </motion.p>
    </div>
  );

  if (!userInfo || !userInfo.baziResult) return (
    <div style={{ ...cardStyle({ padding: '48px' }), textAlign: 'center' }}>
      <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔮</div>
      <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '18px', fontWeight: 700, color: css.text, marginBottom: '12px' }}>请先填写生辰信息</p>
      <Link to="/" style={{ fontFamily: 'Outfit, sans-serif', fontSize: '14px', color: css.accent, textDecoration: 'none', fontWeight: 600 }}>返回首页 →</Link>
    </div>
  );

  const bazi = userInfo.baziResult;
  const fiveEls: Record<string, number> = userInfo.fiveElements || { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 };
  const fiveElKeys = ['wood', 'fire', 'earth', 'metal', 'water'] as const;
  const total = Object.values(fiveEls).reduce((a: number, b: number) => a + b, 0);
  const chartData = fiveElKeys.map((el: string) => ({
    name: ELEMENT_NAMES[el], count: fiveEls[el],
    pct: Math.round((fiveEls[el] / total) * 100),
    color: ELEMENT_COLORS[el],
  }));
  const mingGe = getMingGe(bazi.shiShen.monthStem, bazi.shiShen.monthBranch);
  const dayunData = generateDayunData(userInfo);
  const fortune = getFortuneAnalysis(style, bazi.dayMasterElement, userInfo.favorableElements || [], userInfo.unfavorableElements || []);
  const fortuneCards = [
    { cardKey: 'career', label: CARD_LABELS.career, color: CARD_COLORS.career.hex, text: fortune.career, icon: CARD_ICONS.career },
    { cardKey: 'family', label: CARD_LABELS.family, color: CARD_COLORS.family.hex, text: fortune.family, icon: CARD_ICONS.family },
    { cardKey: 'marriage', label: CARD_LABELS.marriage, color: CARD_COLORS.marriage.hex, text: fortune.marriage, icon: CARD_ICONS.marriage },
    { cardKey: 'health', label: CARD_LABELS.health, color: CARD_COLORS.health.hex, text: fortune.health, icon: CARD_ICONS.health },
  ];

  const fadeUp = (delay: number) => ({ initial: { opacity: 0, y: 24 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.5, delay, ease: [0.25, 0.46, 0.45, 0.94] as any } });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', paddingBottom: '48px' }}>

      {/* ── Header ── */}
      <motion.div {...fadeUp(0)} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Link to="/" style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '10px 20px', borderRadius: '16px',
          fontFamily: 'Outfit, sans-serif', fontSize: '14px', fontWeight: 600,
          background: '#FFFFFF', color: css.textSecondary,
          border: '1.5px solid #F0F1F8',
          textDecoration: 'none',
          transition: 'all 0.2s ease',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        }}>
          <ArrowLeft style={{ width: '16px', height: '16px' }} /> 返回
        </Link>
        <div style={{ flex: 1 }} />
        <div style={{ ...cardStyle(), padding: '14px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '44px', height: '44px', borderRadius: '14px',
              background: `linear-gradient(135deg, ${css.accent}, ${PALETTE.orange})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '22px', fontWeight: 900,
              boxShadow: '0 4px 16px rgba(255,107,157,0.3)',
            }}>
              ☯
            </div>
            <div>
              <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '17px', fontWeight: 700, color: css.text }}>{userInfo.name}</p>
              <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '13px', color: css.textMuted, marginTop: '3px' }}>
                {userInfo.birthYear}.{String(userInfo.birthMonth).padStart(2,'0')}.{String(userInfo.birthDay).padStart(2,'0')} · {userInfo.birthHour}:00 · {userInfo.gender === 'male' ? '男' : '女'}
              </p>
            </div>
            <motion.button
              onClick={() => setShowEdit(true)}
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              style={{
                padding: '8px 14px', borderRadius: '12px',
                background: `${css.accent}12`, border: `1px solid ${css.accent}30`,
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
                fontFamily: 'Outfit, sans-serif', fontSize: '13px', fontWeight: 700,
                color: css.accent,
              }}>
              <Edit2 style={{ width: '14px', height: '14px' }} /> 编辑
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* ── 每日运势面板 ── */}
      {(() => {
        if (!userInfo.baziResult) return null;
        const bazi = userInfo.baziResult;
        const fiveEls = userInfo.fiveElements || { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 };
        const daily = deriveDailyFortune(userInfo, bazi, fiveEls);
        const fourDims = [
          { ...daily.career, icon: '📈', label: '事业', desc: daily.career.desc },
          { ...daily.wealth, icon: '💰', label: '财运', desc: daily.wealth.desc },
          { ...daily.love, icon: '💕', label: '感情', desc: daily.love.desc },
          { ...daily.health, icon: '💪', label: '健康', desc: daily.health.desc },
        ];

        return (
          <motion.div {...fadeUp(0.05)}>
            <SectionTitle icon={<Sparkles style={{ width: '16px', height: '16px', color: css.accent }} />}>今日运势</SectionTitle>
            <GlassCard style={{ padding: '24px' }}>
              {/* 顶部：总分 + 四维 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '20px', flexWrap: 'wrap' }}>
                {/* 环形总评分 */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                  <ScoreRing score={daily.total} label="总分" color={daily.totalColor} size={100} />
                  <span style={{
                    fontFamily: 'Outfit, sans-serif', fontSize: '13px', fontWeight: 800,
                    color: daily.totalColor,
                    background: daily.totalColor + '15',
                    padding: '2px 10px', borderRadius: '9999px',
                  }}>
                    {daily.totalLabel}
                  </span>
                </div>

                {/* 四维详情 */}
                <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', minWidth: '200px' }}>
                  {fourDims.map(d => (
                    <div key={d.label} style={{
                      padding: '12px 14px', borderRadius: '14px',
                      background: d.color + '0E',
                      border: `1px solid ${d.color}25`,
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                        <span style={{ fontSize: '14px' }}>{d.icon}</span>
                        <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '13px', fontWeight: 700, color: css.text }}>{d.label}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '4px' }}>
                        <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '20px', fontWeight: 900, color: d.color }}>{d.score}</span>
                        <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '12px', color: d.color, fontWeight: 600 }}>{d.label}</span>
                      </div>
                      <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '12px', lineHeight: 1.5, color: css.textSecondary }}>{d.desc.slice(0, 32)}…
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 中部：幸运色 + 幸运数字 */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '10px', marginBottom: '16px' }}>
                {/* 幸运色 */}
                <div style={{
                  padding: '14px', borderRadius: '14px',
                  background: daily.luckyColor.hex + '14',
                  border: `1.5px solid ${daily.luckyColor.hex}30`,
                  textAlign: 'center',
                }}>
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '8px', margin: '0 auto 8px',
                    background: daily.luckyColor.hex,
                    boxShadow: `0 4px 12px ${daily.luckyColor.hex}50`,
                  }} />
                  <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '12px', fontWeight: 700, color: css.text, marginBottom: '2px' }}>幸运色</p>
                  <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '14px', fontWeight: 800, color: daily.luckyColor.hex }}>{daily.luckyColor.name}</p>
                </div>

                {/* 幸运数字 */}
                <div style={{
                  padding: '14px', borderRadius: '14px',
                  background: `${css.accent}0E`,
                  border: `1.5px solid ${css.accent}25`,
                  textAlign: 'center',
                }}>
                  <div style={{
                    fontSize: '28px', fontWeight: 900, marginBottom: '4px',
                    background: `linear-gradient(135deg, ${css.accent}, ${PALETTE.orange})`,
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                    fontFamily: 'Outfit, sans-serif',
                  }}>{daily.luckyNumber.num}</div>
                  <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '12px', fontWeight: 700, color: css.text }}>幸运数字</p>
                </div>

                {/* 吉时 */}
                <div style={{
                  padding: '14px', borderRadius: '14px',
                  background: '#00C47A14',
                  border: '1.5px solid #00C47A25',
                  textAlign: 'center',
                }}>
                  <div style={{ fontSize: '18px', marginBottom: '4px' }}>🕐</div>
                  <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '12px', fontWeight: 700, color: css.text, marginBottom: '2px' }}>吉时</p>
                  <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '13px', fontWeight: 800, color: '#00C47A' }}>{daily.luckyTime.split('·')[0].trim()}</p>
                </div>

                {/* 吉祥方位 */}
                <div style={{
                  padding: '14px', borderRadius: '14px',
                  background: `${css.accent}0E`,
                  border: `1.5px solid ${css.accent}25`,
                  textAlign: 'center',
                }}>
                  <div style={{ fontSize: '18px', marginBottom: '4px' }}>🧭</div>
                  <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '12px', fontWeight: 700, color: css.text, marginBottom: '2px' }}>吉祥方位</p>
                  <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '13px', fontWeight: 800, color: css.accent }}>{daily.luckyDirection.split('·')[0].trim()}</p>
                </div>
              </div>

              {/* 底部吉凶提示 */}
              <div style={{
                padding: '12px 16px', borderRadius: '14px',
                background: `${daily.totalColor}12`,
                border: `1px solid ${daily.totalColor}25`,
                display: 'flex', alignItems: 'center', gap: '10px',
              }}>
                <span style={{ fontSize: '18px' }}>{daily.total >= 70 ? '✨' : daily.total >= 45 ? '🌤️' : '⛅'}</span>
                <div style={{ flex: 1 }}>
                  <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '14px', fontWeight: 700, color: css.text }}>{daily.totalLabel}日提示</p>
                  <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '13px', color: css.textSecondary, lineHeight: 1.6, marginTop: '2px' }}>{daily.tips[0]}</p>
                </div>
                <div style={{
                  padding: '4px 10px', borderRadius: '9999px',
                  background: `${daily.totalColor}20`, color: daily.totalColor,
                  fontFamily: 'Outfit, sans-serif', fontSize: '12px', fontWeight: 800,
                  flexShrink: 0,
                }}>
                  {daily.totalLabel}
                </div>
              </div>
            </GlassCard>
          </motion.div>
        );
      })()}

      {/* 编辑弹窗 */}
      {showEdit && userInfo && (
        <EditUserModal
          userInfo={userInfo}
          onSave={(updated) => {
            setUserInfo(updated);
            setStyle(updated.languageStyle || 'normal');
          }}
          onClose={() => setShowEdit(false)}
        />
      )}

      {/* ── 四柱八字 ── */}
      <motion.div {...fadeUp(0.05)}>
        <SectionTitle icon={<span style={{ color: css.accent, fontSize: '16px' }}>☯</span>}>四柱八字</SectionTitle>
        <GlassCard style={{ padding: '28px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
            <PillarCell label="年柱" pillar={bazi.yearPillar} shiShen={bazi.shiShen.yearStem} />
            <PillarCell label="月柱" pillar={bazi.monthPillar} shiShen={bazi.shiShen.monthStem} />
            <PillarCell label="日柱" pillar={bazi.dayPillar} shiShen={bazi.dayMaster} highlight />
            <PillarCell label="时柱" pillar={bazi.hourPillar} shiShen={bazi.shiShen.hourStem} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '14px', paddingTop: '16px', borderTop: '1px solid #F0F1F8' }}>
            <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '15px', color: css.textMuted }}>日主</span>
            <span style={{ fontSize: '28px', fontWeight: 900, color: css.accent, fontFamily: 'Outfit, sans-serif' }}>{bazi.dayMaster}</span>
            <ElementBadge el={bazi.dayMasterElement} />
          </div>
        </GlassCard>
      </motion.div>

      {/* ── 解读风格 ── */}
      <motion.div {...fadeUp(0.1)}>
        <SectionTitle icon={<Sparkles style={{ width: '16px', height: '16px', color: css.accent }} />}>解读风格</SectionTitle>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {(Object.keys(styleLabels) as LanguageStyle[]).map(s => (
            <motion.button key={s} onClick={() => setStyle(s)} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
              style={{
                padding: '10px 20px', borderRadius: '14px',
                fontFamily: 'Outfit, sans-serif', fontSize: '14px', fontWeight: 600,
                cursor: 'pointer', transition: 'all 0.2s',
                background: style === s ? `linear-gradient(135deg, ${css.accent}, ${PALETTE.orange})` : '#FFFFFF',
                color: style === s ? '#FFFFFF' : css.textMuted,
                boxShadow: style === s ? `0 4px 16px rgba(255,107,157,0.3)` : '0 2px 8px rgba(0,0,0,0.05)',
                border: 'none',
              }}>
              {styleLabels[s]}
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* ── 命格 ── */}
      <motion.div {...fadeUp(0.15)}>
        <GlassCard style={{
          padding: '28px',
          background: mingGe.special
            ? `linear-gradient(135deg, ${css.accent}08 0%, #FFFFFF 60%)`
            : '#FFFFFF',
          border: mingGe.special ? `1.5px solid ${css.accent}30` : '1px solid #F0F1F8',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <motion.div
              whileHover={{ rotate: 6, scale: 1.05 }}
              transition={{ type: 'spring', stiffness: 300 }}
              style={{
                width: '72px', height: '72px', borderRadius: '20px',
                flexShrink: 0,
                background: `linear-gradient(135deg, ${css.accent}, ${PALETTE.orange})`,
                color: '#FFFFFF',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '36px', fontWeight: 900,
                boxShadow: '0 8px 32px rgba(255,107,157,0.3)',
                fontFamily: 'Outfit, sans-serif',
              }}>
              {mingGe.name.charAt(0)}
            </motion.div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '22px', fontWeight: 800, color: css.text }}>{mingGe.name}</h3>
                {mingGe.special && (
                  <span style={{
                    padding: '4px 12px', borderRadius: '9999px',
                    fontSize: '11px', fontWeight: 700,
                    background: `${css.accent}15`, color: css.accent,
                    border: `1px solid ${css.accent}30`,
                    fontFamily: 'Outfit, sans-serif', letterSpacing: '0.05em',
                  }}>
                    ✦ 特殊格局
                  </span>
                )}
              </div>
              <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '16px', lineHeight: 1.8, color: css.textSecondary }}>{mingGe.desc}</p>
            </div>
          </div>
        </GlassCard>
      </motion.div>

      {/* ── 四维运势 ── */}
      <motion.div {...fadeUp(0.2)}>
        <SectionTitle icon={<TrendingUp style={{ width: '16px', height: '16px', color: css.accent }} />}>四维运势分析</SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
          {fortuneCards.map(card => <FortuneCard key={card.cardKey} cardKey={card.cardKey} label={card.label} text={card.text} color={card.color} icon={card.icon} />)}
        </div>
      </motion.div>

      {/* ── 五行分布 ── */}
      <motion.div {...fadeUp(0.25)}>
        <SectionTitle icon={<span style={{ fontSize: '16px', color: css.accent }}>⚖</span>}>五行分布</SectionTitle>
        <GlassCard style={{ padding: '28px' }}>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
              <XAxis dataKey="name" tick={<FiveElementXAxisTick />} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: css.textMuted, fontFamily: 'Outfit, sans-serif' }} axisLine={false} tickLine={false} />
              <Tooltip content={<FiveElementTooltip />} cursor={{ fill: 'rgba(0,0,0,0.03)', radius: 8 }} />
              <Bar dataKey="count" radius={[10, 10, 0, 0]} label={{ position: 'top', fontSize: 13, fill: css.textMuted, fontFamily: 'Outfit, sans-serif' }}>
                {chartData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          {/* 五行图例 */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '16px', flexWrap: 'wrap' }}>
            {chartData.map(el => (
              <div key={el.name} style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '8px 16px', borderRadius: '9999px',
                background: el.color + '12',
                border: `1.5px solid ${el.color}30`,
              }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: el.color }} />
                <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '14px', fontWeight: 700, color: el.color }}>{el.name}</span>
                <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '13px', color: css.textMuted }}>{el.count}个</span>
              </div>
            ))}
          </div>
        </GlassCard>
      </motion.div>

      {/* ── 五行分析 ── */}
      {analysis && (
        <motion.div {...fadeUp(0.3)}>
          <SectionTitle icon={<span style={{ color: css.accent, fontSize: '16px' }}>✦</span>}>五行分析</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
            <GlassCard style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '15px', fontWeight: 700, color: css.accent }}>得令状态</span>
              </div>
              <p style={{ fontSize: '24px', fontWeight: 800, marginBottom: '8px', color: css.text, fontFamily: 'Outfit, sans-serif' }}>
                {analysis.bodyStrengthAnalysis?.bodyStrengthText || mingGe.name}
              </p>
              {analysis.bodyStrengthAnalysis?.totalScore != null && (
                <div style={{ marginTop: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px', marginBottom: '8px' }}>
                    <span style={{ fontFamily: 'Outfit, sans-serif', color: css.textMuted }}>身强弱评分</span>
                    <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, color: css.accent }}>{analysis.bodyStrengthAnalysis.totalScore}分</span>
                  </div>
                  <div style={{ height: '8px', borderRadius: '9999px', background: '#F0F1F8', overflow: 'hidden' }}>
                    <motion.div
                      style={{
                        height: '100%', borderRadius: '9999px',
                        background: `linear-gradient(90deg, ${css.accent}, ${PALETTE.orange})`,
                      }}
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, (analysis.bodyStrengthAnalysis?.totalScore || 0))}%` }}
                      transition={{ duration: 1, delay: 0.5, ease: 'easeOut' }}
                    />
                  </div>
                </div>
              )}
            </GlassCard>

            <GlassCard style={{ padding: '24px' }}>
              <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '15px', fontWeight: 700, color: css.accent, marginBottom: '14px' }}>用神策略</p>
              {analysis.favorableAnalysis?.favorable?.map((el: string) => (
                <div key={el} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '12px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '16px', fontWeight: 900,
                    background: ELEMENT_COLORS[el] + '18', color: ELEMENT_COLORS[el],
                    fontFamily: 'Outfit, sans-serif',
                  }}>
                    {ELEMENT_NAMES[el]}
                  </div>
                  <div>
                    <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '14px', fontWeight: 700, color: ELEMENT_COLORS[el] }}>喜用神</p>
                    <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '13px', color: css.textMuted }}>增强运势，事业发展</p>
                  </div>
                </div>
              ))}
              {analysis.favorableAnalysis?.unfavorable?.map((el: string) => (
                <div key={el} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px', opacity: 0.6 }}>
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '12px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '14px', fontWeight: 700,
                    background: '#F0F1F8', color: css.textMuted,
                    fontFamily: 'Outfit, sans-serif',
                  }}>
                    ✕
                  </div>
                  <div>
                    <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '14px', fontWeight: 700, color: css.textMuted }}>忌神 · {ELEMENT_NAMES[el]}</p>
                    <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '13px', color: css.textMuted }}>适度避开，减少消耗</p>
                  </div>
                </div>
              ))}
            </GlassCard>
          </div>
        </motion.div>
      )}

      {/* ── 人生大运 K线图 ── */}
      {dayunData.length > 0 && (() => {
        const candlestickData = generateCandlestickData(dayunData);
        return (
          <motion.div {...fadeUp(0.35)}>
            <SectionTitle icon={<TrendingUp style={{ width: '16px', height: '16px', color: css.accent }} />}>人生大运 K线图</SectionTitle>
            <GlassCard style={{ padding: '28px 24px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
                <span style={{
                  padding: '4px 12px', borderRadius: '9999px',
                  fontSize: '12px', fontWeight: 700,
                  background: 'rgba(245,158,11,0.1)', color: '#F59E0B',
                  border: '1px solid rgba(245,158,11,0.3)',
                  fontFamily: 'Outfit, sans-serif',
                }}>
                  📊 模拟数据 · 仅供参考
                </span>
                <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '13px', color: css.textMuted }}>
                  共 {candlestickData.length} 个十年大运周期
                </span>
              </div>
              <CandlestickChart data={candlestickData} />
            </GlassCard>

            {/* 每十年详细运势 */}
            <div style={{ marginTop: '20px' }}>
              <SectionTitle icon={<Sparkles style={{ width: '16px', height: '16px', color: css.accent }} />}>十年详细运势</SectionTitle>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {candlestickData.map((d, i) => (
                  <DecadeCard key={d.ganZhi} data={d} index={i} />
                ))}
              </div>
            </div>
          </motion.div>
        );
      })()}

    </div>
  );
}
