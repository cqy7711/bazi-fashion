import type { FiveElement, BaziResult, ShiShen, TenGod, FiveElementsDistribution, BodyStrength } from '../../shared/types.ts';

// 天干地支常量
const HEAVENLY_STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
const EARTHLY_BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

// 二十四节气日期表（公历每月两个节气的大致日期）
// 格式：月份 -> [节气序号(0=节,1=中), 日期]
// 节气序号：0=小寒,1=大寒,2=立春,3=雨水,4=惊蛰,5=春分,
//          6=清明,7=谷雨,8=立夏,9=小满,10=芒种,11=夏至,
//          12=小暑,13=大暑,14=立秋,15=处暑,16=白露,17=秋分,
//          18=寒露,19=霜降,20=立冬,21=小雪,22=大雪,23=冬至
const JIEQI_DATES: Record<number, [number, number]> = {
  1: [0, 6],   // 小寒 ~1月6日
  2: [2, 4],   // 立春 ~2月4日（年柱分界线）
  3: [4, 6],   // 惊蛰 ~3月6日
  4: [6, 5],   // 清明 ~4月5日
  5: [8, 6],   // 立夏 ~5月6日
  6: [10, 6],  // 芒种 ~6月6日
  7: [12, 7],  // 小暑 ~7月7日
  8: [14, 8],  // 立秋 ~8月8日
  9: [16, 8],  // 白露 ~9月8日
  10: [18, 8], // 寒露 ~10月8日
  11: [20, 7], // 立冬 ~11月7日
  12: [22, 7], // 大雪 ~12月7日
};

// 精确定位立春日期（适用于公历2000-2050年，误差±1天）
// 立春通常在2月3日-5日之间，1900年为基准年的近似公式
function getLichunDate(year: number): { month: number; day: number } {
  // 近似公式：基于19年章蔀周期（Metonic cycle）
  // 立春日期 = 2月4日 ± 偏移（根据19年周期位置计算）
  // 简化方案：使用预定义表（覆盖常用年份）
  const LICHUN_TABLE: Record<number, number> = {
    2000: 4, 2001: 4, 2002: 4, 2003: 4, 2004: 4,
    2005: 4, 2006: 4, 2007: 4, 2008: 4, 2009: 4,
    2010: 4, 2011: 4, 2012: 4, 2013: 4, 2014: 4,
    2015: 4, 2016: 4, 2017: 4, 2018: 4, 2019: 4,
    2020: 4, 2021: 3, 2022: 4, 2023: 4, 2024: 4,
    2025: 4, 2026: 4, 2027: 4, 2028: 4, 2029: 3,
    2030: 4, 2031: 4, 2032: 4, 2033: 4, 2034: 4,
    2035: 4, 2036: 4, 2037: 3, 2038: 4, 2039: 4,
    2040: 4, 2041: 4, 2042: 4, 2043: 4, 2044: 4,
    2045: 4, 2046: 4, 2047: 4, 2048: 4, 2049: 4,
  };
  const lichunDay = LICHUN_TABLE[year];
  if (lichunDay !== undefined) {
    return { month: 2, day: lichunDay };
  }
  // 通用近似公式（误差1-2天）：立春约在2月4日
  // 根据year mod 19的余数做小幅调整
  const remainder = year % 19;
  const offset = remainder <= 5 ? 1 : 0; // 闰年周期微调
  return { month: 2, day: 3 + offset };
}

// 判断出生日期是否在立春之前（属于上一年年柱）
function isBeforeLichun(year: number, month: number, day: number): boolean {
  const lichun = getLichunDate(year);
  if (month < lichun.month) return true;
  if (month > lichun.month) return false;
  return day < lichun.day;
}

// 计算年柱（以立春为年界，而非元旦）
function calculateYearPillar(year: number, month: number, day: number): string {
  // 立春之前则用上一年计算年柱
  const actualYear = isBeforeLichun(year, month, day) ? year - 1 : year;
  const stemIndex = ((actualYear - 4) % 10 + 10) % 10;
  const branchIndex = ((actualYear - 4) % 12 + 12) % 12;
  return HEAVENLY_STEMS[stemIndex] + EARTHLY_BRANCHES[branchIndex];
}

const STEM_ELEMENTS: Record<string, FiveElement> = {
  '甲': 'wood', '乙': 'wood',
  '丙': 'fire', '丁': 'fire',
  '戊': 'earth', '己': 'earth',
  '庚': 'metal', '辛': 'metal',
  '壬': 'water', '癸': 'water',
};

const BRANCH_ELEMENTS: Record<string, FiveElement> = {
  '寅': 'wood', '卯': 'wood',
  '巳': 'fire', '午': 'fire',
  '辰': 'earth', '戌': 'earth', '丑': 'earth', '未': 'earth',
  '申': 'metal', '酉': 'metal',
  '亥': 'water', '子': 'water',
};

// 地支藏干表
const BRANCH_HIDDEN_STEMS: Record<string, { stem: string; type: 'ben' | 'zhong' | 'yu' }[]> = {
  '子': [{ stem: '癸', type: 'ben' }],
  '丑': [{ stem: '己', type: 'ben' }, { stem: '癸', type: 'zhong' }, { stem: '辛', type: 'yu' }],
  '寅': [{ stem: '甲', type: 'ben' }, { stem: '丙', type: 'zhong' }, { stem: '戊', type: 'yu' }],
  '卯': [{ stem: '乙', type: 'ben' }],
  '辰': [{ stem: '戊', type: 'ben' }, { stem: '乙', type: 'zhong' }, { stem: '癸', type: 'yu' }],
  '巳': [{ stem: '丙', type: 'ben' }, { stem: '庚', type: 'zhong' }, { stem: '戊', type: 'yu' }],
  '午': [{ stem: '丁', type: 'ben' }, { stem: '己', type: 'zhong' }],
  '未': [{ stem: '己', type: 'ben' }, { stem: '丁', type: 'zhong' }, { stem: '乙', type: 'yu' }],
  '申': [{ stem: '庚', type: 'ben' }, { stem: '壬', type: 'zhong' }, { stem: '戊', type: 'yu' }],
  '酉': [{ stem: '辛', type: 'ben' }],
  '戌': [{ stem: '戊', type: 'ben' }, { stem: '辛', type: 'zhong' }, { stem: '丁', type: 'yu' }],
  '亥': [{ stem: '壬', type: 'ben' }, { stem: '甲', type: 'zhong' }],
};

// 月令主五行（按24节气细分）
// 寅月(立春-惊蛰)木旺，卯月(惊蛰-清明)木旺，辰月(清明-立夏)土旺
// 巳月(立夏-芒种)火旺，午月(芒种-小暑)火旺，未月(小暑-立秋)土旺
// 申月(立秋-白露)金旺，酉月(白露-寒露)金旺，戌月(寒露-立冬)土旺
// 亥月(立冬-大雪)水旺，子月(大雪-小寒)水旺，丑月(小寒-立春)土旺
const MONTH_ELEMENT_MAP: Record<number, FiveElement> = {
  1: 'water',   // 丑月 小寒-立春 土
  2: 'wood',    // 寅月 立春-惊蛰 木
  3: 'wood',    // 卯月 惊蛰-清明 木
  4: 'earth',   // 辰月 清明-立夏 土
  5: 'fire',    // 巳月 立夏-芒种 火
  6: 'fire',    // 午月 芒种-小暑 火
  7: 'earth',   // 未月 小暑-立秋 土
  8: 'metal',   // 申月 立秋-白露 金
  9: 'metal',   // 酉月 白露-寒露 金
  10: 'earth',  // 戌月 寒露-立冬 土
  11: 'water',  // 亥月 立冬-大雪 水
  12: 'water',  // 子月 大雪-小寒 水
};

// 五行生克关系
const ING_ELEMENTS: Record<FiveElement, FiveElement> = {
  wood: 'water', fire: 'wood', earth: 'fire', metal: 'earth', water: 'metal',
};
const OUTPUT_ELEMENTS: Record<FiveElement, FiveElement> = {
  wood: 'fire', fire: 'earth', earth: 'metal', metal: 'water', water: 'wood',
};
const RESTRAIN_ELEMENTS: Record<FiveElement, FiveElement> = {
  wood: 'metal', fire: 'water', earth: 'wood', metal: 'fire', water: 'earth',
};
const WEALTH_ELEMENTS: Record<FiveElement, FiveElement> = {
  wood: 'earth', fire: 'metal', earth: 'water', metal: 'wood', water: 'fire',
};
const SIBLING_ELEMENTS: Record<FiveElement, FiveElement> = {
  wood: 'wood', fire: 'fire', earth: 'earth', metal: 'metal', water: 'water',
};

// 五行在十二地支中的旺衰状态（旺相休囚死）
// 旺：当令之五行，力量最强
// 相：当令五行所生之五行，次旺
// 休：生当令五行者，休息
// 囚：被当令五行所克者，受制
// 死：克当令五行者，无力
const ELEMENT_STATUS_IN_BRANCH: Record<FiveElement, Record<string, 'wang' | 'xiang' | 'xiu' | 'qiu' | 'si'>> = {
  'wood': {
    '寅': 'wang', '卯': 'wang',
    '巳': 'xiang', '午': 'xiang',
    '亥': 'xiu', '子': 'xiu',
    '申': 'qiu', '酉': 'qiu',
    '辰': 'si', '戌': 'si', '丑': 'si', '未': 'si',
  },
  'fire': {
    '巳': 'wang', '午': 'wang',
    '寅': 'xiang', '卯': 'xiang',
    '申': 'xiu', '酉': 'xiu',
    '亥': 'qiu', '子': 'qiu',
    '辰': 'si', '戌': 'si', '丑': 'si', '未': 'si',
  },
  'earth': {
    '辰': 'wang', '戌': 'wang', '丑': 'wang', '未': 'wang',
    '巳': 'xiang', '午': 'xiang',
    '寅': 'si', '卯': 'si',
    '申': 'xiu', '酉': 'xiu',
    '亥': 'qiu', '子': 'qiu',
  },
  'metal': {
    '申': 'wang', '酉': 'wang',
    '辰': 'xiang', '戌': 'xiang', '丑': 'xiang', '未': 'xiang',
    '巳': 'si', '午': 'si',
    '亥': 'xiu', '子': 'xiu',
    '寅': 'qiu', '卯': 'qiu',
  },
  'water': {
    '亥': 'wang', '子': 'wang',
    '申': 'xiang', '酉': 'xiang',
    '巳': 'si', '午': 'si',
    '寅': 'xiu', '卯': 'xiu',
    '辰': 'qiu', '戌': 'qiu', '丑': 'qiu', '未': 'qiu',
  },
};

// 得令评分标准
const DE_LING_SCORE_MAP: Record<'wang' | 'xiang' | 'xiu' | 'qiu' | 'si', number> = {
  'wang': 3, 'xiang': 2, 'xiu': 0, 'qiu': -2, 'si': -3,
};

// 计算十神
function calculateShiShen(dayMaster: string, targetStem: string): TenGod {
  const dayMasterElement = STEM_ELEMENTS[dayMaster];
  const targetElement = STEM_ELEMENTS[targetStem];
  const dayMasterYang = HEAVENLY_STEMS.indexOf(dayMaster) % 2 === 0;
  const targetYang = HEAVENLY_STEMS.indexOf(targetStem) % 2 === 0;

  if (SIBLING_ELEMENTS[dayMasterElement] === targetElement) {
    return dayMasterYang === targetYang ? '比肩' : '劫财';
  }
  if (ING_ELEMENTS[dayMasterElement] === targetElement) {
    return dayMasterYang === targetYang ? '偏印' : '正印';
  }
  if (OUTPUT_ELEMENTS[dayMasterElement] === targetElement) {
    return dayMasterYang === targetYang ? '食神' : '伤官';
  }
  if (RESTRAIN_ELEMENTS[dayMasterElement] === targetElement) {
    return dayMasterYang === targetYang ? '七杀' : '正官';
  }
  if (WEALTH_ELEMENTS[dayMasterElement] === targetElement) {
    return dayMasterYang === targetYang ? '偏财' : '正财';
  }
  return '比肩';
}

// 计算月柱
function calculateMonthPillar(year: number, month: number, day: number): string {
  // 使用立春校正后的年干
  const yearPillar = calculateYearPillar(year, month, day);
  const yearStem = yearPillar[0];

  const FIRST_MONTH_STEM_MAP: Record<string, number> = {
    '甲': 2, '己': 2, '乙': 4, '庚': 4, '丙': 6, '辛': 6, '丁': 8, '壬': 8, '戊': 0, '癸': 0,
  };

  const JIEQI_BRANCH_MAP: Record<number, { branch: number; day: number }> = {
    1: { branch: 1, day: 6 }, 2: { branch: 2, day: 4 }, 3: { branch: 3, day: 6 },
    4: { branch: 4, day: 5 }, 5: { branch: 5, day: 6 }, 6: { branch: 6, day: 6 },
    7: { branch: 7, day: 7 }, 8: { branch: 8, day: 8 }, 9: { branch: 9, day: 8 },
    10: { branch: 10, day: 8 }, 11: { branch: 11, day: 7 }, 12: { branch: 0, day: 7 },
  };

  const jieQi = JIEQI_BRANCH_MAP[month];
  let monthBranchIndex: number;
  if (day >= jieQi.day) {
    monthBranchIndex = jieQi.branch;
  } else {
    const prevMonth = month === 1 ? 12 : month - 1;
    monthBranchIndex = JIEQI_BRANCH_MAP[prevMonth].branch;
  }

  let offsetFromYin = monthBranchIndex >= 2 ? monthBranchIndex - 2 : monthBranchIndex + 10;
  const firstStem = FIRST_MONTH_STEM_MAP[yearStem];
  const monthStemIndex = (firstStem + offsetFromYin) % 10;

  return HEAVENLY_STEMS[monthStemIndex] + EARTHLY_BRANCHES[monthBranchIndex];
}

// 计算日柱
function calculateDayPillar(year: number, month: number, day: number): string {
  const baseDate = new Date(Date.UTC(1900, 0, 1));
  const targetDate = new Date(Date.UTC(year, month - 1, day));
  const diffDays = Math.floor((targetDate.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24));
  const stemIndex = ((diffDays + 0) % 10 + 10) % 10;
  const branchIndex = ((diffDays + 10) % 12 + 12) % 12;
  return HEAVENLY_STEMS[stemIndex] + EARTHLY_BRANCHES[branchIndex];
}

// 计算时柱
function calculateHourPillar(dayStem: string, hour: number): string {
  const HOUR_STEM_BASE_MAP: Record<string, number> = {
    '甲': 0, '己': 0, '乙': 2, '庚': 2, '丙': 4, '辛': 4, '丁': 6, '壬': 6, '戊': 8, '癸': 8,
  };
  const hourBranchIndex = Math.floor((hour + 1) / 2) % 12;
  const hourStemIndex = (HOUR_STEM_BASE_MAP[dayStem] + hourBranchIndex) % 10;
  return HEAVENLY_STEMS[hourStemIndex] + EARTHLY_BRANCHES[hourBranchIndex];
}

// 计算八字
export function calculateBazi(year: number, month: number, day: number, hour: number): BaziResult {
  // 处理子时跨日（23:00后为次日子时）
  let baziYear = year, baziMonth = month, baziDay = day;
  let baziHour = hour;
  if (hour === 23) {
    const nextDay = new Date(year, month - 1, day + 1);
    baziYear = nextDay.getFullYear();
    baziMonth = nextDay.getMonth() + 1;
    baziDay = nextDay.getDate();
  }

  // 使用立春校正计算四柱
  const baziYearP = calculateYearPillar(baziYear, baziMonth, baziDay);
  const baziMonthP = calculateMonthPillar(baziYear, baziMonth, baziDay);
  const baziDayP = calculateDayPillar(baziYear, baziMonth, baziDay);
  const dayMaster = baziDayP[0];
  const baziHourP = calculateHourPillar(dayMaster, baziHour);

  const shiShen: ShiShen = {
    yearStem: calculateShiShen(dayMaster, baziYearP[0]),
    yearBranch: calculateShiShen(dayMaster, BRANCH_HIDDEN_STEMS[baziYearP[1]]?.[0]?.stem || '甲'),
    monthStem: calculateShiShen(dayMaster, baziMonthP[0]),
    monthBranch: calculateShiShen(dayMaster, BRANCH_HIDDEN_STEMS[baziMonthP[1]]?.[0]?.stem || '甲'),
    dayBranch: calculateShiShen(dayMaster, BRANCH_HIDDEN_STEMS[baziDayP[1]]?.[0]?.stem || '甲'),
    hourStem: calculateShiShen(dayMaster, baziHourP[0]),
    hourBranch: calculateShiShen(dayMaster, BRANCH_HIDDEN_STEMS[baziHourP[1]]?.[0]?.stem || '甲'),
  };

  return {
    yearPillar: baziYearP,
    monthPillar: baziMonthP,
    dayPillar: baziDayP,
    hourPillar: baziHourP,
    dayMaster,
    dayMasterElement: STEM_ELEMENTS[dayMaster],
    shiShen,
    trueSolarTime: {
      hour: baziHour,
      minute: 0,
      offsetMinutes: 0,
      longitude: null,
      description: `北京时间 ${baziHour}:00 换算为真太阳时（精确经纬度需出生地点）`,
      beijingHour: hour,
    },
  };
}

// 计算五行分布
export function calculateFiveElements(bazi: BaziResult): FiveElementsDistribution {
  const dist: FiveElementsDistribution = { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 };

  const stems = [bazi.yearPillar[0], bazi.monthPillar[0], bazi.dayPillar[0], bazi.hourPillar[0]];
  for (const stem of stems) {
    if (STEM_ELEMENTS[stem]) dist[STEM_ELEMENTS[stem]]++;
  }

  const branches = [bazi.yearPillar[1], bazi.monthPillar[1], bazi.dayPillar[1], bazi.hourPillar[1]];
  for (const branch of branches) {
    const hiddenStems = BRANCH_HIDDEN_STEMS[branch];
    if (hiddenStems) {
      for (const { stem } of hiddenStems) {
        if (STEM_ELEMENTS[stem]) dist[STEM_ELEMENTS[stem]]++;
      }
    }
  }
  return dist;
}

// 计算得令评分
function calculateDeLingScore(dayMasterElement: FiveElement, monthBranch: string): { score: number; status: string } {
  const status = ELEMENT_STATUS_IN_BRANCH[dayMasterElement]?.[monthBranch] || 'xiu';
  const score = DE_LING_SCORE_MAP[status];
  const statusName: Record<string, string> = { 'wang': '旺', 'xiang': '相', 'xiu': '休', 'qiu': '囚', 'si': '死' };
  return { score, status: statusName[status] };
}

// 计算通根评分
function calculateRootScore(bazi: BaziResult, dayMasterElement: FiveElement): { score: number; details: string[] } {
  const branches = [bazi.yearPillar[1], bazi.monthPillar[1], bazi.dayPillar[1], bazi.hourPillar[1]];
  let score = 0;
  const details: string[] = [];

  for (const branch of branches) {
    const hiddenStems = BRANCH_HIDDEN_STEMS[branch];
    if (!hiddenStems) continue;
    for (const { stem, type } of hiddenStems) {
      if (STEM_ELEMENTS[stem] === dayMasterElement) {
        if (type === 'ben') { score += 3; details.push(`${branch}中${stem}(本气根)+3`); }
        else if (type === 'zhong') { score += 2; details.push(`${branch}中${stem}(中气根)+2`); }
        else if (type === 'yu') { score += 1; details.push(`${branch}中${stem}(余气根)+1`); }
      }
    }
  }
  return { score, details };
}

// 计算地支帮扶评分
function calculateBranchSupportScore(bazi: BaziResult, dayMasterElement: FiveElement): { score: number; details: string[] } {
  const branches = [bazi.yearPillar[1], bazi.monthPillar[1], bazi.dayPillar[1], bazi.hourPillar[1]];
  let score = 0;
  const details: string[] = [];
  const ingElement = ING_ELEMENTS[dayMasterElement];

  for (const branch of branches) {
    const hiddenStems = BRANCH_HIDDEN_STEMS[branch];
    if (!hiddenStems) continue;
    const benQi = hiddenStems.find(h => h.type === 'ben');
    if (benQi) {
      const stemElement = STEM_ELEMENTS[benQi.stem];
      if (stemElement === dayMasterElement) { score += 1; details.push(`${branch}本气${benQi.stem}(比劫)+1`); }
      else if (stemElement === ingElement) { score += 1; details.push(`${branch}本气${benQi.stem}(印星)+1`); }
    }
  }
  return { score, details };
}

// 计算天干帮扶评分
function calculateExposureScore(bazi: BaziResult, dayMasterElement: FiveElement): { score: number; details: string[] } {
  const stems = [bazi.yearPillar[0], bazi.monthPillar[0], bazi.hourPillar[0]];
  let score = 0;
  const details: string[] = [];
  const ingElement = ING_ELEMENTS[dayMasterElement];

  for (const stem of stems) {
    const stemElement = STEM_ELEMENTS[stem];
    if (stemElement === dayMasterElement) { score += 2; details.push(`${stem}(比劫)+2`); }
    else if (stemElement === ingElement) { score += 2; details.push(`${stem}(印星)+2`); }
  }
  return { score, details };
}

// 判断身强身弱（七档分级，对应知识库标准）
// 身过旺(13+)：可能成专旺格
// 身强(10-12)：需要强力克泄耗
// 身旺(6-9)：需要适当克泄耗
// 中和(3-5)：日主力量适中
// 身弱(0-2)：需要生扶帮助
// 身衰(-1~-3)：需要强力生扶
// 身极弱(-4及以下)：可能成从格
export function calculateBodyStrength(bazi: BaziResult, birthMonth: number): {
  totalScore: number; deLingScore: number; rootScore: number;
  branchSupportScore: number; exposureScore: number;
  deLingStatus: string;
  bodyStrength: BodyStrength;
  rootDetails: string[];
  branchSupportDetails: string[];
  exposureDetails: string[];
} {
  const dayMasterElement = bazi.dayMasterElement;
  const monthBranch = bazi.monthPillar[1];
  const deLingResult = calculateDeLingScore(dayMasterElement, monthBranch);
  const rootResult = calculateRootScore(bazi, dayMasterElement);
  const branchSupportResult = calculateBranchSupportScore(bazi, dayMasterElement);
  const exposureResult = calculateExposureScore(bazi, dayMasterElement);
  const totalScore = deLingResult.score + rootResult.score + branchSupportResult.score + exposureResult.score;

  let bodyStrength: BodyStrength;
  if (totalScore >= 13) bodyStrength = 'very_strong';    // 身过旺（专旺格）
  else if (totalScore >= 10) bodyStrength = 'strong';   // 身强
  else if (totalScore >= 6) bodyStrength = 'wang';       // 身旺
  else if (totalScore >= 3) bodyStrength = 'neutral';   // 中和
  else if (totalScore >= 0) bodyStrength = 'weak';      // 身弱
  else if (totalScore >= -3) bodyStrength = 'shuai';   // 身衰
  else bodyStrength = 'very_weak';                      // 身极弱（从弱格）

  return {
    totalScore, deLingScore: deLingResult.score, rootScore: rootResult.score,
    branchSupportScore: branchSupportResult.score, exposureScore: exposureResult.score,
    deLingStatus: deLingResult.status, bodyStrength,
    rootDetails: rootResult.details,
    branchSupportDetails: branchSupportResult.details,
    exposureDetails: exposureResult.details,
  };
}

// 选取喜用神
export function determineFavorableElements(
  bazi: BaziResult,
  birthMonth: number,
  fiveElements: FiveElementsDistribution,
): {
  favorable: FiveElement[];
  unfavorable: FiveElement[];
  method: string;
  explanation: string;
  bodyStrength: BodyStrength;
  totalScore: number;
  tiaohouElement?: FiveElement;
  // 评分细节
  deLingScore: number;
  deLingStatus: string;
  rootScore: number;
  rootDetails: string[];
  branchSupportScore: number;
  branchSupportDetails: string[];
  exposureScore: number;
  exposureDetails: string[];
} {
  const dayMasterElement = bazi.dayMasterElement;
  const scoreResult = calculateBodyStrength(bazi, birthMonth);
  const { totalScore, bodyStrength, deLingScore, rootScore, rootDetails, branchSupportScore, branchSupportDetails, exposureScore, exposureDetails, deLingStatus } = scoreResult;

  const allElements: FiveElement[] = ['wood', 'fire', 'earth', 'metal', 'water'];
  let favorable: FiveElement[] = [];
  let unfavorable: FiveElement[] = [];
  let method = '';
  let explanation = '';
  let tiaohouElement: FiveElement | undefined;

  // 调候用神（按24节气细化）
  // 寅月卯月（春）喜火调候，辰月未月戌月（夏湿）喜水
  // 巳月午月（夏）喜水调候，申月酉月（秋）喜水润燥
  // 亥月子月（冬）喜火暖局，丑月（冬末）喜辛金
  const tiaohouMap: Record<number, FiveElement> = {
    1: 'fire',    // 丑月（小寒-立春）寒命喜火
    2: 'fire',    // 寅月（立春-惊蛰）木命喜火调候
    3: 'fire',    // 卯月（惊蛰-清明）木命喜火调候
    4: 'water',   // 辰月（清明-立夏）湿命喜水
    5: 'water',   // 巳月（立夏-芒种）热命喜水
    6: 'water',   // 午月（芒种-小暑）热命喜水
    7: 'water',   // 未月（小暑-立秋）燥命喜水
    8: 'water',   // 申月（立秋-白露）金命喜水润
    9: 'fire',    // 酉月（白露-寒露）燥命喜火
    10: 'fire',   // 戌月（寒露-立冬）燥命喜火
    11: 'fire',   // 亥月（立冬-大雪）寒命喜火
    12: 'fire',   // 子月（大雪-小寒）寒命喜火
  };
  const tiaohouNeed = tiaohouMap[birthMonth];
  const hasTiaohou = fiveElements[tiaohouNeed] >= 1;

  const output = OUTPUT_ELEMENTS[dayMasterElement];
  const wealth = WEALTH_ELEMENTS[dayMasterElement];
  const restrain = RESTRAIN_ELEMENTS[dayMasterElement];
  const ing = ING_ELEMENTS[dayMasterElement];

  if (bodyStrength === 'very_strong') {
    favorable = [ing, dayMasterElement];
    unfavorable = [restrain, wealth, output];
    method = '从强格（专旺）';
    explanation = `日主${dayMasterElement}极旺（得分${totalScore}），形成专旺格，顺从旺势取印星、比劫为用神`;
  } else if (bodyStrength === 'very_weak') {
    favorable = [restrain, wealth, output];
    unfavorable = [ing, dayMasterElement];
    method = '从弱格';
    explanation = `日主${dayMasterElement}极弱（得分${totalScore}），形成从弱格，顺从弱势取官杀、财星、食伤为用神`;
  } else if (bodyStrength === 'strong' || bodyStrength === 'wang') {
    if (!hasTiaohou && (output === tiaohouNeed || wealth === tiaohouNeed)) {
      favorable = [tiaohouNeed];
      unfavorable = allElements.filter(e => e !== tiaohouNeed && e !== dayMasterElement);
      method = '调候用神';
      tiaohouElement = tiaohouNeed;
      explanation = `日主${dayMasterElement}${bodyStrength === 'strong' ? '身强' : '身旺'}（得分${totalScore}），需泄耗，但${birthMonth}月需要${tiaohouNeed === 'fire' ? '火' : '水'}调候为先`;
    } else {
      const unique = [output, wealth, restrain].filter((v, i, a) => a.indexOf(v) === i) as FiveElement[];
      favorable = unique;
      unfavorable = [dayMasterElement, ing];
      method = bodyStrength === 'strong' ? '身强喜克泄耗' : '身旺喜克泄耗';
      explanation = `日主${dayMasterElement}${bodyStrength === 'strong' ? '身强' : '身旺'}（得分${totalScore}），喜用神按优先级为：食伤（泄身）、财星（耗身）、官杀（克身）`;
    }
  } else if (bodyStrength === 'weak' || bodyStrength === 'shuai') {
    if (!hasTiaohou && (ing === tiaohouNeed || dayMasterElement === tiaohouNeed)) {
      favorable = [tiaohouNeed];
      unfavorable = allElements.filter(e => e !== tiaohouNeed);
      method = '调候用神';
      tiaohouElement = tiaohouNeed;
      explanation = `日主${dayMasterElement}${bodyStrength === 'weak' ? '身弱' : '身衰'}（得分${totalScore}），需生扶，但${birthMonth}月需要${tiaohouNeed === 'fire' ? '火' : '水'}调候为先`;
    } else {
      favorable = [ing, dayMasterElement];
      unfavorable = [output, wealth, restrain];
      method = bodyStrength === 'weak' ? '身弱喜生扶' : '身衰喜生扶';
      explanation = `日主${dayMasterElement}${bodyStrength === 'weak' ? '身弱' : '身衰'}（得分${totalScore}），喜用神按优先级为：印星（生身）、比劫（帮身）`;
    }
  } else {
    favorable = allElements.filter(e => fiveElements[e] <= 1);
    const maxCount = Math.max(...allElements.map(e => fiveElements[e]));
    unfavorable = allElements.filter(e => maxCount >= 3 ? fiveElements[e] >= 3 : fiveElements[e] === maxCount);
    method = '中和平衡';
    explanation = `日主${dayMasterElement}中和（得分${totalScore}），以平衡五行为主`;
  }

  return {
    favorable, unfavorable, method, explanation, bodyStrength, totalScore, tiaohouElement,
    deLingScore, deLingStatus, rootScore, rootDetails, branchSupportScore, branchSupportDetails,
    exposureScore, exposureDetails,
  };
}

// 起运计算
export function calculateQiyunAge(
  birthYear: number, birthMonth: number, birthDay: number, birthHour: number,
  gender: 'male' | 'female', yearGan: string
): { startAge: number; startYear: number; startMonth: number; isForward: boolean } {
  const isYangYear = ['甲', '丙', '戊', '庚', '壬'].includes(yearGan);
  const isForward = (isYangYear && gender === 'male') || (!isYangYear && gender === 'female');

  const JIE_DATES: Record<number, number> = {
    1: 6, 2: 4, 3: 6, 4: 5, 5: 6, 6: 6,
    7: 7, 8: 8, 9: 8, 10: 8, 11: 7, 12: 7,
  };

  const birthDate = new Date(birthYear, birthMonth - 1, birthDay);
  const thisMonthJie = JIE_DATES[birthMonth];
  const prevMonth = birthMonth === 1 ? 12 : birthMonth - 1;
  const nextMonth = birthMonth === 12 ? 1 : birthMonth + 1;
  const prevMonthJie = JIE_DATES[prevMonth];
  const nextMonthJie = JIE_DATES[nextMonth];

  let daysDiff: number;
  if (isForward) {
    // 顺行：计算到下一个节气的天数
    // 如果出生日在当月节气之前，则找当月节气
    // 如果出生日在当月节气之后，则找下月节气
    if (birthDay < thisMonthJie) {
      // 当天在当月节气之前，找当月的节气
      const thisJieDate = new Date(birthYear, birthMonth - 1, thisMonthJie);
      daysDiff = Math.round((thisJieDate.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24));
    } else {
      // 当天在当月节气之后或当天，找下个月的节气
      const nextMonthYear = birthMonth === 12 ? birthYear + 1 : birthYear;
      const nextJieDate = new Date(nextMonthYear, nextMonth - 1, nextMonthJie);
      daysDiff = Math.round((nextJieDate.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24));
    }
  } else {
    // 逆行：计算到上一个节气的天数
    // 如果出生日在当月节气之前，则找上月节气
    // 如果出生日在当月节气之后或当天，则找当月节气
    if (birthDay < thisMonthJie) {
      // 当天在当月节气之前，找上个月的节气
      const prevMonthYear = birthMonth === 1 ? birthYear - 1 : birthYear;
      const targetJieDate = new Date(prevMonthYear, prevMonth - 1, prevMonthJie);
      daysDiff = Math.round((birthDate.getTime() - targetJieDate.getTime()) / (1000 * 60 * 60 * 24));
    } else {
      // 当天在当月节气之后或当天，找当月的节气
      const targetJieDate = new Date(birthYear, birthMonth - 1, thisMonthJie);
      daysDiff = Math.round((birthDate.getTime() - targetJieDate.getTime()) / (1000 * 60 * 60 * 24));
    }
  }
  daysDiff = Math.abs(daysDiff);

  const qiyunMonths = Math.floor(daysDiff / 3);
  const qiyunAge = qiyunMonths / 12;

  const startDate = new Date(birthDate);
  startDate.setMonth(startDate.getMonth() + qiyunMonths);

  return { startAge: qiyunAge, startYear: startDate.getFullYear(), startMonth: startDate.getMonth() + 1, isForward };
}

// ============================================================
// 十二长生状态计算
// 长生十二宫：长生、沐浴、冠带、临官、帝旺、衰、病、死、墓、绝、胎、养
// ============================================================

const CHANG_SHENG_SEQUENCE = ['长生', '沐浴', '冠带', '临官', '帝旺', '衰', '病', '死', '墓', '绝', '胎', '养'];

// 五行长生宫起始地支（阳干顺行十二宫）
const CHANG_SHENG_START: Record<FiveElement, string> = {
  'wood': '亥',   // 木长生于亥
  'fire': '寅',   // 火长生于寅
  'earth': '申',  // 土长生于申（也有说长生于午，此用通论）
  'metal': '巳',  // 金长生于巳
  'water': '申',  // 水长生于申
};

function getBranchIndex(branch: string): number {
  return EARTHLY_BRANCHES.indexOf(branch);
}

/**
 * 计算某五行在地支的十二长生状态
 * @param element 五行
 * @param branch 地支
 * @returns 十二长生状态名称
 */
export function getChangSheng(element: FiveElement, branch: string): string {
  const startBranch = CHANG_SHENG_START[element];
  const startIdx = getBranchIndex(startBranch);
  const targetIdx = getBranchIndex(branch);
  // 计算相对于起始位置的距离（阳干顺行）
  let offset = (targetIdx - startIdx + 12) % 12;
  return CHANG_SHENG_SEQUENCE[offset];
}

/**
 * 计算日主八字中各柱地支的十二长生状态
 */
export function calculateChangSheng(bazi: BaziResult): Record<string, string> {
  const dmElement = bazi.dayMasterElement;
  const branches = [bazi.yearPillar[1], bazi.monthPillar[1], bazi.dayPillar[1], bazi.hourPillar[1]];
  const labels = ['yearBranch', 'monthBranch', 'dayBranch', 'hourBranch'];
  const result: Record<string, string> = {};
  for (let i = 0; i < branches.length; i++) {
    result[labels[i]] = getChangSheng(dmElement, branches[i]);
  }
  // 时干长生（用于时柱天干）
  result.hourStem = getChangSheng(dmElement, bazi.hourPillar[1]);
  return result;
}

// ============================================================
// 神煞计算
// ============================================================

/**
 * 计算天德贵人（按出生月份的地支）
 * 天德：正月起丁（亥）、卯（坤）...
 * 口诀：正月丁，二月申，三月壬，四月辛，五月亥，六月甲，
 *       七月癸，八月寅，九月丙，十月乙，十一巳，十二月庚
 */
export function getTianDe(monthBranch: string): string {
  const map: Record<string, string> = {
    '寅': '丁', '卯': '坤', '辰': '壬', '巳': '辛',
    '午': '亥', '未': '甲', '申': '癸', '酉': '寅',
    '戌': '丙', '亥': '乙', '子': '巳', '丑': '庚',
  };
  return map[monthBranch] || '无';
}

/**
 * 计算月德贵人（按出生月份的地支）
 * 口诀：寅午戌月德在丙，亥卯未月德在甲，申子辰月德在壬，巳酉丑月德在庚
 */
export function getYueDe(monthBranch: string): string {
  const map: Record<string, string> = {
    '寅': '丙', '午': '丙', '戌': '丙',
    '亥': '甲', '卯': '甲', '未': '甲',
    '申': '壬', '子': '壬', '辰': '壬',
    '巳': '庚', '酉': '庚', '丑': '庚',
  };
  return map[monthBranch] || '无';
}

/**
 * 计算文昌（智能之神，利于学业考试）
 * 甲丙戊庚壬五阳干：甲见巳、乙见午、丙见申、丁见酉、戊见亥、己见子、庚在寅、辛在卯、壬在巳、癸在午
 */
export function getWenChang(dayMaster: string, monthBranch: string): string {
  const stemIdx = HEAVENLY_STEMS.indexOf(dayMaster);
  const yang = stemIdx % 2 === 0;
  const wenChangTable: Record<string, string> = {
    '甲': '巳', '乙': '午', '丙': '申', '丁': '酉',
    '戊': '亥', '己': '子', '庚': '寅', '辛': '卯',
    '壬': '巳', '癸': '午',
  };
  return wenChangTable[dayMaster] || '无';
}

/**
 * 计算驿马（迁移变动之神）
 * 申子辰马在寅，寅午戌马在申，亥卯未马在巳，巳酉丑马在亥
 */
export function getYiMa(monthBranch: string): string {
  const map: Record<string, string> = {
    '申': '寅', '子': '寅', '辰': '寅',
    '寅': '申', '午': '申', '戌': '申',
    '亥': '巳', '卯': '巳', '未': '巳',
    '巳': '亥', '酉': '亥', '丑': '亥',
  };
  return map[monthBranch] || '无';
}

/**
 * 计算桃花（姻缘浪漫之神）
 * 申子辰桃花在酉，寅午戌桃花在卯，亥卯未桃花在子，巳酉丑桃花在午
 */
export function getTaoHua(monthBranch: string): string {
  const map: Record<string, string> = {
    '申': '酉', '子': '酉', '辰': '酉',
    '寅': '卯', '午': '卯', '戌': '卯',
    '亥': '子', '卯': '子', '未': '子',
    '巳': '午', '酉': '午', '丑': '午',
  };
  return map[monthBranch] || '无';
}

/**
 * 计算华盖（艺术孤独之神）
 * 寅午戌见戌，申子辰见辰，亥卯未见未，巳酉丑见丑
 */
export function getHuaGai(monthBranch: string): string {
  const map: Record<string, string> = {
    '寅': '戌', '午': '戌', '戌': '戌',
    '申': '辰', '子': '辰', '辰': '辰',
    '亥': '未', '卯': '未', '未': '未',
    '巳': '丑', '酉': '丑', '丑': '丑',
  };
  return map[monthBranch] || '无';
}

/**
 * 计算禄神（衣禄俸禄之神，与日干相同的地支）
 */
export function getLuShen(dayMaster: string, monthBranch: string): string {
  // 禄神为与日干五行相同的地支（同类）
  // 甲禄在寅，乙禄在卯，丙戊禄在巳，丁己禄在午，庚禄在申，辛禄在酉，壬禄在亥，癸禄在子
  const luShenTable: Record<string, string> = {
    '甲': '寅', '乙': '卯', '丙': '巳', '丁': '午',
    '戊': '巳', '己': '午', '庚': '申', '辛': '酉',
    '壬': '亥', '癸': '子',
  };
  return luShenTable[dayMaster] || '无';
}

/**
 * 计算全部神煞
 */
export function calculateShenSha(bazi: BaziResult): {
  tianDe: string; yueDe: string; wenChang: string;
  yiMa: string; taoHua: string; huaGai: string; luShen: string;
} {
  const monthBranch = bazi.monthPillar[1];
  const dayMaster = bazi.dayMaster;
  return {
    tianDe: getTianDe(monthBranch),
    yueDe: getYueDe(monthBranch),
    wenChang: getWenChang(dayMaster, monthBranch),
    yiMa: getYiMa(monthBranch),
    taoHua: getTaoHua(monthBranch),
    huaGai: getHuaGai(monthBranch),
    luShen: getLuShen(dayMaster, monthBranch),
  };
}

// ============================================================
// 格局判断（正八格+从格）
// ============================================================

export type BaziPattern = {
  type: '正八格' | '从格' | '化格' | '不入格';
  name: string;
  description: string;
  mainGod: string;
  subGod?: string;
  // 详细分析
  formation: string;         // 成格条件
  characteristics: string;   // 格局特点
  strengths: string;         // 优势
  weaknesses: string;        // 劣势
  suitableCareer: string[];  // 适合职业
  avoidCareer: string[];     // 不适合职业
  luckTips: string;          // 运势提示
};

// 格局详细特征库
const PATTERN_DETAILS: Record<string, {
  formation: string;
  characteristics: string;
  strengths: string[];
  weaknesses: string[];
  suitableCareer: string[];
  avoidCareer: string[];
  luckTips: string;
}> = {
  '印格': {
    formation: '月令为正印或偏印，且印星有根气',
    characteristics: '主人聪明好学、心地善良、有仁慈之心，重视声誉地位，学业运佳',
    strengths: ['学业优秀', '名誉观念强', '善于学习', '心地善良', '有贵人运'],
    weaknesses: ['过于理想化', '有时优柔寡断', '可能过于依赖他人'],
    suitableCareer: ['教育工作者', '学术研究', '医疗健康', '政府机关', '文化出版'],
    avoidCareer: ['销售业务', '激烈竞争行业'],
    luckTips: '印星为用时学业、名誉顺利；印星受损则学业受阻、名誉受损'
  },
  '食神格': {
    formation: '月令为食神，食神旺而身强，有泄秀之路',
    characteristics: '主人聪明秀气、性格温和、乐观开朗，福禄深厚，财运佳',
    strengths: ['聪明伶俐', '口才良好', '财运亨通', '心地善良', '福气深厚'],
    weaknesses: ['有时过于享乐', '缺乏上进心', '过于理想化'],
    suitableCareer: ['餐饮美食', '演艺娱乐', '艺术创作', '财务会计', '自由职业'],
    avoidCareer: ['政治权谋', '高压销售'],
    luckTips: '食神为用时财运佳、身体健康；食神被夺则财运受阻、健康下滑'
  },
  '伤官格': {
    formation: '月令为伤官，伤官旺而身强，有印制伤官',
    characteristics: '主人才华横溢、思维敏捷、敢于创新，但易有叛逆心理',
    strengths: ['才华出众', '思维敏捷', '敢于创新', '表现力强', '艺术天分'],
    weaknesses: ['叛逆心理', '口舌是非', '不够稳重', '容易得罪人'],
    suitableCareer: ['艺术创作', '演艺表演', '自媒体', '法律', '自由职业'],
    avoidCareer: ['传统官僚', '国企体制内'],
    luckTips: '伤官配印则才华得以发挥；伤官无制则易惹是非、口舌不断'
  },
  '官杀格': {
    formation: '月令为正官或七杀，官杀有制化，身强能任官杀',
    characteristics: '主人事业心强、有管理能力、责任心重，利于仕途发展',
    strengths: ['事业心强', '管理能力', '责任心重', '有上进心', '自律性强'],
    weaknesses: ['压力过大', '过于严肃', '可能过于追求地位'],
    suitableCareer: ['企业管理', '政府机关', '法律', '金融', '教育培训'],
    avoidCareer: ['自由散漫职业', '风险过大行业'],
    luckTips: '官杀为用则事业顺利、地位提升；官杀攻身则压力增大、小人是非'
  },
  '财格': {
    formation: '月令为正财或偏财，财星有根，身强能担财',
    characteristics: '主人财运佳、善于理财、精明能干，重视物质生活',
    strengths: ['财运亨通', '理财能力强', '精明能干', '物质充裕', '社交能力强'],
    weaknesses: ['过于务实', '可能贪财', '有时过于计较'],
    suitableCareer: ['金融投资', '商业贸易', '财务会计', '企业管理', '销售'],
    avoidCareer: ['学术研究', '清贫行业'],
    luckTips: '财星为用则财运滚滚；财多身弱则破财、负债、身体虚弱'
  },
  '比劫格': {
    formation: '月令为比肩或劫财，比劫旺盛，利于竞争',
    characteristics: '主人独立性高、竞争意识强、敢闯敢拼，人缘广泛',
    strengths: ['独立自主', '竞争意识', '敢闯敢拼', '人脉广泛', '意志坚定'],
    weaknesses: ['容易冲动', '人际纠纷', '过于自我'],
    suitableCareer: ['创业投资', '销售业务', '体育竞技', '演艺表演', '自由职业'],
    avoidCareer: ['按部就班工作', '稳定但低收入行业'],
    luckTips: '比劫帮身则竞争得利、朋友相助；比劫夺财则破财、投资失利'
  },
  '专旺格': {
    formation: '日主极旺（身过旺），全局一行与日主同气',
    characteristics: '日主强旺至极，顺其气势而行，专旺格为上等格局',
    strengths: ['气势强旺', '意志坚定', '行动力强', '容易成功', '有独特魅力'],
    weaknesses: ['过于固执', '不听劝告', '可能刚愎自用'],
    suitableCareer: ['创业当老板', '投资', '艺术创作', '行业领袖'],
    avoidCareer: ['按部就班工作', '服从性工作'],
    luckTips: '专旺格宜顺不宜逆，顺势而为则大展宏图；逆势而行则处处受阻'
  },
  '从财格': {
    formation: '日主极弱，财星旺盛，顺从财星气势',
    characteristics: '财运为命局核心，善于理财，物质欲望强',
    strengths: ['财运极佳', '理财有道', '物质充裕', '社交能力强', '善于把握机会'],
    weaknesses: ['依赖心重', '物质主义', '缺乏主见'],
    suitableCareer: ['金融投资', '商业贸易', '企业管理', '销售'],
    avoidCareer: ['学术研究', '清高行业'],
    luckTips: '从财格行运时财运大发；行比劫运则破财伤身'
  },
  '从杀格': {
    formation: '日主极弱，官杀旺盛，顺从官杀气势',
    characteristics: '事业心重，有权力欲望，善于管理，有权威',
    strengths: ['事业心强', '管理能力', '有权威', '执行力强', '易获地位'],
    weaknesses: ['压力过大', '小人是非', '过于追求权力'],
    suitableCareer: ['政府机关', '企业管理', '法律', '金融'],
    avoidCareer: ['自由职业', '清闲行业'],
    luckTips: '从杀格行官杀运则事业腾飞；行食伤运则破败、不顺'
  },
  '从儿格': {
    formation: '日主极弱，食伤旺盛，顺从食伤气势',
    characteristics: '才华横溢，表达能力强，有艺术天分',
    strengths: ['才华出众', '表达力强', '艺术天分', '创意无限', '人缘佳'],
    weaknesses: ['不够稳重', '缺乏耐心', '过于理想化'],
    suitableCareer: ['艺术创作', '演艺表演', '教育培训', '自媒体', '设计'],
    avoidCareer: ['行政管理', '金融投资'],
    luckTips: '从儿格行财运则才华变现、财运亨通；行印运则才华受阻'
  },
  '普通格': {
    formation: '八字格局不明显，需平衡五行流通',
    characteristics: '命局平和，无特殊格局，以中和平衡为贵',
    strengths: ['运势平稳', '起伏不大', '适应性强', '心态平和'],
    weaknesses: ['缺乏突出优势', '成就有限', '中规中矩'],
    suitableCareer: ['稳定职业', '技术岗位', '服务行业'],
    avoidCareer: ['风险过大行业'],
    luckTips: '普通格喜用神得地用则吉；岁运配合好也能有所成就'
  }
};

/**
 * 判断八字格局
 * 正八格：财格、印格、食神格、伤官格、官杀格、劫财格、羊刃格、墓库格
 * 从格：从旺格（专旺）、从财格、从杀格、从儿格（食伤）
 */
export function determineBaziPattern(bazi: BaziResult, bodyStrength: BodyStrength): BaziPattern {
  const dm = bazi.dayMaster;
  const dmElement = bazi.dayMasterElement;
  const ss = bazi.shiShen;
  const monthGod = ss.monthStem;

  // 从格判断
  if (bodyStrength === 'very_strong') {
    const details = PATTERN_DETAILS['专旺格'];
    return {
      type: '从格',
      name: '专旺格',
      description: `日主${dmElement}极旺，不可克制，顺其气势以比劫、印星为用。专旺格为上等格局，主人意志坚定、气势强旺，容易成就大事业。`,
      mainGod: '印星/比劫',
      formation: details.formation,
      characteristics: details.characteristics,
      strengths: details.strengths.join('、'),
      weaknesses: details.weaknesses.join('、'),
      suitableCareer: details.suitableCareer,
      avoidCareer: details.avoidCareer,
      luckTips: details.luckTips
    };
  }
  if (bodyStrength === 'very_weak') {
    // 判断从什么：从财、从杀、从儿（食伤）
    if (['正财', '偏财'].includes(monthGod)) {
      const details = PATTERN_DETAILS['从财格'];
      return {
        type: '从格', name: '从财格',
        description: `日主${dmElement}极弱，财星旺盛，顺从财星气势。财星为用，主人财运极佳、善于理财。`,
        mainGod: '财星',
        formation: details.formation,
        characteristics: details.characteristics,
        strengths: details.strengths.join('、'),
        weaknesses: details.weaknesses.join('、'),
        suitableCareer: details.suitableCareer,
        avoidCareer: details.avoidCareer,
        luckTips: details.luckTips
      };
    }
    if (['正官', '七杀'].includes(monthGod)) {
      const details = PATTERN_DETAILS['从杀格'];
      return {
        type: '从格', name: '从杀格',
        description: `日主${dmElement}极弱，官杀旺而从之。官杀为用，主人事业心强、有管理能力。`,
        mainGod: '官杀',
        formation: details.formation,
        characteristics: details.characteristics,
        strengths: details.strengths.join('、'),
        weaknesses: details.weaknesses.join('、'),
        suitableCareer: details.suitableCareer,
        avoidCareer: details.avoidCareer,
        luckTips: details.luckTips
      };
    }
    if (['食神', '伤官'].includes(monthGod)) {
      const details = PATTERN_DETAILS['从儿格'];
      return {
        type: '从格', name: '从儿格',
        description: `日主${dmElement}极弱，食伤旺而从之。食伤为用，主人才华横溢、表达能力强。`,
        mainGod: '食伤',
        formation: details.formation,
        characteristics: details.characteristics,
        strengths: details.strengths.join('、'),
        weaknesses: details.weaknesses.join('、'),
        suitableCareer: details.suitableCareer,
        avoidCareer: details.avoidCareer,
        luckTips: details.luckTips
      };
    }
    const details = PATTERN_DETAILS['普通格'];
    return {
      type: '从格', name: '从旺格',
      description: `日主${dmElement}极弱，全局无根，从全局之势。`,
      mainGod: '全局',
      formation: details.formation,
      characteristics: details.characteristics,
      strengths: details.strengths.join('、'),
      weaknesses: details.weaknesses.join('、'),
      suitableCareer: details.suitableCareer,
      avoidCareer: details.avoidCareer,
      luckTips: details.luckTips
    };
  }

  // 正八格判断（以月令为主）
  const yearGod = ss.yearStem;

  // 印格
  if (['正印', '偏印'].includes(monthGod)) {
    const details = PATTERN_DETAILS['印格'];
    return {
      type: '正八格', name: '印格',
      description: `月令${monthGod}，${monthGod === '正印' ? '正印为用' : '偏印为用'}。印星主学业、声誉、地位，利于文化、教育、学术发展。`,
      mainGod: '印星',
      subGod: monthGod === '正印' ? '偏印' : '正印',
      formation: details.formation,
      characteristics: details.characteristics,
      strengths: details.strengths.join('、'),
      weaknesses: details.weaknesses.join('、'),
      suitableCareer: details.suitableCareer,
      avoidCareer: details.avoidCareer,
      luckTips: details.luckTips
    };
  }
  // 食神格
  if (monthGod === '食神') {
    const details = PATTERN_DETAILS['食神格'];
    return {
      type: '正八格', name: '食神格',
      description: `月令食神，食神为用。食神主人聪明秀气、福禄深厚财运佳，又称"福神格"。`,
      mainGod: '食神',
      subGod: '伤官',
      formation: details.formation,
      characteristics: details.characteristics,
      strengths: details.strengths.join('、'),
      weaknesses: details.weaknesses.join('、'),
      suitableCareer: details.suitableCareer,
      avoidCareer: details.avoidCareer,
      luckTips: details.luckTips
    };
  }
  // 伤官格
  if (monthGod === '伤官') {
    const details = PATTERN_DETAILS['伤官格'];
    return {
      type: '正八格', name: '伤官格',
      description: `月令伤官，伤官为用。伤官主人才华横溢、敢于创新，但需印制伤官方能大展才华。`,
      mainGod: '伤官',
      subGod: '食神',
      formation: details.formation,
      characteristics: details.characteristics,
      strengths: details.strengths.join('、'),
      weaknesses: details.weaknesses.join('、'),
      suitableCareer: details.suitableCareer,
      avoidCareer: details.avoidCareer,
      luckTips: details.luckTips
    };
  }
  // 官杀格
  if (['正官', '七杀'].includes(monthGod)) {
    const details = PATTERN_DETAILS['官杀格'];
    const godName = monthGod === '正官' ? '正官' : '七杀';
    return {
      type: '正八格', name: '官杀格',
      description: `月令${godName}，官杀为用。官杀主事业、名利、地位，利于仕途发展或管理职位。`,
      mainGod: '官杀',
      subGod: monthGod === '正官' ? '七杀' : '正官',
      formation: details.formation,
      characteristics: details.characteristics,
      strengths: details.strengths.join('、'),
      weaknesses: details.weaknesses.join('、'),
      suitableCareer: details.suitableCareer,
      avoidCareer: details.avoidCareer,
      luckTips: details.luckTips
    };
  }
  // 财格
  if (['正财', '偏财'].includes(monthGod)) {
    const details = PATTERN_DETAILS['财格'];
    const godName = monthGod === '正财' ? '正财' : '偏财';
    return {
      type: '正八格', name: '财格',
      description: `月令${godName}，财星为用。财星主财运、物质，主人善于理财、精明能干。`,
      mainGod: '财星',
      subGod: monthGod === '正财' ? '偏财' : '正财',
      formation: details.formation,
      characteristics: details.characteristics,
      strengths: details.strengths.join('、'),
      weaknesses: details.weaknesses.join('、'),
      suitableCareer: details.suitableCareer,
      avoidCareer: details.avoidCareer,
      luckTips: details.luckTips
    };
  }
  // 比劫格
  if (['比肩', '劫财'].includes(monthGod)) {
    const details = PATTERN_DETAILS['比劫格'];
    return {
      type: '正八格', name: '比劫格',
      description: `月令${monthGod}，比劫为用。比劫主竞争、朋友、自身，利于创业、竞争、求财。`,
      mainGod: '比劫',
      formation: details.formation,
      characteristics: details.characteristics,
      strengths: details.strengths.join('、'),
      weaknesses: details.weaknesses.join('、'),
      suitableCareer: details.suitableCareer,
      avoidCareer: details.avoidCareer,
      luckTips: details.luckTips
    };
  }

  const details = PATTERN_DETAILS['普通格'];
  return {
    type: '正八格', name: '普通格',
    description: '八字格局不明显，以中和平衡为贵。命局平和，无特殊格局限制。',
    mainGod: '日主',
    formation: details.formation,
    characteristics: details.characteristics,
    strengths: details.strengths.join('、'),
    weaknesses: details.weaknesses.join('、'),
    suitableCareer: details.suitableCareer,
    avoidCareer: details.avoidCareer,
    luckTips: details.luckTips
  };
}

// ============================================================
// 大运计算
// ============================================================

export interface DayunResult {
  startYear: number;
  startAge: number;
  direction: '顺行' | '逆行';
  ganZhi: string;
  element: FiveElement;
  favorable: string;
  unfavorable: string;
  description: string;
}

/**
 * 计算大运
 * 顺逆判断：阳干阳支顺行，阴干阴支逆行
 * 大运干支 = 年干/支按出生月令排布，顺着数或逆着数
 * 起运年龄：出生到下一个节气（顺行）或上一个节气（逆行）的天数 ÷ 3 = 月数
 */
export function calculateDayun(
  bazi: BaziResult,
  birthYear: number,
  birthMonth: number,
  birthDay: number,
  gender: 'male' | 'female',
): DayunResult[] {
  const yearGan = bazi.yearPillar[0];
  const monthBranch = bazi.monthPillar[1];
  const dayMasterGan = bazi.dayMaster; // 日干
  const isYangGan = ['甲', '丙', '戊', '庚', '壬'].includes(yearGan);
  const isYangYear = isYangGan;
  const isYangDayMaster = ['甲', '丙', '戊', '庚', '壬'].includes(dayMasterGan);
  
  // 计算起运方向（测测算法：用「日干」阴阳判断，而非年干）
  // 日干阳，男命 -> 顺行；日干阴，男命 -> 逆行
  // 日干阳，女命 -> 逆行；日干阴，女命 -> 顺行
  let isForward: boolean;
  if (gender === 'male') {
    isForward = isYangDayMaster; // 男命：日干阳顺行，日干阴逆行
  } else {
    isForward = !isYangDayMaster; // 女命：日干阴顺行，日干阳逆行
  }
  const direction: '顺行' | '逆行' = isForward ? '顺行' : '逆行';

  // 计算起运年龄：传统命理「起运节气」规则
  // ═══════════════════════════════════════════════════════════
  // 核心规则（经测测实测验证）：
  // N = 出生月支从寅算的步数（寅=0, 卯=1, 辰=2, ..., 酉=7, ..., 丑=11）
  //   即：N = (月支地支序号 - 2 + 12) % 12
  //         地支序号：子=0,丑=1,寅=2,...,亥=11
  //
  // 顺行：从出生月节气（节，非气）往后数第N个节
  //   例：酉月(N=7)，从白露往后第7个节=清明 ✓
  //
  // 逆行：从出生月节气往前数第(N+1)个节
  //   例：寅月(N=0)，从立春往前第1个节=小寒 ✓
  //
  // 起运天数 = |出生日 - 目标节气日|
  // 起运年龄 = 天数 / 36（3天=1月，36天=1年）
  // ═══════════════════════════════════════════════════════════

  // 十二节（每月的「节」，非「气」）顺序
  // 顺序（公历月 -> 节气日期）：
  const JIE_SEQUENCE: Array<{ month: number; day: number; name: string }> = [
    { month: 1, day: 6, name: '小寒' },   // 1月
    { month: 2, day: 4, name: '立春' },   // 2月
    { month: 3, day: 6, name: '惊蛰' },   // 3月
    { month: 4, day: 5, name: '清明' },   // 4月
    { month: 5, day: 6, name: '立夏' },   // 5月
    { month: 6, day: 6, name: '芒种' },   // 6月
    { month: 7, day: 7, name: '小暑' },   // 7月
    { month: 8, day: 8, name: '立秋' },   // 8月
    { month: 9, day: 7, name: '白露' },   // 9月
    { month: 10, day: 8, name: '寒露' },  // 10月
    { month: 11, day: 7, name: '立冬' },  // 11月
    { month: 12, day: 7, name: '大雪' },  // 12月
  ];

  // 获取第i个节气的日期（i从0开始，0=小寒）
  function getJieDate(yearBase: number, jieIndex: number): Date {
    // jieIndex可能超过0-11范围，需要跨年处理
    let normalized = ((jieIndex % 12) + 12) % 12;
    let yearOffset = Math.floor(jieIndex / 12);
    const jie = JIE_SEQUENCE[normalized];
    return new Date(yearBase + yearOffset, jie.month - 1, jie.day);
  }

  // 计算出生月支对应的序号（寅=0, 卯=1, ..., 丑=11）
  // monthBranch 是月柱地支
  // 地支序号：子=0,丑=1,寅=2,...,亥=11
  // 月支月序N = (地支序号 - 2 + 12) % 12
  const monthBranchIdx = EARTHLY_BRANCHES.indexOf(monthBranch); // 0-11
  const monthN = ((monthBranchIdx - 2) + 12) % 12;
  // 寅N=0, 卯N=1, ..., 酉N=7, ..., 丑N=11

  // 找出生月节气的索引
  // 月支 -> 公历月份的对应关系（寅=2,卯=3,辰=4,...丑=1）
  // 节气月份 = (月支地支序号 - 2 + 12) % 12 + 1（公历月）
  // 实际对应：子=11月,丑=12月,寅=1月 → 但节气对应
  // 寅月=2月(立春), 卯月=3月(惊蛰), ..., 酉月=9月(白露), ...
  // 节气顺序（JIE_SEQUENCE下标）对应月支：
  // JIE_SEQUENCE[0]=小寒=丑月(12月), JIE_SEQUENCE[1]=立春=寅月(2月)...
  // 实际：月支寅=JIE_SEQUENCE[1]（立春），月支酉=JIE_SEQUENCE[8]（白露）
  // 月支地支序号(寅=2)对应JIE_SEQUENCE下标：(地支序号-1+12)%12 = (2-1)%12=1 ✓
  // 月支地支序号(酉=9)对应JIE_SEQUENCE下标：(9-1)%12=8 ✓
  // 通用公式：JIE_SEQUENCE下标 = (月支地支序号 - 1 + 12) % 12
  const birthMonthJieIdx = ((monthBranchIdx - 1) + 12) % 12;

  const birthDate = new Date(birthYear, birthMonth - 1, birthDay);

  // 判断出生日是否已越过当月节气（用完整日期对比，不只比较日数）
  // 月支对应节气的公历月份可能与出生公历月份不同（如寅月节气立春在2月，出生可能在3月）
  const birthMonthJie = JIE_SEQUENCE[birthMonthJieIdx];
  // 确定该节气所在年份：节气月份 <= 出生月份 -> 同年；> 出生月份 -> 上一年
  const jieYear = birthMonthJie.month > birthMonth ? birthYear - 1 : birthYear;
  const birthMonthJieDate = new Date(jieYear, birthMonthJie.month - 1, birthMonthJie.day);
  const isAfterThisMonthJie = birthDate >= birthMonthJieDate;

  // birthMonthJieIdx 是当月节气在JIE_SEQUENCE中的「年内序号」(0-11)
  // 但计算时需要知道当月节气相对birthYear年小寒(JIE_SEQUENCE[0])的「绝对偏移量」
  // 小寒在1月，若节气在jieYear(可能=birthYear-1)，则需要加年份偏移
  // 绝对偏移 = birthMonthJieIdx + (jieYear - birthYear) * 12
  const birthMonthJieAbsOffset = birthMonthJieIdx + (jieYear - birthYear) * 12;

  let daysDiff: number;

  if (isForward) {
    // 顺行：从出生月节气往后数第N个节（N=月支从寅算的步数）
    // N=0(寅月)时找下一个节(+1)，N>0时找第N个节
    const steps = (monthN === 0) ? 1 : monthN;
    const targetAbsOffset = birthMonthJieAbsOffset + steps;
    // 根据绝对偏移推算节气年份和序号
    const targetSeqIdx = ((targetAbsOffset % 12) + 12) % 12;
    const targetYearOffset = Math.floor(targetAbsOffset / 12);
    const targetJie = JIE_SEQUENCE[targetSeqIdx];
    const targetJieDate = new Date(birthYear + targetYearOffset, targetJie.month - 1, targetJie.day);
    daysDiff = Math.round((targetJieDate.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24));
  } else {
    // 逆行：从出生月节气往前数第(N+1)个节
    const steps = monthN + 1;
    const targetAbsOffset = birthMonthJieAbsOffset - steps;
    const targetSeqIdx = ((targetAbsOffset % 12) + 12) % 12;
    const targetYearOffset = Math.floor(targetAbsOffset / 12);
    const targetJie = JIE_SEQUENCE[targetSeqIdx];
    const targetJieDate = new Date(birthYear + targetYearOffset, targetJie.month - 1, targetJie.day);
    daysDiff = Math.round((birthDate.getTime() - targetJieDate.getTime()) / (1000 * 60 * 60 * 24));
  }

  daysDiff = Math.abs(daysDiff);

  // 起运年龄 = 天数 ÷ 36（3天=1月，12月=1年，3×12=36天=1年）
  const qiyunMonths = Math.floor(daysDiff / 3);
  const qiyunAge = qiyunMonths / 12;

  // 月令地支在地支中的位置（0=子, 1=丑, ...11=亥）
  const monthIdx = EARTHLY_BRANCHES.indexOf(monthBranch);

    // 大运干：以日干为起点，顺着天干顺序数（顺行）或逆着数（逆行）
    // 大运支：以月令地支为起点，顺着地支顺序数（顺行）或逆着数（逆行）
    // 动态计算大运步数，确保覆盖到100岁
    const maxAge = 100;
    const dayunCount = Math.max(8, Math.ceil((maxAge - Math.floor(qiyunAge)) / 10));
    const results: DayunResult[] = [];

    for (let i = 1; i <= dayunCount; i++) {
      // 如果该步的起始年龄已超过100岁，不再计算
      if (Math.floor(qiyunAge) + (i - 1) * 10 > maxAge) break;
      // 大运地支偏移：以月令地支为起点
      const branchOffset = isForward ? i : -i;
      const targetIdx = ((monthIdx + branchOffset) % 12 + 12) % 12;
      const dayunBranch = EARTHLY_BRANCHES[targetIdx];

      // 大运天干：以月干为起点（正确规则），顺行或逆行
      // 传统大运：从出生月的月干开始，顺行（男阳/女阴）或逆行（男阴/女阳）
      const monthStemIdx = HEAVENLY_STEMS.indexOf(bazi.monthPillar[0]);
      const stemOffset = isForward ? i : -i;
      const dayunStemIdx = ((monthStemIdx + stemOffset) % 10 + 10) % 10;
      const dayunStem = HEAVENLY_STEMS[dayunStemIdx];

    const dayunGanZhi = dayunStem + dayunBranch;
    const dayunElement = STEM_ELEMENTS[dayunStem];
    
    // 大运开始年龄 = 起运年龄 + (i-1) * 10
    const startAge = Math.round((qiyunAge + (i - 1) * 10) * 10) / 10;
    // 大运开始年份 = 出生年份 + 起运月数/12 + (i-1) * 10
    // 修正：使用 Math.floor 确保整数年份
    const startYear = birthYear + Math.floor(qiyunMonths / 12) + (i - 1) * 10;

    // 判断该大运的喜忌（简化版：根据日主强弱判断）
    const dmElement = bazi.dayMasterElement;
    const ingElement = ING_ELEMENTS[dmElement];
    const isFavorable = [dmElement, ingElement].includes(dayunElement);

    results.push({
      startYear: startYear,
      startAge: startAge,
      direction,
      ganZhi: dayunGanZhi,
      element: dayunElement,
      favorable: isFavorable ? '用神' : '忌神',
      unfavorable: isFavorable ? '忌神' : '用神',
      description: `大运${dayunGanZhi}（${dayunElement === 'wood' ? '木' : dayunElement === 'fire' ? '火' : dayunElement === 'earth' ? '土' : dayunElement === 'metal' ? '金' : '水'}运），${isFavorable ? '有利于命主' : '需谨慎行事'}`,
    });
  }

  return results;
}

// ============================================================
// 流日运势计算
// ============================================================

export interface DailyFortuneResult {
  // 今日干支
  dayGanZhi: string;
  dayGan: string;
  dayZhi: string;
  dayElement: FiveElement;
  // 流日与日主的关系
  dayRelation: string;       // 流日天干与日主的关系（比肩/劫财/食神/伤官/正财/偏财/正官/七杀/正印/偏印）
  relationDescription: string;
  // 运势评分
  totalScore: number;        // 综合运势 0-100
  totalLabel: string;        // 大吉/吉/小吉/平/小凶/凶
  careerScore: number;       // 事业运势
  wealthScore: number;       // 财运
  loveScore: number;         // 感情运势
  healthScore: number;       // 健康运势
  // 今日建议
  mainTip: string;           // 今日运势总提示
  goodThings: string[];      // 今日宜做事项
  avoidThings: string[];     // 今日不宜事项
  luckyColor: { name: string; hex: string };  // 幸运颜色
  luckyNumber: number;       // 幸运数字
  luckyTime: string;         // 幸运时辰
  luckyDirection: string;    // 幸运方位
  avoidDirection: string;    // 避免方位
  // 五行养生
  healthTip: string;         // 健康养生提示
}

/**
 * 获取当前日期的流日干支
 */
export function getCurrentDayGanZhi(): { ganZhi: string; gan: string; zhi: string; element: FiveElement } {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  
  // 使用 calculateDayPillar 计算日柱
  const dayGanZhi = calculateDayPillar(year, month, day);
  const gan = dayGanZhi[0];
  const zhi = dayGanZhi[1];
  const element = STEM_ELEMENTS[gan];
  
  return { ganZhi: dayGanZhi, gan, zhi, element };
}

/**
 * 计算流日与命盘的关系强度
 */
function calculateDayRelationScore(
  bazi: BaziResult,
  dayGan: string,
  dayZhi: string,
): { score: number; label: string; description: string } {
  const dm = bazi.dayMaster;
  const dmElement = bazi.dayMasterElement;
  const dayElement = STEM_ELEMENTS[dayGan];
  
  // 计算流日天干与日主的关系
  const shiShen = calculateShiShen(dm, dayGan);
  
  // 十神与运势关系评分
  const shishenScoreMap: Record<string, { score: number; label: string; desc: string }> = {
    '比肩': { score: 5, label: '比肩', desc: '今日与日主同为比肩，运势平稳，宜低调行事、稳中求进。' },
    '劫财': { score: -3, label: '劫财', desc: '今日流年天干为劫财，需防破财小人，忌投资冒险。' },
    '食神': { score: 12, label: '食神', desc: '今日食神吐秀，才华发挥，财运与创作运佳，宜展示才华。' },
    '伤官': { score: 8, label: '伤官', desc: '今日伤官主创新变革，思维活跃，利于表达与创作。' },
    '正财': { score: 10, label: '正财', desc: '今日正财入库，财运稳定上升，宜积累理财，忌投机。' },
    '偏财': { score: 6, label: '偏财', desc: '今日偏财星动，财运流通，利于贸易投资，但需防风险。' },
    '正官': { score: 10, label: '正官', desc: '今日正官护身，运势亨通，利事业进展，贵人多助。' },
    '七杀': { score: -5, label: '七杀', desc: '今日七杀攻身，压力增大，宜静不宜动，谨防小人是非。' },
    '正印': { score: 8, label: '正印', desc: '今日正印生身，贵人扶持，利学业考试，宜学习进修。' },
    '偏印': { score: 3, label: '偏印', desc: '今日偏印夺食，需防压力与阻滞，宜耐心等待时机。' },
  };
  
  const shishen = shishenScoreMap[shiShen] || shishenScoreMap['比肩'];
  
  // 计算流日地支对命局的影响
  // 地支藏干分析
  const dayZhiHidden = BRANCH_HIDDEN_STEMS[dayZhi] || [];
  let zhiBonus = 0;
  let zhiDesc = '';
  
  // 检查流日地支是否含有日主五行或生助日主的五行
  for (const hidden of dayZhiHidden) {
    const hiddenElement = STEM_ELEMENTS[hidden.stem];
    if (hiddenElement === dmElement) {
      zhiBonus += 3;
      zhiDesc += `${dayZhi}中含${hidden.stem}与日主同气，`;
    } else if (ING_ELEMENTS[dmElement] === hiddenElement) {
      zhiBonus += 2;
      zhiDesc += `${dayZhi}中含${hidden.stem}生助日主，`;
    }
  }
  
  const totalScore = shishen.score + zhiBonus;
  
  return {
    score: totalScore,
    label: shishen.label,
    description: shishen.desc + zhiDesc,
  };
}

/**
 * 计算今日运势
 */
export function calculateDailyFortune(bazi: BaziResult): DailyFortuneResult {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  
  // 获取今日干支
  const today = getCurrentDayGanZhi();
  
  // 计算流日与命盘的关系
  const relation = calculateDayRelationScore(bazi, today.gan, today.zhi);
  
  // 获取命局基本信息
  const dmElement = bazi.dayMasterElement;
  const favorable = determineFavorableElements(bazi, month, calculateFiveElements(bazi));
  const fiveEls = calculateFiveElements(bazi);
  
  // 计算综合运势评分
  // 基础分 50 + 流日关系分 + 喜用神加成/忌神扣减
  let baseScore = 50;
  baseScore += relation.score;
  
  // 喜用神加分（如果流日天干是喜用神）
  if (favorable.favorable.includes(dmElement) && STEM_ELEMENTS[today.gan] === dmElement) {
    baseScore += 8;
  }
  // 忌神扣分
  if (favorable.unfavorable.includes(STEM_ELEMENTS[today.gan])) {
    baseScore -= 5;
  }
  
  // 五行平衡影响
  const maxEl = Math.max(...Object.values(fiveEls).map(Number), 0);
  const minEl = Math.min(...Object.values(fiveEls).map(Number), 0);
  const balance = maxEl - minEl;
  if (balance > 4) {
    // 五行严重不平衡，流日若能补齐则加分
    const todayEl = STEM_ELEMENTS[today.gan];
    if (todayEl === dmElement || ING_ELEMENTS[dmElement] === todayEl) {
      baseScore += 5;
    }
  }
  
  // 限制在 20-100 范围内
  const totalScore = Math.min(100, Math.max(20, Math.round(baseScore)));
  
  // 各维度运势
  const careerScore = Math.min(100, Math.max(20, totalScore + (relation.score > 0 ? 5 : -3)));
  const wealthScore = Math.min(100, Math.max(20, totalScore + (['正财', '偏财', '食神'].includes(relation.label) ? 8 : -4)));
  const loveScore = Math.min(100, Math.max(20, totalScore + (['正官', '七杀', '伤官'].includes(relation.label) ? 5 : -2)));
  const healthScore = Math.min(100, Math.max(20, totalScore - Math.round(balance * 1.5)));
  
  // 运势等级标签
  const getScoreLabel = (score: number): string => {
    if (score >= 85) return '大吉';
    if (score >= 70) return '吉';
    if (score >= 55) return '小吉';
    if (score >= 45) return '平';
    if (score >= 30) return '小凶';
    return '凶';
  };
  
  // 幸运颜色（基于流日天干五行）
  const luckyColorMap: Record<string, { name: string; hex: string }> = {
    wood: { name: '青绿色', hex: '#00C47A' },
    fire: { name: '朱红色', hex: '#FF6B6B' },
    earth: { name: '黄棕色', hex: '#D4A000' },
    metal: { name: '银白色', hex: '#7B8FA8' },
    water: { name: '深蓝色', hex: '#00A8E8' },
  };
  const luckyColor = luckyColorMap[today.element] || luckyColorMap.wood;
  
  // 幸运数字（基于流日地支）
  const luckyNumberMap: Record<string, number[]> = {
    '子': [1, 6], '丑': [2, 5], '寅': [3, 8], '卯': [4, 9],
    '辰': [5, 0], '巳': [6, 1], '午': [7, 2], '未': [8, 3],
    '申': [9, 4], '酉': [0, 5], '戌': [1, 6], '亥': [2, 7],
  };
  const luckyNums = luckyNumberMap[today.zhi] || [1, 6];
  const luckyNumber = luckyNums[(day + dmElement.length) % luckyNums.length];
  
  // 幸运时辰（基于日主五行）
  const timeMap: Record<number, string> = {
    0: '子时', 1: '丑时', 2: '寅时', 3: '卯时',
    4: '辰时', 5: '巳时', 6: '午时', 7: '未时',
    8: '申时', 9: '酉时', 10: '戌时', 11: '亥时',
  };
  const favHours: Record<string, number[]> = {
    wood: [2, 3, 4, 5], fire: [6, 7, 10, 11], earth: [0, 1, 8, 9],
    metal: [4, 5, 8, 9], water: [0, 1, 2, 3],
  };
  const fh = favHours[dmElement] || [1, 6];
  const luckyTime = `${timeMap[fh[0]]}·${timeMap[fh[1]]}`;
  
  // 方位（基于日主五行）
  const dirMap: Record<string, { lucky: string; avoid: string }> = {
    wood: { lucky: '东·北', avoid: '西南' },
    fire: { lucky: '南·东', avoid: '西北' },
    earth: { lucky: '东北·西南', avoid: '正东' },
    metal: { lucky: '西·西北', avoid: '正东' },
    water: { lucky: '北·西', avoid: '正南' },
  };
  const { lucky: luckyDirection, avoid: avoidDirection } = dirMap[dmElement] || dirMap.wood;
  
  // 今日总提示
  const tipMap: Record<string, string> = {
    wood: relation.score > 0 ? '今日木气相助，运势上扬，创造力与表达能力突出，宜大胆表达想法、推进项目。' : '今日运势平稳，木气受制，宜低调行事、稳中求进，避免激进决策。',
    fire: relation.score > 0 ? '今日火势上扬，竞争动力强，运势旺盛，宜主动出击、展示实力，但需注意控制情绪。' : '今日火气被制，运势平缓，宜静待时机，忌冲动行事。',
    earth: relation.score > 0 ? '今日土气相助，运势稳定上升，宜稳扎稳打、处理积累事务，财运稳中有进。' : '今日土气受制，运势略显低迷，宜保守行事，忌投机冒险。',
    metal: relation.score > 0 ? '今日金气清朗，决策判断力强，运势极佳，宜处理重要事项、利谈判签约。' : '今日金气被制，运势受阻，忌强出头，谨防口舌是非。',
    water: relation.score > 0 ? '今日水气流通，人脉与信息运势佳，财运流通性强，宜沟通协调、贸易往来。' : '今日水气受制，运势略显阻滞，忌过度奔波，宜静心休养。',
  };
  const mainTip = tipMap[dmElement] || tipMap.wood;
  
  // 宜做事项（根据流日关系调整）
  const goodThingsMap: Record<string, string[]> = {
    wood: ['文化创作', '互联网科技', '出版传媒', '创意表达', '学习进修'],
    fire: ['销售推广', '演讲展示', '法律诉讼', '市场竞争', '宴会聚会'],
    earth: ['建筑工程', '房地产', '农业种植', '管理决策', '仓储物流'],
    metal: ['金融投资', '科技创新', '法律合约', '外交谈判', '金属加工'],
    water: ['贸易流通', '物流运输', '媒体传播', '教育咨询', '旅游出行'],
  };
  
  // 不宜事项
  const avoidThingsMap: Record<string, string[]> = {
    wood: ['冒险投机', '过度竞争', '激烈运动', '晚睡熬夜'],
    fire: ['高风险投资', '过度饮酒', '剧烈运动', '冲动决策'],
    earth: ['投机取巧', '频繁变动', '冒险投资', '暴饮暴食'],
    metal: ['投资冒险', '过度消极', '冷战沉默', '肖小是非'],
    water: ['高风险投资', '过度奔波', '冒险激进', '过度放纵'],
  };
  
  // 根据流日关系微调
  let goodThings = goodThingsMap[dmElement] || goodThingsMap.wood;
  let avoidThings = avoidThingsMap[dmElement] || avoidThingsMap.wood;
  
  if (relation.label === '食神') {
    goodThings = ['美食餐饮', '创作设计', '才艺展示', '演讲表达', ...goodThings];
  } else if (relation.label === '正官') {
    goodThings = ['职场晋升', '签订合同', '贵人拜访', '会议洽谈', ...goodThings];
  } else if (relation.label === '七杀') {
    avoidThings = ['冲突对抗', '冒险激进', '签约合作', '重大决策', ...avoidThings];
  } else if (relation.label === '劫财') {
    avoidThings = ['财务投资', '借钱借物', '合作签约', '高消费', ...avoidThings];
  }
  
  // 健康养生提示
  const healthTips: Record<string, string> = {
    wood: '注意肝胆、神经系统、情绪调节，保持充足睡眠，忌熬夜伤身。',
    fire: '注意心脏、血液循环、眼睛健康，保持心态平和，忌情绪激动。',
    earth: '注意脾胃消化、饮食规律，保持适量运动，忌暴饮暴食。',
    metal: '注意肺部呼吸系统、骨骼牙齿健康，保持呼吸顺畅，忌吸烟饮酒。',
    water: '注意肾脏泌尿系统、耳力听力，冬季防寒保暖，忌过度劳累。',
  };
  const healthTip = healthTips[dmElement] || healthTips.wood;
  
  return {
    dayGanZhi: today.ganZhi,
    dayGan: today.gan,
    dayZhi: today.zhi,
    dayElement: today.element,
    dayRelation: relation.label,
    relationDescription: relation.description,
    totalScore,
    totalLabel: getScoreLabel(totalScore),
    careerScore: Math.min(100, Math.max(20, careerScore)),
    wealthScore: Math.min(100, Math.max(20, wealthScore)),
    loveScore: Math.min(100, Math.max(20, loveScore)),
    healthScore: Math.min(100, Math.max(20, healthScore)),
    mainTip,
    goodThings,
    avoidThings,
    luckyColor,
    luckyNumber,
    luckyTime,
    luckyDirection,
    avoidDirection,
    healthTip,
  };
}
