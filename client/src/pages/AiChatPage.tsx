import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Send, Loader2, MessageCircle, Sparkles, Trash2, BookOpen, Shirt, Gem, RefreshCw, ArrowLeft, Info, ChevronDown, Users } from 'lucide-react';
import type { UserBirthInfo } from '../shared/types';

const USER_ID = 'user_default';

// 用户列表项类型
interface UserListItem {
  id: string;
  name: string;
  birthYear: number;
  birthMonth: number;
  birthDay: number;
  birthHour: number;
  gender: string;
}

function cn(...c: (string | boolean | undefined)[]) { return c.filter(Boolean).join(' '); }

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  question?: string; // 原始问题（用于风格切换）
  styleUsed?: ChatStyle; // 使用的解读风格
}

const QUICK_QUESTIONS = [
  { icon: <BookOpen className="w-4 h-4" />, text: '我的八字命局解读', prompt: '请详细分析我的八字命局，包括强弱判断、用神选取和格局分析。' },
  { icon: <Shirt className="w-4 h-4" />, text: '今日穿搭建议', prompt: '根据我的八字，今日穿什么颜色的衣服最好？' },
  { icon: <Gem className="w-4 h-4" />, text: '适合我的手串', prompt: '根据我的八字五行，什么材质的手串最适合我？' },
  { icon: <Sparkles className="w-4 h-4" />, text: '流年运势', prompt: '请分析我今年的流年运势，有哪些需要注意的事项？' },
];

const SUGGESTIONS_ABOUT: Record<string, string> = {
  wood: '您的八字喜木，代表生长、条达、向上。您适合从事文化、教育、创意、木材、纺织等相关行业。性格上您往往富有同情心，善于表达，适合需要沟通能力的工作。',
  fire: '您的八字喜火，代表热情、活力、光明。您适合从事能源、光电、餐饮、娱乐、文化传播等充满活力的行业。性格上您积极主动，善于社交，人缘较好。',
  earth: '您的八字喜土，代表稳重、包容、诚信。您适合从事建筑、农业、房地产、财务、法律等需要稳重踏实品质的工作。性格上您务实可靠，值得信赖。',
  metal: '您的八字喜金，代表清净、肃杀、决断。您适合从事金融、科技、医疗、金属加工、军事等需要决断力和逻辑思维的工作。性格上您理性果断，原则性强。',
  water: '您的八字喜水，代表智慧、流动、变通。您适合从事贸易、运输、航海、IT、咨询等需要灵活应变的工作。性格上您思维敏捷，善于观察，适合需要智慧的工作。',
};

// 解读风格定义
export type ChatStyle = 'plain' | 'fairy' | 'game' | 'career';

interface ChatStyleConfig {
  id: ChatStyle;
  name: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  description: string;
  maxUses: number;
  promptPrefix: string;
}

const CHAT_STYLES: ChatStyleConfig[] = [
  {
    id: 'plain',
    name: '大白话',
    icon: '💬',
    color: 'text-amber-600',
    bgColor: 'bg-amber-50 border-amber-200',
    description: '简单直白的大白话解读',
    maxUses: 5,
    promptPrefix: '请用最通俗易懂的大白话风格来解读八字命理，避免使用专业术语，让完全没有命理基础的人也能完全听懂。',
  },
  {
    id: 'fairy',
    name: '童话',
    icon: '🌟',
    color: 'text-pink-600',
    bgColor: 'bg-pink-50 border-pink-200',
    description: '童话故事风格解读',
    maxUses: 1,
    promptPrefix: '请用童话故事的风格来解读八字命理，把命理概念拟人化、故事化，像讲述一个奇妙的冒险故事一样有趣。',
  },
  {
    id: 'game',
    name: '游戏',
    icon: '🎮',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 border-purple-200',
    description: '游戏世界观解读',
    maxUses: 1,
    promptPrefix: '请用游戏世界的风格来解读八字命理，把八字比作游戏属性、装备、技能、大招等，用游戏玩家的视角来描述命运。',
  },
  {
    id: 'career',
    name: '职场',
    icon: '💼',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 border-blue-200',
    description: '职场发展解读',
    maxUses: 1,
    promptPrefix: '请用职场发展的视角来解读八字命理，把命理概念比作职场技能、工作表现、团队角色、职业规划等实用内容。',
  },
  {
    id: 'stock',
    name: '股民',
    icon: '📈',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50 border-emerald-200',
    description: '股市投资风格解读',
    maxUses: 1,
    promptPrefix: '请用股市投资的风格来解读八字命理，把五行运势比作K线图、大盘走势、个股分析、技术指标、持仓策略、牛市熊市等股市术语。',
  },
  {
    id: 'master',
    name: '算命师',
    icon: '🔮',
    color: 'text-amber-600',
    bgColor: 'bg-amber-50 border-amber-200',
    description: '传统算命师解读',
    maxUses: 1,
    promptPrefix: '请用传统算命先生的风格来解读八字命理，用古风文言文腔调、神秘高深的氛围、略带玄学意味的口吻来解读命理。',
  },
];

// 命理学知识库常量 - 基于《八字分析方法讲解》和《命理学自学知识库》

// 天干阴阳属性
const YANG_STEMS = ['甲', '丙', '戊', '庚', '壬'];
const YIN_STEMS = ['乙', '丁', '己', '辛', '癸'];

// 天干五行对应
const STEM_ELEMENT: Record<string, string> = {
  '甲': '木', '乙': '木',
  '丙': '火', '丁': '火',
  '戊': '土', '己': '土',
  '庚': '金', '辛': '金',
  '壬': '水', '癸': '水',
};

// 地支藏干（人元）
const BRANCH_HIDDEN_STEMS: Record<string, { stem: string; strength: '本气' | '中气' | '余气' }[]> = {
  '子': [{ stem: '癸', strength: '本气' }],
  '丑': [{ stem: '己', strength: '本气' }, { stem: '癸', strength: '中气' }, { stem: '辛', strength: '余气' }],
  '寅': [{ stem: '甲', strength: '本气' }, { stem: '丙', strength: '中气' }, { stem: '戊', strength: '余气' }],
  '卯': [{ stem: '乙', strength: '本气' }],
  '辰': [{ stem: '戊', strength: '本气' }, { stem: '乙', strength: '中气' }, { stem: '癸', strength: '余气' }],
  '巳': [{ stem: '丙', strength: '本气' }, { stem: '庚', strength: '中气' }, { stem: '戊', strength: '余气' }],
  '午': [{ stem: '丁', strength: '本气' }, { stem: '己', strength: '中气' }],
  '未': [{ stem: '己', strength: '本气' }, { stem: '丁', strength: '中气' }, { stem: '乙', strength: '余气' }],
  '申': [{ stem: '庚', strength: '本气' }, { stem: '壬', strength: '中气' }, { stem: '戊', strength: '余气' }],
  '酉': [{ stem: '辛', strength: '本气' }],
  '戌': [{ stem: '戊', strength: '本气' }, { stem: '辛', strength: '中气' }, { stem: '丁', strength: '余气' }],
  '亥': [{ stem: '壬', strength: '本气' }, { stem: '甲', strength: '中气' }],
};

// 五行旺衰状态（当令五行旺、被生者相、生他者休、克他者囚、被克者死）
const ELEMENT_WANG_SHUAI: Record<string, Record<string, '旺' | '相' | '休' | '囚' | '死'>> = {
  // 春季木旺
  '寅': { '木': '旺', '火': '相', '水': '休', '金': '囚', '土': '死' },
  '卯': { '木': '旺', '火': '相', '水': '休', '金': '囚', '土': '死' },
  '辰': { '木': '相', '火': '旺', '土': '相', '金': '休', '水': '囚' },
  // 夏季火旺
  '巳': { '火': '旺', '土': '相', '木': '休', '水': '囚', '金': '死' },
  '午': { '火': '旺', '土': '相', '木': '休', '水': '囚', '金': '死' },
  '未': { '火': '相', '土': '旺', '金': '相', '木': '休', '水': '囚' },
  // 秋季金旺
  '申': { '金': '旺', '水': '相', '土': '休', '火': '囚', '木': '死' },
  '酉': { '金': '旺', '水': '相', '土': '休', '火': '囚', '木': '死' },
  '戌': { '金': '相', '水': '旺', '木': '相', '土': '休', '火': '囚' },
  // 冬季水旺
  '亥': { '水': '旺', '木': '相', '金': '休', '土': '囚', '火': '死' },
  '子': { '水': '旺', '木': '相', '金': '休', '土': '囚', '火': '死' },
  '丑': { '水': '相', '木': '旺', '火': '相', '金': '休', '土': '囚' },
};

// 五行相生相克
const WUXING_PRODUCE: Record<string, string> = { '木': '火', '火': '土', '土': '金', '金': '水', '水': '木' };
const WUXING_CONQUER: Record<string, string> = { '木': '土', '土': '水', '水': '火', '火': '金', '金': '木' };
const WUXING_BY: Record<string, string> = { '木': '水', '水': '金', '金': '木', '火': '土' };

// 十神计算
const getShiShen = (stem: string, dayStem: string): string => {
  const stemEl = STEM_ELEMENT[stem];
  const dayEl = STEM_ELEMENT[dayStem];
  if (!stemEl || !dayEl) return '';
  
  // 同我者
  if (stemEl === dayEl) {
    return YANG_STEMS.includes(stem) ? '比肩' : '劫财';
  }
  // 我生者
  if (WUXING_PRODUCE[dayEl] === stemEl) {
    return YANG_STEMS.includes(stem) ? '食神' : '伤官';
  }
  // 我克者
  if (WUXING_CONQUER[dayEl] === stemEl) {
    return YANG_STEMS.includes(stem) ? '偏财' : '正财';
  }
  // 克我者
  if (WUXING_CONQUER[stemEl] === dayEl) {
    return YANG_STEMS.includes(stem) ? '七杀' : '正官';
  }
  // 生我者
  if (WUXING_PRODUCE[stemEl] === dayEl) {
    return YANG_STEMS.includes(stem) ? '偏印' : '正印';
  }
  return '';
};

// 计算八字旺衰评分（基于《八字分析方法讲解》强弱量化评分系统）
const calculateStrengthScore = (bazi: any): { score: number; status: string; details: string } => {
  const monthBranch = bazi.monthPillar[1];
  const dayStem = bazi.dayPillar[0];
  const dayElement = STEM_ELEMENT[dayStem] || '';
  
  let score = 0;
  const details: string[] = [];
  
  // 1. 得令评分（月令力量）
  const monthStatus = ELEMENT_WANG_SHUAI[monthBranch]?.[dayElement] || '死';
  const deLingScore = { '旺': 3, '相': 2, '休': 0, '囚': -2, '死': -3 }[monthStatus] || 0;
  score += deLingScore;
  details.push(`得令(${monthStatus}): ${deLingScore > 0 ? '+' : ''}${deLingScore}分`);
  
  // 2. 通根评分（日主在地支的根）
  const pillars = [bazi.yearPillar, bazi.monthPillar, bazi.dayPillar, bazi.hourPillar];
  pillars.forEach(p => {
    if (p && p.length >= 2) {
      const branch = p[1];
      const hiddenStems = BRANCH_HIDDEN_STEMS[branch] || [];
      hiddenStems.forEach(h => {
        if (h.stem === dayStem) {
          const rootScore = h.strength === '本气' ? 3 : h.strength === '中气' ? 2 : 1;
          score += rootScore;
          details.push(`通根(${h.strength}): +${rootScore}分`);
        }
      });
    }
  });
  
  // 3. 天干帮扶评分
  const stemElements = pillars.map(p => p ? STEM_ELEMENT[p[0]] : '').filter(Boolean);
  stemElements.forEach(el => {
    if (el === dayElement) {
      score += 2;
      details.push('天干帮扶: +2分');
    }
    // 印星生身
    if (WUXING_PRODUCE[el] === dayElement) {
      score += 2;
      details.push('印星生身: +2分');
    }
  });
  
  // 强弱分级
  let status = '';
  if (score >= 13) status = '身过旺（可能成专旺格）';
  else if (score >= 10) status = '身强（需强力克泄耗）';
  else if (score >= 6) status = '身旺（需适当克泄耗）';
  else if (score >= 3) status = '中和（力量适中）';
  else if (score >= 0) status = '身弱（需生扶帮助）';
  else if (score >= -3) status = '身衰（需强力生扶）';
  else status = '身极弱（可能成从格）';
  
  return { score, status, details: details.join('，') };
};

// 计算格局（基于《八字分析方法讲解》格局总论）
const determinePattern = (bazi: any, strengthStatus: string): { pattern: string; description: string } => {
  const monthStem = bazi.monthPillar[0];
  const monthElement = STEM_ELEMENT[monthStem] || '';
  const dayStem = bazi.dayPillar[0];
  const dayElement = STEM_ELEMENT[dayStem] || '';
  
  // 月令为月支本气
  const monthBranch = bazi.monthPillar[1];
  const monthMainElement = STEM_ELEMENT[monthBranch[0]] || monthElement;
  
  const patterns: Record<string, { pattern: string; description: string }> = {
    '财': { pattern: '财格', description: '月令财星，身旺财旺，富格，善于经营' },
    '印': { pattern: '印格', description: '月令印星，身弱印生，贵格，有文化有地位' },
    '食神': { pattern: '食神格', description: '月令食神，身旺食旺，才华横溢' },
    '伤官': { pattern: '伤官格', description: '月令伤官，身旺伤旺，才华格，伤官见官为大忌' },
    '官': { pattern: '正官格', description: '月令正官，身旺官旺，贵格，正直守法' },
    '杀': { pattern: '七杀格', description: '月令七杀，权格，有魄力有权力' },
  };
  
  // 检查是否为建禄或阳刃
  if (['甲', '丙', '戊', '庚', '壬'].includes(dayStem) && monthBranch === '临官') {
    return { pattern: '建禄格', description: '身旺格，独立自主' };
  }
  if (['甲', '丙', '戊', '庚', '壬'].includes(dayStem) && monthBranch === '帝旺') {
    return { pattern: '阳刃格', description: '刚强勇猛，需制化' };
  }
  
  // 根据月令本气判断格局
  if (monthMainElement === '金') return patterns['财'];
  if (monthMainElement === '水' && dayElement === '水') return patterns['印'];
  if (monthMainElement === '火') return patterns['食神'];
  if (['木', '土'].includes(monthMainElement)) return patterns['官'];
  
  return { pattern: '普通格局', description: '需结合用神综合判断' };
};

// 生成专业命理解读
const generateProfessionalBaziAnalysis = (bazi: any, userInfo: any): string => {
  const dayStem = bazi.dayPillar[0];
  const dayBranch = bazi.dayPillar[1];
  const monthStem = bazi.monthPillar[0];
  const yearStem = bazi.yearPillar[0];
  const hourStem = bazi.hourPillar[0];
  
  const dayElement = STEM_ELEMENT[dayStem] || '';
  const monthElement = STEM_ELEMENT[monthStem] || '';
  const yearElement = STEM_ELEMENT[yearStem] || '';
  const hourElement = STEM_ELEMENT[hourStem] || '';
  
  // 计算十神分布
  const stems = [yearStem, monthStem, dayStem, hourStem];
  const shiShenCounts: Record<string, number> = {};
  stems.forEach(s => {
    const ss = getShiShen(s, dayStem);
    if (ss) shiShenCounts[ss] = (shiShenCounts[ss] || 0) + 1;
  });
  
  // 计算旺衰
  const strength = calculateStrengthScore(bazi);
  
  // 判断格局
  const pattern = determinePattern(bazi, strength.status);
  
  // 五行分布
  const wuxingCounts = { 木: 0, 火: 0, 土: 0, 金: 0, 水: 0 };
  stems.forEach(s => {
    const el = STEM_ELEMENT[s];
    if (el) wuxingCounts[el as keyof typeof wuxingCounts]++;
  });
  
  const maxWuxing = Object.entries(wuxingCounts).sort((a, b) => b[1] - a[1])[0];
  const minWuxing = Object.entries(wuxingCounts).sort((a, b) => a[1] - b[1])[0];
  
  return `
【专业命盘分析】- 基于《八字分析方法讲解》和《命理学自学知识库》

📌 四柱八字：
年柱：${bazi.yearPillar}（${yearElement}行）
月柱：${bazi.monthPillar}（${monthElement}行）
日柱：${bazi.dayPillar}（${dayElement}行，主气${dayStem}）
时柱：${bazi.hourPillar}（${hourElement}行）

🔮 命局强弱分析：
${strength.details}
综合评分：${strength.score}分
旺衰状态：${strength.status}

💫 格局判断：
${pattern.pattern}：${pattern.description}

📊 五行分布：
木:${wuxingCounts.木}个 | 火:${wuxingCounts.火}个 | 土:${wuxingCounts.土}个 | 金:${wuxingCounts.金}个 | 水:${wuxingCounts.水}个
最旺：${maxWuxing[0]}行（${maxWuxing[1]}个）
最弱：${minWuxing[0]}行（${minWuxing[1]}个）

⚔️ 十神分布：
${Object.entries(shiShenCounts).map(([ss, count]) => `${ss}:${count}个`).join(' | ')}

💡 命理建议：
根据《八字分析方法讲解》，您需要${strength.score >= 3 ? '克泄耗' : '生扶助'}日主。
${strength.score >= 3 
  ? '宜选择食伤、财星、官杀相关的行业和工作。' 
  : '宜选择印星、比劫帮身的行业和工作。'}
`;
};

function generateAIResponse(userInfo: UserBirthInfo | null, question: string): string {
  if (!userInfo || !userInfo.baziResult) {
    return '您还没有录入生辰八字信息，无法进行AI解读。请先返回首页录入您的生辰信息，AI将根据您的八字为您提供个性化的解答。';
  }

  const bazi = userInfo.baziResult;
  const fav = userInfo.favorableElements || [];
  const unfav = userInfo.unfavorableElements || [];
  const unav = unfav;
  const dm = bazi.dayMasterElement;
  const dmName = { wood: '木', fire: '火', earth: '土', metal: '金', water: '水' }[dm] || '木';

  const lowerQ = question.toLowerCase();

  if (lowerQ.includes('命局') || lowerQ.includes('性格') || lowerQ.includes('解读') || lowerQ.includes('详细') || lowerQ.includes('分析')) {
    // 使用基于命理学知识库的专业分析
    return generateProfessionalBaziAnalysis(bazi, userInfo);
  }

  if (lowerQ.includes('穿搭') || lowerQ.includes('颜色') || lowerQ.includes('衣服') || lowerQ.includes('今日')) {
    const colors: Record<string, string[]> = { wood: ['绿色', '青色', '翠色'], fire: ['红色', '粉色', '紫色'], earth: ['黄色', '米色', '咖啡色'], metal: ['白色', '银色', '金色'], water: ['黑色', '深蓝色', '灰色'] };
    const c = colors[dm] || colors.earth!;
    return `【穿搭色彩建议】

🌈 今日推荐颜色：
根据您的喜用神为${dmName}行，最适合您的颜色是：**${c.join('、')}**

💡 颜色解读：
${c.map((color, i) => `${color}：${i === 0 ? '主色，可大面积穿着，增强运势' : i === 1 ? '辅助色，搭配主色使用，平衡气场' : '点缀色，小面积配饰画龙点睛'}`).join('\n')}

👔 场合建议：
• 职场：选择${c[0]}为主色调，搭配${c[1]}作为辅助，体现专业又有气场
• 日常：${c[0]}休闲装既舒适又能保持运势
• 约会：${c[2]}点缀能增加神秘感和魅力

⚠️ 避免颜色：
忌神${unav.map(e => ({ wood: '木', fire: '火', earth: '土', metal: '金', water: '水' }[String(e)] || e)).join('、')}对应的颜色不宜大面积使用，以免影响运势。`;
  }

  if (lowerQ.includes('手串') || lowerQ.includes('首饰') || lowerQ.includes('饰品') || lowerQ.includes('珠宝')) {
    const gems: Record<string, string> = { wood: '绿幽灵水晶、翡翠、檀木', fire: '南红玛瑙、红珊瑚、石榴石', earth: '黄水晶、虎眼石、蜜蜡', metal: '白水晶、银饰、金发晶', water: '黑曜石、海蓝宝、青金石' };
    const g = gems[dm] || gems.earth!;
    return `【开运手串推荐】

📿 适合您的手串材质：
根据您的喜用神为${dmName}行，以下材质最适合您：
**${g}**

💎 材质详解：
${g.split('、').map(item => `• ${item}：${dm === 'wood' ? '属木，增强生机与活力' : dm === 'fire' ? '属火，增强热情与魅力' : dm === 'earth' ? '属土，增强稳重与财运' : dm === 'metal' ? '属金，增强决断与财运' : '属水，增强智慧与财运'}，非常适合您的命格`).join('\n')}

🔮 佩戴建议：
• 主推：${g.split('、')[0]} — 属${dmName}行，与您的喜用神完全匹配
• 辅助：${g.split('、')[1]} — 可搭配主串增强效果
• 佩戴手：建议佩戴于左手
• 保养：定期清水冲洗净化，避免碰撞

💡 小贴士：
手串不仅是装饰品，更是您八字喜用神的能量载体，佩戴得当可为您带来好运！`;
  }

  if (lowerQ.includes('流年') || lowerQ.includes('今年') || lowerQ.includes('运势')) {
    const today = new Date();
    const year = today.getFullYear();
    return `【${year}年流年运势】

🔮 当前运势分析：
${year}年流年运势受多重因素影响，结合您的八字来看：

✨ 有利方面：
• 流年与您的喜用神${fav[0] ? { wood: '木🪵', fire: '火🔥', earth: '土🏔', metal: '金⚪', water: '水🌊' }[fav[0]] : ''}相关联
${dm === 'wood' ? '• 今年木气旺盛，对您的事业和学业都有积极影响' : dm === 'fire' ? '• 今年火气当令，您的活力和魅力得到充分展现' : dm === 'earth' ? '• 今年土气沉稳，您的事业发展稳固扎实' : dm === 'metal' ? '• 今年金气清肃，您的决断力和财运都有提升' : '• 今年水气灵动，您的智慧和财运都有增长机会'}

⚠️ 需要注意：
• 注意控制情绪，避免冲动决策
${dm === 'wood' ? '• 肝胆健康需多加关注' : dm === 'fire' ? '• 心脏和眼部健康需多加关注' : dm === 'earth' ? '• 脾胃健康需多加关注' : dm === 'metal' ? '• 肺部健康需多加关注' : '• 肾脏健康需多加关注'}

💡 建议：
• 多接触${fav[0] ? { wood: '森林、绿植', fire: '阳光、温暖', earth: '山地、大地', metal: '金属、清新空气', water: '水域、流动的水' }[fav[0]] : '自然'}相关的环境
• 重要决策可咨询专业人士
• 保持平和心态，稳中求进`;
  }

  if (lowerQ.includes('事业') || lowerQ.includes('工作') || lowerQ.includes('职场')) {
    const careers: Record<string, string> = { wood: '教育、文化出版、互联网IT、策划设计、家具木材、纺织品、环保', fire: '餐饮娱乐、能源光电、演艺传媒、销售公关、心理咨询、培训讲师', earth: '建筑房地产、农业种植、财务会计、法律咨询、行政管理、酒店旅游', metal: '金融投资、科技技术、医疗健康、军事执法、金属加工、咨询服务', water: '贸易物流、航海运输、IT互联网、咨询策划、媒体传播、金融保险' };
    const c = careers[dm] || careers.earth!;
    return `【事业方向建议】

💼 您的职业优势：
${SUGGESTIONS_ABOUT[dm]}

🎯 推荐职业方向：
最适合您的行业：**${c}**

🌟 具体建议：
• ${c.split('、')[0]}：这是与您喜用神最契合的领域，深耕此方向会有事半功倍的效果
• ${c.split('、')[1]}：作为备选方向，同样能够发挥您的优势
• ${c.split('、')[2]}：如果您对此感兴趣，可以作为副业或转型方向

📈 职场建议：
• 在工作中多展现${dmName}行的特质（如：${dm === 'wood' ? '条理性、计划性、协调能力' : dm === 'fire' ? '热情、表达能力、感染力' : dm === 'earth' ? '稳重、诚信、责任心' : dm === 'metal' ? '决断力、原则性、逻辑思维' : '灵活性、适应性、洞察力'}）
• 避免在工作中过多接触${unav.map(e => ({ wood: '火', fire: '水', earth: '木', metal: '火', water: '土' }[String(e)] || e)).join('、')}相关的元素`;
  }

  if (lowerQ.includes('感情') || lowerQ.includes('婚姻') || lowerQ.includes('恋爱') || lowerQ.includes('桃花')) {
    const traits: Record<string, string> = { wood: '善良、有条理、善于照顾人，但有时过于追求完美', fire: '热情主动、善于表达、人缘好，但有时情绪波动较大', earth: '务实稳重、责任心强、忠诚可靠，但有时过于保守', metal: '理性果断、原则性强、有品位，但有时过于挑剔', water: '温柔体贴、善解人意、浪漫，但有时缺乏安全感' };
    const t = traits[dm] || traits.earth!;
    return `【感情运势分析】

💕 您的性格特点：
${t}

🎯 理想伴侣类型：
根据您的八字分析，最适合您的伴侣是${fav[0] ? { wood: '木行或水行之人，能与您形成水木相生的和谐关系', fire: '木行或火行之人，与您热情相投，感情热烈', earth: '火行或土行之人，与您相互扶持，关系稳定', metal: '土行或金行之人，与您理性相投，价值观一致', water: '金行或水行之人，与您默契十足，心意相通' }[fav[0]] : '五行属性与您互补的异性'}。

💡 感情建议：
• ${dm === 'wood' ? '在感情中多表达自己的想法，不要过于压抑' : dm === 'fire' ? '学会控制情绪，给对方稳定的情感支持' : dm === 'earth' ? '适度放松控制欲，给彼此一些空间' : dm === 'metal' ? '不要太挑剔，学会欣赏对方的优点' : '增强安全感，过于敏感会影响感情'}
• 避免与${unav.map(e => ({ wood: '金', fire: '水', earth: '木', metal: '火', water: '土' }[String(e)] || e)).join('、')}属性过强的人深度交往
• 佩戴喜用神手串可增强感情运势`;
  }

  if (lowerQ.includes('健康') || lowerQ.includes('养生') || lowerQ.includes('身体')) {
    const organs: Record<string, string> = { wood: '肝胆系统、神经系统、筋骨关节、头发指甲', fire: '心脏血液循环、眼睛视力、精神状态、血压', earth: '脾胃消化系统、口腔健康、肌肉骨骼、皮肤', metal: '肺部呼吸系统、大肠排泄、皮肤毛发、免疫系统', water: '肾脏泌尿系统、生殖系统、耳朵听力、骨髓脑部' };
    const exercises: Record<string, string> = { wood: '瑜伽、太极、户外徒步、散步', fire: '有氧跑步、游泳、健身操、骑行', earth: '力量训练、八段锦、登山、园艺', metal: '深呼吸练习、冥想、游泳、快走', water: '游泳、太极、瑜伽、冥想' };
    const foods: Record<string, string> = { wood: '绿色蔬菜、豆制品、坚果、绿茶', fire: '红色食物（红豆、红枣）、苦瓜、西瓜', earth: '黄色食物（玉米、小米）、山药、红薯', metal: '白色食物（梨、银耳）、百合、莲子', water: '黑色食物（黑豆、黑芝麻）、海带、山药' };
    const o = organs[dm] || organs.earth!;
    return `【健康养生建议】

🏥 需要特别注意的部位：
${o}

💪 推荐运动方式：
${exercises[dm] || exercises.earth!}

🥗 饮食调理建议：
${foods[dm] || foods.earth!}

🌿 环境养生：
多接触${dm === 'wood' ? '绿色植物、森林、公园，有养肝明目之效' : dm === 'fire' ? '阳光充足的环境，但避免暴晒，有温养心阳之效' : dm === 'earth' ? '山地、泥土、大自然，有健脾和胃之效' : dm === 'metal' ? '空气清新的环境，适当进行深呼吸，有润肺之效' : '流动的水域、湖泊，有滋肾益精之效'}

⚠️ 特别提醒：
• 保持规律作息，避免熬夜
• 注意情绪管理，怒伤肝、喜伤心、思伤脾、悲伤肺、恐伤肾
• 建议每年定期体检，重点关注上述器官`;
  }

  // 默认回复
  return `【AI八字助手】

您好！我是您的专属八字AI助手，可以帮您解答以下问题：

🔮 **命理解读**：解读您的八字命局、性格特点
👔 **穿搭建议**：根据您的喜用神推荐适合的颜色
📿 **手串推荐**：推荐最适合您的开运手串材质
📈 **流年运势**：分析您今年的整体运势
💼 **事业方向**：提供职业发展建议
💕 **感情运势**：分析感情特点和理想伴侣
🏥 **健康养生**：给出养生和健康建议

您可以直接问我任何问题，我会根据您的八字信息给出个性化解答！
`;
}

export default function AiChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [userInfo, setUserInfo] = useState<UserBirthInfo | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [userList, setUserList] = useState<UserListItem[]>([]);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [currentStyle, setCurrentStyle] = useState<ChatStyle>('plain');
  const [styleUsageCount, setStyleUsageCount] = useState<Record<ChatStyle, number>>({
    plain: 0,
    fairy: 0,
    game: 0,
    career: 0,
    stock: 0,
    master: 0,
  });
  const bottomRef = useRef<HTMLDivElement>(null);

  // 加载用户列表
  useEffect(() => {
    fetch(`/api/users/${USER_ID}/birth-info`)
      .then(r => r.json())
      .then(data => {
        if (data.items?.length > 0) {
          setUserList(data.items);
          const latest = data.items[0];
          setCurrentUserId(latest.id);
          fetch(`/api/users/${USER_ID}/birth-info/${latest.id}`)
            .then(r => r.json())
            .then(info => { if (!info.error) setUserInfo(info); });
        }
      })
      .catch(console.error);
  }, []);

  // 切换用户
  const switchUser = async (recordId: string) => {
    if (recordId === currentUserId) {
      setShowUserDropdown(false);
      return;
    }
    setShowUserDropdown(false);
    setLoading(true);
    setUserInfo(null);
    
    try {
      const info = await fetch(`/api/users/${USER_ID}/birth-info/${recordId}`).then(r => r.json());
      if (!info.error) {
        setUserInfo(info);
        setCurrentUserId(recordId);
        // 清空聊天记录
        setMessages([{
          id: 'user-switch-' + Date.now(),
          role: 'assistant',
          content: `🔄 已切换到 ${info.name} 的八字数据\n\n请选择您感兴趣的话题，或直接向我提问！`,
          timestamp: new Date(),
        }]);
      }
    } catch (err) {
      console.error('切换用户失败:', err);
    } finally {
      setLoading(false);
    }
  };

  // 欢迎消息
  const welcomeMsg: ChatMessage = {
    id: 'welcome-' + Date.now(),
    role: 'assistant',
    content: '🌟 欢迎来到八字AI助手！\n\n我是您的专属命理顾问，可以根据您的八字为您提供个性化的命理解读、穿搭建议、手串推荐等服务。\n\n请选择您感兴趣的话题，或直接向我提问！',
    timestamp: new Date(),
  };

  // 初始化欢迎消息
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([welcomeMsg]);
    }
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return;
    
    // 检查风格使用次数限制
    const currentStyleConfig = CHAT_STYLES.find(s => s.id === currentStyle)!;
    if (styleUsageCount[currentStyle] >= currentStyleConfig.maxUses) {
      // 提示用户切换风格
      const otherStyles = CHAT_STYLES.filter(s => s.id !== currentStyle && styleUsageCount[s.id] < s.maxUses);
      if (otherStyles.length > 0) {
        const nextStyle = otherStyles[0];
        const aiMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `⚠️ ${currentStyleConfig.name}风格今日已用完（${currentStyleConfig.maxUses}次）\n\n建议切换到「${nextStyle.name}」风格继续体验！点击下方风格标签即可切换。`,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, aiMsg]);
        return;
      } else {
        const aiMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `⚠️ 所有解读风格今日次数已用完。\n\n• 大白话：${CHAT_STYLES[0].maxUses}次（已用${styleUsageCount.plain}次）\n• 童话/游戏/职场/股民/算命师：各1次\n\n请明天再来体验更多内容！🌙`,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, aiMsg]);
        return;
      }
    }
    
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: text, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    
    // 更新风格使用次数
    setStyleUsageCount(prev => ({ ...prev, [currentStyle]: prev[currentStyle] + 1 }));

    try {
      // 获取当前风格的前缀
      const stylePrefix = currentStyleConfig.promptPrefix;
      
      // 构建对话历史（排除欢迎消息）
      const chatHistory = messages
        .filter(m => !m.id.startsWith('welcome'))
        .map(m => ({ role: m.role, content: m.content }));
      
      // 将风格前缀和用户问题合并
      const styledMessage = `${stylePrefix}\n\n用户问题：${text}`;
      chatHistory.push({ role: 'user', content: styledMessage });

      // 调用后端 DeepSeek API
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: USER_ID,
          messages: chatHistory
        })
      });

      const data = await res.json();

      if (data.success && data.message) {
        // 保存原始问题和使用的风格
        const aiMsg: ChatMessage = { 
          id: (Date.now() + 1).toString(), 
          role: 'assistant', 
          content: data.message, 
          timestamp: new Date(),
          question: text,
          styleUsed: currentStyle
        };
        setMessages(prev => [...prev, aiMsg]);
      } else {
        // API 不可用时使用本地回复作为 fallback
        const fallback = generateAIResponse(userInfo, text);
        const aiMsg: ChatMessage = { 
          id: (Date.now() + 1).toString(), 
          role: 'assistant', 
          content: fallback, 
          timestamp: new Date(),
          question: text,
          styleUsed: currentStyle
        };
        setMessages(prev => [...prev, aiMsg]);
      }
    } catch (error) {
      console.error('AI 对话请求失败:', error);
      // 网络错误时使用本地回复
      const fallback = generateAIResponse(userInfo, text);
      const aiMsg: ChatMessage = { 
        id: (Date.now() + 1).toString(), 
        role: 'assistant', 
        content: fallback, 
        timestamp: new Date(),
        question: text,
        styleUsed: currentStyle
      };
      setMessages(prev => [...prev, aiMsg]);
    }

    setLoading(false);
  }

  // 重新解读：用新风格回答之前的问题
  async function reInterpret(messageId: string, newStyle: ChatStyle) {
    const targetMsg = messages.find(m => m.id === messageId);
    if (!targetMsg || !targetMsg.question) return;
    
    const question = targetMsg.question;
    const styleConfig = CHAT_STYLES.find(s => s.id === newStyle)!;
    
    // 检查风格使用次数
    if (styleUsageCount[newStyle] >= styleConfig.maxUses) {
      return;
    }
    
    setLoading(true);
    
    // 更新风格使用次数
    setStyleUsageCount(prev => ({ ...prev, [newStyle]: prev[newStyle] + 1 }));

    try {
      const stylePrefix = styleConfig.promptPrefix;
      
      // 构建对话历史（排除欢迎消息和当前消息）
      const chatHistory = messages
        .filter(m => !m.id.startsWith('welcome') && m.id !== messageId)
        .map(m => ({ role: m.role, content: m.content }));
      
      // 将风格前缀和用户问题合并
      const styledMessage = `${stylePrefix}\n\n用户问题：${question}`;
      chatHistory.push({ role: 'user', content: styledMessage });

      // 调用后端 DeepSeek API
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: USER_ID,
          messages: chatHistory
        })
      });

      const data = await res.json();

      if (data.success && data.message) {
        const aiMsg: ChatMessage = { 
          id: (Date.now() + 1).toString(), 
          role: 'assistant', 
          content: data.message, 
          timestamp: new Date(),
          question: question,
          styleUsed: newStyle
        };
        setMessages(prev => [...prev, aiMsg]);
      } else {
        const fallback = generateAIResponse(userInfo, question);
        const aiMsg: ChatMessage = { 
          id: (Date.now() + 1).toString(), 
          role: 'assistant', 
          content: fallback, 
          timestamp: new Date(),
          question: question,
          styleUsed: newStyle
        };
        setMessages(prev => [...prev, aiMsg]);
      }
    } catch (error) {
      console.error('重新解读失败:', error);
      const fallback = generateAIResponse(userInfo, question);
      const aiMsg: ChatMessage = { 
        id: (Date.now() + 1).toString(), 
        role: 'assistant', 
        content: fallback, 
        timestamp: new Date(),
        question: question,
        styleUsed: newStyle
      };
      setMessages(prev => [...prev, aiMsg]);
    }

    setLoading(false);
  }

  function handleQuickQuestion(prompt: string) {
    sendMessage(prompt);
  }

  function clearChat() {
    setMessages([{
      id: 'welcome-' + Date.now(),
      role: 'assistant',
      content: '🌟 聊天已清空！请选择您感兴趣的话题，或直接向我提问。\n\n💡 提示：切换不同解读风格可以获得更有趣的体验！',
      timestamp: new Date(),
    }]);
    // 重置风格使用次数
    setStyleUsageCount({ plain: 0, fairy: 0, game: 0, career: 0, stock: 0, master: 0 });
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* 顶部用户信息栏 - 支持切换 */}
      {userInfo && (
        <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
          className="mb-4 px-4 py-2.5 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-100 relative">
          <div className="flex items-center gap-3">
            <Sparkles className="w-4 h-4 text-primary shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-foreground font-medium truncate">
                基于：{userInfo.name} · {userInfo.baziResult?.yearBranch}年{userInfo.baziResult?.monthBranch}月{userInfo.baziResult?.dayBranch}日{userInfo.baziResult?.hourBranch}时 · 日主{userInfo.baziResult?.dayMaster}
              </p>
            </div>
            {/* 用户切换按钮 */}
            {userList.length > 1 && (
              <button 
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className="flex items-center gap-1 px-2 py-1 text-xs text-primary hover:bg-amber-100 rounded-lg transition-colors">
                <Users className="w-3 h-3" />
                <ChevronDown className={`w-3 h-3 transition-transform ${showUserDropdown ? 'rotate-180' : ''}`} />
              </button>
            )}
          </div>
          
          {/* 用户下拉列表 */}
          {showUserDropdown && userList.length > 1 && (
            <motion.div 
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl border border-amber-100 shadow-lg z-50 overflow-hidden">
              <div className="px-3 py-2 text-xs text-amber-600 font-medium border-b border-amber-100 bg-amber-50">
                已录入用户 ({userList.length})
              </div>
              <div className="max-h-48 overflow-y-auto">
                {userList.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => switchUser(u.id)}
                    className={`w-full px-3 py-2.5 text-left flex items-center gap-3 hover:bg-amber-50 transition-colors ${u.id === currentUserId ? 'bg-amber-50' : ''}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${u.id === currentUserId ? 'bg-primary text-white' : 'bg-amber-100 text-amber-700'}`}>
                      {u.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{u.name}</p>
                      <p className="text-xs text-muted-foreground">{u.birthYear}年{u.birthMonth}月{u.birthDay}日 {u.birthHour}时</p>
                    </div>
                    {u.id === currentUserId && (
                      <span className="text-xs text-primary font-medium">当前</span>
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </motion.div>
      )}

      {!userInfo && (
        <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
          className="mb-4 px-4 py-3 bg-amber-50 rounded-xl border border-amber-100 flex items-center gap-3">
          <Info className="w-4 h-4 text-amber-600 shrink-0" />
          <p className="text-sm text-amber-700">
            您还没有录入生辰信息，AI将提供通用性建议。
            <a href="/" className="ml-1 underline font-medium">先去录入 →</a>
          </p>
        </motion.div>
      )}

      {/* 快捷问题 */}
      {messages.length <= 2 && (
        <div className="mb-4">
          <p className="text-xs text-muted-foreground mb-2 font-medium">快捷问题</p>
          <div className="grid grid-cols-2 gap-2">
            {QUICK_QUESTIONS.map((q, i) => (
              <motion.button key={i} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                onClick={() => handleQuickQuestion(q.prompt)}
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white border border-border text-left hover:border-primary/50 hover:bg-amber-50/50 transition-all group">
                <span className="text-primary group-hover:scale-110 transition-transform">{q.icon}</span>
                <span className="text-xs font-medium text-foreground">{q.text}</span>
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* 聊天记录 */}
      <div className="space-y-3 mb-4 max-h-[55vh] overflow-y-auto pr-1">
        {messages.map(msg => {
          const currentStyleConfig = CHAT_STYLES.find(s => s.id === msg.styleUsed);
          const otherStyles = CHAT_STYLES.filter(s => s.id !== msg.styleUsed && styleUsageCount[s.id] < s.maxUses);
          
          return (
            <motion.div key={msg.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className={cn('flex gap-2.5', msg.role === 'user' && 'flex-row-reverse')}>
              <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-sm font-black',
                msg.role === 'user' ? 'bg-primary text-white' : 'bg-secondary border border-border text-foreground')}>
                {msg.role === 'user' ? '我' : '☯'}
              </div>
              <div className={cn('flex-1 max-w-[80%]', msg.role === 'user' && 'text-right')}>
                <div className={cn('inline-block px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap text-left',
                  msg.role === 'user'
                    ? 'bg-primary text-white rounded-tr-sm'
                    : 'bg-white border border-border rounded-tl-sm shadow-sm')}>
                  {msg.content}
                </div>
                
                {/* AI回复底部：显示风格标签 + 切换按钮 */}
                {msg.role === 'assistant' && msg.styleUsed && (
                  <div className="flex items-center justify-between mt-1.5 px-1">
                    <div className="flex items-center gap-2">
                      {/* 当前风格标签 */}
                      <span className={cn('text-[10px] px-1.5 py-0.5 rounded', currentStyleConfig?.bgColor, currentStyleConfig?.color)}>
                        {currentStyleConfig?.icon} {currentStyleConfig?.name}
                      </span>
                    </div>
                    
                    {/* 切换风格按钮 */}
                    {otherStyles.length > 0 && (
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-muted-foreground/60">换风格：</span>
                        {otherStyles.slice(0, 2).map(s => (
                          <button
                            key={s.id}
                            onClick={() => reInterpret(msg.id, s.id)}
                            disabled={loading}
                            className={cn(
                              'text-[10px] px-1.5 py-0.5 rounded border transition-all',
                              s.bgColor, s.color,
                              loading && 'opacity-50 cursor-not-allowed'
                            )}
                          >
                            {s.icon} {s.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                
                <p className="text-[10px] text-muted-foreground mt-1 px-1">
                  {msg.timestamp.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </motion.div>
          );
        })}

        {loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-secondary border border-border flex items-center justify-center text-sm font-black shrink-0">☯</div>
            <div className="inline-block px-4 py-3 rounded-2xl rounded-tl-sm bg-white border border-border shadow-sm">
              <div className="flex items-center gap-1">
                {[0, 1, 2].map(i => (
                  <div key={i} className="w-2 h-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          </motion.div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* 解读风格选择 */}
      <div className="mb-3 px-1">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-muted-foreground font-medium">解读风格</p>
          <p className="text-[10px] text-muted-foreground/60">
            {CHAT_STYLES.map(s => `${s.name}${styleUsageCount[s.id]}/${s.maxUses}`).join(' · ')}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {CHAT_STYLES.map(style => {
            const isActive = currentStyle === style.id;
            const isDisabled = styleUsageCount[style.id] >= style.maxUses;
            return (
              <button
                key={style.id}
                onClick={() => !isDisabled && setCurrentStyle(style.id)}
                disabled={isDisabled}
                className={cn(
                  'px-3 py-1.5 rounded-lg border text-xs font-medium transition-all flex items-center gap-1.5',
                  isActive ? `${style.bgColor} ${style.color} border-current shadow-sm` : 'bg-white border-border text-muted-foreground hover:border-primary/50',
                  isDisabled && 'opacity-40 cursor-not-allowed'
                )}
              >
                <span>{style.icon}</span>
                <span>{style.name}</span>
                {isDisabled && <span className="text-[10px]">✕</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* 输入框 */}
      <div className="bg-white rounded-2xl border border-border p-3 flex gap-2 items-end shadow-sm">
        {messages.length > 1 && (
          <button onClick={clearChat} className="p-2 rounded-xl hover:bg-secondary/50 text-muted-foreground transition-colors shrink-0" title="清空聊天">
            <Trash2 className="w-4 h-4" />
          </button>
        )}
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
          placeholder={`以${CHAT_STYLES.find(s => s.id === currentStyle)?.name || ''}风格提问...`}
          rows={1}
          className="flex-1 resize-none text-sm bg-transparent focus:outline-none max-h-32 placeholder:text-muted-foreground/60"
        />
        <button onClick={() => sendMessage(input)} disabled={!input.trim() || loading}
          className="p-2.5 rounded-xl bg-primary text-white hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </div>
      <p className="text-[10px] text-muted-foreground/60 text-center mt-2">AI助手基于您的八字信息提供参考建议，内容仅供参考</p>
    </div>
  );
}
