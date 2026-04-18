import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Lock, Users, FileText, TrendingUp, Calendar, Trash2, Eye, ArrowLeft, LogOut, RefreshCw, Search, BarChart2, PieChart, MousePointerClick, Clock, Activity, TrendingDown } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart as RePieChart, Pie, Cell, LabelList, LineChart, Line } from 'recharts';
import type { UserBirthInfo } from '../shared/types';
import { SHADOW_TOKENS } from '../theme/designTokens';

const ELEMENT_NAMES: Record<string, string> = { wood: '木', fire: '火', earth: '土', metal: '金', water: '水' };
const ELEMENT_COLORS: Record<string, string> = { wood: '#6B8E6B', fire: '#B85C50', earth: '#C9A86C', metal: '#A89B8C', water: '#5A7A8C' };
const ADMIN_PASS = 'bazi-admin-2024';

function cn(...c: (string | boolean | undefined)[]) { return c.filter(Boolean).join(' '); }
function StatCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl border border-white/80 p-5 hover:shadow-[0_16px_28px_rgba(92,69,154,0.14)] transition-all duration-200" style={{ boxShadow: SHADOW_TOKENS.cardSoft }}>
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">{icon}</div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-2xl font-black text-foreground">{value}</p>
          {sub && <p className="text-[10px] text-muted-foreground">{sub}</p>}
        </div>
      </div>
    </div>
  );
}

interface AdminStats { totalRecords: number; todayRecords: number; genderStats: Record<string, number>; elementStats: Record<string, number>; recentRecords: { name: string; birthYear: number; dayMaster: string; createdAt: string }[]; }
interface BaziRecord { id: string; userId: string; name: string; birthYear: number; birthMonth: number; birthDay: number; birthHour: number; gender: string; calendarType: string; languageStyle: string; baziResult: any; fiveElements: any; favorableElements: string[]; unfavorableElements: string[]; createdAt: string; }
interface AnalyticsData { summary: { totalSessions: number; totalEvents: number; activeUsers: number; avgDuration: number; }; eventStats: { type: string; count: number }[]; pageStats: { page: string; count: number }[]; dailyTrend: { date: string; count: number }[]; retention: { day: number; rate: number }[]; topEvents: { userId: string; eventType: string; eventData: any; createdAt: string }[]; }

// 事件类型中文映射
const EVENT_TYPE_NAMES: Record<string, string> = {
  'page_view': '页面访问',
  'click': '点击按钮',
  'ai_chat': 'AI对话',
  'style_select': '风格切换',
  'outfit_view': '穿搭查看',
  'bracelet_view': '手串查看',
  'fortune_view': '运势查看',
  'bazi_calc': '八字测算',
  'dayun_view': '大运查看',
  'session_start': '开始会话',
  'session_end': '结束会话',
};

export default function AdminPage() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('admin-token'));
  const [password, setPassword] = useState('');
  const [logging, setLogging] = useState(false);
  const [loginError, setLoginError] = useState('');

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [records, setRecords] = useState<BaziRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<BaziRecord | null>(null);
  const [activeTab, setActiveTab] = useState<'records' | 'analytics'>('records');
  const [analyticsPeriod, setAnalyticsPeriod] = useState<'7d' | '30d' | 'all'>('7d');
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const LIMIT = 15;

  useEffect(() => { if (token) loadStats(); }, [token]);
  useEffect(() => { if (token && activeTab === 'analytics') loadAnalytics(); }, [token, activeTab, analyticsPeriod]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLogging(true);
    setLoginError('');
    const res = await fetch('/api/admin/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password }) });
    const data = await res.json();
    if (data.success) { localStorage.setItem('admin-token', data.token); setToken(data.token); }
    else setLoginError(data.error || '密码错误');
    setLogging(false);
  }

  function logout() { localStorage.removeItem('admin-token'); setToken(null); }

  async function loadStats() {
    try {
      const res = await fetch('/api/admin/stats');
      setStats(await res.json());
      loadRecords(1, '');
    } catch { console.error('加载统计失败'); }
  }

  async function loadAnalytics() {
    try {
      const res = await fetch(`/api/admin/analytics?period=${analyticsPeriod}`);
      const data = await res.json();
      setAnalytics(data);
    } catch { console.error('加载分析数据失败'); }
  }

  async function loadRecords(p: number, q: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/records?page=${p}&limit=${LIMIT}&search=${encodeURIComponent(q)}`);
      const data = await res.json();
      setRecords(data.records);
      setTotal(data.total);
      setPage(p);
    } catch { console.error('加载记录失败'); }
    setLoading(false);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    loadRecords(1, search);
  }

  async function handleDelete(e: React.MouseEvent, id: string, name: string) {
    e.stopPropagation();
    if (!confirm(`确认删除「${name}」的记录？此操作不可撤销。`)) return;
    await fetch(`/api/admin/records/${id}`, { method: 'DELETE' });
    loadRecords(page, search);
    loadStats();
    if (selectedRecord?.id === id) setSelectedRecord(null);
  }

  // 登录页
  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
          <div className="bg-white rounded-3xl border border-border shadow-xl p-8 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 shadow-orange-200 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-black text-foreground mb-1">管理后台</h1>
            <p className="text-sm text-muted-foreground mb-6">输入管理员密码访问</p>
            <form onSubmit={handleLogin} className="space-y-3">
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="请输入管理员密码"
                className="w-full px-4 py-3 rounded-xl border border-border bg-background text-center text-lg tracking-widest focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" autoFocus />
              {loginError && <p className="text-sm text-red-500">{loginError}</p>}
              <button type="submit" disabled={logging}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 shadow-orange-200 hover:from-amber-600 hover:to-orange-600 text-white font-bold shadow-lg transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                {logging ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                {logging ? '验证中...' : '进入后台'}
              </button>
            </form>
            <div className="mt-6 pt-4 border-t border-border">
              <Link to="/" className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors">
                <ArrowLeft className="w-4 h-4" /> 返回应用
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  const pieData = stats ? Object.entries(stats.elementStats).map(([k, v]) => ({ name: ELEMENT_NAMES[k], value: v, color: ELEMENT_COLORS[k] })).filter(d => d.value > 0) : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50/40 via-sky-50/35 to-emerald-50/35">
      {/* 顶部导航 */}
      <header className="sticky top-0 z-50 bg-white/78 backdrop-blur-md border-b border-white/70 shadow-[0_8px_24px_rgba(86,64,142,0.08)]">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="p-2 rounded-xl hover:bg-secondary/50 transition-colors text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm">☯</span>
              </div>
              <span className="font-bold text-foreground">管理后台</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Tab切换 */}
            <div className="flex bg-secondary/50 rounded-xl p-1">
              <button onClick={() => setActiveTab('records')}
                className={cn('px-3 py-1.5 rounded-lg text-sm font-medium transition-all', activeTab === 'records' ? 'bg-white shadow-[0_8px_16px_rgba(95,77,152,0.14)] text-foreground' : 'text-muted-foreground hover:text-foreground')}>
                用户记录
              </button>
              <button onClick={() => setActiveTab('analytics')}
                className={cn('px-3 py-1.5 rounded-lg text-sm font-medium transition-all', activeTab === 'analytics' ? 'bg-white shadow-[0_8px_16px_rgba(95,77,152,0.14)] text-foreground' : 'text-muted-foreground hover:text-foreground')}>
                用户分析
              </button>
            </div>
            <button onClick={() => { loadStats(); loadRecords(page, search); }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors">
              <RefreshCw className="w-4 h-4" />
            </button>
            <button onClick={logout} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm text-red-500 hover:bg-red-50 transition-colors">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* 用户分析页面 */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {/* 时间范围选择 */}
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground">用户行为分析</h2>
              <div className="flex bg-secondary/50 rounded-xl p-1">
                {[['7d', '近7天'], ['30d', '近30天'], ['all', '全部']].map(([val, label]) => (
                  <button key={val} onClick={() => setAnalyticsPeriod(val as any)}
                    className={cn('px-3 py-1.5 rounded-lg text-sm font-medium transition-all', analyticsPeriod === val ? 'bg-white shadow text-foreground' : 'text-muted-foreground hover:text-foreground')}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* 概览卡片 */}
            {analytics && (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard icon={<Activity className="w-5 h-5" />} label="总会话数" value={analytics.summary.totalSessions} />
                  <StatCard icon={<MousePointerClick className="w-5 h-5" />} label="总事件数" value={analytics.summary.totalEvents} />
                  <StatCard icon={<Users className="w-5 h-5" />} label="活跃用户" value={analytics.summary.activeUsers} />
                  <StatCard icon={<Clock className="w-5 h-5" />} label="平均时长" value={`${Math.floor(analytics.summary.avgDuration / 60)}分`} sub={`${analytics.summary.avgDuration % 60}秒`} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* 每日趋势 */}
                  <div className={`bg-gradient-to-br from-white to-slate-50 rounded-2xl border border-white/80 shadow-[0_10px_20px_rgba(92,69,154,0.08)] p-5`}>
                    <div className="flex items-center gap-2 mb-4">
                      <TrendingUp className="w-4 h-4 text-primary" />
                      <h3 className="text-sm font-bold text-foreground">每日事件趋势</h3>
                    </div>
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={analytics.dailyTrend.map(d => ({ ...d, date: d.date.slice(5) }))}>
                        <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                        <Tooltip formatter={(v: any) => [`${v}次`, '事件数']} contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 12 }} />
                        <Line type="monotone" dataKey="count" stroke="#FF6B9D" strokeWidth={2} dot={{ fill: '#FF6B9D', strokeWidth: 0, r: 4 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  {/* 功能使用排行 */}
                  <div className={`bg-gradient-to-br from-white to-slate-50 rounded-2xl border border-white/80 shadow-[0_10px_20px_rgba(92,69,154,0.08)] p-5`}>
                    <div className="flex items-center gap-2 mb-4">
                      <MousePointerClick className="w-4 h-4 text-primary" />
                      <h3 className="text-sm font-bold text-foreground">功能使用排行</h3>
                    </div>
                    <div className="space-y-2 max-h-[200px] overflow-y-auto">
                      {analytics.eventStats.map((e, i) => (
                        <div key={e.type} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">{i + 1}</span>
                            <span className="text-sm text-foreground">{EVENT_TYPE_NAMES[e.type] || e.type}</span>
                          </div>
                          <span className="text-sm font-semibold text-primary">{e.count}次</span>
                        </div>
                      ))}
                      {analytics.eventStats.length === 0 && (
                        <p className="text-center text-muted-foreground text-sm py-8">暂无数据</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* 留存率 */}
                  <div className={`bg-gradient-to-br from-white to-slate-50 rounded-2xl border border-white/80 shadow-[0_10px_20px_rgba(92,69,154,0.08)] p-5`}>
                    <div className="flex items-center gap-2 mb-4">
                      <TrendingDown className="w-4 h-4 text-primary" />
                      <h3 className="text-sm font-bold text-foreground">用户留存率</h3>
                    </div>
                    <ResponsiveContainer width="100%" height={160}>
                      <BarChart data={analytics.retention}>
                        <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} tickFormatter={v => `第${v}天`} />
                        <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} unit="%" />
                        <Tooltip formatter={(v: any) => [`${v}%`, '留存率']} contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 12 }} />
                        <Bar dataKey="rate" radius={[4, 4, 4, 4]}>
                          {analytics.retention.map((_, i) => <Cell key={i} fill={i === 0 ? '#FF6B9D' : i === 1 ? '#FFB347' : '#7BED9F'} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* 页面访问排行 */}
                  <div className={`bg-gradient-to-br from-white to-slate-50 rounded-2xl border border-white/80 shadow-[0_10px_20px_rgba(92,69,154,0.08)] p-5`}>
                    <div className="flex items-center gap-2 mb-4">
                      <Activity className="w-4 h-4 text-primary" />
                      <h3 className="text-sm font-bold text-foreground">页面访问排行</h3>
                    </div>
                    <div className="space-y-2 max-h-[160px] overflow-y-auto">
                      {analytics.pageStats.map((p, i) => (
                        <div key={p.page} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 text-xs font-bold flex items-center justify-center">{i + 1}</span>
                            <span className="text-sm text-foreground">{p.page || '首页'}</span>
                          </div>
                          <span className="text-sm font-semibold text-blue-600">{p.count}次</span>
                        </div>
                      ))}
                      {analytics.pageStats.length === 0 && (
                        <p className="text-center text-muted-foreground text-sm py-8">暂无数据</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* 最近事件 */}
                  <div className={`bg-gradient-to-br from-white to-slate-50 rounded-2xl border border-white/80 shadow-[0_10px_20px_rgba(92,69,154,0.08)] p-5`}>
                  <h3 className="text-sm font-bold text-foreground mb-4">最近用户行为</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border bg-secondary/20">
                          <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground">用户</th>
                          <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground">事件</th>
                          <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground">详情</th>
                          <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground">时间</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analytics.topEvents.map((e, i) => (
                          <tr key={i} className="border-b border-border last:border-0 hover:bg-secondary/20 transition-colors">
                            <td className="px-4 py-3 text-xs text-foreground">{e.userId.slice(0, 8)}...</td>
                            <td className="px-4 py-3 text-xs">
                              <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                                {EVENT_TYPE_NAMES[e.eventType] || e.eventType}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-xs text-muted-foreground">
                              {e.eventData ? JSON.stringify(e.eventData).slice(0, 30) : '-'}
                            </td>
                            <td className="px-4 py-3 text-xs text-muted-foreground">
                              {new Date(e.createdAt).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                            </td>
                          </tr>
                        ))}
                        {analytics.topEvents.length === 0 && (
                          <tr>
                            <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground text-sm">暂无数据</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* 用户记录页面 */}
        {activeTab === 'records' && (
          <>
        {/* 统计卡片 */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard icon={<Users className="w-5 h-5" />} label="总记录数" value={stats.totalRecords} sub={`今日 +${stats.todayRecords}`} />
            <StatCard icon={<FileText className="w-5 h-5" />} label="男性" value={stats.genderStats['male'] || 0} />
            <StatCard icon={<FileText className="w-5 h-5" />} label="女性" value={stats.genderStats['female'] || 0} />
            <StatCard icon={<TrendingUp className="w-5 h-5" />} label="喜用神最多" value={pieData.length > 0 ? pieData.reduce((a, b) => a.value > b.value ? a : b).name : '-'} />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左侧：记录列表 */}
          <div className="lg:col-span-2 space-y-4">
            {/* 搜索 */}
            <div className={cn(
              'bg-gradient-to-br from-white to-slate-50 rounded-2xl p-4',
              'border border-white/80 shadow-[0_10px_20px_rgba(92,69,154,0.08)]'
            )}>
              <form onSubmit={handleSearch} className="flex gap-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder="搜索姓名、出生年份..."
                    className="w-full pl-9 pr-4 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
                </div>
                <button type="submit" className={cn(
                  'px-4 py-2 rounded-xl text-white text-sm font-medium hover:brightness-105 transition-all',
                  'bg-gradient-to-r from-primary to-pink-500 shadow-[0_10px_20px_rgba(255,107,157,0.25)]'
                )}>搜索</button>
                <button type="button" onClick={() => { setSearch(''); loadRecords(1, ''); }} className={cn(
                  'px-3 py-2 rounded-xl text-sm text-muted-foreground transition-colors',
                  'border border-border hover:bg-secondary/50'
                )}>清空</button>
              </form>
            </div>

            {/* 记录表格 */}
            <div className={cn(
              'bg-gradient-to-br from-white to-slate-50 rounded-2xl overflow-hidden',
              'border border-white/80 shadow-[0_10px_20px_rgba(92,69,154,0.08)]'
            )}>
              <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                <p className="text-sm font-semibold text-foreground">用户记录</p>
                <p className="text-xs text-muted-foreground">共 {total} 条</p>
              </div>

              {loading ? (
                <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
              ) : records.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground text-sm">暂无记录</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className={cn('border-b border-border', 'bg-secondary/20')}>
                        <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground">姓名</th>
                        <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground">性别</th>
                        <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground">出生日期</th>
                        <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground">八字</th>
                        <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground">喜用神</th>
                        <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground">创建时间</th>
                        <th className="text-right px-4 py-2.5 text-xs font-semibold text-muted-foreground">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {records.map((r, i) => (
                        <motion.tr key={r.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                          className={cn(
                            'border-b border-border last:border-0 transition-colors',
                            'hover:bg-secondary/20',
                            selectedRecord?.id === r.id && 'bg-amber-50'
                          )}>
                          <td className="px-4 py-3">
                            <button onClick={() => setSelectedRecord(r)} className="text-sm font-semibold text-foreground hover:text-primary transition-colors text-left">
                              {r.name}
                            </button>
                          </td>
                          <td className="px-4 py-3">
                            <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', r.gender === 'male' ? 'bg-blue-50 text-blue-600' : 'bg-pink-50 text-pink-600')}>
                              {r.gender === 'male' ? '男' : '女'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">
                            {r.birthYear}.{String(r.birthMonth).padStart(2,'0')}.{String(r.birthDay).padStart(2,'0')} {r.birthHour}:00
                          </td>
                          <td className="px-4 py-3">
                            {r.baziResult ? (
                              <div className="flex items-center gap-1">
                                {[
                                  [r.baziResult.yearPillar, '年'],
                                  [r.baziResult.monthPillar, '月'],
                                  [r.baziResult.dayPillar, '日'],
                                  [r.baziResult.hourPillar, '时'],
                                ].map(([gz, label]) => (
                                  <div key={label} className="text-center">
                                    <p className="text-xs font-bold text-foreground">{gz}</p>
                                    <p className="text-[8px] text-muted-foreground">{label}</p>
                                  </div>
                                ))}
                              </div>
                            ) : <span className="text-xs text-muted-foreground">—</span>}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-1">
                              {(r.favorableElements || []).map(el => (
                                <span key={el} className="px-1.5 py-0.5 rounded text-xs font-semibold text-white" style={{ backgroundColor: ELEMENT_COLORS[el] || '#888' }}>
                                  {ELEMENT_NAMES[el]}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">
                            {new Date(r.createdAt).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1">
                              <button onClick={() => setSelectedRecord(r)} className="p-1.5 rounded-lg hover:bg-primary/10 text-primary transition-colors" title="查看详情">
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={(e) => handleDelete(e, r.id, r.name)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-500 transition-colors" title="删除">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* 分页 */}
              {total > LIMIT && (
                <div className="px-4 py-3 border-t border-border flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">第 {(page - 1) * LIMIT + 1}-{Math.min(page * LIMIT, total)} 条，共 {total} 条</p>
                  <div className="flex gap-1">
                    <button onClick={() => loadRecords(page - 1, search)} disabled={page <= 1} className="px-3 py-1 rounded-lg text-xs border border-border hover:bg-secondary/50 disabled:opacity-40 transition-colors">上一页</button>
                    <button onClick={() => loadRecords(page + 1, search)} disabled={page * LIMIT >= total} className="px-3 py-1 rounded-lg text-xs border border-border hover:bg-secondary/50 disabled:opacity-40 transition-colors">下一页</button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 右侧：统计图表 + 详情 */}
          <div className="space-y-4">
            {/* 喜用神饼图 */}
            {stats && pieData.length > 0 && (
              <div className={cn(
                'bg-gradient-to-br from-white to-slate-50 rounded-2xl p-5',
                'border border-white/80 shadow-[0_10px_20px_rgba(92,69,154,0.08)]'
              )}>
                <div className="flex items-center gap-2 mb-4">
                  <PieChart className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-bold text-foreground">喜用神分布</h3>
                </div>
                <ResponsiveContainer width="100%" height={160}>
                  <RePieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                      {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      <LabelList dataKey="name" position="outside" style={{ fontSize: 11, fill: '#6B7280', fontWeight: 'bold' }} />
                    </Pie>
                    <Tooltip formatter={(v: any, name: any, props: any) => [`${v}人`, '数量']} contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 12 }} />
                  </RePieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap gap-2 justify-center mt-2">
                  {pieData.map(d => (
                    <div key={d.name} className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                      <span className="text-xs text-muted-foreground">{d.name} {d.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 性别分布 */}
            {stats && (
              <div className={cn(
                'bg-gradient-to-br from-white to-slate-50 rounded-2xl p-5',
                'border border-white/80 shadow-[0_10px_20px_rgba(92,69,154,0.08)]'
              )}>
                <div className="flex items-center gap-2 mb-4">
                  <BarChart2 className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-bold text-foreground">性别分布</h3>
                </div>
                <ResponsiveContainer width="100%" height={120}>
                  <BarChart data={[
                    { name: '男', value: stats.genderStats['male'] || 0, fill: '#3B82F6' },
                    { name: '女', value: stats.genderStats['female'] || 0, fill: '#EC4899' },
                  ]} layout="vertical" margin={{ top: 0, right: 20, left: -20, bottom: 0 }}>
                    <XAxis type="number" hide />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} width={20} />
                    <Tooltip formatter={(v: any) => [`${v}人`, '数量']} contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 12 }} cursor={{ fill: '#f3f4f6' }} />
                    <Bar dataKey="value" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* 最近记录 */}
            {stats && stats.recentRecords.length > 0 && (
              <div className={cn(
                'bg-gradient-to-br from-white to-slate-50 rounded-2xl p-5',
                'border border-white/80 shadow-[0_10px_20px_rgba(92,69,154,0.08)]'
              )}>
                <div className="flex items-center gap-2 mb-4">
                  <Calendar className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-bold text-foreground">最新记录</h3>
                </div>
                <div className="space-y-2">
                  {stats.recentRecords.map((r, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                      <div>
                        <p className="text-sm font-semibold text-foreground">{r.name}</p>
                        <p className="text-[10px] text-muted-foreground">{r.birthYear}年 · 日主{r.dayMaster}</p>
                      </div>
                      <p className="text-[10px] text-muted-foreground">
                        {new Date(r.createdAt).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
          </>
        )}
      </div>

      {/* 详情弹窗 */}
      <AnimatePresence>
        {selectedRecord && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
            onClick={() => setSelectedRecord(null)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}>
              {/* 弹窗头部 */}
              <div className="sticky top-0 bg-white rounded-t-3xl border-b border-border px-6 py-4 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-foreground">{selectedRecord.name}</h3>
                  <p className="text-xs text-muted-foreground">
                    {selectedRecord.birthYear}.{String(selectedRecord.birthMonth).padStart(2,'0')}.{String(selectedRecord.birthDay).padStart(2,'0')} {selectedRecord.birthHour}:00
                    {' · '}{selectedRecord.gender === 'male' ? '男' : '女'}{' · '}{selectedRecord.calendarType === 'solar' ? '公历' : '农历'}
                  </p>
                </div>
                <button onClick={() => setSelectedRecord(null)} className="p-2 rounded-xl hover:bg-secondary/50 text-muted-foreground transition-colors">
                  ✕
                </button>
              </div>
              {/* 弹窗内容 */}
              <div className="p-6 space-y-5">
                {selectedRecord.baziResult && (
                  <>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-2">四柱八字</p>
                      <div className="grid grid-cols-4 gap-2">
                        {[
                          ['年柱', selectedRecord.baziResult.yearPillar],
                          ['月柱', selectedRecord.baziResult.monthPillar],
                          ['日柱', selectedRecord.baziResult.dayPillar],
                          ['时柱', selectedRecord.baziResult.hourPillar],
                        ].map(([label, value]) => (
                          <div key={label as string} className="text-center p-2 bg-secondary/30 rounded-xl border border-border">
                            <p className="text-[9px] text-muted-foreground">{label as string}</p>
                            <p className="text-sm font-black text-foreground">{value}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
                        <p className="text-xs text-muted-foreground mb-1">日主</p>
                        <p className="text-lg font-black text-foreground">{selectedRecord.baziResult.dayMaster}</p>
                        <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-semibold text-white" style={{ backgroundColor: ELEMENT_COLORS[selectedRecord.baziResult.dayMasterElement] }}>
                          {ELEMENT_NAMES[selectedRecord.baziResult.dayMasterElement]}行
                        </span>
                      </div>
                      <div className="p-3 bg-green-50 rounded-xl border border-green-100">
                        <p className="text-xs text-muted-foreground mb-1">喜用神</p>
                        <div className="flex gap-1 mt-1">
                          {(selectedRecord.favorableElements || []).map(el => (
                            <span key={el} className="px-1.5 py-0.5 rounded text-xs font-semibold text-white" style={{ backgroundColor: ELEMENT_COLORS[el] || '#888' }}>
                              {ELEMENT_NAMES[el]}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-2">十神</p>
                      <div className="grid grid-cols-4 gap-2">
                        {Object.entries(selectedRecord.baziResult.shiShen || {}).map(([key, god]) => {
                          const godStr = String(god);
                          const c = { '比肩': '#6B8E6B', '劫财': '#6B8E6B', '食神': '#B85C50', '伤官': '#B85C50', '偏财': '#C9A86C', '正财': '#C9A86C', '七杀': '#B85C50', '正官': '#B85C50', '偏印': '#5A7A8C', '正印': '#5A7A8C' }[godStr] || '#888';
                          return (
                            <div key={key} className="text-center p-2 bg-secondary/20 rounded-xl">
                              <p className="text-[9px] text-muted-foreground">{key}</p>
                              <span className="text-xs font-bold" style={{ color: c }}>{godStr}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}

                {selectedRecord.fiveElements && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-2">五行分布</p>
                    <ResponsiveContainer width="100%" height={100}>
                      <BarChart data={Object.entries(selectedRecord.fiveElements).map(([k, v]) => ({ name: ELEMENT_NAMES[k], value: v as number }))} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
                        <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                        <Tooltip formatter={(v: any) => [`${v}个`, '数量']} contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                        <Bar dataKey="value" radius={[4, 4, 4, 4]}>
                          {Object.entries(selectedRecord.fiveElements).map(([k, v], i) => <rect key={i} fill={ELEMENT_COLORS[k]} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}

                <div className="text-xs text-muted-foreground text-center pt-2 border-t border-border">
                  创建于 {new Date(selectedRecord.createdAt).toLocaleString('zh-CN')} · ID: {selectedRecord.id.slice(0, 8)}...
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
