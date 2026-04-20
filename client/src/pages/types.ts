// 本地类型定义 - 从 shared 重新导出
// 用于 HomePage 等页面

export type LanguageStyle = 'normal' | 'stock' | 'game' | 'fairytale' | 'fortune' | 'workplace';

export interface FiveElementsAnalysis {
  wood: number;
  fire: number;
  earth: number;
  metal: number;
  water: number;
}

export interface BaziResult {
  yearStem: string; yearBranch: string;
  monthStem: string; monthBranch: string;
  dayStem: string; dayBranch: string;
  hourStem: string; hourBranch: string;
  dayMaster: string;
  dayMasterElement: string;
  shiShen: { year: string; month: string; day: string; hour: string };
}

export interface UserBirthInfoListItem {
  id: string;
  name: string;
  birthYear: number; birthMonth: number; birthDay: number; birthHour: number;
  gender: 'male' | 'female';
  calendarType: 'solar' | 'lunar';
  languageStyle?: LanguageStyle;
  birthLocation?: string;
  favorableElements?: string[];
  unfavorableElements?: string[];
}

export interface UserBirthInfo extends UserBirthInfoListItem {
  baziResult?: BaziResult;
  fiveElements?: FiveElementsAnalysis;
  bodyStrengthScore?: number;
  pattern?: {
    type: string;
    name: string;
    description?: string;
    mainGod?: string;
    subGod?: string;
    formation?: string;
    characteristics?: string;
    strengths?: string;
    weaknesses?: string;
    suitableCareer?: string[];
    avoidCareer?: string[];
    luckTips?: string;
  };
}

export interface OutfitRecommendation {
  primaryColor: string; secondaryColor: string; avoidColor: string;
  primaryDesc: string; secondaryDesc: string; avoidDesc: string;
  primaryColors: any[]; secondaryColors: any[]; avoidColors: any[];
  styleSuggestion?: string; materialSuggestion?: string;
  outfitPlans?: Array<{ title: string; desc: string; items: string[]; color: string }>;
  todayFortune?: { goodThings: string[]; precautions: string[] };
  outfits: Array<{ title: string; desc: string; items: string[]; color: string }>;
  // 新增字段
  weatherInfo?: {
    city: string;
    weather: string;
    temperature: number;
    humidity: number;
    element: string;
    description: string;
  };
  weatherBasedColors?: any[];
  outfitImages?: Array<{
    url: string;
    title: string;
    description: string;
    colors: string[];
    style: string;
  }>;
  liuriFortune?: {
    element: string;
    relation: string;
    boost: number;
    description: string;
  };
}

export interface BraceletSceneInfo {
  scene: string;
  name: string;
  reason: string;
}

export interface BodyStrengthInfo {
  type: string;
  strategy: {
    primaryAdvice: string;
    secondaryAdvice: string;
    avoidAdvice: string;
  };
  description: string;
}

export interface BraceletRecommendation {
  matchingPrinciple?: string;
  notes?: string[];
  primaryBracelet?: {
    name: string;
    material: string;
    color: string;
    element: string;
    effect: string;
    image: string;
    images?: string[];
    whyRecommended?: string;
    benefits?: string[];
    usageTips?: string[];
    knowledge?: string;
    energyLevel?: string;
    suitableScenes?: BraceletSceneInfo[];
    sceneAdvice?: string;
  };
  secondaryBracelets?: Array<{
    name: string;
    material: string;
    color: string;
    element: string;
    effect: string;
    image: string;
    images?: string[];
    whyRecommended?: string;
    benefits?: string[];
    usageTips?: string[];
    knowledge?: string;
    energyLevel?: string;
    suitableScenes?: BraceletSceneInfo[];
    sceneAdvice?: string;
  }>;
  bodyStrength?: BodyStrengthInfo;
  
  // ========== 新增：喜用神忌用神详细分析 ==========
  xiYongAnalysis?: {
    favorableAnalysis: {
      count: number;
      percentage: number;
      elements: Array<{ element: string; name: string; percentage: number }>;
      description: string;
    };
    unfavorableAnalysis: {
      count: number;
      percentage: number;
      elements: Array<{ element: string; name: string; percentage: number }>;
      description: string;
    };
    strengthRelation: {
      bodyStrength: string;
      bodyStrengthName: string;
      strategy: {
        name: string;
        description: string;
        recommendedElement: string;
        recommendedElementName: string;
        avoidElement: string | null;
        avoidElementName: string | null;
      };
      overallJudgment: string;
      braceletPrinciple: string;
    };
  };
  
  // 新增详细总结信息
  summary?: {
    wuxingDiagram?: {
      primary: string;
      primaryName: string;
      secondaryName: string;
      sheng: string;
      ke: string;
      shengDesc: string;
      keDesc: string;
    };
    fortuneScores?: {
      career: number;
      wealth: number;
      love: number;
      health: number;
      social: number;
      study: number;
    };
    scenePriority?: Record<string, { score: number; icon: string; desc: string }>;
    bodyStrengthStatus?: string;
    tenGod?: string;
    favorableElement?: string;
    favorableElementName?: string;
    secondaryElement?: string;
    secondaryElementName?: string;
    fortuneLevel?: string;
    overallAdvice?: string;
    wearingTips?: string;
  };
}

// 今日运势类型（从 API 获取）
export interface DailyFortune {
  dayGanZhi: string;       // 今日干支
  dayGan: string;          // 今日天干
  dayZhi: string;          // 今日地支
  dayElement: string;      // 今日五行
  dayRelation: string;     // 流日与日主关系
  relationDescription: string;
  totalScore: number;      // 综合运势 0-100
  totalLabel: string;      // 大吉/吉/小吉/平/小凶/凶
  careerScore: number;     // 事业运势
  wealthScore: number;     // 财运
  loveScore: number;      // 感情运势
  healthScore: number;     // 健康运势
  socialScore?: number;    // 人际运势(新增)
  studyScore?: number;     // 学习/专注运势(新增)
  mainTip: string;         // 今日运势总提示
  goodThings: string[];    // 今日宜做事项
  avoidThings: string[];   // 今日不宜事项
  luckyColor: { name: string; hex: string };  // 幸运颜色
  luckyNumber: number;     // 幸运数字
  luckyTime: string;       // 幸运时辰
  luckyDirection: string;  // 幸运方位
  avoidDirection: string;  // 避免方位
  healthTip: string;       // 健康养生提示
}
