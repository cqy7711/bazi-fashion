import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Loader2, Shirt, Gem, Plus, Sparkles, Star, TrendingUp, ArrowRight, MapPin, RefreshCw,
  Search, Navigation, Briefcase, PartyPopper, Gift, Watch, Crown, Sun, Cloud, CloudRain,
  Droplets, Leaf, Flame, Mountain, Snowflake, Wind, ShirtIcon, WatchIcon, Sparkle,
  CircleDot, ChevronDown, ChevronUp, X, Lightbulb, TrendingUpIcon, Heart, Zap, Apple,
  Compass, Clock, Edit3, Palette, Circle, Check
} from 'lucide-react';
import type { UserBirthInfoListItem, UserBirthInfo, OutfitRecommendation, BraceletRecommendation, DailyFortune } from './types';

// ── 多巴胺配色系统 ──
const PALETTE = {
  coral: '#FF6B9D', coralLight: 'rgba(255,107,157,0.12)',
  orange: '#FF9D6B', orangeLight: 'rgba(255,157,107,0.12)',
  yellow: '#FFD666', yellowLight: 'rgba(255,214,102,0.12)',
  green: '#22C55E', greenLight: 'rgba(34,197,94,0.12)',
  blue: '#6BD4FF', blueLight: 'rgba(107,212,255,0.12)',
  purple: '#9D6BFF', purpleLight: 'rgba(157,107,255,0.12)',
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
  const navigate = useNavigate();
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
  });
  const [outfitRec, setOutfitRec] = useState<OutfitRecommendation | null>(null);
  const [braceletRec, setBraceletRec] = useState<BraceletRecommendation | null>(null);
  const [previewInfo, setPreviewInfo] = useState<UserBirthInfo | null>(null);
  const [dailyFortune, setDailyFortune] = useState<DailyFortune | null>(null);

  // 地理位置状态
  const [userLocation, setUserLocation] = useState<{ city: string; lat?: number; lon?: number } | null>(null);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [citySearch, setCitySearch] = useState('');
  const [locating, setLocating] = useState(false);
  const [activeScene, setActiveScene] = useState<string | null>(null);
  const [locationLocked, setLocationLocked] = useState(false); // 定位锁定状态

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
    setForm({
      name: record.name,
      birthYear: record.birthYear,
      birthMonth: record.birthMonth,
      birthDay: record.birthDay,
      birthHour: record.birthHour,
      gender: record.gender as 'male' | 'female',
      calendarType: (record as any).calendarType || 'solar',
      languageStyle: 'normal',
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
          gender: 'male', calendarType: 'solar', languageStyle: 'normal' 
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', position: 'relative', zIndex: 1 }}>

      {/* ── 紧凑 Hero Banner ── */}
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        style={{ position: 'relative', overflow: 'hidden', borderRadius: '24px' }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: `linear-gradient(135deg, ${PALETTE.coralLight} 0%, ${PALETTE.orangeLight} 50%, ${PALETTE.yellowLight} 100%)`,
          opacity: 0.65,
        }} />
        <div style={{ position: 'relative', padding: '24px 32px', display: 'flex', alignItems: 'center', gap: '20px' }}>
          <motion.div animate={{ rotate: [0, 6, -4, 0] }} transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              width: '52px', height: '52px', flexShrink: 0, borderRadius: '16px',
              background: `linear-gradient(135deg, ${PALETTE.coral}, ${PALETTE.orange})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(255,107,157,0.35)',
            }}>
            <Sparkle style={{ width: '28px', height: '28px', color: '#FFFFFF' }} />
          </motion.div>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '20px', fontWeight: 900, color: '#1A1A2E', letterSpacing: '-0.02em', marginBottom: '4px' }}>八字时尚推荐</h2>
            <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '13px', color: '#6B7280', display: 'flex', alignItems: 'center', gap: '4px' }}>
              根据生辰八字，智能推荐穿搭色彩与开运手串
              <Sparkles style={{ width: '14px', height: '14px', color: PALETTE.coral }} />
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            {DOPAMINE_COLORS.map(({ label, color, icon }) => (
              <div key={label} style={{
                display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 10px',
                background: `${color}18`, border: `1px solid ${color}30`, borderRadius: '9999px',
              }}>
                {icon}
                <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '12px', fontWeight: 600, color }}>{label}</span>
              </div>
            ))}
          </div>
          <div style={{
            fontFamily: 'Outfit, sans-serif', fontSize: '72px', fontWeight: 900,
            color: 'rgba(255,107,157,0.07)', lineHeight: 1, letterSpacing: '-0.05em', userSelect: 'none', flexShrink: 0,
          }}>BAZI</div>
        </div>
      </motion.div>

      {/* ── 主体单列布局 ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'stretch' }}>

        {/* ── 第一行：我的生辰 + 命盘信息 + 今日运势（3列并排） ── */}
        <motion.div {...fadeUp} transition={{ delay: 0.05 }}>
          <div style={{ display: 'flex', flexDirection: 'row', gap: '12px', alignItems: 'stretch' }}>

          {/* 用户记录卡片 - 单用户展示 + 切换按钮 */}
          <div style={{
            background: '#FFFFFF', borderRadius: '24px', padding: '20px',
            boxShadow: '0 2px 16px rgba(0,0,0,0.05)', border: '1px solid #F0F1F8',
            flex: 1,
          }}>
            {/* 头部：标题 + 右上角操作按钮 */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '28px', height: '28px', borderRadius: '8px',
                  background: `${PALETTE.coral}15`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Star style={{ width: '14px', height: '14px', color: PALETTE.coral }} />
                </div>
                <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '14px', fontWeight: 700, color: '#1A1A2E' }}>我的生辰</span>
              </div>
              {/* 右上角：切换 + 新建 */}
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                {records.length > 1 && (
                  <motion.select
                    value={selectedId || ''}
                    onChange={e => selectRecord(e.target.value)}
                    whileHover={{ scale: 1.02 }}
                    style={{
                      padding: '4px 8px', borderRadius: '8px',
                      border: `1.5px solid ${PALETTE.coral}40`,
                      background: `${PALETTE.coral}08`,
                      fontFamily: 'Outfit, sans-serif', fontSize: '11px', fontWeight: 600,
                      color: PALETTE.coral, cursor: 'pointer', outline: 'none',
                    }}
                  >
                    {records.map(r => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </motion.select>
                )}
                <motion.button
                  onClick={() => {
                    setShowForm(true);
                    setForm({ name: '', birthYear: new Date().getFullYear() - 25, birthMonth: 1, birthDay: 1, birthHour: 12, gender: 'male', calendarType: 'solar', languageStyle: 'normal' });
                  }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  style={{
                    width: '28px', height: '28px',
                    borderRadius: '50%', border: `2px solid ${PALETTE.coral}50`,
                    background: `${PALETTE.coral}10`, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.2s',
                  }}
                >
                  <Plus style={{ width: '14px', height: '14px', color: PALETTE.coral }} />
                </motion.button>
              </div>
            </div>

            {/* 内容区 */}
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
            ) : selectedRecord ? (
              <div>
                {/* 用户详细信息 */}
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '22px', fontWeight: 800, color: PALETTE.coral }}>{selectedRecord.name}</span>
                    <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '11px', color: '#A0A8C0', background: '#F5F5F8', padding: '3px 10px', borderRadius: '9999px' }}>{selectedRecord.gender === 'male' ? '♂ 男' : '♀ 女'}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '6px' }}>
                    {[
                      { label: '年', value: selectedRecord.birthYear },
                      { label: '月', value: selectedRecord.birthMonth },
                      { label: '日', value: selectedRecord.birthDay },
                      { label: '时', value: selectedRecord.birthHour != null ? `${selectedRecord.birthHour}:00` : '未知' },
                    ].map(item => (
                      <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '10px', color: '#A0A8C0' }}>{item.label}</span>
                        <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '13px', fontWeight: 700, color: '#1A1A2E' }}>{item.value}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: '11px', color: '#A0A8C0' }}>
                    {selectedRecord.calendarType === 'lunar' ? '农历' : '公历'}
                  </div>
                </div>
                {/* 编辑 / 删除按钮 */}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <motion.button
                    onClick={() => handleEdit(selectedRecord)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.96 }}
                    style={{
                      flex: 1, padding: '8px 12px',
                      borderRadius: '10px', border: `1.5px solid ${PALETTE.blue}40`,
                      background: `${PALETTE.blue}08`, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
                      fontFamily: 'Outfit, sans-serif', fontSize: '11px', fontWeight: 600, color: PALETTE.blue,
                    }}
                  >
                    <Edit3 style={{ width: '12px', height: '12px' }} />编辑
                  </motion.button>
                  <motion.button
                    onClick={() => handleDelete(selectedRecord.id)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.96 }}
                    style={{
                      flex: 1, padding: '8px 12px',
                      borderRadius: '10px', border: '1.5px solid #FF475740',
                      background: '#FFF0F0', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
                      fontFamily: 'Outfit, sans-serif', fontSize: '11px', fontWeight: 600, color: '#FF4757',
                    }}
                  >
                    <X style={{ width: '12px', height: '12px' }} />删除
                  </motion.button>
                </div>
              </div>
            ) : null}
          </div>

          {/* 命盘信息卡片 - 增强版 */}
          {selectedRecord && previewInfo && previewInfo.baziResult ? (
            <div style={{
              background: '#FFFFFF', borderRadius: '24px', padding: '20px',
              boxShadow: '0 2px 16px rgba(0,0,0,0.05)', border: '1px solid #F0F1F8',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <div style={{
                  width: '26px', height: '26px', borderRadius: '8px',
                  background: `linear-gradient(135deg, ${PALETTE.purple}20, ${PALETTE.blue}20)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Star style={{ width: '14px', height: '14px', color: PALETTE.purple }} />
                </div>
                <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '14px', fontWeight: 700, color: '#1A1A2E' }}>命盘信息</span>
              </div>

              {/* 日主属性 - 重点显示 */}
              {(() => {
                const dmEl = previewInfo.baziResult.dayMasterElement || 'earth';
                const elementNames: Record<string, string> = { wood: '木', fire: '火', earth: '土', metal: '金', water: '水' };
                const elementColors: Record<string, string> = { wood: PALETTE.green, fire: '#FF6B6B', earth: '#D4A000', metal: '#7B8FA8', water: '#00A8E8' };
                const elementDesc: Record<string, string> = {
                  wood: '木气通于春，代表生长、仁慈与创造。日主为木者，通常具有向上发展的生命力，思维清晰，善于规划，但若木气过旺则易固执己见。宜保持谦和心态，多接触自然有利于运势。',
                  fire: '火气通于夏，代表热情、光明与礼节。日主为火者，通常精力充沛，善于表达，有感染力，但若火气过旺则易冲动急躁。宜修身养性，避免激烈竞争。',
                  earth: '土气寄于四季之末，代表稳重、诚信与承载。日主为土者，通常责任心强，善于积累，有耐心，但若土气过旺则易固执保守。宜开阔视野，多与外界交流。',
                  metal: '金气通于秋，代表刚毅、决断与清肃。日主为金者，通常意志坚定，原则性强，善于权衡利弊，但若金气过旺则易冷酷刻薄。宜柔和待人，注重情义。',
                  water: '水气通于冬，代表智慧、流动与变通。日主为水者，通常聪明机敏，适应力强，善于察言观色，但若水气过旺则易消极逃避。宜积极进取，勇于面对挑战。',
                };
                const mingGeDesc: Record<string, string> = {
                  wood: '🌿 性格温和仁慈，创造力与直觉力强，理想主义者\n💪 优点：有同情心，善于倾听，规划能力强\n⚠️ 注意：肝胆健康，避免熬夜和情绪压抑\n💼 适合：文化创意、教育、农林、设计\n🔥 缘分：与木火属性事物缘分深',
                  fire: '🔥 性格热情开朗，行动力与表达力强，天生的领导者\n💪 优点：精力充沛，思维敏捷，感染力强\n⚠️ 注意：心血管健康，脾气管理，少熬夜\n💼 适合：销售、演讲、政治、娱乐、公关\n💡 建议：修身养性，避免过度竞争',
                  earth: '🏔️ 性格稳重踏实，诚信可靠，责任心与耐心极强\n💪 优点：善于积累，做事有始有终，脚踏实地\n⚠️ 注意：脾胃消化，避免思虑过度和消极\n💼 适合：建筑、农业、管理、财务、仓储\n💡 建议：开阔视野，多与外界交流',
                  metal: '⚔️ 性格果断坚定，正义感强，原则性强且讲究效率\n💪 优点：决策力强，逻辑清晰，执行力高\n⚠️ 注意：肺部呼吸，筋骨关节，少吃辛辣\n💼 适合：金融、法律、科技、外交、机械\n💡 建议：柔和待人，注重情义沟通',
                  water: '🌊 性格聪明灵活，适应力与变通性极强，洞察力敏锐\n💪 优点：善于察言观色，把握机会，思维敏捷\n⚠️ 注意：泌尿系统，肾功能，避免过度劳累\n💼 适合：贸易、物流、媒体、服务、金融\n💡 建议：积极进取，勇于面对挑战',
                };
                return (
                  <div style={{
                    padding: '14px', borderRadius: '16px',
                    background: `${elementColors[dmEl]}08`, border: `1px solid ${elementColors[dmEl]}25`,
                    marginBottom: '14px',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <span style={{
                        padding: '4px 12px', borderRadius: '8px',
                        background: elementColors[dmEl],
                        fontFamily: 'Outfit', fontSize: '14px', fontWeight: 800, color: '#fff',
                      }}>
                        {(previewInfo.baziResult as any).dayPillar}
                      </span>
                      <div>
                        <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '13px', fontWeight: 700, color: elementColors[dmEl], margin: 0 }}>
                          日主{elementNames[dmEl]}命
                        </p>
                        <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '10px', color: '#A0A8C0', margin: 0 }}>
                          {previewInfo.baziResult.dayMaster || dmEl}属性
                        </p>
                      </div>
                    </div>
                    <div style={{
                      padding: '8px 10px', borderRadius: '8px',
                      background: `${elementColors[dmEl]}10`,
                      border: `1px solid ${elementColors[dmEl]}15`,
                    }}>
                      <p style={{ fontFamily: 'Outfit', fontSize: '10px', fontWeight: 600, color: elementColors[dmEl], marginBottom: '6px' }}>命格分析</p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        {mingGeDesc[dmEl].split('\n').map((line, i) => (
                          <p key={i} style={{ fontFamily: 'Outfit', fontSize: '10px', color: '#6B7280', lineHeight: 1.6, margin: 0 }}>
                            {line}
                          </p>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* 喜用五行 */}
              {previewInfo.favorableElements && previewInfo.favorableElements.length > 0 && (
                <div style={{
                  padding: '10px 12px', borderRadius: '12px',
                  background: `${PALETTE.green}08`, border: `1px solid ${PALETTE.green}25`,
                  marginBottom: '14px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '10px', color: PALETTE.green, fontWeight: 600 }}>喜用五行</p>
                    <div style={{ display: 'flex', gap: '4px', marginLeft: 'auto' }}>
                      {previewInfo.favorableElements.map((el: string) => {
                        const colors: Record<string, string> = { wood: PALETTE.green, fire: '#FF6B6B', earth: '#D4A000', metal: '#7B8FA8', water: '#00A8E8' };
                        const names: Record<string, string> = { wood: '木', fire: '火', earth: '土', metal: '金', water: '水' };
                        return (
                          <span key={el} style={{
                            padding: '2px 8px', borderRadius: '6px',
                            background: `${colors[el]}18`, border: `1px solid ${colors[el]}35`,
                            fontFamily: 'Outfit', fontSize: '10px', fontWeight: 600, color: colors[el],
                          }}>{names[el]}</span>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* 详细分析按钮 */}
              <motion.button
                onClick={() => navigate(`/result/${selectedRecord.id}`)}
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
                style={{
                  width: '100%', padding: '12px',
                  borderRadius: '14px',
                  background: `linear-gradient(135deg, ${PALETTE.coral}, ${PALETTE.orange})`,
                  border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  fontFamily: 'Outfit, sans-serif', fontSize: '13px', fontWeight: 700, color: '#FFFFFF',
                  boxShadow: `0 4px 14px ${PALETTE.coral}35`,
                }}
              >
                <TrendingUp style={{ width: '15px', height: '15px' }} />
                查看详细分析报告
                <ArrowRight style={{ width: '14px', height: '14px' }} />
              </motion.button>
            </div>
          ) : (
            selectedRecord && (
              <div style={{
                background: '#FFFFFF', borderRadius: '24px', padding: '32px 20px',
                boxShadow: '0 2px 16px rgba(0,0,0,0.05)', border: '1px solid #F0F1F8', textAlign: 'center',
              }}>
                <Loader2 style={{ width: '22px', height: '22px', color: PALETTE.coral, animation: 'spin 1s linear infinite', margin: '0 auto 10px' }} />
                <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '12px', color: '#A0A8C0' }}>正在加载命盘信息…</p>
              </div>
            )
          )}
          </div>

          {/* 今日运势 - 第一行第三列 */}
          {dailyFortune && (
            <div style={{
              flex: 1,
              background: '#FFFFFF', borderRadius: '24px', padding: '20px',
              boxShadow: '0 2px 16px rgba(0,0,0,0.05)', border: '1px solid #F0F1F8',
              maxHeight: '520px', overflowY: 'auto',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
                <div style={{
                  width: '32px', height: '32px', borderRadius: '10px', flexShrink: 0,
                  background: `linear-gradient(135deg, ${PALETTE.coral}, ${PALETTE.orange})`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: `0 3px 10px rgba(255,107,157,0.3)`,
                }}>
                  <Sparkles style={{ width: '16px', height: '16px', color: '#FFFFFF' }} />
                </div>
                <div>
                  <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '15px', fontWeight: 800, color: '#1A1A2E' }}>今日运势</span>
                  <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '12px', color: '#A0A8C0', marginLeft: '8px' }}>
                    {new Date().getMonth() + 1}月{new Date().getDate()}日
                  </span>
                </div>
                <div style={{
                  marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '4px 12px', borderRadius: '9999px',
                  background: `${getScoreColor(dailyFortune.totalScore)}15`, border: `1px solid ${getScoreColor(dailyFortune.totalScore)}30`,
                }}>
                  <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '15px', fontWeight: 900, color: getScoreColor(dailyFortune.totalScore) }}>{dailyFortune.totalScore}</span>
                  <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '11px', fontWeight: 600, color: getScoreColor(dailyFortune.totalScore) }}>{dailyFortune.totalLabel}</span>
                </div>
              </div>

              {/* 四维横向排列 */}
              <div style={{ display: 'flex', flexDirection: 'row', gap: '8px', overflowX: 'auto', marginBottom: '12px', paddingBottom: '4px', scrollbarWidth: 'none' }}>
                {[
                  { label: '事业', score: dailyFortune.careerScore, icon: TrendingUpIcon, desc: dailyFortune.relationDescription, color: PALETTE.coral },
                  { label: '财运', score: dailyFortune.wealthScore, icon: Sparkles, desc: getDimensionDesc('wealth', dailyFortune.dayRelation || '', dailyFortune.wealthScore), color: '#F59E0B' },
                  { label: '感情', score: dailyFortune.loveScore, icon: Heart, desc: getDimensionDesc('love', dailyFortune.dayRelation || '', dailyFortune.loveScore), color: PALETTE.coral },
                  { label: '健康', score: dailyFortune.healthScore, icon: Apple, desc: getDimensionDesc('health', dailyFortune.dayRelation || '', dailyFortune.healthScore), color: '#22C55E' },
                ].map(d => (
                  <div key={d.label} style={{
                    flex: 1, minWidth: '90px', padding: '10px 12px', borderRadius: '14px',
                    background: `${getScoreColor(d.score)}0A`, border: `1px solid ${getScoreColor(d.score)}25`,
                    display: 'flex', alignItems: 'center', gap: '8px',
                  }}>
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
                      background: `${getScoreColor(d.score)}18`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <d.icon style={{ width: '16px', height: '16px', color: getScoreColor(d.score) }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '2px' }}>
                        <p style={{ fontFamily: 'Outfit', fontSize: '11px', color: '#A0A8C0' }}>{d.label}</p>
                        <p style={{ fontFamily: 'Outfit', fontSize: '16px', fontWeight: 800, color: getScoreColor(d.score), lineHeight: 1 }}>{d.score}</p>
                      </div>
                      <p style={{ fontFamily: 'Outfit', fontSize: '9px', color: '#888', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* 提示卡 - 横向紧凑 */}
              <div style={{
                padding: '10px 14px', marginBottom: '10px',
                background: `${getScoreColor(dailyFortune.totalScore)}0E`, borderRadius: '14px',
                border: `1px solid ${getScoreColor(dailyFortune.totalScore)}20`,
                fontFamily: 'Outfit, sans-serif', fontSize: '12px', color: '#6B7280', lineHeight: 1.6,
                display: 'flex', alignItems: 'center', gap: '8px',
              }}>
                <Lightbulb style={{ width: '14px', height: '14px', color: getScoreColor(dailyFortune.totalScore), flexShrink: 0 }} />
                <span>{dailyFortune.mainTip}</span>
              </div>

              {/* 宜/不宜事项 横向紧凑 */}
              <div style={{ display: 'flex', flexDirection: 'row', gap: '8px', marginTop: '10px' }}>
                <div style={{ flex: 1, padding: '8px 12px', borderRadius: '12px', background: `${PALETTE.green}08`, border: `1px solid ${PALETTE.green}25`, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Check style={{ width: '12px', height: '12px', color: PALETTE.green, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <p style={{ fontFamily: 'Outfit', fontSize: '9px', fontWeight: 700, color: PALETTE.green, marginBottom: '2px' }}>宜</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px' }}>
                      {dailyFortune.goodThings.slice(0, 2).map((g: string) => (
                        <span key={g} style={{ padding: '1px 5px', borderRadius: '5px', background: `${PALETTE.green}15`, fontFamily: 'Outfit', fontSize: '9px', color: PALETTE.green }}>{g}</span>
                      ))}
                    </div>
                  </div>
                </div>
                <div style={{ flex: 1, padding: '8px 12px', borderRadius: '12px', background: `${PALETTE.coral}08`, border: `1px solid ${PALETTE.coral}25`, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <X style={{ width: '12px', height: '12px', color: PALETTE.coral, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <p style={{ fontFamily: 'Outfit', fontSize: '9px', fontWeight: 700, color: PALETTE.coral, marginBottom: '2px' }}>不宜</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px' }}>
                      {dailyFortune.avoidThings.slice(0, 2).map((a: string) => (
                        <span key={a} style={{ padding: '1px 5px', borderRadius: '5px', background: `${PALETTE.coral}15`, fontFamily: 'Outfit', fontSize: '9px', color: PALETTE.coral }}>{a}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* 吉时/幸运色/幸运数/吉方 横向紧凑排列 */}
              <div style={{ display: 'flex', flexDirection: 'row', gap: '8px', marginTop: '10px' }}>
                <div style={{ flex: 1, padding: '8px 10px', borderRadius: '12px', background: '#00C47A08', border: '1px solid #00C47A20', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Clock style={{ width: '16px', height: '16px', color: '#00C47A', flexShrink: 0 }} />
                  <div>
                    <p style={{ fontFamily: 'Outfit', fontSize: '10px', color: '#A0A8C0' }}>吉时</p>
                    <p style={{ fontFamily: 'Outfit', fontSize: '11px', fontWeight: 700, color: '#00C47A' }}>{timeToBeijing(dailyFortune.luckyTime.split('·')[0])}</p>
                  </div>
                </div>
                <div style={{ flex: 1, padding: '8px 10px', borderRadius: '12px', background: '#FF6B9D08', border: '1px solid #FF6B9D20', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sparkles style={{ width: '16px', height: '16px', color: '#FF6B9D', flexShrink: 0 }} />
                  <div>
                    <p style={{ fontFamily: 'Outfit', fontSize: '10px', color: '#A0A8C0' }}>幸运色</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: dailyFortune.luckyColor.hex }} />
                      <p style={{ fontFamily: 'Outfit', fontSize: '11px', fontWeight: 700, color: '#FF6B9D' }}>{dailyFortune.luckyColor.name}</p>
                    </div>
                  </div>
                </div>
                <div style={{ flex: 1, padding: '8px 10px', borderRadius: '12px', background: '#7C3AED08', border: '1px solid #7C3AED20', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Star style={{ width: '16px', height: '16px', color: '#7C3AED', flexShrink: 0 }} />
                  <div>
                    <p style={{ fontFamily: 'Outfit', fontSize: '10px', color: '#A0A8C0' }}>幸运数</p>
                    <p style={{ fontFamily: 'Outfit', fontSize: '11px', fontWeight: 700, color: '#7C3AED' }}>{dailyFortune.luckyNumber}</p>
                  </div>
                </div>
                <div style={{ flex: 1, padding: '8px 10px', borderRadius: '12px', background: '#00A8E808', border: '1px solid #00A8E820', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MapPin style={{ width: '16px', height: '16px', color: '#00A8E8', flexShrink: 0 }} />
                  <div>
                    <p style={{ fontFamily: 'Outfit', fontSize: '10px', color: '#A0A8C0' }}>吉方</p>
                    <p style={{ fontFamily: 'Outfit', fontSize: '11px', fontWeight: 700, color: '#00A8E8' }}>{dailyFortune.avoidDirection.split('·')[0]}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

        </motion.div>

        {/* ── 右栏：今日穿搭 + 手串 ── */}
        {selectedRecord && previewInfo && previewInfo.baziResult && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }} style={{ display: 'flex', flexDirection: 'row', gap: '12px', alignItems: 'stretch' }}>

            {/* 今日穿搭建议卡片 */}
            {outfitRec && (
              <div style={{
                flex: 1,
                background: '#FFFFFF', borderRadius: '24px', padding: '20px',
                boxShadow: '0 2px 16px rgba(0,0,0,0.05)', border: '1px solid #F0F1F8',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '10px', flexShrink: 0,
                    background: `linear-gradient(135deg, ${PALETTE.coral}, ${PALETTE.orange})`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: `0 3px 10px rgba(255,107,157,0.3)`,
                  }}>
                    <Shirt style={{ width: '16px', height: '16px', color: '#FFFFFF' }} />
                  </div>
                  <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '15px', fontWeight: 800, color: '#1A1A2E' }}>今日穿搭建议</span>
                  <motion.button
                    onClick={() => setActiveTab(activeTab === 'outfit' ? null : 'outfit')}
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    style={{
                      marginLeft: 'auto', padding: '6px 14px', borderRadius: '9999px',
                      background: activeTab === 'outfit' ? `${PALETTE.coral}15` : `${PALETTE.coral}08`,
                      border: `1.5px solid ${activeTab === 'outfit' ? PALETTE.coral : `${PALETTE.coral}30`}`,
                      cursor: 'pointer', fontFamily: 'Outfit, sans-serif', fontSize: '12px',
                      fontWeight: 600, color: PALETTE.coral, transition: 'all 0.2s',
                    }}
                  >
                    {activeTab === 'outfit' ? '收起' : '查看详情'}
                    {activeTab === 'outfit' ? <ChevronUp style={{ width: '14px', height: '14px', marginLeft: '4px', display: 'inline' }} /> : <ChevronDown style={{ width: '14px', height: '14px', marginLeft: '4px', display: 'inline' }} />}
                  </motion.button>
                </div>

                {/* 场景快速预览 - 2x2 网格 */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                  {(() => {
                    const scenes = (outfitRec as any).sceneRecommendations || [];
                    const elementColors: Record<string, string> = {
                      wood: '#4ADE80', fire: '#FF6B6B', earth: '#D4A000', metal: '#94A3B8', water: '#00A8E8',
                    };
                    const elementNames: Record<string, string> = {
                      wood: '木', fire: '火', earth: '土', metal: '金', water: '水',
                    };
                    const getSceneIconSmall = (iconStr: string) => {
                      switch(iconStr) {
                        case 'briefcase': return <Briefcase style={{ width: '14px', height: '14px' }} />;
                        case 'shirt': return <ShirtIcon style={{ width: '14px', height: '14px' }} />;
                        case 'party': return <PartyPopper style={{ width: '14px', height: '14px' }} />;
                        case 'gift': return <Gift style={{ width: '14px', height: '14px' }} />;
                        default: return <Star style={{ width: '14px', height: '14px' }} />;
                      }
                    };
                    return scenes.slice(0, 4).map((scene: any) => {
                      const colorSuggestions: Record<string, string[]> = {
                        work: ['深蓝色西装', '白色衬衫', '灰色领带', '黑色皮鞋'],
                        casual: ['墨绿色T恤', '浅蓝色牛仔裤', '白色运动鞋', '卡其色休闲裤'],
                        party: ['酒红色连衣裙', '金色配饰', '黑色高跟鞋', '银色手拿包'],
                        holiday: ['红色毛衣', '金色配饰', '绿色连衣裙', '棕色皮靴'],
                      };
                      const colors = colorSuggestions[scene.id] || ['纯色系服装', '简约配色'];
                      return (
                        <div key={scene.id} style={{
                          padding: '12px', borderRadius: '14px',
                          background: `${scene.accentColor}08`, border: `1px solid ${scene.accentColor}25`,
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                            <div style={{
                              width: '26px', height: '26px', borderRadius: '8px',
                              background: `${scene.accentColor}20`,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              color: scene.accentColor,
                            }}>
                              {getSceneIconSmall(scene.icon)}
                            </div>
                            <span style={{
                              fontFamily: 'Outfit', fontSize: '12px', fontWeight: 700,
                              color: scene.accentColor,
                            }}>{scene.label}</span>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginBottom: '6px' }}>
                            {colors.slice(0, 2).map((color: string, i: number) => (
                              <span key={i} style={{
                                fontFamily: 'Outfit', fontSize: '10px', color: '#6B7280',
                              }}>
                                · {color}
                              </span>
                            ))}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <div style={{
                              width: '10px', height: '10px', borderRadius: '50%',
                              background: elementColors[scene.element],
                            }} />
                            <span style={{
                              fontFamily: 'Outfit', fontSize: '10px',
                              color: elementColors[scene.element], fontWeight: 600,
                            }}>{elementNames[scene.element]}属性</span>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
              )}

                {/* 点击展开详细内容 */}
                <AnimatePresence>
                  {activeTab === 'outfit' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      style={{ overflow: 'hidden', marginTop: '12px' }}
                    >
                      {/* 天气信息 */}
                      <div style={{
                        display: 'flex', gap: '12px', alignItems: 'stretch',
                        background: `linear-gradient(135deg, ${PALETTE.coralLight}, ${PALETTE.orangeLight})`,
                        borderRadius: '16px', padding: '14px 16px',
                        border: `1px solid ${PALETTE.coral}25`, marginBottom: '12px',
                      }}>
                        <div style={{
                          width: '50px', height: '50px', borderRadius: '12px', flexShrink: 0,
                          background: '#FFFFFF', display: 'flex', flexDirection: 'column',
                          alignItems: 'center', justifyContent: 'center',
                        }}>
                          {(outfitRec as any).weatherInfo?.weather?.includes('晴') ? (
                            <Sun style={{ width: '24px', height: '24px', color: '#FF9D6B' }} />
                          ) : (outfitRec as any).weatherInfo?.weather?.includes('雨') ? (
                            <CloudRain style={{ width: '24px', height: '24px', color: '#6BD4FF' }} />
                          ) : (outfitRec as any).weatherInfo?.weather?.includes('阴') ? (
                            <Cloud style={{ width: '24px', height: '24px', color: '#94A3B8' }} />
                          ) : (
                            <Wind style={{ width: '24px', height: '24px', color: '#6BD4FF' }} />
                          )}
                          <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '11px', fontWeight: 700, color: '#1A1A2E' }}>{(outfitRec as any).weatherInfo?.temperature || '--'}°</span>
                        </div>
                            <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <MapPin style={{ width: '12px', height: '12px', color: '#6B7280' }} />
                              <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '12px', fontWeight: 600, color: '#1A1A2E' }}>{(outfitRec as any).weatherInfo?.city || userLocation?.city || '未设置'}</span>
                              {locationLocked && userLocation?.city && (
                                <span style={{
                                  display: 'inline-flex', alignItems: 'center', gap: '2px',
                                  padding: '2px 6px', borderRadius: '4px',
                                  background: `${PALETTE.green}15`, border: `1px solid ${PALETTE.green}30`,
                                  fontSize: '9px', color: PALETTE.green, fontWeight: 600,
                                }}>
                                  <Sparkle style={{ width: '8px', height: '8px' }} />
                                  已锁定
                                </span>
                              )}
                              <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '11px', color: '#6B7280' }}>{(outfitRec as any).weatherInfo?.weather || '加载中...'}</span>
                            </div>
                            <div style={{ position: 'relative' }}>
                              <button
                                onClick={() => locationLocked ? unlockLocation() : setShowCityDropdown(!showCityDropdown)}
                                style={{
                                  padding: '4px 10px', borderRadius: '8px',
                                  background: locationLocked ? `${PALETTE.coral}10` : '#FFFFFF',
                                  border: `1px solid ${locationLocked ? PALETTE.coral : '#E8EAF6'}`,
                                  cursor: 'pointer', fontSize: '10px',
                                  color: locationLocked ? PALETTE.coral : '#6B7280',
                                  fontFamily: 'Outfit, sans-serif',
                                  display: 'flex', alignItems: 'center', gap: '4px',
                                }}
                              >
                                {locationLocked ? (
                                  <>
                                    <Navigation style={{ width: '10px', height: '10px' }} />
                                    修改位置
                                  </>
                                ) : (
                                  <>
                                    <Navigation style={{ width: '10px', height: '10px' }} />
                                    {showCityDropdown ? '收起' : '选择城市'}
                                  </>
                                )}
                              </button>
                              {showCityDropdown && (
                                <div style={{
                                  position: 'absolute', top: '100%', right: 0, marginTop: '4px',
                                  background: '#FFFFFF', borderRadius: '12px',
                                  boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                                  border: '1px solid #E8EAF6', zIndex: 100,
                                  width: '220px', maxHeight: '320px', overflow: 'hidden',
                                }}>
                                  <div style={{ padding: '10px', borderBottom: '1px solid #F0F1F8' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#F8F9FC', borderRadius: '8px', padding: '6px 10px' }}>
                                      <Search style={{ width: '12px', height: '12px', color: '#A0A8C0' }} />
                                      <input
                                        type="text"
                                        value={citySearch}
                                        onChange={e => setCitySearch(e.target.value)}
                                        placeholder="搜索城市..."
                                        style={{
                                          border: 'none', background: 'transparent', outline: 'none',
                                          fontSize: '12px', fontFamily: 'Outfit, sans-serif',
                                          color: '#1A1A2E', width: '100%',
                                        }}
                                      />
                                      {citySearch && (
                                        <X style={{ width: '10px', height: '10px', color: '#A0A8C0', cursor: 'pointer' }} onClick={() => setCitySearch('')} />
                                      )}
                                    </div>
                                  </div>
                                  
                                  {/* 自动定位选项 */}
                                  <div
                                    onClick={() => {
                                      detectLocation();
                                      setShowCityDropdown(false);
                                      setCitySearch('');
                                    }}
                                    style={{
                                      padding: '8px 10px', cursor: 'pointer',
                                      display: 'flex', alignItems: 'center', gap: '6px',
                                      fontFamily: 'Outfit, sans-serif', fontSize: '12px',
                                      color: '#6B7280',
                                      background: locating ? '#F8F9FC' : 'transparent',
                                      borderBottom: '1px solid #F0F1F8',
                                    }}
                                    onMouseEnter={e => (e.currentTarget.style.background = '#F8F9FC')}
                                    onMouseLeave={e => (e.currentTarget.style.background = locating ? '#F8F9FC' : 'transparent')}
                                  >
                                    <RefreshCw style={{ width: '12px', height: '12px', animation: locating ? 'spin 1s linear infinite' : 'none' }} />
                                    {locating ? '定位中...' : '自动定位'}
                                  </div>
                                  
                                  {/* 城市列表 */}
                                  <div style={{ flex: 1, overflowY: 'auto', maxHeight: '220px' }}>
                                    {(citySearch ? MAJOR_CITIES.filter(c => c.includes(citySearch)) : MAJOR_CITIES).map(city => (
                                      <div
                                        key={city}
                                        onClick={() => selectCity(city)}
                                        style={{
                                          padding: '8px 10px', cursor: 'pointer',
                                          fontFamily: 'Outfit, sans-serif', fontSize: '12px',
                                          color: userLocation?.city === city ? PALETTE.coral : '#6B7280',
                                          background: userLocation?.city === city ? `${PALETTE.coral}10` : 'transparent',
                                          fontWeight: userLocation?.city === city ? 600 : 400,
                                        }}
                                        onMouseEnter={e => {
                                          if (userLocation?.city !== city) {
                                            e.currentTarget.style.background = '#F8F9FC';
                                          }
                                        }}
                                        onMouseLeave={e => {
                                          if (userLocation?.city !== city) {
                                            e.currentTarget.style.background = 'transparent';
                                          }
                                        }}
                                      >
                                        <MapPin style={{ width: '10px', height: '10px', display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                                        {city}
                                      </div>
                                    ))}
                                    {citySearch && MAJOR_CITIES.filter(c => c.includes(citySearch)).length === 0 && (
                                      <div style={{ padding: '16px', textAlign: 'center', color: '#A0A8C0', fontSize: '12px' }}>
                                        未找到城市 "{citySearch}"
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                          {(outfitRec as any).liuriFortune && (
                            <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '11px', color: '#6B7280', lineHeight: 1.5, display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Sparkle style={{ width: '12px', height: '12px', color: PALETTE.yellow }} />
                              {(outfitRec as any).liuriFortune.description}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* 色彩推荐 */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                        {[
                          { label: '宜穿', items: (outfitRec || {}).primaryColors || [], color: PALETTE.green, bg: `${PALETTE.green}08` },
                          { label: '辅助', items: (outfitRec || {}).secondaryColors || [], color: PALETTE.blue, bg: `${PALETTE.blue}08` },
                          { label: '规避', items: (outfitRec || {}).avoidColors || [], color: '#C0C5D8', bg: '#F8F9FC' },
                        ].map(({ label, items, color, bg }) => (
                          <div key={label} style={{
                            background: bg, borderRadius: '12px', padding: '10px 8px', textAlign: 'center',
                            border: `1px solid ${color}25`,
                          }}>
                            <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '9px', fontWeight: 700, color: '#A0A8C0', marginBottom: '6px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{label}</p>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px', justifyContent: 'center' }}>
                              {(items as any[]).map((item: any, i: number) => <ElementBadge key={i} el={typeof item === 'string' ? item : item.element} />)}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* 场景穿搭推荐 - 横向并排，点击展开 */}
                      {(() => {
                        const scenes = (outfitRec as any).sceneRecommendations || [];
                        const elementColors: Record<string, string> = {
                          wood: '#4ADE80', fire: '#FF6B6B', earth: '#D4A000', metal: '#94A3B8', water: '#00A8E8',
                        };
                        const elementNames: Record<string, string> = {
                          wood: '木', fire: '火', earth: '土', metal: '金', water: '水',
                        };
                        
                        // 场景图标映射
                        const getSceneIcon = (iconStr: string) => {
                          switch(iconStr) {
                            case 'briefcase': return <Briefcase style={{ width: '18px', height: '18px' }} />;
                            case 'shirt': return <ShirtIcon style={{ width: '18px', height: '18px' }} />;
                            case 'party': return <PartyPopper style={{ width: '18px', height: '18px' }} />;
                            case 'gift': return <Gift style={{ width: '18px', height: '18px' }} />;
                            default: return <Star style={{ width: '18px', height: '18px' }} />;
                          }
                        };

                        return (
                          <>
                            {/* 场景选择按钮 - 横向并排 */}
                            <div style={{
                              display: 'grid',
                              gridTemplateColumns: `repeat(${Math.min(scenes.length, 4)}, 1fr)`,
                              gap: '8px',
                            }}>
                              {scenes.map((scene: any) => (
                                <motion.button
                                  key={scene.id}
                                  onClick={() => setActiveScene(activeScene === scene.id ? null : scene.id)}
                                  whileHover={{ y: -2, scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                  style={{
                                    padding: '12px 10px',
                                    borderRadius: '14px',
                                    background: activeScene === scene.id 
                                      ? `${scene.accentColor}15` 
                                      : '#FFFFFF',
                                    border: `1.5px solid ${activeScene === scene.id ? scene.accentColor : '#E8EAF6'}`,
                                    cursor: 'pointer',
                                    textAlign: 'center',
                                    transition: 'all 0.2s',
                                    boxShadow: activeScene === scene.id 
                                      ? `0 4px 12px ${scene.accentColor}25` 
                                      : '0 2px 6px rgba(0,0,0,0.04)',
                                  }}
                                >
                                  <div style={{
                                    width: '36px', height: '36px', borderRadius: '10px',
                                    background: `${scene.accentColor}20`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    margin: '0 auto 8px',
                                    color: scene.accentColor,
                                  }}>
                                    {getSceneIcon(scene.icon)}
                                  </div>
                                  <p style={{
                                    fontFamily: 'Outfit, sans-serif', fontSize: '12px', fontWeight: 700,
                                    color: activeScene === scene.id ? scene.accentColor : '#1A1A2E',
                                    marginBottom: '2px',
                                  }}>{scene.label}</p>
                                  <p style={{
                                    fontFamily: 'Outfit, sans-serif', fontSize: '9px', color: '#A0A8C0',
                                  }}>{scene.subtitle}</p>
                                  <div style={{
                                    marginTop: '6px', paddingTop: '4px',
                                    borderTop: `1px solid ${scene.accentColor}15`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
                                  }}>
                                    <div style={{
                                      width: '8px', height: '8px', borderRadius: '50%',
                                      background: elementColors[scene.element] || '#A0A8C0',
                                    }} />
                                    <span style={{
                                      fontFamily: 'Outfit, sans-serif', fontSize: '9px', fontWeight: 600,
                                      color: elementColors[scene.element] || '#6B7280',
                                    }}>
                                      {elementNames[scene.element] || scene.element}
                                    </span>
                                  </div>
                                  {activeScene === scene.id && (
                                    <ChevronUp style={{ width: '14px', height: '14px', color: scene.accentColor, marginTop: '4px' }} />
                                  )}
                                </motion.button>
                              ))}
                            </div>

                            {/* 场景详细展开内容 */}
                            {scenes.map((scene: any) => (
                              <AnimatePresence key={scene.id}>
                                {activeScene === scene.id && (
                                  <motion.div
                                    initial={{ opacity: 0, height: 0, marginTop: 0 }}
                                    animate={{ opacity: 1, height: 'auto', marginTop: '12px' }}
                                    exit={{ opacity: 0, height: 0, marginTop: 0 }}
                                    transition={{ duration: 0.3 }}
                                    style={{ overflow: 'hidden' }}
                                  >
                                    <div style={{
                                      background: '#FFFFFF', borderRadius: '16px',
                                      boxShadow: `0 2px 12px ${scene.accentColor}15`,
                                      border: `1.5px solid ${scene.accentColor}30`,
                                      overflow: 'hidden',
                                      position: 'relative',
                                    }}>
                                      {/* 背景装饰图标 */}
                                      <div style={{
                                        position: 'absolute', right: '10px', top: '10px',
                                        opacity: 0.06, pointerEvents: 'none',
                                      }}>
                                        {getSceneIcon(scene.icon)}
                                        <div style={{ 
                                          fontSize: '80px', 
                                          position: 'absolute', 
                                          right: '-10px', 
                                          top: '-10px',
                                          color: scene.accentColor,
                                        }}>
                                          {getSceneIcon(scene.icon)}
                                        </div>
                                      </div>

                                      {/* 详细穿搭内容 */}
                                      <div style={{ padding: '16px', position: 'relative', zIndex: 1 }}>
                                        {/* 场景头部高亮 */}
                                        <div style={{
                                          padding: '12px 14px',
                                          background: `linear-gradient(135deg, ${scene.accentColor}18, ${scene.accentColor}08)`,
                                          borderRadius: '12px', marginBottom: '14px',
                                          border: `1px solid ${scene.accentColor}25`,
                                          display: 'flex', alignItems: 'center', gap: '10px',
                                        }}>
                                          <div style={{
                                            width: '40px', height: '40px', borderRadius: '10px',
                                            background: scene.accentColor,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            color: '#FFFFFF',
                                          }}>
                                            {getSceneIcon(scene.icon)}
                                          </div>
                                          <div style={{ flex: 1 }}>
                                            <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '14px', fontWeight: 700, color: '#1A1A2E', margin: 0 }}>{scene.label}</p>
                                            <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '11px', color: '#6B7280', margin: '2px 0 0' }}>{scene.subtitle}</p>
                                          </div>
                                          <div style={{
                                            padding: '6px 12px', borderRadius: '9999px',
                                            background: `${elementColors[scene.element] || scene.accentColor}20`,
                                            border: `1px solid ${elementColors[scene.element] || scene.accentColor}40`,
                                            display: 'flex', alignItems: 'center', gap: '4px',
                                          }}>
                                            <div style={{
                                              width: '6px', height: '6px', borderRadius: '50%',
                                              background: elementColors[scene.element] || scene.accentColor,
                                            }} />
                                            <span style={{
                                              fontFamily: 'Outfit, sans-serif', fontSize: '10px', fontWeight: 700,
                                              color: elementColors[scene.element] || scene.accentColor,
                                            }}>
                                              {elementNames[scene.element] || scene.element}属性
                                            </span>
                                          </div>
                                        </div>

                                        {/* 详细穿搭方案 */}
                                        {scene.outfit && (
                                          <div style={{
                                            background: `${scene.accentColor}06`,
                                            borderRadius: '12px', padding: '14px', marginBottom: '12px',
                                            border: `1px solid ${scene.accentColor}15`,
                                          }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                                              <Sparkle style={{ width: '14px', height: '14px', color: scene.accentColor }} />
                                              <p style={{
                                                fontFamily: 'Outfit, sans-serif', fontSize: '12px', fontWeight: 700,
                                                color: scene.accentColor, margin: 0,
                                              }}>推荐穿搭方案</p>
                                            </div>
                                            
                                            {/* 上装 */}
                                            {scene.outfit.top && (
                                              <div style={{ marginBottom: '10px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                                                  <div style={{ 
                                                    width: '24px', height: '24px', borderRadius: '6px',
                                                    background: `${scene.accentColor}15`,
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                  }}>
                                                    <ShirtIcon style={{ width: '12px', height: '12px', color: scene.accentColor }} />
                                                  </div>
                                                  <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '11px', fontWeight: 600, color: '#1A1A2E' }}>上装</span>
                                                </div>
                                                <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '11px', color: '#6B7280', lineHeight: 1.6, paddingLeft: '32px' }}>
                                                  <HighlightColors text={scene.outfit.top} baseColor={scene.accentColor} />
                                                </p>
                                              </div>
                                            )}
                                            
                                            {/* 下装 */}
                                            {scene.outfit.bottom && (
                                              <div style={{ marginBottom: '10px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                                                  <div style={{ 
                                                    width: '24px', height: '24px', borderRadius: '6px',
                                                    background: `${scene.accentColor}15`,
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                  }}>
                                                    <Shirt style={{ width: '12px', height: '12px', color: scene.accentColor }} />
                                                  </div>
                                                  <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '11px', fontWeight: 600, color: '#1A1A2E' }}>下装</span>
                                                </div>
                                                <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '11px', color: '#6B7280', lineHeight: 1.6, paddingLeft: '32px' }}>
                                                  <HighlightColors text={scene.outfit.bottom} baseColor={scene.accentColor} />
                                                </p>
                                              </div>
                                            )}
                                            
                                            {/* 鞋子 */}
                                            {scene.outfit.shoes && (
                                              <div style={{ marginBottom: '10px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                                                  <div style={{ 
                                                    width: '24px', height: '24px', borderRadius: '6px',
                                                    background: `${scene.accentColor}15`,
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                  }}>
                                                    <WatchIcon style={{ width: '12px', height: '12px', color: scene.accentColor }} />
                                                  </div>
                                                  <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '11px', fontWeight: 600, color: '#1A1A2E' }}>鞋子</span>
                                                </div>
                                                <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '11px', color: '#6B7280', lineHeight: 1.6, paddingLeft: '32px' }}>
                                                  <HighlightColors text={scene.outfit.shoes} baseColor={scene.accentColor} />
                                                </p>
                                              </div>
                                            )}
                                            
                                            {/* 材质 */}
                                            {scene.outfit.material && (
                                              <div style={{
                                                padding: '10px 12px',
                                                background: '#FFFFFF',
                                                borderRadius: '8px', marginBottom: '10px',
                                              }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                                                  <Sparkle style={{ width: '12px', height: '12px', color: PALETTE.yellow }} />
                                                  <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '11px', fontWeight: 600, color: '#1A1A2E' }}>材质建议</span>
                                                </div>
                                                <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '11px', color: '#6B7280', lineHeight: 1.6, paddingLeft: '20px' }}>
                                                  <HighlightColors text={scene.outfit.material} baseColor={scene.accentColor} />
                                                </p>
                                              </div>
                                            )}
                                            
                                            {/* 配饰 */}
                                            {scene.outfit.accessories && scene.outfit.accessories.length > 0 && (
                                              <div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                                                  <Crown style={{ width: '12px', height: '12px', color: PALETTE.purple }} />
                                                  <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '11px', fontWeight: 600, color: '#1A1A2E' }}>配饰搭配</span>
                                                </div>
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', paddingLeft: '20px' }}>
                                                  {scene.outfit.accessories.map((acc: string, i: number) => (
                                                    <span key={i} style={{
                                                      padding: '4px 10px', borderRadius: '9999px',
                                                      background: `${scene.accentColor}12`,
                                                      border: `1px solid ${scene.accentColor}25`,
                                                      fontFamily: 'Outfit, sans-serif', fontSize: '11px', color: '#1A1A2E',
                                                    }}>{acc}</span>
                                                  ))}
                                                </div>
                                              </div>
                                            )}
                                          </div>
                                        )}

                                        {/* 场景说明 */}
                                        <div style={{
                                          padding: '12px 14px',
                                          background: `linear-gradient(135deg, ${scene.accentColor}08, ${scene.accentColor}04)`,
                                          borderRadius: '10px',
                                          marginBottom: '8px',
                                          border: `1px solid ${scene.accentColor}20`,
                                        }}>
                                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                                            <Lightbulb style={{ width: '14px', height: '14px', color: scene.accentColor, flexShrink: 0, marginTop: '1px' }} />
                                            <p style={{
                                              fontFamily: 'Outfit, sans-serif', fontSize: '11px', color: '#6B7280',
                                              lineHeight: 1.7,
                                            }}><HighlightColors text={scene.explanation} baseColor={scene.accentColor} /></p>
                                          </div>
                                        </div>
                                        
                                        {/* 天气提示 */}
                                        {scene.weatherTip && (
                                          <div style={{
                                            display: 'flex', alignItems: 'center', gap: '6px',
                                            padding: '8px 12px',
                                            background: '#F8F9FC',
                                            borderRadius: '8px',
                                          }}>
                                            <Sun style={{ width: '12px', height: '12px', color: PALETTE.orange }} />
                                            <p style={{
                                              fontFamily: 'Outfit, sans-serif', fontSize: '10px', color: '#A0A8C0',
                                              lineHeight: 1.5,
                                            }}>{scene.weatherTip}</p>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            ))}
                          </>
                        );
                      })()}

                      {/* 穿搭风格建议 */}
                      {(outfitRec as any).styleSuggestion && (
                        <div style={{
                          background: `linear-gradient(135deg, ${PALETTE.yellow}10, ${PALETTE.orange}10)`,
                          borderRadius: '14px', padding: '14px',
                          border: `1px solid ${PALETTE.yellow}25`,
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                            <Lightbulb style={{ width: '16px', height: '16px', color: PALETTE.yellow }} />
                            <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '12px', fontWeight: 700, color: '#1A1A2E', margin: 0 }}>穿搭风格建议</p>
                          </div>
                          <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '11px', color: '#6B7280', lineHeight: 1.7, marginBottom: '6px' }}>
                            {(outfitRec as any).styleSuggestion}
                          </p>
                          <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '11px', color: '#6B7280', lineHeight: 1.7 }}>
                            <span style={{ fontWeight: 700, color: PALETTE.yellow }}>材质推荐：</span>{(outfitRec as any).materialSuggestion}
                          </p>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* 空状态提示 */}
                {(!selectedRecord || !previewInfo || !previewInfo.baziResult) && (
                  <div style={{
                    background: '#FFFFFF', borderRadius: '24px', padding: '48px 32px',
                    boxShadow: '0 2px 16px rgba(0,0,0,0.05)', border: '1px solid #F0F1F8', textAlign: 'center',
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
                      {!selectedRecord ? '点击左侧姓名查看今日运势与穿搭推荐' : '请稍候'}
                    </p>
                    {selectedRecord && <Loader2 style={{ width: '22px', height: '22px', color: PALETTE.coral, animation: 'spin 1s linear infinite', margin: '16px auto 0' }} />}
                  </div>
                )}

                {/* 今日手串推荐卡片 - 独立卡片 */}
                {braceletRec && (
                  <div style={{
                    flex: 1,
                    background: '#FFFFFF', borderRadius: '24px', padding: '20px',
                    boxShadow: '0 2px 16px rgba(0,0,0,0.05)', border: '1px solid #F0F1F8',
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
                      <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '15px', fontWeight: 800, color: '#1A1A2E' }}>今日手串推荐</span>
                      <motion.button
                        onClick={() => setActiveTab(activeTab === 'bracelet' ? null : 'bracelet')}
                        whileHover={{ y: -1 }}
                        whileTap={{ scale: 0.98 }}
                        style={{
                          marginLeft: 'auto', padding: '6px 14px', borderRadius: '9999px',
                          background: activeTab === 'bracelet' ? `${PALETTE.purple}15` : `${PALETTE.purple}08`,
                          border: `1.5px solid ${activeTab === 'bracelet' ? PALETTE.purple : `${PALETTE.purple}30`}`,
                          cursor: 'pointer', fontFamily: 'Outfit, sans-serif', fontSize: '12px',
                          fontWeight: 600, color: PALETTE.purple, transition: 'all 0.2s',
                        }}
                      >
                        {activeTab === 'bracelet' ? '收起' : '查看详情'}
                        {activeTab === 'bracelet' ? <ChevronUp style={{ width: '14px', height: '14px', marginLeft: '4px', display: 'inline' }} /> : <ChevronDown style={{ width: '14px', height: '14px', marginLeft: '4px', display: 'inline' }} />}
                      </motion.button>
                    </div>

                    {/* 手串简要预览 */}
                    {(braceletRec as any).primaryBracelet && (() => {
                      const primary = (braceletRec as any).primaryBracelet;
                      const material = primary.material || primary.name || '';
                      const details = getBraceletDetails(material);
                      return (
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: '12px',
                          padding: '12px', borderRadius: '12px',
                          background: `${PALETTE.purple}08`, border: `1px solid ${PALETTE.purple}15`,
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
                          </div>
                          <span style={{
                            padding: '4px 10px', borderRadius: '8px',
                            background: `linear-gradient(135deg, ${PALETTE.purple}, ${PALETTE.blue})`,
                            fontSize: '10px', fontWeight: 700, color: '#FFFFFF',
                            fontFamily: 'Outfit, sans-serif',
                          }}>首选</span>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* 手串推荐内容 - 展开详情 */}
                {activeTab === 'bracelet' && braceletRec && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      
                      {/* 首选手串 - 详细展示 */}
                      {(braceletRec as any).primaryBracelet && (() => {
                        const primary = (braceletRec as any).primaryBracelet;
                        const material = primary.material || primary.name || '';
                        const details = getBraceletDetails(material);
                        // 优先使用API返回的图片，其次使用本地数据库
                        const images = (primary.images && primary.images.length > 0) ? primary.images : getBraceletImages(material);
                        
                        return (
                          <div style={{
                            background: 'linear-gradient(135deg, #FFFFFF, #F8F9FC)',
                            borderRadius: '20px', padding: '20px',
                            border: '2px solid',
                            borderImage: `linear-gradient(135deg, ${PALETTE.purple}, ${PALETTE.blue}) 1`,
                            boxShadow: `0 4px 20px ${PALETTE.purple}15`,
                          }}>
                            {/* 标题区 */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                              <div style={{
                                width: '42px', height: '42px', borderRadius: '12px',
                                background: `linear-gradient(135deg, ${PALETTE.purple}, ${PALETTE.blue})`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                boxShadow: `0 4px 14px ${PALETTE.purple}35`,
                              }}>
                                <Gem style={{ width: '20px', height: '20px', color: '#FFFFFF' }} />
                              </div>
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '16px', fontWeight: 800, color: '#1A1A2E' }}>{primary.name || material}</p>
                                  <span style={{
                                    padding: '2px 8px', borderRadius: '6px',
                                    background: `linear-gradient(135deg, ${PALETTE.purple}, ${PALETTE.blue})`,
                                    fontSize: '10px', fontWeight: 700, color: '#FFFFFF',
                                    fontFamily: 'Outfit, sans-serif',
                                  }}>首选</span>
                                </div>
                                <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '11px', color: '#A0A8C0', marginTop: '2px' }}>{primary.color || ''}</p>
                              </div>
                            </div>
                            
                            {/* 基本信息 */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '14px' }}>
                              <div style={{ 
                                padding: '10px', borderRadius: '10px', background: `${PALETTE.purple}08`,
                                textAlign: 'center', border: `1px solid ${PALETTE.purple}15`,
                              }}>
                                <p style={{ fontSize: '9px', color: '#A0A8C0', fontFamily: 'Outfit', fontWeight: 600, marginBottom: '4px', textTransform: 'uppercase' }}>材质</p>
                                <p style={{ fontSize: '12px', fontWeight: 700, color: '#1A1A2E', fontFamily: 'Outfit' }}>{primary.material}</p>
                              </div>
                              <div style={{ 
                                padding: '10px', borderRadius: '10px', background: `${PALETTE.blue}08`,
                                textAlign: 'center', border: `1px solid ${PALETTE.blue}15`,
                              }}>
                                <p style={{ fontSize: '9px', color: '#A0A8C0', fontFamily: 'Outfit', fontWeight: 600, marginBottom: '4px', textTransform: 'uppercase' }}>色彩</p>
                                <p style={{ fontSize: '12px', fontWeight: 700, color: '#1A1A2E', fontFamily: 'Outfit' }}>{primary.color || '-'}</p>
                              </div>
                              <div style={{ 
                                padding: '10px', borderRadius: '10px', background: `${PALETTE.green}08`,
                                textAlign: 'center', border: `1px solid ${PALETTE.green}15`,
                              }}>
                                <p style={{ fontSize: '9px', color: '#A0A8C0', fontFamily: 'Outfit', fontWeight: 600, marginBottom: '4px', textTransform: 'uppercase' }}>五行</p>
                                <p style={{ fontSize: '12px', fontWeight: 700, color: '#1A1A2E', fontFamily: 'Outfit' }}>{primary.element || primary.wuxing || '金'}</p>
                              </div>
                            </div>
                            
                            {/* 材质宝石标签 */}
                            {primary.stones && primary.stones.length > 0 && (
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '14px' }}>
                                {(primary.stones as any[]).map((s: any, i: number) => (
                                  <span key={i} style={{
                                    padding: '4px 10px', borderRadius: '9999px',
                                    background: `${PALETTE.purple}10`, border: `1px solid ${PALETTE.purple}25`,
                                    fontFamily: 'Outfit', fontSize: '11px', color: PALETTE.purple, fontWeight: 500,
                                  }}>
                                    {typeof s === 'string' ? s : (s.name || s.color || '')}
                                  </span>
                                ))}
                              </div>
                            )}
                            
                            {/* 详细解说区域 */}
                            {details && (
                              <>
                                {/* 功效详解 */}
                                <div style={{
                                  padding: '12px 14px', borderRadius: '12px',
                                  background: `linear-gradient(135deg, ${PALETTE.purple}06, ${PALETTE.blue}06)`,
                                  border: `1px solid ${PALETTE.purple}15`, marginBottom: '10px',
                                }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                                    <Sparkles style={{ width: '14px', height: '14px', color: PALETTE.purple }} />
                                    <span style={{ fontFamily: 'Outfit', fontSize: '12px', fontWeight: 700, color: '#1A1A2E' }}>功效详解</span>
                                  </div>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    {details.effects.slice(0, 4).map((eff, i) => (
                                      <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: PALETTE.purple, marginTop: '5px', flexShrink: 0 }} />
                                        <p style={{ fontFamily: 'Outfit', fontSize: '11px', color: '#6B7280', lineHeight: 1.5 }}>{eff}</p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                                
                                {/* 对用户增益 */}
                                <div style={{
                                  padding: '12px 14px', borderRadius: '12px',
                                  background: `linear-gradient(135deg, ${PALETTE.green}08, ${PALETTE.yellow}06)`,
                                  border: `1px solid ${PALETTE.green}20`, marginBottom: '10px',
                                }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                                    <TrendingUp style={{ width: '14px', height: '14px', color: PALETTE.green }} />
                                    <span style={{ fontFamily: 'Outfit', fontSize: '12px', fontWeight: 700, color: '#1A1A2E' }}>对您的增益作用</span>
                                  </div>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    {details.benefits.slice(0, 4).map((ben, i) => (
                                      <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                                        <Heart style={{ width: '12px', height: '12px', color: PALETTE.green, marginTop: '2px', flexShrink: 0 }} />
                                        <p style={{ fontFamily: 'Outfit', fontSize: '11px', color: '#6B7280', lineHeight: 1.5 }}>{ben}</p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                                
                                {/* 养护指南 */}
                                <div style={{
                                  padding: '12px 14px', borderRadius: '12px',
                                  background: `linear-gradient(135deg, ${PALETTE.blue}06, ${PALETTE.coral}06)`,
                                  border: `1px solid ${PALETTE.blue}15`,
                                }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                                    <Heart style={{ width: '14px', height: '14px', color: PALETTE.blue }} />
                                    <span style={{ fontFamily: 'Outfit', fontSize: '12px', fontWeight: 700, color: '#1A1A2E' }}>养护指南</span>
                                  </div>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    {details.care.slice(0, 4).map((c, i) => (
                                      <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                                        <Droplets style={{ width: '12px', height: '12px', color: PALETTE.blue, marginTop: '2px', flexShrink: 0 }} />
                                        <p style={{ fontFamily: 'Outfit', fontSize: '11px', color: '#6B7280', lineHeight: 1.5 }}>{c}</p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </>
                            )}
                            
                            {/* 如果没有详细解说，显示原有效果 */}
                            {!details && primary.effect && (
                              <div style={{
                                padding: '12px 14px', borderRadius: '12px',
                                background: `${PALETTE.purple}06`,
                                border: `1px solid ${PALETTE.purple}15`,
                              }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                                  <Sparkles style={{ width: '14px', height: '14px', color: PALETTE.purple }} />
                                  <span style={{ fontFamily: 'Outfit', fontSize: '12px', fontWeight: 700, color: '#1A1A2E' }}>功效</span>
                                </div>
                                <p style={{ fontFamily: 'Outfit', fontSize: '12px', color: '#6B7280', lineHeight: 1.7 }}>{primary.effect}</p>
                              </div>
                            )}
                          </div>
                        );
                      })()}

                      {/* 次选手串 - 简化展示 */}
                      {((braceletRec as any).recommendations || (braceletRec as any).secondaryBracelets || []).map((r: any, i: number) => {
                        const material = r.material || r.name || '';
                        const details = getBraceletDetails(material);
                        // 优先使用API返回的图片，其次使用本地数据库
                        const images = (r.images && r.images.length > 0) ? r.images : getBraceletImages(material);
                        
                        return (
                          <div key={i} style={{
                            background: '#FFFFFF', borderRadius: '16px', padding: '16px',
                            boxShadow: '0 2px 10px rgba(0,0,0,0.04)', border: '1px solid #F0F1F8',
                          }}>
                            <div style={{ flex: 1 }}>
                                {/* 标题 */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                                  <Gem style={{ width: '14px', height: '14px', color: PALETTE.purple }} />
                                  <h4 style={{ fontFamily: 'Outfit', fontSize: '14px', fontWeight: 700, color: '#1A1A2E', margin: 0 }}>{material}</h4>
                                  <span style={{
                                    padding: '2px 6px', borderRadius: '4px',
                                    background: `${PALETTE.purple}10`,
                                    fontSize: '9px', fontWeight: 600, color: PALETTE.purple,
                                    fontFamily: 'Outfit',
                                  }}>次选</span>
                                </div>
                                
                                {/* 颜色 */}
                                <p style={{ fontFamily: 'Outfit', fontSize: '11px', color: '#A0A8C0', marginBottom: '6px' }}>{r.color || ''}</p>
                                
                                {/* 简述 */}
                                <p style={{ fontFamily: 'Outfit', fontSize: '11px', color: '#6B7280', lineHeight: 1.5 }}>
                                  {r.effect || details?.description?.slice(0, 50) || ''}{r.effect && r.effect.length > 50 ? '...' : ''}
                                </p>
                              </div>
                            
                            {/* 增益作用预览 */}
                            {details && details.benefits.length > 0 && (
                              <div style={{
                                marginTop: '10px', padding: '8px 10px',
                                background: `${PALETTE.green}06`, borderRadius: '8px',
                                border: `1px solid ${PALETTE.green}15`,
                              }}>
                                <p style={{ fontFamily: 'Outfit', fontSize: '10px', fontWeight: 600, color: PALETTE.green, marginBottom: '4px' }}>增益作用</p>
                                <p style={{ fontFamily: 'Outfit', fontSize: '10px', color: '#6B7280', lineHeight: 1.4 }}>
                                  {details.benefits[0]}{details.benefits.length > 1 ? ' · ' + details.benefits[1] : ''}
                                </p>
                              </div>
                            )}
                            
                            {/* 适用场合 */}
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '8px' }}>
                              {(details?.occasions || r.occasions || r.usageTips || []).slice(0, 3).map((occ: string, j: number) => (
                                <span key={j} style={{
                                  padding: '2px 8px', borderRadius: '9999px',
                                  background: `${PALETTE.purple}08`, border: `1px solid ${PALETTE.purple}15`,
                                  fontFamily: 'Outfit', fontSize: '10px', color: PALETTE.purple,
                                }}>
                                  {occ}
                                </span>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

          </motion.div>
        )}

      </div>

      {/* ── 新建表单（弹窗） ── */}
      <AnimatePresence>
        {showForm && (
          <>
            {/* 遮罩层 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowForm(false)}
              style={{
                position: 'fixed', inset: 0, zIndex: 100,
                background: 'rgba(0,0,0,0.4)',
                backdropFilter: 'blur(4px)',
              }}
            />
            {/* 弹窗主体 */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.25 }}
              style={{
                position: 'fixed', top: '50%', left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 101, width: '90%', maxWidth: '480px',
              }}
            >
              <div style={{
                background: '#FFFFFF', borderRadius: '24px', padding: '32px',
                boxShadow: '0 8px 40px rgba(0,0,0,0.15)', border: '1px solid #F0F1F8',
                maxHeight: '85vh', overflowY: 'auto',
              }}>
                {/* 弹窗头部 */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                  <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '17px', fontWeight: 800, color: '#1A1A2E', display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
                    <span style={{
                      width: '28px', height: '28px', borderRadius: '8px',
                      background: `linear-gradient(135deg, ${PALETTE.coral}, ${PALETTE.orange})`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#FFFFFF',
                    }}>
                      {(form as any)._editingId ? <Edit3 style={{ width: '16px', height: '16px' }} /> : <Star style={{ width: '16px', height: '16px' }} />}
                    </span>
                    {(form as any)._editingId ? '修改生辰' : '录入生辰'}
                  </h3>
                  <button
                    onClick={() => setShowForm(false)}
                    style={{
                      width: '28px', height: '28px', borderRadius: '50%',
                      border: 'none', background: '#F5F5F8', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <X style={{ width: '16px', height: '16px', color: '#A0A8C0' }} />
                  </button>
                </div>
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontFamily: 'Outfit, sans-serif', fontSize: '13px', color: '#6B7280', marginBottom: '8px', fontWeight: 500 }}>姓名</label>
                  <input
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    placeholder="给自己起个名字"
                    style={{ width: '100%', padding: '14px 18px', fontSize: '15px', borderRadius: '16px', border: '1.5px solid #E8EAF6', background: '#F8F9FC', outline: 'none', fontFamily: 'Outfit, sans-serif', color: '#1A1A2E', boxSizing: 'border-box' }}
                    onFocus={e => (e.target as HTMLElement).style.borderColor = PALETTE.coral}
                    onBlur={e => (e.target as HTMLElement).style.borderColor = '#E8EAF6'}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                  {[
                    { label: '出生年', value: form.birthYear, options: YEAR_OPTIONS, key: 'birthYear' as const },
                    { label: '出生月', value: form.birthMonth, options: MONTH_OPTIONS, key: 'birthMonth' as const },
                    { label: '出生日', value: form.birthDay, options: DAY_OPTIONS, key: 'birthDay' as const },
                    { label: '出生时', value: form.birthHour, options: HOUR_OPTIONS, key: 'birthHour' as const },
                  ].map(({ label, value, options, key }) => (
                    <div key={key}>
                      <label style={{ display: 'block', fontFamily: 'Outfit, sans-serif', fontSize: '11px', color: '#A0A8C0', marginBottom: '6px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</label>
                      <select
                        value={value}
                        onChange={e => setForm({ ...form, [key]: +e.target.value })}
                        style={{ width: '100%', padding: '12px 14px', fontSize: '14px', borderRadius: '14px', border: '1.5px solid #E8EAF6', background: '#F8F9FC', outline: 'none', fontFamily: 'Outfit, sans-serif', color: '#1A1A2E' }}
                        onFocus={e => (e.target as HTMLElement).style.borderColor = PALETTE.coral}
                        onBlur={e => (e.target as HTMLElement).style.borderColor = '#E8EAF6'}
                      >
                        {options.map(o => <option key={o} value={o}>{key === 'birthHour' ? `${o}:00` : o}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
                <div>
                  <label style={{ display: 'block', fontFamily: 'Outfit, sans-serif', fontSize: '11px', color: '#A0A8C0', marginBottom: '6px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>性别</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    {[{ v: 'male', l: '男 ♂', color: PALETTE.blue }, { v: 'female', l: '女 ♀', color: PALETTE.purple }].map(({ v, l, color }) => (
                      <button key={v} type="button"
                        onClick={() => setForm({ ...form, gender: v as any })}
                        style={{
                          padding: '12px', fontFamily: 'Outfit, sans-serif', fontSize: '14px', fontWeight: 600,
                          background: form.gender === v ? `${color}15` : '#F8F9FC',
                          border: form.gender === v ? `2px solid ${color}` : '2px solid #E8EAF6',
                          color: form.gender === v ? color : '#A0A8C0',
                          borderRadius: '14px', cursor: 'pointer', transition: 'all 0.2s',
                        }}
                      >{l}</button>
                    ))}
                  </div>
                </div>

                {/* 出生地点 */}
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontFamily: 'Outfit, sans-serif', fontSize: '11px', color: '#A0A8C0', marginBottom: '6px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>出生地点（真太阳时用）</label>
                  <input
                    value={(form as any).birthLocation || ''}
                    onChange={e => setForm({ ...form, birthLocation: e.target.value } as any)}
                    placeholder="如：北京市 或 浙江省杭州市（精确到城市即可）"
                    style={{ width: '100%', padding: '14px 18px', fontSize: '14px', borderRadius: '16px', border: '1.5px solid #E8EAF6', background: '#F8F9FC', outline: 'none', fontFamily: 'Outfit, sans-serif', color: '#1A1A2E', boxSizing: 'border-box' }}
                    onFocus={e => (e.target as HTMLElement).style.borderColor = PALETTE.orange}
                    onBlur={e => (e.target as HTMLElement).style.borderColor = '#E8EAF6'}
                  />
                  <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '11px', color: '#C0C5D8', marginTop: '6px' }}>填写出生城市，系统将按真太阳时重新计算八字时辰</p>
                </div>

                {/* 历法 */}
                <div>
                  <label style={{ display: 'block', fontFamily: 'Outfit, sans-serif', fontSize: '11px', color: '#A0A8C0', marginBottom: '6px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>历法</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      {[{ v: 'solar', l: '公历', color: PALETTE.blue }, { v: 'lunar', l: '农历', color: PALETTE.purple }].map(({ v, l, color }) => (
                        <button key={v} type="button"
                          onClick={() => setForm({ ...form, calendarType: v as any })}
                          style={{
                            padding: '12px', fontFamily: 'Outfit, sans-serif', fontSize: '14px', fontWeight: 600,
                            background: form.calendarType === v ? `${color}15` : '#F8F9FC',
                            border: form.calendarType === v ? `2px solid ${color}` : '2px solid #E8EAF6',
                            color: form.calendarType === v ? color : '#A0A8C0',
                            borderRadius: '14px', cursor: 'pointer', transition: 'all 0.2s',
                          }}
                        >{l}</button>
                      ))}
                    </div>
                  </div>

                <div style={{ display: 'flex', gap: '12px', paddingTop: '4px' }}>
                  <button type="button" onClick={() => setShowForm(false)}
                    style={{
                      padding: '13px 24px', fontFamily: 'Outfit, sans-serif', fontSize: '14px', fontWeight: 600,
                      background: '#F8F9FC', border: '1.5px solid #E8EAF6', color: '#A0A8C0', borderRadius: '14px', cursor: 'pointer',
                    }}
                  >取消</button>
                  <button type="submit" disabled={submitting}
                    style={{
                      flex: 1, padding: '13px 24px', fontFamily: 'Outfit, sans-serif', fontSize: '14px', fontWeight: 700,
                      background: `linear-gradient(135deg, ${PALETTE.coral}, ${PALETTE.orange})`,
                      color: '#FFFFFF', border: 'none', borderRadius: '14px', cursor: submitting ? 'wait' : 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                      boxShadow: '0 4px 16px rgba(255,107,157,0.3)',
                    }}
                  >
                    {submitting ? <Loader2 style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} /> : <Sparkles style={{ width: '16px', height: '16px' }} />}
                    {submitting ? '处理中…' : ((form as any)._editingId ? '保存修改' : '开始八字测算')}
                  </button>
                </div>
              </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 关闭城市下拉 */}
      {showCityDropdown && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 50,
          }}
          onClick={() => setShowCityDropdown(false)}
        />
      )}
    </div>
  );
}
