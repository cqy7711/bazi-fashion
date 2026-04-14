// 共享类型定义
export type LanguageStyle = 'normal' | 'stock' | 'game' | 'fairytale' | 'fortune' | 'workplace';

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

export interface BraceletRecommendation {
  matchingPrinciple?: string;
  primaryBracelet?: {
    material: string;
    style: string;
    stones: string[];
    occasions: string[];
  };
  recommendations?: Array<{
    material: string;
    style: string;
    colorDesc: string;
    stones: string[];
    occasions: string[];
  }>;
}
