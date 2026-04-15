// 共享类型定义
export type FiveElement = 'wood' | 'fire' | 'earth' | 'metal' | 'water';
export type LanguageStyle = 'normal' | 'stock' | 'game' | 'fairytale' | 'fortune' | 'workplace';
export type BodyStrengthType = 'strong' | 'weak' | 'neutral';
export type BraceletScene = 'study' | 'work' | 'love' | 'wealth' | 'health' | 'social' | 'travel';

export interface BraceletSceneInfo {
  scene: BraceletScene;
  name: string;
  reason: string;
}

export interface BodyStrengthInfo {
  type: BodyStrengthType;
  strategy: {
    primaryAdvice: string;
    secondaryAdvice: string;
    avoidAdvice: string;
  };
  description: string;
}

export interface FiveElementsAnalysis {
  wood: number;
  fire: number;
  earth: number;
  metal: number;
  water: number;
}

export interface Pillar {
  stem: string;
  branch: string;
}

export interface BaziResult {
  yearStem: string; yearBranch: string;
  monthStem: string; monthBranch: string;
  dayStem: string; dayBranch: string;
  hourStem: string; hourBranch: string;
  dayMaster: string;
  dayMasterElement: string;
  shiShen: { year: string; month: string; day: string; hour: string };
  trueSolarTime?: string;
  // 兼容对象访问方式
  yearPillar?: Pillar;
  monthPillar?: Pillar;
  dayPillar?: Pillar;
  hourPillar?: Pillar;
}

export interface UserBirthInfoListItem {
  id: string;
  name: string;
  birthYear: number;
  birthMonth: number;
  birthDay: number;
  birthHour: number;
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
}

export interface BraceletItem {
  name: string;
  material: string;
  color: string;
  element: FiveElement;
  effect: string;
  image: string;
  images?: string[];
  whyRecommended?: string;
  benefits?: string[];
  usageTips?: string[];
  knowledge?: string;
  energyLevel?: string;
  origin?: string;
  suitableScenes?: BraceletSceneInfo[];
  sceneAdvice?: string;
}

export interface BraceletRecommendation {
  primaryBracelet: BraceletItem;
  secondaryBracelets: BraceletItem[];
  notes: string[];
  matchingPrinciple?: string;
  elementKnowledge?: { title: string; content: string };
  userAnalysis?: string;
  flowDay?: any;
  bodyStrength?: BodyStrengthInfo;
  xiYongAnalysis?: {
    favorableAnalysis: {
      count: number;
      percentage: number;
      elements: { element: FiveElement; name: string; percentage: number }[];
    };
    unfavorableAnalysis: {
      count: number;
      percentage: number;
      elements: { element: FiveElement; name: string; percentage: number }[];
    };
    tiaohouElement?: FiveElement;
    tiaohouAnalysis?: string;
    strengthRelation?: {
      bodyStrength: BodyStrengthType;
      bodyStrengthName: string;
      strategy: {
        name: string;
        description: string;
        recommendedElement: FiveElement;
        recommendedElementName: string;
        avoidElement?: FiveElement | null;
        avoidElementName?: string | null;
      };
      summary: string;
      overallJudgment?: string;
      braceletPrinciple?: string;
    };
  };
  summary?: Record<string, any>;
}

export interface OutfitRecommendation {
  primaryColor: string;
  secondaryColor: string;
  avoidColor: string;
  primaryDesc: string;
  secondaryDesc: string;
  avoidDesc: string;
  primaryColors: string[];
  secondaryColors: string[];
  avoidColors: string[];
  styleSuggestion?: string;
  materialSuggestion?: string;
  outfitPlans?: Array<{ title: string; desc: string; items: string[]; color: string }>;
  todayFortune?: { goodThings: string[]; precautions: string[] };
  outfits?: Array<{ title: string; desc: string; items: string[]; color: string }>;
}
