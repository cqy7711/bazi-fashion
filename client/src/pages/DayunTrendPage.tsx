import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import type { UserBirthInfo } from '../shared/types';
import { COLOR_TOKENS, SHADOW_TOKENS } from '../theme/designTokens';
import { DayunKLineChart, generateCandlestickData, generateDayunData, type DayunData } from './ResultPage';

const USER_ID = 'user_default';

async function readJsonSafe(res: Response) {
  const text = await res.text();
  if (!text) return {};
  return JSON.parse(text);
}

export default function DayunTrendPage() {
  const { userId: routeUserId } = useParams<{ userId?: string }>();
  const CURRENT_RECORD_KEY = 'wuxing-current-record-id';
  const [userInfo, setUserInfo] = useState<UserBirthInfo | null>(null);
  const [dayunData, setDayunData] = useState<DayunData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        let recordId = routeUserId;
        if (!recordId) {
          try {
            const saved = sessionStorage.getItem(CURRENT_RECORD_KEY);
            if (saved) recordId = saved;
          } catch {
            // ignore
          }
        }
        if (!recordId) {
          const listRes = await fetch(`/api/users/${USER_ID}/birth-info`);
          const listJson = await readJsonSafe(listRes);
          const list = Array.isArray(listJson) ? listJson : [];
          if (!list.length) throw new Error('没有可用的生辰记录');
          recordId = list[0].id;
        }

        const rid = encodeURIComponent(recordId as string);
        const infoRes = await fetch(`/api/users/${USER_ID}/birth-info/${rid}`);
        const mpRes = await fetch(`/api/users/${USER_ID}/mingpan-analysis?recordId=${rid}`);
        const info = await readJsonSafe(infoRes);
        const mp = await readJsonSafe(mpRes);
        if (!info || info.error) throw new Error(info?.error || '加载用户信息失败');

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

        setUserInfo(info);
        setDayunData(mappedDayun);
      } catch (e: any) {
        setError(e?.message || '加载失败');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [routeUserId]);

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

  return (
    <div style={{
      width: '100%',
      maxWidth: 1100,
      margin: '0 auto',
      borderRadius: 24,
      border: '1px solid rgba(170,162,192,0.2)',
      background: 'linear-gradient(165deg, rgba(255,255,255,0.92) 0%, rgba(248,246,255,0.88) 60%, rgba(255,252,254,0.9) 100%)',
      boxShadow: SHADOW_TOKENS.glassCard,
      padding: '14px 14px 18px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <Link
          to={routeUserId ? `/result/${encodeURIComponent(routeUserId)}` : '/'}
          style={{
            width: 36, height: 36, borderRadius: 12, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            border: '1px solid rgba(145,138,173,0.24)', background: '#FFFFFF', color: '#625D79',
          }}
        >
          <ArrowLeft size={16} />
        </Link>
        <div>
          <p style={{ fontSize: '1.02rem', fontWeight: 800, color: '#3A3650' }}>大运走势</p>
          <p style={{ fontSize: '0.75rem', color: '#8E88A6' }}>{userInfo.name} · 独立详情页</p>
        </div>
      </div>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <DayunKLineChart
          data={candlestickData}
          startAge={startAge}
          userInfo={userInfo}
          dayMaster={bazi.dayMaster}
          dayElement={bazi.dayMasterElement}
          favorableElements={userInfo.favorableElements || []}
        />
      </motion.div>
    </div>
  );
}
