export type FiveElement = 'wood' | 'fire' | 'earth' | 'metal' | 'water';

export type LanguageStyle = 'normal' | 'stock' | 'game' | 'fairytale' | 'fortune' | 'workplace';

export type TenGod = '比肩' | '劫财' | '食神' | '伤官' | '偏财' | '正财' | '七杀' | '正官' | '偏印' | '正印';

export type BodyStrength = 'very_strong' | 'strong' | 'wang' | 'neutral' | 'weak' | 'shuai' | 'very_weak';

export type ShiShen = {
  yearStem: TenGod;
  yearBranch: TenGod;
  monthStem: TenGod;
  monthBranch: TenGod;
  dayBranch: TenGod;
  hourStem: TenGod;
  hourBranch: TenGod;
};

export type TrueSolarTime = {
  hour: number;
  minute: number;
  offsetMinutes: number;
  longitude: number | null;
  description: string;
  beijingHour: number;
};

export type BaziResult = {
  yearPillar: string;
  monthPillar: string;
  dayPillar: string;
  hourPillar: string;
  dayMaster: string;
  dayMasterElement: FiveElement;
  shiShen: ShiShen;
  trueSolarTime: TrueSolarTime;
};

export type FiveElementsDistribution = {
  wood: number;
  fire: number;
  earth: number;
  metal: number;
  water: number;
};

export type UserBirthInfo = {
  id: string;
  name: string;
  birthYear: number;
  birthMonth: number;
  birthDay: number;
  birthHour: number;
  gender: 'male' | 'female';
  calendarType: 'solar' | 'lunar';
  languageStyle: LanguageStyle;
  birthLocation?: string;
  baziResult?: BaziResult;
  fiveElements?: FiveElementsDistribution;
  favorableElements?: FiveElement[];
  unfavorableElements?: FiveElement[];
};

export type UserBirthInfoListItem = Omit<UserBirthInfo, 'baziResult' | 'fiveElements' | 'unfavorableElements'>;

export type GetUserBirthInfoListResponse = {
  items: UserBirthInfoListItem[];
  currentId: string | null;
};

export type CreateUserBirthInfoRequest = {
  name?: string;
  birthYear: number;
  birthMonth: number;
  birthDay: number;
  birthHour: number;
  gender: 'male' | 'female';
  calendarType: 'solar' | 'lunar';
  languageStyle: LanguageStyle;
  birthLocation?: string;
};

export type UpdateUserBirthInfoRequest = Partial<CreateUserBirthInfoRequest & { name: string }>;

export type ColorRecommendation = {
  color: string;
  element: FiveElement;
  description: string;
};

export type OutfitPlan = {
  element: FiveElement;
  title: string;
  colors: ColorRecommendation[];
  explanation: string;
  suitableOccasions: string[];
  avoidOccasions: string[];
  styleTips: string;
  accessorySuggestions: string[];
};

export type TodayFortune = {
  goodThings: string[];
  precautions: string[];
  luckyElements: FiveElement[];
  unluckyElements: FiveElement[];
};

export type LiuriAnalysis = {
  yearPillar: string;
  monthPillar: string;
  dayPillar: string;
  dayElement: FiveElement;
  dayShiShen: string;
  dayRelation: string;
  favorableBoost: boolean;
  conflictElement?: FiveElement;
  yearRelation: string;
  monthRelation: string;
};

export type BaziSummary = {
  dayMaster: string;
  dayMasterElement: FiveElement;
  favorableElements: FiveElement[];
  unfavorableElements: FiveElement[];
  bodyStrength: string;
  analysis: string;
};

export type OutfitRecommendation = {
  primaryColors: ColorRecommendation[];
  secondaryColors: ColorRecommendation[];
  avoidColors: ColorRecommendation[];
  styleSuggestion: string;
  materialSuggestion: string;
  todayFortune: TodayFortune;
  liuriAnalysis: LiuriAnalysis;
  outfitPlans: OutfitPlan[];
  baziSummary?: BaziSummary;
  dressingPrinciples?: string[];
};

export type BraceletScene = 'study' | 'work' | 'love' | 'wealth' | 'health' | 'social' | 'travel';

export type BraceletSceneInfo = {
  scene: BraceletScene;
  name: string;
  reason: string;
};

export type BodyStrengthType = 'strong' | 'weak' | 'neutral';

export type BodyStrengthInfo = {
  type: BodyStrengthType;
  strategy: {
    primaryAdvice: string;
    secondaryAdvice: string;
    avoidAdvice: string;
  };
  description: string;
};

export type BraceletItem = {
  name: string;
  material: string;
  color: string;
  element: FiveElement;
  effect: string;
  image: string;
  images?: string[];  // 多张图片数组
  whyRecommended?: string;
  benefits?: string[];
  usageTips?: string[];
  knowledge?: string;
  energyLevel?: string;
  origin?: string;
  suitableScenes?: BraceletSceneInfo[];  // 适合场景列表
  sceneAdvice?: string;  // 根据流日给出的场景建议
};

export type BraceletRecommendation = {
  primaryBracelet: BraceletItem;
  secondaryBracelets: BraceletItem[];
  notes: string[];
  matchingPrinciple?: string;
  elementKnowledge?: { title: string; content: string };
  userAnalysis?: string;
  flowDay?: any;
  bodyStrength?: BodyStrengthInfo;
};

export type FiveElementsAnalysis = {
  fiveElementDistribution: { element: FiveElement; count: number; proportion: number }[];
  bodyStrengthAnalysis: {
    isDeLing: boolean;
    deLingStatus: string;
    bodyStrength: BodyStrength;
    bodyStrengthText: string;
    totalScore: number;
    deLingScore: number;
    rootScore: number;
    branchSupportScore: number;
    exposureScore: number;
    rootDetails: string[];
    branchSupportDetails: string[];
    exposureDetails: string[];
  };
  favorableAnalysis: {
    method: string;
    methodName: string;
    favorable: FiveElement[];
    unfavorable: FiveElement[];
    explanation: string;
    tiaohouElement?: FiveElement;
  };
  wangShuaiAnalysis: string;
  favorableDescription: string;
  unfavorableDescription: string;
  generalInterpretation: string;
};

export type DayunYearlyItem = {
  year: number;
  age: number;
  ganZhi: string;
  element: FiveElement;
  score: number;
  family: number;
  career: number;
  health: number;
  wealth: number;
  summary: string;
};

export type DayunItem = {
  age: number;
  endAge: number;
  startYear: number;
  endYear: number;
  startAge: number;
  ganZhi: string;
  element: FiveElement;
  score: number;
  open: number;
  close: number;
  high: number;
  low: number;
  description: string;
};

export type Consumption = {
  id: string;
  productType: PaymentProductType;
  quantity: number;
  remaining: number;
  orderId: string;
  validUntil: string | null;
  createdAt: string;
};

export type ConsumptionResponse = {
  consumptions: Consumption[];
  aiChatRemaining: number;
  baziAnalysisUnlocked: boolean;
  outfitPremiumValidUntil: string | null;
  braceletPremiumValidUntil: string | null;
  yearlyFortuneValidUntil: string | null;
};

export type PaymentProductType =
  | 'bazi_analysis'
  | 'outfit_premium'
  | 'bracelet_premium'
  | 'yearly_fortune'
  | 'ai_chat_10';

export type OutfitImage = {
  url: string;
  title: string;
  description: string;
  colors: string[];
  style: string;
  scene: 'work' | 'casual' | 'party' | 'festival';
  top: string;
  bottom: string;
  accessories: string[];
  material: string;
  dress?: string;
};
