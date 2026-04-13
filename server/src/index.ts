import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import db from './db.js';
import { calculateBazi, calculateFiveElements, determineFavorableElements, calculateQiyunAge, calculateChangSheng, calculateShenSha, determineBaziPattern, calculateDayun, calculateDailyFortune, getCurrentDayGanZhi } from './bazi-calculator.js';
import { getOutfitRecommendation, getBraceletRecommendation, getWeatherInfo } from './recommendation.js';
import { calculateTrueSolar } from './true-solar-time.js';
import type { CreateUserBirthInfoRequest, UpdateUserBirthInfoRequest } from '../../shared/types.js';

const app = express();
app.use(cors());
app.use(express.json());

// 默认用户ID（单用户模式）
const DEFAULT_USER_ID = 'user_default';

// ========== 用户生辰信息路由 ==========

// 获取用户生辰列表
app.get('/api/users/:userId/birth-info', (req, res) => {
  try {
    const { userId } = req.params;
    const rows = db.prepare(`
      SELECT id, name, birth_year, birth_month, birth_day, birth_hour,
             gender, calendar_type, language_style
      FROM user_birth_info WHERE user_id = ? ORDER BY created_at DESC
    `).all(userId) as any[];

    res.json({
      items: rows.map(r => ({
        id: r.id, name: r.name, birthYear: r.birth_year, birthMonth: r.birth_month,
        birthDay: r.birth_day, birthHour: r.birth_hour, gender: r.gender,
        calendarType: r.calendar_type, languageStyle: r.language_style,
      })),
      currentId: rows[0]?.id || null,
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// 获取单条生辰记录
app.get('/api/users/:userId/birth-info/:id', (req, res) => {
  try {
    const row = db.prepare(`SELECT * FROM user_birth_info WHERE id = ? AND user_id = ?`).get(req.params.id, req.params.userId) as any;
    if (!row) return res.status(404).json({ error: '记录不存在' });
    res.json(mapRow(row));
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// 创建生辰记录
app.post('/api/users/:userId/birth-info', (req, res) => {
  try {
    const { userId } = req.params;
    const dto: CreateUserBirthInfoRequest = req.body;

    // 真太阳时计算
    let baziHour = dto.birthHour;
    let trueSolarInfo: ReturnType<typeof calculateTrueSolar> | null = null;
    if (dto.birthLocation) {
      trueSolarInfo = calculateTrueSolar(
        dto.birthLocation,
        dto.birthHour,
        dto.birthYear,
        dto.birthMonth,
        dto.birthDay,
      );
      baziHour = trueSolarInfo.baziHour;
    }

    const baziResult = calculateBazi(dto.birthYear, dto.birthMonth, dto.birthDay, baziHour);
    // 注入真太阳时信息
    if (trueSolarInfo) {
      (baziResult as any).trueSolarTime = {
        hour: baziHour,
        minute: 0,
        offsetMinutes: trueSolarInfo.lonDiffMinutes,
        longitude: trueSolarInfo.longitude,
        description: trueSolarInfo.description,
        beijingHour: dto.birthHour,
      };
    }

    const fiveElements = calculateFiveElements(baziResult);
    const favorable = determineFavorableElements(baziResult, dto.birthMonth, fiveElements);

    const id = uuidv4();
    db.prepare(`
      INSERT INTO user_birth_info (id, user_id, name, birth_year, birth_month, birth_day, birth_hour,
        gender, calendar_type, language_style, birth_location, bazi_result, five_elements,
        favorable_elements, unfavorable_elements)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, userId, dto.name || '我的生辰',
      dto.birthYear, dto.birthMonth, dto.birthDay, baziHour,
      dto.gender, dto.calendarType,
      dto.languageStyle || 'normal', dto.birthLocation || '',
      JSON.stringify(baziResult), JSON.stringify(fiveElements),
      JSON.stringify(favorable.favorable), JSON.stringify(favorable.unfavorable)
    );

    res.json({
      id, name: dto.name || '我的生辰',
      ...dto,
      trueSolarHour: baziHour,
      baziResult, fiveElements,
      favorableElements: favorable.favorable, unfavorableElements: favorable.unfavorable,
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// 更新生辰记录
app.patch('/api/users/:userId/birth-info/:id', (req, res) => {
  try {
    const { userId, id } = req.params;
    const dto: UpdateUserBirthInfoRequest = req.body;

    const existing = db.prepare(`SELECT * FROM user_birth_info WHERE id = ? AND user_id = ?`).get(id, userId) as any;
    if (!existing) return res.status(404).json({ error: '记录不存在' });

    const year = dto.birthYear ?? existing.birth_year;
    const month = dto.birthMonth ?? existing.birth_month;
    const day = dto.birthDay ?? existing.birth_day;
    const hour = dto.birthHour ?? existing.birth_hour;
    const location = dto.birthLocation ?? existing.birth_location;

    // 真太阳时计算（只有 birthLocation 变化时才重新计算）
    let baziHour = hour;
    if (dto.birthLocation !== undefined) {
      const trueSolarInfo = calculateTrueSolar(location, hour, year, month, day);
      baziHour = trueSolarInfo.baziHour;
      const baziResult = calculateBazi(year, month, day, baziHour);
      (baziResult as any).trueSolarTime = {
        hour: baziHour, minute: 0,
        offsetMinutes: trueSolarInfo.lonDiffMinutes,
        longitude: trueSolarInfo.longitude,
        description: trueSolarInfo.description,
        beijingHour: hour,
      };
      const fiveElements = calculateFiveElements(baziResult);
      const favorable = determineFavorableElements(baziResult, month, fiveElements);

      db.prepare(`
        UPDATE user_birth_info SET name=?, birth_year=?, birth_month=?, birth_day=?, birth_hour=?,
          gender=?, calendar_type=?, language_style=?, birth_location=?,
          bazi_result=?, five_elements=?, favorable_elements=?, unfavorable_elements=?,
          updated_at=datetime('now')
        WHERE id=? AND user_id=?
      `).run(
        dto.name ?? existing.name, year, month, day, baziHour,
        dto.gender ?? existing.gender,
        dto.calendarType ?? existing.calendar_type,
        dto.languageStyle ?? existing.language_style,
        location,
        JSON.stringify(baziResult), JSON.stringify(fiveElements),
        JSON.stringify(favorable.favorable), JSON.stringify(favorable.unfavorable),
        id, userId
      );
    } else {
      const baziResult = calculateBazi(year, month, day, baziHour);
      const fiveElements = calculateFiveElements(baziResult);
      const favorable = determineFavorableElements(baziResult, month, fiveElements);
      db.prepare(`
        UPDATE user_birth_info SET name=?, birth_year=?, birth_month=?, birth_day=?, birth_hour=?,
          gender=?, calendar_type=?, language_style=?, birth_location=?,
          bazi_result=?, five_elements=?, favorable_elements=?, unfavorable_elements=?,
          updated_at=datetime('now')
        WHERE id=? AND user_id=?
      `).run(
        dto.name ?? existing.name, year, month, day, baziHour,
        dto.gender ?? existing.gender,
        dto.calendarType ?? existing.calendar_type,
        dto.languageStyle ?? existing.language_style,
        location,
        JSON.stringify(baziResult), JSON.stringify(fiveElements),
        JSON.stringify(favorable.favorable), JSON.stringify(favorable.unfavorable),
        id, userId
      );
    }

    res.json(mapRow(db.prepare(`SELECT * FROM user_birth_info WHERE id=?`).get(id) as any));
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// 删除生辰记录
app.delete('/api/users/:userId/birth-info/:id', (req, res) => {
  try {
    const { userId, id } = req.params;
    db.prepare(`DELETE FROM user_birth_info WHERE id=? AND user_id=?`).run(id, userId);
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// 获取五行分析
app.get('/api/users/:userId/five-elements-analysis', (req, res) => {
  try {
    const { userId } = req.params;
    const { recordId } = req.query;
    let row: any;
    if (recordId) {
      row = db.prepare(`SELECT * FROM user_birth_info WHERE id=? AND user_id=?`).get(recordId, userId);
    } else {
      row = db.prepare(`SELECT * FROM user_birth_info WHERE user_id=? ORDER BY created_at DESC LIMIT 1`).get(userId);
    }
    if (!row || !row.bazi_result) return res.status(404).json({ error: '记录不存在' });

    const baziResult = typeof row.bazi_result === 'string' ? JSON.parse(row.bazi_result) : row.bazi_result;
    const fiveElements = typeof row.five_elements === 'string' ? JSON.parse(row.five_elements) : row.five_elements;

    const favorable = determineFavorableElements(baziResult, row.birth_month, fiveElements);
    const bsMap: Record<string, string> = { 'very_strong': '身过旺（专旺格）', 'strong': '身强', 'wang': '身旺', 'neutral': '中和', 'weak': '身弱', 'shuai': '身衰', 'very_weak': '身极弱（从弱格）' };

    const totalCount = Object.values(fiveElements).reduce((a: number, b: any) => a + b, 0);

    // 新增：十二长生、神煞、格局
    const changSheng = calculateChangSheng(baziResult);
    const shenSha = calculateShenSha(baziResult);
    const pattern = determineBaziPattern(baziResult, favorable.bodyStrength);

    res.json({
      fiveElementDistribution: (['wood', 'fire', 'earth', 'metal', 'water'] as const).map(el => ({
        element: el, count: fiveElements[el], proportion: Math.round((fiveElements[el] / totalCount) * 100)
      })),
      bodyStrengthAnalysis: {
        isDeLing: favorable.bodyStrength !== 'weak' && favorable.bodyStrength !== 'shuai' && favorable.bodyStrength !== 'very_weak',
        deLingStatus: favorable.deLingStatus,
        bodyStrength: favorable.bodyStrength,
        bodyStrengthText: bsMap[favorable.bodyStrength],
        totalScore: favorable.totalScore,
        deLingScore: favorable.deLingScore,
        rootScore: favorable.rootScore,
        branchSupportScore: favorable.branchSupportScore,
        exposureScore: favorable.exposureScore,
        rootDetails: favorable.rootDetails,
        branchSupportDetails: favorable.branchSupportDetails,
        exposureDetails: favorable.exposureDetails,
      },
      favorableAnalysis: {
        method: favorable.method, methodName: favorable.method,
        favorable: favorable.favorable, unfavorable: favorable.unfavorable,
        explanation: favorable.explanation, tiaohouElement: favorable.tiaohouElement,
      },
      wangShuaiAnalysis: favorable.explanation,
      favorableDescription: `喜用神为${favorable.favorable.map(e => ({ wood: '木', fire: '火', earth: '土', metal: '金', water: '水' }[e])).join('、')}，可增强运势。`,
      unfavorableDescription: `忌神为${favorable.unfavorable.map(e => ({ wood: '木', fire: '火', earth: '土', metal: '金', water: '水' }[e])).join('、')}，建议适度避开。`,
      generalInterpretation: favorable.explanation,
      // 新增字段
      changSheng: {
        yearBranch: changSheng.yearBranch,
        monthBranch: changSheng.monthBranch,
        dayBranch: changSheng.dayBranch,
        hourBranch: changSheng.hourBranch,
      },
      shenSha: {
        tianDe: shenSha.tianDe,  // 天德贵人
        yueDe: shenSha.yueDe,    // 月德贵人
        wenChang: shenSha.wenChang, // 文昌
        yiMa: shenSha.yiMa,      // 驿马
        taoHua: shenSha.taoHua,  // 桃花
        huaGai: shenSha.huaGai,  // 华盖
        luShen: shenSha.luShen,  // 禄神
      },
      pattern: {
        type: pattern.type,
        name: pattern.name,
        description: pattern.description,
        mainGod: pattern.mainGod,
      },
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ========== 大运路由 ==========
app.get('/api/users/:userId/dayun', (req, res) => {
  try {
    const { userId } = req.params;
    const { recordId } = req.query;
    let row: any;
    if (recordId) {
      row = db.prepare(`SELECT * FROM user_birth_info WHERE id=? AND user_id=?`).get(recordId, userId);
    } else {
      row = db.prepare(`SELECT * FROM user_birth_info WHERE user_id=? ORDER BY created_at DESC LIMIT 1`).get(userId);
    }
    if (!row || !row.bazi_result) return res.status(404).json({ error: '记录不存在' });

    const baziResult = typeof row.bazi_result === 'string' ? JSON.parse(row.bazi_result) : row.bazi_result;
    const gender = row.gender === 'male' ? 'male' : 'female';

    const dayunList = calculateDayun(baziResult, row.birth_year, row.birth_month, gender);

    res.json({
      birthYear: row.birth_year,
      birthMonth: row.birth_month,
      gender,
      dayunCount: dayunList.length,
      dayun: dayunList,
      description: `大运${dayunList[0]?.direction}，第一步大运从${dayunList[0]?.startYear}年开始（${dayunList[0]?.startAge}岁）`,
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ========== 今日运势路由 ==========

app.get('/api/users/:userId/daily-fortune', (req, res) => {
  try {
    const { userId } = req.params;
    const { recordId } = req.query;
    let row: any;
    if (recordId) {
      row = db.prepare(`SELECT * FROM user_birth_info WHERE id=? AND user_id=?`).get(recordId, userId);
    } else {
      row = db.prepare(`SELECT * FROM user_birth_info WHERE user_id=? ORDER BY created_at DESC LIMIT 1`).get(userId);
    }
    if (!row || !row.bazi_result) return res.status(404).json({ error: '请先填写生辰信息' });

    const baziResult = typeof row.bazi_result === 'string' ? JSON.parse(row.bazi_result) : row.bazi_result;
    
    // 计算今日运势
    const dailyFortune = calculateDailyFortune(baziResult);
    
    res.json(dailyFortune);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ========== 推荐路由 ==========

app.get('/api/users/:userId/outfit-recommendation', async (req, res) => {
  try {
    const { userId } = req.params;
    const { recordId, city } = req.query;
    let row: any;
    if (recordId) {
      row = db.prepare(`SELECT * FROM user_birth_info WHERE id=? AND user_id=?`).get(recordId, userId);
    } else {
      row = db.prepare(`SELECT * FROM user_birth_info WHERE user_id=? ORDER BY created_at DESC LIMIT 1`).get(userId);
    }
    if (!row) return res.status(404).json({ error: '请先填写生辰信息' });

    const favorable = typeof row.favorable_elements === 'string' ? JSON.parse(row.favorable_elements) : row.favorable_elements;
    const unfavorable = typeof row.unfavorable_elements === 'string' ? JSON.parse(row.unfavorable_elements) : row.unfavorable_elements;

    // 获取用户性别
    const gender = row.gender === 'male' ? 'male' : 'female';

    // 获取天气信息（优先使用前端传来的城市参数，其次使用用户出生地）
    const locationCity = (city as string) || row.birth_location || '北京';
    const weatherInfo = await getWeatherInfo(locationCity);

    // 计算用户八字（用于流日十神分析）
    const birthYear = Number(row.birth_year);
    const birthMonth = Number(row.birth_month);
    const birthDay = Number(row.birth_day);
    const birthHour = row.birth_hour !== undefined ? Number(row.birth_hour) : 12;
    const baziResult = calculateBazi(birthYear, birthMonth, birthDay, birthHour);
    const dayGan = baziResult.dayPillar[0]; // 日干
    const dayGanZhi = baziResult.dayPillar; // 日柱（干支）

    // 获取穿搭推荐（传递八字日主进行流日十神分析）
    const recommendation = getOutfitRecommendation(favorable, unfavorable, gender, weatherInfo ?? undefined, dayGan, dayGanZhi);

    // 如果没有通过参数传递天气，重新获取
    if (!weatherInfo) {
      const weather = await getWeatherInfo(row.birth_location || '北京');
      if (weather) {
        recommendation.weatherInfo = weather;
      }
    }

    res.json(recommendation);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/users/:userId/bracelet-recommendation', (req, res) => {
  try {
    const { userId } = req.params;
    const { recordId } = req.query;
    let row: any;
    if (recordId) {
      row = db.prepare(`SELECT * FROM user_birth_info WHERE id=? AND user_id=?`).get(recordId, userId);
    } else {
      row = db.prepare(`SELECT * FROM user_birth_info WHERE user_id=? ORDER BY created_at DESC LIMIT 1`).get(userId);
    }
    if (!row) return res.status(404).json({ error: '请先填写生辰信息' });

    const favorable = typeof row.favorable_elements === 'string' ? JSON.parse(row.favorable_elements) : row.favorable_elements;
    const unfavorable = typeof row.unfavorable_elements === 'string' ? JSON.parse(row.unfavorable_elements) : row.unfavorable_elements;
    const gender = row.gender === 'male' ? 'male' : 'female';

    // 计算用户八字（用于流日十神分析）
    const birthYear = Number(row.birth_year);
    const birthMonth = Number(row.birth_month);
    const birthDay = Number(row.birth_day);
    const birthHour = row.birth_hour !== undefined ? Number(row.birth_hour) : 12;
    const baziResult = calculateBazi(birthYear, birthMonth, birthDay, birthHour);
    const dayGan = baziResult.dayPillar[0]; // 日干
    const dayGanZhi = baziResult.dayPillar; // 日柱（干支）

    // 获取手串推荐（传递八字日主进行流日十神分析）
    res.json(getBraceletRecommendation(favorable, unfavorable, gender, dayGan, dayGanZhi));
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ========== 消费记录路由 ==========
app.get('/api/users/:userId/consumption', (req, res) => {
  try {
    const { userId } = req.params;
    const rows = db.prepare(`SELECT * FROM user_consumption WHERE user_id=? ORDER BY created_at DESC`).all(userId) as any[];
    res.json({
      consumptions: rows.map(r => ({
        id: r.id, productType: r.product_type, quantity: r.quantity,
        remaining: r.remaining, orderId: r.order_id, validUntil: r.valid_until,
        createdAt: r.created_at,
      })),
      aiChatRemaining: 5,
      baziAnalysisUnlocked: true,
      outfitPremiumValidUntil: null,
      braceletPremiumValidUntil: null,
      yearlyFortuneValidUntil: null,
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ========== 管理后台 API ==========
// 管理员密码（生产环境应放在环境变量中）
const ADMIN_PASSWORD = 'bazi-admin-2024';

app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  if (password === ADMIN_PASSWORD) {
    res.json({ success: true, token: 'admin-token-' + Date.now() });
  } else {
    res.status(401).json({ success: false, error: '密码错误' });
  }
});

app.get('/api/admin/records', (req, res) => {
  try {
    const { page = 1, limit = 20, search = '' } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    let query = `SELECT * FROM user_birth_info WHERE 1=1`;
    let countQuery = `SELECT COUNT(*) as total FROM user_birth_info WHERE 1=1`;
    const params: any[] = [];
    if (search) {
      query += ` AND (name LIKE ? OR birth_year::text LIKE ? OR birth_month::text LIKE ? OR birth_day::text LIKE ?)`;
      countQuery += ` AND (name LIKE ? OR birth_year::text LIKE ? OR birth_month::text LIKE ? OR birth_day::text LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }
    query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    const rows = db.prepare(query).all(...params, Number(limit), offset) as any[];
    const totalRow = db.prepare(countQuery).get(...params) as any;
    res.json({
      records: rows.map(r => ({
        id: r.id, userId: r.user_id, name: r.name,
        birthYear: r.birth_year, birthMonth: r.birth_month, birthDay: r.birth_day,
        birthHour: r.birth_hour, gender: r.gender,
        calendarType: r.calendar_type, languageStyle: r.language_style,
        baziResult: r.bazi_result ? (typeof r.bazi_result === 'string' ? JSON.parse(r.bazi_result) : r.bazi_result) : null,
        fiveElements: r.five_elements ? (typeof r.five_elements === 'string' ? JSON.parse(r.five_elements) : r.five_elements) : null,
        favorableElements: r.favorable_elements ? JSON.parse(r.favorable_elements) : [],
        unfavorableElements: r.unfavorable_elements ? JSON.parse(r.unfavorable_elements) : [],
        createdAt: r.created_at, updatedAt: r.updated_at,
      })),
      total: totalRow.total,
      page: Number(page),
      limit: Number(limit),
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/admin/stats', (req, res) => {
  try {
    const all = db.prepare(`SELECT COUNT(*) as total FROM user_birth_info`).get() as any;
    const today = new Date().toISOString().slice(0, 10);
    const todayRecords = db.prepare(`SELECT COUNT(*) as count FROM user_birth_info WHERE date(created_at) = ?`).get(today) as any;
    const genderStats = db.prepare(`SELECT gender, COUNT(*) as count FROM user_birth_info GROUP BY gender`).all() as any[];
    const elementStats: any = { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 };
    const records = db.prepare(`SELECT favorable_elements FROM user_birth_info WHERE favorable_elements IS NOT NULL`).all() as any[];
    records.forEach((r: any) => {
      try {
        const favs = JSON.parse(r.favorable_elements) as string[];
        favs.forEach((f: string) => { if (elementStats[f] !== undefined) elementStats[f]++; });
      } catch {}
    });
    const recentRecords = db.prepare(`SELECT name, birth_year, bazi_result, created_at FROM user_birth_info ORDER BY created_at DESC LIMIT 5`).all() as any[];
    res.json({
      totalRecords: all.total,
      todayRecords: todayRecords.count,
      genderStats: genderStats.reduce((acc: any, r: any) => { acc[r.gender] = r.count; return acc; }, {}),
      elementStats,
      recentRecords: recentRecords.map((r: any) => ({
        name: r.name, birthYear: r.birth_year,
        dayMaster: r.bazi_result ? (typeof r.bazi_result === 'string' ? JSON.parse(r.bazi_result) : r.bazi_result).dayMaster : '?',
        createdAt: r.created_at,
      })),
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/admin/records/:id', (req, res) => {
  try {
    db.prepare(`DELETE FROM user_birth_info WHERE id=?`).run(req.params.id);
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// 辅助函数
function mapRow(row: any) {
  return {
    id: row.id, name: row.name, birthYear: row.birth_year, birthMonth: row.birth_month,
    birthDay: row.birth_day, birthHour: row.birth_hour, gender: row.gender,
    calendarType: row.calendar_type, languageStyle: row.language_style,
    birthLocation: row.birth_location,
    baziResult: row.bazi_result ? (typeof row.bazi_result === 'string' ? JSON.parse(row.bazi_result) : row.bazi_result) : undefined,
    fiveElements: row.five_elements ? (typeof row.five_elements === 'string' ? JSON.parse(row.five_elements) : row.five_elements) : undefined,
    favorableElements: row.favorable_elements ? (typeof row.favorable_elements === 'string' ? JSON.parse(row.favorable_elements) : row.favorable_elements) : undefined,
    unfavorableElements: row.unfavorable_elements ? (typeof row.unfavorable_elements === 'string' ? JSON.parse(row.unfavorable_elements) : row.unfavorable_elements) : undefined,
  };
}

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🔥 八字时尚推荐服务已启动: http://localhost:${PORT}`);
});
