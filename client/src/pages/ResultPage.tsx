import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, ArrowLeft, TrendingUp, Users, Heart, Activity, Sparkles, Edit2, X, ChevronDown, Home, Apple, Coins, PieChart } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, ReferenceLine, Cell } from 'recharts';
import type { UserBirthInfo, FiveElementsAnalysis, LanguageStyle } from '../shared/types';
import { COLOR_TOKENS, SHADOW_TOKENS, RADIUS_TOKENS } from '../theme/designTokens';

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
  coral: COLOR_TOKENS.brand.coral, coralLight: 'rgba(255,107,157,0.1)',
  orange: COLOR_TOKENS.brand.orange, orangeLight: 'rgba(255,157,107,0.1)',
  yellow: COLOR_TOKENS.brand.yellow, yellowLight: 'rgba(255,214,102,0.12)',
  green: '#22C55E', greenLight: 'rgba(34,197,94,0.1)',
  blue: COLOR_TOKENS.brand.blue, blueLight: 'rgba(107,212,255,0.1)',
  purple: COLOR_TOKENS.brand.purple, purpleLight: 'rgba(157,107,255,0.1)',
  text: COLOR_TOKENS.text.primary, textSecondary: '#6B7280', textMuted: COLOR_TOKENS.text.muted,
  border: '#F0F1F8', cardBg: '#FFFFFF',
};

// 天干对应的五行属性
const STEM_ELEMENT: Record<string, string> = {
  '甲': '木', '乙': '木',
  '丙': '火', '丁': '火',
  '戊': '土', '己': '土',
  '庚': '金', '辛': '金',
  '壬': '水', '癸': '水'
};

const styleLabels: Record<LanguageStyle, string> = {
  normal: '大白话', stock: '📈 股民', game: '🎮 游戏',
  fairytale: '🧚 童话', fortune: '🔮 算命师', workplace: '💼 职场',
};

function cn(...c: (string | boolean | undefined)[]) { return c.filter(Boolean).join(' '); }

async function parseJsonSafe(res: Response): Promise<any> {
  const text = await res.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(
      `接口返回非 JSON（HTTP ${res.status}）。请在本机启动后端（端口 3001）并确认 Vite 已将 /api 代理到该服务。`,
    );
  }
}

function useCompactMobile(): boolean {
  const [isCompact, setIsCompact] = useState(() => window.matchMedia('(max-width: 767px)').matches);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const handler = (e: MediaQueryListEvent) => setIsCompact(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return isCompact;
}

/** Read /result/:userId from HashRouter URL without useParams (avoids RR7 hook-order edge cases). */
function getResultUserIdFromHash(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  const raw = window.location.hash.startsWith('#') ? window.location.hash.slice(1) : window.location.hash;
  if (!raw.startsWith('/result/')) return undefined;
  const seg = raw.slice('/result/'.length).split(/[/?#]/)[0];
  if (!seg) return undefined;
  try {
    return decodeURIComponent(seg);
  } catch {
    return seg;
  }
}

function useHashResultUserId(): string | undefined {
  const [userId, setUserId] = useState<string | undefined>(() => {
    // 初始解析
    if (typeof window === 'undefined') return undefined;
    const hash = window.location.hash;
    const raw = hash.startsWith('#') ? hash.slice(1) : hash;
    if (!raw.startsWith('/result/')) return undefined;
    const seg = raw.slice('/result/'.length).split(/[/?#]/)[0];
    if (!seg) return undefined;
    try {
      return decodeURIComponent(seg);
    } catch {
      return seg;
    }
  });

  // 监听 hash 变化
  useEffect(() => {
    const handler = () => {
      const hash = window.location.hash;
      const raw = hash.startsWith('#') ? hash.slice(1) : hash;
      if (!raw.startsWith('/result/')) {
        setUserId(undefined);
        return;
      }
      const seg = raw.slice('/result/'.length).split(/[/?#]/)[0];
      if (!seg) {
        setUserId(undefined);
        return;
      }
      try {
        setUserId(decodeURIComponent(seg));
      } catch {
        setUserId(seg);
      }
    };
    
    // 立即执行一次，确保获取最新值
    handler();
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);

  return userId;
}

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
  const dmBonusMap: Record<string, number> = { wood: 5, fire: 4, earth: 6, metal: 3, water: 7 };
  const dmBonus = dmBonusMap[dm] || 0;
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
  text: COLOR_TOKENS.text.primary,
  textSecondary: '#6B7280',
  textMuted: COLOR_TOKENS.text.muted,
  accent: COLOR_TOKENS.brand.coral,
  accentDim: 'rgba(255,107,157,0.1)',
  accentBorder: 'rgba(255,107,157,0.3)',
};

function cardStyle(extra?: React.CSSProperties): React.CSSProperties {
  return {
    background: `linear-gradient(145deg, ${css.accent}0A, ${PALETTE.orange}08 48%, #FFFFFF)`,
    borderRadius: RADIUS_TOKENS.lg,
    border: `1px solid ${css.accent}20`,
    boxShadow: `0 12px 24px ${css.accent}16`,
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

function SectionTitle({ children, icon, action, compact }: { children: React.ReactNode; icon?: React.ReactNode; action?: React.ReactNode; compact?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: compact ? 8 : 10, marginBottom: compact ? 14 : 20 }}>
      {icon && <span style={{ fontSize: compact ? '18px' : '16px' }}>{icon}</span>}
      <h2 style={{
        fontFamily: 'Outfit, "Noto Sans SC", -apple-system, sans-serif',
        fontSize: compact ? '17px' : '13px', fontWeight: 700,
        letterSpacing: compact ? '0.02em' : '0.18em',
        textTransform: compact ? 'none' : 'uppercase',
        color: compact ? '#3C3C43' : css.textMuted,
      }}>
        {children}
      </h2>
      {action}
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

function PillarCell({ label, pillar, shiShen, highlight = false, compact = false }: {
  label: string; pillar: string; shiShen: string; highlight?: boolean; compact?: boolean;
}) {
  const shiShenColor = SHISHEN_COLORS[shiShen] || css.textMuted;
  return (
    <div style={{
      textAlign: 'center', padding: compact ? '14px 10px' : '20px 12px', borderRadius: compact ? 14 : 16,
      background: highlight ? `${css.accent}0A` : '#F8F9FC',
      border: highlight ? `2px solid ${css.accent}40` : '1px solid #F0F1F8',
      transition: 'all 0.2s',
    }}>
      <p style={{
        fontFamily: 'Outfit, "Noto Sans SC", sans-serif',
        fontSize: compact ? '13px' : '11px', letterSpacing: compact ? '0.04em' : '0.15em',
        textTransform: compact ? 'none' : 'uppercase', marginBottom: compact ? 6 : 8, color: '#8E8E93', fontWeight: 600,
      }}>{label}</p>
      <p style={{
        fontSize: compact ? 26 : 28, fontWeight: 900, marginBottom: compact ? 6 : 8,
        color: highlight ? css.accent : css.text,
        fontFamily: 'Outfit, "Noto Sans SC", sans-serif',
      }}>{pillar}</p>
      <span style={{
        display: 'inline-block', padding: compact ? '4px 10px' : '3px 10px', borderRadius: '9999px',
        fontSize: compact ? '13px' : '12px', fontWeight: 600,
        background: shiShenColor + '15', color: shiShenColor,
        border: `1px solid ${shiShenColor}30`,
        fontFamily: 'Outfit, "Noto Sans SC", sans-serif',
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
interface MingGeType {
  name: string; special: boolean; desc: string; type: string;
  description?: string; formation?: string | null; characteristics?: string | null;
  strengths?: string | null; weaknesses?: string | null;
  suitableCareer?: string[]; avoidCareer?: string[]; luckTips?: string | null;
  mainGod?: string; subGod?: string;
}

// 根据解读风格生成命格详解内容
function getMingGeByStyle(baseMingGe: MingGeType, style: LanguageStyle, dmEl: string, dmName: string, favorable: string[], unfavorable: string[]): MingGeType {
  const dm = ELEMENT_NAMES[dmEl] || '木';
  const favN = favorable.map(e => ELEMENT_NAMES[e]).join('、');
  const unfavN = unfavorable.map(e => ELEMENT_NAMES[e]).join('、');
  const dayElName = dmEl === 'wood' ? '木' : dmEl === 'fire' ? '火' : dmEl === 'earth' ? '土' : dmEl === 'metal' ? '金' : '水';
  
  const content: Record<LanguageStyle, { desc: string; formation: string; characteristics: string; strengths: string; weaknesses: string; luckTips: string; investment?: string }> = {
    normal: {
      desc: baseMingGe.description || baseMingGe.desc,
      formation: `简单来说，你命里${baseMingGe.name}。月令就是你的核心能量源，能驾驭住就顺，驾驭不住就累。关键是看${favorable.length > 0 ? `你的用神${favN}能不能到位` : '五行能不能平衡'}。`,
      characteristics: `你是${baseMingGe.name}选手，${baseMingGe.desc} 总体来说${favorable.length > unfavorable.length ? `命里带着好运buff，${favN}是你的人生助力。` : unfavorable.length > favorable.length ? `有点小挑战，${unfavN}是你需要绕开的坑。` : '比较平衡，没大起大落。'}`,
      strengths: `${dm}属性的你，${dmEl === 'wood' ? '有韧性，像竹子一样能屈能伸。' : dmEl === 'fire' ? '热情有活力，走到哪都是焦点。' : dmEl === 'earth' ? '踏实稳重，给人安全感。' : dmEl === 'metal' ? '果断有魄力，做决定快准狠。' : '灵活变通，适应能力强。'}加上${baseMingGe.name}这个格局，${favorable.includes('wood') || favorable.includes('fire') ? '创意和表达能力是你的杀手锏。' : favorable.includes('earth') ? '稳扎稳打，积累型选手。' : favorable.includes('metal') || favorable.includes('water') ? '财运和头脑是你的强项。' : '各方面发展比较均衡。'}`,
      weaknesses: `需要注意的地方：${unfavN}是你的软肋。${unfavorable.includes('wood') ? '遇到挫折容易想太多，陷入纠结。' : unfavorable.includes('fire') ? '一激动就容易上头，说不该说的话。' : unfavorable.includes('earth') ? '有时候太保守，机会来了不敢冲。' : unfavorable.includes('metal') ? '太追求完美，容易得罪人。' : '方向太多容易迷失，不知道该往哪走。'}`,
      luckTips: `今年总体来说${favorable.length > unfavorable.length ? '运气不错，是发力的时候！该冲就冲，别怂。' : unfavorable.length > favorable.length ? '有点背，别硬刚，顺着来，别逞强。' : '平平淡淡，稳着点来。'}记住，用神到位的年份要抓住机会，忌神当道的年份就低调点。`,
    },
    stock: {
      desc: `${dm}日主${baseMingGe.name}，相当于股市中的"${['正官格', '七杀格', '正印格', '偏印格', '食神格', '伤官格', '正财格', '偏财格', '比肩格', '劫财格'].indexOf(baseMingGe.name) < 3 ? '蓝筹绩优股' : ['食神格', '伤官格'].indexOf(baseMingGe.name) >= 0 ? '成长股' : ['正财格', '偏财格'].indexOf(baseMingGe.name) >= 0 ? '白马股' : '周期股'}"，${baseMingGe.desc}`,
      formation: `${baseMingGe.name}建仓条件：月令主力筹码（${baseMingGe.name.replace('格', '')}）需占全局30%以上，且日主有足够市值（身强）来驾驭。跌破支撑（用神失位）则格局破败。`,
      characteristics: `此格局类似${['正官格'].includes(baseMingGe.name) ? '大盘蓝筹，波动小但稳定增值' : ['七杀格', '偏财格'].includes(baseMingGe.name) ? '高弹性标的，涨跌幅都大' : ['食神格', '伤官格'].includes(baseMingGe.name) ? '概念题材股，创意驱动' : '稳健型白马' }。${dmEl}属性决定了你的投资风格基本面。`,
      strengths: `${dm}日主${dmEl}属性是核心资产：${dmEl === 'wood' ? '木主生发，适合长期持有成长股' : dmEl === 'fire' ? '火主炎上，短线交易优势明显' : dmEl === 'earth' ? '土主厚藏，价值投资风格' : dmEl === 'metal' ? '金主义，趋势交易高手' : '水主流动，灵活配置型'}。${favorable.includes('metal') || favorable.includes('water') ? '金水板块配置优先。' : favorable.includes('wood') || favorable.includes('fire') ? '木火板块值得关注。' : '均衡配置为主。'}`,
      weaknesses: `注意${unfavN}板块的风险暴露。${dmEl === 'wood' ? '木气受压时忌追高' : dmEl === 'fire' ? '火气过旺易追涨杀跌' : dmEl === 'earth' ? '土气过重易死守不放' : dmEl === 'metal' ? '金气过刚易过度自信' : '水气过泛易频繁换仓'}。`,
      luckTips: `全年操作策略：${favorable.length > unfavorable.length ? '多头思维，积极布局' : '空头思维，控仓为主'}。用神旺相时加仓，忌神当令时止损。流年冲合月份注意变盘风险。`,
    },
    game: {
      desc: `${dm}日主抽到了"${baseMingGe.name}"天赋卡！${baseMingGe.desc} 你的初始属性和技能树都已锁定，快看看怎么加点吧！`,
      formation: `【${baseMingGe.name}】成格条件 = 月令Boss（${baseMingGe.name.replace('格', '')}）+ 日主等级够高（身强能生/克月令）+ 用神辅助技能。任一条件缺失=格局破防，等级再高也会被秒！`,
      characteristics: `【${baseMingGe.name}】是${['正官格', '七杀格'].includes(baseMingGe.name) ? '坦克/战士定位，扛伤害打前排' : ['食神格', '伤官格'].includes(baseMingGe.name) ? '法师/刺客定位，爆发输出' : ['正印格', '偏印格'].includes(baseMingGe.name) ? '辅助/牧师定位，奶量和增益' : 'ADC/射手定位，稳健发育'}。${dm}属性的技能树已生成，等你来点！`,
      strengths: `${dm}日主的属性点是${dmEl}系！${dmEl === 'wood' ? '🌳 木系：被动回血+缠绕控制，适合持续输出' : dmEl === 'fire' ? '🔥 火系：暴击+灼烧，适合爆发伤害' : dmEl === 'earth' ? '🪨 土系：护盾+减伤，适合肉盾定位' : dmEl === 'metal' ? '⚔️ 金系：破甲+连击，适合穿透流' : '💧 水系：控制+机动，适合游击战'}。${favorable.includes('wood') || favorable.includes('fire') ? '木火双修路线已解锁！' : favorable.includes('metal') || favorable.includes('water') ? '金水双修流派更强！' : '土系平衡路线稳如老狗！'}`,
      weaknesses: `⚠️ 你的debuff是${unfavN}！${dmEl === 'wood' ? '木气受制时千万别浪，猥琐发育' : dmEl === 'fire' ? '火气过旺容易上头，被人反杀' : dmEl === 'earth' ? '土气过重腿太短，追不上人' : dmEl === 'metal' ? '金气过刚容易被集火' : '水气过泛容易迷失方向'}。`,
      luckTips: `💡 攻略tips：${favorable.length > unfavorable.length ? '今年版本强势期，大胆冲！' : '今年需要多刷金币升级，稳一手。'}流年用神当令=你的强势期，抓紧上分！忌神当令=服务器维护，老实挂机。`,
    },
    fairytale: {
      desc: `✨ 亲爱的${dm}小精灵，你的命格是"${baseMingGe.name}"！${baseMingGe.desc} 你的故事书已经翻开，快来看看属于你的章节吧！`,
      formation: `🌟 成格条件：小精灵需要月令魔法（${baseMingGe.name.replace('格', '')}）的帮助，加上日主小宇宙（身强）足够强大，才能驾驭这份命运的力量。用神就像你的守护精灵，会在最需要的时刻出现。`,
      characteristics: `🌈 ${baseMingGe.name}就像一个神奇的魔法：${['正官格', '七杀格'].includes(baseMingGe.name) ? '代表着勇敢与正义的力量，适合成为领袖的精灵' : ['食神格', '伤官格'].includes(baseMingGe.name) ? '代表着创意与艺术的魔法，能创造美好的事物' : ['正印格', '偏印格'].includes(baseMingGe.name) ? '代表着智慧与慈悲的光芒，能照亮他人的道路' : '代表着财富与幸运的金币，会为你带来宝藏'}。${dm}属性的你，注定与众不同！`,
      strengths: `${dm}小精灵，你的属性是${dmEl === 'wood' ? '🌱 森林之心' : dmEl === 'fire' ? '☀️ 太阳之眼' : dmEl === 'earth' ? '🌍 大地之母' : dmEl === 'metal' ? '💎 钻石之魂' : '🌙 月亮之泪'}！${favorable.includes('wood') || favorable.includes('fire') ? '光明系魔法加成，你的未来闪闪发光！' : favorable.includes('metal') || favorable.includes('water') ? '神秘系魔法加成，你的命运充满惊喜！' : '平衡系魔法加成，你的旅程平稳美好！'}`,
      weaknesses: `🥀 小心哦，${unfavN}是你的成长克星：${dmEl === 'wood' ? '当你感到疲惫时，记得回到森林休息' : dmEl === 'fire' ? '当你感到急躁时，记得深呼吸冷静下来' : dmEl === 'earth' ? '当你感到压抑时，走出去看看世界' : dmEl === 'metal' ? '当你感到孤独时，敞开心扉交朋友' : '当你感到迷茫时，倾听内心的声音'}。`,
      luckTips: `🌟 魔法提示：${dm}小精灵，${favorable.length > unfavorable.length ? '今年是福运之年，你的魔法会特别强大！' : '今年需要更多的勇气和耐心，但好运就在前方！'}记得在用神当令时许愿，那是实现愿望的最佳时刻哦！`,
    },
    fortune: {
      desc: `施主，贫道观你命局，乃${baseMingGe.name}是也。${baseMingGe.desc} 此格局之人，命中注定不凡。`,
      formation: `【${baseMingGe.name}】成格要诀：月令为${baseMingGe.name.replace('格', '')}，乃天意所归。日主${dm}身强，方能担此格局之用。命中用神得力，如得天地庇佑；用神失位，格局破败，运势受阻。`,
      characteristics: `【${baseMingGe.name}】之人，${['正官格', '七杀格'].includes(baseMingGe.name) ? '有官运之命，适合仕途发展' : ['食神格', '伤官格'].includes(baseMingGe.name) ? '有才学之命，智慧超群' : ['正印格', '偏印格'].includes(baseMingGe.name) ? '有学问之命，宜学术研究' : ['正财格', '偏财格'].includes(baseMingGe.name) ? '有财运之命，宜商贾经营' : '有独立之命，宜自主发展'}。${dm}日主配合${baseMingGe.name}，${favorable.length > 0 ? `命中宜${favN}，忌${unfavN}。` : '五行趋于平衡。'}`,
      strengths: `${dm}日主属${dayElName}性，施主${dmEl === 'wood' ? '木气通根，仁慈善良，有生发之德' : dmEl === 'fire' ? '火气充盈，光明磊落，有文明之象' : dmEl === 'earth' ? '土气厚重，诚实守信，有包容之量' : dmEl === 'metal' ? '金气清刚，刚毅果断，有决断之力' : '水气流通，聪明智慧，有变通之能'}。${favorable.includes('wood') || favorable.includes('fire') ? '木火通明，才华显露，利文教艺术之途。' : favorable.includes('metal') || favorable.includes('water') ? '金水相生，财源广进，利商贾金融之路。' : '土气护身，稳步发展。'}`,
      weaknesses: `施主需注意${unfavN}对命局之影响。${dmEl === 'wood' ? '木气受制时，易有郁结之症，宜疏肝理气。' : dmEl === 'fire' ? '火气过旺时，易有心神不宁，宜静心养神。' : dmEl === 'earth' ? '土气过重时，易有脾胃之忧，宜健脾和胃。' : dmEl === 'metal' ? '金气过刚时，易有肺腑之疾，宜润肺养气。' : '水气过泛时，易有肾精之亏，宜早睡养精。'}`,
      luckTips: `贫道赠言：${dm}日主全年运势${favorable.length > unfavorable.length ? '吉星高照，宜积极进取。' : unfavorable.length > favorable.length ? '需谨慎行事，以稳为主。' : '吉凶参半，审时度势。'}流年用神当令之时，正是施主大展宏图之机；忌神当令之年，宜静心修德，不可妄动。`,
    },
    workplace: {
      desc: `${dm}职场人，你的命格是"${baseMingGe.name}"！${baseMingGe.desc} 你的职场属性和职业天赋已经揭晓，来看看怎么在职场打怪升级吧！`,
      formation: `【${baseMingGe.name}】职场成局条件：月令工作能力（${baseMingGe.name.replace('格', '')}）+ 日主个人实力（身强）达标 + 用神辅助技能加成。三者齐备，你就是职场MVP候选人！`,
      characteristics: `【${baseMingGe.name}】的职场定位：${['正官格', '七杀格'].includes(baseMingGe.name) ? '管理路线，适合带领团队冲锋陷阵' : ['食神格', '伤官格'].includes(baseMingGe.name) ? '专业路线，适合深耕技术或创意领域' : ['正印格', '偏印格'].includes(baseMingGe.name) ? '顾问路线，适合传道授业解惑' : ['正财格', '偏财格'].includes(baseMingGe.name) ? '业务路线，适合攻城略地拿业绩' : '独立路线，适合自主创业当老板'}。${dm}属性的你，职场风格已锁定！`,
      strengths: `${dm}职场人的核心竞争力是${dmEl === 'wood' ? '🌿 战略规划能力，长远布局思维' : dmEl === 'fire' ? '🔥 执行力和感染力，激励团队士气' : dmEl === 'earth' ? '🪨 稳定性和可靠性，是团队的中流砥柱' : dmEl === 'metal' ? '⚡ 分析能力和决断力，精准打击问题' : '💧 适应能力和学习力，随机应变高手'}。${favorable.includes('wood') || favorable.includes('fire') ? '文创策划是你的王牌领域！' : favorable.includes('metal') || favorable.includes('water') ? '金融战略是你的专属赛道！' : '综合管理是你的最强项！'}`,
      weaknesses: `⚠️ 职场雷区：${unfavN}！${dmEl === 'wood' ? '木气受阻时别做重大决定，先收集信息' : dmEl === 'fire' ? '火气过旺时少说话多做事，避免冲动决策' : dmEl === 'earth' ? '土气过重时多接受新事物，避免思维僵化' : dmEl === 'metal' ? '金气过刚时注意团队协作，别一个人扛' : '水气过泛时聚焦核心目标，别分散精力'}。`,
      luckTips: `💼 职场攻略：${dm}职场人，${favorable.length > unfavorable.length ? '今年是晋升加薪的好年景，主动争取机会！' : '今年需要稳扎稳打，积累资历和口碑。'}用神当令的月份是谈薪资、申请资源的最佳时机！忌神当令时低调行事，避免站队和冒进。`,
      investment: `💰 职场投资建议：${dm}日主宜${favN.includes('金') || favN.includes('水') ? '配置职场人脉资源，长期回报率高。' : favN.includes('木') || favN.includes('火') ? '投资自我成长和学习，提升核心竞争力。' : '稳健型投资，储蓄和保险为主。'}`,
    },
  };
  
  const styleContent = content[style] || content.normal;
  return {
    ...baseMingGe,
    desc: styleContent.desc,
    description: styleContent.desc,
    formation: styleContent.formation,
    characteristics: styleContent.characteristics,
    strengths: styleContent.strengths,
    weaknesses: styleContent.weaknesses,
    luckTips: styleContent.luckTips,
  };
}

function getMingGe(monthStem: string, monthBranch: string): MingGeType {
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
  return { 
    name: ge, special, desc: descs[ge] || '命局平稳，运势中和，适合各类工作。', type: types[ge] || 'normal',
    description: descs[ge] || '命局平稳，运势中和，适合各类工作。',
    formation: null,
    characteristics: null,
    strengths: null,
    weaknesses: null,
    suitableCareer: [],
    avoidCareer: [],
    luckTips: null,
  };
}

interface DayunData { age: number; endAge: number; ganZhi: string; element: string; score: number; year: number; yearEnd: number; favorableElements?: string[]; }
function generateDayunData(userInfo: UserBirthInfo): DayunData[] {
  const bazi = userInfo.baziResult;
  if (!bazi) return [];
  const stems = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
  const branches = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
  const stemEls: Record<string, string> = { '甲': 'wood', '乙': 'wood', '丙': 'fire', '丁': 'fire', '戊': 'earth', '己': 'earth', '庚': 'metal', '辛': 'metal', '壬': 'water', '癸': 'water' };
  // 从字符串中提取天干地支（如 "甲辰" -> stem="甲", branch="辰"）
  const yearPillarStr = typeof bazi.yearPillar === 'string' ? bazi.yearPillar : '甲子';
  const monthPillarStr = typeof bazi.monthPillar === 'string' ? bazi.monthPillar : '甲子';
  const yearStem = yearPillarStr.charAt(0);
  const monthStem = monthPillarStr.charAt(0);
  const monthBranch = monthPillarStr.charAt(1);
  const isYangYear = ['甲', '丙', '戊', '庚', '壬'].includes(yearStem);
  const isForward = (isYangYear && userInfo.gender === 'male') || (!isYangYear && userInfo.gender === 'female');
  const JIE: Record<number, number> = { 1: 6, 2: 4, 3: 6, 4: 5, 5: 6, 6: 6, 7: 7, 8: 8, 9: 8, 10: 8, 11: 7, 12: 7 };
  const birthDate = new Date(userInfo.birthYear, userInfo.birthMonth - 1, userInfo.birthDay);
  let days = Math.round((new Date(userInfo.birthYear, userInfo.birthMonth - 1, JIE[userInfo.birthMonth]).getTime() - birthDate.getTime()) / 86400000);
  days = Math.abs(days);
  const qiyunAge = Math.floor(days / 3) + (days % 3) * 4 / 12;
  const qiyunYear = new Date(birthDate.getFullYear(), birthDate.getMonth() + Math.floor(qiyunAge * 12), 1).getFullYear();
  const favorable = userInfo.favorableElements || [];
  const baziDmEl = bazi.dayMasterElement;
  const startSi = stems.indexOf(monthStem);
  const startBi = branches.indexOf(monthBranch);
  const data: DayunData[] = [];
  let prevScore = 50;
  for (let i = 0; i < 12; i++) {
    const off = isForward ? i + 1 : -(i + 1);
    const si = (startSi + off + 10) % 10;
    const bi = (startBi + off + 12) % 12;
    const gz = stems[si] + branches[bi];
    const el = stemEls[stems[si]];
    const age = Math.floor(qiyunAge) + i * 10;
    const isFav = favorable.includes(el);
    const seed = (qiyunYear + i) * 7 % 100;
    let base = 50 + (isFav ? 18 : -10) + (el === baziDmEl ? 5 : 0) + (seed % 30 - 15);
    base = Math.max(25, Math.min(90, base));
    if (i > 0) base = prevScore + (base - prevScore) * 0.6;
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
  const content: Record<LanguageStyle, { career: string; fortune: string; investment: string; family?: string; marriage?: string; health: string }> = {
    normal: {
      career: `${dm}属性的你，干啥比较顺呢？命中带着${favN}，说明${favN.includes('金') || favN.includes('水') ? '脑子灵光，适合搞金融、科技、或者跟人打交道的工作。' : favN.includes('木') || favN.includes('火') ? '创意满满，适合做内容、教育、策划类的事情。' : '踏实稳重，适合一步一步来的工作。'}至于${unfavN}相关的行业，就不太建议了，硬做也会比较累。`,
      fortune: `说到钱嘛，${dm}属性的你总体财运${favN.includes('金') ? '还不错，正财运比较稳，工资奖金这些是主要来源。' : favN.includes('水') ? '偏财运好一点，平时可以留意一下理财和投资机会。' : favN.includes('木') || favN.includes('火') ? '主要靠才华和技能赚钱，适合接私活、做副业。' : '稳扎稳打型，别想着一夜暴富，存钱是硬道理。'}`,
      investment: `投资方面嘛，${dm}属性的你比较${favN.includes('金') || favN.includes('水') ? '适合买基金、理财这类稳妥的产品。' : favN.includes('木') || favN.includes('火') ? '可以尝试点有创意、有潜力的投资方向。' : '偏好房产、债券这种看得见摸得着的。'}记住，不懂的东西别乱投。`,
      marriage: `${dm}属性的你在感情中${favN.includes('火') || favN.includes('木') ? '比较主动热情，喜欢就会表达，适合遇到同样直接的人。' : favN.includes('金') || favN.includes('水') ? '比较内敛含蓄，需要慢慢相处才能看到你的好，适合有耐心的人。' : '踏实认真，一旦认定了就会很专一，是长跑型选手。'}`,
      health: `身体方面，${dm}属性的你平时要多注意${dmEl === 'wood' ? '肝胆这块，别熬夜、别生闷气。' : dmEl === 'fire' ? '心脏和眼睛，少看手机早点睡。' : dmEl === 'earth' ? '肠胃问题，少吃点外卖和冷的。' : dmEl === 'metal' ? '肺和呼吸道，抽烟的少抽，待空调房的通风。' : '腰和肾，别久坐，多站起来动动。'}`,
    },
    stock: {
      career: `${dm}日走${favN}势，${favN.includes('金') || favN.includes('水') ? '金融、科技板块利好，适合加仓。' : favN.includes('木') || favN.includes('火') ? '文化创意板块值得布局。' : '低估值稳健标的为主。'}注意回避${unfavN}相关板块。`,
      fortune: `财运${favN.includes('金') || favN.includes('水') ? '处于上升通道，适合主动出击。' : favN.includes('木') || favN.includes('火') ? '偏文创板块，可布局未来。' : '宜守不宜攻，稳健为主。'}`,
      investment: `投资风格：${dmEl === 'wood' ? '长线价值型。' : dmEl === 'fire' ? '短线热点型。' : dmEl === 'earth' ? '稳健固收型。' : dmEl === 'metal' ? '量化对冲型。' : '灵活配置型。'}`,
      marriage: `${dm}日主感情线：${dmEl === 'wood' ? '木主生发，感情来得快去得也快，注意别太冲动。' : dmEl === 'fire' ? '火性热烈，燃烧自己照亮对方，但也容易倦怠。' : dmEl === 'earth' ? '土性厚重，一旦认定就是长线持有，适合日久生情。' : dmEl === 'metal' ? '金性果断，看对眼就行动，但也要给对方安全感。' : '水性流动，感情丰富但容易犹豫，需要主动一点。'}`,
      health: `健康管理：${dmEl === 'wood' ? '肝胆指标' : dmEl === 'fire' ? '心血管' : dmEl === 'earth' ? '消化系统' : dmEl === 'metal' ? '呼吸系统' : '肾功能'}需定期检查。`,
    },
    game: {
      career: `${dm}属性，${favN}是主力技能！${favN.includes('金') || favN.includes('水') ? '金融科技流，核心输出！' : favN.includes('木') || favN.includes('火') ? '文创天赋流，后期大C！' : '稳健发育流，适合辅助位。'}${unfavN}是debuff，记得绕开！`,
      fortune: `财运是隐藏副本！${favN.includes('金') ? '金属性装备爆率高，优先刷！' : favN.includes('水') ? '流动性属性加成，适合快进快出。' : '土属性稳扎稳打，适合蹲守。'}`,
      investment: `投资技能树：${dmEl === 'wood' ? '长线价值投资（推荐点满）。' : dmEl === 'fire' ? '热点追击（小心翻车！）。' : dmEl === 'earth' ? '稳健固收（新手推荐）。' : dmEl === 'metal' ? '对冲量化（高玩专属）。' : '灵活配置（均衡加点）。'}`,
      marriage: `感情副本攻略：${dmEl === 'wood' ? '木属性适合找火属性队友（木生火），互补加成！' : dmEl === 'fire' ? '火属性找土属性队友（火生土），稳定输出！' : dmEl === 'earth' ? '土属性找金属性队友（土生金），财运+感情双丰收！' : dmEl === 'metal' ? '金属性找水属性队友（金生水），浪漫指数爆表！' : '水属性找木属性队友（水生木），长情陪伴型！'}`,
      health: `HP值：${dmEl === 'wood' ? '肝/神经系统' : dmEl === 'fire' ? '心脏/眼睛' : dmEl === 'earth' ? '消化系统' : dmEl === 'metal' ? '肺/呼吸' : '肾/泌尿'}需要日常维护，别忘了吃补剂！`,
    },
    fairytale: {
      career: `${dm}小精灵，你的命运花园里${favN}是最珍贵的花朵！${favN.includes('金') || favN.includes('水') ? '金融和知识的泉水在等你发现。' : favN.includes('木') || favN.includes('火') ? '创意和艺术的阳光照耀着你。' : '大地的果实会给你带来稳定的幸福。'}`,
      fortune: `${dm}小天使，你的财运是一颗闪耀的星星！${favN.includes('金') ? '金色星星代表正财，好运正在降临。' : favN.includes('水') ? '蓝色星星在远方闪烁，那是流动的财富。' : '温暖的星星守护着你的钱袋。'}`,
      investment: `${dm}小精灵，你的投资是一段神奇的冒险！${favN.includes('金') || favN.includes('水') ? '金融王国的大门为你敞开。' : favN.includes('木') || favN.includes('火') ? '创意的翅膀会让你的财富飞翔。' : '大地的宝藏需要耐心挖掘。'}`,
      marriage: `${dm}小天使的爱情魔法：${dmEl === 'wood' ? '你的感情像春天的藤蔓，会慢慢缠绕对方的心，需要耐心浇灌才能开花结果。' : dmEl === 'fire' ? '你的爱像夏日的阳光，炽热而明亮，吸引着周围的人，但也别忘了给对方喘息的空间。' : dmEl === 'earth' ? '你的感情像大地一样厚重而温暖，是最可靠的依靠，选择了你就是选择了安全感。' : dmEl === 'metal' ? '你的爱情像精致的工艺品，需要同样欣赏它的人来守护，缘分到了就是命中注定。' : '你的感情像流水一样温柔，能包容对方的一切，适合细水长流的爱情故事。'}`,
      health: `小精灵要好好照顾自己：${dmEl === 'wood' ? '森林之心（肝胆）' : dmEl === 'fire' ? '太阳之眼（心脏）' : dmEl === 'earth' ? '大地之腹（脾胃）' : dmEl === 'metal' ? '天空之肺' : '月亮之泉（肾）'}需要你的关注。`,
    },
    fortune: {
      career: `${dm}日主，贫道夜观天象，你命中${favN}旺盛，${favN.includes('金') || favN.includes('水') ? '金水相生，财源广进，适合商贾金融之路。' : favN.includes('木') || favN.includes('火') ? '木火通明，才华显露，宜文教艺术之途。' : '土气厚重，宜稳扎稳打。'}切记避开${unfavN}之方。`,
      fortune: `施主命格显示：${dm}日主${favN.includes('金') ? '正财旺盛，宜勤勉积累。' : favN.includes('水') ? '偏财流动，宜把握时机。' : favN.includes('木') || favN.includes('火') ? '才华生财，智慧变现。' : '土气养财，稳步发展。'}忌${unfavN}耗泄。`,
      investment: `投资之道：${dm}日主宜${favN.includes('金') ? '金融投资，利在金秋。' : favN.includes('水') ? '流动资产，灵活配置。' : favN.includes('木') || favN.includes('火') ? '知识投资，智慧增值。' : '固定资产，长远布局。'}`,
      marriage: `姻缘命理：${dm}日主${dmEl === 'wood' ? '桃花在东方，适合在工作场合或学习环境中结识良缘。' : dmEl === 'fire' ? '红鸾星动于南方，社交聚会是邂逅的好时机。' : dmEl === 'earth' ? '姻缘土性沉稳，通过亲友介绍或日久生情更为稳妥。' : dmEl === 'metal' ? '白虎星带金缘，西方或学术场合易遇正缘。' : '天喜星入命，北方或水路相关之处缘分较旺。'}`,
      health: `施主须注意${dmEl === 'wood' ? '肝胆经络，易有郁结之症。' : dmEl === 'fire' ? '心火过旺，宜静心养神。' : dmEl === 'earth' ? '脾胃运化，需饮食有节。' : dmEl === 'metal' ? '肺金较弱，秋冬季宜进补。' : '肾水不足，宜早睡养精。'}`,
    },
    workplace: {
      career: `${dm}日主，${favN}是你的核心竞争优势。${favN.includes('金') || favN.includes('水') ? '适合战略规划、资本运作类岗位。' : favN.includes('木') || favN.includes('火') ? '适合内容创作、品牌运营、市场策划方向。' : '适合行政管理、财务、法务等稳定型岗位。'}${unfavN}属性领域建议战略性回避。`,
      fortune: `职场财运：${dm}日主${favN.includes('金') ? '薪酬提升空间大，争取绩效奖金。' : favN.includes('水') ? '兼职外快机会多，可发展副业。' : favN.includes('木') || favN.includes('火') ? '才华变现渠道广，版权收益可观。' : '薪资稳定增长，不宜冒险跳槽。'}`,
      family: `${dm}日主在家庭中是情感纽带${favN.includes('水') ? '，能调和矛盾，让家人感到温暖。' : '，是家人的依靠，承担更多责任。'}`,
      investment: `职场投资建议：${dm}日主宜${favN.includes('金') || favN.includes('水') ? '配置职场人脉资源，长期回报率高。' : favN.includes('木') || favN.includes('火') ? '投资自我成长和学习，提升核心竞争力。' : '稳健型投资，储蓄和保险为主。'}`,
      marriage: `${dm}日主职场情场两不误：${favN.includes('火') || favN.includes('木') ? '事业心强的你，在感情中也希望掌握主动权，适合找能跟上你节奏的伴侣。' : favN.includes('金') || favN.includes('水') ? '理性冷静的你，在感情中也需要精神层面的契合，适合找志同道合的人。' : '踏实的你，感情里最看重安全感，长久的陪伴比浪漫更重要。'}`,
      health: `职场高压人群建议：${dmEl === 'wood' ? '肝脏排毒（加班护肝）。' : dmEl === 'fire' ? '心血管健康（少熬夜）。' : dmEl === 'earth' ? '肠胃调理（外卖要少吃）。' : dmEl === 'metal' ? '呼吸系统（空调房多通风）。' : '腰肾保养（不要久坐）。'}`,
    },
  };
  return content[style] || content.normal;
}

// ─── Fortune Card ─────────────────────────────────────────────────────────────
const CARD_ICONS: Record<string, React.ReactNode> = {
  career: <TrendingUp style={{ width: '20px', height: '20px' }} />,
  fortune: <Coins style={{ width: '20px', height: '20px' }} />,
  investment: <PieChart style={{ width: '20px', height: '20px' }} />,
  family: <Heart style={{ width: '20px', height: '20px' }} />,
  marriage: <Sparkles style={{ width: '20px', height: '20px' }} />,
  health: <Activity style={{ width: '20px', height: '20px' }} />,
};
const CARD_COLORS: Record<string, { hex: string; grad: string }> = {
  career: { hex: '#FF9D6B', grad: 'linear-gradient(135deg, rgba(255,157,107,0.1), rgba(255,157,107,0.03))' },
  fortune: { hex: '#FFD700', grad: 'linear-gradient(135deg, rgba(255,215,0,0.1), rgba(255,215,0,0.03))' },
  investment: { hex: '#6366F1', grad: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(99,102,241,0.03))' },
  family: { hex: '#FF6B9D', grad: 'linear-gradient(135deg, rgba(255,107,157,0.1), rgba(255,107,157,0.03))' },
  marriage: { hex: '#9B6BFF', grad: 'linear-gradient(135deg, rgba(155,107,255,0.1), rgba(155,107,255,0.03))' },
  health: { hex: '#00C47A', grad: 'linear-gradient(135deg, rgba(0,196,122,0.1), rgba(0,196,122,0.03))' },
};
const CARD_LABELS: Record<string, string> = {
  career: '事业运势', fortune: '财运运势', investment: '投资建议', family: '家庭关系', marriage: '婚姻感情', health: '健康养生',
};

// 大运流年投资建议辅助函数
function getDayunInvestmentAdvice(dayunElement: string, currentYear: number): { timing: string; direction: string; type: string } {
  const elementMap: Record<string, { timing: string; direction: string; type: string }> = {
    wood: { timing: `${currentYear}年春季（木旺）+ ${currentYear + 1}年春`, direction: '东方（东三宫）+ 北方（水生木）', type: '长线价值投资，配置文化、教育、科技类资产' },
    fire: { timing: `${currentYear}年夏季（火旺）+ ${currentYear + 1}年夏`, direction: '南方（离宫）+ 东方（木生火）', type: '短线热点投资，关注能源、餐饮、互联网板块' },
    earth: { timing: `${currentYear}年长夏（土旺）+ 四季月`, direction: '东北/西南（坤艮宫）+ 中央', type: '稳健固收投资，配置房产、债券、贵金属' },
    metal: { timing: `${currentYear}年秋季（金旺）+ ${currentYear + 1}年秋`, direction: '西方（兑乾宫）+ 西北', type: '量化对冲投资，关注金融、法律、高科技' },
    water: { timing: `${currentYear}年冬季（水旺）+ ${currentYear + 1}年冬`, direction: '北方（坎宫）+ 西方（金生水）', type: '灵活配置投资，关注贸易、物流、媒体' },
  };
  return elementMap[dayunElement] || { timing: '用神当令月', direction: '流通方向', type: '均衡配置' };
}

function getLiunianKeyYears(dayunElement: string, startYear: number): string[] {
  // 流年关键年份（地支冲合）
  const keyYears: Record<string, number[]> = {
    wood: [startYear + 2, startYear + 5, startYear + 8], // 卯、午、子
    fire: [startYear + 1, startYear + 4, startYear + 7], // 寅、巳、申
    earth: [startYear + 3, startYear + 6, startYear + 9], // 辰、未、戌
    metal: [startYear + 0, startYear + 4, startYear + 8], // 酉、子、辰
    water: [startYear + 1, startYear + 5, startYear + 9], // 亥、卯、巳
  };
  return (keyYears[dayunElement] || []).map(y => `${y}年`);
}

function getInvestmentRiskLevel(dayunScore: number, favorableElements: string[], dayElement: string): { level: string; desc: string } {
  if (dayunScore >= 70 && favorableElements.includes(dayElement)) {
    return { level: '积极型', desc: '大运走势强劲，可用较高仓位配置进攻型资产' };
  } else if (dayunScore >= 55) {
    return { level: '稳健型', desc: '大运走势平稳，建议股债均衡配置' };
  } else if (dayunScore >= 45) {
    return { level: '保守型', desc: '大运承压，以固收和防御性资产为主' };
  } else {
    return { level: '观望型', desc: '大运低谷期，现金为王，等待时机' };
  }
}

// 生成四维运势详细分析
function generateFortuneDetails(cardKey: string, dayMaster: string, dayElement: string, favorableElements: string[], unfavorableElements: string[], currentDayun?: { element: string; score: number; year: number }) {
  const dayEl = dayElement;
  const favorableStr = favorableElements.includes(dayEl) ? '本命五行相助' : favorableElements.includes(getSupportingElement(dayEl)) ? '生扶五行相助' : '流通五行相助';
  const unfavorableStr = unfavorableElements.includes(dayEl) ? '本命五行受制' : unfavorableElements.includes(getSupportingElement(dayEl)) ? '生扶五行受制' : '流通五行受阻';
  
  if (cardKey === 'career') {
    return {
      favorable: [
        `日主${dayMaster}，${getElementCareerAdvice(dayEl)}最利事业发展`,
        favorableElements.length > 0 ? `${favorableElements[0]}元素相关的行业可重点考虑` : '五行流通行业适合长期发展',
        '把握流年用神当令的时机，主动出击往往事半功倍',
        '与命格相合的同事合作，更易获得支持与资源'
      ],
      precautions: [
        unfavorableElements.includes(dayEl) ? `${ELEMENT_NAMES[dayEl] || dayEl}气受制时期忌重大决策` : '注意流年忌神旺相时的投资风险',
        unfavorableStr.includes('受制') ? '避免强出头，低调积蓄能量' : '不可过于保守，错失良机',
        '与上司沟通注意方式方法，尤其是流年冲克之年',
        '合伙经营需谨慎，避免资金往来不清'
      ]
    };
  } else if (cardKey === 'fortune') {
    return {
      favorable: [
        `${dayMaster}日主，${getElementFortuneAdvice(dayEl)}最利偏财运`,
        favorableElements.includes(dayEl) ? '本命五行旺盛，财运基础扎实' : '用神到位时财源广进',
        '流年吉神生助之期，横财机遇较多',
        '与命格相合之人合作求财，更易获利'
      ],
      precautions: [
        unfavorableElements.includes(dayEl) ? `${ELEMENT_NAMES[dayEl] || dayEl}气受制年忌大额投资` : '流年冲克之年财运波动较大',
        unfavorableStr.includes('受制') ? '避免投机取巧，稳扎稳打为宜' : '不可过于贪婪，见好就收',
        '注意破财方位，流年冲克方向谨慎行事',
        '合伙经营需明确契约，避免财务纠纷'
      ]
    };
  } else if (cardKey === 'investment') {
    // 大运流年投资分析
    const dayunElement = currentDayun?.element || dayEl;
    const dayunScore = currentDayun?.score || 50;
    const dayunYear = currentDayun?.year || new Date().getFullYear();
    const dayunAdvice = getDayunInvestmentAdvice(dayunElement, dayunYear);
    const riskLevel = getInvestmentRiskLevel(dayunScore, favorableElements, dayElement);
    const keyYears = getLiunianKeyYears(dayunElement, dayunYear);
    
    return {
      favorable: [
        `${dayMaster}日主偏好${getElementInvestmentType(dayEl)}投资方式`,
        `当前${ELEMENT_NAMES[dayunElement] || dayunElement}气大运，投资${dayunAdvice.type}`,
        `最佳投资窗口：${dayunAdvice.timing}`,
        `吉祥方位：${dayunAdvice.direction}，可重点布局`
      ],
      precautions: [
        `当前大运运势评分：${dayunScore}分（${riskLevel.level}），${riskLevel.desc}`,
        unfavorableElements.includes(dayEl) ? `${ELEMENT_NAMES[dayEl] || dayEl}气受制期忌高风险投资` : '流年冲克之年投资需谨慎观望',
        unfavorableStr.includes('受制') ? '避免加杠杆操作，控制仓位在50%以下' : '仓位可适度提高，但勿全仓激进',
        `流年关键转折年：${keyYears.length > 0 ? keyYears.join('、') : '关注用神当令年'}，需特别注意资产配置调整`
      ]
    };
  } else if (cardKey === 'marriage') {
    // 大运流年婚姻感情详细分析
    const dayunElement = currentDayun?.element || dayEl;
    const dayunScore = currentDayun?.score || 50;
    const dayunYear = currentDayun?.year || new Date().getFullYear();
    const marriageStyle = getMarriageStyle(dayEl);
    const spouseElement = getSpouseElement(dayEl);
    const marriageAge = getMarriageAge(dayEl);
    const favorableTiming = getMarriageFavorableTiming(dayunElement);
    const marriageRiskYears = getMarriageRiskYears(dayunElement, dayunYear);
    const relationshipType = getRelationshipType(dayEl, favorableElements);
    
    return {
      favorable: [
        `${dayMaster}日主属于「${marriageStyle}」感情模式${relationshipType}`,
        `${ELEMENT_NAMES[dayunElement] || dayunElement}气大运期间，${favorableTiming}是感情发展的黄金期`,
        `最佳婚恋年龄区间：${marriageAge}岁前后，正缘概率较高`,
        `配偶五行属${spouseElement}之人，与你命格相合度更高`
      ],
      precautions: [
        `当前大运运势评分：${dayunScore}分，大运${dayunScore >= 60 ? '走势利婚，感情缘分较旺' : dayunScore >= 45 ? '感情平稳，单身者宜主动出击' : '感情运势较弱，不宜强求'} `,
        unfavorableElements.includes(dayEl) ? `${ELEMENT_NAMES[dayEl] || dayEl}气受制期感情易有波折，避免冲动做决定` : '流年冲克之年感情容易出现第三者或误会',
        `需特别注意的年份：${marriageRiskYears.length > 0 ? marriageRiskYears.join('、') : '关注大运转换年'}，这些年份感情易有变故`,
        unfavorableStr.includes('受制') ? '这阶段适合修身养性，感情事顺其自然为佳' : '保持开放心态，多参加社交活动有利姻缘'
      ]
    };
  } else {
    // health
    return {
      favorable: [
        `${dayMaster}日主需重点关注${getElementHealthFocus(dayEl)}`,
        favorableElements.includes(dayEl) ? '本命旺盛，健康运势较好' : '用神到位时可适当进补调理',
        '流年吉神护佑时期，适合进行体检或调理',
        '保持' + getElementHealthHabit(dayEl) + '的健康习惯'
      ],
      precautions: [
        unfavorableElements.includes(dayEl) ? dayEl + '气受制期易有健康波动' : '流年冲克年月注意意外伤害',
        unfavorableStr.includes('受制') ? '切勿过度消耗精力' : '避免熬夜伤身',
        '注意头部和心脑血管健康，尤其老年阶段',
        '属' + getOppositeElement(dayEl) + '的方位流年需特别小心'
      ]
    };
  }
}

// 辅助函数
function getSupportingElement(el: string): string {
  const map: Record<string, string> = { 木: '水', 火: '木', 土: '火', 金: '土', 水: '金' };
  return map[el] || el;
}
function getOppositeElement(el: string): string {
  const map: Record<string, string> = { 木: '金', 火: '水', 土: '木', 金: '火', 水: '土' };
  return map[el] || '';
}
function getElementCareerAdvice(el: string): string {
  const map: Record<string, string> = { 木: '东方、文教、设计', 火: '南方、能源、餐饮', 土: '地产、农业、建筑', 金: '西方、金融、法律', 水: '北方、物流、贸易' };
  return map[el] || '';
}
function getElementFortuneAdvice(el: string): string {
  const map: Record<string, string> = { 木: '东方木属性行业', 火: '南方火属性行业', 土: '本地土属性行业', 金: '西方金属性行业', 水: '北方水属性行业' };
  return map[el] || '五行流通行业';
}
function getElementInvestmentType(el: string): string {
  const map: Record<string, string> = { 木: '长线价值', 火: '短线热点', 土: '稳健固收', 金: '量化对冲', 水: '灵活配置' };
  return map[el] || '均衡配置';
}
function getElementLuckyMonth(el: string): string {
  const map: Record<string, string> = { 木: '春季木旺月', 火: '夏季火旺月', 土: '长夏土旺月', 金: '秋季金旺月', 水: '冬季水旺月' };
  return map[el] || '用神当令月';
}
function getElementRelation(el: string): string {
  const map: Record<string, string> = { 木: '木火相生', 火: '火土相生', 土: '土金相生', 金: '金水相生', 水: '水木相生' };
  return map[el] || '五行调和';
}
function getMarriageTiming(el: string): string {
  const map: Record<string, string> = { 木: '木气旺相的春季', 火: '火气旺盛的夏季', 土: '土气当令的长夏', 金: '金气清肃的秋季', 水: '水气充盈的冬季' };
  return map[el] || '五行调和时期';
}

// 婚姻感情分析辅助函数
function getMarriageStyle(el: string): string {
  const map: Record<string, string> = {
    木: '细腻守护型', 火: '热情主导型', 土: '稳重包容型', 金: '理性独立型', 水: '浪漫灵动型'
  };
  return map[el] || '均衡型';
}

function getSpouseElement(el: string): string {
  // 配偶星五行：日主所克的五行
  const map: Record<string, string> = {
    木: '金', 火: '水', 土: '木', 金: '火', 水: '土'
  };
  return map[el] || '五行调和';
}

function getMarriageAge(el: string): string {
  const map: Record<string, string> = {
    木: '22-26', 火: '24-28', 土: '26-32', 金: '25-30', 水: '20-25'
  };
  return map[el] || '25-30';
}

function getMarriageFavorableTiming(dayunElement: string): string {
  const map: Record<string, string> = {
    wood: '春季木旺月（寅卯月）及水生木之月',
    fire: '夏季火旺月（巳午月）及木火相生之月',
    earth: '长夏土旺月（辰戌丑未月）及火生土之月',
    metal: '秋季金旺月（申酉月）及土生金之月',
    water: '冬季水旺月（亥子月）及金生水之月'
  };
  return map[dayunElement] || '五行流通之月';
}

function getMarriageRiskYears(dayunElement: string, startYear: number): string[] {
  // 流年冲克配偶宫的年份
  const map: Record<string, number[]> = {
    wood: [startYear + 3, startYear + 6, startYear + 9], // 辰、酉、戌
    fire: [startYear + 2, startYear + 5, startYear + 8], // 卯、午、子
    earth: [startYear + 1, startYear + 4, startYear + 7], // 寅、巳、申
    metal: [startYear + 0, startYear + 4, startYear + 8], // 酉、子、辰
    water: [startYear + 1, startYear + 5, startYear + 9], // 亥、卯、巳
  };
  return (map[dayunElement] || []).map(y => `${y}年`);
}

function getRelationshipType(el: string, favorableElements: string[]): string {
  const isFavorable = favorableElements.includes(el) || favorableElements.includes('水');
  const typeMap: Record<string, string> = {
    木: isFavorable ? '，木性仁慈，善于沟通协调' : '，需注意表达方式，避免过度自我',
    火: isFavorable ? '，火性热情，能带动氛围' : '，需学会倾听，给对方空间',
    土: isFavorable ? '，土性厚重，给人安全感' : '，需注意浪漫表达，避免沉闷',
    金: isFavorable ? '，金性果断，决策力强' : '，需注意情感表达，避免冷漠',
    水: isFavorable ? '，水性灵动，浪漫有趣' : '，需注意承诺兑现，避免飘忽',
  };
  return typeMap[el] || '';
}

function getElementHealthFocus(el: string): string {
  const map: Record<string, string> = { 木: '肝胆、筋骨', 火: '心脏、血液', 土: '脾胃、消化', 金: '肺脏、呼吸', 水: '肾脏、泌尿' };
  return map[el] || '';
}
function getElementHealthHabit(el: string): string {
  const map: Record<string, string> = { 木: '早起舒展、养肝护眼', 火: '午间小憩、养心安神', 土: '规律饮食、健脾养胃', 金: '润肺呼吸、秋养肌肤', 水: '早睡养肾、御寒保阳' };
  return map[el] || '规律作息';
}

// 当前大运信息类型
interface CurrentDayun {
  element: string;
  score: number;
  year: number;
}

function FortuneCard({ cardKey, label, text, color, icon, dayMaster, dayElement, favorableElements, unfavorableElements, currentDayun }: { 
  cardKey: string; label: string; text: string; color: string; icon: React.ReactNode;
  dayMaster?: string; dayElement?: string; favorableElements?: string[]; unfavorableElements?: string[];
  currentDayun?: CurrentDayun;
}) {
  const [expanded, setExpanded] = useState(false);
  const details = dayMaster && dayElement ? generateFortuneDetails(cardKey, dayMaster, dayElement, favorableElements || [], unfavorableElements || [], currentDayun) : null;
  
  // 婚姻感情总结描述
  const getMarriageSummary = () => {
    if (cardKey !== 'marriage' || !currentDayun || !dayElement) return null;
    const score = currentDayun.score || 50;
    const element = currentDayun.element || dayElement;
    const elementNames: Record<string, string> = { wood: '木', fire: '火', earth: '土', metal: '金', water: '水' };
    const elName = elementNames[element] || element;
    
    let summary = '';
    if (score >= 70) {
      summary = `感情运势旺盛，${elName}气大运期间姻缘缘分强，单身者有望遇到正缘，已婚者感情和睦。`;
    } else if (score >= 55) {
      summary = `感情运势平稳，${elName}气大运期间以稳定发展为主，适合感情深入培养，已有伴侣者关系稳固。`;
    } else if (score >= 40) {
      summary = `感情运势略有波动，${elName}气大运期间需注意沟通，已有伴侣者需多用心经营感情。`;
    } else {
      summary = `感情运势较弱，${elName}气大运期间宜静心修性，不宜急于求成，可专注自我成长。`;
    }
    return summary;
  };

  const marriageSummary = getMarriageSummary();

  return (
    <motion.div whileHover={{ y: -3, scale: 1.01 }} transition={{ type: 'spring', stiffness: 400, damping: 25 }}>
      <div style={{
        padding: '24px',
        borderRadius: '20px',
        background: CARD_COLORS[cardKey]?.grad || PALETTE.coralLight,
        border: `1.5px solid ${(CARD_COLORS[cardKey]?.hex || css.accent) + '25'}`,
        boxShadow: `0 12px 24px ${(CARD_COLORS[cardKey]?.hex || css.accent)}22`,
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
        
        {/* 婚姻感情总结描述 */}
        {marriageSummary && (
          <div style={{
            marginTop: '12px',
            padding: '12px 14px',
            borderRadius: '12px',
            background: `linear-gradient(135deg, ${CARD_COLORS.marriage?.hex || '#9B6BFF'}15, ${CARD_COLORS.marriage?.hex || '#9B6BFF'}08)`,
            border: `1.5px solid ${CARD_COLORS.marriage?.hex || '#9B6BFF'}30`,
          }}>
            <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '13px', fontWeight: 600, color: CARD_COLORS.marriage?.hex || '#9B6BFF', margin: '0 0 4px 0' }}>
              💡 大运总结
            </p>
            <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '12px', lineHeight: 1.6, color: css.textSecondary, margin: 0 }}>
              {marriageSummary}
            </p>
          </div>
        )}
        
        {/* 查看详情按钮 */}
        {details && (
          <motion.button
            onClick={() => setExpanded(!expanded)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            style={{
              marginTop: '16px',
              padding: '10px 18px',
              borderRadius: '12px',
              border: `1.5px solid ${CARD_COLORS[cardKey]?.hex || css.accent}40`,
              background: `linear-gradient(135deg, ${(CARD_COLORS[cardKey]?.hex || css.accent)}14, #FFFFFF)`,
              color: CARD_COLORS[cardKey]?.hex || css.accent,
              fontFamily: 'Outfit, sans-serif',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              width: '100%',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
            }}
          >
            {expanded ? '收起详情' : '查看详情'}
            <motion.span animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
              ▼
            </motion.span>
          </motion.button>
        )}
        
        {/* 展开的详情内容 */}
        <AnimatePresence>
          {expanded && details && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              style={{ overflow: 'hidden' }}
            >
              <div style={{ paddingTop: '16px', marginTop: '16px', borderTop: `1px solid ${CARD_COLORS[cardKey]?.hex || css.accent}20` }}>
                {/* 有利事项 */}
                <div style={{ marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                    <span style={{ fontSize: '14px' }}>✅</span>
                    <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '13px', fontWeight: 700, color: '#059669' }}>有利事项</span>
                  </div>
                  {details.favorable.map((item, i) => (
                    <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                      <span style={{ color: '#059669', fontSize: '12px', flexShrink: 0 }}>•</span>
                      <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '12px', lineHeight: 1.6, color: css.textSecondary, margin: 0 }}>{item}</p>
                    </div>
                  ))}
                </div>
                
                {/* 注意事项 */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                    <span style={{ fontSize: '14px' }}>⚠️</span>
                    <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '13px', fontWeight: 700, color: '#DC2626' }}>注意事项</span>
                  </div>
                  {details.precautions.map((item, i) => (
                    <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                      <span style={{ color: '#DC2626', fontSize: '12px', flexShrink: 0 }}>•</span>
                      <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '12px', lineHeight: 1.6, color: css.textSecondary, margin: 0 }}>{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ─── 人生大运 K线图（参考图样式 - 一模一样复制） ─────────────────────────────
interface YearDetailAnalysis {
  ganZhi?: string;
  year?: number;
  yearScore?: number;
  career: { score: number; advice: string; tip: string };
  fortune: { score: number; advice: string; tip: string };
  marriage: { score: number; advice: string; tip: string };
  health: { score: number; advice: string; tip: string };
}

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
  summary: string;
  yearlyDetails?: YearDetailAnalysis[];
}

// 每年详细分析函数
function getYearDetailAnalysis(
  year: number,
  stem: string,
  yearElement: string,
  dayMaster: string,
  dayElement: string,
  favorableElements: string[],
  dayunScore: number,
  yearlyScore: number
): YearDetailAnalysis {
  const stemElements: Record<string, string> = { '甲': '木', '乙': '木', '丙': '火', '丁': '火', '戊': '土', '己': '土', '庚': '金', '辛': '金', '壬': '水', '癸': '水' };
  const stemProperties: Record<string, { nature: string; fortune: string; marriage: string; health: string }> = {
    '甲': { nature: '上进果敢', fortune: '正财稳健', marriage: '晚婚倾向', health: '肝胆注意' },
    '乙': { nature: '柔韧灵活', fortune: '流动理财', marriage: '缘分较广', health: '肝脏养护' },
    '丙': { nature: '热情奔放', fortune: '贵人进财', marriage: '热情主动', health: '心脏保健' },
    '丁': { nature: '内敛细腻', fortune: '偏财机遇', marriage: '暗恋较多', health: '心血管' },
    '戊': { nature: '厚重诚信', fortune: '积累致富', marriage: '稳重负责', health: '脾胃调理' },
    '己': { nature: '温厚包容', fortune: '稳定收入', marriage: '包容体贴', health: '消化系统' },
    '庚': { nature: '刚毅果断', fortune: '投资回收', marriage: '独立自主', health: '呼吸系统' },
    '辛': { nature: '精致内省', fortune: '创意生财', marriage: '追求完美', health: '肺部健康' },
    '壬': { nature: '聪明流动', fortune: '财运波动大', marriage: '浪漫多情', health: '泌尿系统' },
    '癸': { nature: '柔和智慧', fortune: '细水长流', marriage: '情感细腻', health: '肾脏保养' }
  };
  
  const prop = stemProperties[stem] || stemProperties['甲'];
  const yearEl = stemElements[stem] || '木';
  const isFavorable = favorableElements.includes(yearEl);
  
  // 使用传入的年份分数（已经包含年份微调）
  const finalScore = yearlyScore;
  
  // 事业分析
  const careerAdvices: Record<string, string[]> = {
    '木': ['宜开拓新领域', '有利职位晋升', '创业佳期'],
    '火': ['利名声传播', '贵人运旺盛', '利公开演讲'],
    '土': ['宜稳扎稳打', '利团队协作', '宜守成发展'],
    '金': ['利金融投资', '利决断执行', '利金属加工'],
    '水': ['利流动行业', '利水路运输', '利智慧产业']
  };
  const careerTip = (careerAdvices[yearEl] || ['宜循序渐进'])[stem.charCodeAt(0) % 3];
  
  // 生成确定性干支
  const branches = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
  const branchIndex = ((year - 1984) % 12 + 12) % 12;
  const ganZhi = stem + branches[branchIndex];
  
  // 各维度分数（基于年份种子微调±3分）
  const yearSeed = (year * 17 + stem.charCodeAt(0)) % 10;
  const careerScore = Math.max(20, Math.min(98, finalScore + (yearSeed % 7 - 3)));
  const fortuneScore = Math.max(20, Math.min(98, finalScore + ((yearSeed + 3) % 7 - 3)));
  const marriageScore = Math.max(20, Math.min(98, finalScore + ((yearSeed + 5) % 7 - 3)));
  const healthScore = Math.max(20, Math.min(98, finalScore + ((yearSeed + 7) % 7 - 3)));
  
  return {
    ganZhi,
    year,
    yearScore: finalScore,
    career: { score: careerScore, advice: `${prop.nature}，${careerTip}`, tip: isFavorable ? '用神到位，事半功倍' : '需多付出努力' },
    fortune: { score: fortuneScore, advice: `${prop.fortune}，${yearEl}年${isFavorable ? '财运较佳' : '需谨慎理财'}`, tip: year % 2 === 0 ? '上半年较好' : '下半年较佳' },
    marriage: { score: marriageScore, advice: `${prop.marriage}，${yearElement}年感情${year % 2 === 0 ? '活跃' : '平稳'}`, tip: '春季桃花旺' },
    health: { score: healthScore, advice: `${prop.health}，注意${yearEl === '火' ? '心火旺盛' : yearEl === '水' ? '寒湿入侵' : '劳逸结合'}`, tip: '保持规律作息' }
  };
}

function generateCandlestickData(dayunData: DayunData[], dayMaster?: string, dayElement?: string, favorableElements?: string[]): CandlestickData[] {
  return dayunData.map((d, i) => {
    const prev = i > 0 ? dayunData[i - 1].score : d.score;
    const open = Math.min(prev, d.score);
    const close = Math.max(prev, d.score);
    const high = d.score + 8;
    const low = Math.max(20, Math.min(prev, d.score) - 8);
    const favorable = d.score >= 55;
    const element = d.element;
    const isUp = d.score >= prev;
    
    // 简化的运势总结
    const summary = isUp 
      ? `${d.ganZhi}大运，${ELEMENT_NAMES[element]}气旺盛，运势上扬，宜积极进取。`
      : `${d.ganZhi}大运，${ELEMENT_NAMES[element]}气受制，需谨慎行事，稳中求进。`;
    const desc = `${d.ganZhi}大运`;

    // 生成十年中每年的详细分析（与大运分数关联，但每年有变化）
    const yearlyDetails: YearDetailAnalysis[] = [];
    for (let y = 0; y < 10; y++) {
      const year = d.year + y;
      const ganZhi = getLiuNianGanZhi(year);
      const stem = ganZhi[0] || '甲';
      const stemToElement: Record<string, string> = { '甲': '木', '乙': '木', '丙': '火', '丁': '火', '戊': '土', '己': '土', '庚': '金', '辛': '金', '壬': '水', '癸': '水' };
      const yearElement = stemToElement[stem] || '木';
      
      // 每年分数 = 大运分数 + 基于年份的微调（±10分范围）
      const yearVariation = ((year * 13 + stem.charCodeAt(0)) % 21) - 10;
      const yearlyScore = Math.max(20, Math.min(98, d.score + yearVariation));
      
      yearlyDetails.push(getYearDetailAnalysis(year, stem, yearElement, dayMaster || '甲', dayElement || '木', favorableElements || [], d.score, yearlyScore));
    }

    return { ...d, open, close, high, low, favorable, summary, desc, yearlyDetails };
  });
}

// 获取流年干支
function getLiuNianGanZhi(year: number): string {
  const baseYear = 1984; // 甲子年
  const offset = year - baseYear;
  const ganIndex = ((offset % 10) + 10) % 10;
  const zhiIndex = ((offset % 12) + 12) % 12;
  const tiangan = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
  const dizhi = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
  return tiangan[ganIndex] + dizhi[zhiIndex];
}

// 参考图样式K线图组件
function DayunKLineChart({ data, startAge, userInfo, dayMaster, dayElement, favorableElements }: { 
  data: CandlestickData[]; startAge: number; userInfo: UserBirthInfo;
  dayMaster?: string; dayElement?: string; favorableElements?: string[];
}) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [showYearlyChart, setShowYearlyChart] = useState(false);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);

  // 生成每年流年运势波动图数据（确定性）
  const generateYearlyData = (dayun: CandlestickData) => {
    const yearlyData = [];
    for (let i = 0; i < 12; i++) {
      const seed = (dayun.year + i) * 11 % 100;
      const baseScore = dayun.score + (seed % 40 - 20);
      const monthScores = [];
      for (let m = 0; m < 12; m++) {
        const monthSeed = (dayun.year + i) * 13 + m * 7;
        const variation = (monthSeed % 30 - 15) + (m % 3 === 0 ? 5 : 0);
        monthScores.push(Math.max(20, Math.min(100, Math.round(baseScore + variation))));
      }
      const yearScore = Math.round(monthScores.reduce((a, b) => a + b, 0) / 12);
      const ganZhi = getLiuNianGanZhi(dayun.year + i);
      const stem = ganZhi[0] || '甲';
      const stemToElement: Record<string, string> = { '甲': '木', '乙': '木', '丙': '火', '丁': '火', '戊': '土', '己': '土', '庚': '金', '辛': '金', '壬': '水', '癸': '水' };
      const yearElement = stemToElement[stem] || '木';
      
      yearlyData.push({
        year: dayun.year + i,
        age: dayun.age + i,
        ganZhi,
        scores: monthScores,
        yearScore,
        favorable: yearScore >= 55,
        yearlyDetails: { ...getYearDetailAnalysis(dayun.year + i, stem, yearElement, dayMaster || '甲', dayElement || '木', favorableElements || [], yearScore), ganZhi, yearScore },
      });
    }
    return yearlyData;
  };

  // 获取流年运势总结
  const getYearSummary = (year: number, stem: string, score: number, dayMasterElement: string) => {
    const summaries: Record<string, { good: string[]; bad: string[]; tip: string }> = {
      '甲': { good: ['事业突破', '财运上升', '贵人相助'], bad: ['健康波动', '小人是非'], tip: '木气旺盛，宜进取拓展' },
      '乙': { good: ['感情顺利', '学业进步', '艺术创作'], bad: ['财务破耗', '犹豫不决'], tip: '木气柔和，宜稳中求进' },
      '丙': { good: ['名望提升', '社交活跃', '贵人扶持'], bad: ['脾气急躁', '口舌是非'], tip: '火气旺盛，宜低调行事' },
      '丁': { good: ['财运进门', '感情升温', '智慧增长'], bad: ['身体疲惫', '压力增大'], tip: '火气内敛，宜积蓄能量' },
      '戊': { good: ['事业稳固', '房产运佳', '积蓄增多'], bad: ['投资保守', '缺乏变动'], tip: '土气厚重，宜守成持重' },
      '己': { good: ['财运稳定', '合作顺利', '思想成熟'], bad: ['健康注意', '情绪低落'], tip: '土气包容，宜蓄势待发' },
      '庚': { good: ['事业转折', '财运大旺', '魄力增强'], bad: ['人际紧张', '冲动决策'], tip: '金气刚健，宜果断行动' },
      '辛': { good: ['财运进门', '技艺精进', '相貌堂堂'], bad: ['压力山大', '变动频繁'], tip: '金气精纯，宜打磨技艺' },
      '壬': { good: ['智慧开阔', '财运亨通', '远行有利'], bad: ['计划赶不上变化', '驿马奔波'], tip: '水气流动，宜灵活应变' },
      '癸': { good: ['事业稳步', '感情甜蜜', '健康良好'], bad: ['缺乏信心', '机会难把握'], tip: '水气内敛，宜修身养性' },
    };
    const stemData = summaries[stem] || summaries['甲'];
    const isGood = score >= 55;
    return {
      isGood,
      score,
      stem,
      ...stemData,
      overall: isGood ? `流年${stem}气旺盛，整体运势向好` : `流年${stem}气平淡，需稳扎稳打`,
    };
  };

  // 生成每年详细分析（事业/财运投资/婚姻感情/健康）- 确定性版本
  const getYearDetailAnalysis = (year: number, stem: string, element: string, dayMaster: string, dayElement: string, favorableElements: string[], score: number) => {
    const stemToElement: Record<string, string> = { '甲': '木', '乙': '木', '丙': '火', '丁': '火', '戊': '土', '己': '土', '庚': '金', '辛': '金', '壬': '水', '癸': '水' };
    const yearElement = stemToElement[stem] || '木';
    const isFavorable = favorableElements.includes(yearElement);
    const isGood = score > 50;
    
    // 确定性分数（基于年份种子）
    const seed = year * 17 % 100;
    const careerScore = isGood ? Math.round(60 + (seed % 30)) : Math.round(35 + (seed % 20));
    const fortuneScore = isGood ? Math.round(65 + (seed % 25)) : Math.round(30 + (seed % 20));
    const marriageScore = isGood ? Math.round(55 + (seed % 35)) : Math.round(30 + (seed % 25));
    const healthScore = isGood ? Math.round(60 + (seed % 30)) : Math.round(35 + (seed % 25));
    
    // 事业分析
    const career = {
      score: careerScore,
      advice: (() => {
        if (yearElement === '木') return isGood ? '木气生发，文创、教育、策划领域发展顺利，宜主动出击争取机会' : '木气受制，不宜冒进，适合稳固基础、沉淀学习';
        if (yearElement === '火') return isGood ? '火气旺事业名声，领导赏识，职场表现机会多，宜把握展示自我的舞台' : '火气过旺则易冲动，注意职场人际，避免口舌是非';
        if (yearElement === '土') return isGood ? '土气厚重，房产、建筑、农业或传统行业有进展，宜稳扎稳打积累资源' : '土气压抑，不宜大动，适合内部调整或学习进修';
        if (yearElement === '金') return isGood ? '金气刚健，金融、法律、管理领域有机会，利于投资决策和商务谈判' : '金气过强则财务压力大，谨慎投资合作，避免冲动决策';
        if (yearElement === '水') return isGood ? '水气流动，贸易、物流、互联网、咨询行业有利，利于出差远行和跨界合作' : '水气过旺则变动频繁，职业方向可能有调整，灵活应对';
        return '事业运势平稳发展';
      })(),
      tip: isGood ? '🌟 把握机遇，敢于争取' : '💡 稳扎稳打，积累经验'
    };
    
    // 财运投资分析
    const fortune = {
      score: fortuneScore,
      advice: (() => {
        if (yearElement === '金') return isGood ? '金为财星，财运极佳！正财偏财均有收获，投资理财可适当参与，但需分散风险' : '金气受制，财务紧张，捂紧钱袋子，避免大额投资和高风险投资';
        if (yearElement === '木') return isGood ? '木能生财，才华变现的好年份，适合开展副业或技能变现，亦有贵人财' : '木气克土，可能有破财风险，控制不必要的开支';
        if (yearElement === '水') return isGood ? '水为财源，流动资金充裕，财运亨通，利于金融投资和流动性资产配置' : '水气过旺则财来财去，做好财务规划，避免月光';
        if (yearElement === '火') return isGood ? '火土相生，正财稳定，副业有机会，但不宜投机，保持稳健理财' : '火气过旺则开销增大，注意控制消费冲动';
        if (yearElement === '土') return isGood ? '土气藏金，储蓄积累有利，房产土地投资或长期持有型理财表现较好' : '土气受制，不动产投资需谨慎，避免重资产配置';
        return '财务状况一般，量入为出';
      })(),
      tip: isGood ? '💰 正偏财皆有收获，合理配置' : '⚠️ 控制支出，稳健理财'
    };
    
    // 婚姻感情分析
    const marriage = {
      score: marriageScore,
      advice: (() => {
        const marriageStyles: Record<string, string> = { 木: '细腻守护型', 火: '热情主导型', 土: '稳重包容型', 金: '理性独立型', 水: '浪漫灵动型' };
        const style = marriageStyles[dayElement] || '均衡型';
        if (yearElement === '水') return isGood ? '水为桃花，感情缘分旺盛！单身者有望遇到正缘，已婚者感情甜蜜，是增进感情的好年份' : '水气过旺则感情复杂，单身者桃花多但不专，需明辨真情，已婚者需防范第三者';
        if (yearElement === '木') return isGood ? '木气生发，感情种子萌发，适合相亲、表白、订婚，感情进展顺利' : '木气受制，感情进展缓慢，单身者宜主动，已婚者多沟通';
        if (yearElement === '火') return isGood ? '火气热情，感情表达直接炽热，适合约会、婚礼等浪漫活动，感情升温快' : '火气过旺则情绪波动大，情侣间易争吵，已婚者注意口角';
        if (yearElement === '金') return isGood ? '金气理性，感情务实稳定，适合谈婚论嫁或同居试婚，关系走向成熟' : '金气受制则感情冷淡疏离，需要更多耐心和沟通';
        if (yearElement === '土') return isGood ? '土气稳重，感情深厚绵长，已婚者家庭和睦，单身者缘分来自熟人介绍' : '土气沉闷，感情生活较平淡，但稳定踏实';
        return '感情运势一般，顺其自然';
      })(),
      tip: isGood ? '❤️ 正缘概率高，把握时机' : '🌱 缘分未到，耐心等待'
    };
    
    // 健康身体分析
    const health = {
      score: healthScore,
      advice: (() => {
        if (yearElement === '木') return isGood ? '木气旺盛，注意肝胆健康，少熬夜生闷气，适当运动疏肝理气' : '木气受制，肝胆易出问题，避免熬夜和情绪压抑，有不适及时就医';
        if (yearElement === '火') return isGood ? '火气司心，心脏血液系统活跃，注意休息和防晒，避免过度兴奋' : '火气过旺则心火旺、心烦失眠，注意养心安神，控制情绪';
        if (yearElement === '土') return isGood ? '土气化湿，脾胃运化良好，注意规律饮食，少吃生冷油腻' : '土气受制，脾胃功能较弱，消化不良或食欲不振，注意养护肠胃';
        if (yearElement === '金') return isGood ? '金气主肺，呼吸系统顺畅，注意润肺护喉，流感季节加强防护' : '金气受制，肺呼吸道敏感，易感冒咳嗽，减少在污染环境久留';
        if (yearElement === '水') return isGood ? '水气充盈，肾泌尿系统良好，早睡养肾，注意御寒保暖' : '水气过旺则肾气消耗，疲劳乏力，注意休息和保暖，避免过度劳累';
        return '健康状况一般，注意保养';
      })(),
      tip: isGood ? '🏃 精力充沛，可加强锻炼' : '⚕️ 注重养生，定期体检'
    };
    
    return { career, fortune, marriage, health };
  };

  const selectedDayun = selectedIndex !== null ? data[selectedIndex] : null;
  const yearlyData = selectedDayun ? generateYearlyData(selectedDayun) : [];

  // K线图与卡片横向对齐的参数
  const itemWidth = 100;     // 每个大运项宽度（蜡烛+下方卡片一致）
  const gap = 16;            // 间距
  const chartHeight = 200;    // K线图高度
  const paddingLeft = 20;     // 左边距
  const paddingRight = 20;    // 右边距
  const paddingTop = 20;
  const paddingBottom = 50;   // 底部给标签留空间
  const minScore = 0;         // Y轴0-100
  const maxScore = 100;

  const scaleY = (v: number) =>
    paddingTop + ((maxScore - v) / (maxScore - minScore)) * (chartHeight - paddingTop - paddingBottom);

  const totalWidth = paddingLeft + data.length * itemWidth + (data.length - 1) * gap + paddingRight;

  // 颜色：参考图风格（红涨绿跌）
  const UP_COLOR = '#E74C3C';      // 上涨红色
  const DOWN_COLOR = '#27AE60';    // 下跌绿色
  const MA_COLOR = '#E67E22';      // 均线橙色
  const GRID_COLOR = '#E8E8E8';    // 网格线浅灰
  const TEXT_COLOR = '#999999';    // 文字灰色
  const LABEL_COLOR = '#666666';   // 标签颜色

  return (
    <div style={{ width: '100%', background: `linear-gradient(145deg, ${css.accent}0A, ${PALETTE.orange}08 48%, #FFFFFF)`, borderRadius: '12px', border: `1px solid ${css.accent}1F`, boxShadow: `0 10px 20px ${css.accent}18` }}>
      {/* ── 标题栏 ── */}
      <div style={{ padding: '16px 16px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: '18px', fontWeight: 700, color: '#333333' }}>
            大运走势K线图
          </div>
          <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: '12px', color: '#999999', marginTop: '4px' }}>
            起运年龄: {Math.round(startAge)}岁 · 每步大运10年
          </div>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          padding: '6px 12px', background: 'linear-gradient(135deg, #ECFDF5, #F0F9FF)', borderRadius: '16px', border: '1px solid #A7F3D0'
        }}>
          <div style={{ width: '8px', height: '8px', background: '#52C41A', borderRadius: '50%' }} />
          <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '12px', color: '#52C41A' }}>已解锁</span>
        </div>
      </div>

      {/* ── K线图 ── */}
      <div style={{ width: '100%', overflowX: 'auto', padding: '8px 16px' }}>
        <svg
          width={totalWidth}
          height={chartHeight}
          style={{ display: 'block', minWidth: totalWidth }}
        >
          {/* ── 网格线（横向虚线） ── */}
          {[0, 25, 50, 75, 100].map(v => (
            <g key={v}>
              <line
                x1={paddingLeft} y1={scaleY(v)} x2={totalWidth - paddingRight} y2={scaleY(v)}
                stroke={GRID_COLOR} strokeWidth={1} strokeDasharray="4 4"
              />
              {/* 左侧Y轴刻度 */}
              <text
                x={paddingLeft - 6} y={scaleY(v) + 4}
                textAnchor="end"
                style={{ fontFamily: 'Outfit, sans-serif', fontSize: 9, fill: TEXT_COLOR }}
              >
                {v}
              </text>
            </g>
          ))}

          {/* ── 均线（圆点连线） ── */}
          {data.map((d, i) => {
            const x = paddingLeft + i * (itemWidth + gap) + itemWidth / 2;
            const prev = i > 0 ? data[i - 1] : null;
            if (!prev) return (
              <circle key={`ma-${i}`} cx={x} cy={scaleY(d.score)} r={3} fill={MA_COLOR} />
            );
            const prevX = paddingLeft + (i - 1) * (itemWidth + gap) + itemWidth / 2;
            return (
              <g key={`ma-${i}`}>
                <line x1={prevX} y1={scaleY(prev.score)} x2={x} y2={scaleY(d.score)} stroke={MA_COLOR} strokeWidth={1.5} />
                <circle cx={x} cy={scaleY(d.score)} r={3} fill={MA_COLOR} />
              </g>
            );
          })}

          {/* ── 蜡烛 ── */}
          {data.map((d, i) => {
            const x = paddingLeft + i * (itemWidth + gap);
            const cx = x + itemWidth / 2;
            const bodyTop = scaleY(Math.max(d.open, d.close));
            const bodyBottom = scaleY(Math.min(d.open, d.close));
            const bodyH = Math.max(bodyBottom - bodyTop, 10);
            const wickTop = scaleY(d.high);
            const wickBottom = scaleY(d.low);
            // 60分以上红色（吉运），60分以下绿色（平/逆）
            const color = d.score >= 60 ? UP_COLOR : DOWN_COLOR;
            const isSelected = selectedIndex === i;

            return (
              <g key={d.ganZhi} onClick={() => setSelectedIndex(i)} style={{ cursor: 'pointer' }}>
                {/* 选中高亮背景 */}
                {isSelected && (
                  <rect
                    x={x} y={paddingTop - 5}
                    width={itemWidth} height={chartHeight - paddingTop - paddingBottom + 15}
                    fill="rgba(230,126,34,0.08)" rx={4}
                  />
                )}
                {/* 影线 */}
                <line x1={cx} y1={wickTop} x2={cx} y2={bodyTop} stroke={color} strokeWidth={1.5} />
                <line x1={cx} y1={bodyBottom} x2={cx} y2={wickBottom} stroke={color} strokeWidth={1.5} />
                {/* 蜡烛体 */}
                <rect
                  x={x + 30} y={bodyTop} width={itemWidth - 60} height={bodyH}
                  fill={color} rx={2}
                />
                {/* X轴标签：年龄 */}
                <text
                  x={cx} y={chartHeight - 28}
                  textAnchor="middle"
                  style={{ fontFamily: 'Outfit, sans-serif', fontSize: 11, fontWeight: 500, fill: LABEL_COLOR }}
                >
                  {Math.round(d.age)}岁
                </text>
                {/* X轴标签：干支 */}
                <text
                  x={cx} y={chartHeight - 14}
                  textAnchor="middle"
                  style={{ fontFamily: 'Outfit, sans-serif', fontSize: 10, fill: TEXT_COLOR }}
                >
                  {d.ganZhi}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* ── 大运详解列表（横向对齐） ── */}
      <div style={{ padding: '16px', borderTop: '1px solid #F0F0F0' }}>
        <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: '16px', fontWeight: 700, color: '#333333', marginBottom: '12px' }}>
          大运详解
        </div>
        {/* 横向滚动卡片列表 */}
        <div style={{ display: 'flex', gap: `${gap}px`, overflowX: 'auto', paddingBottom: '8px' }}>
          {data.map((d, i) => {
            const isSelected = selectedIndex === i;
            // 判断是否未来大运（结束年份 > 当前年份2026）
            const isFuture = d.year > 2026;
            // 60分以上红色（吉运），60分以下绿色（平/逆）
            const color = d.score >= 60 ? UP_COLOR : DOWN_COLOR;
            return (
              <div
                key={`detail-${i}`}
                onClick={() => {
                  if (isFuture) {
                    // 未来大运：显示待解锁提示
                    alert(`${d.year}-${d.yearEnd}年 ${d.ganZhi}大运尚未到来，点击详解待解锁`);
                    return;
                  }
                  setSelectedIndex(i);
                }}
                style={{
                  flexShrink: 0,
                  width: `${itemWidth}px`,
                  padding: '14px 10px',
                  background: isFuture ? '#F5F5F5' : (isSelected ? (d.score >= 60 ? '#FFF0EE' : '#F0FFF4') : '#FAFAFA'),
                  borderRadius: '10px',
                  border: isFuture ? '1px solid #E0E0E0' : (isSelected ? `1px solid ${color}40` : '1px solid transparent'),
                  cursor: isFuture ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  opacity: isFuture ? 0.7 : 1,
                }}
              >
                {/* 年龄范围 */}
                <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: '12px', fontWeight: 700, color: isFuture ? '#AAAAAA' : '#333333', marginBottom: '2px' }}>
                  {Math.round(d.age)}-{Math.round(d.endAge)}岁
                </div>
                {/* 干支 */}
                <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: '11px', color: isFuture ? '#CCCCCC' : '#999999', marginBottom: '6px' }}>
                  {d.ganZhi}
                </div>
                {/* 年份 */}
                <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: '10px', color: '#BBBBBB', marginBottom: '8px' }}>
                  {d.year}-{d.yearEnd}年
                </div>
                {/* 分数 */}
                <div style={{
                  fontFamily: 'Outfit, sans-serif', fontSize: '18px', fontWeight: 800,
                  color: isFuture ? '#CCCCCC' : color,
                  marginBottom: '6px',
                }}>
                  {isFuture ? '🔒' : `${d.score}分`}
                </div>
                {/* 详情 */}
                <div style={{
                  fontFamily: 'Outfit, sans-serif', fontSize: '11px', color: '#999999',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                }}>
                  <span>{isFuture ? '待解锁' : (isSelected ? '收起' : '详情')}</span>
                  {!isFuture && <span style={{ transform: isSelected ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}>›</span>}
                </div>
              </div>
            );
          })}
        </div>

        {/* ── 展开详情：每年流年运势波动图 ── */}
        {selectedDayun && (
          <motion.div
            id="sec-liuyear"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            style={{ marginTop: '20px', borderTop: '1px dashed #E8E8E8', paddingTop: '20px' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div>
                <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: '15px', fontWeight: 700, color: '#333333' }}>
                  {selectedDayun.ganZhi} 大运 · 每年流年走势
                </div>
                <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: '12px', color: '#999999', marginTop: '4px' }}>
                  {selectedDayun.year}-{selectedDayun.yearEnd}年 · 点击查看详情
                </div>
              </div>
              <button
                onClick={() => { setSelectedIndex(null); setShowYearlyChart(false); }}
                style={{
                  padding: '6px 14px',
                  background: '#F5F5F5',
                  border: 'none',
                  borderRadius: '16px',
                  fontFamily: 'Outfit, sans-serif',
                  fontSize: '12px',
                  color: '#666666',
                  cursor: 'pointer',
                }}
              >
                收起
              </button>
            </div>

            {/* 十年综合运势总结 */}
            <div style={{ 
              padding: '16px 20px', 
              background: 'linear-gradient(135deg, rgba(255,107,157,0.08) 0%, rgba(255,157,107,0.08) 100%)',
              borderRadius: '16px', 
              border: '1px solid rgba(255,107,157,0.15)',
              marginBottom: '16px'
            }}>
              <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: '13px', fontWeight: 700, color: '#FF6B9D', marginBottom: '8px' }}>
                📊 这十年运势总评
              </div>
              <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '12px', color: '#666666', lineHeight: 1.8, margin: 0 }}>
                {(() => {
                  if (yearlyData.length === 0) return '暂无十年运势数据';
                  const avgScore = yearlyData.reduce((sum, y) => sum + y.yearScore, 0) / yearlyData.length;
                  const bestYear = yearlyData.reduce((best, y) => y.yearScore > best.yearScore ? y : best, yearlyData[0]);
                  const worstYear = yearlyData.reduce((worst, y) => y.yearScore < worst.yearScore ? y : worst, yearlyData[0]);
                  const dayunStem = selectedDayun?.ganZhi?.[0] || '甲';
                  const stemToElement: Record<string, string> = { '甲': '木', '乙': '木', '丙': '火', '丁': '火', '戊': '土', '己': '土', '庚': '金', '辛': '金', '壬': '水', '癸': '水' };
                  const element = stemToElement[dayunStem];
                  
                  let overall = '';
                  if (avgScore >= 75) overall = `这十年整体运势非常旺盛，是人生发展的黄金期。`;
                  else if (avgScore >= 65) overall = `这十年运势较好，机遇与挑战并存，宜积极进取。`;
                  else if (avgScore >= 55) overall = `这十年运势平稳，稳扎稳打可有所收获。`;
                  else if (avgScore >= 45) overall = `这十年运势有所波动，宜守不宜攻，谨慎行事。`;
                  else overall = `这十年运势较低，建议韬光养晦，积累等待时机。`;
                  
                  let elementTip = '';
                  if (element === '木') elementTip = '大运见木，利文书学业、创业发展';
                  else if (element === '火') elementTip = '大运见火，利名声地位、社交人脉';
                  else if (element === '土') elementTip = '大运见土，利房产田产、稳定积累';
                  else if (element === '金') elementTip = '大运见金，利财运投资、事业突破';
                  else elementTip = '大运见水，利智慧流通、变通发展';
                  
                  return `${overall} ${bestYear?.year}年运势最佳，是把握机遇的关键年份；${worstYear?.year}年需特别注意。${elementTip}。`;
                })()}
              </p>
            </div>

            {/* 每年详细分析 - 四维卡片 */}
            <div style={{ marginTop: '16px', padding: '14px', background: 'linear-gradient(135deg, #F8F9FC 0%, #F0F4FF 100%)', borderRadius: '14px', border: '1px solid #E8EAF0' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '14px', fontWeight: 700, color: '#6366F1' }}>📅 每年详细运势</span>
                <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '11px', color: '#999999' }}>点击卡片展开详情</span>
              </div>
              
              {/* 十年概览网格 */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px', marginBottom: '12px' }}>
                {selectedDayun?.yearlyDetails?.map((year: any, idx: number) => {
                  const stem = year.ganZhi?.[0] || '甲';
                  const yearScore = year.yearScore || 50;
                  const isGoodYear = yearScore > 50;
                  const cardColor = selectedDayun.score >= 60 ? '#E74C3C' : '#27AE60';
                  const bgColor = selectedYear === idx ? cardColor + '20' : (isGoodYear ? '#FFEBEE' : '#E8F5E9');
                  const borderColor = selectedYear === idx ? cardColor : (isGoodYear ? '#EF9A9A' : '#A5D6A7');
                  return (
                    <div 
                      key={idx} 
                      style={{ 
                        padding: '8px 4px', borderRadius: '8px', textAlign: 'center',
                        background: bgColor,
                        border: `1px solid ${borderColor}`,
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onClick={() => setSelectedYear(selectedYear === idx ? null : idx)}
                    >
                      <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: '11px', fontWeight: 600, color: '#333' }}>{year.year || 2020}</div>
                      <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: '12px', fontWeight: 700, color: isGoodYear ? '#E74C3C' : '#27AE60' }}>{yearScore}</div>
                    </div>
                  );
                })}
              </div>
              
              {/* 选中年份的详细分析 */}
              {selectedYear !== null && selectedDayun?.yearlyDetails?.[selectedYear] && (() => {
                const year = selectedDayun.yearlyDetails[selectedYear];
                const stem = year.ganZhi?.[0] || '甲';
                const ganZhi = year.ganZhi || stem + '子';
                const yearScore = year.yearScore || 50;
                const isGoodYear = yearScore >= 55;
                const detailColors: Record<string, string> = { career: '#FF9D6B', fortune: '#D4A000', marriage: '#FF6B9D', health: '#00C47A' };
                const detailLabels: Record<string, string> = { career: '📈 事业', fortune: '💰 财运投资', marriage: '❤️ 婚姻感情', health: '💪 健康身体' };
                
                return (
                  <div style={{ 
                    padding: '16px', background: '#FFFFFF', borderRadius: '12px', 
                    border: '1px solid #E8EAF0',
                    animation: 'fadeIn 0.3s ease'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '18px', fontWeight: 700, color: '#333' }}>{year.year}年</span>
                        <span style={{ 
                          padding: '4px 10px', borderRadius: '9999px', fontSize: '12px', fontWeight: 600,
                          background: isGoodYear ? '#FFEBEE' : '#E8F5E9', 
                          color: isGoodYear ? '#E74C3C' : '#27AE60'
                        }}>{ganZhi}</span>
                      </div>
                      <div 
                        onClick={() => setSelectedYear(null)}
                        style={{ cursor: 'pointer', padding: '4px', color: '#999' }}
                      >✕</div>
                    </div>
                    
                    {/* 四维详细分析 */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                      {['career', 'fortune', 'marriage', 'health'].map((key) => {
                        const item = (year as any)[key] || { score: 50, advice: '', tip: '' };
                        const isHigh = item.score > 50;
                        return (
                          <div key={key} style={{ 
                            padding: '12px', borderRadius: '10px',
                            background: `${detailColors[key]}10`,
                            border: `1px solid ${detailColors[key]}30`
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                              <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '12px', fontWeight: 600, color: detailColors[key] }}>
                                {detailLabels[key]}
                              </span>
                              <span style={{ 
                                fontFamily: 'Outfit, sans-serif', fontSize: '14px', fontWeight: 700,
                                color: isHigh ? '#2E7D32' : '#E65100'
                              }}>{isHigh ? '↑' : '↓'}</span>
                            </div>
                            <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '11px', color: '#555', margin: '0 0 4px 0', lineHeight: 1.4 }}>
                              {item.advice || '运势平稳，按部就班'}
                            </p>
                            <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '10px', color: '#888', margin: 0, lineHeight: 1.4 }}>
                              💡 {item.tip || '保持当前节奏'}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                    
                    {/* 年度总结 */}
                    <div style={{ marginTop: '12px', padding: '10px', background: '#F8F9FC', borderRadius: '8px' }}>
                      <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '12px', color: '#333', margin: 0, lineHeight: 1.5 }}>
                        <strong>流年总结：</strong>{isGoodYear 
                          ? `此年流年${ganZhi}，五行流通，整体运势向好，把握机遇可有所突破` 
                          : `此年流年${ganZhi}，需稳扎稳打，低调行事，避免激进决策`
                        }
                      </p>
                    </div>
                  </div>
                );
              })()}
              
              {selectedYear === null && (
                <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '11px', color: '#999', textAlign: 'center', margin: '8px 0 0 0' }}>
                  👆 点击上方年份卡片查看详细分析
                </p>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

// 十年详细运势卡片（备用）
function DecadeCard({ data, index }: { data: CandlestickData; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
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
            {data.year}–{data.yearEnd}年 · {Math.round(data.age)}–{Math.round(data.endAge)}岁
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
              { icon: '📈', label: '事业', text: isUp ? `这十年事业蒸蒸日上！${data.ganZhi}大运带着${ELEMENT_NAMES[data.element]}气，工作上会有突破。${data.score >= 75 ? '是换工作、晋升、创业的好时机，大胆往前冲！' : data.score >= 65 ? '稳中有升，做好本职工作同时可以尝试新方向。' : '虽然不是大爆发，但积累期，做好规划很重要。'}` : `这十年事业处于调整阶段。${data.ganZhi}大运中${ELEMENT_NAMES[data.element]}气不是你的用神，别急着扩张。${data.score >= 45 ? '可以趁这时候学点新技能，为以后做准备。' : '有点难熬，但也是沉淀自己的好时机，别放弃！'}`, color: '#FF9D6B' },
              { icon: '💰', label: '财运投资', text: isUp ? `财运来了挡不住！${data.ganZhi}这步大运正财偏财都不错。${data.element === 'metal' || data.element === 'water' ? '理财投资可以适当参与，但别贪。' : data.element === 'wood' || data.element === 'fire' ? '才华变现的好时候，可以发展副业。' : '正财为主，稳扎稳打存钱。'}${data.score >= 75 ? '财库大开，储蓄和投资都能有收获！' : '财务状况改善，注意别乱花钱就行。'}` : `这十年花钱的地方会比较多。${data.ganZhi}大运中${ELEMENT_NAMES[data.element]}气偏弱，${data.element === 'metal' ? '破财可能性大，谨慎投资，捂紧钱袋子。' : data.element === 'water' ? '财务流动大，做好预算管理，别月光！' : data.element === 'wood' ? '可能有意外开支，提前存一笔应急钱。' : data.element === 'fire' ? '感情和人际上花费可能增多，理性消费。' : '稳健为主，大额支出前多考虑几天。'}`, color: '#D4A000' },
              { icon: '💪', label: '健康身体', text: isUp ? `身体状态棒棒的！${data.ganZhi}这十年精力充沛。${data.element === 'wood' ? '注意肝胆，少熬夜生闷气。' : data.element === 'fire' ? '心脏和眼睛要多休息，别太拼。' : data.element === 'earth' ? '肠胃容易出问题，少吃外卖冷饮。' : data.element === 'metal' ? '呼吸系统敏感，流感季节多注意。' : '肾气消耗大，早睡是养生第一要义。'}趁着运势好多运动，把身体底子打好！` : `健康要上心了。${data.ganZhi}大运中${ELEMENT_NAMES[data.element]}气对${data.element === 'wood' ? '肝胆' : data.element === 'fire' ? '心脑血管' : data.element === 'earth' ? '脾胃' : data.element === 'metal' ? '肺呼吸道' : '肾泌尿'}系统不太友好。${data.score >= 45 ? '有不舒服及时看，别硬扛。' : '建议每年体检，平时注意休息和营养。'}`, color: '#00C47A' },
              { icon: '❤️', label: '婚姻感情', text: isUp ? `感情运势旺盛！${data.ganZhi}大运期间感情缘分较好。${data.element === 'water' ? '桃花运旺，单身者有望遇到正缘，已婚者感情甜蜜。' : data.element === 'metal' ? '感情务实稳定，适合谈婚论嫁。' : data.element === 'wood' ? '木气生发感情种子，适合相亲表白。' : data.element === 'fire' ? '热情高涨，感情升温快，浪漫活动增多。' : '感情稳定深厚，适合细水长流的感情经营。'}趁运势好多参加社交活动！` : `感情需要更多耐心经营。${data.ganZhi}大运中${ELEMENT_NAMES[data.element]}气，${data.element === 'water' ? '桃花虽多但需明辨真情，避免感情纠葛。' : data.element === 'metal' ? '感情可能较冷淡疏离，需要更多沟通。' : data.element === 'wood' ? '感情进展缓慢，不宜操之过急。' : data.element === 'fire' ? '情绪波动大，需注意控制脾气。' : '感情生活较平淡，专注自我成长也不错。'}`, color: '#FF6B9D' },
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
          
          {/* 每年详细分析 - 完整版 */}
          <div style={{ marginTop: '16px', padding: '14px', background: 'linear-gradient(135deg, #F8F9FC 0%, #F0F4FF 100%)', borderRadius: '14px', border: '1px solid #E8EAF0' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '14px', fontWeight: 700, color: '#6366F1' }}>📅 每年详细运势</span>
              <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '11px', color: '#999999' }}>点击卡片展开详情</span>
            </div>
            
            {/* 十年概览网格 */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px', marginBottom: '12px' }}>
              {data.yearlyDetails?.map((year: any, idx: number) => {
                const stem = year.ganZhi?.[0] || '甲';
                const stemToElement: Record<string, string> = { '甲': '木', '乙': '木', '丙': '火', '丁': '火', '戊': '土', '己': '土', '庚': '金', '辛': '金', '壬': '水', '癸': '水' };
                const yearElement = stemToElement[stem] || '木';
                const yearScore = year.yearScore || 50;
                const isGoodYear = yearScore >= 55;
                return (
                  <div 
                    key={idx} 
                    style={{ 
                      padding: '8px 4px', borderRadius: '8px', textAlign: 'center',
                      background: selectedYear === idx ? color + '20' : (isGoodYear ? '#E8F5E9' : '#FFF8E1'),
                      border: `1px solid ${selectedYear === idx ? color : (isGoodYear ? '#A5D6A7' : '#FFE082')}`,
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onClick={() => setSelectedYear(selectedYear === idx ? null : idx)}
                  >
                    <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: '11px', fontWeight: 600, color: '#333' }}>{String(year.year).slice(2)}</div>
                    <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: '12px', fontWeight: 700, color: isGoodYear ? '#2E7D32' : '#E65100' }}>{yearScore}</div>
                  </div>
                );
              })}
            </div>
            
            {/* 选中年份的详细分析 */}
            {selectedYear !== null && data.yearlyDetails?.[selectedYear] && (() => {
              const year = data.yearlyDetails[selectedYear];
              const stem = year.ganZhi?.[0] || '甲';
              const ganZhi = year.ganZhi || stem + '子';
              const yearScore = year.yearScore || 50;
              const isGoodYear = yearScore >= 55;
              const detailColors: Record<string, string> = { career: '#FF9D6B', fortune: '#D4A000', marriage: '#FF6B9D', health: '#00C47A' };
              const detailLabels: Record<string, string> = { career: '📈 事业', fortune: '💰 财运投资', marriage: '❤️ 婚姻感情', health: '💪 健康身体' };
              
              return (
                <div style={{ 
                  padding: '16px', background: '#FFFFFF', borderRadius: '12px', 
                  border: `1px solid ${color}40`,
                  animation: 'fadeIn 0.3s ease'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '18px', fontWeight: 700, color: '#333' }}>{year.year}年</span>
                      <span style={{ 
                        padding: '4px 10px', borderRadius: '9999px', fontSize: '12px', fontWeight: 600,
                        background: isGoodYear ? '#E8F5E9' : '#FFF3E0', 
                        color: isGoodYear ? '#2E7D32' : '#E65100'
                      }}>{ganZhi}</span>
                    </div>
                    <div 
                      onClick={() => setSelectedYear(null)}
                      style={{ cursor: 'pointer', padding: '4px', color: '#999' }}
                    >✕</div>
                  </div>
                  
                  {/* 四维详细分析 */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                    {['career', 'fortune', 'marriage', 'health'].map((key) => {
                      const item = (year as any)[key] || { score: 50, advice: '', tip: '' };
                      const isHigh = item.score >= 55;
                      return (
                        <div key={key} style={{ 
                          padding: '12px', borderRadius: '10px',
                          background: `${detailColors[key]}10`,
                          border: `1px solid ${detailColors[key]}30`
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                            <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '12px', fontWeight: 600, color: detailColors[key] }}>
                              {detailLabels[key]}
                            </span>
                            <span style={{ 
                              fontFamily: 'Outfit, sans-serif', fontSize: '14px', fontWeight: 700,
                              color: isHigh ? '#2E7D32' : '#E65100'
                            }}>{isHigh ? '↑' : '↓'}</span>
                          </div>
                          <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '11px', color: '#555', margin: '0 0 4px 0', lineHeight: 1.4 }}>
                            {item.advice || '运势平稳，按部就班'}
                          </p>
                          <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '10px', color: '#888', margin: 0, lineHeight: 1.4 }}>
                            💡 {item.tip || '保持当前节奏'}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* 年度总结 */}
                  <div style={{ marginTop: '12px', padding: '10px', background: '#F8F9FC', borderRadius: '8px' }}>
                    <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '12px', color: '#333', margin: 0, lineHeight: 1.5 }}>
                      <strong>流年总结：</strong>{isGoodYear 
                        ? `此年流年${ganZhi}，五行流通，整体运势向好，把握机遇可有所突破` 
                        : `此年流年${ganZhi}，需稳扎稳打，低调行事，避免激进决策`
                      }
                    </p>
                  </div>
                </div>
              );
            })()}
            
            {selectedYear === null && (
              <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '11px', color: '#999', textAlign: 'center', margin: '8px 0 0 0' }}>
                👆 点击上方年份卡片查看详细分析
              </p>
            )}
          </div>
          
          {/* 十年关键词 */}
          <div style={{ marginTop: '12px', padding: '10px 12px', background: `${color}10`, borderRadius: '10px', border: `1px solid ${color}20` }}>
            <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '12px', color: color, fontWeight: 600 }}>关键词</span>
            <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '12px', color: css.textSecondary, marginLeft: '8px' }}>
              {isUp ? `${ELEMENT_NAMES[data.element]}气旺盛 · 主动出击 · 把握机遇` : `能量积累期 · 稳扎稳打 · 静待时机`}
            </span>
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
        年龄: {Math.round(d.age)}–{Math.round(d.endAge)}岁
      </p>
      <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '14px', fontWeight: 700, color, marginTop: '6px' }}>运势: {score}分</p>
    </div>
  );
}

/** Section ids for scroll-spy + reading progress (stable reference for effects). */
const RESULT_PAGE_SECTION_IDS = [
  'sec-bazi',
  'sec-mingge',
  'sec-fortune',
  'sec-elements',
  'sec-dayun',
] as const;

/** HashRouter navigation without useNavigate — RR7 useNavigate toggles stable/unstable implementations (different hook counts). */
function replaceHashRoute(pathWithLeadingSlash: string): void {
  const path = pathWithLeadingSlash.startsWith('/') ? pathWithLeadingSlash : `/${pathWithLeadingSlash}`;
  const nextHash = `#${path}`;
  if (window.location.hash === nextHash) return;
  const url = `${window.location.pathname}${window.location.search}${nextHash}`;
  window.location.replace(url);
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ResultPage() {
  // HashRouter兼容的userId获取
  const userId = useHashResultUserId();
  const navigate = useNavigate();
  const toneAccent = '#5B5CFF';
  const toneAux = '#2CCBFF';
  const toneBorder = 'rgba(91,92,255,0.2)';
  const toneShadow = 'rgba(76,90,176,0.14)';
  const [activeSection, setActiveSection] = useState<string>('sec-bazi');
  const [readingProgress, setReadingProgress] = useState(0);
  const [userInfo, setUserInfo] = useState<UserBirthInfo | null>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const [mingpanAnalysis, setMingpanAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [style, setStyle] = useState<LanguageStyle>('normal');
  const [userList, setUserList] = useState<Array<{id: string; name: string; birthYear: number; birthMonth: number; birthDay: number; birthHour: number; gender: string}>>([]);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showBaziExplanation, setShowBaziExplanation] = useState(false);
  const compact = useCompactMobile();

  useEffect(() => {
    const onScroll = () => {
      let current: string = RESULT_PAGE_SECTION_IDS[0];
      for (const id of RESULT_PAGE_SECTION_IDS) {
        const el = document.getElementById(id);
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        if (rect.top <= 140) current = id;
      }
      setActiveSection(current);
      const doc = document.documentElement;
      const total = doc.scrollHeight - window.innerHeight;
      const progress = total > 0 ? Math.min(100, Math.max(0, (window.scrollY / total) * 100)) : 0;
      setReadingProgress(progress);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    if (!userId) {
      setLoading(false);
      setLoadError(null);
      return () => {
        window.removeEventListener('scroll', onScroll);
      };
    }

    const recordId = decodeURIComponent(userId);
    let cancelled = false;

    setLoading(true);
    setLoadError(null);
    setUserInfo(null);
    setAnalysis(null);
    setMingpanAnalysis(null);

    fetch(`/api/users/${USER_ID}/birth-info`)
      .then((r) => parseJsonSafe(r))
      .then((data) => {
        if (!cancelled && !data.error && data.items) setUserList(data.items);
      })
      .catch(() => {});

    (async () => {
      try {
        const infoRes = await fetch(
          `/api/users/${USER_ID}/birth-info/${encodeURIComponent(recordId)}`,
        );
        const anaRes = await fetch(
          `/api/users/${USER_ID}/five-elements-analysis?recordId=${encodeURIComponent(recordId)}`,
        );
        const mpRes = await fetch(
          `/api/users/${USER_ID}/mingpan-analysis?recordId=${encodeURIComponent(recordId)}`,
        );
        const [info, ana, mpAna] = await Promise.all([
          parseJsonSafe(infoRes),
          parseJsonSafe(anaRes),
          parseJsonSafe(mpRes),
        ]);
        if (cancelled) return;

        if (!infoRes.ok) {
          const msg =
            typeof info?.error === 'string' && info.error
              ? info.error
              : `加载生辰记录失败（HTTP ${infoRes.status}）`;
          setLoadError(msg);
          return;
        }
        if (info?.error) {
          setLoadError(typeof info.error === 'string' ? info.error : '记录加载失败');
          return;
        }
        setUserInfo(info);
        setStyle(info.languageStyle || 'normal');
        if (!ana.error) setAnalysis(ana);
        if (!mpAna.error) setMingpanAnalysis(mpAna);
      } catch (e: unknown) {
        if (!cancelled) {
          setLoadError(
            e instanceof Error
              ? e.message
              : '网络错误：请确认本机已启动后端（端口 3001），手机访问时请使用开发机局域网 IP 打开前端。',
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      window.removeEventListener('scroll', onScroll);
    };
  }, [userId]);

  // 切换用户 - 重新获取该用户的完整命盘数据
  const switchUser = async (recordId: string) => {
    if (recordId === userId) {
      setShowUserDropdown(false);
    } else {
      setShowUserDropdown(false);
      setLoading(true);
      setLoadError(null);
      // 清空旧数据
      setUserInfo(null);
      setAnalysis(null);
      setMingpanAnalysis(null);
      try {
        const rid = encodeURIComponent(recordId);
        const infoRes = await fetch(`/api/users/${USER_ID}/birth-info/${rid}`);
        const anaRes = await fetch(`/api/users/${USER_ID}/five-elements-analysis?recordId=${rid}`);
        const mpRes = await fetch(`/api/users/${USER_ID}/mingpan-analysis?recordId=${rid}`);
        const [info, ana, mpAna] = await Promise.all([
          parseJsonSafe(infoRes),
          parseJsonSafe(anaRes),
          parseJsonSafe(mpRes),
        ]);
        if (!infoRes.ok || info?.error) {
          setLoadError(
            typeof info?.error === 'string' && info.error
              ? info.error
              : !infoRes.ok
                ? `加载失败（HTTP ${infoRes.status}）`
                : '记录加载失败',
          );
        } else {
          setUserInfo(info);
          setStyle(info.languageStyle || 'normal');
          if (!ana.error) setAnalysis(ana);
          else console.error('获取五行分析失败:', ana);
          if (!mpAna.error) setMingpanAnalysis(mpAna);
          else console.error('获取命盘分析失败:', mpAna);
          navigate(`/result/${recordId}`);
        }
      } catch (err) {
        console.error('切换用户失败:', err);
        setLoadError(err instanceof Error ? err.message : '切换用户失败');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <>
      {!userId ? (
        <div style={{ ...cardStyle({ padding: '40px 24px', borderRadius: 16 }), textAlign: 'center' }}>
          <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '16px', fontWeight: 700, color: css.text, marginBottom: '12px' }}>无效的页面链接</p>
          <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '14px', color: css.textMuted, marginBottom: '20px' }}>
            请从首页命盘卡片中的「查看详细分析报告」进入；地址栏应为「#/result/用户ID」形式。
          </p>
          <Link to="/" style={{ fontFamily: 'Outfit, sans-serif', fontSize: '14px', color: css.accent, textDecoration: 'none', fontWeight: 600 }}>返回首页 →</Link>
        </div>
      ) : loading ? (
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
      ) : loadError ? (
        <div style={{ ...cardStyle({ padding: '48px 24px' }), textAlign: 'center', maxWidth: 440, margin: '0 auto' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
          <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '18px', fontWeight: 700, color: css.text, marginBottom: '12px' }}>无法打开该报告</p>
          <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '14px', color: css.textSecondary, lineHeight: 1.7, marginBottom: '20px' }}>
            {loadError}
          </p>
          <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '13px', color: css.textMuted, lineHeight: 1.6, marginBottom: '20px' }}>
            若在手机浏览器打开：请确保开发机已运行前端（Vite）与后端（3001），且该记录在开发机数据库中存在；链接格式应为「#/result/记录ID」。
          </p>
          <Link to="/" style={{ fontFamily: 'Outfit, sans-serif', fontSize: '14px', color: css.accent, textDecoration: 'none', fontWeight: 600 }}>返回首页 →</Link>
        </div>
      ) : !userInfo || !userInfo.baziResult ? (
        <div style={{ ...cardStyle({ padding: '48px' }), textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔮</div>
          <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '18px', fontWeight: 700, color: css.text, marginBottom: '12px' }}>未找到完整命盘数据</p>
          <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '14px', color: css.textSecondary, marginBottom: '16px' }}>
            接口已返回记录，但缺少排盘结果。请回到首页重新保存生辰后再试。
          </p>
          <Link to="/" style={{ fontFamily: 'Outfit, sans-serif', fontSize: '14px', color: css.accent, textDecoration: 'none', fontWeight: 600 }}>返回首页 →</Link>
        </div>
      ) : (
        (() => {
          const bazi = userInfo.baziResult as any;
  const fiveEls = (userInfo.fiveElements || { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 }) as unknown as Record<string, number>;
  const fiveElKeys = ['wood', 'fire', 'earth', 'metal', 'water'] as const;
  const total = Object.values(fiveEls).reduce((a: number, b: number) => a + b, 0);
  const totalSafe = total || 1;

  // 计算当前年龄
  const calculateAge = (bd: Date) => {
    const today = new Date();
    let age = today.getFullYear() - bd.getFullYear();
    const m = today.getMonth() - bd.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < bd.getDate())) age--;
    return Math.max(0, age);
  };
  const currentBirthDate = new Date(userInfo.birthYear, userInfo.birthMonth - 1, userInfo.birthDay);
  const currentAge = calculateAge(currentBirthDate);
  const chartData = fiveElKeys.map((el: string) => ({
    name: ELEMENT_NAMES[el], count: fiveEls[el],
    pct: Math.round((fiveEls[el] / totalSafe) * 100),
    color: ELEMENT_COLORS[el],
  }));

  // 使用API返回的专业命盘分析数据
  const apiMingGe = mingpanAnalysis?.pattern ? {
    name: mingpanAnalysis.pattern.name,
    special: mingpanAnalysis.pattern.type === '正八格',
    desc: mingpanAnalysis.pattern.description || mingpanAnalysis.pattern.desc,
    description: mingpanAnalysis.pattern.description || mingpanAnalysis.pattern.desc,
    type: mingpanAnalysis.pattern.type,
    formation: mingpanAnalysis.pattern.formation,
    characteristics: mingpanAnalysis.pattern.characteristics,
    strengths: mingpanAnalysis.pattern.strengths,
    weaknesses: mingpanAnalysis.pattern.weaknesses,
    suitableCareer: mingpanAnalysis.pattern.suitableCareer || [],
    avoidCareer: mingpanAnalysis.pattern.avoidCareer || [],
    luckTips: mingpanAnalysis.pattern.luckTips,
    mainGod: mingpanAnalysis.pattern.mainGod,
    subGod: mingpanAnalysis.pattern.subGod,
  } : null;
  
  const fallbackMingGe = getMingGe(bazi.monthStem, bazi.monthBranch);
  const baseMingGe = apiMingGe || fallbackMingGe;
  // 根据当前选择的风格生成命格详解内容
  const mingGe = getMingGeByStyle(baseMingGe, style, bazi.dayMasterElement, bazi.dayMaster, userInfo.favorableElements || [], userInfo.unfavorableElements || []);

  // 使用API返回的大运数据（确定性分数）
  const dayunData = mingpanAnalysis?.dayun ? mingpanAnalysis.dayun.map((d: any, idx: number) => {
    const seed = (d.year || 2000 + idx) * 13 % 100;
    const score = d.favorable === '用神' ? 70 + (seed % 15) : 40 + (seed % 15);
    const open = score - (seed % 10);
    const close = score;
    const high = Math.max(open, close) + (seed % 5);
    const low = Math.min(open, close) - (seed % 5);
    return {
      age: Math.round(d.startAge),
      endAge: Math.round(d.startAge) + 9,
      ganZhi: d.ganZhi,
      element: d.element,
      score,
      open,
      close,
      high,
      low,
      favorable: d.favorable === '用神',
      year: d.startYear,
      yearEnd: d.startYear + 10,
      desc: `${d.ganZhi}大运`,
      summary: `${ELEMENT_NAMES[d.element] || d.element}气主导`,
      favorableElements: mingpanAnalysis.favorable,
    };
  }) : generateDayunData(userInfo);

  // 使用API返回的专业运势分析
  const getScoreColor = (score: number) => {
    if (score >= 75) return '#00C47A';
    if (score >= 60) return '#FFD666';
    if (score >= 45) return '#A0A8C0';
    return '#FF6B6B';
  };

  // 根据当前选择的 style 生成运势解读（全局生效）
  const fortuneAnalysis = getFortuneAnalysis(style, bazi.dayMasterElement, userInfo.favorableElements || [], userInfo.unfavorableElements || []);
  
  // 获取当前大运（覆盖当前年份的大运）
  const currentYear = new Date().getFullYear();
  const currentDayun = dayunData.find((d: DayunData) => currentYear >= d.year && currentYear < d.yearEnd) || dayunData[0];
  
  const fortuneCards = [
    { cardKey: 'career', label: CARD_LABELS.career, color: CARD_COLORS.career.hex, text: fortuneAnalysis.career, icon: CARD_ICONS.career, dayMaster: bazi.dayMaster, dayElement: bazi.dayMasterElement, favorableElements: userInfo.favorableElements || [], unfavorableElements: userInfo.unfavorableElements || [] },
    { cardKey: 'fortune', label: CARD_LABELS.fortune, color: CARD_COLORS.fortune.hex, text: fortuneAnalysis.fortune, icon: CARD_ICONS.fortune, dayMaster: bazi.dayMaster, dayElement: bazi.dayMasterElement, favorableElements: userInfo.favorableElements || [], unfavorableElements: userInfo.unfavorableElements || [] },
    { cardKey: 'investment', label: CARD_LABELS.investment, color: CARD_COLORS.investment.hex, text: fortuneAnalysis.investment, icon: CARD_ICONS.investment, dayMaster: bazi.dayMaster, dayElement: bazi.dayMasterElement, favorableElements: userInfo.favorableElements || [], unfavorableElements: userInfo.unfavorableElements || [], currentDayun },
    { cardKey: 'marriage', label: CARD_LABELS.marriage, color: CARD_COLORS.marriage.hex, text: fortuneAnalysis.marriage || fortuneAnalysis.investment, icon: CARD_ICONS.marriage, dayMaster: bazi.dayMaster, dayElement: bazi.dayMasterElement, favorableElements: userInfo.favorableElements || [], unfavorableElements: userInfo.unfavorableElements || [], currentDayun },
    { cardKey: 'health', label: CARD_LABELS.health, color: CARD_COLORS.health.hex, text: fortuneAnalysis.health, icon: CARD_ICONS.health, dayMaster: bazi.dayMaster, dayElement: bazi.dayMasterElement, favorableElements: userInfo.favorableElements || [], unfavorableElements: userInfo.unfavorableElements || [] },
  ];

  const fadeUp = (delay: number) => ({ initial: { opacity: 0, y: 24 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.5, delay, ease: [0.25, 0.46, 0.45, 0.94] as any } });
  const ios = compact;
  const cardRadius = ios ? 16 : 20;
  const sectionGap = ios ? 16 : 28;
  const jumpToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: sectionGap, paddingBottom: ios ? 32 : 48, paddingTop: 0 }}>

      {/* ── Header ── */}
      <motion.div {...fadeUp(0)} style={{ display: 'flex', flexDirection: ios ? 'column' : 'row', alignItems: ios ? 'stretch' : 'center', gap: ios ? 10 : 12, position: 'static' }}>
        <Link to="/" style={{
          display: 'flex', alignItems: 'center', gap: '8px', alignSelf: ios ? 'flex-start' : undefined,
          padding: ios ? '10px 14px' : '10px 20px', borderRadius: cardRadius,
          fontFamily: 'Outfit, sans-serif', fontSize: '14px', fontWeight: 600,
          background: `linear-gradient(135deg, ${css.accent}12, ${PALETTE.orange}10, #FFFFFF)`, color: css.textSecondary,
          border: `1.5px solid ${css.accent}25`,
          textDecoration: 'none',
          transition: 'all 0.2s ease',
          boxShadow: `0 8px 16px ${css.accent}20`,
        }}>
          <ArrowLeft style={{ width: '16px', height: '16px' }} /> 返回
        </Link>
        {!ios && <div style={{ flex: 1 }} />}
        {/* 用户切换卡片 */}
        <div style={{
          ...cardStyle({
            borderRadius: cardRadius,
            background: 'linear-gradient(145deg, rgba(91,92,255,0.1), rgba(44,203,255,0.08) 45%, #FFFFFF)',
          }),
          minWidth: ios ? 0 : 280,
          width: ios ? '100%' : undefined,
          padding: ios ? '12px 14px' : '14px 20px',
          position: 'relative',
          border: `1px solid ${toneBorder}`,
          boxShadow: `0 14px 28px ${toneShadow}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: ios ? 10 : 14, flexWrap: 'wrap' }}>
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '17px', fontWeight: 700, color: css.text }}>{userInfo.name}</p>
                {/* 用户切换下拉按钮 */}
                {userList.length > 1 && (
                  <motion.button
                    onClick={() => setShowUserDropdown(!showUserDropdown)}
                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    style={{
                      padding: '4px 10px', borderRadius: '8px',
                      background: `linear-gradient(135deg, ${css.accent}12, ${PALETTE.orange}10, #FFFFFF)`, border: `1px solid ${css.accent}20`,
                      cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px',
                      fontFamily: 'Outfit, sans-serif', fontSize: '11px', fontWeight: 600,
                      color: css.textSecondary,
                    }}>
                    <Users style={{ width: '12px', height: '12px' }} /> 切换
                  </motion.button>
                )}
              </div>
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

          {/* 用户切换下拉列表 */}
          {showUserDropdown && userList.length > 1 && (
            <div style={{
              position: 'absolute', top: '100%', right: 0, marginTop: '8px',
              background: 'linear-gradient(145deg, rgba(91,92,255,0.09), rgba(44,203,255,0.08) 50%, #FFFFFF)', borderRadius: '12px', border: '1px solid rgba(91,92,255,0.2)',
              boxShadow: '0 10px 22px rgba(76,90,176,0.16)', overflow: 'hidden', zIndex: 100,
              minWidth: '240px',
            }}>
              <div style={{ padding: '10px 14px', borderBottom: `1px solid ${css.accent}1F`, background: `linear-gradient(135deg, ${css.accent}0E, #FFFFFF)` }}>
                <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '12px', color: css.textMuted, fontWeight: 600 }}>
                  已录入用户 ({userList.length})
                </span>
              </div>
              {userList.map((u) => (
                <div
                  key={u.id}
                  onClick={() => switchUser(u.id)}
                  style={{
                    padding: '12px 14px',
                    cursor: 'pointer',
                    background: u.id === userId ? `${css.accent}08` : 'transparent',
                    borderBottom: '1px solid #F8F8F8',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e) => { if (u.id !== userId) (e.target as HTMLElement).style.background = '#F8F8F8'; }}
                  onMouseLeave={(e) => { if (u.id !== userId) (e.target as HTMLElement).style.background = 'transparent'; }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '32px', height: '32px', borderRadius: '10px',
                      background: u.id === userId
                        ? `linear-gradient(135deg, ${css.accent}, ${PALETTE.orange})`
                        : '#E8E8E8',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '14px', fontWeight: 700, color: u.id === userId ? '#FFFFFF' : '#999',
                    }}>
                      {u.name.charAt(0)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '14px', fontWeight: 700, color: css.text }}>
                          {u.name}
                        </span>
                        {u.id === userId && (
                          <span style={{ fontSize: '10px', padding: '2px 6px', background: `${css.accent}20`, color: css.accent, borderRadius: '4px', fontWeight: 600 }}>
                            当前
                          </span>
                        )}
                      </div>
                      <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '11px', color: css.textMuted }}>
                        {u.birthYear}.{String(u.birthMonth).padStart(2,'0')}.{String(u.birthDay).padStart(2,'0')} · {u.gender === 'male' ? '男' : '女'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>

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

      {/* ── 解读风格（全局生效） ── */}
      <motion.div {...fadeUp(0.02)}>
        <div style={{
          background: `linear-gradient(140deg, ${css.accent}0D, ${PALETTE.orange}08 42%, #FFFFFF)`,
          borderRadius: cardRadius,
          border: `1px solid ${css.accent}22`,
          boxShadow: `0 12px 24px ${css.accent}1A`,
          padding: ios ? '14px 16px' : '20px 24px',
          marginBottom: '16px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <Sparkles style={{ width: '16px', height: '16px', color: css.accent }} />
            <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '15px', fontWeight: 700, color: css.text }}>
              解读风格
            </span>
            <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '12px', color: css.textMuted }}>
              选择后对下方所有解读生效
            </span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: ios ? 8 : 8 }}>
            {(Object.keys(styleLabels) as LanguageStyle[]).map(s => (
              <motion.button key={s} onClick={() => setStyle(s)} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                style={{
                  padding: ios ? '10px 14px' : '10px 20px', borderRadius: 12,
                  fontFamily: 'Outfit, sans-serif', fontSize: ios ? '13px' : '14px', fontWeight: 600,
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
        </div>
      </motion.div>

      {/* ── 快速导航 ── */}
      <motion.div {...fadeUp(0.03)}>
        <div style={{
          background: '#FFFFFF',
          borderRadius: 16,
          border: '1px solid #F0F0F0',
          padding: '16px',
          marginBottom: '16px',
        }}>
          <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: '12px', fontWeight: 500, color: '#999999', marginBottom: '12px' }}>
            快捷导航
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
            {/* 四柱八字 */}
            <motion.button 
              onClick={() => document.getElementById('sec-bazi')?.scrollIntoView({ behavior: 'smooth' })}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              style={{
                padding: '10px 12px',
                borderRadius: 9999,
                background: 'linear-gradient(135deg, #FF6B9D 0%, #FF9D6B 100%)',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
              }}>☯</div>
              <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '13px', fontWeight: 600, color: '#FFFFFF' }}>四柱八字</span>
            </motion.button>
            {/* 命格分析 */}
            <motion.button 
              onClick={() => document.getElementById('sec-mingge')?.scrollIntoView({ behavior: 'smooth' })}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              style={{
                padding: '10px 12px',
                borderRadius: 9999,
                background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
              }}>✨</div>
              <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '13px', fontWeight: 600, color: '#FFFFFF' }}>命格分析</span>
            </motion.button>
            {/* 四维运势分析 */}
            <motion.button 
              onClick={() => document.getElementById('sec-fortune')?.scrollIntoView({ behavior: 'smooth' })}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              style={{
                padding: '10px 12px',
                borderRadius: 9999,
                background: 'linear-gradient(135deg, #10B981 0%, #34D399 100%)',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
              }}>📊</div>
              <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '13px', fontWeight: 600, color: '#FFFFFF' }}>四维运势分析</span>
            </motion.button>
            {/* 大运走势图 */}
            <motion.button 
              onClick={() => document.getElementById('sec-dayun')?.scrollIntoView({ behavior: 'smooth' })}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              style={{
                padding: '10px 12px',
                borderRadius: 9999,
                background: 'linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%)',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
              }}>📈</div>
              <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '13px', fontWeight: 600, color: '#FFFFFF' }}>大运走势图</span>
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* ── 四柱八字 ── */}
      <motion.div {...fadeUp(0.05)} id="sec-bazi">
        <SectionTitle icon={<span style={{ color: css.accent, fontSize: '16px' }}>☯</span>} compact={ios}>四柱八字</SectionTitle>
        <GlassCard style={{ padding: ios ? '16px' : '28px', borderRadius: cardRadius, background: `linear-gradient(145deg, ${css.accent}0A, ${PALETTE.orange}08 48%, #FFFFFF)`, border: `1px solid ${css.accent}20`, boxShadow: `0 14px 30px ${css.accent}16` }}>
          <div style={{ display: 'grid', gridTemplateColumns: ios ? 'repeat(2, minmax(0,1fr))' : 'repeat(4, 1fr)', gap: ios ? 10 : 12, marginBottom: ios ? 16 : 20 }}>
            <PillarCell label="年柱" pillar={bazi.yearPillar} shiShen={bazi.shiShen?.yearStem || bazi.shiShen?.year || '比肩'} compact={ios} />
            <PillarCell label="月柱" pillar={bazi.monthPillar} shiShen={bazi.shiShen?.monthStem || bazi.shiShen?.month || '正印'} compact={ios} />
            <PillarCell label="日柱" pillar={bazi.dayPillar} shiShen={bazi.dayMaster} highlight compact={ios} />
            <PillarCell label="时柱" pillar={bazi.hourPillar} shiShen={bazi.shiShen?.hourStem || bazi.shiShen?.hour || '食神'} compact={ios} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '14px', paddingTop: '16px', borderTop: '1px solid #F0F1F8' }}>
            <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '15px', color: css.textMuted }}>日主</span>
            <span style={{ fontSize: '28px', fontWeight: 900, color: css.accent, fontFamily: 'Outfit, sans-serif' }}>{bazi.dayMaster}</span>
            <ElementBadge el={bazi.dayMasterElement} />
          </div>
          {/* 日主命格解释 */}
          <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: `1px solid ${css.accent}20` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <div style={{ width: '20px', height: '2px', background: css.accent, borderRadius: '1px' }} />
              <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '13px', fontWeight: 700, color: css.accent }}>日主解析</span>
            </div>
            <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '13px', lineHeight: 1.8, color: css.textSecondary, margin: 0, padding: '12px 14px', background: `linear-gradient(135deg, ${css.accent}10, ${PALETTE.orange}0D, #FFFFFF)`, borderRadius: '12px', border: `1px solid ${css.accent}20` }}>
              <span style={{ fontWeight: 700, color: css.accent }}>{bazi.dayMaster}</span> 日主，出生于 
              <span style={{ fontWeight: 600 }}>{bazi.hourPillar}</span> 时辰，命带 
              <span style={{ fontWeight: 600 }}>{bazi.shiShen?.dayBranch || '正印'}</span> 护卫。
              {bazi.dayMasterElement === '木' && ' 日主为木，主仁。木命人通常性格仁慈、善良，有同情心，做事有耐心，但有时过于固执。'}
              {bazi.dayMasterElement === '火' && ' 日主为火，主礼。火命人通常热情开朗、积极向上，有领导力，但有时脾气急躁、容易冲动。'}
              {bazi.dayMasterElement === '土' && ' 日主为土，主信。土命人通常稳重厚道、诚实守信，有责任感，但有时过于保守、缺乏变通。'}
              {bazi.dayMasterElement === '金' && ' 日主为金，主义。金命人通常刚毅果断、做事有原则，有正义感，但有时过于刚硬、不懂圆滑。'}
              {bazi.dayMasterElement === '水' && ' 日主为水，主智。水命人通常聪明伶俐、善于变通，有智慧，但有时过于机巧、缺乏坚定。'}
            </p>
          </div>
        </GlassCard>
      </motion.div>

      {/* ── 四柱八字释义 ── */}
      <motion.div {...fadeUp(0.1)}>
        <div onClick={() => setShowBaziExplanation(!showBaziExplanation)} style={{ cursor: 'pointer' }}>
          <SectionTitle 
            icon={<span style={{ color: css.accent, fontSize: '16px' }}>📖</span>}
            compact={ios}
            action={
              <motion.span 
                animate={{ rotate: showBaziExplanation ? 90 : 0 }}
                transition={{ duration: 0.2 }}
                style={{ fontSize: '12px', color: css.textMuted, marginLeft: 'auto' }}
              >
                {showBaziExplanation ? '收起' : '展开'}
              </motion.span>
            }
          >
            四柱八字释义
          </SectionTitle>
        </div>
        <AnimatePresence>
          {showBaziExplanation && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              style={{ overflow: 'hidden' }}
            >
              <GlassCard style={{ padding: ios ? '16px' : '24px', borderRadius: cardRadius, background: `linear-gradient(145deg, ${css.accent}0A, ${PALETTE.orange}08 48%, #FFFFFF)`, border: `1px solid ${css.accent}20` }}>
                <div style={{ display: 'grid', gridTemplateColumns: ios ? '1fr' : 'repeat(2, 1fr)', gap: ios ? 12 : 16 }}>
                  <div style={{ padding: '16px', background: `linear-gradient(135deg, ${PALETTE.blue}10, #FFFFFF)`, borderRadius: '12px', border: `1px solid ${PALETTE.blue}1F` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                      <span style={{ fontSize: '20px' }}>🌿</span>
                      <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '15px', fontWeight: 700, color: css.text }}>年柱</span>
                    </div>
                    <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '13px', lineHeight: 1.7, color: css.textSecondary, margin: 0 }}>
                      <strong>{bazi.yearPillar}</strong> — 代表祖辈根基、童年环境、少年运势，影响先天禀赋与家庭背景。
                    </p>
                  </div>
                  <div style={{ padding: '16px', background: `linear-gradient(135deg, ${PALETTE.green}10, #FFFFFF)`, borderRadius: '12px', border: `1px solid ${PALETTE.green}1F` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                      <span style={{ fontSize: '20px' }}>🌱</span>
                      <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '15px', fontWeight: 700, color: css.text }}>月柱</span>
                    </div>
                    <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '13px', lineHeight: 1.7, color: css.textSecondary, margin: 0 }}>
                      <strong>{bazi.monthPillar}</strong> — 代表父母宫、青年运势，反映人际关系与事业发展潜力。
                    </p>
                  </div>
                  <div style={{ padding: '16px', background: 'linear-gradient(135deg, #FFF5F8 0%, #FFF 100%)', borderRadius: '12px', border: `1px solid ${css.accent}20` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                      <span style={{ fontSize: '20px' }}>☀️</span>
                      <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '15px', fontWeight: 700, color: css.accent }}>日柱</span>
                    </div>
                    <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '13px', lineHeight: 1.7, color: css.textSecondary, margin: 0 }}>
                      <strong>{bazi.dayPillar}</strong> — 日主之柱，代表本人性格、本质能力与婚姻宫，是命盘核心。
                    </p>
                  </div>
                  <div style={{ padding: '16px', background: `linear-gradient(135deg, ${PALETTE.purple}10, #FFFFFF)`, borderRadius: '12px', border: `1px solid ${PALETTE.purple}1F` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                      <span style={{ fontSize: '20px' }}>🌙</span>
                      <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '15px', fontWeight: 700, color: css.text }}>时柱</span>
                    </div>
                    <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '13px', lineHeight: 1.7, color: css.textSecondary, margin: 0 }}>
                      <strong>{bazi.hourPillar}</strong> — 代表晚年运势、子女缘分、晚年福禄，影响人生后半程。
                    </p>
                  </div>
                </div>
                {/* 天干地支说明 */}
                <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: `1px solid ${css.accent}20` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                    <div style={{ width: '16px', height: '2px', background: PALETTE.orange, borderRadius: '1px' }} />
                    <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '12px', fontWeight: 700, color: PALETTE.orange }}>十天干 · 十二地支</span>
                  </div>
                  <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '12px', lineHeight: 1.7, color: css.textSecondary, margin: 0 }}>
                    <strong>天干</strong>（甲乙丙丁戊己庚辛壬癸）为天之气，主外在表现；<strong>地支</strong>（子丑寅卯辰巳午未申酉戌亥）为地之气，主内在根基。
                    天干与地支相配，构成年、月、日、时四柱，每柱一天干一地支，共成八个字，故称"八字"。
                  </p>
                </div>
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ── 命格详解 ── */}
      <motion.div {...fadeUp(0.15)} id="sec-mingge">
        <SectionTitle icon={<Sparkles style={{ width: '16px', height: '16px', color: css.accent }} />} compact={ios}>命格详解</SectionTitle>
        <GlassCard style={{ padding: ios ? '16px' : '24px', borderRadius: cardRadius, background: `linear-gradient(145deg, ${css.accent}0A, ${PALETTE.orange}08 48%, #FFFFFF)`, border: `1px solid ${css.accent}20`, boxShadow: `0 12px 26px ${css.accent}18` }}>
          {/* 头部：格局名称 */}
          <div style={{ display: 'flex', flexDirection: ios ? 'column' : 'row', alignItems: ios ? 'flex-start' : 'center', gap: ios ? 14 : 20, marginBottom: ios ? 16 : 20 }}>
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
              {mingGe.name?.charAt(0) || '格'}
            </motion.div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
                <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '24px', fontWeight: 800, color: css.text }}>{mingGe.name}</h3>
                {mingGe.type === '从格' && (
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
                <span style={{
                  padding: '4px 10px', borderRadius: '8px',
                  fontSize: '11px', fontWeight: 600,
                  background: `linear-gradient(135deg, ${css.accent}12, ${PALETTE.orange}10)`, color: css.textSecondary,
                  border: `1px solid ${css.accent}20`,
                  fontFamily: 'Outfit, sans-serif',
                }}>
                  {mingGe.type}
                </span>
              </div>
              <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '15px', lineHeight: 1.7, color: css.textSecondary }}>{mingGe.description || mingGe.desc}</p>
              {/* 格局十神关系标签 */}
              {mingGe.mainGod && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
                  <div style={{
                    padding: '4px 12px', borderRadius: '9999px',
                    background: `linear-gradient(135deg, ${css.accent}18, ${PALETTE.orange}14)`,
                    border: `1px solid ${css.accent}30`,
                    fontFamily: 'Outfit, sans-serif', fontSize: '12px', fontWeight: 700,
                    color: css.accent,
                  }}>
                    {mingGe.mainGod}为格主
                  </div>
                  {mingGe.subGod && (
                    <div style={{
                      padding: '4px 12px', borderRadius: '9999px',
                      background: `linear-gradient(135deg, ${PALETTE.orange}14, ${PALETTE.blue}10)`,
                      border: `1px solid ${PALETTE.orange}30`,
                      fontFamily: 'Outfit, sans-serif', fontSize: '12px', fontWeight: 600,
                      color: css.textSecondary,
                    }}>
                      配{mingGe.subGod}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 格局特点 */}
          {mingGe.characteristics && (
            <div style={{ padding: '16px', background: `linear-gradient(135deg, ${PALETTE.orange}0C, #FFFFFF)`, borderRadius: '12px', marginBottom: '16px', border: `1px solid ${PALETTE.orange}24` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: PALETTE.orange }} />
                <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '14px', fontWeight: 700, color: css.text }}>格局特点</span>
              </div>
              <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '14px', lineHeight: 1.7, color: css.textSecondary, margin: 0, paddingLeft: '14px' }}>
                {mingGe.characteristics}
              </p>
            </div>
          )}

          {/* 优劣势对比 */}
          <div style={{ display: 'grid', gridTemplateColumns: ios ? '1fr' : '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            {mingGe.strengths && (
              <div style={{ padding: '14px', background: '#F0FFF4', borderRadius: '12px', border: '1px solid #D1FAE5' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                  <span style={{ fontSize: '14px' }}>💪</span>
                  <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '13px', fontWeight: 700, color: '#059669' }}>优势</span>
                </div>
                <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '13px', lineHeight: 1.6, color: '#065F46', margin: 0 }}>
                  {mingGe.strengths}
                </p>
              </div>
            )}
            {mingGe.weaknesses && (
              <div style={{ padding: '14px', background: '#FFF7F7', borderRadius: '12px', border: '1px solid #FEE2E2' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                  <span style={{ fontSize: '14px' }}>⚠️</span>
                  <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '13px', fontWeight: 700, color: '#DC2626' }}>劣势</span>
                </div>
                <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '13px', lineHeight: 1.6, color: '#991B1B', margin: 0 }}>
                  {mingGe.weaknesses}
                </p>
              </div>
            )}
          </div>

          {/* 适合/不适合职业 */}
          <div style={{ display: 'grid', gridTemplateColumns: ios ? '1fr' : '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            {mingGe && mingGe.suitableCareer && mingGe.suitableCareer.length > 0 && (
              <div style={{ padding: '14px', background: '#F0F9FF', borderRadius: '12px', border: '1px solid #BAE6FD' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                  <span style={{ fontSize: '14px' }}>✅</span>
                  <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '13px', fontWeight: 700, color: '#0284C7' }}>适合职业</span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {mingGe.suitableCareer.map((career: string, i: number) => (
                    <span key={i} style={{
                      padding: '4px 10px', borderRadius: '6px',
                      background: '#E0F2FE', color: '#0369A1',
                      fontSize: '12px', fontFamily: 'Outfit, sans-serif',
                    }}>
                      {career}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {mingGe && mingGe.avoidCareer && mingGe.avoidCareer.length > 0 && (
              <div style={{ padding: '14px', background: '#FFFBEB', borderRadius: '12px', border: '1px solid #FDE68A' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                  <span style={{ fontSize: '14px' }}>❌</span>
                  <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '13px', fontWeight: 700, color: '#D97706' }}>不适合职业</span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {mingGe.avoidCareer.map((career: string, i: number) => (
                    <span key={i} style={{
                      padding: '4px 10px', borderRadius: '6px',
                      background: '#FEF3C7', color: '#B45309',
                      fontSize: '12px', fontFamily: 'Outfit, sans-serif',
                    }}>
                      {career}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 运势提示 */}
          {mingGe.luckTips && (
            <div style={{ padding: '16px', background: 'linear-gradient(135deg, #FFF8F0 0%, #FFF 100%)', borderRadius: '12px', border: '1px solid #FFD591' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ fontSize: '16px' }}>🌟</span>
                <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '14px', fontWeight: 700, color: '#D97706' }}>运势提示</span>
              </div>
              <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '14px', lineHeight: 1.7, color: '#92400E', margin: 0, paddingLeft: '24px' }}>
                {mingGe.luckTips}
              </p>
            </div>
          )}
        </GlassCard>
      </motion.div>

      {/* ── 四维运势 ── */}
      <motion.div {...fadeUp(0.2)} id="sec-fortune">
        <SectionTitle icon={<TrendingUp style={{ width: '16px', height: '16px', color: css.accent }} />} compact={ios}>四维运势分析</SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: ios ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
          {fortuneCards.map(card => (
            <FortuneCard
              key={card.cardKey}
              cardKey={card.cardKey}
              label={card.label}
              text={card.text}
              color={card.color}
              icon={card.icon}
              dayMaster={card.dayMaster}
              dayElement={card.dayElement}
              favorableElements={card.favorableElements}
              unfavorableElements={card.unfavorableElements}
            />
          ))}
        </div>
      </motion.div>

      {/* ── 五行分析 ── */}
      {(analysis || mingpanAnalysis) && (
        <motion.div {...fadeUp(0.3)} id="sec-elements">
          <SectionTitle icon={<span style={{ color: css.accent, fontSize: '16px' }}>✦</span>} compact={ios}>五行分析</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: ios ? '1fr' : 'repeat(3, 1fr)', gap: 12 }}>
            {/* 十神占比（最左边新增） */}
            <GlassCard style={{ padding: ios ? '16px' : '20px', borderRadius: cardRadius, background: `linear-gradient(145deg, ${css.accent}0A, #FFFFFF)`, border: `1px solid ${css.accent}20` }}>
              <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '14px', fontWeight: 700, color: css.accent, marginBottom: '16px' }}>十神分布</p>
              {(() => {
                // 获取日柱天干作为日主
                const dayPillar = bazi.dayPillar || '';
                const dayStem = dayPillar.length >= 2 ? dayPillar[0] : '';
                
                // 天干阴阳：甲丙戊庚壬为阳，乙丁己辛癸为阴
                const yangStems = ['甲', '丙', '戊', '庚', '壬'];
                const isYangDayStem = yangStems.includes(dayStem);
                
                // 十神映射表：以日干为基准计算其他天干的十神关系
                // 行=日干，列=其他天干与日干的关系
                const getShiShen = (stem: string, dayMaster: string): string => {
                  if (stem === dayMaster) {
                    // 同我者：阳干=比肩，阴干=劫财
                    return yangStems.includes(stem) ? '比' : '劫';
                  }
                  
                  // 我生者（泄）：
                  // 甲生丙(食神) 丁生戊(食神) 戊生庚(食神) 庚生壬(食神) 壬生甲(食神)
                  // 乙生丁(伤官) 己生辛(伤官) 辛生癸(伤官) 癸生乙(伤官)
                  const shengMap: Record<string, Record<string, string>> = {
                    '甲': { '丙': '食', '丁': '伤' },
                    '乙': { '丁': '食', '丙': '伤' },
                    '丙': { '戊': '食', '己': '伤' },
                    '丁': { '己': '食', '戊': '伤' },
                    '戊': { '庚': '食', '辛': '伤' },
                    '己': { '辛': '食', '庚': '伤' },
                    '庚': { '壬': '食', '癸': '伤' },
                    '辛': { '癸': '食', '壬': '伤' },
                    '壬': { '甲': '食', '乙': '伤' },
                    '癸': { '乙': '食', '甲': '伤' }
                  };
                  if (shengMap[dayMaster]?.[stem]) return shengMap[dayMaster][stem];
                  
                  // 我克者（财）：
                  const keMap: Record<string, Record<string, string>> = {
                    '甲': { '戊': '正财', '己': '偏财' },
                    '乙': { '己': '正财', '戊': '偏财' },
                    '丙': { '庚': '正财', '辛': '偏财' },
                    '丁': { '辛': '正财', '庚': '偏财' },
                    '戊': { '壬': '正财', '癸': '偏财' },
                    '己': { '癸': '正财', '壬': '偏财' },
                    '庚': { '甲': '正财', '乙': '偏财' },
                    '辛': { '乙': '正财', '甲': '偏财' },
                    '壬': { '丙': '正财', '丁': '偏财' },
                    '癸': { '丁': '正财', '丙': '偏财' }
                  };
                  if (keMap[dayMaster]?.[stem]) return keMap[dayMaster][stem];
                  
                  // 克我者（官杀）：
                  const keWoMap: Record<string, Record<string, string>> = {
                    '甲': { '庚': '正官', '辛': '七杀' },
                    '乙': { '辛': '正官', '庚': '七杀' },
                    '丙': { '壬': '正官', '癸': '七杀' },
                    '丁': { '癸': '正官', '壬': '七杀' },
                    '戊': { '甲': '正官', '乙': '七杀' },
                    '己': { '乙': '正官', '甲': '七杀' },
                    '庚': { '丙': '正官', '丁': '七杀' },
                    '辛': { '丁': '正官', '丙': '七杀' },
                    '壬': { '戊': '正官', '己': '七杀' },
                    '癸': { '己': '正官', '戊': '七杀' }
                  };
                  if (keWoMap[dayMaster]?.[stem]) return keWoMap[dayMaster][stem];
                  
                  // 生我者（印）：
                  const shengWoMap: Record<string, Record<string, string>> = {
                    '甲': { '癸': '正印', '壬': '偏印' },
                    '乙': { '壬': '正印', '癸': '偏印' },
                    '丙': { '辛': '正印', '庚': '偏印' },
                    '丁': { '庚': '正印', '辛': '偏印' },
                    '戊': { '丁': '正印', '丙': '偏印' },
                    '己': { '丙': '正印', '丁': '偏印' },
                    '庚': { '乙': '正印', '甲': '偏印' },
                    '辛': { '甲': '正印', '乙': '偏印' },
                    '壬': { '己': '正印', '戊': '偏印' },
                    '癸': { '戊': '正印', '己': '偏印' }
                  };
                  if (shengWoMap[dayMaster]?.[stem]) return shengWoMap[dayMaster][stem];
                  
                  return '';
                };
                
                // 统计八字中各天干出现次数
                const stemCounts: Record<string, number> = {};
                const pillars = [bazi.yearPillar, bazi.monthPillar, bazi.dayPillar, bazi.hourPillar];
                pillars.forEach(p => {
                  if (p && p.length >= 2) {
                    const stem = p[0];
                    stemCounts[stem] = (stemCounts[stem] || 0) + 1;
                  }
                });
                
                // 统计十神出现次数
                const shiShenCounts: Record<string, number> = {
                  '比': 0, '劫': 0, '食': 0, '伤': 0,
                  '正财': 0, '偏财': 0, '正官': 0, '七杀': 0, '正印': 0, '偏印': 0
                };
                
                Object.entries(stemCounts).forEach(([stem, count]) => {
                  const ss = getShiShen(stem, dayStem);
                  if (ss && shiShenCounts[ss] !== undefined) {
                    shiShenCounts[ss] += count;
                  }
                });
                
                const total = Object.values(stemCounts).reduce((a, b) => a + b, 0) || 1;
                
                // 十神颜色和图标
                const shiShenColors: Record<string, string> = {
                  '比': '#3498DB', '劫': '#9B59B6', '食': '#E74C3C', '伤': '#F39C12',
                  '正财': '#27AE60', '偏财': '#2ECC71', '正官': '#1ABC9C', '七杀': '#16A085',
                  '正印': '#8E44AD', '偏印': '#9B59B6'
                };
                const shiShenNames: Record<string, string> = {
                  '比': '比肩', '劫': '劫财', '食': '食神', '伤': '伤官',
                  '正财': '正财', '偏财': '偏财', '正官': '正官', '七杀': '七杀',
                  '正印': '正印', '偏印': '偏印'
                };
                
                // 按占比排序，只显示有数据的十神（过滤掉占比为0的）
                const sortedShiShen = Object.entries(shiShenCounts).sort((a, b) => b[1] - a[1]);
                const activeShiShen = sortedShiShen.filter(([_, count]) => count > 0);
                
                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {activeShiShen.map(([ss, count]) => {
                      const pct = Math.round(count / total * 100);
                      const color = shiShenColors[ss];
                      return (
                        <div key={ss} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{
                            width: '32px', height: '32px', borderRadius: '8px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '13px', fontWeight: 700,
                            background: color + '18', 
                            color: color,
                            fontFamily: 'Outfit, sans-serif',
                          }}>
                            {ss}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                              <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '10px', color: css.text }}>{shiShenNames[ss]}</span>
                              <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '10px', color: color, fontWeight: 600 }}>{pct}%</span>
                            </div>
                            <div style={{ height: '4px', borderRadius: '2px', background: '#F0F1F8', overflow: 'hidden' }}>
                              <div style={{ 
                                height: '100%', 
                                width: `${pct}%`, 
                                background: color, 
                                borderRadius: '2px',
                                transition: 'width 0.5s ease'
                              }} />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {activeShiShen.length === 0 && (
                      <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '12px', color: css.textMuted, textAlign: 'center', padding: '20px 0' }}>
                        暂无十神数据
                      </p>
                    )}
                  </div>
                );
              })()}
            </GlassCard>

            <GlassCard style={{ padding: ios ? '16px' : '24px', borderRadius: cardRadius, background: `linear-gradient(145deg, ${PALETTE.blue}0A, #FFFFFF)`, border: `1px solid ${PALETTE.blue}20` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '15px', fontWeight: 700, color: css.accent }}>得令状态</span>
              </div>
              <p style={{ fontSize: '24px', fontWeight: 800, marginBottom: '8px', color: css.text, fontFamily: 'Outfit, sans-serif' }}>
                {mingpanAnalysis?.bodyStrengthText || analysis?.bodyStrengthAnalysis?.bodyStrengthText || mingGe.name}
              </p>
              {(mingpanAnalysis?.bodyStrengthScore != null || analysis?.bodyStrengthAnalysis?.totalScore != null) && (
                <div style={{ marginTop: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px', marginBottom: '8px' }}>
                    <span style={{ fontFamily: 'Outfit, sans-serif', color: css.textMuted }}>身强弱评分</span>
                    <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, color: css.accent }}>{mingpanAnalysis?.bodyStrengthScore || analysis?.bodyStrengthAnalysis?.totalScore}分</span>
                  </div>
                  <div style={{ height: '8px', borderRadius: '9999px', background: '#F0F1F8', overflow: 'hidden' }}>
                    <motion.div
                      style={{
                        height: '100%', borderRadius: '9999px',
                        background: `linear-gradient(90deg, ${css.accent}, ${PALETTE.orange})`,
                      }}
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, (mingpanAnalysis?.bodyStrengthScore || analysis?.bodyStrengthAnalysis?.totalScore || 0))}%` }}
                      transition={{ duration: 1, delay: 0.5, ease: 'easeOut' }}
                    />
                  </div>
                </div>
              )}
              {/* 五行占比信息 */}
              <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #F0F1F8' }}>
                <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '12px', fontWeight: 600, color: css.textMuted, marginBottom: '10px' }}>五行占比</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {chartData.map(el => (
                    <div key={el.name} style={{
                      display: 'flex', alignItems: 'center', gap: '4px',
                      padding: '4px 10px', borderRadius: '9999px',
                      background: el.color + '12',
                    }}>
                      <span style={{ fontSize: '12px' }}>{el.name}</span>
                      <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '11px', fontWeight: 700, color: el.color }}>{Math.round(el.pct)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </GlassCard>

            <GlassCard style={{ padding: ios ? '16px' : '24px', borderRadius: cardRadius, background: `linear-gradient(145deg, ${PALETTE.orange}0A, #FFFFFF)`, border: `1px solid ${PALETTE.orange}20` }}>
              <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '15px', fontWeight: 700, color: css.accent, marginBottom: '14px' }}>用神策略</p>
              {(() => {
                // 获取日主信息用于测算说明
                const dayPillar = bazi.dayPillar || '';
                const dayStem = dayPillar.length >= 2 ? dayPillar[0] : '';
                const dayBranch = dayPillar.length >= 2 ? dayPillar[1] : '';
                
                // 获取月柱信息
                const monthPillar = bazi.monthPillar || '';
                const monthStem = monthPillar.length >= 2 ? monthPillar[0] : '';
                
                // 计算喜用神原因
                const getFavorableReason = (element: string, dayStem: string, monthStem: string): string => {
                  const dayElement = STEM_ELEMENT[dayStem] || '';
                  const monthElement = STEM_ELEMENT[monthStem] || '';
                  
                  // 木生火、火生土、土生金、金生水、水生木
                  const produceMap: Record<string, string> = { '木': '火', '火': '土', '土': '金', '金': '水', '水': '木' };
                  const beProducedMap: Record<string, string> = { '火': '木', '土': '火', '金': '土', '水': '金', '木': '水' };
                  
                  // 判断原因
                  if (element === dayElement) {
                    return '与日主相同，增强自身能量';
                  }
                  if (element === monthElement) {
                    return '月令主气，扶助月柱力量';
                  }
                  if (produceMap[dayElement] === element) {
                    return '泄日主之力，调候通关';
                  }
                  if (beProducedMap[dayElement] === element) {
                    return '生扶日主，增强命中活力';
                  }
                  return '调和八字，平衡五行';
                };
                
                // 计算忌用神原因
                const getUnfavorableReason = (element: string, dayStem: string, monthStem: string): string => {
                  const dayElement = STEM_ELEMENT[dayStem] || '';
                  
                  // 判断原因
                  if (element === dayElement) {
                    return '日主过旺，宜泄不宜补';
                  }
                  // 检查是否与忌神相关
                  return '削弱命局能量，注意规避';
                };
                
                return (
                  <>
                    {(mingpanAnalysis?.favorable || analysis?.favorableAnalysis?.favorable || [])?.map((el: string) => {
                      return (
                        <div key={el} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '12px', padding: '10px', background: ELEMENT_COLORS[el] + '08', borderRadius: '10px', border: `1px solid ${ELEMENT_COLORS[el]}20` }}>
                          <div style={{
                            width: '36px', height: '36px', borderRadius: '12px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '16px', fontWeight: 900,
                            background: ELEMENT_COLORS[el] + '18', color: ELEMENT_COLORS[el],
                            fontFamily: 'Outfit, sans-serif',
                          }}>
                            {ELEMENT_NAMES[el]}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                              <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '14px', fontWeight: 700, color: ELEMENT_COLORS[el] }}>喜用神</p>
                              <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '12px', color: css.textMuted }}>{ELEMENT_NAMES[el]}行</span>
                            </div>
                            <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '11px', color: css.textMuted, margin: 0, lineHeight: 1.5 }}>
                              {getFavorableReason(el, dayStem, monthStem)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                    {(mingpanAnalysis?.unfavorable || analysis?.favorableAnalysis?.unfavorable || [])?.map((el: string) => {
                      return (
                        <div key={el} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '12px', padding: '10px', background: `linear-gradient(135deg, ${PALETTE.coral}08, #FFFFFF)`, borderRadius: '10px', border: `1px solid ${PALETTE.coral}20` }}>
                          <div style={{
                            width: '36px', height: '36px', borderRadius: '12px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '14px', fontWeight: 700,
                            background: `${PALETTE.coral}18`, color: PALETTE.coral,
                            fontFamily: 'Outfit, sans-serif',
                          }}>
                            ✕
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                              <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '14px', fontWeight: 700, color: css.textMuted }}>忌用神</p>
                              <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '12px', color: css.textMuted }}>{ELEMENT_NAMES[el]}行</span>
                            </div>
                            <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '11px', color: css.textMuted, margin: 0, lineHeight: 1.5 }}>
                              {getUnfavorableReason(el, dayStem, monthStem)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </>
                );
              })()}
            </GlassCard>
          </div>
        </motion.div>
      )}

      {/* ── 人生大运 K线图（参考图样式） ── */}
      {dayunData.length > 0 && (() => {
        const candlestickData = generateCandlestickData(dayunData, bazi.dayMaster, bazi.dayMasterElement, userInfo.favorableElements || []);
        const startAge = candlestickData[0]?.age || 3;
        return (
          <motion.div {...fadeUp(0.35)} id="sec-dayun">
            <DayunKLineChart data={candlestickData} startAge={startAge} userInfo={userInfo} dayMaster={bazi.dayMaster} dayElement={bazi.dayMasterElement} favorableElements={userInfo.favorableElements || []} />
          </motion.div>
        );
      })()}

    </div>
          );
        })()
      )}
    </>
  );
}
