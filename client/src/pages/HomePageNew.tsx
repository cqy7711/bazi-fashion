import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { COLOR_TOKENS } from '../theme/designTokens';
import { 
  Loader2, Plus, X, Star, Sparkle, Sparkles, Edit3,
  Shirt, Gem, Briefcase, PartyPopper, Gift,
  Leaf, Flame, Mountain, CircleDot, Droplets
} from 'lucide-react';
import type { UserBirthInfoListItem, UserBirthInfo, OutfitRecommendation, BraceletRecommendation } from './types';

// ── 多巴胺配色系统 ──
const PALETTE = {
  coral: COLOR_TOKENS.brand.coral,
  coralLight: 'rgba(255,107,157,0.12)',
  amber: COLOR_TOKENS.brand.orange,
  amberLight: 'rgba(255,157,107,0.12)',
  sunflower: COLOR_TOKENS.brand.yellow,
  mint: '#6BCB77',
  mintLight: 'rgba(107,203,119,0.12)',
  sky: COLOR_TOKENS.brand.blue,
  skyLight: 'rgba(77,150,255,0.12)',
  purple: COLOR_TOKENS.brand.purple,
  purpleLight: 'rgba(155,89,182,0.12)',
};

// 渐变色配置
const GRADIENTS = {
  coral: `linear-gradient(135deg, ${COLOR_TOKENS.brand.coral} 0%, ${COLOR_TOKENS.brand.orange} 100%)`,
  amber: `linear-gradient(135deg, ${COLOR_TOKENS.brand.orange} 0%, ${COLOR_TOKENS.brand.yellow} 100%)`,
  mint: `linear-gradient(135deg, #6BCB77 0%, ${COLOR_TOKENS.brand.blue} 100%)`,
  purple: `linear-gradient(135deg, ${COLOR_TOKENS.brand.purple} 0%, ${COLOR_TOKENS.brand.coral} 100%)`,
  sky: `linear-gradient(135deg, ${COLOR_TOKENS.brand.blue} 0%, #6BCB77 100%)`,
};

const USER_ID = 'user_default';

const SCENES = [
  { key: 'work', label: '职场', icon: <Briefcase style={{ width: '16px', height: '16px' }} /> },
  { key: 'daily', label: '日常', icon: <Shirt style={{ width: '16px', height: '16px' }} /> },
  { key: 'party', label: '聚会', icon: <PartyPopper style={{ width: '16px', height: '16px' }} /> },
  { key: 'holiday', label: '节日', icon: <Gift style={{ width: '16px', height: '16px' }} /> },
];

// 五行配置
const WUXING = [
  { key: 'wood', name: '木', color: '#4ADE80', icon: <Leaf style={{ width: '10px', height: '10px' }} /> },
  { key: 'fire', name: '火', color: '#FF6B6B', icon: <Flame style={{ width: '10px', height: '10px' }} /> },
  { key: 'earth', name: '土', color: '#D4A000', icon: <Mountain style={{ width: '10px', height: '10px' }} /> },
  { key: 'metal', name: '金', color: '#7B8FA8', icon: <CircleDot style={{ width: '10px', height: '10px' }} /> },
  { key: 'water', name: '水', color: '#00A8E8', icon: <Droplets style={{ width: '10px', height: '10px' }} /> },
];

// 辅助函数
function timeToBeijing(timeStr: string): string {
  const timeMap: Record<string, string> = {
    '子时': '23:00-01:00', '丑时': '01:00-03:00', '寅时': '03:00-05:00',
    '卯时': '05:00-07:00', '辰时': '07:00-09:00', '巳时': '09:00-11:00',
    '午时': '11:00-13:00', '未时': '13:00-15:00', '申时': '15:00-17:00',
    '酉时': '17:00-19:00', '戌时': '19:00-21:00', '亥时': '21:00-23:00',
  };
  return timeMap[timeStr] || timeStr;
}

const fadeUp = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } };

export default function HomePage() {
  const navigate = useNavigate();
  const [records, setRecords] = useState<UserBirthInfoListItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: '',
    birthYear: new Date().getFullYear() - 25,
    birthMonth: 1,
    birthDay: 1,
    birthHour: 12,
    gender: 'male' as 'male' | 'female',
    calendarType: 'solar' as 'solar' | 'lunar',
  });
  
  const [previewInfo, setPreviewInfo] = useState<UserBirthInfo | null>(null);
  const [outfitRec, setOutfitRec] = useState<OutfitRecommendation | null>(null);
  const [braceletRec, setBraceletRec] = useState<BraceletRecommendation | null>(null);
  const [activeScene, setActiveScene] = useState('work');

  // 获取选中记录
  const selectedRecord = records.find(r => r.id === selectedId);

  useEffect(() => { fetchRecords(); }, []);

  async function fetchRecords() {
    setLoading(true);
    try {
      const res = await fetch(`/api/users/${USER_ID}/birth-info`);
      if (res.ok) {
        const data = await res.json();
        setRecords(data.items || data.records || []);
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  async function selectRecord(id: string) {
    setSelectedId(id);
    await fetchRecommendations(id);
  }

  async function fetchRecommendations(id: string) {
    try {
      const [info, or, br] = await Promise.all([
        fetch(`/api/users/${USER_ID}/birth-info/${id}`).then(r => r.json()),
        fetch(`/api/users/${USER_ID}/outfit-recommendation?recordId=${id}`).then(r => r.json()),
        fetch(`/api/users/${USER_ID}/bracelet-recommendation?recordId=${id}`).then(r => r.json()),
      ]);
      if (!info.error) setPreviewInfo(info);
      if (!or.error) setOutfitRec(or);
      if (!br.error) setBraceletRec(br);
    } catch (e) { console.error(e); }
  }

  async function handleDelete(id: string) {
    if (!confirm('确认删除？')) return;
    await fetch(`/api/users/${USER_ID}/birth-info/${id}`, { method: 'DELETE' });
    if (selectedId === id) {
      setSelectedId(null);
      setPreviewInfo(null);
      setOutfitRec(null);
      setBraceletRec(null);
    }
    fetchRecords();
  }

  function handleEdit(record: UserBirthInfoListItem) {
    setForm({
      name: record.name,
      birthYear: record.birthYear,
      birthMonth: record.birthMonth,
      birthDay: record.birthDay,
      birthHour: record.birthHour,
      gender: record.gender as 'male' | 'female',
      calendarType: (record as any).calendarType || 'solar',
    });
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { alert('请输入姓名'); return; }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/users/${USER_ID}/birth-info`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setShowForm(false);
        setForm({ name: '', birthYear: new Date().getFullYear() - 25, birthMonth: 1, birthDay: 1, birthHour: 12, gender: 'male', calendarType: 'solar' });
        await fetchRecords();
      }
    } catch (e) { console.error(e); }
    setSubmitting(false);
  }

  const YEAR_OPTIONS = Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i);
  const MONTH_OPTIONS = Array.from({ length: 12 }, (_, i) => i + 1);
  const DAY_OPTIONS = Array.from({ length: 31 }, (_, i) => i + 1);
  const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => i);

  // 计算五行分布
  const getFiveElements = () => {
    if (!previewInfo?.baziResult) return { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 };
    const fe = previewInfo.fiveElements as { wood?: number; fire?: number; earth?: number; metal?: number; water?: number } | undefined;
    return {
      wood: fe?.wood || 0,
      fire: fe?.fire || 0,
      earth: fe?.earth || 0,
      metal: fe?.metal || 0,
      water: fe?.water || 0,
    };
  };

  const fiveElements = getFiveElements();
  const totalElements = Object.values(fiveElements).reduce((a, b) => a + b, 0);

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(180deg, #fff 0%, #f8f9fc 100%)',
      fontFamily: 'Outfit, sans-serif',
    }}>
      {/* ── 导航栏 ── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(240,241,248,1)',
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 16px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '10px',
              background: GRADIENTS.coral,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg style={{ width: '20px', height: '20px', color: '#fff' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                <path d="M2 17l10 5 10-5"/>
                <path d="M2 12l10 5 10-5"/>
              </svg>
            </div>
            <div>
              <h1 style={{ fontSize: '14px', fontWeight: 700, color: '#1A1A2E', margin: 0 }}>五行色彩搭配</h1>
              <p style={{ fontSize: '8px', color: '#A0A8C0', letterSpacing: '0.1em', margin: 0 }}>WUXING · COLOR</p>
            </div>
          </div>
          
          {/* 导航 */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <button
              onClick={() => {}}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '8px 12px', borderRadius: '12px',
                background: `${PALETTE.coral}10`, border: 'none', cursor: 'pointer',
              }}
            >
              <svg style={{ width: '16px', height: '16px', color: PALETTE.coral }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
              <span style={{ fontSize: '13px', fontWeight: 600, color: PALETTE.coral }}>首页</span>
            </button>
            <button
              onClick={() => navigate('/chat')}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '8px 12px', borderRadius: '12px',
                background: 'transparent', border: 'none', cursor: 'pointer',
              }}
            >
              <svg style={{ width: '16px', height: '16px', color: '#6B7280' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 6v6l4 2"/>
              </svg>
              <span style={{ fontSize: '13px', fontWeight: 500, color: '#6B7280' }}>AI命理</span>
            </button>
            <button
              onClick={() => navigate('/admin')}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '8px 12px', borderRadius: '12px',
                background: 'transparent', border: 'none', cursor: 'pointer',
              }}
            >
              <svg style={{ width: '16px', height: '16px', color: '#6B7280' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3"/>
                <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
              </svg>
              <span style={{ fontSize: '13px', fontWeight: 500, color: '#6B7280' }}>管理</span>
            </button>
          </nav>
        </div>
      </header>

      {/* ── 主内容 ── */}
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        
        {/* ── 我的生辰卡片 ── */}
        <section style={{
          background: '#fff', borderRadius: '16px', padding: '16px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '1px solid #f0f1f8',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '32px', height: '32px', borderRadius: '10px',
                background: GRADIENTS.coral,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg style={{ width: '16px', height: '16px', color: '#fff' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              </div>
              <h2 style={{ fontSize: '14px', fontWeight: 700, color: '#1A1A2E', margin: 0 }}>我的生辰</h2>
            </div>
            <motion.button
              onClick={() => {
                setShowForm(!showForm);
                if (!showForm) {
                  setForm({ name: '', birthYear: new Date().getFullYear() - 25, birthMonth: 1, birthDay: 1, birthHour: 12, gender: 'male', calendarType: 'solar' });
                }
              }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              style={{
                width: '32px', height: '32px', borderRadius: '10px',
                background: showForm ? `${PALETTE.coral}20` : `${PALETTE.coral}10`,
                border: `2px solid ${showForm ? PALETTE.coral : `${PALETTE.coral}50`}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
              }}
            >
              {showForm ? <X style={{ width: '16px', height: '16px', color: PALETTE.coral }} /> : <Plus style={{ width: '16px', height: '16px', color: PALETTE.coral }} />}
            </motion.button>
          </div>

          {/* 录入表单 */}
          <AnimatePresence>
            {showForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={{ overflow: 'hidden' }}
              >
                <div style={{ paddingTop: '16px', borderTop: `1px solid ${PALETTE.coral}15` }}>
                  <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', color: '#6B7280', marginBottom: '6px', fontWeight: 500 }}>姓名</label>
                      <input
                        value={form.name}
                        onChange={e => setForm({ ...form, name: e.target.value })}
                        placeholder="给自己起个名字"
                        style={{
                          width: '100%', padding: '12px 14px', fontSize: '14px',
                          borderRadius: '12px', border: '1.5px solid #E8EAF6',
                          background: '#F8F9FC', outline: 'none', fontFamily: 'Outfit', color: '#1A1A2E', boxSizing: 'border-box',
                        }}
                      />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                      {[
                        { label: '出生年', value: form.birthYear, options: YEAR_OPTIONS, key: 'birthYear' as const },
                        { label: '出生月', value: form.birthMonth, options: MONTH_OPTIONS, key: 'birthMonth' as const },
                        { label: '出生日', value: form.birthDay, options: DAY_OPTIONS, key: 'birthDay' as const },
                        { label: '出生时', value: form.birthHour, options: HOUR_OPTIONS, key: 'birthHour' as const },
                      ].map(({ label, value, options, key }) => (
                        <div key={key}>
                          <label style={{ display: 'block', fontSize: '10px', color: '#A0A8C0', marginBottom: '4px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</label>
                          <select
                            value={value}
                            onChange={e => setForm({ ...form, [key]: +e.target.value })}
                            style={{ width: '100%', padding: '10px', fontSize: '13px', borderRadius: '12px', border: '1.5px solid #E8EAF6', background: '#F8F9FC', outline: 'none', fontFamily: 'Outfit', color: '#1A1A2E' }}
                          >
                            {options.map(o => <option key={o} value={o}>{key === 'birthHour' ? `${o}:00` : o}</option>)}
                          </select>
                        </div>
                      ))}
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button type="button" onClick={() => setShowForm(false)}
                        style={{ flex: 1, padding: '12px', fontFamily: 'Outfit', fontSize: '13px', fontWeight: 600, background: '#F8F9FC', border: '1.5px solid #E8EAF6', color: '#A0A8C0', borderRadius: '12px', cursor: 'pointer' }}>
                        取消
                      </button>
                      <button type="submit" disabled={submitting}
                        style={{
                          flex: 2, padding: '12px', fontFamily: 'Outfit', fontSize: '13px', fontWeight: 700,
                          background: GRADIENTS.coral, border: 'none', color: '#fff', borderRadius: '12px', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                        }}
                      >
                        {submitting ? <Loader2 style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} /> : <Sparkle style={{ width: '14px', height: '14px' }} />}
                        录入生辰
                      </button>
                    </div>
                  </form>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 用户列表 */}
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
              <Loader2 style={{ width: '18px', height: '18px', color: PALETTE.coral, animation: 'spin 1s linear infinite' }} />
            </div>
          ) : records.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px 12px' }}>
              <div style={{
                width: '44px', height: '44px', margin: '0 auto 10px', borderRadius: '12px',
                background: GRADIENTS.coral, display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Star style={{ width: '22px', height: '22px', color: '#fff' }} />
              </div>
              <p style={{ fontSize: '12px', color: '#A0A8C0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                还没有记录，点击上方 + 新建
                <Sparkles style={{ width: '12px', height: '12px', color: PALETTE.coral }} />
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
              {records.map(r => (
                <motion.div
                  key={r.id}
                  onClick={() => selectRecord(r.id)}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.96 }}
                  style={{
                    flexShrink: 0, width: '110px', padding: '12px 10px',
                    textAlign: 'center', borderRadius: '14px',
                    border: selectedId === r.id ? `2px solid ${PALETTE.coral}` : '1.5px solid #F0F1F8',
                    background: selectedId === r.id ? `${PALETTE.coral}08` : '#fff',
                    cursor: 'pointer', transition: 'all 0.2s', position: 'relative',
                  }}
                >
                  {/* 编辑按钮 */}
                  <div
                    onClick={(e) => { e.stopPropagation(); handleEdit(r); }}
                    style={{
                      position: 'absolute', top: '5px', left: '5px',
                      width: '22px', height: '22px', borderRadius: '50%',
                      background: 'rgba(59,130,246,0.12)', border: 'none',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 3,
                    }}
                  >
                    <Edit3 style={{ width: '12px', height: '12px', color: '#3B82F6' }} />
                  </div>
                  {/* 删除按钮 */}
                  <div
                    onClick={(e) => { e.stopPropagation(); handleDelete(r.id); }}
                    style={{
                      position: 'absolute', top: '5px', right: '5px',
                      width: '22px', height: '22px', borderRadius: '50%',
                      background: 'rgba(239,68,68,0.12)', border: 'none',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 3,
                    }}
                  >
                    <X style={{ width: '12px', height: '12px', color: '#EF4444' }} />
                  </div>

                  <div style={{
                    width: '36px', height: '36px', margin: '0 auto 6px', borderRadius: '50%',
                    background: selectedId === r.id ? PALETTE.coral : `${PALETTE.coral}15`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <span style={{ fontSize: '14px', fontWeight: 800, color: selectedId === r.id ? '#fff' : PALETTE.coral }}>
                      {r.name.charAt(0)}
                    </span>
                  </div>
                  <p style={{ fontSize: '12px', fontWeight: 800, color: selectedId === r.id ? PALETTE.coral : '#1A1A2E', marginBottom: '2px' }}>
                    {r.name}
                  </p>
                  <p style={{ fontSize: '10px', color: '#A0A8C0' }}>
                    {r.birthYear}.{String(r.birthMonth).padStart(2,'0')}.{String(r.birthDay).padStart(2,'0')}
                  </p>
                </motion.div>
              ))}
            </div>
          )}
        </section>

        {/* ── 用户详情显示 ── */}
        {selectedRecord && (
          <>
            {/* 生辰信息卡片 */}
            <section style={{
              background: '#fff', borderRadius: '16px', padding: '16px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '1px solid #f0f1f8',
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                <div style={{ background: '#F8F9FC', borderRadius: '12px', padding: '12px' }}>
                  <p style={{ fontSize: '11px', color: '#6B7280', marginBottom: '4px' }}>昵称</p>
                  <p style={{ fontSize: '14px', fontWeight: 600, color: '#1A1A2E' }}>{selectedRecord.name}</p>
                </div>
                <div style={{ background: '#F8F9FC', borderRadius: '12px', padding: '12px' }}>
                  <p style={{ fontSize: '11px', color: '#6B7280', marginBottom: '4px' }}>出生日期</p>
                  <p style={{ fontSize: '14px', fontWeight: 600, color: '#1A1A2E' }}>{selectedRecord.birthYear}年{selectedRecord.birthMonth}月{selectedRecord.birthDay}日</p>
                </div>
                <div style={{ background: '#F8F9FC', borderRadius: '12px', padding: '12px' }}>
                  <p style={{ fontSize: '11px', color: '#6B7280', marginBottom: '4px' }}>出生时间</p>
                  <p style={{ fontSize: '14px', fontWeight: 600, color: '#1A1A2E' }}>{selectedRecord.birthHour}:00</p>
                </div>
                <div style={{ background: '#F8F9FC', borderRadius: '12px', padding: '12px' }}>
                  <p style={{ fontSize: '11px', color: '#6B7280', marginBottom: '4px' }}>性别</p>
                  <p style={{ fontSize: '14px', fontWeight: 600, color: '#1A1A2E' }}>{selectedRecord.gender === 'male' ? '男' : '女'}</p>
                </div>
              </div>
            </section>

            {/* ── 命盘信息卡片 ── */}
            {previewInfo?.baziResult && (
              <section id="mingpan-section" style={{
                background: '#fff', borderRadius: '16px', padding: '16px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '1px solid #f0f1f8',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '10px',
                    background: GRADIENTS.amber,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <svg style={{ width: '16px', height: '16px', color: '#fff' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="18" height="18" rx="2"/>
                      <path d="M3 9h18"/>
                      <path d="M9 21V9"/>
                    </svg>
                  </div>
                  <h2 style={{ fontSize: '14px', fontWeight: 700, color: '#1A1A2E', margin: 0 }}>命盘信息</h2>
                </div>

                {/* 八字表格 */}
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', minWidth: '400px' }}>
                    <thead>
                      <tr style={{ fontSize: '11px', color: '#A0A8C0', fontWeight: 500 }}>
                        <th style={{ padding: '8px 12px', textAlign: 'left' }}>柱</th>
                        <th style={{ padding: '8px 12px', textAlign: 'center' }}>年柱</th>
                        <th style={{ padding: '8px 12px', textAlign: 'center' }}>月柱</th>
                        <th style={{ padding: '8px 12px', textAlign: 'center' }}>日柱</th>
                        <th style={{ padding: '8px 12px', textAlign: 'center' }}>时柱</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr style={{ borderTop: '1px solid #f0f1f8' }}>
                        <td style={{ padding: '12px', fontSize: '11px', color: '#6B7280', fontWeight: 500 }}>天干</td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <span style={{ display: 'inline-block', padding: '4px 8px', borderRadius: '8px', background: `${PALETTE.coral}10`, color: PALETTE.coral, fontWeight: 700, fontSize: '14px' }}>
                            {previewInfo.baziResult.yearStem || '-'}
                          </span>
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <span style={{ display: 'inline-block', padding: '4px 8px', borderRadius: '8px', background: `${PALETTE.sky}10`, color: PALETTE.sky, fontWeight: 700, fontSize: '14px' }}>
                            {previewInfo.baziResult.monthStem || '-'}
                          </span>
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <span style={{ display: 'inline-block', padding: '4px 8px', borderRadius: '8px', background: `${PALETTE.amber}10`, color: PALETTE.amber, fontWeight: 700, fontSize: '14px' }}>
                            {previewInfo.baziResult.dayStem || '-'}
                          </span>
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <span style={{ display: 'inline-block', padding: '4px 8px', borderRadius: '8px', background: `${PALETTE.mint}10`, color: PALETTE.mint, fontWeight: 700, fontSize: '14px' }}>
                            {previewInfo.baziResult.hourStem || '-'}
                          </span>
                        </td>
                      </tr>
                      <tr style={{ borderTop: '1px solid #f0f1f8' }}>
                        <td style={{ padding: '12px', fontSize: '11px', color: '#6B7280', fontWeight: 500 }}>地支</td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <span style={{ display: 'inline-block', padding: '4px 8px', borderRadius: '8px', background: `${PALETTE.coral}10`, color: PALETTE.coral, fontWeight: 700, fontSize: '14px' }}>
                            {previewInfo.baziResult.yearBranch || '-'}
                          </span>
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <span style={{ display: 'inline-block', padding: '4px 8px', borderRadius: '8px', background: `${PALETTE.sky}10`, color: PALETTE.sky, fontWeight: 700, fontSize: '14px' }}>
                            {previewInfo.baziResult.monthBranch || '-'}
                          </span>
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <span style={{ display: 'inline-block', padding: '4px 8px', borderRadius: '8px', background: `${PALETTE.amber}10`, color: PALETTE.amber, fontWeight: 700, fontSize: '14px' }}>
                            {previewInfo.baziResult.dayBranch || '-'}
                          </span>
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <span style={{ display: 'inline-block', padding: '4px 8px', borderRadius: '8px', background: `${PALETTE.mint}10`, color: PALETTE.mint, fontWeight: 700, fontSize: '14px' }}>
                            {previewInfo.baziResult.hourBranch || '-'}
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* 五行分布 */}
                <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #f0f1f8' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '12px', color: '#6B7280' }}>五行分布</span>
                    <span style={{ fontSize: '11px', color: '#A0A8C0' }}>
                      木:{fiveElements.wood} 火:{fiveElements.fire} 土:{fiveElements.earth} 金:{fiveElements.metal} 水:{fiveElements.water}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '4px', height: '8px', borderRadius: '9999px', overflow: 'hidden' }}>
                    {WUXING.map(wx => {
                      const pct = totalElements > 0 ? (fiveElements[wx.key as keyof typeof fiveElements] / totalElements) * 100 : 0;
                      return <div key={wx.key} style={{ height: '100%', width: `${pct}%`, background: wx.color, borderRadius: '9999px' }} />;
                    })}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '8px' }}>
                    {WUXING.map(wx => (
                      <span key={wx.key} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#6B7280' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: wx.color }} />
                        {wx.name}
                      </span>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* ── 今日推荐卡片 ── */}
            <section style={{
              background: '#fff', borderRadius: '16px', overflow: 'hidden',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '1px solid #f0f1f8',
            }}>
              <div style={{ padding: '16px 16px 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '10px',
                    background: GRADIENTS.purple,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <svg style={{ width: '16px', height: '16px', color: '#fff' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="5"/>
                      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
                    </svg>
                  </div>
                  <h2 style={{ fontSize: '14px', fontWeight: 700, color: '#1A1A2E', margin: 0 }}>今日色彩搭配建议</h2>
                </div>

                {/* 场景选择 */}
                <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '12px' }}>
                  {SCENES.map(scene => (
                    <button
                      key={scene.key}
                      onClick={() => setActiveScene(scene.key)}
                      style={{
                        flexShrink: 0, padding: '10px 16px', borderRadius: '9999px',
                        background: activeScene === scene.key ? GRADIENTS.coral : '#F8F9FC',
                        border: 'none', cursor: 'pointer',
                        boxShadow: activeScene === scene.key ? `0 4px 12px ${PALETTE.coral}30` : 'none',
                        display: 'flex', alignItems: 'center', gap: '6px',
                      }}
                    >
                      <span style={{ color: activeScene === scene.key ? '#fff' : '#6B7280' }}>{scene.icon}</span>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: activeScene === scene.key ? '#fff' : '#6B7280' }}>{scene.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ padding: '16px' }}>
                {/* 今日运势 */}
                <div style={{
                  background: GRADIENTS.coral, borderRadius: '16px', padding: '16px', marginBottom: '16px', color: '#fff',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <svg style={{ width: '20px', height: '20px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                    </svg>
                    <span style={{ fontWeight: 700 }}>今日运势</span>
                    <span style={{ marginLeft: 'auto', fontSize: '11px', background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: '9999px' }}>78分</span>
                  </div>
                  <p style={{ fontSize: '13px', opacity: 0.9, lineHeight: 1.6 }}>
                    今日金木相战，宜静心守正。上午思维敏捷，适合处理文书工作；下午情绪波动，注意控制脾气。佩戴金色或白色饰品可化解冲克。
                  </p>
                </div>

                {/* 配色方案 */}
                {outfitRec?.primaryColors && outfitRec.primaryColors.length > 0 && (
                  <div style={{ marginBottom: '16px' }}>
                    <h3 style={{ fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '12px' }}>推荐配色</h3>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {outfitRec.primaryColors.slice(0, 3).map((color, i) => (
                        <div key={i} style={{
                          flex: 1, borderRadius: '12px', padding: '12px',
                          background: color.color?.startsWith('#') ? color.color : PALETTE.coral,
                          color: '#fff',
                        }}>
                          <p style={{ fontSize: '10px', opacity: 0.8, marginBottom: '4px' }}>
                            {i === 0 ? '主色' : i === 1 ? '辅色' : '点缀'}
                          </p>
                          <p style={{ fontSize: '13px', fontWeight: 700 }}>{color.name || '未命名'}</p>
                          <p style={{ fontSize: '10px', opacity: 0.7 }}>{color.color || '#000'}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 穿搭推荐 */}
                {outfitRec?.outfits && outfitRec.outfits.length > 0 && (
                  <div>
                    <h3 style={{ fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '12px' }}>穿搭灵感</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                      {outfitRec.outfits.slice(0, 3).map((outfit, i) => (
                        <div key={i} style={{
                          aspectRatio: '3/4', borderRadius: '12px', overflow: 'hidden',
                          background: i === 0 ? `${PALETTE.coral}20` : i === 1 ? '#F3F4F6' : `${PALETTE.sky}20`,
                          border: `2px solid ${i === 0 ? `${PALETTE.coral}30` : i === 1 ? '#E5E7EB' : `${PALETTE.sky}30`}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <div style={{ textAlign: 'center', padding: '8px' }}>
                            <svg style={{ width: '32px', height: '32px', margin: '0 auto 8px', color: i === 0 ? `${PALETTE.coral}60` : i === 1 ? '#9CA3AF' : `${PALETTE.sky}60` }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                              <path d="M6 2l2 6h8l2-6"/>
                              <path d="M6 8l2 14h8l2-14"/>
                            </svg>
                            <p style={{ fontSize: '10px', color: '#6B7280' }}>{outfit.title || '穿搭推荐'}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* ── 手串推荐 ── */}
            {braceletRec?.primaryBracelet && (
              <section style={{
                background: '#fff', borderRadius: '16px', padding: '16px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '1px solid #f0f1f8',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '10px',
                    background: GRADIENTS.mint,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <svg style={{ width: '16px', height: '16px', color: '#fff' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="6" cy="12" r="3"/>
                      <circle cx="18" cy="12" r="3"/>
                      <path d="M9 12h6"/>
                    </svg>
                  </div>
                  <h2 style={{ fontSize: '14px', fontWeight: 700, color: '#1A1A2E', margin: 0 }}>手串推荐</h2>
                </div>

                <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '8px' }}>
                  {/* 主推手串 */}
                  <div style={{
                    flexShrink: 0, width: '192px',
                    background: `linear-gradient(135deg, ${PALETTE.coral}08, ${PALETTE.amber}08)`,
                    borderRadius: '12px', padding: '12px',
                    border: `1px solid ${PALETTE.coral}20`,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <div style={{
                        width: '40px', height: '40px', borderRadius: '50%',
                        background: GRADIENTS.coral,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#fff', fontSize: '18px', fontWeight: 700,
                      }}>
                        {braceletRec.primaryBracelet.material?.charAt(0) || 'O'}
                      </div>
                      <div>
                        <p style={{ fontSize: '13px', fontWeight: 700, color: '#1A1A2E' }}>{braceletRec.primaryBracelet.material || '手串'}</p>
                        <p style={{ fontSize: '11px', color: '#6B7280' }}>主推</p>
                      </div>
                    </div>
                    <p style={{ fontSize: '12px', color: '#4B5563', lineHeight: 1.5 }}>
                      {braceletRec.primaryBracelet.effect || '增强运势，提升能量'}
                    </p>
                    <div style={{ display: 'flex', gap: '4px', marginTop: '8px', flexWrap: 'wrap' }}>
                      <span style={{ padding: '4px 8px', background: `${PALETTE.coral}10`, color: PALETTE.coral, fontSize: '10px', borderRadius: '9999px' }}>职场</span>
                      <span style={{ padding: '4px 8px', background: `${PALETTE.amber}10`, color: PALETTE.amber, fontSize: '10px', borderRadius: '9999px' }}>财运</span>
                    </div>
                  </div>

                  {/* 次选手串 */}
                  {braceletRec.secondaryBracelets && braceletRec.secondaryBracelets[0] && (
                    <div style={{
                      flexShrink: 0, width: '192px',
                      background: '#F8F9FC', borderRadius: '12px', padding: '12px',
                      border: '1px solid #E5E7EB',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <div style={{
                          width: '40px', height: '40px', borderRadius: '50%',
                          background: GRADIENTS.amber,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: '#fff', fontSize: '18px', fontWeight: 700,
                        }}>
                          {braceletRec.secondaryBracelets[0].material?.charAt(0) || 'O'}
                        </div>
                        <div>
                          <p style={{ fontSize: '13px', fontWeight: 700, color: '#1A1A2E' }}>{braceletRec.secondaryBracelets[0].material || '手串'}</p>
                          <p style={{ fontSize: '11px', color: '#6B7280' }}>次选</p>
                        </div>
                      </div>
                      <p style={{ fontSize: '12px', color: '#4B5563', lineHeight: 1.5 }}>
                        {braceletRec.secondaryBracelets[0].effect || '改善运势，提升能量'}
                      </p>
                      <div style={{ display: 'flex', gap: '4px', marginTop: '8px', flexWrap: 'wrap' }}>
                        <span style={{ padding: '4px 8px', background: `${PALETTE.purple}10`, color: PALETTE.purple, fontSize: '10px', borderRadius: '9999px' }}>社交</span>
                        <span style={{ padding: '4px 8px', background: `${PALETTE.sky}10`, color: PALETTE.sky, fontSize: '10px', borderRadius: '9999px' }}>健康</span>
                      </div>
                    </div>
                  )}
                </div>
              </section>
            )}
          </>
        )}
      </main>

      {/* ── 底部 ── */}
      <footer style={{ borderTop: '1px solid #f0f1f8', marginTop: '32px', padding: '24px 16px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
          <p style={{ fontSize: '13px', color: '#9CA3AF' }}>五行色彩搭配</p>
          <p style={{ fontSize: '11px', color: '#D1D5DB', marginTop: '4px' }}>用色彩读懂你的五行命理</p>
        </div>
      </footer>

      {/* 加载动画 */}
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
