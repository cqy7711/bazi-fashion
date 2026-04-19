import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MOTION_TOKENS } from '../theme/designTokens';
import { 
  Loader2, Shirt, Gem, Plus, Sparkles, Star, TrendingUp, ArrowRight, MapPin, RefreshCw,
  Search, Navigation, Briefcase, PartyPopper, Gift, Watch, Crown, Sun, Cloud, CloudRain,
  Droplets, Leaf, Flame, Mountain, Snowflake, Wind, ShirtIcon, WatchIcon, Sparkle,
  CircleDot, ChevronDown, ChevronUp, X, Lightbulb, TrendingUpIcon, Heart, Zap, Apple,
  Compass, Clock, Edit3, Palette, Circle, Check, Trash2, Calendar,
  Users, BookOpen, Moon, Activity
} from 'lucide-react';
import type { UserBirthInfoListItem, UserBirthInfo, OutfitRecommendation, BraceletRecommendation, DailyFortune } from './types';

// ── 多巴胺配色系统 ──
const PALETTE = {
  coral: '#FF5CA8', coralLight: 'rgba(255,92,168,0.12)',
  orange: '#FF8A3D', orangeLight: 'rgba(255,138,61,0.12)',
  yellow: '#FFD93D', yellowLight: 'rgba(255,217,61,0.12)',
  green: '#22C55E', greenLight: 'rgba(34,197,94,0.12)',
  blue: '#2CCBFF', blueLight: 'rgba(44,203,255,0.14)',
  purple: '#8F68FF', purpleLight: 'rgba(143,104,255,0.14)',
};

const USER_ID = 'user_default';

// 中国主要城市列表
const MAJOR_CITIES = [
  '北京', '上海', '广州', '深圳', '杭州', '南京', '苏州', '成都', '重庆', '西安',
  '武汉', '天津', '郑州', '长沙', '东莞', '佛山', '青岛', '沈阳', '大连', '厦门',
  '宁波', '无锡', '济南', '哈尔滨', '福州', '石家庄', '南昌', '昆明', '合肥', '贵阳',
  '太原', '南宁', '温州', '长春', '常州', '徐州', '扬州', '南通', '昆山', '嘉兴',
  '绍兴', '台州', '金华', '泉州', '烟台', '潍坊', '临沂', '洛阳', '乌鲁木齐', '兰州'
].sort();

// 场景图标映射
const SCENE_ICONS: Record<string, React.ReactNode> = {
  work: <Briefcase style={{ width: '18px', height: '18px' }} />,
  daily: <Shirt style={{ width: '18px', height: '18px' }} />,
  party: <PartyPopper style={{ width: '18px', height: '18px' }} />,
  holiday: <Gift style={{ width: '18px', height: '18px' }} />,
};

const DOPAMINE_COLORS = [
  { label: '木', color: '#4ADE80', icon: <Leaf style={{ width: '12px', height: '12px' }} /> },
  { label: '火', color: '#FF6B6B', icon: <Flame style={{ width: '12px', height: '12px' }} /> },
  { label: '土', color: '#D4A000', icon: <Mountain style={{ width: '12px', height: '12px' }} /> },
  { label: '金', color: '#7B8FA8', icon: <CircleDot style={{ width: '12px', height: '12px' }} /> },
  { label: '水', color: '#00A8E8', icon: <Droplets style={{ width: '12px', height: '12px' }} /> },
];

const fadeUp = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } };
const UI_EASE = MOTION_TOKENS.uiEase;

// ── 运势辅助函数 ──
function getScoreColor(score: number): string {
  if (score >= 85) return '#00C47A';
  if (score >= 70) return '#FF9D6B';
  if (score >= 55) return '#FFD666';
  if (score >= 45) return '#A0A8C0';
  if (score >= 30) return '#FF9D6B';
  return '#FF6B6B';
}

function getScoreLabel(score: number): string {
  if (score >= 85) return '大吉';
  if (score >= 70) return '吉';
  if (score >= 55) return '小吉';
  if (score >= 45) return '平';
  if (score >= 30) return '小凶';
  return '凶';
}

// 获取运势维度的动态描述
function getDimensionDesc(dimension: 'wealth' | 'love' | 'health', tenGod: string, score: number): string {
  const tenGodDescs: Record<string, { wealth: string; love: string; health: string }> = {
    '食神': {
      wealth: '食神生财，投资获利，财气顺畅',
      love: '食神吐秀，魅力四射，感情甜蜜',
      health: '食欲良好，身心舒畅，精力充沛'
    },
    '伤官': {
      wealth: '伤官生财，敢于投资，财运波动',
      love: '伤官活泼，表达力强，感情多彩',
      health: '精力旺盛，注意休息，适度运动'
    },
    '正财': {
      wealth: '正财稳健，积累财富，理财得当',
      love: '正财真情，稳重感情，财运带桃花',
      health: '作息规律，身体健康，状态稳定'
    },
    '偏财': {
      wealth: '偏财亨通，投资好运，收益丰厚',
      love: '偏财桃花，社交活跃，感情丰富',
      health: '活力充沛，注意肝胆，适度休息'
    },
    '正官': {
      wealth: '正官护财，财源稳定，工作生财',
      love: '正官端正，感情稳重，合作姻缘',
      health: '心态平和，健康稳定，注意劳逸'
    },
    '七杀': {
      wealth: '七杀冲动，投资谨慎，破财风险',
      love: '七杀桃花，感情竞争，压力较大',
      health: '压力较大，注意心血管，健康预警'
    },
    '正印': {
      wealth: '正印生身，财气内敛，贵人相助',
      love: '正印温情，感情稳定，信任包容',
      health: '学业进步，身心平衡，注意眼睛'
    },
    '偏印': {
      wealth: '偏印思考，财路独特，创意生财',
      love: '偏印内敛，感情含蓄，需主动表达',
      health: '思考过度，注意神经系统，适当放松'
    },
    '比肩': {
      wealth: '比肩竞争，合伙生财，分散风险',
      love: '比肩独立，感情平等，竞争桃花',
      health: '竞争压力，注意脾胃，适当解压'
    },
    '劫财': {
      wealth: '劫财破耗，投资谨慎，防盗防骗',
      love: '劫财竞争，感情争夺，注意三角',
      health: '劫财冲动，注意意外，稳重行事'
    }
  };

  const descs = tenGodDescs[tenGod] || {
    wealth: '财运平稳，理性消费，积累为主',
    love: '感情平和，顺其自然，缘分到来',
    health: '身体状态良好，注意养生休息'
  };

  // 根据分数调整描述强度
  if (score >= 75) {
    return descs[dimension];
  } else if (score >= 55) {
    return `偏${descs[dimension].replace(/^[偏正]/, '')}`;
  } else {
    return `注意${descs[dimension]}`;
  }
}

// 时辰名称转北京时间范围
function timeToBeijing(timeStr: string): string {
  const timeMap: Record<string, string> = {
    '子时': '23:00-01:00',
    '丑时': '01:00-03:00',
    '寅时': '03:00-05:00',
    '卯时': '05:00-07:00',
    '辰时': '07:00-09:00',
    '巳时': '09:00-11:00',
    '午时': '11:00-13:00',
    '未时': '13:00-15:00',
    '申时': '15:00-17:00',
    '酉时': '17:00-19:00',
    '戌时': '19:00-21:00',
    '亥时': '21:00-23:00',
  };
  return timeMap[timeStr] || timeStr;
}

// 颜色词映射 - 中文颜色名到颜色值和图标
const COLOR_WORDS: Record<string, { color: string; hex: string }> = {
  // 蓝色系
  '藏蓝色': { color: '藏蓝', hex: '#1E3A5F' },
  '深蓝色': { color: '深蓝', hex: '#1E40AF' },
  '蓝色': { color: '蓝', hex: '#3B82F6' },
  '浅蓝色': { color: '浅蓝', hex: '#60A5FA' },
  '天蓝色': { color: '天蓝', hex: '#0EA5E9' },
  '湖蓝色': { color: '湖蓝', hex: '#06B6D4' },
  '宝蓝色': { color: '宝蓝', hex: '#2563EB' },
  '海军蓝': { color: '海军蓝', hex: '#1E3A8A' },
  // 红色系
  '大红色': { color: '大红', hex: '#DC2626' },
  '深红色': { color: '深红', hex: '#B91C1C' },
  '红色': { color: '红', hex: '#EF4444' },
  '浅红色': { color: '浅红', hex: '#F87171' },
  '酒红色': { color: '酒红', hex: '#881337' },
  '枣红色': { color: '枣红', hex: '#7F1D1D' },
  '珊瑚红': { color: '珊瑚红', hex: '#F43F5E' },
  '朱红色': { color: '朱红', hex: '#C81D11' },
  // 绿色系
  '深绿色': { color: '深绿', hex: '#166534' },
  '绿色': { color: '绿', hex: '#22C55E' },
  '浅绿色': { color: '浅绿', hex: '#4ADE80' },
  '墨绿色': { color: '墨绿', hex: '#14532D' },
  '军绿色': { color: '军绿', hex: '#365314' },
  '翠绿色': { color: '翠绿', hex: '#16A34A' },
  '抹茶绿': { color: '抹茶绿', hex: '#84CC16' },
  // 黄色系
  '金黄色': { color: '金黄', hex: '#CA8A04' },
  '深黄色': { color: '深黄', hex: '#CA8A04' },
  '黄色': { color: '黄', hex: '#EAB308' },
  '浅黄色': { color: '浅黄', hex: '#FDE047' },
  '土黄色': { color: '土黄', hex: '#A16207' },
  '柠檬黄': { color: '柠檬黄', hex: '#FACC15' },
  '明黄色': { color: '明黄', hex: '#FDE047' },
  // 白色系
  '纯白色': { color: '纯白', hex: '#FFFFFF' },
  '白色': { color: '白', hex: '#F8FAFC' },
  '米白色': { color: '米白', hex: '#F5F5DC' },
  '象牙白': { color: '象牙白', hex: '#FFFFF0' },
  '乳白色': { color: '乳白', hex: '#FFFDD0' },
  // 黑色系
  '纯黑色': { color: '纯黑', hex: '#0A0A0A' },
  '黑色': { color: '黑', hex: '#1F2937' },
  '炭黑色': { color: '炭黑', hex: '#171717' },
  // 紫色系
  '深紫色': { color: '深紫', hex: '#7C3AED' },
  '紫色': { color: '紫', hex: '#A855F7' },
  '浅紫色': { color: '浅紫', hex: '#C084FC' },
  '紫罗兰': { color: '紫罗兰', hex: '#8B5CF6' },
  '香芋紫': { color: '香芋紫', hex: '#9B59B6' },
  // 灰色系
  '深灰色': { color: '深灰', hex: '#374151' },
  '灰色': { color: '灰', hex: '#6B7280' },
  '浅灰色': { color: '浅灰', hex: '#9CA3AF' },
  '银灰色': { color: '银灰', hex: '#9CA3AF' },
  '炭灰色': { color: '炭灰', hex: '#4B5563' },
  // 橙色系
  '深橙色': { color: '深橙', hex: '#EA580C' },
  '橙色': { color: '橙', hex: '#F97316' },
  '浅橙色': { color: '浅橙', hex: '#FB923C' },
  '橘色': { color: '橘', hex: '#F59E0B' },
  '橘黄色': { color: '橘黄', hex: '#F97316' },
  '暖橙色': { color: '暖橙', hex: '#FB923C' },
  // 粉色系
  '深粉色': { color: '深粉', hex: '#EC4899' },
  '粉色': { color: '粉', hex: '#F472B6' },
  '浅粉色': { color: '浅粉', hex: '#F9A8D4' },
  '玫瑰粉': { color: '玫瑰粉', hex: '#FDA4AF' },
  '藕粉色': { color: '藕粉', hex: '#D8B4FE' },
  '樱花粉': { color: '樱花粉', hex: '#FBCFE8' },
  // 棕色系
  '深棕色': { color: '深棕', hex: '#78350F' },
  '棕色': { color: '棕', hex: '#92400E' },
  '浅棕色': { color: '浅棕', hex: '#B45309' },
  '咖啡色': { color: '咖啡', hex: '#6B4423' },
  '卡其色': { color: '卡其', hex: '#C19A6B' },
  '驼色': { color: '驼色', hex: '#C19A6B' },
  '焦糖色': { color: '焦糖', hex: '#A0522D' },
  // 青色系
  '深青色': { color: '深青', hex: '#0F766E' },
  '青色': { color: '青', hex: '#14B8A6' },
  '浅青色': { color: '浅青', hex: '#2DD4BF' },
  // 金银色系
  '金色': { color: '金', hex: '#F59E0B' },
  '银色': { color: '银', hex: '#C0C0C0' },
  '香槟金': { color: '香槟金', hex: '#D4AF37' },
};

// 手串图片数据库 - 真实手串/水晶/宝石佛珠图片（所有URL已验证有效）
// 图片主题：按材质颜色分类
// 手串图片数据库 - 使用本地SVG图片（自生成，确保显示正确）
const BRACELET_IMAGES: Record<string, string[]> = {
  // 绿色系 - 绿幽灵、翡翠
  '绿幽灵水晶': [
    '/images/jade.svg', '/images/jade.svg', '/images/jade.svg',
  ],
  '天然翡翠': [
    '/images/jade.svg', '/images/jade.svg', '/images/jade.svg',
  ],
  '翡翠': [
    '/images/jade.svg', '/images/jade.svg', '/images/jade.svg',
  ],

  // 木质系 - 小叶紫檀
  '小叶紫檀': [
    '/images/wood.svg', '/images/wood.svg', '/images/wood.svg',
  ],
  '檀木': [
    '/images/wood.svg', '/images/wood.svg', '/images/wood.svg',
  ],

  // 蓝色系 - 绿松石、海蓝宝、青金石
  '天然绿松石': [
    '/images/turquoise.svg', '/images/turquoise.svg', '/images/turquoise.svg',
  ],
  '绿松石': [
    '/images/turquoise.svg', '/images/turquoise.svg', '/images/turquoise.svg',
  ],
  '海蓝宝石': [
    '/images/turquoise.svg', '/images/turquoise.svg', '/images/turquoise.svg',
  ],
  '海蓝宝': [
    '/images/turquoise.svg', '/images/turquoise.svg', '/images/turquoise.svg',
  ],
  '青金石': [
    '/images/lapis-lazuli.svg', '/images/lapis-lazuli.svg', '/images/lapis-lazuli.svg',
  ],

  // 红色系 - 南红、红玛瑙、石榴石、珊瑚
  '南红玛瑙': [
    '/images/red-agate.svg', '/images/red-agate.svg', '/images/red-agate.svg',
  ],
  '天然红珊瑚': [
    '/images/red-agate.svg', '/images/red-agate.svg', '/images/red-agate.svg',
  ],
  '红珊瑚': [
    '/images/red-agate.svg', '/images/red-agate.svg', '/images/red-agate.svg',
  ],
  '石榴石': [
    '/images/red-agate.svg', '/images/red-agate.svg', '/images/red-agate.svg',
  ],
  '红玛瑙': [
    '/images/red-agate.svg', '/images/red-agate.svg', '/images/red-agate.svg',
  ],
  '南红': [
    '/images/red-agate.svg', '/images/red-agate.svg', '/images/red-agate.svg',
  ],

  // 黄色系 - 琥珀、蜜蜡、黄水晶、虎眼石
  '天然琥珀': [
    '/images/amber.svg', '/images/amber.svg', '/images/amber.svg',
  ],
  '琥珀': [
    '/images/amber.svg', '/images/amber.svg', '/images/amber.svg',
  ],
  '黄水晶': [
    '/images/amber.svg', '/images/amber.svg', '/images/amber.svg',
  ],
  '虎眼石': [
    '/images/amber.svg', '/images/amber.svg', '/images/amber.svg',
  ],
  '和田黄玉': [
    '/images/amber.svg', '/images/amber.svg', '/images/amber.svg',
  ],
  '天然蜜蜡': [
    '/images/amber.svg', '/images/amber.svg', '/images/amber.svg',
  ],
  '蜜蜡': [
    '/images/amber.svg', '/images/amber.svg', '/images/amber.svg',
  ],

  // 金色系 - 金发晶
  '金发晶': [
    '/images/amber.svg', '/images/amber.svg', '/images/amber.svg',
  ],

  // 白色/透明系 - 白水晶、月光石
  '白水晶': [
    '/images/white-crystal.svg', '/images/white-crystal.svg', '/images/white-crystal.svg',
  ],
  '月光石': [
    '/images/white-crystal.svg', '/images/white-crystal.svg', '/images/white-crystal.svg',
  ],

  // 黑色系 - 黑曜石、黑玛瑙
  '黑曜石': [
    '/images/black-obsidian.svg', '/images/black-obsidian.svg', '/images/black-obsidian.svg',
  ],
  '黑玛瑙': [
    '/images/black-obsidian.svg', '/images/black-obsidian.svg', '/images/black-obsidian.svg',
  ],

  // 紫色系 - 紫水晶
  '紫水晶': [
    '/images/purple-amethyst.svg', '/images/purple-amethyst.svg', '/images/purple-amethyst.svg',
  ],

  // 银色系 - 银饰
  '925纯银': [
    '/images/silver-ring.svg', '/images/silver-ring.svg', '/images/silver-ring.svg',
  ],
  '银饰': [
    '/images/silver-ring.svg', '/images/silver-ring.svg', '/images/silver-ring.svg',
  ],

  // 金曜石 - 金色斑点黑曜石
  '金曜石': [
    '/images/gold-tiger-eye.svg', '/images/gold-tiger-eye.svg', '/images/gold-tiger-eye.svg',
  ],

  // 碧玺 - 多色碧玺
  '碧玺': [
    'https://images.pexels.com/photos/15466180/pexels-photo-15466180.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop',
    'https://images.pexels.com/photos/6045529/pexels-photo-6045529.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop',
    'https://images.pexels.com/photos/9876431/pexels-photo-9876431.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop',
  ],

  // 和田玉 - 白色/绿色玉石
  '和田玉': [
    'https://images.pexels.com/photos/4550871/pexels-photo-4550871.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop',
    'https://images.pexels.com/photos/11157508/pexels-photo-11157508.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop',
    'https://images.pexels.com/photos/25283498/pexels-photo-25283498.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop',
  ],

  // 菩提子 - 星月菩提、金刚菩提
  '星月菩提': [
    'https://images.pexels.com/photos/25945062/pexels-photo-25945062.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop',
    'https://images.pexels.com/photos/10899312/pexels-photo-10899312.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop',
    'https://images.pexels.com/photos/6752263/pexels-photo-6752263.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop',
  ],
  '金刚菩提': [
    'https://images.pexels.com/photos/25945062/pexels-photo-25945062.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop',
    'https://images.pexels.com/photos/10899312/pexels-photo-10899312.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop',
    'https://images.pexels.com/photos/6752263/pexels-photo-6752263.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop',
  ],

  // 默认图片 - 通用佛珠手串
  'default': [
    'https://images.pexels.com/photos/10596343/pexels-photo-10596343.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop',
    'https://images.pexels.com/photos/25283498/pexels-photo-25283498.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop',
    'https://images.pexels.com/photos/7541806/pexels-photo-7541806.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop',
  ],
};

// 手串详细解说数据库
const BRACELET_DETAILS: Record<string, {
  description: string;
  effects: string[];
  benefits: string[];
  care: string[];
  occasions: string[];
}> = {
  '紫水晶': {
    description: '紫水晶是二月生辰石，象征着智慧与灵性。其深邃的紫色源自铁元素和锰元素的微量混入，被古人视为神秘力量的象征。在风水学中，紫水晶能够净化空间气场，提升人的直觉力和创造力。',
    effects: [
      '开发眉心轮，增强直觉与感知能力',
      '镇定安神，缓解焦虑与压力',
      '提升专注力与记忆力',
      '促进人际关系和谐',
    ],
    benefits: [
      '对于五行缺木、火、金的人特别有益',
      '有助于学业进步、考试顺利',
      '改善睡眠质量，消除噩梦',
      '招揽贵人运，化解小人是非',
    ],
    care: [
      '避免长时间阳光直射，以防褪色',
      '不宜与硬物碰撞，防止产生裂纹',
      '定期用清水冲洗净化',
      '避免接触香水、洗洁精等化学品',
    ],
    occasions: ['办公学习', '冥想禅修', '睡眠休息', '社交聚会'],
  },
  '绿松石': {
    description: '绿松石是世界上最古老的宝石之一，被誉为"成功之石"和"幸运之石"。其独特的蓝绿色调清新悦目，象征着天空与大地。在藏传佛教中，绿松石被视为护身符，能驱邪避凶。',
    effects: [
      '舒缓眼部疲劳，保护视力健康',
      '平衡阴阳，调和身心气场',
      '增强表达力与说服力',
      '带来好运与财富机遇',
    ],
    benefits: [
      '对于五行缺木、水的人尤为有利',
      '有助于事业发展和职位晋升',
      '化解冲太岁带来的负面影响',
      '增强佩戴者的正能量和自信',
    ],
    care: [
      '绿松石硬度较低，避免与硬物摩擦',
      '不宜戴着洗澡或游泳',
      '长期不佩戴时，用软布包裹保存',
      '可定期用婴儿油轻轻擦拭保持光泽',
    ],
    occasions: ['商务谈判', '户外旅行', '驾车出行', '日常休闲'],
  },
  '蜜蜡': {
    description: '蜜蜡是琥珀的一种，由数千万年前的松柏科植物树脂石化而成。温润的黄色象征着太阳的光芒与温暖，古代被视为"虎之魂魄"，具有驱邪避煞的强大功效。',
    effects: [
      '温养身心，补充人体元气',
      '促进血液循环，改善手脚冰凉',
      '舒缓关节疼痛与风湿不适',
      '增强免疫力和抗病能力',
    ],
    benefits: [
      '对于五行缺土、火的人特别适合',
      '有助于招财进宝，财源广进',
      '化解事业上的小人阻碍',
      '增进夫妻感情与家庭和睦',
    ],
    care: [
      '蜜蜡怕高温，避免明火和热源',
      '不宜与香水、酒精等有机溶剂接触',
      '可用少量橄榄油保养，保持光泽',
      '单独存放，避免划伤其他珠宝',
    ],
    occasions: ['商务送礼', '结婚订婚', '孝敬长辈', '收藏投资'],
  },
  '小叶紫檀': {
    description: '小叶紫檀是红木中的珍品，密度高、纹理美、色泽深沉。古代是皇家御用木材，有"帝王之木"的美称。长期佩戴可修身养性，被佛教视为具有灵性的圣木。',
    effects: [
      '调节气血，促进新陈代谢',
      '镇静安神，改善失眠多梦',
      '防辐射，净化周围空气',
      '提升专注力与判断力',
    ],
    benefits: [
      '对于五行缺木的人具有极强补益作用',
      '有助于辟邪化煞，保佑平安',
      '增进人缘，招来贵人相助',
      '旺事业运，助力仕途发展',
    ],
    care: [
      '避免沾水，沾水后要立即擦干',
      '不宜长时间暴晒，以防开裂',
      '可用橄榄油或核桃油定期保养',
      '盘玩时保持手部干净干燥',
    ],
    occasions: ['商务办公', '佛门修行', '书法绘画', '居家摆放'],
  },
  '金曜石': {
    description: '金曜石是黑曜石中的稀有品种，其表面呈现出金色的丝丝光芒，俗称"金眼睛"。金曜石融合了黑曜石的辟邪功效与金色招财的能量，是增强财富运势的绝佳选择。',
    effects: [
      '吸收负能量，排除病气浊气',
      '增强海底轮能量，提升行动力',
      '辟邪化煞，挡灾化凶',
      '招揽正财，偏财亦有助力',
    ],
    benefits: [
      '对于五行水旺、金弱的人特别适合',
      '有助于化解事业上的小人是非',
      '增强佩戴者的胆识与魄力',
      '守护夜间出行安全',
    ],
    care: [
      '金曜石硬度较高，但需避免重击',
      '净化时可用阳光晒，但时间不宜过长',
      '避免与强酸强碱类物质接触',
      '存放时单独放置，以防刮花',
    ],
    occasions: ['金融投资', '夜班工作', '外出旅行', '商务谈判'],
  },
  '红玛瑙': {
    description: '红玛瑙是玛瑙家族中最为珍贵的品种之一，颜色艳丽如血，象征着生命力与热情。古代被称为"琼瑶"，有活血化瘀、舒筋活络的功效，是中医常用的养生宝石。',
    effects: [
      '促进血液循环，改善气色',
      '增强免疫力，预防感冒',
      '舒缓紧张情绪，消除负面心理',
      '调节内分泌系统平衡',
    ],
    benefits: [
      '对于五行缺火、土的人具有补益作用',
      '有助于改善女性妇科问题',
      '增强佩戴者的活力与朝气',
      '化解意外血光之灾',
    ],
    care: [
      '避免高温和骤然温差变化',
      '不宜戴着洗澡或游泳',
      '可用清水冲洗后软布擦干',
      '避免与尖锐物品碰撞',
    ],
    occasions: ['女性佩戴', '运动健身', '产后调理', '体弱多病者'],
  },
  '青金石': {
    description: '青金石是一种深蓝色的古老宝石，色泽如夜空般深邃，上面点缀的金色黄铁矿如繁星闪烁。在古代，青金石是权力和智慧的象征，佛教将其视为七宝之一。',
    effects: [
      '开启眉心轮，增强洞察力',
      '提升沟通表达能力',
      '平复情绪波动',
      '增强学习理解能力',
    ],
    benefits: [
      '对于五行缺水、金的人特别有益',
      '有助于学业进步，智慧增长',
      '化解口舌是非和人际纷争',
      '增强领导力和决策力',
    ],
    care: [
      '避免接触水汽和潮湿环境',
      '不宜用力揉搓或高温烘烤',
      '可用干布轻轻擦拭保持清洁',
      '存放时避免压重重物',
    ],
    occasions: ['学术研究', '艺术创作', '演讲汇报', '管理决策'],
  },
  '沉香': {
    description: '沉香是"沉香木"受伤后分泌的油脂与木质结合而成的珍稀物质，是世界最昂贵的香料之一。其香气清幽绵长，被佛教、伊斯兰教、基督教等视为神圣之物，有"木中钻石"的美誉。',
    effects: [
      '镇定心神，缓解焦虑抑郁',
      '疏通经络，行气止痛',
      '净化空间气场',
      '醒脑开窍，提升专注',
    ],
    benefits: [
      '对于五行缺木、火、土的人均有补益',
      '有助于修行打坐，快速入定',
      '化解煞气，护佑平安',
      '提升品味格调，彰显身份',
    ],
    care: [
      '沉香不怕水，但忌讳香水和化学用品',
      '不宜暴晒或放在高温处',
      '可用密封罐保存，留住香气',
      '长期佩戴会让香气更加醇厚',
    ],
    occasions: ['禅修冥想', '品茗茶道', '商务接待', '居家养生'],
  },
  '砗磲': {
    description: '砗磲是深海大型贝类的外壳，洁白如雪，质地温润。是佛教七宝之首，在藏传佛教中地位崇高。砗磲寓意着纯净与慈悲，象征着不染尘埃的高尚品格。',
    effects: [
      '镇定安神，改善睡眠',
      '增强免疫系统功能',
      '舒缓压力与疲劳',
      '净化心灵，消除杂念',
    ],
    benefits: [
      '对于五行缺金、水的人具有补益',
      '有助于化解犯太岁的不利影响',
      '增进心境的平和与安宁',
      '护佑佩戴者平安健康',
    ],
    care: [
      '砗磲怕酸碱，避免接触化妆品',
      '不宜戴着洗澡或游泳',
      '可用清水冲洗后软布擦干',
      '避免用力碰撞，防止碎裂',
    ],
    occasions: ['佛像配饰', '儿童佩戴', '礼佛拜佛', '养生静心'],
  },
  '南红': {
    description: '南红玛瑙是中国特有的红玛瑙品种，色泽红润艳丽，质地温润细腻。因产自中国南方而得名"南红"，是佛教七宝之一，被认为具有辟邪护身、吉祥如意的神奇力量。',
    effects: [
      '补气养血，美容养颜',
      '调节女性内分泌',
      '增强自信心和正能量',
      '促进事业发展',
    ],
    benefits: [
      '对于五行缺火、土的人极为有利',
      '有助于招财进宝，财源滚滚',
      '化解小人是非，口舌纠纷',
      '增进夫妻感情，守护家庭',
    ],
    care: [
      '避免高温和强光直射',
      '不宜戴着洗澡或游泳',
      '避免与硬物碰撞',
      '可用少量婴儿油保养',
    ],
    occasions: ['女性佩戴', '结婚订婚', '节日送礼', '收藏投资'],
  },
  '碧玺': {
    description: '碧玺是电气石族宝石的统称，颜色丰富多彩，被誉为"落入人间的彩虹"。其独特的光学特性能够产生微弱的电流，对人体有独特的保健作用，是近年来备受欢迎的时尚宝石。',
    effects: [
      '产生负离子，净化空气',
      '释放远红外线，改善微循环',
      '平衡人体生物电',
      '消除电磁辐射伤害',
    ],
    benefits: [
      '对于五行缺木、火、土的人有补益',
      '不同颜色对应不同运势',
      '有助于化解感情纠纷',
      '增强佩戴者的人缘和魅力',
    ],
    care: [
      '碧玺硬度较高，但脆性也大',
      '避免剧烈温度变化',
      '不宜超声波清洗',
      '单独存放，避免划伤',
    ],
    occasions: ['时尚搭配', '送礼馈赠', '多元运势', '五行调和'],
  },
  '和田玉': {
    description: '和田玉是中华文化的瑰宝，产自新疆和田地区，以质地细腻、色泽温润著称。自古以来就是"君子比德如玉"的象征，是权势和地位的代表，被誉为"玉中之王"。',
    effects: [
      '滋养五脏六腑，延年益寿',
      '养心静神，修身养性',
      '冬暖夏凉，调节体温',
      '温润肌肤，美容养颜',
    ],
    benefits: [
      '对于五行缺土、金的人尤为有利',
      '辟邪保平安，护佑平安',
      '提升品味与气质',
      '代代相传，具有传承价值',
    ],
    care: [
      '和田玉喜油脂，可用人体油脂滋养',
      '避免碰撞和摔落',
      '不宜接触酸碱类物质',
      '长期佩戴会更加温润有光泽',
    ],
    occasions: ['传家之宝', '商务送礼', '文化收藏', '修身养性'],
  },
  '星月菩提': {
    description: '星月菩提是黄藤树种子加工而成，表面布满黑色细点如众星捧月，故名"星月"。是佛教念佛修行的重要法器，被认为能够静心悟道、消除烦恼。',
    effects: [
      '静心凝神，帮助入定',
      '消除烦躁与嗔恨之心',
      '开启智慧，明心见性',
      '修持功德，积累福报',
    ],
    benefits: [
      '对于五行缺木、火的人有补益',
      '有助于学业进步，金榜题名',
      '化解烦恼灾厄',
      '增进修行者与佛法的缘分',
    ],
    care: [
      '新串需先盘玩挂瓷后再佩戴',
      '盘玩时手部保持干净干燥',
      '避免沾水，防止开裂',
      '定期用软布清洁表面',
    ],
    occasions: ['佛教修行', '学生佩戴', '静心冥想', '念佛计数'],
  },
  '金刚菩提': {
    description: '金刚菩提是金刚树种子加工而成，质地坚硬如金刚，故名"金刚菩提"。在佛教中象征着坚硬无比、能破一切烦恼，是力量与毅力的象征。',
    effects: [
      '增添力量与勇气',
      '坚定信念，不易动摇',
      '破除执念与妄想',
      '成就一切所愿',
    ],
    benefits: [
      '对于五行缺金、水的人有补益',
      '有助于事业突破，创业成功',
      '化解太岁与流年不利',
      '增强领导力和执行力',
    ],
    care: [
      '金刚菩提喜汗，可多用手盘玩',
      '避免接触化学洗涤剂',
      '不宜泡水，防止反碱发白',
      '盘玩后可用刷子清理缝隙',
    ],
    occasions: ['创业起步', '事业突破', '健身运动', '克服困难'],
  },
};

// 获取手串图片
function getBraceletImages(material: string): string[] {
  // 尝试精确匹配
  if (BRACELET_IMAGES[material]) {
    return BRACELET_IMAGES[material];
  }
  // 尝试模糊匹配
  for (const key of Object.keys(BRACELET_IMAGES)) {
    if (material.includes(key) || key.includes(material)) {
      return BRACELET_IMAGES[key];
    }
  }
  return BRACELET_IMAGES['default'];
}

// 获取手串详细解说
function getBraceletDetails(material: string): {
  description: string;
  effects: string[];
  benefits: string[];
  care: string[];
  occasions: string[];
} | null {
  // 精确匹配
  if (BRACELET_DETAILS[material]) {
    return BRACELET_DETAILS[material];
  }
  // 模糊匹配
  for (const key of Object.keys(BRACELET_DETAILS)) {
    if (material.includes(key) || key.includes(material)) {
      return BRACELET_DETAILS[key];
    }
  }
  return null;
}

// 解析文本中高亮的颜色词，返回带有颜色高亮的JSX
function HighlightColors({ text, baseColor }: { text: string; baseColor: string }) {
  if (!text) return null;
  
  // 按颜色词长度降序排列，优先匹配更长的词
  const sortedColors = Object.keys(COLOR_WORDS).sort((a, b) => b.length - a.length);
  
  // 构建正则表达式
  const pattern = new RegExp(`(${sortedColors.join('|')})`, 'g');
  const parts = text.split(pattern);
  
  return (
    <>
      {parts.map((part, index) => {
        const colorInfo = COLOR_WORDS[part];
        if (colorInfo) {
          return (
            <span key={index} style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '2px 8px',
              margin: '0 2px',
              background: `${colorInfo.hex}18`,
              border: `1px solid ${colorInfo.hex}40`,
              borderRadius: '6px',
            }}>
              <span style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                background: colorInfo.hex,
                boxShadow: `0 1px 3px ${colorInfo.hex}50`,
                flexShrink: 0,
              }} />
              <span style={{
                fontFamily: 'Outfit, sans-serif',
                fontSize: '11px',
                fontWeight: 600,
                color: colorInfo.hex,
              }}>{colorInfo.color}</span>
            </span>
          );
        }
        return part;
      })}
    </>
  );
}

// 彩色徽章
function ElementBadge({ el }: { el: string }) {
  const colors: Record<string, string> = { wood: '#4ADE80', fire: '#FF6B6B', earth: '#D4A000', metal: '#7B8FA8', water: '#00A8E8' };
  const names: Record<string, string> = { wood: '木', fire: '火', earth: '土', metal: '金', water: '水' };
  const color = colors[el] || '#A0A8C0';
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: '4px',
      padding: '3px 10px', borderRadius: '9999px',
      background: `${color}18`, border: `1px solid ${color}35`,
    }}>
      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: color }} />
      <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '12px', fontWeight: 600, color }}>{names[el] || el}</span>
    </div>
  );
}

export default function HomePage() {
  const [records, setRecords] = useState<UserBirthInfoListItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'outfit' | 'bracelet' | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: '', birthYear: new Date().getFullYear() - 25,
    birthMonth: 1, birthDay: 1, birthHour: 12,
    gender: 'male' as 'male' | 'female',
    calendarType: 'solar' as 'solar' | 'lunar',
    languageStyle: 'normal' as any,
    birthProvince: '',
    birthCity: '',
  });
  const buildBirthLocation = (province?: string, city?: string) =>
    [province?.trim(), city?.trim()].filter(Boolean).join(' ').trim();

  const parseBirthLocation = (location?: string) => {
    const text = (location || '').trim();
    if (!text) return { birthProvince: '', birthCity: '' };
    const parts = text.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return { birthProvince: parts[0], birthCity: parts.slice(1).join(' ') };
    }
    return { birthProvince: text, birthCity: '' };
  };

  const [outfitRec, setOutfitRec] = useState<OutfitRecommendation | null>(null);
  const [braceletRec, setBraceletRec] = useState<BraceletRecommendation | null>(null);
  const [previewInfo, setPreviewInfo] = useState<UserBirthInfo | null>(null);
  const [dailyFortune, setDailyFortune] = useState<DailyFortune | null>(null);

  // 地理位置状态
  const [userLocation, setUserLocation] = useState<{ city: string; lat?: number; lon?: number } | null>(null);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [citySearch, setCitySearch] = useState('');
  const [locating, setLocating] = useState(false);
  const [activeScene, setActiveScene] = useState<string | null>('work');
  const [locationLocked, setLocationLocked] = useState(false); // 定位锁定状态
  /** 快捷导航：大屏四列横排图标+文字；小屏 2×2 上图下文 */
  const [navWideLayout, setNavWideLayout] = useState(false);
  const jumpToCard = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const apply = () => setNavWideLayout(mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  /** 旧版顶栏「活力版 / 高级版」等可能写入的本地开关，进入首页即清除，避免仍走高级布局 */
  useEffect(() => {
    try {
      [
        'wuxing-home-ui-mode',
        'wuxing_home_ui_mode',
        'wuxing-home-layout',
        'wuxing_home_layout',
        'home-advanced-ui',
        'bazi-home-advanced',
      ].forEach((k) => localStorage.removeItem(k));
    } catch {
      // ignore
    }
  }, []);

  // 获取用户当前位置
  const detectLocation = () => {
    if (!navigator.geolocation) {
      setShowCityDropdown(true);
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          // 使用逆地理编码获取城市名
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=zh`);
          const data = await res.json();
          const city = data.address?.city || data.address?.town || data.address?.district || '未知';
          setUserLocation({ city: city.replace('市', ''), lat: latitude, lon: longitude });
          setLocationLocked(true); // 定位成功后锁定
        } catch {
          setUserLocation({ city: '未知', lat: latitude, lon: longitude });
          setLocationLocked(true); // 定位失败也锁定（使用默认城市）
        }
        setLocating(false);
      },
      () => {
        setLocating(false);
        setShowCityDropdown(true);
      }
    );
  };

  // 选择城市后刷新推荐并锁定定位
  const selectCity = (city: string) => {
    setUserLocation({ city });
    setLocationLocked(true); // 选择城市后锁定
    setShowCityDropdown(false);
    setCitySearch('');
    if (selectedId) {
      fetchRecommendations(selectedId, city); // 直接传城市参数
    }
  };

  // 解除定位锁定，允许重新定位
  const unlockLocation = () => {
    setLocationLocked(false);
    setUserLocation(null);
    setShowCityDropdown(true);
  };

  useEffect(() => {
    // 只有未锁定时才自动检测定位
    if (!locationLocked) {
      detectLocation();
    }
  }, []);

  useEffect(() => { fetchRecords(); }, []);

  async function fetchRecords() {
    setLoading(true);
    try {
      const res = await fetch(`/api/users/${USER_ID}/birth-info`);
      if (res.ok) {
        const data = await res.json();
        setRecords(data.items || data.records || []);
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  async function selectRecord(id: string) {
    setSelectedId(id);
    setActiveTab(null);  // 默认不展开推荐内容
    await fetchRecommendations(id);

    // 移动端：自动滚动到命盘信息区域
    const mingpanElement = document.getElementById('mingpan-section');
    if (mingpanElement && window.innerWidth < 768) {
      setTimeout(() => {
        mingpanElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);
    }
  }

  async function fetchRecommendations(id: string, cityOverride?: string) {
    // 构建带位置信息的查询参数（优先用传入的城市参数，否则用 state）
    const city = cityOverride ?? userLocation?.city;
    const cityParam = city ? `&city=${encodeURIComponent(city)}` : '';
    try {
      const [or, br, info, fortune] = await Promise.all([
        fetch(`/api/users/${USER_ID}/outfit-recommendation?recordId=${id}${cityParam}`).then(r => r.json() as Promise<OutfitRecommendation | { error: string }>),
        fetch(`/api/users/${USER_ID}/bracelet-recommendation?recordId=${id}`).then(r => r.json() as Promise<BraceletRecommendation | { error: string }>),
        fetch(`/api/users/${USER_ID}/birth-info/${id}`).then(r => r.json() as Promise<UserBirthInfo | { error: string }>),
        fetch(`/api/users/${USER_ID}/daily-fortune?recordId=${id}`).then(r => r.json() as Promise<DailyFortune | { error: string }>),
      ]);
      setOutfitRec(or && 'error' in or ? null : or as OutfitRecommendation);
      setBraceletRec(br && 'error' in br ? null : br as BraceletRecommendation);
      setPreviewInfo(info && 'error' in info ? null : info as UserBirthInfo);
      setDailyFortune(fortune && 'error' in fortune ? null : fortune as DailyFortune);
    } catch (e) { console.error('fetchRecommendations error:', e); }
  }

  // 重新获取推荐（当位置变化时）
  const refreshRecommendations = () => {
    if (selectedId) {
      fetchRecommendations(selectedId);
    }
  };

  async function handleDelete(id: string) {
    if (!confirm('确认删除这条记录？')) return;
    await fetch(`/api/users/${USER_ID}/birth-info/${id}`, { method: 'DELETE' });
    if (selectedId === id) { setSelectedId(null); setOutfitRec(null); setBraceletRec(null); setPreviewInfo(null); setDailyFortune(null); }
    fetchRecords();
  }

  // 编辑用户记录
  function handleEdit(record: UserBirthInfoListItem) {
    const { birthProvince, birthCity } = parseBirthLocation(record.birthLocation);
    setForm({
      name: record.name,
      birthYear: record.birthYear,
      birthMonth: record.birthMonth,
      birthDay: record.birthDay,
      birthHour: record.birthHour,
      gender: record.gender as 'male' | 'female',
      calendarType: (record as any).calendarType || 'solar',
      languageStyle: 'normal',
      birthProvince,
      birthCity,
    });
    // 设置编辑模式标记
    setForm((form: any) => ({ ...form, _editingId: record.id }));
    setShowForm(true);
  }

  // 更新编辑处理函数，支持更新
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { alert('请输入姓名'); return; }
    setSubmitting(true);
    try {
      const isEditing = (form as any)._editingId;
      const payload = {
        name: form.name,
        birthYear: form.birthYear,
        birthMonth: form.birthMonth,
        birthDay: form.birthDay,
        birthHour: form.birthHour,
        gender: form.gender,
        calendarType: form.calendarType,
        languageStyle: form.languageStyle,
        birthLocation: buildBirthLocation(form.birthProvince, form.birthCity),
      };
      
      let res: Response;
      let data: any;
      
      if (isEditing) {
        // 更新记录
        res = await fetch(`/api/users/${USER_ID}/birth-info/${isEditing}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        // 新建记录
        res = await fetch(`/api/users/${USER_ID}/birth-info`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }
      
      data = await res.json();
      if (res.ok) {
        setShowForm(false);
        // 清除编辑标记
        setForm({ 
          name: '', birthYear: new Date().getFullYear() - 25, 
          birthMonth: 1, birthDay: 1, birthHour: 12, 
          gender: 'male', calendarType: 'solar', languageStyle: 'normal',
          birthProvince: '', birthCity: ''
        });
        await fetchRecords();
        if (data.id) selectRecord(data.id);
      } else {
        alert(data.error || data.message || '提交失败，请稍后重试');
      }
    } catch (e) {
      console.error(e);
      alert('网络错误，请检查连接后重试');
    }
    setSubmitting(false);
  }

  const selectedRecord = records.find(r => r.id === selectedId);

  const YEAR_OPTIONS = Array.from({ length: 80 }, (_, i) => new Date().getFullYear() - 10 - i);
  const MONTH_OPTIONS = Array.from({ length: 12 }, (_, i) => i + 1);
  const DAY_OPTIONS = Array.from({ length: 31 }, (_, i) => i + 1);
  const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => i);
  const renderStyleGuideTriplet = (
    mainAxis: string,
    avoidRule: string,
    upgradeTip: string,
    tone: { primary: string; avoid: string; upgrade: string; border: string },
  ) => (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '6px', marginBottom: '10px' }}>
      <div style={{ padding: '8px', borderRadius: '8px', background: '#FFFFFF', border: `1.5px solid ${tone.border}` }}>
        <p style={{ fontFamily: 'Outfit', fontSize: '10px', fontWeight: 800, color: tone.primary, margin: 0 }}>场景主轴</p>
        <p style={{ fontFamily: 'Outfit', fontSize: '11px', color: '#5E6788', margin: '3px 0 0', lineHeight: 1.5 }}>{mainAxis}</p>
      </div>
      <div style={{ padding: '8px', borderRadius: '8px', background: '#FFFFFF', border: `1.5px solid ${tone.border}` }}>
        <p style={{ fontFamily: 'Outfit', fontSize: '10px', fontWeight: 800, color: tone.avoid, margin: 0 }}>配色禁忌</p>
        <p style={{ fontFamily: 'Outfit', fontSize: '11px', color: '#5E6788', margin: '3px 0 0', lineHeight: 1.5 }}>{avoidRule}</p>
      </div>
      <div style={{ padding: '8px', borderRadius: '8px', background: '#FFFFFF', border: `1.5px solid ${tone.border}` }}>
        <p style={{ fontFamily: 'Outfit', fontSize: '10px', fontWeight: 800, color: tone.upgrade, margin: 0 }}>提升建议</p>
        <p style={{ fontFamily: 'Outfit', fontSize: '11px', color: '#5E6788', margin: '3px 0 0', lineHeight: 1.5 }}>{upgradeTip}</p>
      </div>
    </div>
  );
  const renderInsightBlock = (
    title: string,
    content: string,
    tone: { title: string; border: string; background: string },
    spacing: { marginBottom?: string } = {},
  ) => (
    <div style={{
      marginBottom: spacing.marginBottom ?? '12px',
      padding: '10px 12px',
      borderRadius: '12px',
      background: tone.background,
      border: `1.5px solid ${tone.border}`,
    }}>
      <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '12px', fontWeight: 800, color: tone.title, margin: 0 }}>
        {title}
      </p>
      <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '12px', color: '#5E6788', margin: '4px 0 0', lineHeight: 1.6 }}>
        {content}
      </p>
    </div>
  );
  const renderPrimaryMaterialPreviewCard = (
    primary: any,
    details: any,
    badgeText = '首选',
  ) => {
    const material = primary.material || primary.name || '';
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: '12px',
        padding: '14px', borderRadius: '14px',
        background: `linear-gradient(145deg, ${PALETTE.purple}12, ${PALETTE.blue}10)`, border: `1px solid ${PALETTE.purple}22`,
        boxShadow: '0 10px 20px rgba(139,92,246,0.16)',
      }}>
        <div style={{
          width: '44px', height: '44px', borderRadius: '10px',
          background: `linear-gradient(135deg, ${PALETTE.purple}, ${PALETTE.blue})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Gem style={{ width: '20px', height: '20px', color: '#FFFFFF' }} />
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '14px', fontWeight: 700, color: '#1A1A2E', margin: 0 }}>{material}</p>
          <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '11px', color: '#A0A8C0', margin: '2px 0 0' }}>{primary.color || ''} · {details?.description?.slice(0, 30) || ''}</p>
          <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
            <span style={{ width: '20px', height: '6px', borderRadius: '999px', background: `linear-gradient(90deg, ${PALETTE.purple}, ${PALETTE.blue})` }} />
            <span style={{ width: '20px', height: '6px', borderRadius: '999px', background: `linear-gradient(90deg, ${PALETTE.coral}, ${PALETTE.orange})` }} />
          </div>
          <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '10px', color: '#8F97B5', margin: '5px 0 0' }}>
            推荐风格：通勤轻奢 · 柔光高级感
          </p>
        </div>
        <span style={{
          padding: '4px 10px', borderRadius: '8px',
          background: `linear-gradient(135deg, ${PALETTE.purple}, ${PALETTE.blue})`,
          fontSize: '10px', fontWeight: 700, color: '#FFFFFF',
          fontFamily: 'Outfit, sans-serif',
        }}>{badgeText}</span>
      </div>
    );
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        position: 'relative',
        zIndex: 1,
      }}
    >

      {/* ── 紧凑 Hero Banner（移动端自适应高度；BAZI 水印绝对定位避免遮挡） ── */}
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        style={{
          position: 'relative', overflow: 'hidden',
          borderRadius: navWideLayout ? '28px' : '18px',
          border: `1px solid ${PALETTE.coral}20`,
          boxShadow: navWideLayout ? '0 24px 48px rgba(255,107,157,0.16)' : '0 14px 32px rgba(255,107,157,0.14)',
        }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: `radial-gradient(circle at 12% 18%, ${PALETTE.coralLight} 0%, transparent 45%), radial-gradient(circle at 86% 24%, ${PALETTE.blueLight} 0%, transparent 45%), linear-gradient(135deg, ${PALETTE.coralLight} 0%, ${PALETTE.orangeLight} 50%, ${PALETTE.yellowLight} 100%)`,
          opacity: 0.92,
        }} />
        <div style={{
          position: 'absolute', top: '-24px', right: '-12px', width: '140px', height: '140px', borderRadius: '40px',
          background: `${PALETTE.purple}22`,
          filter: 'blur(2px)',
        }} />
        <div style={{
          position: 'absolute', bottom: '-42px', left: '18%', width: '180px', height: '120px', borderRadius: '999px',
          background: `${PALETTE.green}18`,
          filter: 'blur(2px)',
        }} />
        <div
          style={{
            position: 'relative',
            zIndex: 1,
            padding: navWideLayout ? '24px 32px' : '16px 14px 20px',
            display: 'flex',
            flexDirection: navWideLayout ? 'row' : 'column',
            justifyContent: 'flex-start',
            alignItems: navWideLayout ? 'flex-start' : 'stretch',
            flexWrap: navWideLayout ? 'wrap' : 'nowrap',
            gap: navWideLayout ? '20px' : '14px',
            minHeight: navWideLayout ? '100px' : undefined,
          }}
        >
          <div style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'flex-start',
            gap: navWideLayout ? '20px' : '14px',
            width: navWideLayout ? 'auto' : '100%',
            minWidth: 0,
            flex: navWideLayout ? '1 1 200px' : undefined,
          }}>
            <motion.div animate={{ rotate: [0, 6, -4, 0] }} transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
              style={{
                width: navWideLayout ? '52px' : '44px',
                height: navWideLayout ? '52px' : '44px',
                flexShrink: 0,
                borderRadius: '16px',
                background: `linear-gradient(135deg, ${PALETTE.coral}, ${PALETTE.orange})`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 16px rgba(255,122,92,0.32)',
              }}>
              <Sparkle style={{ width: navWideLayout ? '28px' : '24px', height: navWideLayout ? '28px' : '24px', color: '#FFFFFF' }} />
            </motion.div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h2 style={{
                fontFamily: 'Outfit, sans-serif',
                fontSize: navWideLayout ? '20px' : '17px',
                fontWeight: 900,
                color: '#1A1A2E',
                letterSpacing: '-0.02em',
                marginBottom: '4px',
                textShadow: '0 4px 14px rgba(255,255,255,0.65)',
              }}>五行色彩搭配</h2>
              <p style={{
                fontFamily: 'Outfit, sans-serif',
                fontSize: navWideLayout ? '13px' : '12px',
                color: '#6B7280',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '6px',
                lineHeight: 1.45,
              }}>
                <span style={{ flex: 1, minWidth: 0 }}>
                  输入生辰与出生地，获取每日穿搭色彩、手串建议和运势重点
                </span>
                <Sparkles style={{ width: '14px', height: '14px', color: PALETTE.coral, flexShrink: 0, marginTop: '2px' }} />
              </p>
            </div>
          </div>
          <div style={{
            display: 'flex',
            gap: '6px',
            flexWrap: 'wrap',
            justifyContent: navWideLayout ? 'flex-end' : 'flex-start',
            alignItems: 'center',
            width: navWideLayout ? 'auto' : '100%',
            flex: navWideLayout ? undefined : undefined,
            paddingBottom: navWideLayout ? undefined : '4px',
          }}>
            {DOPAMINE_COLORS.map(({ label, color, icon }) => (
              <div key={label} style={{
                display: 'flex', alignItems: 'center', gap: '4px',
                padding: navWideLayout ? '5px 10px' : '4px 8px',
                background: `${color}18`,
                border: `1px solid ${color}30`,
                borderRadius: '9999px',
              }}>
                {icon}
                <span style={{
                  fontFamily: 'Outfit, sans-serif',
                  fontSize: navWideLayout ? '12px' : '11px',
                  fontWeight: 600,
                  color,
                }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
        <div
          aria-hidden
          style={{
            position: 'absolute',
            right: navWideLayout ? '8px' : '6px',
            bottom: navWideLayout ? '-4px' : '6px',
            fontFamily: 'Outfit, sans-serif',
            fontSize: navWideLayout ? '72px' : '40px',
            fontWeight: 900,
            color: 'rgba(255,122,92,0.1)',
            lineHeight: 1,
            letterSpacing: '-0.05em',
            userSelect: 'none',
            pointerEvents: 'none',
            textShadow: '0 14px 28px rgba(255,122,92,0.12)',
            zIndex: 0,
          }}
        >BAZI</div>
      </motion.div>

      {/* ── 主体单列布局 ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'stretch' }}>
        {/* ── 第一行：我的生辰 + 命盘信息 + 今日运势（3列并排） ── */}
        {/* ​—​ 第一行：我的生辰（用户选择栏） —​ */}
        <motion.div {...fadeUp} transition={{ delay: 0.05 }}>
          <motion.div
            whileHover={{ y: -3 }}
            transition={{ duration: 0.2 }}
            style={{
            background: 'linear-gradient(155deg, rgba(249,252,255,0.95), rgba(255,255,255,0.9))',
            borderRadius: '24px',
            padding: '20px',
            boxShadow: '0 14px 28px rgba(74,86,152,0.1)',
            border: '1px solid rgba(91,92,255,0.18)',
            backdropFilter: 'blur(7px)', WebkitBackdropFilter: 'blur(7px)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '28px', height: '28px', borderRadius: '8px',
                  background: `${PALETTE.coral}15`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Star style={{ width: '14px', height: '14px', color: PALETTE.coral }} />
                </div>
                <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '14px', fontWeight: 700, color: '#1A1A2E' }}>我的生辰</span>
                {records.length > 0 && (
                  <span style={{
                    fontFamily: 'Outfit', fontSize: '11px', fontWeight: 600,
                    color: PALETTE.coral, background: `${PALETTE.coral}10`,
                    padding: '2px 8px', borderRadius: '9999px',
                  }}>{records.length}人</span>
                )}
              </div>
              <motion.button
                onClick={() => {
                  setShowForm(!showForm);
                  if (!showForm) {
                    setForm({ name: '', birthYear: new Date().getFullYear() - 25, birthMonth: 1, birthDay: 1, birthHour: 12, gender: 'male', calendarType: 'solar', languageStyle: 'normal', birthProvince: '', birthCity: '' });
                  }
                }}
                whileHover={{ y: -2, scale: 1.06 }}
                whileTap={{ y: 0, scale: 0.95 }}
                style={{
                  width: '28px', height: '28px',
                  borderRadius: '50%', border: `2px solid ${showForm ? PALETTE.coral : `${PALETTE.coral}50`}`,
                  background: showForm ? `${PALETTE.coral}20` : `${PALETTE.coral}10`, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: UI_EASE,
                  boxShadow: showForm ? `0 10px 18px ${PALETTE.coral}33` : `0 7px 14px ${PALETTE.coral}1f`,
                }}
              >
                {showForm ? <X style={{ width: '14px', height: '14px', color: PALETTE.coral }} /> : <Plus style={{ width: '14px', height: '14px', color: PALETTE.coral }} />}
              </motion.button>
            </div>

            {/* 展开式录入表单 */}
            <AnimatePresence>
              {showForm && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  style={{ overflow: 'hidden' }}
                >
                  <div style={{ paddingTop: '16px', borderTop: `1px solid ${PALETTE.coral}15`, marginTop: '14px' }}>
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      <div>
                        <label style={{ display: 'block', fontFamily: 'Outfit, sans-serif', fontSize: '12px', color: '#6B7280', marginBottom: '6px', fontWeight: 500 }}>姓名</label>
                        <input
                          value={form.name}
                          onChange={e => setForm({ ...form, name: e.target.value })}
                          placeholder="给自己起个名字"
                          style={{ width: '100%', padding: '12px 14px', fontSize: '14px', borderRadius: '12px', border: '1.5px solid #E8EAF6', background: 'linear-gradient(145deg, #FFFFFF, #F8F9FC)', outline: 'none', fontFamily: 'Outfit, sans-serif', color: '#1A1A2E', boxSizing: 'border-box', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.8), 0 6px 14px rgba(99,74,176,0.08)', transition: 'all 0.2s ease' }}
                          onFocus={e => { (e.target as HTMLElement).style.borderColor = PALETTE.coral; (e.target as HTMLElement).style.boxShadow = `0 0 0 3px ${PALETTE.coral}22, 0 10px 18px rgba(255,107,157,0.12)`; }}
                          onBlur={e => { (e.target as HTMLElement).style.borderColor = '#E8EAF6'; (e.target as HTMLElement).style.boxShadow = 'inset 0 1px 0 rgba(255,255,255,0.8), 0 6px 14px rgba(99,74,176,0.08)'; }}
                        />
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <div>
                          <label style={{ display: 'block', fontFamily: 'Outfit, sans-serif', fontSize: '12px', color: '#6B7280', marginBottom: '6px', fontWeight: 500 }}>出生省份</label>
                          <input
                            value={form.birthProvince}
                            onChange={e => setForm({ ...form, birthProvince: e.target.value })}
                            placeholder="例如：广东省"
                            style={{ width: '100%', padding: '12px 14px', fontSize: '14px', borderRadius: '12px', border: '1.5px solid #E8EAF6', background: 'linear-gradient(145deg, #FFFFFF, #F8F9FC)', outline: 'none', fontFamily: 'Outfit, sans-serif', color: '#1A1A2E', boxSizing: 'border-box', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.8), 0 6px 14px rgba(99,74,176,0.08)', transition: UI_EASE }}
                            onFocus={e => { (e.target as HTMLElement).style.borderColor = PALETTE.coral; (e.target as HTMLElement).style.boxShadow = `0 0 0 3px ${PALETTE.coral}22, 0 10px 18px rgba(255,107,157,0.12)`; }}
                            onBlur={e => { (e.target as HTMLElement).style.borderColor = '#E8EAF6'; (e.target as HTMLElement).style.boxShadow = 'inset 0 1px 0 rgba(255,255,255,0.8), 0 6px 14px rgba(99,74,176,0.08)'; }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontFamily: 'Outfit, sans-serif', fontSize: '12px', color: '#6B7280', marginBottom: '6px', fontWeight: 500 }}>出生市区</label>
                          <input
                            value={form.birthCity}
                            onChange={e => setForm({ ...form, birthCity: e.target.value })}
                            placeholder="例如：深圳市南山区"
                            style={{ width: '100%', padding: '12px 14px', fontSize: '14px', borderRadius: '12px', border: '1.5px solid #E8EAF6', background: 'linear-gradient(145deg, #FFFFFF, #F8F9FC)', outline: 'none', fontFamily: 'Outfit, sans-serif', color: '#1A1A2E', boxSizing: 'border-box', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.8), 0 6px 14px rgba(99,74,176,0.08)', transition: UI_EASE }}
                            onFocus={e => { (e.target as HTMLElement).style.borderColor = PALETTE.coral; (e.target as HTMLElement).style.boxShadow = `0 0 0 3px ${PALETTE.coral}22, 0 10px 18px rgba(255,107,157,0.12)`; }}
                            onBlur={e => { (e.target as HTMLElement).style.borderColor = '#E8EAF6'; (e.target as HTMLElement).style.boxShadow = 'inset 0 1px 0 rgba(255,255,255,0.8), 0 6px 14px rgba(99,74,176,0.08)'; }}
                          />
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: navWideLayout ? 'repeat(4, minmax(0, 1fr))' : 'repeat(2, minmax(0, 1fr))', gap: '10px' }}>
                        {[
                          { label: '出生年', value: form.birthYear, options: YEAR_OPTIONS, key: 'birthYear' as const },
                          { label: '出生月', value: form.birthMonth, options: MONTH_OPTIONS, key: 'birthMonth' as const },
                          { label: '出生日', value: form.birthDay, options: DAY_OPTIONS, key: 'birthDay' as const },
                          { label: '出生时', value: form.birthHour, options: HOUR_OPTIONS, key: 'birthHour' as const },
                        ].map(({ label, value, options, key }) => (
                          <div key={key}>
                            <label style={{ display: 'block', fontFamily: 'Outfit, sans-serif', fontSize: '10px', color: '#A0A8C0', marginBottom: '4px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</label>
                            <select
                              value={value}
                              onChange={e => setForm({ ...form, [key]: +e.target.value })}
                              style={{ width: '100%', padding: '10px 12px', fontSize: '13px', borderRadius: '12px', border: '1.5px solid #E8EAF6', background: 'linear-gradient(145deg, #FFFFFF, #F8F9FC)', outline: 'none', fontFamily: 'Outfit, sans-serif', color: '#1A1A2E', boxShadow: '0 6px 14px rgba(99,74,176,0.07)', transition: 'all 0.2s ease' }}
                              onFocus={e => { (e.target as HTMLElement).style.borderColor = PALETTE.coral; (e.target as HTMLElement).style.boxShadow = `0 0 0 3px ${PALETTE.coral}22, 0 10px 18px rgba(255,107,157,0.12)`; }}
                              onBlur={e => { (e.target as HTMLElement).style.borderColor = '#E8EAF6'; (e.target as HTMLElement).style.boxShadow = '0 6px 14px rgba(99,74,176,0.07)'; }}
                            >
                              {options.map(o => <option key={o} value={o}>{key === 'birthHour' ? `${o}:00` : o}</option>)}
                            </select>
                          </div>
                        ))}
                      </div>
                      <div>
                        <label style={{ display: 'block', fontFamily: 'Outfit, sans-serif', fontSize: '10px', color: '#A0A8C0', marginBottom: '6px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>性别</label>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                          {[{ v: 'male', l: '男 ♂', color: PALETTE.blue }, { v: 'female', l: '女 ♀', color: PALETTE.purple }].map(({ v, l, color }) => (
                            <button key={v} type="button"
                              onClick={() => setForm({ ...form, gender: v as 'male' | 'female' })}
                              style={{
                                padding: '10px', borderRadius: '12px', border: `2px solid ${form.gender === v ? color : '#E8EAF6'}`,
                                background: form.gender === v ? `${color}12` : 'linear-gradient(145deg, #FFFFFF, #FAFBFF)', cursor: 'pointer',
                                fontFamily: 'Outfit, sans-serif', fontSize: '13px', fontWeight: 600, color: form.gender === v ? color : '#A0A8C0',
                                transition: 'all 0.2s',
                                boxShadow: form.gender === v ? `0 8px 18px ${color}22` : '0 6px 12px rgba(99,74,176,0.06)',
                              }}
                            >{l}</button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label style={{ display: 'block', fontFamily: 'Outfit, sans-serif', fontSize: '10px', color: '#A0A8C0', marginBottom: '6px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>历法</label>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                          {[{ v: 'solar', l: '公历（新历）' }, { v: 'lunar', l: '农历（旧历）' }].map(({ v, l }) => (
                            <button key={v} type="button"
                              onClick={() => setForm({ ...form, calendarType: v as 'solar' | 'lunar' })}
                              style={{
                                padding: '10px', borderRadius: '12px', border: `2px solid ${form.calendarType === v ? PALETTE.coral : '#E8EAF6'}`,
                                background: form.calendarType === v ? `${PALETTE.coral}12` : 'linear-gradient(145deg, #FFFFFF, #FAFBFF)', cursor: 'pointer',
                                fontFamily: 'Outfit, sans-serif', fontSize: '12px', fontWeight: 600, color: form.calendarType === v ? PALETTE.coral : '#A0A8C0',
                                transition: 'all 0.2s',
                                boxShadow: form.calendarType === v ? `0 8px 18px ${PALETTE.coral}22` : '0 6px 12px rgba(99,74,176,0.06)',
                              }}
                            >{l}</button>
                          ))}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '10px', paddingTop: '4px' }}>
                        <button type="button" onClick={() => setShowForm(false)}
                          style={{
                            flex: 1, padding: '12px', fontFamily: 'Outfit, sans-serif', fontSize: '13px', fontWeight: 600,
                            background: 'linear-gradient(145deg, #FFFFFF, #F3F6FF)', border: '1.5px solid #E8EAF6', color: '#7F8AA8', borderRadius: '12px', cursor: 'pointer',
                            boxShadow: '0 8px 16px rgba(86,73,140,0.08)',
                          }}
                        >取消</button>
                        <button type="submit" disabled={submitting}
                          style={{
                            flex: 2, padding: '12px', fontFamily: 'Outfit, sans-serif', fontSize: '13px', fontWeight: 700,
                            background: `linear-gradient(135deg, ${PALETTE.coral}, ${PALETTE.orange})`,
                            border: 'none', color: '#FFFFFF', borderRadius: '12px', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                            boxShadow: `0 12px 24px ${PALETTE.coral}40`,
                            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                          }}
                        >
                          {submitting ? <Loader2 style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} /> : <Sparkle style={{ width: '14px', height: '14px' }} />}
                          {(form as any)._editingId ? '保存修改' : '录入生辰'}
                        </button>
                      </div>
                    </form>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
                <Loader2 style={{ width: '18px', height: '18px', color: PALETTE.coral, animation: 'spin 1s linear infinite' }} />
              </div>
            ) : records.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px 12px' }}>
                <div style={{
                  width: '44px', height: '44px', margin: '0 auto 10px', borderRadius: '12px',
                  background: `linear-gradient(135deg, ${PALETTE.coralLight}, ${PALETTE.orangeLight})`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Star style={{ width: '22px', height: '22px', color: PALETTE.coral }} />
                </div>
                <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '12px', color: '#A0A8C0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                  还没有记录，点击上方 + 新建
                  <Sparkles style={{ width: '12px', height: '12px', color: PALETTE.coral }} />
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px', scrollbarWidth: 'none' }}>
                {records.map(r => (
                  <motion.div
                    key={r.id}
                    onClick={() => selectRecord(r.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={e => e.key === 'Enter' && selectRecord(r.id)}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.96 }}
                    style={{
                      flexShrink: 0, width: '110px', padding: '12px 10px',
                      textAlign: 'center', borderRadius: '14px',
                      border: selectedId === r.id ? `2px solid ${PALETTE.coral}` : '1.5px solid #F0F1F8',
                      background: selectedId === r.id ? `${PALETTE.coral}08` : '#FFFFFF',
                      cursor: 'pointer', transition: UI_EASE, position: 'relative',
                      boxShadow: selectedId === r.id ? `0 12px 20px ${PALETTE.coral}2a` : '0 8px 14px rgba(86,73,140,0.08)',
                    }}
                  >
                    {/* 编辑按钮 — 左上角 */}
                    <div
                      onClick={(e) => { e.stopPropagation(); handleEdit(r); }}
                      onMouseDown={e => e.stopPropagation()}
                      title="编辑"
                      style={{
                        position: 'absolute', top: '5px', left: '5px',
                        width: '22px', height: '22px', borderRadius: '50%',
                        background: 'rgba(59,130,246,0.12)', border: 'none',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', zIndex: 3,
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(59,130,246,0.25)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'rgba(59,130,246,0.12)')}
                    >
                      <Edit3 style={{ width: '12px', height: '12px', color: '#3B82F6' }} />
                    </div>
                    {/* 删除按钮 — 右上角 */}
                    <div
                      onClick={(e) => { e.stopPropagation(); handleDelete(r.id); }}
                      onMouseDown={e => e.stopPropagation()}
                      title="删除"
                      style={{
                        position: 'absolute', top: '5px', right: '5px',
                        width: '22px', height: '22px', borderRadius: '50%',
                        background: 'rgba(239,68,68,0.12)', border: 'none',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', zIndex: 3,
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.25)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.12)')}
                    >
                      <Trash2 style={{ width: '11px', height: '11px', color: '#EF4444' }} />
                    </div>

                    <div style={{
                      width: '36px', height: '36px', margin: '0 auto 6px', borderRadius: '50%',
                      background: selectedId === r.id ? PALETTE.coral : `${PALETTE.coral}15`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <span style={{ fontFamily: 'Outfit', fontSize: '14px', fontWeight: 800, color: selectedId === r.id ? '#fff' : PALETTE.coral }}>
                        {r.name.charAt(0)}
                      </span>
                    </div>
                    <p style={{
                      fontFamily: 'Outfit, sans-serif', fontSize: '12px', fontWeight: 800,
                      color: selectedId === r.id ? PALETTE.coral : '#1A1A2E',
                      marginBottom: '2px',
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>{r.name}</p>
                    <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '10px', color: '#A0A8C0', lineHeight: 1.4 }}>
                      {r.birthYear}.{String(r.birthMonth).padStart(2,'0')}.{String(r.birthDay).padStart(2,'0')}
                    </p>
                    {selectedId === r.id && (
                      <div style={{
                        marginTop: '4px', paddingTop: '3px',
                        borderTop: `1px solid ${PALETTE.coralLight}`,
                        fontFamily: 'Outfit, sans-serif', fontSize: '10px', color: PALETTE.coral, fontWeight: 600,
                      }}>已选中 ✓</div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </motion.div>

        {/* 快捷导航：仅保留当前首页布局，不再提供「高级版」切换 */}
        {selectedRecord && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '18px',
              background: 'linear-gradient(165deg, rgba(236, 234, 240, 0.55) 0%, rgba(252, 251, 253, 0.95) 100%)',
              border: '1px solid rgba(110, 106, 120, 0.1)',
              boxShadow: '0 8px 22px rgba(62, 58, 72, 0.06)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              boxSizing: 'border-box',
              overflow: 'hidden',
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '8px',
              paddingLeft: '2px',
            }}>
              <span style={{
                fontFamily: 'Outfit, sans-serif',
                fontSize: '11px',
                fontWeight: 700,
                color: '#9490A0',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}>快捷导航</span>
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: navWideLayout ? 'repeat(4, minmax(0, 1fr))' : 'repeat(2, minmax(0, 1fr))',
              gap: navWideLayout ? '8px' : '6px',
              alignItems: 'stretch',
            }}
            >
            {([
              {
                id: 'mingpan-section',
                label: '命盘信息',
                icon: (s: number) => <Star style={{ width: s, height: s, strokeWidth: 2.1 }} />,
                iconBg: 'linear-gradient(150deg, #E8D5F9 0%, #D4B8F0 100%)',
                iconShadow: '0 6px 16px rgba(180, 120, 220, 0.15)',
                iconColor: '#8B5CF6',
                cardBg: 'linear-gradient(165deg, rgba(232, 213, 249, 0.35) 0%, rgba(250, 249, 251, 0.98) 58%, #FAFAF9 100%)',
                border: 'rgba(139, 92, 246, 0.18)',
                labelColor: '#7C3AED',
              },
              {
                id: 'fortune-section',
                label: '今日运势',
                icon: (s: number) => <Sparkles style={{ width: s, height: s, strokeWidth: 2.1 }} />,
                iconBg: 'linear-gradient(150deg, #FFD5E5 0%, #FFB8D0 100%)',
                iconShadow: '0 6px 16px rgba(255, 107, 157, 0.15)',
                iconColor: '#EC4899',
                cardBg: 'linear-gradient(165deg, rgba(255, 213, 229, 0.35) 0%, rgba(252, 249, 248, 0.98) 55%, #FAF8F7 100%)',
                border: 'rgba(236, 72, 153, 0.18)',
                labelColor: '#DB2777',
              },
              {
                id: 'outfit-section',
                label: '今日色彩搭配',
                icon: (s: number) => <Palette style={{ width: s, height: s, strokeWidth: 2.1 }} />,
                iconBg: 'linear-gradient(150deg, #FEF3C7 0%, #FDE68A 100%)',
                iconShadow: '0 6px 16px rgba(245, 158, 11, 0.15)',
                iconColor: '#D97706',
                cardBg: 'linear-gradient(165deg, rgba(254, 243, 199, 0.35) 0%, rgba(250, 249, 246, 0.98) 55%, #F9F8F5 100%)',
                border: 'rgba(217, 119, 6, 0.18)',
                labelColor: '#B45309',
              },
              {
                id: 'bracelet-section',
                label: '今日手串推荐',
                icon: (s: number) => <Gem style={{ width: s, height: s, strokeWidth: 2.1 }} />,
                iconBg: 'linear-gradient(150deg, #C7D2FE 0%, #A5B4FC 100%)',
                iconShadow: '0 6px 16px rgba(99, 102, 241, 0.15)',
                iconColor: '#4F46E5',
                cardBg: 'linear-gradient(165deg, rgba(199, 210, 254, 0.35) 0%, rgba(247, 249, 250, 0.98) 58%, #F7F8F9 100%)',
                border: 'rgba(79, 70, 229, 0.18)',
                labelColor: '#4338CA',
              },
            ] as const).map((item) => {
              const iconPx = navWideLayout ? 16 : 18;
              const boxPx = navWideLayout ? 38 : 42;
              return (
              <motion.button
                key={item.id}
                whileHover={{ y: -1, boxShadow: '0 10px 22px rgba(62, 58, 68, 0.07)' }}
                whileTap={{ scale: 0.97 }}
                onClick={() => jumpToCard(item.id)}
                style={{
                  width: '100%',
                  minWidth: 0,
                  border: `1px solid ${item.border}`,
                  background: item.cardBg,
                  borderRadius: navWideLayout ? '999px' : '16px',
                  padding: navWideLayout ? '10px 12px' : '12px 8px',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: navWideLayout ? 'row' : 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: navWideLayout ? '10px' : '8px',
                  fontFamily: 'Outfit, sans-serif',
                  fontSize: navWideLayout ? '12px' : '10px',
                  fontWeight: 700,
                  color: item.labelColor,
                  boxShadow: '0 6px 18px rgba(62, 58, 68, 0.05)',
                  transition: UI_EASE,
                  lineHeight: navWideLayout ? 1.2 : 1.25,
                  textAlign: 'center',
                }}
              >
                <span
                  style={{
                    width: boxPx,
                    height: boxPx,
                    borderRadius: navWideLayout ? '14px' : '14px',
                    background: item.iconBg,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    boxShadow: item.iconShadow,
                    border: '1px solid rgba(255,255,255,0.55)',
                  }}
                >
                  <span style={{ color: item.iconColor, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {item.icon(iconPx)}
                  </span>
                </span>
                <span style={{ display: 'block', flex: navWideLayout ? 1 : undefined, minWidth: 0 }}>{item.label}</span>
              </motion.button>
              );
            })}
            </div>
          </motion.div>
        )}

        {/* ​—​ 第二行：用户详情 + 命盘信息 + 今日运势（选中用户时显示） —​ */}
        {selectedRecord && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.08 }}
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr',
              gap: '12px',
              marginBottom: '16px',
              alignItems: 'start',
            }}
            className="md:flex-row"
          >


          {/* 命盘信息卡片 */}
          {selectedRecord && previewInfo && previewInfo.baziResult ? (
            <div id="mingpan-section" style={{
              flex: 1,
              background: 'linear-gradient(145deg, rgba(91,92,255,0.11) 0%, rgba(44,203,255,0.08) 42%, rgba(255,255,255,0.95) 100%)', borderRadius: '24px', padding: navWideLayout ? '20px' : '14px',
              boxShadow: '0 16px 30px rgba(74,86,152,0.14)', border: '1px solid rgba(91,92,255,0.22)',
              backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
              display: 'flex', flexDirection: 'column',
              overflow: 'hidden',
              minWidth: 0,
              maxWidth: '100%',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: navWideLayout ? '16px' : '12px' }}>
                <div style={{
                  width: navWideLayout ? '26px' : '22px', height: navWideLayout ? '26px' : '22px', borderRadius: '8px',
                  background: `linear-gradient(135deg, ${PALETTE.purple}20, ${PALETTE.blue}20)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Star style={{ width: navWideLayout ? '14px' : '12px', height: navWideLayout ? '14px' : '12px', color: PALETTE.purple }} />
                </div>
                <div>
                  <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: navWideLayout ? '14px' : '13px', fontWeight: 800, color: '#1A1A2E' }}>命盘信息</span>
                  <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '10px', color: '#959CC0', margin: '2px 0 0' }}>核心命盘</p>
                </div>
              </div>

              {/* 日主属性 - 重点显示 */}
              {(() => {
                const dmEl = previewInfo.baziResult.dayMasterElement || 'earth';
                const elementNames: Record<string, string> = { wood: '木', fire: '火', earth: '土', metal: '金', water: '水' };
                const elementColors: Record<string, string> = { wood: PALETTE.green, fire: '#FF6B6B', earth: '#D4A000', metal: '#7B8FA8', water: '#00A8E8' };
                const elementDesc: Record<string, string> = {
                  wood: '木命人仁慈温和，富有创造力和同情心，适合文化创意、教育、农业等行业。',
                  fire: '火命人热情奔放，积极进取，适合销售、演讲、政治、娱乐等行业。',
                  earth: '土命人稳重踏实，诚实守信，适合建筑、农业、管理、仓储等行业。',
                  metal: '金命人果断坚定，正义感强，适合金融、科技、法律、外交等行业。',
                  water: '水命人聪明灵活，适应力强，适合贸易、物流、媒体、服务等行业。',
                };
                const mingGeDesc: Record<string, string> = {
                  wood: '木气旺盛，创造力强，需火来生土，土来生金，金来生水，水来生木，形成流通。',
                  fire: '火势猛烈，行动力强，需土来泄火之气，金来助身，水来制火，木来生火相助。',
                  earth: '土气厚重，稳定性强，需金来生水，水来生木，木来生火，火来生土相生。',
                  metal: '金气清刚，决策力强，需土来生金，水来木来生木，木来生火，火来制金。',
                  water: '水气流通，智慧性强，需金来生水，火来水来温养，木来生火，火来水制。',
                };
                return (
                  <div style={{
                    padding: navWideLayout ? '14px' : '12px', borderRadius: '16px',
                    background: `linear-gradient(145deg, ${elementColors[dmEl]}14, ${elementColors[dmEl]}08)`, border: `1px solid ${elementColors[dmEl]}30`,
                    marginBottom: '14px',
                    boxShadow: `0 10px 22px ${elementColors[dmEl]}20`,
                    overflow: 'hidden',
                    minWidth: 0,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                      <span style={{
                        padding: '4px 12px', borderRadius: '8px',
                        background: elementColors[dmEl],
                        fontFamily: 'Outfit', fontSize: navWideLayout ? '14px' : '12px', fontWeight: 800, color: '#fff',
                      }}>
                        {(previewInfo.baziResult as any).dayPillar}
                      </span>
                      <div>
                        <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: navWideLayout ? '13px' : '12px', fontWeight: 700, color: elementColors[dmEl], margin: 0 }}>
                          日主{elementNames[dmEl]}命
                        </p>
                        <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '10px', color: '#A0A8C0', margin: 0 }}>
                          {previewInfo.baziResult.dayMaster || dmEl}属性
                        </p>
                      </div>
                    </div>
                    <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: navWideLayout ? '11px' : '10px', color: '#6B7280', lineHeight: 1.5, marginBottom: '8px', overflow: 'hidden' }}>
                      {elementDesc[dmEl]}
                    </p>
                    {renderStyleGuideTriplet(
                      `以${elementNames[dmEl]}元素为主轴，穿搭优先同色系渐变过渡。`,
                      '避免冷暖高饱和色同时抢主角，防止气场分散。',
                      '用一件金属或珠光配饰收束视觉，整体更显高级。',
                      { primary: elementColors[dmEl], avoid: PALETTE.coral, upgrade: PALETTE.purple, border: `${elementColors[dmEl]}2A` },
                    )}

                  </div>
                );
              })()}

              {/* 五行分布 - 横向进度条 */}
              {previewInfo.fiveElements && (
                (() => {
                  const fe = previewInfo.fiveElements;
                  const elements = [
                    { key: 'wood',  name: '木', color: '#4CAF50' },
                    { key: 'fire',  name: '火', color: '#FF5252' },
                    { key: 'earth', name: '土', color: '#FFC107' },
                    { key: 'metal', name: '金', color: '#90A4AE' },
                    { key: 'water', name: '水', color: '#42A5F5' },
                  ];
                  const vals = elements.map(el => (fe[el.key as keyof typeof fe] as number) || 0);
                  const total = vals.reduce((a, b) => a + b, 0) || 1;
                  const pcts = vals.map(v => Math.round((v / total) * 100));
                  // 确保合计=100（调整最大项误差）
                  const diff = 100 - pcts.reduce((a, b) => a + b, 0);
                  if (diff !== 0) {
                    const maxIdx = pcts.indexOf(Math.max(...pcts));
                    pcts[maxIdx] += diff;
                  }
                  const elementNames: Record<string, string> = { wood: '木', fire: '火', earth: '土', metal: '金', water: '水' };
                  return (
                    <div style={{ marginBottom: '10px', minWidth: 0, overflow: 'hidden' }}>
                      {/* 标题行 */}
                      <div style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        marginBottom: '8px',
                        flexWrap: 'wrap',
                        gap: '4px',
                      }}>
                        <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '13px', fontWeight: 700, color: '#333' }}>
                          五行分布
                        </span>
                        <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '10px', color: '#888', flexShrink: 0 }}>
                          {elements.map((el, i) => `${el.name}:${vals[i]}`).join(' ')}
                        </span>
                      </div>

                      {/* 横向分段进度条 */}
                      <div style={{
                        display: 'flex', width: '100%', height: '12px',
                        borderRadius: '5px', overflow: 'hidden', gap: '1px',
                        boxShadow: 'inset 0 1px 3px rgba(44,31,90,0.15)',
                      }}>
                        {elements.map((el, i) => pcts[i] > 0 && (
                          <div key={el.key} style={{
                            width: `${pcts[i]}%`,
                            background: el.color,
                            borderRadius: i === 0 ? '5px 0 0 5px' : i === elements.length - 1 ? '0 5px 5px 0' : '0',
                            transition: 'width 0.6s ease',
                          }} />
                        ))}
                      </div>

                      {/* 图例 */}
                      <div style={{
                        display: 'flex', gap: '12px', marginTop: '8px', flexWrap: 'wrap',
                      }}>
                        {elements.map((el, i) => (
                          <div key={el.key} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <div style={{
                              width: '8px', height: '8px', borderRadius: '50%',
                              background: el.color, flexShrink: 0,
                            }} />
                            <span style={{
                              fontFamily: 'Outfit, sans-serif', fontSize: '12px',
                              color: '#555', fontWeight: 500,
                            }}>{el.name}</span>
                          </div>
                        ))}
                      </div>

                      {/* 喜用神标签 */}
                      {(previewInfo.favorableElements || [])?.length > 0 && (
                        <div style={{
                          marginTop: '8px', padding: '5px 12px', borderRadius: '999px',
                          background: `linear-gradient(135deg, ${PALETTE.coral}18, ${PALETTE.orange}16)`, border: `1px solid ${PALETTE.coral}32`,
                          display: 'inline-block',
                          boxShadow: `0 6px 12px ${PALETTE.coral}22`,
                        }}>
                          <span style={{
                            fontFamily: 'Outfit', fontSize: '12px', fontWeight: 700,
                            color: '#5D4037',
                          }}>
                            喜用：{previewInfo.favorableElements?.map(
                              (e: string) => elementNames[e] || e).join(' · ')}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })()
              )}

              {/* Native button + hash fallback: framer motion buttons can fail to fire click on some mobile WebViews */}
              <button
                type="button"
                onClick={() => {
                  const id = selectedRecord?.id?.trim();
                  if (!id) return;
                  window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
                  window.location.hash = `#/result/${encodeURIComponent(id)}`;
                }}
                style={{
                  width: '100%', padding: '12px',
                  borderRadius: '14px',
                  background: `linear-gradient(135deg, ${PALETTE.coral}, ${PALETTE.orange}, ${PALETTE.yellow})`,
                  border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  fontFamily: 'Outfit, sans-serif', fontSize: '13px', fontWeight: 700, color: '#FFFFFF',
                  boxShadow: `0 14px 26px ${PALETTE.coral}4A`,
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  boxSizing: 'border-box',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent',
                  position: 'relative',
                  zIndex: 2,
                }}
              >
                <TrendingUp style={{ width: '15px', height: '15px' }} />
                查看详细分析报告
                <ArrowRight style={{ width: '14px', height: '14px' }} />
              </button>
            </div>
          ) : (
            selectedRecord && (
              <div style={{
                background: 'linear-gradient(155deg, rgba(255,255,255,0.95), rgba(255,255,255,0.85))', borderRadius: '24px', padding: '32px 20px',
                boxShadow: '0 14px 30px rgba(78,58,142,0.12)', border: `1px solid ${PALETTE.coral}22`, textAlign: 'center',
                backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
              }}>
                <Loader2 style={{ width: '22px', height: '22px', color: PALETTE.coral, animation: 'spin 1s linear infinite', margin: '0 auto 10px' }} />
                <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '12px', color: '#A0A8C0' }}>正在加载命盘信息…</p>
              </div>
            )
          )}
          {/* 今日运势 - 第一行第三列 */}
          {dailyFortune && (
            <div id="fortune-section" style={{
              flex: 1,
              background: 'linear-gradient(145deg, rgba(255,92,168,0.1) 0%, rgba(91,92,255,0.1) 42%, rgba(255,255,255,0.95) 100%)', borderRadius: '24px', padding: navWideLayout ? '20px' : '14px',
              boxShadow: '0 16px 30px rgba(74,86,152,0.14)', border: '1px solid rgba(255,92,168,0.2)',
              backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
              display: 'flex', flexDirection: 'column',
              overflow: 'hidden',
              minWidth: 0,
              maxWidth: '100%',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: navWideLayout ? '18px' : '12px' }}>
                <div style={{
                  width: navWideLayout ? '32px' : '28px', height: navWideLayout ? '32px' : '28px', borderRadius: '10px', flexShrink: 0,
                  background: `linear-gradient(135deg, ${PALETTE.coral}, ${PALETTE.orange})`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: `0 3px 10px rgba(255,107,157,0.3)`,
                }}>
                  <Sparkles style={{ width: navWideLayout ? '16px' : '14px', height: navWideLayout ? '16px' : '14px', color: '#FFFFFF' }} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'baseline', flexWrap: 'wrap', gap: '4px' }}>
                    <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: navWideLayout ? '15px' : '14px', fontWeight: 800, color: '#1A1A2E' }}>今日运势</span>
                    <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: navWideLayout ? '12px' : '10px', color: '#A0A8C0' }}>
                      {new Date().getMonth() + 1}月{new Date().getDate()}日
                    </span>
                  </div>
                  <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '10px', color: '#8F97B5', margin: '2px 0 0' }}>当日能量总览</p>
                </div>
              </div>
              {renderInsightBlock(
                '今日运势主张',
                `总分 ${dailyFortune.totalScore}，建议采用「主色稳定 + 局部提亮」策略，先稳节奏再放表现力。`,
                {
                  title: PALETTE.coral,
                  border: `${PALETTE.orange}30`,
                  background: `linear-gradient(135deg, ${PALETTE.coral}12, ${PALETTE.orange}10, #FFFFFF)`,
                },
                { marginBottom: '10px' },
              )}

              {/* ===== 新布局：左圆环 + 右侧2x2网格 + 底部4卡片 + 宜不宜 + 提示 ===== */}
              
              {/* ===== 顶部：总分圆环(居中,加大) ===== */}
              <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                marginBottom: '10px', padding: '6px 0'
              }}>
                <svg width={navWideLayout ? 86 : 72} height={navWideLayout ? 86 : 72} viewBox="0 0 72 72" style={{ display: 'block' }}>
                  <circle cx="36" cy="36" r="30" fill="none" stroke="#F0E8E5" strokeWidth="7" />
                  <circle cx="36" cy="36" r="30" fill="none"
                    stroke={getScoreColor(dailyFortune.totalScore)} strokeWidth="7"
                    strokeDasharray={`${(dailyFortune.totalScore / 100) * 188.5} 188.5`}
                    strokeLinecap="round" transform="rotate(-90 36 36)" />
                  <text x="36" y="33" textAnchor="middle" dominantBaseline="middle"
                    style={{ fontFamily: 'Outfit', fontSize: navWideLayout ? '22px' : '20px', fontWeight: 900, fill: getScoreColor(dailyFortune.totalScore) }}>{dailyFortune.totalScore}</text>
                  <text x="36" y="50" textAnchor="middle" dominantBaseline="middle"
                    style={{ fontFamily: 'Outfit', fontSize: '10px', fill: '#B0A8C0' }}>总分</text>
                </svg>
                <span style={{ fontFamily: 'Outfit', fontSize: '12px', color: getScoreColor(dailyFortune.totalScore), fontWeight: 700, marginTop: '2px' }}>{dailyFortune.totalLabel}</span>
              </div>

              {/* ===== 六宫格：事业/财运/感情/健康/人际/专注（3行×2列） ===== */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '8px' }}>
                {[
                  { label: '事业', score: dailyFortune.careerScore, icon: TrendingUpIcon, desc: dailyFortune.relationDescription?.slice(0, 18), color: PALETTE.coral },
                  { label: '财运', score: dailyFortune.wealthScore, icon: Sparkles, desc: getDimensionDesc('wealth', dailyFortune.dayRelation || '', dailyFortune.wealthScore)?.slice(0, 18), color: '#F59E0B' },
                  { label: '感情', score: dailyFortune.loveScore, icon: Heart, desc: getDimensionDesc('love', dailyFortune.dayRelation || '', dailyFortune.loveScore)?.slice(0, 18), color: PALETTE.coral },
                  { label: '健康', score: dailyFortune.healthScore, icon: Apple, desc: getDimensionDesc('health', dailyFortune.dayRelation || '', dailyFortune.healthScore)?.slice(0, 18), color: '#22C55E' },
                  { label: '人际', score: dailyFortune.socialScore ?? Math.round((dailyFortune.careerScore + dailyFortune.loveScore) / 2), icon: Users, desc: '人缘佳，利于社交合作', color: '#8B5CF6' },
                  { label: '专注', score: dailyFortune.studyScore ?? Math.round((dailyFortune.careerScore + dailyFortune.healthScore) / 2), icon: BookOpen, desc: '思路清晰，适合深度工作', color: '#0EA5E9' },
                ].map(d => (
                  <div key={d.label} style={{
                    padding: navWideLayout ? '10px 12px' : '8px 10px', borderRadius: '12px',
                    background: `${getScoreColor(d.score)}08`, border: `1px solid ${getScoreColor(d.score)}15`,
                    display: 'flex', flexDirection: 'column',
                    minWidth: 0,
                    overflow: 'hidden',
                  }}>
                    {/* 标题行：图标+名称 */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '3px' }}>
                      <d.icon style={{ width: navWideLayout ? '13px' : '12px', height: navWideLayout ? '13px' : '12px', color: d.color }} />
                      <p style={{ fontFamily: 'Outfit', fontSize: navWideLayout ? '12px' : '11px', fontWeight: 700, color: '#555' }}>{d.label}</p>
                    </div>
                    {/* 分数 */}
                    <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: '3px' }}>
                      <p style={{ fontFamily: 'Outfit', fontSize: navWideLayout ? '22px' : '18px', fontWeight: 900, color: getScoreColor(d.score), lineHeight: 1 }}>{d.score}</p>
                    </div>
                    {/* 描述文字 */}
                    <p style={{ fontFamily: 'Outfit', fontSize: navWideLayout ? '10px' : '9px', color: '#999', lineHeight: 1.35, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.desc}</p>
                  </div>
                ))}
              </div>

              {/* 4个幸运信息卡片：等高对齐，均匀分布(flex) */}
              <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
                {/* 幸运色 */}
                <div style={{
                  flex: 1, minHeight: '68px',
                  padding: '8px 5px', borderRadius: '10px',
                  background: `linear-gradient(135deg, #FF6B9D06, #FF6B9D02)`, border: '1px solid #FF6B9D12',
                  textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center'
                }}>
                  <div style={{
                    width: '26px', height: '26px', borderRadius: '6px', marginBottom: '3px',
                    background: dailyFortune.luckyColor.hex,
                    boxShadow: '0 1.5px 6px rgba(255,107,157,0.22)',
                  }} />
                  <p style={{ fontFamily: 'Outfit', fontSize: '10px', fontWeight: 700, color: '#555', lineHeight: 1.2 }}>幸运色</p>
                  <p style={{ fontFamily: 'Outfit', fontSize: '10.5px', fontWeight: 800, color: '#00C47A' }}>{dailyFortune.luckyColor.name}</p>
                </div>
                {/* 幸运数字 */}
                <div style={{
                  flex: 1, minHeight: '68px',
                  padding: '8px 5px', borderRadius: '10px',
                  background: `linear-gradient(135deg, #FF6B9D06, #FF6B9D02)`, border: '1px solid #FF6B9D12',
                  textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center'
                }}>
                  <p style={{ fontFamily: 'Outfit', fontSize: '21px', fontWeight: 900, color: '#FF6B9D', lineHeight: 1.1, marginBottom: '2px' }}>{dailyFortune.luckyNumber}</p>
                  <p style={{ fontFamily: 'Outfit', fontSize: '10px', fontWeight: 700, color: '#555', lineHeight: 1.2 }}>幸运数字</p>
                </div>
                {/* 吉时 */}
                <div style={{
                  flex: 1, minHeight: '68px',
                  padding: '8px 5px', borderRadius: '10px',
                  background: `linear-gradient(135deg, #00C47A06, #00C47A02)`, border: '1px solid #00C47A12',
                  textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center'
                }}>
                  <Clock style={{ width: '16px', height: '16px', color: '#999', marginBottom: '2px' }} />
                  <p style={{ fontFamily: 'Outfit', fontSize: '10px', fontWeight: 700, color: '#555', lineHeight: 1.2 }}>吉时</p>
                  <p style={{ fontFamily: 'Outfit', fontSize: '10px', fontWeight: 800, color: '#00C47A' }}>{timeToBeijing(dailyFortune.luckyTime.split('·')[0])}</p>
                </div>
                {/* 吉祥方位 */}
                <div style={{
                  flex: 1, minHeight: '68px',
                  padding: '8px 5px', borderRadius: '10px',
                  background: `linear-gradient(135deg, #00A8E806, #00A8E802)`, border: '1px solid #00A8E812',
                  textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center'
                }}>
                  <Compass style={{ width: '16px', height: '16px', color: '#999', marginBottom: '2px' }} />
                  <p style={{ fontFamily: 'Outfit', fontSize: '10px', fontWeight: 700, color: '#555', lineHeight: 1.2 }}>吉祥方位</p>
                  <p style={{ fontFamily: 'Outfit', fontSize: '10px', fontWeight: 800, color: '#FF6B9D' }}>{dailyFortune.avoidDirection.split('·')[0]}<span style={{ fontSize: '9px', color: '#AAA', marginLeft: '2px' }}>({dailyFortune.relationDescription.slice(0, 2)})</span></p>
                </div>
              </div>

              {/* 小吉日提示（精简） */}
              <div style={{
                padding: '7px 12px', marginBottom: '8px',
                background: `${getScoreColor(dailyFortune.totalScore)}0D`,
                borderRadius: '10px',
                border: `1px solid ${getScoreColor(dailyFortune.totalScore)}14`,
                display: 'flex', alignItems: 'center', gap: '6px',
              }}>
                <Lightbulb style={{ width: '13px', height: '13px', color: getScoreColor(dailyFortune.totalScore), flexShrink: 0 }} />
                <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '11px', color: '#777', lineHeight: 1.45, flex: 1 }}>{dailyFortune.mainTip}</span>
                <span style={{ fontFamily: 'Outfit', fontSize: '9.5px', color: getScoreColor(dailyFortune.totalScore), opacity: 0.55, whiteSpace: 'nowrap', flexShrink: 0 }}>{dailyFortune.totalLabel}</span>
              </div>

              {/* 宜/不宜事项（保留，精简间距） */}
              <div style={{ display: 'flex', flexDirection: 'row', gap: '6px', minWidth: 0 }}>
                <div style={{ flex: 1, padding: '7px 10px', borderRadius: '10px', background: `${PALETTE.green}08`, border: `1px solid ${PALETTE.green}20`, display: 'flex', alignItems: 'center', gap: '5px', minWidth: 0 }}>
                  <Check style={{ width: '11px', height: '11px', color: PALETTE.green, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontFamily: 'Outfit', fontSize: '12px', fontWeight: 700, color: PALETTE.green, marginBottom: '1.5px' }}>宜</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px' }}>
                      {dailyFortune.goodThings.slice(0, 3).map((g: string) => (
                        <span key={g} style={{ padding: '1px 5px', borderRadius: '4px', background: `${PALETTE.green}12`, fontFamily: 'Outfit', fontSize: navWideLayout ? '11px' : '10px', color: PALETTE.green }}>{g}</span>
                      ))}
                    </div>
                  </div>
                </div>
                <div style={{ flex: 1, padding: '7px 10px', borderRadius: '10px', background: `${PALETTE.coral}08`, border: `1px solid ${PALETTE.coral}20`, display: 'flex', alignItems: 'center', gap: '5px', minWidth: 0 }}>
                  <X style={{ width: '11px', height: '11px', color: PALETTE.coral, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontFamily: 'Outfit', fontSize: '12px', fontWeight: 700, color: PALETTE.coral, marginBottom: '1.5px' }}>不宜</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px' }}>
                      {dailyFortune.avoidThings.slice(0, 3).map((a: string) => (
                        <span key={a} style={{ padding: '1px 5px', borderRadius: '4px', background: `${PALETTE.coral}12`, fontFamily: 'Outfit', fontSize: navWideLayout ? '11px' : '10px', color: PALETTE.coral }}>{a}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          </motion.div>        )}
        {/* ​—​ 第三行：今日穿搭 + 手串推荐（选中用户时显示） —​ */}
        {/* ── 右栏：今日穿搭 + 手串 ── */}
        {selectedRecord && previewInfo && previewInfo.baziResult && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }} style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'stretch' }}>

            {/* 今日色彩搭配建议卡片 */}
            {outfitRec && (
            <div id="outfit-section" style={{
              flex: 1,
              background: `linear-gradient(140deg, ${PALETTE.coral}0D 0%, ${PALETTE.orange}0A 35%, #FFFFFF 100%)`,
              borderRadius: '22px', padding: '18px',
              boxShadow: '0 12px 30px rgba(255,107,157,0.12)',
              border: `1px solid ${PALETTE.coral}22`,
              display: 'flex', flexDirection: 'column',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '12px', flexShrink: 0,
                    background: `linear-gradient(135deg, ${PALETTE.coral}, ${PALETTE.orange})`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: `0 4px 12px rgba(255,107,157,0.35)`,
                    animation: 'dopaminePulse 2.8s ease-in-out infinite',
                  }}>
                    <Palette style={{ width: '18px', height: '18px', color: '#FFFFFF' }} />
                  </div>
                  <div>
                    <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '15px', fontWeight: 900, color: '#1A1A2E' }}>今日色彩搭配</span>
                    <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '11px', color: '#8F97B5', marginLeft: '6px' }}>多巴胺精选</span>
                    <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '10px', color: '#A0A8C0', margin: '2px 0 0' }}>渐变质感配色，按场景自动推荐</p>
                  </div>
                  <motion.button
                    onClick={() => setActiveTab(activeTab === 'outfit' ? null : 'outfit')}
                    whileHover={{ y: -2, scale: 1.02 }}
                    whileTap={{ y: 0, scale: 0.97 }}
                    style={{
                      marginLeft: 'auto', padding: '5px 12px', borderRadius: '20px',
                      background: activeTab === 'outfit' ? `linear-gradient(135deg, ${PALETTE.coral}, ${PALETTE.orange})` : 'rgba(255,107,157,0.08)',
                      border: `1.5px solid ${activeTab === 'outfit' ? PALETTE.coral : 'rgba(255,107,157,0.2)'}`,
                      cursor: 'pointer', fontFamily: 'Outfit, sans-serif', fontSize: '11px',
                      fontWeight: 600, color: activeTab === 'outfit' ? '#FFF' : PALETTE.coral, transition: UI_EASE,
                      boxShadow: activeTab === 'outfit' ? `0 10px 20px ${PALETTE.coral}3a` : `0 6px 12px ${PALETTE.coral}1a`,
                    }}
                  >
                    {activeTab === 'outfit' ? '收起' : '查看详情'}
                    {activeTab === 'outfit' ? <ChevronUp style={{ width: '12px', height: '12px', marginLeft: '4px', display: 'inline' }} /> : <ChevronDown style={{ width: '12px', height: '12px', marginLeft: '4px', display: 'inline' }} />}
                  </motion.button>
                </div>
                {renderInsightBlock(
                  '今日配色主张',
                  `今日以「${(outfitRec as any)?.weatherInfo?.wuxing || '平衡五行'}」为配色主线：先定主色，再用一件点缀色提升层次，避免堆叠过多高饱和颜色。`,
                  {
                    title: PALETTE.coral,
                    border: `${PALETTE.coral}1F`,
                    background: `linear-gradient(135deg, ${PALETTE.coral}12, ${PALETTE.orange}10, #FFFFFF)`,
                  },
                  { marginBottom: '10px' },
                )}

                {/* 场景快速预览 - 2x2 网格 */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {(() => {
                    const scenes = (outfitRec as any).sceneRecommendations || [];
                    const elementColors: Record<string, string> = {
                      wood: '#4CAF50', fire: '#FF5252', earth: '#FFC107', metal: '#78909C', water: '#42A5F5',
                    };
                    const elementNames: Record<string, string> = {
                      wood: '木', fire: '火', earth: '土', metal: '金', water: '水',
                    };
                    const colorMap: Record<string, { bg: string; text: string; shadow: string }> = {
                      '深蓝': { bg: 'linear-gradient(135deg, #1E3A5F, #2F5D8A)', text: '#FFFFFF', shadow: 'rgba(30,58,95,0.28)' },
                      '白色': { bg: 'linear-gradient(135deg, #FFFFFF, #ECEFF4)', text: '#374151', shadow: 'rgba(203,213,225,0.42)' },
                      '灰色': { bg: 'linear-gradient(135deg, #6B7280, #9CA3AF)', text: '#FFFFFF', shadow: 'rgba(107,114,128,0.28)' },
                      '黑色': { bg: 'linear-gradient(135deg, #1F2937, #374151)', text: '#FFFFFF', shadow: 'rgba(17,24,39,0.32)' },
                      '墨绿': { bg: 'linear-gradient(135deg, #14532D, #1F8A4C)', text: '#FFFFFF', shadow: 'rgba(20,83,45,0.3)' },
                      '浅蓝': { bg: 'linear-gradient(135deg, #7DD3FC, #38BDF8)', text: '#0C4A6E', shadow: 'rgba(56,189,248,0.32)' },
                      '卡其': { bg: 'linear-gradient(135deg, #D1B893, #C4A77D)', text: '#422006', shadow: 'rgba(163,129,83,0.26)' },
                      '酒红': { bg: 'linear-gradient(135deg, #7F1D1D, #B91C1C)', text: '#FFFFFF', shadow: 'rgba(127,29,29,0.3)' },
                      '金色': { bg: 'linear-gradient(135deg, #CA8A04, #F59E0B)', text: '#FFFFFF', shadow: 'rgba(202,138,4,0.32)' },
                      '银色': { bg: 'linear-gradient(135deg, #CBD5E1, #94A3B8)', text: '#1F2937', shadow: 'rgba(148,163,184,0.3)' },
                      '红色': { bg: 'linear-gradient(135deg, #EF4444, #F87171)', text: '#FFFFFF', shadow: 'rgba(239,68,68,0.28)' },
                      '绿色': { bg: 'linear-gradient(135deg, #16A34A, #4ADE80)', text: '#FFFFFF', shadow: 'rgba(22,163,74,0.26)' },
                      '棕色': { bg: 'linear-gradient(135deg, #92400E, #C2410C)', text: '#FFFFFF', shadow: 'rgba(146,64,14,0.3)' },
                      '蓝色': { bg: 'linear-gradient(135deg, #2563EB, #60A5FA)', text: '#FFFFFF', shadow: 'rgba(37,99,235,0.28)' },
                      '橙色': { bg: 'linear-gradient(135deg, #EA580C, #FB923C)', text: '#FFFFFF', shadow: 'rgba(234,88,12,0.3)' },
                      '粉色': { bg: 'linear-gradient(135deg, #EC4899, #F472B6)', text: '#FFFFFF', shadow: 'rgba(236,72,153,0.3)' },
                      '紫色': { bg: 'linear-gradient(135deg, #9333EA, #C084FC)', text: '#FFFFFF', shadow: 'rgba(147,51,234,0.3)' },
                      '黄色': { bg: 'linear-gradient(135deg, #FACC15, #FDE047)', text: '#422006', shadow: 'rgba(250,204,21,0.34)' },
                      '珊瑚粉橙': { bg: `linear-gradient(135deg, ${PALETTE.coral}, ${PALETTE.orange})`, text: '#FFFFFF', shadow: 'rgba(255,107,157,0.3)' },
                      '琥珀橙': { bg: `linear-gradient(135deg, ${PALETTE.orange}, ${PALETTE.yellow})`, text: '#FFFFFF', shadow: 'rgba(255,157,107,0.32)' },
                      '天空蓝': { bg: `linear-gradient(135deg, ${PALETTE.blue}, #7DD3FC)`, text: '#FFFFFF', shadow: 'rgba(107,212,255,0.32)' },
                    };
                    const renderColorSuggestion = (text: string) => {
                      let colorKey = '';
                      let colorInfo: { bg: string; text: string } | null = null;
                      for (const key of Object.keys(colorMap)) {
                        if (text.includes(key)) {
                          colorKey = key;
                          colorInfo = colorMap[key];
                          break;
                        }
                      }
                      if (colorInfo) {
                        const parts = text.split(colorKey);
                        return (
                          <>
                            {parts[0]}
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              padding: '2px 10px',
                              borderRadius: '999px',
                              background: colorInfo.bg,
                              color: colorInfo.text,
                              fontWeight: 700,
                              fontSize: '10px',
                              margin: '0 2px',
                              boxShadow: `0 6px 12px ${(colorInfo as any).shadow || 'rgba(91,92,255,0.25)'}`,
                              border: '1px solid rgba(255,255,255,0.35)',
                            }}>
                              {colorKey}
                            </span>
                            {parts[1]}
                          </>
                        );
                      }
                      return text;
                    };
                    const getSceneIconSmall = (iconStr: string) => {
                      switch(iconStr) {
                        case 'briefcase': return <Briefcase style={{ width: '12px', height: '12px' }} />;
                        case 'shirt': return <ShirtIcon style={{ width: '12px', height: '12px' }} />;
                        case 'party': return <PartyPopper style={{ width: '12px', height: '12px' }} />;
                        case 'gift': return <Gift style={{ width: '12px', height: '12px' }} />;
                        default: return <Sparkles style={{ width: '12px', height: '12px' }} />;
                      }
                    };
                    const renderScenePreviewCard = (scene: any) => {
                      const colors = (scene.colors && scene.colors.length > 0) ? scene.colors : ['纯色系服装', '简约配色'];
                      return (
                        <div key={scene.id} style={{
                          padding: '10px', borderRadius: '14px',
                          background: `linear-gradient(145deg, #FFFFFF, ${scene.accentColor}08)`,
                          border: `1px solid ${scene.accentColor}20`,
                          boxShadow: `0 8px 16px ${scene.accentColor}18`,
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                            <div style={{
                              width: '24px', height: '24px', borderRadius: '8px',
                              background: `linear-gradient(135deg, ${scene.accentColor}, ${scene.accentColor}99)`,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              color: '#FFFFFF',
                            }}>
                              {getSceneIconSmall(scene.icon)}
                            </div>
                            <span style={{
                              fontFamily: 'Outfit', fontSize: '11px', fontWeight: 700,
                              color: scene.accentColor,
                            }}>{scene.label}</span>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginBottom: '6px', minHeight: '36px' }}>
                            {colors.slice(0, 2).map((color: string, i: number) => (
                              <span key={i} style={{
                                fontFamily: 'Outfit', fontSize: '10px', color: '#666',
                                lineHeight: 1.4,
                              }}>
                                {renderColorSuggestion(color)}
                              </span>
                            ))}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <div style={{
                              width: '8px', height: '8px', borderRadius: '50%',
                              background: elementColors[scene.element],
                              boxShadow: `0 0 4px ${elementColors[scene.element]}60`,
                            }} />
                            <span style={{
                              fontFamily: 'Outfit', fontSize: '10px',
                              color: elementColors[scene.element], fontWeight: 600,
                            }}>{elementNames[scene.element]}属性</span>
                            <span style={{
                              marginLeft: 'auto',
                              fontFamily: 'Outfit',
                              fontSize: '9px',
                              color: '#A0A8C0',
                              letterSpacing: '0.2px',
                            }}>高级渐变感</span>
                          </div>
                        </div>
                      );
                    };
                    return scenes.slice(0, 4).map((scene: any) => {
                      return renderScenePreviewCard(scene);
                    });
})()}
                </div>

                {/* 今日色彩详情展开 - 移入卡片内部 */}
                {activeTab === 'outfit' && outfitRec && (
                  <div style={{ marginTop: '12px', background: 'linear-gradient(155deg, #FFFFFF, #FFF8F9)', borderRadius: '18px', padding: '14px 16px', border: `1px solid ${PALETTE.coral}20`, boxShadow: '0 10px 20px rgba(255,107,157,0.1)' }}>
                    {/* 天气信息 */}
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'stretch', background: `linear-gradient(135deg, ${PALETTE.coralLight}, ${PALETTE.orangeLight})`, borderRadius: '14px', padding: '12px 14px', border: `1px solid ${PALETTE.coral}25`, marginBottom: '12px' }}>
                      <div style={{ width: '44px', height: '44px', borderRadius: '10px', flexShrink: 0, background: '#FFFFFF', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                        {(outfitRec as any).weatherInfo?.weather?.includes('晴') ? <Sun style={{ width: '20px', height: '20px', color: '#FF9D6B' }} /> : (outfitRec as any).weatherInfo?.weather?.includes('雨') ? <CloudRain style={{ width: '20px', height: '20px', color: '#6BD4FF' }} /> : (outfitRec as any).weatherInfo?.weather?.includes('阴') ? <Cloud style={{ width: '20px', height: '20px', color: '#94A3B8' }} /> : <Wind style={{ width: '20px', height: '20px', color: '#6BD4FF' }} />}
                        <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '10px', fontWeight: 700, color: '#1A1A2E' }}>{(outfitRec as any).weatherInfo?.temperature || '--'}°</span>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px', flexWrap: 'wrap' }}>
                          <MapPin style={{ width: '10px', height: '10px', color: '#6B7280' }} />
                          <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '11px', fontWeight: 600, color: '#1A1A2E' }}>{(outfitRec as any).weatherInfo?.city || userLocation?.city || '未设置'}</span>
                          <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '10px', color: '#6B7280' }}>{(outfitRec as any).weatherInfo?.weather || '加载中...'}</span>
                        </div>
                        <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '10px', color: '#6B7280', margin: 0 }}>今日五行：<span style={{ color: PALETTE.coral, fontWeight: 600 }}>{(outfitRec as any).weatherInfo?.wuxing || '加载中'}</span></p>
                        <div style={{ marginTop: '7px' }}>
                          <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '3px',
                            borderRadius: '999px',
                            background: 'rgba(255,255,255,0.75)',
                            border: `1px solid ${PALETTE.purple}22`,
                            boxShadow: '0 6px 14px rgba(98,72,176,0.12)',
                          }}>
                            <motion.button
                              onClick={() => {
                                setLocationLocked(false);
                                detectLocation();
                              }}
                              whileHover={{ y: -1, scale: 1.02 }}
                              whileTap={{ y: 0, scale: 0.97 }}
                              style={{
                                padding: '4px 10px',
                                borderRadius: '999px',
                                border: 'none',
                                background: !locationLocked ? `linear-gradient(135deg, ${PALETTE.coral}, ${PALETTE.orange})` : 'transparent',
                                cursor: 'pointer',
                                fontFamily: 'Outfit, sans-serif',
                                fontSize: '10px',
                                fontWeight: 700,
                                color: !locationLocked ? '#FFFFFF' : '#7A809E',
                                transition: UI_EASE,
                                boxShadow: !locationLocked ? `0 8px 14px ${PALETTE.coral}3a` : 'none',
                              }}
                            >
                              <Navigation style={{ width: '10px', height: '10px', marginRight: '4px', display: 'inline' }} />
                              {locating ? '定位中…' : '自动定位'}
                            </motion.button>
                            <motion.button
                              onClick={() => {
                                setLocationLocked(true);
                                setShowCityDropdown(true);
                              }}
                              whileHover={{ y: -1, scale: 1.02 }}
                              whileTap={{ y: 0, scale: 0.97 }}
                              style={{
                                padding: '4px 10px',
                                borderRadius: '999px',
                                border: 'none',
                                background: locationLocked ? `linear-gradient(135deg, ${PALETTE.purple}, ${PALETTE.blue})` : 'transparent',
                                cursor: 'pointer',
                                fontFamily: 'Outfit, sans-serif',
                                fontSize: '10px',
                                fontWeight: 700,
                                color: locationLocked ? '#FFFFFF' : '#7A809E',
                                transition: UI_EASE,
                                boxShadow: locationLocked ? `0 8px 14px ${PALETTE.purple}30` : 'none',
                              }}
                            >
                              <MapPin style={{ width: '10px', height: '10px', marginRight: '4px', display: 'inline' }} />
                              手动选城
                            </motion.button>
                          </div>
                          <div style={{ display: 'flex', gap: '6px', marginTop: '6px', alignItems: 'center' }}>
                            <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '9px', color: '#9AA0BE' }}>
                              当前方式：{locationLocked ? '手动城市' : '自动定位'}
                            </span>
                            {userLocation?.city && (
                              <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '9px', color: '#7A809E' }}>
                                城市：{userLocation.city}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
                      {['低饱和打底', '高光渐变点缀', '金属配件提气'].map((tag) => (
                        <span key={tag} style={{
                          padding: '4px 10px',
                          borderRadius: '999px',
                          fontFamily: 'Outfit, sans-serif',
                          fontSize: '10px',
                          fontWeight: 600,
                          color: '#7A3F90',
                          background: `linear-gradient(135deg, ${PALETTE.purple}12, ${PALETTE.blue}12)`,
                          border: `1px solid ${PALETTE.purple}1F`,
                        }}>
                          {tag}
                        </span>
                      ))}
                    </div>
                    {/* 场景穿搭推荐 */}
                    {(() => {
                      const scenes = (outfitRec as any).sceneRecommendations || [];
                      const getSceneIcon = (iconStr: string) => { switch(iconStr) { case 'briefcase': return <Briefcase style={{ width: '14px', height: '14px' }} />; case 'shirt': return <ShirtIcon style={{ width: '14px', height: '14px' }} />; case 'party': return <PartyPopper style={{ width: '14px', height: '14px' }} />; case 'gift': return <Gift style={{ width: '14px', height: '14px' }} />; default: return <Star style={{ width: '14px', height: '14px' }} />; } };
                      return (
                        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(scenes.length, navWideLayout ? 4 : 2)}, minmax(0, 1fr))`, gap: '6px', marginBottom: '10px' }}>
                          {scenes.map((scene: any) => (
                            <motion.button key={scene.id} onClick={() => setActiveScene(activeScene === scene.id ? null : scene.id)} whileHover={{ y: -2, scale: 1.03 }} whileTap={{ y: 0, scale: 0.97 }} style={{ padding: '8px 6px', borderRadius: '10px', background: activeScene === scene.id ? `${scene.accentColor}20` : `${scene.accentColor}08`, border: `1.5px solid ${activeScene === scene.id ? scene.accentColor : `${scene.accentColor}25`}`, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', transition: 'all 0.2s', boxShadow: activeScene === scene.id ? `0 10px 18px ${scene.accentColor}33` : `0 6px 12px ${scene.accentColor}18` }}>
                              <div style={{ color: scene.accentColor }}>{getSceneIcon(scene.icon)}</div>
                              <span style={{ fontFamily: 'Outfit', fontSize: '10px', fontWeight: 700, color: scene.accentColor }}>{scene.label}</span>
                            </motion.button>
                          ))}
                        </div>
                      );
                    })()}
                    {/* 场景详细展开 */}
                    {(() => {
                      const scenes = (outfitRec as any).sceneRecommendations || [];
                      const scene = scenes.find((s: any) => s.id === activeScene);
                      if (!scene) return null;
                      const sceneMainTone = (scene.colors && scene.colors.length > 0) ? scene.colors[0] : '同色系渐变';
                      const sceneAvoidTone = (scene.colors && scene.colors.length > 1) ? `避免与 ${scene.colors[1]} 高对比硬切` : '避免高饱和撞色叠加';
                      const sceneUpgradeTip = scene.weatherTip || '建议加入一件带光泽感的配饰，提升整体精致度';
                      return (
                        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} style={{ background: `linear-gradient(135deg, ${scene.accentColor}10, ${scene.accentColor}05)`, borderRadius: '12px', padding: '12px', border: `1.5px solid ${scene.accentColor}25` }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                            <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: scene.accentColor, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Star style={{ width: '14px', height: '14px', color: '#FFFFFF' }} />
                            </div>
                            <div>
                              <p style={{ fontFamily: 'Outfit', fontSize: '12px', fontWeight: 700, color: '#1A1A2E', margin: 0 }}>{scene.label}</p>
                              <p style={{ fontFamily: 'Outfit', fontSize: '10px', color: '#A0A8C0', margin: '1px 0 0' }}>{scene.element}属性 · {scene.weatherTip?.slice(0, 12) || ''}</p>
                            </div>
                          </div>
                          {scene.colors && <div style={{ marginBottom: '10px' }}>
                            <p style={{ fontFamily: 'Outfit', fontSize: '10px', fontWeight: 600, color: '#6B7280', marginBottom: '4px' }}>推荐颜色</p>
                            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                              {scene.colors.map((c: string, i: number) => <span key={i} style={{ padding: '3px 8px', borderRadius: '6px', background: `${scene.accentColor}12`, border: `1px solid ${scene.accentColor}25`, fontFamily: 'Outfit', fontSize: '10px', color: '#1A1A2E' }}>{c}</span>)}
                            </div>
                          </div>}
                          {renderStyleGuideTriplet(
                            `${sceneMainTone}打底，强调层次渐变。`,
                            `${sceneAvoidTone}，避免破坏高级感。`,
                            sceneUpgradeTip,
                            { primary: scene.accentColor, avoid: '#E76F51', upgrade: '#7C3AED', border: `${scene.accentColor}20` },
                          )}
                          <div style={{ padding: '8px', background: '#FFFFFF', borderRadius: '8px', border: `1px solid ${scene.accentColor}20` }}>
                            <Lightbulb style={{ width: '12px', height: '12px', color: scene.accentColor, marginBottom: '4px' }} />
                            <p style={{ fontFamily: 'Outfit', fontSize: '10px', color: '#6B7280', lineHeight: 1.6, margin: 0 }}>{scene.explanation}</p>
                        </div>
                      </motion.div>
                      );
                    })()}
                  </div>
                )}
              </div>
            )}

            {/* 空状态提示 */}
                {(!selectedRecord || !previewInfo || !previewInfo.baziResult) && (
                  <div style={{
                    background: 'linear-gradient(155deg, rgba(255,255,255,0.95), rgba(255,255,255,0.84))', borderRadius: '24px', padding: '48px 32px',
                    boxShadow: '0 14px 30px rgba(78,58,142,0.12)', border: `1px solid ${PALETTE.coral}20`, textAlign: 'center',
                    backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
                  }}>
                    <div style={{
                      width: '56px', height: '56px', margin: '0 auto 16px', borderRadius: '18px',
                      background: `linear-gradient(135deg, ${PALETTE.coralLight}, ${PALETTE.orangeLight})`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Star style={{ width: '28px', height: '28px', color: PALETTE.coral }} />
                    </div>
                    <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '15px', fontWeight: 700, color: '#1A1A2E', marginBottom: '8px' }}>
                      {!selectedRecord ? '选择一位命主，开始测算' : '正在加载命盘数据…'}
                    </p>
                    <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '13px', color: '#A0A8C0' }}>
                      {!selectedRecord ? '录入或选择用户后，可查看命盘、今日运势与穿搭/手串建议' : '请稍候'}
                    </p>
                    {selectedRecord && <Loader2 style={{ width: '22px', height: '22px', color: PALETTE.coral, animation: 'spin 1s linear infinite', margin: '16px auto 0' }} />}
                  </div>
                )}

                {/* 今日手串推荐卡片 - 独立卡片 */}
                {braceletRec && (
                  <div id="bracelet-section" style={{
                    flex: 1,
                    background: `linear-gradient(145deg, ${PALETTE.purple}0E 0%, ${PALETTE.blue}08 45%, rgba(255,255,255,0.94) 100%)`, borderRadius: '24px', padding: '20px',
                    boxShadow: '0 18px 38px rgba(103,76,185,0.18)', border: `1px solid ${PALETTE.purple}2A`,
                    backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                      <div style={{
                        width: '32px', height: '32px', borderRadius: '10px', flexShrink: 0,
                        background: `linear-gradient(135deg, ${PALETTE.purple}, ${PALETTE.blue})`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: `0 3px 10px rgba(139,92,246,0.3)`,
                      }}>
                        <Gem style={{ width: '16px', height: '16px', color: '#FFFFFF' }} />
                      </div>
                      <div>
                        <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '15px', fontWeight: 900, color: '#1A1A2E' }}>今日手串推荐</span>
                        <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '10px', color: '#9A9FC2', margin: '1px 0 0' }}>能量材质 · 高级渐变系</p>
                      </div>
                      <motion.button
                        onClick={() => setActiveTab(activeTab === 'bracelet' ? null : 'bracelet')}
                        whileHover={{ y: -2, scale: 1.02 }}
                        whileTap={{ y: 0, scale: 0.97 }}
                        style={{
                          marginLeft: 'auto', padding: '6px 14px', borderRadius: '9999px',
                          background: activeTab === 'bracelet' ? `linear-gradient(135deg, ${PALETTE.purple}, ${PALETTE.blue})` : `${PALETTE.purple}08`,
                          border: `1.5px solid ${activeTab === 'bracelet' ? PALETTE.purple : `${PALETTE.purple}30`}`,
                          cursor: 'pointer', fontFamily: 'Outfit, sans-serif', fontSize: '12px',
                          fontWeight: 600, color: activeTab === 'bracelet' ? '#FFFFFF' : PALETTE.purple, transition: UI_EASE,
                          boxShadow: activeTab === 'bracelet' ? `0 10px 20px ${PALETTE.purple}3a` : `0 6px 12px ${PALETTE.purple}1a`,
                        }}
                      >
                        {activeTab === 'bracelet' ? '收起' : '查看详情'}
                        {activeTab === 'bracelet' ? <ChevronUp style={{ width: '14px', height: '14px', marginLeft: '4px', display: 'inline' }} /> : <ChevronDown style={{ width: '14px', height: '14px', marginLeft: '4px', display: 'inline' }} />}
                      </motion.button>
                    </div>
                    {renderInsightBlock(
                      '今日能量签',
                      '先佩戴主推荐材质，再以同色系配饰做轻量呼应；通勤场景优先稳重配色，社交场景再增加亮点。',
                      {
                        title: PALETTE.purple,
                        border: `${PALETTE.purple}20`,
                        background: `linear-gradient(135deg, ${PALETTE.purple}12, ${PALETTE.blue}10, #FFFFFF)`,
                      },
                    )}

                    {/* 手串简要预览 */}
                    {(braceletRec as any).primaryBracelet && (() => {
                      const primary = (braceletRec as any).primaryBracelet;
                      const material = primary.material || primary.name || '';
                      const details = getBraceletDetails(material);
                      return renderPrimaryMaterialPreviewCard(primary, details);
                    })()}
                    
                    {/* 命理分析总结 - 在主界面展示 */}
                    {(braceletRec as any).summary && (() => {
                      const summary = (braceletRec as any).summary;
                      return (
                        <div style={{ marginTop: '14px' }}>
                          {/* 运势等级和用神 */}
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <Sparkles style={{ width: '14px', height: '14px', color: PALETTE.purple }} />
                              <span style={{ fontFamily: 'Outfit', fontSize: '12px', fontWeight: 700, color: '#1A1A2E' }}>命理分析</span>
                            </div>
                            <div style={{ padding: '3px 10px', borderRadius: '8px', background: summary.fortuneLevel === '极佳' ? `${PALETTE.green}15` : summary.fortuneLevel === '上佳' ? `${PALETTE.blue}15` : summary.fortuneLevel === '平稳' ? `${PALETTE.yellow}15` : `${PALETTE.orange}15`, border: `1px solid ${summary.fortuneLevel === '极佳' ? PALETTE.green : summary.fortuneLevel === '上佳' ? PALETTE.blue : summary.fortuneLevel === '平稳' ? PALETTE.yellow : PALETTE.orange}30` }}>
                              <span style={{ fontFamily: 'Outfit', fontSize: '10px', fontWeight: 700, color: summary.fortuneLevel === '极佳' ? PALETTE.green : summary.fortuneLevel === '上佳' ? PALETTE.blue : summary.fortuneLevel === '平稳' ? PALETTE.yellow : PALETTE.orange }}>{summary.fortuneLevel}运势</span>
                            </div>
                          </div>
                          
                          {/* 五行图示 */}
                          {summary.wuxingDiagram && (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px', background: `linear-gradient(135deg, ${PALETTE.purple}08, ${PALETTE.blue}08)`, borderRadius: '12px', border: `1px solid ${PALETTE.purple}15`, marginBottom: '10px' }}>
                              <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: `linear-gradient(135deg, ${PALETTE.purple}, ${PALETTE.blue})`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                <span style={{ fontFamily: 'Outfit', fontSize: '16px', fontWeight: 800, color: '#FFFFFF' }}>{summary.wuxingDiagram.primaryName}</span>
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '3px', padding: '2px 6px', borderRadius: '4px', background: `${PALETTE.green}10` }}>
                                  <TrendingUp style={{ width: '10px', height: '10px', color: PALETTE.green }} />
                                  <span style={{ fontFamily: 'Outfit', fontSize: '9px', color: PALETTE.green, fontWeight: 700 }}>{summary.wuxingDiagram.sheng}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '3px', padding: '2px 6px', borderRadius: '4px', background: `${PALETTE.orange}10` }}>
                                  <TrendingUp style={{ width: '10px', height: '10px', color: PALETTE.orange, transform: 'rotate(180deg)' }} />
                                  <span style={{ fontFamily: 'Outfit', fontSize: '9px', color: PALETTE.orange, fontWeight: 700 }}>{summary.wuxingDiagram.ke}</span>
                                </div>
                              </div>
                              <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: `${PALETTE.blue}15`, border: `1.5px solid ${PALETTE.blue}40`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                <span style={{ fontFamily: 'Outfit', fontSize: '14px', fontWeight: 700, color: '#1A1A2E' }}>{summary.wuxingDiagram.secondaryName}</span>
                              </div>
                            </div>
                          )}
                          
                          {/* 综合建议 */}
                          {summary.overallAdvice && (
                            <div style={{ padding: '8px 10px', background: `linear-gradient(145deg, ${PALETTE.purple}08, #FFFFFF)`, borderRadius: '10px', border: `1px solid ${PALETTE.purple}24` }}>
                              <Lightbulb style={{ width: '12px', height: '12px', color: PALETTE.purple, marginBottom: '4px' }} />
                              <p style={{ fontFamily: 'Outfit', fontSize: '10px', color: '#6B7280', margin: 0, lineHeight: 1.5 }}>{summary.overallAdvice}</p>
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    {/* 卡片内展开详情（参考今日色彩放置方式） */}
                    {activeTab === 'bracelet' && (
                      <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: `1px solid ${PALETTE.purple}20` }}>
                        {/* 主手串详情 */}
                        {(braceletRec as any).primaryBracelet && (() => {
                          const primary = (braceletRec as any).primaryBracelet;
                          const material = primary.material || primary.name || '';
                          const details = getBraceletDetails(material);
                          return (
                            <div style={{ marginBottom: '16px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: `linear-gradient(135deg, ${PALETTE.purple}, ${PALETTE.blue})`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Gem style={{ width: '20px', height: '20px', color: '#FFFFFF' }} />
                                  </div>
                                  <div>
                                    <p style={{ fontFamily: 'Outfit', fontSize: '16px', fontWeight: 700, color: '#1A1A2E', margin: 0 }}>{material}</p>
                                    <p style={{ fontFamily: 'Outfit', fontSize: '11px', color: '#A0A8C0', margin: '2px 0 0' }}>{primary.color || ''} · 首选推荐</p>
                                  </div>
                                </div>
                                {primary.element && <ElementBadge el={primary.element} />}
                              </div>

                              <div style={{ padding: '12px', background: `linear-gradient(135deg, ${PALETTE.purple}08, ${PALETTE.blue}08)`, borderRadius: '12px', border: `1px solid ${PALETTE.purple}15`, marginBottom: '12px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                                  <Sparkles style={{ width: '14px', height: '14px', color: PALETTE.purple }} />
                                  <p style={{ fontFamily: 'Outfit', fontSize: '12px', fontWeight: 700, color: PALETTE.purple, margin: 0 }}>今日运势搭配</p>
                                </div>
                                <p style={{ fontFamily: 'Outfit', fontSize: '11px', color: '#6B7280', margin: 0, lineHeight: 1.7 }}>
                                  {primary.whyRecommended || `今日${(braceletRec as any).summary?.tenGod || '流日'}当令，${material}五行属${primary.element || ''}，与日主${(braceletRec as any).bodyStrength?.type === 'strong' ? '身强' : (braceletRec as any).bodyStrength?.type === 'weak' ? '身弱' : '中性'}格局相宜，${primary.effect || '可增强运势'}`}
                                </p>
                              </div>

                              {primary.effect && (
                                <div style={{ padding: '10px 12px', background: `${PALETTE.purple}08`, borderRadius: '10px', border: `1px solid ${PALETTE.purple}15`, marginBottom: '10px' }}>
                                  <p style={{ fontFamily: 'Outfit', fontSize: '11px', fontWeight: 600, color: PALETTE.purple, marginBottom: '4px' }}>推荐功效</p>
                                  <p style={{ fontFamily: 'Outfit', fontSize: '12px', color: '#6B7280', margin: 0, lineHeight: 1.6 }}>{primary.effect}</p>
                                </div>
                              )}

                              {primary.suitableScenes && primary.suitableScenes.length > 0 && (
                                <div style={{ marginBottom: '10px' }}>
                                  <p style={{ fontFamily: 'Outfit', fontSize: '11px', fontWeight: 600, color: '#1A1A2E', marginBottom: '8px' }}>适合场景</p>
                                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                    {primary.suitableScenes.map((scene: any, idx: number) => (
                                      <div key={idx} style={{ padding: '6px 10px', borderRadius: '8px', background: `${PALETTE.green}10`, border: `1px solid ${PALETTE.green}25`, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <span style={{ fontSize: '12px' }}>{scene.icon || '✦'}</span>
                                        <span style={{ fontFamily: 'Outfit', fontSize: '10px', color: PALETTE.green, fontWeight: 600 }}>{scene.name || scene.scene}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {details && (
                                <>
                                  {details.description && (
                                    <div style={{ padding: '10px 12px', background: `linear-gradient(145deg, ${PALETTE.blue}06, #FFFFFF)`, borderRadius: '10px', border: `1px solid ${PALETTE.blue}24`, marginBottom: '8px' }}>
                                      <p style={{ fontFamily: 'Outfit', fontSize: '11px', fontWeight: 600, color: PALETTE.blue, marginBottom: '4px' }}>手串简介</p>
                                      <p style={{ fontFamily: 'Outfit', fontSize: '11px', color: '#6B7280', margin: 0, lineHeight: 1.6 }}>{details.description}</p>
                                    </div>
                                  )}
                                  {details.effects && details.effects.length > 0 && (
                                    <div style={{ padding: '10px 12px', background: `linear-gradient(145deg, ${PALETTE.green}06, #FFFFFF)`, borderRadius: '10px', border: `1px solid ${PALETTE.green}24`, marginBottom: '8px' }}>
                                      <p style={{ fontFamily: 'Outfit', fontSize: '11px', fontWeight: 600, color: PALETTE.green, marginBottom: '6px' }}>功效作用</p>
                                      {details.effects.map((eff, idx) => (
                                        <p key={idx} style={{ fontFamily: 'Outfit', fontSize: '11px', color: '#6B7280', margin: '2px 0', paddingLeft: '10px', lineHeight: 1.5 }}>
                                          · {eff}
                                        </p>
                                      ))}
                                    </div>
                                  )}
                                  {details.occasions && details.occasions.length > 0 && (
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
                                      {details.occasions.map((occ, idx) => (
                                        <span key={idx} style={{ padding: '4px 10px', borderRadius: '8px', background: `${PALETTE.coral}10`, border: `1px solid ${PALETTE.coral}25`, fontFamily: 'Outfit', fontSize: '10px', color: PALETTE.coral }}>{occ}</span>
                                      ))}
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                          );
                        })()}

                        {/* 次选手串 */}
                        {(braceletRec as any).secondaryBracelets && (braceletRec as any).secondaryBracelets.length > 0 && (
                          <div style={{ marginBottom: '4px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                              <Sparkles style={{ width: '14px', height: '14px', color: PALETTE.purple }} />
                              <p style={{ fontFamily: 'Outfit', fontSize: '13px', fontWeight: 700, color: '#1A1A2E', margin: 0 }}>次选推荐</p>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              {(braceletRec as any).secondaryBracelets.map((sec: any, idx: number) => {
                                const secMaterial = sec.material || sec.name || '';
                                const secDetails = getBraceletDetails(secMaterial);
                                return (
                                  <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px', borderRadius: '12px', background: `${PALETTE.blue}05`, border: `1px solid ${PALETTE.blue}15` }}>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                      <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: `${PALETTE.blue}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        <Gem style={{ width: '20px', height: '20px', color: PALETTE.blue }} />
                                      </div>
                                      <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                                          <p style={{ fontFamily: 'Outfit', fontSize: '13px', fontWeight: 700, color: '#1A1A2E', margin: 0 }}>{secMaterial}</p>
                                          {sec.element && <ElementBadge el={sec.element} />}
                                        </div>
                                        <p style={{ fontFamily: 'Outfit', fontSize: '11px', color: '#6B7280', margin: 0, lineHeight: 1.4 }}>{sec.effect || secDetails?.description?.slice(0, 50) || ''}</p>
                                      </div>
                                    </div>
                                    {sec.whyRecommended && (
                                      <div style={{ padding: '8px 10px', background: `${PALETTE.purple}06`, borderRadius: '8px', border: `1px solid ${PALETTE.purple}12` }}>
                                        <p style={{ fontFamily: 'Outfit', fontSize: '10px', color: PALETTE.purple, margin: 0, lineHeight: 1.5 }}>💫 {sec.whyRecommended}</p>
                                      </div>
                                    )}
                                    {sec.suitableScenes && sec.suitableScenes.length > 0 && (
                                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                        {sec.suitableScenes.slice(0, 3).map((scene: any, sIdx: number) => (
                                          <span key={sIdx} style={{ padding: '3px 8px', borderRadius: '6px', background: `${PALETTE.green}10`, border: `1px solid ${PALETTE.green}25`, fontFamily: 'Outfit', fontSize: '9px', color: PALETTE.green }}>{scene.name || scene.scene}</span>
                                        ))}
                                      </div>
                                    )}
                                    {renderStyleGuideTriplet(
                                      '作为副手串用于层次叠戴，主打低调提亮。',
                                      '避免同时叠加过多高亮材质，防止视觉过满。',
                                      '和主推荐同色系配饰呼应，整体更有高级统一感。',
                                      { primary: PALETTE.blue, avoid: PALETTE.coral, upgrade: PALETTE.purple, border: `${PALETTE.blue}22` },
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

          </motion.div>
        )}
      </div>

      {/* 关闭城市下拉 */}
      {showCityDropdown && (
        <>
          <div
            style={{
              position: 'fixed', inset: 0, zIndex: 50,
            }}
            onClick={() => setShowCityDropdown(false)}
          />
          {/* 城市选择弹窗 */}
          <div style={{
            position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            zIndex: 51, width: '85%', maxWidth: '360px',
            background: 'linear-gradient(145deg, rgba(255,255,255,0.97), rgba(255,255,255,0.9))', borderRadius: '20px', padding: '20px',
            boxShadow: '0 24px 70px rgba(61,40,124,0.24)',
            border: `1px solid ${PALETTE.purple}26`,
            backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ fontFamily: 'Outfit', fontSize: '16px', fontWeight: 700, color: '#1A1A2E', margin: 0 }}>选择城市</h3>
              <button onClick={() => setShowCityDropdown(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
                <X style={{ width: '20px', height: '20px', color: '#6B7280' }} />
              </button>
            </div>
            {/* 搜索框 */}
            <input
              type="text"
              placeholder="搜索城市..."
              value={citySearch}
              onChange={(e) => setCitySearch(e.target.value)}
              style={{
                width: '100%', padding: '10px 14px', borderRadius: '10px',
                border: `1.5px solid ${PALETTE.purple}30`, outline: 'none',
                fontFamily: 'Outfit', fontSize: '13px', marginBottom: '12px',
                boxSizing: 'border-box',
                background: 'linear-gradient(145deg, #FFFFFF, #F6F3FF)',
                boxShadow: '0 8px 16px rgba(90,63,160,0.1)',
                transition: 'all 0.2s ease',
              }}
              onFocus={(e) => { (e.target as HTMLElement).style.borderColor = PALETTE.purple; (e.target as HTMLElement).style.boxShadow = `0 0 0 3px ${PALETTE.purple}22, 0 10px 18px rgba(155,107,255,0.18)`; }}
              onBlur={(e) => { (e.target as HTMLElement).style.borderColor = `${PALETTE.purple}30`; (e.target as HTMLElement).style.boxShadow = '0 8px 16px rgba(90,63,160,0.1)'; }}
            />
            {/* 城市列表 */}
            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {(citySearch ? MAJOR_CITIES.filter(c => c.includes(citySearch)) : MAJOR_CITIES).map((city) => (
                <div
                  key={city}
                  onClick={() => selectCity(city)}
                  style={{
                    padding: '10px 12px', borderRadius: '8px', cursor: 'pointer',
                    fontFamily: 'Outfit', fontSize: '13px', color: '#1A1A2E',
                    transition: 'background 0.15s, transform 0.15s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = `${PALETTE.purple}10`; e.currentTarget.style.transform = 'translateX(2px)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.transform = 'translateX(0)'; }}
                >
                  {city}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
      <style>{`
        @keyframes dopaminePulse {
          0%, 100% { transform: scale(1); box-shadow: 0 4px 12px rgba(255,107,157,0.35); }
          50% { transform: scale(1.06); box-shadow: 0 10px 20px rgba(255,107,157,0.42); }
        }
      `}</style>
    </div>
  );
}
