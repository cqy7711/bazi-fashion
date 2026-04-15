import type { UserBirthInfo } from '../pages/types';

export interface DailyFortune {
  total: number;
  totalLabel: string;
  totalColor: string;
  career: { score: number; label: string; desc: string; color: string };
  wealth: { score: number; label: string; desc: string; color: string };
  love: { score: number; label: string; desc: string; color: string };
  health: { score: number; label: string; desc: string; color: string };
  luckyColor: { name: string; hex: string };
  luckyNumber: number;
  luckyTime: string;
  luckyDirection: string;
  avoidTime: string;
  avoidDirection: string;
  mainTip: string;
  mainElement: string;
  // 宜/不宜事项
  goodThings: string[];   // 今日宜做事项
  avoidThings: string[];  // 今日不宜事项
}

const ELEMENT_NAMES: Record<string, string> = {
  wood: '木', fire: '火', earth: '土', metal: '金', water: '水',
};

export function getScoreLabel(score: number): string {
  if (score >= 85) return '大吉';
  if (score >= 70) return '吉';
  if (score >= 55) return '小吉';
  if (score >= 45) return '平';
  if (score >= 30) return '小凶';
  return '凶';
}

export function getScoreColor(score: number): string {
  if (score >= 85) return '#00C47A';
  if (score >= 70) return '#FF9D6B';
  if (score >= 55) return '#FFD666';
  if (score >= 45) return '#A0A8C0';
  if (score >= 30) return '#FF9D6B';
  return '#FF6B6B';
}

export function deriveDailyFortune(userInfo: UserBirthInfo): DailyFortune {
  const bazi = userInfo.baziResult as any;
  const fiveEls: Record<string, number> = (userInfo.fiveElements as unknown as Record<string, number>) || { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 };
  const favorable = (userInfo.favorableElements || []) as string[];
  const unfavorable = (userInfo.unfavorableElements || []) as string[];
  const dm = (bazi?.dayMasterElement || 'earth') as string;

  const dmBonus: Record<string, number> = { wood: 5, fire: 4, earth: 6, metal: 3, water: 7 };
  const favScore = Math.min(100, 45 + favorable.length * 12);
  const unfavPenalty = unfavorable.length * 6;
  const base = Math.max(30, favScore - unfavPenalty + (dmBonus[dm] || 0));
  const bodyScore = (userInfo as any).bodyStrengthScore || 55;
  const bodyFactor = bodyScore > 70 ? 5 : bodyScore < 40 ? -3 : 0;
  const total = Math.min(100, Math.max(28, Math.round(base + bodyFactor)));

  const careerScore = Math.min(100, Math.round(base + (favorable.includes(dm) ? 8 : -5)));
  const wealthScore = Math.min(100, Math.round(base - 2 + ((fiveEls.earth || 0) > 2 ? 6 : 0) + ((fiveEls.metal || 0) > 2 ? 4 : 0)));
  const loveScore = Math.min(100, Math.round(base + (['wood', 'fire'].includes(dm) ? 5 : -3)));
  const maxEl = Math.max(...Object.values(fiveEls).map(Number), 0);
  const minEl = Math.min(...Object.values(fiveEls).map(Number), 0);
  const balance = maxEl - minEl;
  const healthScore = Math.min(100, Math.round(base - Math.round(balance * 2)));

  const elDesc: Record<string, { career: string; wealth: string; love: string; health: string }> = {
    wood: {
      career: '木气生发，创造力强，宜文化创意、互联网、出版传媒。',
      wealth: '正财稳定，正偏财运尚可，忌投机。',
      love: '木主仁，感情细腻浪漫，社交活跃期。',
      health: '注意肝胆、神经系统、情绪调节。',
    },
    fire: {
      career: '火气旺盛，竞争心强，宜销售、演讲、法律、政治。',
      wealth: '财来财去，偏财运旺，忌高风险投资。',
      love: '火主礼，热情主动，姻缘易现。',
      health: '注意心脏、血液循环、眼睛健康。',
    },
    earth: {
      career: '土气厚重，稳扎稳打，宜建筑、地产、农业、管理。',
      wealth: '土主信，财运稳健积累，不宜冒险求财。',
      love: '土主信，感情稳重务实，婚配多以相亲为主。',
      health: '注意脾胃消化、饮食规律，皮肤易过敏。',
    },
    metal: {
      career: '金气清朗，决策力强，宜金融、科技、法律、外交。',
      wealth: '金主义，财运清正，利正财，偏财有波动。',
      love: '金主义，感情果断利落，注意避免冷落伴侣。',
      health: '注意肺部呼吸系统、骨骼、牙齿健康。',
    },
    water: {
      career: '水气流通，适应力强，宜贸易、物流、航海、媒体。',
      wealth: '水主智，财运流通性强，利于贸易与流通行业。',
      love: '水主智，感情多波折或晚婚居多，早年勿急。',
      health: '注意肾脏泌尿系统、耳力、冬季防寒。',
    },
  };

  const d = elDesc[dm] || elDesc.earth;

  const luckyColorMap: Record<string, { name: string; hex: string }> = {
    wood: { name: '青绿色', hex: '#00C47A' },
    fire: { name: '朱红色', hex: '#FF6B6B' },
    earth: { name: '黄棕色', hex: '#D4A000' },
    metal: { name: '银白色', hex: '#7B8FA8' },
    water: { name: '深蓝色', hex: '#00A8E8' },
  };
  const luckyColor = luckyColorMap[dm] || luckyColorMap.wood;
  const luckyNumMap: Record<string, number[]> = {
    wood: [1, 2, 3], fire: [3, 9, 7], earth: [5, 0, 8],
    metal: [4, 5, 9], water: [1, 6, 7],
  };
  const luckyNums = luckyNumMap[dm] || [1, 6];
  const luckyNumber = luckyNums[(new Date().getDate() + Number(userInfo.birthDay || 1)) % luckyNums.length];

  const timeMap: Record<number, string> = {
    0: '子时', 1: '丑时', 2: '寅时', 3: '卯时',
    4: '辰时', 5: '巳时', 6: '午时', 7: '未时',
    8: '申时', 9: '酉时', 10: '戌时', 11: '亥时',
  };
  const favHours: Record<string, number[]> = {
    wood: [2, 3, 4, 5], fire: [6, 7, 10, 11], earth: [0, 1, 8, 9],
    metal: [4, 5, 8, 9], water: [0, 1, 2, 3],
  };
  const fh = favHours[dm] || [1, 6];
  const luckyTime = `${timeMap[fh[0]]}·${timeMap[fh[1]]}`;
  const avoidTime = `${timeMap[(fh[2] || 8)]}`;

  const dirMap: Record<string, { lucky: string; avoid: string }> = {
    wood: { lucky: '东·北', avoid: '西南' },
    fire: { lucky: '南·东', avoid: '西北' },
    earth: { lucky: '东北·西南', avoid: '正东' },
    metal: { lucky: '西·西北', avoid: '正东' },
    water: { lucky: '北·西', avoid: '正南' },
  };
  const { lucky: luckyDirection, avoid: avoidDirection } = dirMap[dm] || dirMap.wood;

  const tipMap: Record<string, string> = {
    wood: '今日木气旺盛，创造力与表达能力突出，宜大胆表达想法、推进项目。',
    fire: '今日火势上扬，竞争动力强，宜主动出击、展示实力，但需注意控制情绪。',
    earth: '今日土气沉稳，宜稳扎稳打、处理积累事务，财运稳中有进，注意脾胃保养。',
    metal: '今日金气清朗，决策判断力强，宜处理重要事项、利谈判签约，人际注意直接表达。',
    water: '今日水气流通，人脉与信息运势佳，宜沟通协调、贸易往来，注意休息防疲劳。',
  };

  // 宜做事项
  const goodThingsMap: Record<string, string[]> = {
    wood: ['文化创作', '互联网科技', '出版传媒', '创意表达', '学习进修', '植树造林', '花草种植'],
    fire: ['销售推广', '演讲展示', '法律诉讼', '市场竞争', '投资理财', '宴会聚会', '电力能源'],
    earth: ['建筑工程', '房地产', '农业种植', '管理决策', '仓储物流', '矿产开采', '稳重推进'],
    metal: ['金融投资', '科技创新', '法律合约', '外交谈判', '金属加工', '手术医疗', '汽车制造'],
    water: ['贸易流通', '物流运输', '航海航空', '媒体传播', '教育咨询', '水利工程', '旅游出行'],
  };

  // 不宜事项
  const avoidThingsMap: Record<string, string[]> = {
    wood: ['冒险投机', '过度竞争', '激烈运动', '晚睡熬夜', '辛辣刺激', '肝胆手术'],
    fire: ['高风险投资', '过度饮酒', '剧烈运动', '冲动决策', '口腔溃疡治疗', '眼睛手术'],
    earth: ['投机取巧', '频繁变动', '冒险投资', '暴饮暴食', '脾胃手术', '过度劳累'],
    metal: ['投资冒险', '过度消极', '冷战沉默', '肺部手术', '骨骼大动', '肖小是非'],
    water: ['高风险投资', '过度奔波', '冒险激进', '肾脏手术', '航海危险', '过度放纵'],
  };

  const goodThings = goodThingsMap[dm] || goodThingsMap.wood;
  const avoidThings = avoidThingsMap[dm] || avoidThingsMap.wood;

  return {
    total, totalLabel: getScoreLabel(total), totalColor: getScoreColor(total),
    career: { score: careerScore, label: getScoreLabel(careerScore), desc: d.career, color: getScoreColor(careerScore) },
    wealth: { score: wealthScore, label: getScoreLabel(wealthScore), desc: d.wealth, color: getScoreColor(wealthScore) },
    love: { score: loveScore, label: getScoreLabel(loveScore), desc: d.love, color: getScoreColor(loveScore) },
    health: { score: healthScore, label: getScoreLabel(healthScore), desc: d.health, color: getScoreColor(healthScore) },
    luckyColor, luckyNumber, luckyTime, luckyDirection, avoidTime, avoidDirection,
    mainTip: tipMap[dm] || tipMap.wood,
    mainElement: ELEMENT_NAMES[dm] || '木',
    goodThings,
    avoidThings,
  };
}
