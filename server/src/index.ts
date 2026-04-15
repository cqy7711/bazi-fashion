import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import db from './db.js';
import { calculateBazi, calculateFiveElements, determineFavorableElements, calculateQiyunAge, calculateChangSheng, calculateShenSha, determineBaziPattern, calculateDayun, calculateDailyFortune, getCurrentDayGanZhi, calculateBodyStrength } from './bazi-calculator.js';
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
        subGod: pattern.subGod,
        formation: pattern.formation,
        characteristics: pattern.characteristics,
        strengths: pattern.strengths,
        weaknesses: pattern.weaknesses,
        suitableCareer: pattern.suitableCareer,
        avoidCareer: pattern.avoidCareer,
        luckTips: pattern.luckTips,
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

    const dayunList = calculateDayun(baziResult, row.birth_year, row.birth_month, row.birth_day, gender);

    res.json({
      birthYear: row.birth_year,
      birthMonth: row.birth_month,
      birthDay: row.birth_day,
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

// ========== 命盘综合分析API ==========
app.get('/api/users/:userId/mingpan-analysis', (req, res) => {
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

    // 计算八字
    const birthYear = Number(row.birth_year);
    const birthMonth = Number(row.birth_month);
    const birthDay = Number(row.birth_day);
    const birthHour = row.birth_hour !== undefined ? Number(row.birth_hour) : 12;
    const gender = row.gender === 'male' ? 'male' : 'female';

    const bazi = calculateBazi(birthYear, birthMonth, birthDay, birthHour);
    const fiveElements = calculateFiveElements(bazi);
    const favorable = typeof row.favorable_elements === 'string' ? JSON.parse(row.favorable_elements) : row.favorable_elements;
    const unfavorable = typeof row.unfavorable_elements === 'string' ? JSON.parse(row.unfavorable_elements) : row.unfavorable_elements;

    // 计算身强弱
    const bodyStrength = calculateBodyStrength(bazi, fiveElements);
    const pattern = determineBaziPattern(bazi, bodyStrength);
    const shensha = calculateShenSha(bazi);
    const dayunList = calculateDayun(bazi, birthYear, birthMonth, birthDay, gender);

    // 四维运势分析（基于命理学原理）
    const dmEl = bazi.dayMasterElement;
    const dmName = { wood: '木', fire: '火', earth: '土', metal: '金', water: '水' }[dmEl] || '木';

    // 计算各维度运势评分
    const calcScore = (base: number, modifiers: number[]) => {
      const score = base + modifiers.reduce((a, b) => a + b, 0);
      return Math.max(25, Math.min(95, Math.round(score)));
    };

    // 事业运势：看官星、印星、财星是否得用
    const careerBase = 50 + (favorable.includes('metal') ? 12 : 0) + (favorable.includes('water') ? 8 : 0);
    const careerMod = bodyStrength.type === 'strong' ? 10 : bodyStrength.type === 'weak' ? -5 : 0;
    const careerScore = calcScore(careerBase, [careerMod]);

    // 财运：看财星是否得用
    const wealthBase = 50 + (favorable.includes('metal') ? 10 : 0) + (favorable.includes('earth') ? 8 : 0);
    const wealthMod = bodyStrength.type === 'strong' ? 8 : bodyStrength.type === 'weak' ? -8 : 0;
    const wealthScore = calcScore(wealthBase, [wealthMod]);

    // 感情运势：看食伤、财星
    const loveBase = 50 + (favorable.includes('fire') ? 10 : 0) + (favorable.includes('water') ? 6 : 0);
    const loveMod = shensha.taoHua !== '无' ? 8 : 0;
    const loveScore = calcScore(loveBase, [loveMod]);

    // 健康运势：看五行平衡
    const maxEl = Math.max(...Object.values(fiveElements));
    const minEl = Math.min(...Object.values(fiveElements));
    const balance = maxEl - minEl;
    const healthBase = 50 + (balance < 3 ? 15 : balance < 5 ? 8 : 0);
    const healthScore = calcScore(healthBase, []);

    // 生成运势描述
    const getFortuneDesc = (el: string, dim: string) => {
      const descs: Record<string, Record<string, string>> = {
        wood: {
          career: '木气生发，创造力强，适合文化创意、互联网、出版传媒、教育培训。忌投机取巧。',
          wealth: '正财稳定，适合积累，不宜高风险投机。',
          love: '木主仁，感情细腻浪漫，社交活跃期。',
          health: '注意肝胆、神经系统、情绪调节。'
        },
        fire: {
          career: '火气旺盛，竞争心强，适合销售、演讲、法律、政治、军警。',
          wealth: '财来财去，偏财运旺，忌高风险投资。',
          love: '火主礼，热情主动，姻缘易现。',
          health: '注意心脏、血液循环、眼睛健康。'
        },
        earth: {
          career: '土气厚重，稳扎稳打，适合建筑、地产、农业、管理、财务。',
          wealth: '土主信，财运稳健积累，不宜冒险求财。',
          love: '土主信，感情稳重务实，婚配多以相亲为主。',
          health: '注意脾胃消化、饮食规律，皮肤易过敏。'
        },
        metal: {
          career: '金气清朗，决策力强，适合金融、科技、法律、外交、管理。',
          wealth: '金主义，财运清正，利正财，偏财有波动。',
          love: '金主义，感情果断利落，注意避免冷落伴侣。',
          health: '注意肺部呼吸系统、骨骼、牙齿健康。'
        },
        water: {
          career: '水气流通，适应力强，适合贸易、物流、航海、媒体、咨询。',
          wealth: '水主智，财运流通性强，利于贸易与流通行业。',
          love: '水主智，感情多波折或晚婚居多，早年勿急。',
          health: '注意肾脏泌尿系统、耳力、冬季防寒。'
        }
      };
      return descs[el]?.[dim] || descs.wood[dim];
    };

    // 命格详解
    const patternDetails: Record<string, { career: string; wealth: string; love: string; health: string }> = {
      '正官格': { career: '官星得用，贵气自来。责任心强，适合从政、管理、法律类工作。', wealth: '财运平稳上升，正财佳，宜稳定发展。', love: '婚姻缘分较好，配偶可靠。', health: '注意肺部呼吸系统健康。' },
      '七杀格': { career: '果断刚强，魄力惊人。敢于挑战，适合军警、外科医生、企业高管。', wealth: '财运起伏大，偏财机会多，忌贪心。', love: '感情多波折，需防桃花劫。', health: '注意肝胆、筋骨健康。' },
      '正印格': { career: '慈爱善良，学识渊博。心地厚道，适合教育、研究、医护、宗教。', wealth: '财运平稳，不宜投机，细水长流。', love: '婚姻幸福，配偶体贴。', health: '注意脾胃健康。' },
      '偏印格': { career: '思维独特，直觉敏锐。善于独立思考，适合策划、艺术创作、咨询。', wealth: '财运不稳定，需防意外破财。', love: '感情缘分较淡，晚婚居多。', health: '注意神经衰弱、失眠。' },
      '食神格': { career: '温和仁慈，才华横溢。性格温和，适合艺术、文化、餐饮、音乐。', wealth: '食神生财，财运亨通。', love: '桃花运旺，感情丰富。', health: '注意消化系统健康。' },
      '伤官格': { career: '聪明伶俐，创造力强。思维活跃，适合艺术、设计、演艺、创业。', wealth: '伤官生财，但需防财来财去。', love: '感情多变动，晚婚或两地分居。', health: '注意口舌是非、心火旺盛。' },
      '正财格': { career: '勤俭持家，财运稳定。为人务实，适合财务、商业、服务业。', wealth: '正财稳定，积累型财运。', love: '婚姻稳定，配偶勤俭。', health: '注意泌尿系统健康。' },
      '偏财格': { career: '善于理财，财运起伏。有商业头脑，适合金融、投资、销售、贸易。', wealth: '偏财运旺，适合投资理财。', love: '桃花运强，需防婚外情。', health: '注意肝脏健康。' },
      '比肩格': { career: '独立自信，意志坚定。自我依靠，适合自主创业、专业技术、销售。', wealth: '财运平稳，合伙求财更佳。', love: '感情平淡，独立自主。', health: '注意筋骨健康。' },
      '劫财格': { career: '敢闯敢拼，行动力强。善于竞争，适合销售、体育、创业、投资。', wealth: '财运起伏大，需防破财。', love: '感情多竞争，需防第三者。', health: '注意劫财夺财，脾胃虚弱。' },
    };

    const patternDetail = patternDetails[pattern.name] || { career: '命局平稳，适合各类工作。', wealth: '财运平稳。', love: '感情平稳。', health: '健康良好。' };

    res.json({
      // 四维运势
      fortune: {
        career: { score: careerScore, desc: getFortuneDesc(dmEl, 'career'), pattern: patternDetail.career },
        wealth: { score: wealthScore, desc: getFortuneDesc(dmEl, 'wealth'), pattern: patternDetail.wealth },
        love: { score: loveScore, desc: getFortuneDesc(dmEl, 'love'), pattern: patternDetail.love },
        health: { score: healthScore, desc: getFortuneDesc(dmEl, 'health'), pattern: patternDetail.health },
      },
      // 命格详解
      pattern: {
        ...pattern,
        details: patternDetail,
      },
      // 神煞
      shensha,
      // 大运
      dayun: dayunList,
      // 五行分析
      fiveElements,
      favorable,
      unfavorable,
      bodyStrength,
      // 身强弱
      bodyStrengthText: bodyStrength.type === 'strong' ? '身强' : bodyStrength.type === 'weak' ? '身弱' : '中性',
      bodyStrengthScore: bodyStrength.score,
    });
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

// ========== DeepSeek AI 命理对话 API ==========

// DeepSeek API 配置
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || '';

// 命理学系统提示词
const MINGLI_SYSTEM_PROMPT = `你是专业的八字命理师，精通中国传统命理学。你需要根据用户的八字信息，用专业且易懂的方式解答问题。

八字命理核心知识：
1. 天干地支：天干有甲乙丙丁戊己庚辛壬癸，地支有子丑寅卯辰巳午未申酉戌亥
2. 五行相生：木生火、火生土、土生金、金生水、水生木
3. 五行相克：木克土、土克水、水克火、火克金、金克木
4. 日主：出生日的天干代表自己，日主强弱决定用神选取
5. 用神：八字中最需要补充的五行，调候命局

请基于八字分析：
- 日主强弱分析
- 用神选取依据
- 格局判断
- 大运走势
- 流年影响

回答要：
1. 专业但通俗易懂
2. 结合八字具体分析
3. 给出实用的建议
4. 语言简洁有条理`;

// 获取用户八字信息
function getUserBaziInfo(userId: string, recordId?: string) {
  let query = `SELECT * FROM user_birth_info WHERE user_id = ?`;
  let params: any[] = [userId];
  
  if (recordId) {
    query += ` AND id = ?`;
    params.push(recordId);
  }
  
  query += ` ORDER BY created_at DESC LIMIT 1`;
  
  const row = db.prepare(query).get(...params) as any;
  if (!row) return null;
  
  const baziResult = row.bazi_result ? (typeof row.bazi_result === 'string' ? JSON.parse(row.bazi_result) : row.bazi_result) : null;
  const fiveElements = row.five_elements ? (typeof row.five_elements === 'string' ? JSON.parse(row.five_elements) : row.five_elements) : null;
  const favorableElements = row.favorable_elements ? (typeof row.favorable_elements === 'string' ? JSON.parse(row.favorable_elements) : row.favorable_elements) : null;
  const unfavorableElements = row.unfavorable_elements ? (typeof row.unfavorable_elements === 'string' ? JSON.parse(row.unfavorable_elements) : row.unfavorable_elements) : null;
  
  return {
    name: row.name,
    birthDate: `${row.birth_year}年${row.birth_month}月${row.birth_day}日${row.birth_hour}时`,
    gender: row.gender === 'male' ? '男' : '女',
    bazi: baziResult ? {
      yearPillar: baziResult.yearPillar,
      monthPillar: baziResult.monthPillar,
      dayPillar: baziResult.dayPillar,
      hourPillar: baziResult.hourPillar,
      dayMaster: baziResult.dayMaster,
    } : null,
    fiveElements,
    favorableElements,
    unfavorableElements,
    bodyStrength: row.body_strength || null,
  };
}

// AI 对话路由
app.post('/api/ai/chat', async (req, res) => {
  try {
    const { userId = DEFAULT_USER_ID, recordId, messages } = req.body;
    
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: '缺少对话内容' });
    }
    
    // 获取用户八字信息
    const userBazi = getUserBaziInfo(userId, recordId);
    
    if (!userBazi) {
      return res.status(400).json({ error: '未找到八字信息，请先录入生辰' });
    }
    
    // 构建用户信息摘要
    const userSummary = userBazi.bazi ? `
用户基本信息：
- 姓名：${userBazi.name}
- 出生时间：${userBazi.birthDate}（${userBazi.gender}）
- 四柱：${userBazi.bazi.yearPillar} ${userBazi.bazi.monthPillar} ${userBazi.bazi.dayPillar} ${userBazi.bazi.hourPillar}
- 日主：${userBazi.bazi.dayMaster}
- 五行得分：${JSON.stringify(userBazi.fiveElements)}
- 喜用五行：${userBazi.favorableElements?.join('、')}
- 忌讳五行：${userBazi.unfavorableElements?.join('、')}
- 身强身弱：${userBazi.bodyStrength || '待分析'}
` : '';
    
    // 构建 DeepSeek API 请求
    const deepseekMessages = [
      { role: 'system', content: MINGLI_SYSTEM_PROMPT + userSummary },
      ...messages.map((m: any) => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.content
      }))
    ];
    
    // 如果没有配置 API Key，返回错误提示
    if (!DEEPSEEK_API_KEY) {
      return res.status(503).json({ 
        error: '未配置 DeepSeek API Key',
        message: '请在环境变量中设置 DEEPSEEK_API_KEY'
      });
    }
    
    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: deepseekMessages,
        temperature: 0.7,
        max_tokens: 2000
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('DeepSeek API 错误:', errorData);
      return res.status(response.status).json({ 
        error: 'AI 服务调用失败',
        details: errorData.error?.message || '未知错误'
      });
    }
    
    const data = await response.json();
    const assistantMessage = data.choices?.[0]?.message?.content || '抱歉，AI 暂时无法回复，请稍后再试。';
    
    res.json({
      success: true,
      message: assistantMessage,
      usage: data.usage
    });
    
  } catch (e: any) {
    console.error('AI 对话错误:', e);
    res.status(500).json({ error: e.message || '服务器错误' });
  }
});

// 获取支持的 AI 模型列表
app.get('/api/ai/models', (req, res) => {
  res.json({
    available: !!DEEPSEEK_API_KEY,
    models: [
      { id: 'deepseek-chat', name: 'DeepSeek Chat', description: '通用对话模型，适合命理分析' },
    ]
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🔥 八字时尚推荐服务已启动: http://localhost:${PORT}`);
});
