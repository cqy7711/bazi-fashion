import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, BarChart3, CandlestickChart, Check, ChevronsUpDown, TrendingUp, Users } from 'lucide-react';
import type { UserBirthInfo } from '../shared/types';
import { COLOR_TOKENS, SHADOW_TOKENS } from '../theme/designTokens';
import { DayunKLineChart, generateCandlestickData, generateDayunData, type DayunData } from './ResultPage';
import { getOrCreateAnonUserId } from '../utils/userIdentity';

const USER_ID = getOrCreateAnonUserId();

async function readJsonSafe(res: Response) {
  const text = await res.text();
  if (!text) return {};
  return JSON.parse(text);
}

export default function DayunTrendPage() {
  const navigate = useNavigate();
  const { userId: routeUserId } = useParams<{ userId?: string }>();
  const CURRENT_RECORD_KEY = 'wuxing-current-record-id';
  const isIOS = typeof navigator !== 'undefined' && /iP(hone|od|ad)/i.test(navigator.userAgent);
  const [userInfo, setUserInfo] = useState<UserBirthInfo | null>(null);
  const [dayunData, setDayunData] = useState<DayunData[]>([]);
  const [userList, setUserList] = useState<Array<{
    id: string;
    name: string;
    birthYear?: number;
    birthMonth?: number;
    birthDay?: number;
    gender?: string;
  }>>([]);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [chartType, setChartType] = useState<'kline' | 'bar'>('bar');
  const [selectedDayunIndex, setSelectedDayunIndex] = useState(0);
  const [expandedDetailIndex, setExpandedDetailIndex] = useState<number | null>(null);
  const [klineRange, setKlineRange] = useState<'1y' | '10y'>('10y');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const barScrollRef = useRef<HTMLDivElement | null>(null);
  const detailScrollRef = useRef<HTMLDivElement | null>(null);

  const switchUser = (recordId: string) => {
    try {
      sessionStorage.setItem(CURRENT_RECORD_KEY, recordId);
      window.dispatchEvent(new Event('wuxing-current-record-changed'));
    } catch {
      // ignore
    }
    setShowUserMenu(false);
    navigate(`/dayun/${encodeURIComponent(recordId)}`);
  };

  const chartHeight = isIOS ? 190 : 240;

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const listRes = await fetch(`/api/users/${USER_ID}/birth-info`);
        const listJson = await readJsonSafe(listRes);
        const list = Array.isArray(listJson?.items) ? listJson.items : (Array.isArray(listJson) ? listJson : []);
        const normalizedList = list
          .filter((u: any) => u?.id)
          .map((u: any) => ({
            id: String(u.id),
            name: String(u.name || '未命名用户'),
            birthYear: typeof u.birthYear === 'number' ? u.birthYear : undefined,
            birthMonth: typeof u.birthMonth === 'number' ? u.birthMonth : undefined,
            birthDay: typeof u.birthDay === 'number' ? u.birthDay : undefined,
            gender: typeof u.gender === 'string' ? u.gender : undefined,
          }));
        setUserList(normalizedList);

        let savedId: string | undefined;
        try {
          const saved = sessionStorage.getItem(CURRENT_RECORD_KEY);
          if (saved) savedId = saved;
        } catch {
          // ignore
        }

        const candidateIds = [routeUserId, savedId, normalizedList[0]?.id].filter(Boolean) as string[];
        if (!candidateIds.length) throw new Error('没有可用的生辰记录');

        let info: any = null;
        let mp: any = null;
        let resolvedId: string | null = null;
        for (const cid of candidateIds) {
          const rid = encodeURIComponent(cid);
          const infoRes = await fetch(`/api/users/${USER_ID}/birth-info/${rid}`);
          const infoJson = await readJsonSafe(infoRes);
          if (!infoRes.ok || !infoJson || infoJson.error) continue;
          const mpRes = await fetch(`/api/users/${USER_ID}/mingpan-analysis?recordId=${rid}`);
          const mpJson = await readJsonSafe(mpRes);
          info = infoJson;
          mp = mpJson;
          resolvedId = cid;
          break;
        }
        if (!info || !resolvedId) throw new Error('加载用户信息失败');

        const mappedDayun = mp?.dayun
          ? mp.dayun.map((d: any, idx: number) => {
              const seed = ((d.year || 2000) + idx) * 13 % 100;
              const score = d.favorable === '用神' ? 70 + (seed % 15) : 40 + (seed % 15);
              return {
                age: Math.round(d.startAge),
                endAge: Math.round(d.startAge) + 9,
                ganZhi: d.ganZhi,
                element: d.element,
                score,
                year: d.startYear,
                yearEnd: d.startYear + 10,
                favorableElements: mp.favorable,
              } as DayunData;
            })
          : generateDayunData(info);

        if (routeUserId && resolvedId !== routeUserId) {
          navigate(`/dayun/${encodeURIComponent(resolvedId)}`, { replace: true });
        }
        try {
          sessionStorage.setItem(CURRENT_RECORD_KEY, resolvedId);
          window.dispatchEvent(new Event('wuxing-current-record-changed'));
        } catch {
          // ignore
        }

        setUserInfo(info);
        setDayunData(mappedDayun);
        setSelectedDayunIndex(0);
        setExpandedDetailIndex(null);
      } catch (e: any) {
        setError(e?.message || '加载失败');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [routeUserId, navigate]);

  useEffect(() => {
    if (chartType !== 'bar') return;
    const barEl = barScrollRef.current?.querySelector<HTMLElement>(`[data-dayun-bar="${selectedDayunIndex}"]`);
    const detailEl = detailScrollRef.current?.querySelector<HTMLElement>(`[data-dayun-detail="${selectedDayunIndex}"]`);
    if (barEl) {
      barEl.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
    if (detailEl) {
      detailEl.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  }, [selectedDayunIndex, chartType]);

  if (loading) {
    return (
      <div style={{ padding: '48px 20px', textAlign: 'center' }}>
        <p style={{ fontSize: '0.95rem', color: '#7A7692' }}>加载大运走势中...</p>
      </div>
    );
  }

  if (error || !userInfo?.baziResult) {
    return (
      <div style={{ padding: '28px' }}>
        <div style={{ background: '#FFFFFF', borderRadius: 16, border: '1px solid #EEEAF8', padding: '24px', textAlign: 'center' }}>
          <p style={{ fontSize: '0.95rem', color: '#6D6883', marginBottom: 12 }}>{error || '无法读取大运数据'}</p>
          <Link to="/" style={{ color: COLOR_TOKENS.brand.coral, textDecoration: 'none', fontWeight: 700 }}>返回首页</Link>
        </div>
      </div>
    );
  }

  const bazi = userInfo.baziResult as any;
  const candlestickData = generateCandlestickData(dayunData, bazi.dayMaster, bazi.dayMasterElement, userInfo.favorableElements || []);
  const startAge = candlestickData[0]?.age || 3;
  const maxScore = Math.max(100, ...dayunData.map(d => d.score || 0));
  const selectedKline = candlestickData[Math.min(Math.max(selectedDayunIndex, 0), Math.max(0, candlestickData.length - 1))];
  const currentScore = typeof selectedKline?.score === 'number' ? selectedKline.score : (dayunData[0]?.score || 60);
  const prevScore = typeof candlestickData?.[Math.max(0, selectedDayunIndex - 1)]?.score === 'number'
    ? candlestickData[Math.max(0, selectedDayunIndex - 1)].score
    : currentScore;
  const pct = prevScore ? ((currentScore - prevScore) / Math.max(1, prevScore)) * 100 : 0;
  const scoreMax = Math.max(...candlestickData.map(d => d?.high ?? 0), 0);
  const scoreMin = Math.min(...candlestickData.map(d => d?.low ?? 100), 100);
  const buildTenYearOverall = (kline: any) => {
    const yearly = Array.isArray(kline?.yearlyDetails) ? kline.yearlyDetails : [];
    if (!yearly.length) return (kline?.summary || '').trim();
    const avgScore = yearly.reduce((sum: number, y: any) => sum + (y?.yearScore || 0), 0) / yearly.length;
    const bestYear = yearly.reduce((best: any, y: any) => ((y?.yearScore || 0) > (best?.yearScore || 0) ? y : best), yearly[0]);
    const worstYear = yearly.reduce((worst: any, y: any) => ((y?.yearScore || 0) < (worst?.yearScore || 0) ? y : worst), yearly[0]);

    const dayunStem = kline?.ganZhi?.[0] || '甲';
    const stemToElement: Record<string, string> = { '甲': '木', '乙': '木', '丙': '火', '丁': '火', '戊': '土', '己': '土', '庚': '金', '辛': '金', '壬': '水', '癸': '水' };
    const element = stemToElement[dayunStem] || '木';

    let overall = '';
    if (avgScore >= 75) overall = '这十年整体运势非常旺盛，是人生发展的黄金期。';
    else if (avgScore >= 65) overall = '这十年运势较好，机遇与挑战并存，宜积极进取。';
    else if (avgScore >= 55) overall = '这十年运势平稳，稳扎稳打可有所收获。';
    else if (avgScore >= 45) overall = '这十年运势有所波动，宜守不宜攻，谨慎行事。';
    else overall = '这十年运势较低，建议韬光养晦，积累等待时机。';

    let elementTip = '';
    if (element === '木') elementTip = '大运见木，利文书学业、创业发展';
    else if (element === '火') elementTip = '大运见火，利名声地位、社交人脉';
    else if (element === '土') elementTip = '大运见土，利房产田产、稳定积累';
    else if (element === '金') elementTip = '大运见金，利财运投资、事业突破';
    else elementTip = '大运见水，利智慧流通、变通发展';

    return `${overall} ${bestYear?.year}年运势最佳，是把握机遇的关键年份；${worstYear?.year}年需特别注意。${elementTip}。`;
  };

  return (
    <div style={{
      width: '100%',
      maxWidth: isIOS ? 960 : 1100,
      margin: '0 auto',
      borderRadius: isIOS ? 20 : 24,
      border: '1px solid rgba(170,162,192,0.2)',
      background: 'linear-gradient(165deg, rgba(255,255,255,0.92) 0%, rgba(248,246,255,0.88) 60%, rgba(255,252,254,0.9) 100%)',
      boxShadow: SHADOW_TOKENS.glassCard,
      padding: isIOS ? '10px 10px 14px' : '14px 14px 18px',
    }}>
      {/* iOS: screenshot-like KPI header for K-line */}
      {isIOS && chartType === 'kline' ? (
        <div style={{ padding: '6px 4px 8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
              <Link
                to={routeUserId ? `/result/${encodeURIComponent(routeUserId)}` : '/'}
                style={{
                  width: 34, height: 34, borderRadius: 12,
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  border: '1px solid rgba(145,138,173,0.22)', background: 'rgba(255,255,255,0.9)', color: '#4B4661',
                }}
              >
                <ArrowLeft size={16} />
              </Link>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: '0.9rem', fontWeight: 900, color: '#2F2B42', letterSpacing: '-0.02em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {userInfo.name} / 人生K线
                </p>
              </div>
            </div>
            {/* 右上角 3 个图标按产品要求移除 */}
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', padding: '14px 4px 8px' }}>
            <div>
              <div style={{ fontSize: '2.4rem', fontWeight: 950, color: '#18B67A', letterSpacing: '-0.03em', lineHeight: 1 }}>
                {Number(currentScore).toFixed(2)}
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 8 }}>
                <span style={{ fontSize: '0.82rem', color: '#6F6A85', fontWeight: 650 }}>
                  当前年龄: {Math.round(selectedKline?.age ?? startAge)}岁
                </span>
                <span style={{ fontSize: '0.82rem', color: pct >= 0 ? '#18B67A' : '#E1526D', fontWeight: 800 }}>
                  {pct >= 0 ? '+' : ''}{pct.toFixed(2)}%
                </span>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.78rem', color: '#8E88A6' }}>最高 {Number(scoreMax || 0).toFixed(2)}</div>
              <div style={{ fontSize: '0.78rem', color: '#8E88A6', marginTop: 6 }}>最低 {Number(scoreMin || 0).toFixed(2)}</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 4px 10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
              <button
                type="button"
                onClick={() => setKlineRange('1y')}
                style={{
                  border: 'none',
                  background: 'transparent',
                  padding: 0,
                  fontSize: '0.85rem',
                  fontWeight: klineRange === '1y' ? 900 : 650,
                  color: klineRange === '1y' ? '#2F2B42' : '#8E88A6',
                  position: 'relative',
                }}
              >
                1y(流年)
                {klineRange === '1y' && (
                  <span style={{ position: 'absolute', left: 0, right: 0, bottom: -8, height: 3, borderRadius: 999, background: '#E6B400' }} />
                )}
              </button>
              <button
                type="button"
                onClick={() => setKlineRange('10y')}
                style={{
                  border: 'none',
                  background: 'transparent',
                  padding: 0,
                  fontSize: '0.85rem',
                  fontWeight: klineRange === '10y' ? 900 : 650,
                  color: klineRange === '10y' ? '#2F2B42' : '#8E88A6',
                  position: 'relative',
                }}
              >
                10y(大运)
                {klineRange === '10y' && (
                  <span style={{ position: 'absolute', left: 0, right: 0, bottom: -8, height: 3, borderRadius: 999, background: '#E6B400' }} />
                )}
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 34, height: 24, borderRadius: 8,
                border: '1px solid rgba(145,138,173,0.18)',
                background: 'rgba(255,255,255,0.85)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#18B67A',
              }}>
                <TrendingUp size={16} />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: isIOS ? 10 : 12 }}>
          <Link
            to={routeUserId ? `/result/${encodeURIComponent(routeUserId)}` : '/'}
            style={{
              width: isIOS ? 34 : 36, height: isIOS ? 34 : 36, borderRadius: isIOS ? 11 : 12, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              border: '1px solid rgba(145,138,173,0.24)', background: '#FFFFFF', color: '#625D79',
            }}
          >
            <ArrowLeft size={isIOS ? 15 : 16} />
          </Link>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: isIOS ? '0.98rem' : '1.02rem', fontWeight: 800, color: '#3A3650' }}>大运走势</p>
            <p style={{ fontSize: isIOS ? '0.72rem' : '0.75rem', color: '#8E88A6' }}>{userInfo.name} · 独立详情页</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, position: 'relative' }}>
            <button
              type="button"
              onClick={() => setChartType(prev => (prev === 'kline' ? 'bar' : 'kline'))}
              style={{
                height: isIOS ? 30 : 32,
                padding: '0 11px',
                borderRadius: 999,
                border: chartType === 'bar' ? '1px solid rgba(255,120,144,0.48)' : '1px solid rgba(79,152,236,0.4)',
                background: chartType === 'bar'
                  ? 'linear-gradient(135deg, rgba(255,111,145,0.18), rgba(255,173,102,0.14), #FFFFFF)'
                  : 'linear-gradient(135deg, rgba(74,142,241,0.14), rgba(96,185,245,0.12), #FFFFFF)',
                color: chartType === 'bar' ? '#D94F77' : '#4A73C8',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                fontSize: isIOS ? '0.66rem' : '0.7rem',
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: chartType === 'bar'
                  ? '0 6px 14px rgba(255,111,145,0.22), inset 0 1px 0 rgba(255,255,255,0.74)'
                  : '0 6px 14px rgba(74,142,241,0.2), inset 0 1px 0 rgba(255,255,255,0.72)',
              }}
            >
              {chartType === 'bar' ? <CandlestickChart size={14} /> : <BarChart3 size={14} />}
              {chartType === 'bar' ? '切换K线图' : '返回柱状图'}
            </button>
            <button
              type="button"
              onClick={() => setShowUserMenu(v => !v)}
              style={{
                height: isIOS ? 30 : 32,
                padding: '0 10px',
                borderRadius: 999,
                border: '1px solid rgba(128,120,160,0.25)',
                background: '#FFFFFF',
                color: '#625D79',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                fontSize: isIOS ? '0.66rem' : '0.7rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <Users size={14} />
              切换用户
              <ChevronsUpDown size={12} />
            </button>
            {showUserMenu && (
            <div style={{
              position: 'absolute',
              right: 0,
              top: isIOS ? 36 : 38,
              width: isIOS ? 240 : 260,
              maxHeight: 280,
              overflowY: 'auto',
              borderRadius: 12,
              border: '1px solid rgba(91,92,255,0.2)',
              background: '#FFFFFF',
              boxShadow: '0 10px 22px rgba(76,90,176,0.16)',
              zIndex: 20,
              overflow: 'hidden',
            }}>
              <div style={{ padding: isIOS ? '9px 12px' : '10px 14px', borderBottom: '1px solid rgba(143,104,255,0.12)', background: '#F8F9FC' }}>
                <span style={{ fontSize: isIOS ? '0.66rem' : '0.7rem', color: '#8E88A6', fontWeight: 600 }}>
                  已录入用户 ({userList.length})
                </span>
              </div>
              {userList.map((u) => {
                const selected = u.id === (routeUserId || userInfo.id);
                return (
                  <div
                    key={u.id}
                    onClick={() => switchUser(u.id)}
                    style={{
                      padding: isIOS ? '10px 12px' : '12px 14px',
                      cursor: 'pointer',
                      background: selected ? 'rgba(143,104,255,0.08)' : 'transparent',
                      borderBottom: '1px solid #F8F8F8',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={(e) => {
                      if (!selected) (e.currentTarget as HTMLElement).style.background = '#F8F8F8';
                    }}
                    onMouseLeave={(e) => {
                      if (!selected) (e.currentTarget as HTMLElement).style.background = 'transparent';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: isIOS ? 30 : 32,
                        height: isIOS ? 30 : 32,
                        borderRadius: 10,
                        background: selected
                          ? 'linear-gradient(135deg, #8F68FF, #2CCBFF)'
                          : '#E8E8E8',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: isIOS ? '0.75rem' : '0.8rem',
                        fontWeight: 700,
                        color: selected ? '#FFFFFF' : '#999',
                        flexShrink: 0,
                      }}>
                        {u.name.charAt(0)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: isIOS ? '0.78rem' : '0.84rem', fontWeight: 700, color: '#3F3656', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {u.name}
                          </span>
                          {selected && (
                            <span style={{ fontSize: '0.6rem', padding: '2px 6px', background: 'rgba(143,104,255,0.18)', color: '#7A5EE0', borderRadius: 4, fontWeight: 600 }}>
                              当前
                            </span>
                          )}
                        </div>
                        <span style={{ fontSize: isIOS ? '0.63rem' : '0.66rem', color: '#8E88A6' }}>
                          {u.birthYear && u.birthMonth && u.birthDay
                            ? `${u.birthYear}.${String(u.birthMonth).padStart(2, '0')}.${String(u.birthDay).padStart(2, '0')}`
                            : '生日信息未完善'}
                          {u.gender ? ` · ${u.gender === 'male' ? '男' : u.gender === 'female' ? '女' : u.gender}` : ''}
                        </span>
                      </div>
                      {selected && <Check size={12} color="#6A58C8" />}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      )}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        {chartType === 'kline' ? (
          <DayunKLineChart
            data={candlestickData}
            startAge={startAge}
            userInfo={userInfo}
            dayMaster={bazi.dayMaster}
            dayElement={bazi.dayMasterElement}
            favorableElements={userInfo.favorableElements || []}
            controlledIndex={selectedDayunIndex}
            onIndexChange={(idx) => setSelectedDayunIndex(idx)}
          />
        ) : (
          <div style={{
            width: '100%',
            borderRadius: isIOS ? 12 : 14,
            background: 'linear-gradient(145deg, rgba(255,255,255,0.9), rgba(248,246,255,0.84))',
            border: '1px solid rgba(188,180,214,0.2)',
            padding: isIOS ? '10px 10px 12px' : '14px 14px 16px',
          }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 }}>
              <p style={{ fontSize: isIOS ? '0.92rem' : '0.96rem', fontWeight: 800, color: '#343248' }}>十年分值柱状图</p>
              <p style={{ fontSize: isIOS ? '0.66rem' : '0.7rem', color: '#86809B' }}>每十年综合分值</p>
            </div>
            <div
              ref={barScrollRef}
              style={{
              height: chartHeight,
              display: 'flex',
              alignItems: 'flex-end',
              gap: isIOS ? 8 : 12,
              padding: isIOS ? '8px 4px 0' : '8px 6px 0',
              borderTop: '1px dashed rgba(170,162,192,0.22)',
              overflowX: 'auto',
              scrollBehavior: 'smooth',
            }}>
              {dayunData.map((d, idx) => {
                const barH = Math.max(18, Math.round((d.score / maxScore) * (chartHeight - 58)));
                const grad = d.score >= 60
                  ? 'linear-gradient(180deg, #FF8A6D 0%, #FF5F90 100%)'
                  : 'linear-gradient(180deg, #5CCB8B 0%, #30B57D 100%)';
                const selected = selectedDayunIndex === idx;
                return (
                  <button
                    key={`${d.ganZhi}-${idx}`}
                    data-dayun-bar={idx}
                    type="button"
                    onClick={() => setSelectedDayunIndex(idx)}
                    style={{
                      flex: 1,
                      minWidth: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 6,
                      border: 'none',
                      background: selected ? 'rgba(143,104,255,0.08)' : 'transparent',
                      borderRadius: 10,
                      padding: '4px 2px',
                      cursor: 'pointer',
                    }}
                  >
                    <span style={{ fontSize: isIOS ? '0.62rem' : '0.66rem', color: '#6A6581', fontWeight: 700 }}>{d.score}</span>
                    <div style={{
                      width: isIOS ? '22px' : '26px',
                      height: `${barH}px`,
                      borderRadius: '8px 8px 4px 4px',
                      background: grad,
                      boxShadow: selected
                        ? (d.score >= 60 ? '0 8px 16px rgba(255,95,144,0.34)' : '0 8px 16px rgba(48,181,125,0.34)')
                        : (d.score >= 60 ? '0 6px 12px rgba(255,95,144,0.22)' : '0 6px 12px rgba(48,181,125,0.22)'),
                      transform: selected ? 'translateY(-2px)' : 'none',
                      transition: 'all 0.2s ease',
                    }} />
                    <div style={{ textAlign: 'center' }}>
                      <p style={{ fontSize: isIOS ? '0.65rem' : '0.7rem', color: selected ? '#3D3558' : '#4F4A64', fontWeight: 700 }}>{Math.round(d.age)}岁</p>
                      <p style={{ fontSize: isIOS ? '0.62rem' : '0.66rem', color: selected ? '#6A58C8' : '#8E88A6', fontWeight: selected ? 700 : 500 }}>{d.ganZhi}</p>
                    </div>
                  </button>
                );
              })}
            </div>
            <div style={{ marginTop: 12, borderTop: '1px solid rgba(170,162,192,0.2)', paddingTop: 10 }}>
              <p style={{ fontSize: isIOS ? '0.84rem' : '0.9rem', fontWeight: 800, color: '#343248', marginBottom: 8 }}>
                大运详解
              </p>
              <div
                ref={detailScrollRef}
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                  gap: isIOS ? 8 : 10,
                  paddingBottom: 6,
                }}
              >
                {dayunData.map((d, idx) => {
                  const isFuture = d.year > new Date().getFullYear();
                  const scoreColor = d.score >= 60 ? '#FF5F90' : '#30B57D';
                  const selected = selectedDayunIndex === idx;
                  const expanded = expandedDetailIndex === idx;
                  const klineMatched = candlestickData[idx];
                  const tenYearSummary = buildTenYearOverall(klineMatched);
                  return (
                    <div
                      key={`bar-detail-${d.ganZhi}-${idx}`}
                      data-dayun-detail={idx}
                      style={{
                        minWidth: 0,
                        padding: isIOS ? '10px 9px' : '12px 10px',
                        borderRadius: 10,
                        border: isFuture
                          ? '1px solid #E6E6EB'
                          : selected
                            ? `1px solid ${scoreColor}60`
                            : `1px solid ${scoreColor}30`,
                        background: isFuture ? '#F6F6F8' : (selected ? 'rgba(255,255,255,0.98)' : '#FFFFFF'),
                        boxShadow: isFuture
                          ? 'none'
                          : selected
                            ? `0 8px 16px ${scoreColor}26`
                            : '0 4px 10px rgba(122,116,150,0.08)',
                        opacity: isFuture ? 0.8 : 1,
                        flexShrink: 0,
                        cursor: 'pointer',
                        transform: selected ? 'translateY(-2px)' : 'none',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <p style={{ fontSize: isIOS ? '0.8rem' : '0.86rem', fontWeight: 800, color: isFuture ? '#A9A9B2' : '#323048' }}>
                        {Math.round(d.age)}-{Math.round(d.endAge)}岁
                      </p>
                      <p style={{ fontSize: isIOS ? '0.72rem' : '0.76rem', color: isFuture ? '#B5B5BE' : '#6A6581', marginTop: 2 }}>
                        {d.ganZhi}
                      </p>
                      <p style={{ fontSize: isIOS ? '0.66rem' : '0.7rem', color: '#A8A3BB', marginTop: 3 }}>
                        {d.year}-{d.yearEnd}年
                      </p>
                      <p style={{ fontSize: isIOS ? '0.9rem' : '0.96rem', fontWeight: 900, color: isFuture ? '#BEBEC7' : scoreColor, marginTop: 8 }}>
                        {isFuture ? '🔒' : `${d.score}分`}
                      </p>
                      <button
                        type="button"
                        disabled={isFuture}
                        onClick={() => {
                          if (isFuture) return;
                          setSelectedDayunIndex(idx);
                          setExpandedDetailIndex(expanded ? null : idx);
                        }}
                        style={{
                          marginTop: 2,
                          border: 'none',
                          background: 'transparent',
                          padding: 0,
                          fontSize: isIOS ? '0.7rem' : '0.74rem',
                          color: isFuture ? '#AFAFC0' : '#7B7794',
                          fontWeight: 700,
                          cursor: isFuture ? 'not-allowed' : 'pointer',
                        }}
                      >
                        {isFuture ? '待解锁' : (expanded ? '收起' : '详情')}
                      </button>
                      {!isFuture && expanded && (
                        <div style={{
                          marginTop: 8,
                          padding: '8px 8px',
                          borderRadius: 8,
                          background: 'linear-gradient(145deg, rgba(255,255,255,0.94), rgba(247,244,252,0.9))',
                          border: '1px solid rgba(170,162,192,0.2)',
                        }}>
                          <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            padding: '2px 7px',
                            borderRadius: 999,
                            background: 'linear-gradient(135deg, rgba(143,104,255,0.18), rgba(44,203,255,0.14))',
                            border: '1px solid rgba(143,104,255,0.24)',
                            marginBottom: 6,
                          }}>
                            <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#7A5EE0' }} />
                            <span style={{ fontSize: isIOS ? '0.6rem' : '0.63rem', fontWeight: 700, color: '#5D4CB5' }}>
                              本阶段重点
                            </span>
                          </div>
                          <p style={{ fontSize: isIOS ? '0.64rem' : '0.67rem', color: '#575171', lineHeight: 1.45 }}>
                            {tenYearSummary || `${d.ganZhi}大运阶段以稳为主，建议循序推进关键事项。`}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
