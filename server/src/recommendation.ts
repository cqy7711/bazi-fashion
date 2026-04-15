import type { FiveElement, BraceletItem, OutfitRecommendation, BraceletRecommendation, ColorRecommendation, OutfitImage } from '../../shared/types.ts';

const HEAVENLY_STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
const EARTHLY_BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

const STEM_ELEMENTS: Record<string, FiveElement> = {
  '甲': 'wood', '乙': 'wood', '丙': 'fire', '丁': 'fire',
  '戊': 'earth', '己': 'earth', '庚': 'metal', '辛': 'metal',
  '壬': 'water', '癸': 'water',
};

const BRANCH_ELEMENTS: Record<string, FiveElement> = {
  '寅': 'wood', '卯': 'wood', '巳': 'fire', '午': 'fire',
  '辰': 'earth', '戌': 'earth', '丑': 'earth', '未': 'earth',
  '申': 'metal', '酉': 'metal', '亥': 'water', '子': 'water',
};

const BRANCH_HIDDEN: Record<string, { stem: string; type: 'ben' | 'zhong' | 'yu' }[]> = {
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

function calculateYearPillar(year: number): string {
  const si = ((year - 4) % 10 + 10) % 10;
  const bi = ((year - 4) % 12 + 12) % 12;
  return HEAVENLY_STEMS[si] + EARTHLY_BRANCHES[bi];
}

function calculateMonthPillar(year: number, month: number, day: number): string {
  const yearStem = HEAVENLY_STEMS[(year - 4) % 10];
  const FIRST: Record<string, number> = { '甲': 2, '己': 2, '乙': 4, '庚': 4, '丙': 6, '辛': 6, '丁': 8, '壬': 8, '戊': 0, '癸': 0 };
  const JIEQI: Record<number, { branch: number; day: number }> = {
    1: { branch: 1, day: 6 }, 2: { branch: 2, day: 4 }, 3: { branch: 3, day: 6 },
    4: { branch: 4, day: 5 }, 5: { branch: 5, day: 6 }, 6: { branch: 6, day: 6 },
    7: { branch: 7, day: 7 }, 8: { branch: 8, day: 8 }, 9: { branch: 9, day: 8 },
    10: { branch: 10, day: 8 }, 11: { branch: 11, day: 7 }, 12: { branch: 0, day: 7 },
  };
  const jq = JIEQI[month];
  let mbi: number;
  if (day >= jq.day) mbi = jq.branch;
  else mbi = JIEQI[month === 1 ? 12 : month - 1].branch;
  let off = mbi >= 2 ? mbi - 2 : mbi + 10;
  const si = (FIRST[yearStem] + off) % 10;
  return HEAVENLY_STEMS[si] + EARTHLY_BRANCHES[mbi];
}

function calculateDayPillar(year: number, month: number, day: number): string {
  const base = new Date(Date.UTC(1900, 0, 1));
  const target = new Date(Date.UTC(year, month - 1, day));
  const diff = Math.floor((target.getTime() - base.getTime()) / 86400000);
  const si = ((diff + 0) % 10 + 10) % 10;
  const bi = ((diff + 10) % 12 + 12) % 12;
  return HEAVENLY_STEMS[si] + EARTHLY_BRANCHES[bi];
}

function getTodayLiuri() {
  const today = new Date();
  const y = today.getFullYear(), m = today.getMonth() + 1, d = today.getDate();
  const yP = calculateYearPillar(y);
  const mP = calculateMonthPillar(y, m, d);
  const dP = calculateDayPillar(y, m, d);
  return {
    yearPillar: yP, monthPillar: mP, dayPillar: dP,
    yearElement: STEM_ELEMENTS[yP[0]], monthElement: STEM_ELEMENTS[mP[0]], dayElement: STEM_ELEMENTS[dP[0]],
  };
}

// 五行相生相克
const SHENG: Record<FiveElement, FiveElement> = { wood: 'fire', fire: 'earth', earth: 'metal', metal: 'water', water: 'wood' };
const KE: Record<FiveElement, FiveElement> = { wood: 'earth', fire: 'metal', earth: 'water', metal: 'wood', water: 'fire' };

function getRel(from: FiveElement, to: FiveElement): string {
  if (from === to) return 'tong';
  if (SHENG[from] === to) return 'wo-sheng';
  if (SHENG[to] === from) return 'sheng-wo';
  if (KE[from] === to) return 'wo-ke';
  if (KE[to] === from) return 'ke-wo';
  return 'neutral';
}

const ELEMENT_NAMES: Record<FiveElement, string> = { wood: '木', fire: '火', earth: '土', metal: '金', water: '水' };

// ========== 天气相关 ==========

// 中国城市经纬度
const CITY_COORDS: Record<string, { lat: number; lon: number }> = {
  '北京': { lat: 39.9042, lon: 116.4074 },
  '上海': { lat: 31.2304, lon: 121.4737 },
  '广州': { lat: 23.1291, lon: 113.2644 },
  '深圳': { lat: 22.5431, lon: 114.0579 },
  '杭州': { lat: 30.2741, lon: 120.1551 },
  '成都': { lat: 30.5728, lon: 104.0668 },
  '重庆': { lat: 29.4316, lon: 106.9123 },
  '武汉': { lat: 30.5928, lon: 114.3055 },
  '西安': { lat: 34.3416, lon: 108.9398 },
  '南京': { lat: 32.0603, lon: 118.7969 },
  '天津': { lat: 39.3434, lon: 117.3616 },
  '苏州': { lat: 31.2989, lon: 120.5853 },
  '郑州': { lat: 34.7466, lon: 113.6253 },
  '长沙': { lat: 28.2282, lon: 112.9388 },
  '沈阳': { lat: 41.8057, lon: 123.4328 },
  '青岛': { lat: 36.0671, lon: 120.3826 },
  '济南': { lat: 36.6512, lon: 117.1205 },
  '大连': { lat: 38.9140, lon: 121.6147 },
  '厦门': { lat: 24.4798, lon: 118.0894 },
  '福州': { lat: 26.0753, lon: 119.2965 },
  '哈尔滨': { lat: 45.8038, lon: 126.5340 },
  '长春': { lat: 43.8171, lon: 125.3235 },
  '石家庄': { lat: 38.0428, lon: 114.5149 },
  '太原': { lat: 37.8706, lon: 112.5489 },
  '合肥': { lat: 31.8206, lon: 117.2272 },
  '南昌': { lat: 28.6829, lon: 115.8579 },
  '昆明': { lat: 25.0406, lon: 102.7129 },
  '贵阳': { lat: 26.6470, lon: 106.6302 },
  '南宁': { lat: 22.8170, lon: 108.3665 },
  '海口': { lat: 20.0444, lon: 110.1999 },
  '拉萨': { lat: 29.6500, lon: 91.1000 },
  '兰州': { lat: 36.0611, lon: 103.8343 },
  '西宁': { lat: 36.6171, lon: 101.7782 },
  '银川': { lat: 38.4872, lon: 106.2309 },
  '乌鲁木齐': { lat: 43.8256, lon: 87.6168 },
  '呼和浩特': { lat: 40.8427, lon: 111.7499 },
};

// 天气类型到五行的映射
const WEATHER_ELEMENTS: Record<string, FiveElement> = {
  'sunny': 'fire', 'clear': 'fire', 'partly_cloudy': 'metal',
  'cloudy': 'earth', 'overcast': 'earth', 'rain': 'water',
  'drizzle': 'water', 'thunderstorm': 'water', 'snow': 'water',
  'fog': 'earth', 'haze': 'metal', 'wind': 'wood',
};

// 天气类型中文名
const WEATHER_NAMES: Record<string, string> = {
  'sunny': '晴天', 'clear': '晴朗', 'partly_cloudy': '多云',
  'cloudy': '阴天', 'overcast': '阴', 'rain': '雨天',
  'drizzle': '小雨', 'thunderstorm': '雷雨', 'snow': '雪天',
  'fog': '雾天', 'haze': '雾霾', 'wind': '大风',
};

// 获取天气信息
export interface WeatherInfo {
  city: string;
  weather: string;
  temperature: number;
  humidity: number;
  windSpeed: number;
  element: FiveElement;
  description: string;
}

function normalizeCity(s: string): string {
  return s.replace(/[省市县区镇]/g, '').trim();
}

export async function getWeatherInfo(city: string): Promise<WeatherInfo | null> {
  if (!city) return null;
  
  const name = normalizeCity(city);
  const coords = CITY_COORDS[name];
  
  if (!coords) {
    for (const [key, val] of Object.entries(CITY_COORDS)) {
      if (name.includes(key) || key.includes(name)) {
        return fetchWeather(val.lat, val.lon, key);
      }
    }
    return null;
  }
  
  return fetchWeather(coords.lat, coords.lon, name);
}

async function fetchWeather(lat: number, lon: number, city: string): Promise<WeatherInfo | null> {
  try {
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&timezone=auto`
    );
    
    if (!response.ok) return null;
    
    const data = await response.json();
    const current = data.current;
    
    const weatherCode = current.weather_code;
    const weatherType = getWeatherType(weatherCode);
    const element = WEATHER_ELEMENTS[weatherType] || 'earth';
    const weatherName = WEATHER_NAMES[weatherType] || '未知';
    
    return {
      city,
      weather: weatherName,
      temperature: Math.round(current.temperature_2m),
      humidity: Math.round(current.relative_humidity_2m),
      windSpeed: Math.round(current.wind_speed_10m),
      element,
      description: `当前${weatherName}，气温${current.temperature_2m}°C，湿度${current.relative_humidity_2m}%`,
    };
  } catch (e) {
    console.error('Weather fetch error:', e);
    return null;
  }
}

function getWeatherType(code: number): string {
  if (code === 0) return 'clear';
  if (code <= 3) return 'partly_cloudy';
  if (code <= 49) return 'fog';
  if (code <= 59) return 'drizzle';
  if (code <= 69) return 'rain';
  if (code <= 79) return 'snow';
  if (code <= 84) return 'rain';
  if (code <= 86) return 'snow';
  if (code <= 99) return 'thunderstorm';
  return 'cloudy';
}

// ========== 穿搭图片数据库 ==========

// 穿搭场景类型
type OutfitScene = 'work' | 'casual' | 'party' | 'festival';

// 穿搭详细描述接口
interface OutfitDetail {
  top: string;      // 上装详细描述
  bottom: string;   // 下装详细描述
  shoes: string;    // 鞋子推荐
  material: string; // 材质建议
  accessories: string[]; // 配饰推荐
}

// 完整穿搭详细方案数据库 - 按五行、场景和性别分类
const OUTFIT_DETAILS_MALE: Record<FiveElement, Record<OutfitScene, OutfitDetail>> = {
  wood: {
    work: { top: '浅绿色亚麻衬衫或薄荷绿牛津纺衬衫，修身版型', bottom: '卡其色修身西裤或深灰色休闲西裤', shoes: '棕色皮质乐福鞋或深棕色牛津鞋', material: '亚麻或牛津纺面料，透气舒适', accessories: ['棕色皮带', '木质袖扣', '简约银色手表'] },
    casual: { top: '军绿色工装夹克或浅绿色针织开衫', bottom: '卡其色休闲裤或浅蓝色直筒牛仔裤', shoes: '白色帆布鞋或棕色沙漠靴', material: '全棉工装面料或棉质针织', accessories: ['帆布双肩包', '渔夫帽', '简约手链'] },
    party: { top: '墨绿色丝绒西装外套或深绿色礼服衬衫', bottom: '黑色修身西裤', shoes: '黑色漆皮皮鞋或雕花牛津鞋', material: '丝绒或缎面面料', accessories: ['金色领结', '黑色领带', '银色袖扣'] },
    festival: { top: '墨绿色双面呢大衣或浅绿色羊绒毛衣', bottom: '深灰色西裤或米色休闲裤', shoes: '棕色皮鞋或黑色商务靴', material: '双面呢或羊绒面料', accessories: ['红色羊绒围巾', '金色胸针', '简约皮带'] },
  },
  fire: {
    work: { top: '酒红色西装外套或枣红色商务衬衫', bottom: '黑色修身西裤或深灰色西裤', shoes: '黑色牛津鞋或棕色商务皮鞋', material: '羊毛西装面料或纯棉衬衫面料', accessories: ['金色袖扣', '黑色领带', '银色领带夹'] },
    casual: { top: '橙红色连帽卫衣或枚红色针织毛衣', bottom: '黑色束脚休闲裤或深蓝色牛仔裤', shoes: '白色运动鞋或黑色切尔西靴', material: '纯棉卫衣料或羊毛针织', accessories: ['棒球帽', '运动手环', '简约项链'] },
    party: { top: '红色亮面飞行员夹克或橘红色印花衬衫', bottom: '黑色西裤或藏蓝色休闲西裤', shoes: '黑色漆皮皮鞋或白色休闲鞋', material: '亮面PU或真丝混纺面料', accessories: ['金色配饰', '银色手链', '设计感袖扣'] },
    festival: { top: '正红色中式立领外套或酒红色绞花毛衣', bottom: '黑色西裤或米色休闲裤', shoes: '棕色皮鞋或黑色布鞋', material: '锦缎面料或羊毛针织', accessories: ['金色盘扣', '红色围巾', '金色胸针'] },
  },
  earth: {
    work: { top: '驼色中长款风衣或焦糖色西装外套', bottom: '深蓝色西裤或同色系西裤', shoes: '棕色皮鞋或深棕色牛津鞋', material: '风衣面料或羊毛西装面料', accessories: ['棕色皮带', '格纹领带', '简约手表'] },
    casual: { top: '米白色高领针织衫或咖啡色工装外套', bottom: '卡其色休闲裤或深蓝色牛仔裤', shoes: '棕色帆布包或白色运动鞋', material: '羊绒混纺或全棉工装面料', accessories: ['帆布腰包', '渔夫帽', '简约手链'] },
    party: { top: '焦糖色丝绒西装外套或棕色格纹西装', bottom: '黑色西裤或米色西裤', shoes: '雕花皮鞋或黑色漆皮皮鞋', material: '丝绒或粗花呢面料', accessories: ['金色胸针', '棕色领结', '银色袖扣'] },
    festival: { top: '驼色羊绒大衣或焦糖色高领毛衣', bottom: '深灰色西裤或深蓝色休闲裤', shoes: '棕色皮鞋或酒红色靴子', material: '羊绒大衣面料或羊毛针织', accessories: ['金色羊绒围巾', '珍珠胸针', '简约皮带'] },
  },
  metal: {
    work: { top: '白色西装外套或银灰色商务衬衫', bottom: '浅灰色西裤或黑色修身西裤', shoes: '白色皮鞋或银色商务鞋', material: '羊毛西装面料或纯棉衬衫面料', accessories: ['银色袖扣', '银色手表', '黑色领带'] },
    casual: { top: '白色纯棉圆领T恤或银色亮面教练夹克', bottom: '银色金属光泽休闲裤或深蓝色牛仔裤', shoes: '白色运动鞋或黑色工装靴', material: '纯棉面料或亮面尼龙面料', accessories: ['银色手表', '黑色棒球帽', '简约手环'] },
    party: { top: '银色亮面西装外套或白色缎面衬衫', bottom: '黑色西裤', shoes: '黑色漆皮皮鞋或银色高跟鞋', material: '亮面聚酯纤维或缎面面料', accessories: ['黑色领结', '银色袖扣', '设计感胸针'] },
    festival: { top: '银色西装外套或白色粗花呢外套', bottom: '同款西裤或白色阔腿裤', shoes: '白色皮鞋或银色高跟鞋', material: '金属丝西装面料或粗花呢面料', accessories: ['金色袖扣', '白色手包', '简约项链'] },
  },
  water: {
    work: { top: '藏蓝色西装外套或深蓝色法式衬衫', bottom: '同款西裤或灰色修身西裤', shoes: '黑色牛津鞋或深棕色皮鞋', material: '羊毛西装面料或纯棉衬衫面料', accessories: ['银色领带夹', '银色手表', '简约皮带'] },
    casual: { top: '灰蓝色针织衫或深蓝色休闲夹克', bottom: '黑色休闲裤或深蓝色牛仔裤', shoes: '黑色帆布鞋或黑色工装靴', material: '针织面料或防风面料', accessories: ['银色耳钉', '黑色棒球帽', '简约手链'] },
    party: { top: '藏蓝色丝绒西装外套或黑色亮面西装', bottom: '黑色西裤或藏蓝色西裤', shoes: '黑色漆皮皮鞋或银色高跟鞋', material: '丝绒面料', accessories: ['金色领结', '银色袖扣', '设计感手拿包'] },
    festival: { top: '藏蓝色羊绒大衣或灰蓝色高领毛衣', bottom: '深灰色西裤或深蓝色休闲裤', shoes: '棕色皮鞋或酒红色围巾', material: '羊绒大衣面料或羊毛针织', accessories: ['金色围巾夹', '酒红色围巾', '金色胸针'] },
  },
};

const OUTFIT_DETAILS_FEMALE: Record<FiveElement, Record<OutfitScene, OutfitDetail>> = {
  wood: {
    work: { top: '浅绿色亚麻衬衫或薄荷绿针织开衫', bottom: '米白色阔腿裤或白色A字裙', shoes: '白色高跟鞋或简约裸靴', material: '亚麻或针织面料', accessories: ['草编手提包', '简约皮带', '金色耳钉'] },
    casual: { top: '浅绿色棉麻衬衫或军绿色工装外套', bottom: '卡其色休闲裤或浅蓝色牛仔裤', shoes: '帆布鞋或罗马凉鞋', material: '100%棉麻面料', accessories: ['帆布包', '渔夫帽', '简约项链'] },
    party: { top: '翠绿色雪纺上衣或墨绿色丝绒吊带', bottom: '白色蕾丝半裙或同色系阔腿裤', shoes: '银色细带高跟鞋或金色尖头鞋', material: '雪纺或丝绒面料', accessories: ['珍珠耳环', '银色手拿包', '羽毛耳饰'] },
    festival: { top: '翠绿色收腰连衣裙或浅绿色中式立领上衣', bottom: '米色直筒裤（同色套装）', shoes: '金色高跟鞋或翡翠色高跟鞋', material: '丝绸或棉丝混纺', accessories: ['金色腰带', '翡翠耳坠', '金色手包'] },
  },
  fire: {
    work: { top: '酒红色丝绸衬衫或玫红色针织衫', bottom: '黑色修身西裤或灰色毛呢半裙', shoes: '黑色高跟鞋或金色裸靴', material: '真丝或针织羊毛', accessories: ['金色耳钉', '黑色皮带', '银色手链'] },
    casual: { top: '橙红色连帽卫衣或粉紫色雪纺连衣裙', bottom: '浅蓝色牛仔短裤或深蓝色牛仔裤', shoes: '白色运动鞋或小白鞋', material: '纯棉卫衣料或雪纺面料', accessories: ['棒球帽', '银色项链', '时尚手提袋'] },
    party: { top: '红色亮片连衣裙或橘红色丝绸连衣裙', bottom: '连衣裙（连体款式）', shoes: '红色高跟鞋或金色细带高跟鞋', material: '亮片或重磅真丝面料', accessories: ['金色手拿包', '钻石耳饰', '设计感手镯'] },
    festival: { top: '正红色丝绒旗袍或红色绞花毛衣', bottom: '金色百褶裙或米色阔腿裤', shoes: '红色高跟鞋或金色高跟鞋', material: '丝绒或羊毛针织', accessories: ['翡翠耳坠', '金色手包', '红色贝雷帽'] },
  },
  earth: {
    work: { top: '驼色双排扣风衣或焦糖色高领针织衫', bottom: '米色针织连衣裙或卡其色修身西裤', shoes: '棕色乐福鞋或黑色裸靴', material: '风衣面料或羊绒混纺', accessories: ['棕色皮带', '卡其色手提包', '金色手表'] },
    casual: { top: '米色针织连衣裙或咖啡色连帽卫衣', bottom: '驼色开衫搭配连衣裙', shoes: '棕色乐福鞋或白色运动鞋', material: '针织羊毛或纯棉卫衣料', accessories: ['毛绒包', '简约围巾', '时尚手提袋'] },
    party: { top: '焦糖色丝绸连衣裙或棕色丝绒套装', bottom: '同色系阔腿裤或蕾丝半裙', shoes: '金色尖头高跟鞋或棕色手拿包', material: '真丝或丝绒面料', accessories: ['金色耳坠', '棕色手拿包', '简约项链'] },
    festival: { top: '驼色双面呢大衣搭配金色针织连衣裙', bottom: '米色百褶裙或同色套装', shoes: '金色高跟鞋或珍珠色高跟鞋', material: '双面呢大衣面料', accessories: ['金色耳环', '珍珠项链', '金色手包'] },
  },
  metal: {
    work: { top: '白色西装外套或银灰色针织衫', bottom: '同款西裤或黑色皮裙', shoes: '白色高跟鞋或银色裸靴', material: '西装面料或针织面料', accessories: ['银色胸针', '白色手提包', '简约耳饰'] },
    casual: { top: '白色纯棉T恤或银色亮片卫衣', bottom: '银色阔腿裤或深蓝色牛仔裤', shoes: '白色运动鞋或银色高跟鞋', material: '纯棉或金属丝面料', accessories: ['银色手表', '黑色棒球帽', '简约手链'] },
    party: { top: '银色亮片连衣裙或白色抹胸礼服裙', bottom: '连衣裙（连体款式）', shoes: '银色细带高跟鞋或金色高跟鞋', material: '亮片或缎面面料', accessories: ['黑色手拿包', '钻石耳饰', '银色手镯'] },
    festival: { top: '银色亮片连衣裙或白色粗花呢外套', bottom: '同色阔腿裤套装', shoes: '金色高跟鞋或白色高跟鞋', material: '亮片或粗花呢面料', accessories: ['金色腰带', '银色手拿包', '简约项链'] },
  },
  water: {
    work: { top: '藏蓝色西装外套或深蓝色丝绸衬衫', bottom: '同款西裤或灰色修身西裤', shoes: '黑色高跟鞋或银色裸靴', material: '西装面料或真丝面料', accessories: ['银色手表', '藏蓝色手提包', '简约耳饰'] },
    casual: { top: '灰蓝色针织衫或深蓝色连衣裙', bottom: '黑色休闲裤或配白色薄纱外套', shoes: '黑色帆布鞋或银色平底鞋', material: '针织或棉混纺面料', accessories: ['银色耳钉', '简约手链', '时尚手提袋'] },
    party: { top: '藏蓝色丝绒礼服或黑色亮片礼服', bottom: '连衣裙（连体款式）', shoes: '金色手拿包同色系高跟鞋', material: '丝绒面料', accessories: ['金色手拿包', '银色耳饰', '同色系手镯'] },
    festival: { top: '藏蓝色丝绒旗袍或灰蓝色西装外套', bottom: '同色阔腿裤套装', shoes: '红色手拿包搭配金色高跟鞋', material: '丝绒或西装面料', accessories: ['金色翡翠耳坠', '金色手包', '简约胸针'] },
  },
};

// 完整穿搭图片数据库 - 按五行、场景和性别分类
// 男性穿搭
const OUTFIT_IMAGES_MALE: Record<FiveElement, OutfitImage[]> = {
  wood: [
    // 职场场景
    { url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=500&fit=crop', title: '森系绅士', description: '浅绿色亚麻西装搭配白色衬衫，自然绅士', colors: ['浅绿', '白色', '卡其'], style: '森系绅士', scene: 'work', top: '浅绿色亚麻西装外套', bottom: '卡其色西裤', accessories: ['棕色皮带', '木质袖扣'], material: '亚麻面料' },
    { url: 'https://images.unsplash.com/photo-1617137968427-85924c800a22?w=400&h=500&fit=crop', title: '清新职场', description: '薄荷绿衬衫搭配深灰西裤，清新干练', colors: ['薄荷绿', '深灰', '白色'], style: '清新干练', scene: 'work', top: '薄荷绿牛津纺衬衫', bottom: '深灰色修身西裤', accessories: ['银色领带夹', '黑色皮鞋'], material: '牛津纺面料' },
    // 日常场景
    { url: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=400&h=500&fit=crop', title: '森林漫步', description: '军绿色工装夹克搭配卡其裤，自然随性', colors: ['军绿', '卡其', '深棕'], style: '森系休闲', scene: 'casual', top: '军绿色工装夹克', bottom: '卡其色休闲裤', accessories: ['帆布双肩包', '棕色沙漠靴'], material: '全棉工装面料' },
    { url: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=400&h=500&fit=crop', title: '文艺日常', description: '浅绿色针织衫搭配牛仔裤，舒适文艺', colors: ['浅绿', '牛仔蓝', '白色'], style: '文艺休闲', scene: 'casual', top: '浅绿色针织开衫', bottom: '浅蓝色直筒牛仔裤', accessories: ['复古眼镜', '白色帆布鞋'], material: '棉质针织' },
    // 聚会场景
    { url: 'https://images.unsplash.com/photo-1490578474895-699cd4e2cf59?w=400&h=500&fit=crop', title: '绅士派对', description: '深绿色丝绒西装，优雅神秘', colors: ['墨绿', '金色', '黑色'], style: '优雅绅士', scene: 'party', top: '墨绿色丝绒西装外套', bottom: '黑色西裤', accessories: ['金色领结', '黑色漆皮皮鞋'], material: '丝绒面料' },
    { url: 'https://images.unsplash.com/photo-1610652492500-ded49ceeb378?w=400&h=500&fit=crop', title: '活力型男', description: '翠绿色polo衫搭配白色长裤，活力清爽', colors: ['翠绿', '白色', '藏蓝'], style: '活力型男', scene: 'party', top: '翠绿色Polo衫', bottom: '白色休闲长裤', accessories: ['银色手链', '白色运动鞋'], material: '珠地棉面料' },
    // 节日场景
    { url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=500&fit=crop', title: '新春绅士', description: '深绿色大衣搭配红色围巾，喜庆绅士', colors: ['墨绿', '红色', '深灰'], style: '新春绅士', scene: 'festival', top: '墨绿色双面呢大衣', bottom: '深灰色西裤', accessories: ['红色羊绒围巾', '棕色皮鞋'], material: '双面呢大衣' },
    { url: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=400&h=500&fit=crop', title: '节日庆典', description: '浅绿色西装套装，喜庆又不失格调', colors: ['浅绿', '金色', '白色'], style: '庆典风格', scene: 'festival', top: '浅绿色西装外套', bottom: '同款西裤', accessories: ['金色袖扣', '白色衬衫'], material: '羊毛西装面料' },
  ],
  fire: [
    // 职场场景
    { url: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=500&fit=crop', title: '热情领袖', description: '酒红色西装套装，气场全开', colors: ['酒红', '黑色', '金色'], style: '热情领袖', scene: 'work', top: '酒红色西装外套', bottom: '黑色修身西裤', accessories: ['金色袖扣', '黑色领带'], material: '羊毛西装面料' },
    { url: 'https://images.unsplash.com/photo-1571455786673-9d9d6c194f90?w=400&h=500&fit=crop', title: '活力职场', description: '枣红色衬衫搭配灰色西裤，优雅活力', colors: ['枣红', '灰色', '藏蓝'], style: '优雅活力', scene: 'work', top: '枣红色商务衬衫', bottom: '灰色修身西裤', accessories: ['银色领带夹', '棕色皮鞋'], material: '纯棉衬衫面料' },
    // 日常场景
    { url: 'https://images.unsplash.com/photo-1588117305388-c2631a279f82?w=400&h=500&fit=crop', title: '热情日常', description: '橙红色卫衣搭配黑色休闲裤，活力满满', colors: ['橙红', '黑色', '白色'], style: '活力休闲', scene: 'casual', top: '橙红色连帽卫衣', bottom: '黑色束脚休闲裤', accessories: ['白色运动鞋', '黑色棒球帽'], material: '纯棉卫衣料' },
    { url: 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=400&h=500&fit=crop', title: '浪漫约会', description: '枚红色毛衣搭配深色牛仔裤，时尚浪漫', colors: ['枚红', '深蓝', '黑色'], style: '时尚浪漫', scene: 'casual', top: '枚红色针织毛衣', bottom: '深蓝色牛仔裤', accessories: ['银色项链', '黑色切尔西靴'], material: '羊毛针织' },
    // 聚会场景
    { url: 'https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?w=400&h=500&fit=crop', title: '闪耀全场', description: '红色亮面夹克，惊艳全场', colors: ['正红', '黑色', '金色'], style: '惊艳闪耀', scene: 'party', top: '红色亮面飞行员夹克', bottom: '黑色西裤', accessories: ['金色配饰', '黑色皮鞋'], material: '亮面PU面料' },
    { url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=500&fit=crop', title: '热情派对', description: '橘红色衬衫，热情似火', colors: ['橘红', '藏蓝', '白色'], style: '热情派对', scene: 'party', top: '橘红色印花衬衫', bottom: '藏蓝色休闲西裤', accessories: ['银色手链', '白色休闲鞋'], material: '真丝混纺面料' },
    // 节日场景
    { url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=500&fit=crop', title: '新年盛装', description: '正红色唐装外套，传统喜庆', colors: ['正红', '金色', '黑色'], style: '中式庆典', scene: 'festival', top: '正红色中式立领外套', bottom: '黑色西裤', accessories: ['金色盘扣', '黑色布鞋'], material: '锦缎面料' },
    { url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=500&fit=crop', title: '新春红装', description: '酒红色毛衣搭配米色裤，喜庆时尚', colors: ['酒红', '米色', '藏蓝'], style: '新春时尚', scene: 'festival', top: '酒红色绞花毛衣', bottom: '米色休闲裤', accessories: ['金色手表', '棕色皮鞋'], material: '羊毛针织' },
  ],
  earth: [
    // 职场场景
    { url: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=400&h=500&fit=crop', title: '知性绅士', description: '驼色风衣搭配深蓝衬衫，经典知性', colors: ['驼色', '深蓝', '深棕'], style: '知性经典', scene: 'work', top: '驼色中长款风衣', bottom: '深蓝色西裤', accessories: ['棕色皮带', '深棕皮鞋'], material: '风衣面料' },
    { url: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=500&fit=crop', title: '温暖领袖', description: '焦糖色西装套装，温暖干练', colors: ['焦糖', '深棕', '米白'], style: '温暖干练', scene: 'work', top: '焦糖色西装外套', bottom: '同款西裤', accessories: ['棕色皮鞋', '格纹领带'], material: '羊毛西装面料' },
    // 日常场景
    { url: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=400&h=500&fit=crop', title: '慵懒午后', description: '米白色针织衫搭配卡其裤，慵懒舒适', colors: ['米白', '卡其', '深棕'], style: '慵懒舒适', scene: 'casual', top: '米白色高领针织衫', bottom: '卡其色休闲裤', accessories: ['棕色帆布包', '白色运动鞋'], material: '羊绒混纺' },
    { url: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=400&h=500&fit=crop', title: '咖啡时光', description: '咖啡色工装外套搭配牛仔裤，休闲日常', colors: ['咖啡', '牛仔蓝', '黑色'], style: '休闲工装', scene: 'casual', top: '咖啡色工装外套', bottom: '深蓝色牛仔裤', accessories: ['帆布腰包', '黑色工装靴'], material: '全棉工装面料' },
    // 聚会场景
    { url: 'https://images.unsplash.com/photo-1610652492500-ded49ceeb378?w=400&h=500&fit=crop', title: '优雅焦糖', description: '焦糖色丝绒西装，优雅成熟', colors: ['焦糖', '黑色', '金色'], style: '优雅成熟', scene: 'party', top: '焦糖色丝绒西装外套', bottom: '黑色西裤', accessories: ['金色胸针', '黑色皮鞋'], material: '丝绒面料' },
    { url: 'https://images.unsplash.com/photo-1490578474895-699cd4e2cf59?w=400&h=500&fit=crop', title: '大地魅力', description: '棕色格纹西装，复古高级', colors: ['棕色', '米色', '深棕'], style: '复古高级', scene: 'party', top: '棕色格纹西装外套', bottom: '米色西裤', accessories: ['棕色领结', '雕花皮鞋'], material: '粗花呢面料' },
    // 节日场景
    { url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=500&fit=crop', title: '金秋庆典', description: '驼色大衣搭配金色围巾，华贵喜庆', colors: ['驼色', '金色', '深灰'], style: '华贵庆典', scene: 'festival', top: '驼色羊绒大衣', bottom: '深灰色西裤', accessories: ['金色羊绒围巾', '棕色皮鞋'], material: '羊绒大衣面料' },
    { url: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=400&h=500&fit=crop', title: '暖冬绅士', description: '焦糖色毛衣搭配深蓝裤，温暖节日', colors: ['焦糖', '深蓝', '白色'], style: '温暖节日', scene: 'festival', top: '焦糖色高领毛衣', bottom: '深蓝色休闲裤', accessories: ['酒红色围巾', '棕色皮鞋'], material: '羊毛针织' },
  ],
  metal: [
    // 职场场景
    { url: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=400&h=500&fit=crop', title: '纯净领袖', description: '白色西装套装，干练利落', colors: ['白色', '银色', '浅灰'], style: '纯净干练', scene: 'work', top: '白色西装外套', bottom: '浅灰色西裤', accessories: ['银色袖扣', '白色皮鞋'], material: '羊毛西装面料' },
    { url: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=500&fit=crop', title: '银色精英', description: '银灰色衬衫搭配黑色西裤，优雅干练', colors: ['银灰', '黑色', '白色'], style: '优雅干练', scene: 'work', top: '银灰色商务衬衫', bottom: '黑色修身西裤', accessories: ['银色手表', '黑色皮鞋'], material: '纯棉衬衫面料' },
    // 日常场景
    { url: 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=400&h=500&fit=crop', title: '简约日常', description: '白色T恤搭配银色休闲裤，简约时尚', colors: ['白色', '银色', '灰色'], style: '简约休闲', scene: 'casual', top: '白色纯棉圆领T恤', bottom: '银色金属光泽休闲裤', accessories: ['银色手表', '白色运动鞋'], material: '纯棉+金属丝面料' },
    { url: 'https://images.unsplash.com/photo-1617137968427-85924c800a22?w=400&h=500&fit=crop', title: '闪亮日常', description: '银色亮面夹克搭配牛仔裤，时尚抢眼', colors: ['银色', '牛仔蓝', '黑色'], style: '时尚休闲', scene: 'casual', top: '银色亮面教练夹克', bottom: '深蓝色牛仔裤', accessories: ['黑色棒球帽', '白色运动鞋'], material: '亮面尼龙面料' },
    // 聚会场景
    { url: 'https://images.unsplash.com/photo-1610652492500-ded49ceeb378?w=400&h=500&fit=crop', title: '银河璀璨', description: '银色亮面西装，惊艳全场', colors: ['银色', '黑色', '白色'], style: '璀璨闪耀', scene: 'party', top: '银色亮面西装外套', bottom: '黑色西裤', accessories: ['黑色领结', '黑色漆皮皮鞋'], material: '亮面聚酯纤维' },
    { url: 'https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?w=400&h=500&fit=crop', title: '白金魅力', description: '白色衬衫搭配银色配饰，高贵典雅', colors: ['白色', '银色', '黑色'], style: '高贵典雅', scene: 'party', top: '白色缎面衬衫', bottom: '黑色西裤', accessories: ['银色袖扣', '黑色皮鞋'], material: '缎面面料' },
    // 节日场景
    { url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=500&fit=crop', title: '新年银装', description: '银色西装套装，喜庆闪耀', colors: ['银色', '金色', '白色'], style: '闪耀庆典', scene: 'festival', top: '银色西装外套', bottom: '同款西裤', accessories: ['金色袖扣', '白色皮鞋'], material: '金属丝西装面料' },
    { url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=500&fit=crop', title: '纯洁庆典', description: '白色高领毛衣搭配灰色裤，纯洁高贵', colors: ['白色', '金色', '银色'], style: '纯洁高贵', scene: 'festival', top: '白色高领毛衣', bottom: '灰色休闲裤', accessories: ['金色胸针', '棕色皮鞋'], material: '羊绒面料' },
  ],
  water: [
    // 职场场景
    { url: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=500&fit=crop', title: '深沉领袖', description: '藏蓝色西装套装，稳重专业', colors: ['藏蓝', '黑色', '白色'], style: '稳重干练', scene: 'work', top: '藏蓝色西装外套', bottom: '同款西裤', accessories: ['银色领带夹', '黑色皮鞋'], material: '羊毛西装面料' },
    { url: 'https://images.unsplash.com/photo-1571455786673-9d9d6c194f90?w=400&h=500&fit=crop', title: '优雅深蓝', description: '深蓝色衬衫搭配灰色西裤，优雅专业', colors: ['深蓝', '灰色', '黑色'], style: '优雅专业', scene: 'work', top: '深蓝色法式衬衫', bottom: '灰色修身西裤', accessories: ['银色袖扣', '黑色牛津鞋'], material: '纯棉衬衫面料' },
    // 日常场景
    { url: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=400&h=500&fit=crop', title: '水墨日常', description: '灰蓝色调穿搭，意境深远', colors: ['灰蓝', '白色', '黑色'], style: '意境日常', scene: 'casual', top: '灰蓝色针织衫', bottom: '黑色休闲裤', accessories: ['银色耳钉', '黑色帆布鞋'], material: '针织面料' },
    { url: 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=400&h=500&fit=crop', title: '静谧深邃', description: '深蓝色冲锋衣搭配黑色裤，宁静有型', colors: ['深蓝', '黑色', '灰色'], style: '宁静有型', scene: 'casual', top: '深蓝色休闲夹克', bottom: '黑色束脚裤', accessories: ['银色手表', '黑色工装靴'], material: '防风面料' },
    // 聚会场景
    { url: 'https://images.unsplash.com/photo-1610652492500-ded49ceeb378?w=400&h=500&fit=crop', title: '深海之谜', description: '藏蓝色丝绒西装，神秘高贵', colors: ['藏蓝', '金色', '银色'], style: '神秘高贵', scene: 'party', top: '藏蓝色丝绒西装外套', bottom: '黑色西裤', accessories: ['金色领结', '黑色漆皮皮鞋'], material: '丝绒面料' },
    { url: 'https://images.unsplash.com/photo-1490578474895-699cd4e2cf59?w=400&h=500&fit=crop', title: '午夜魅力', description: '黑色亮面西装，低调奢华', colors: ['黑色', '银色', '藏蓝'], style: '低调奢华', scene: 'party', top: '黑色亮面西装外套', bottom: '藏蓝色西裤', accessories: ['银色袖扣', '黑色皮鞋'], material: '亮面面料' },
    // 节日场景
    { url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=500&fit=crop', title: '深海庆典', description: '藏蓝色大衣搭配金色配饰，高贵喜庆', colors: ['藏蓝', '金色', '红色'], style: '高贵喜庆', scene: 'festival', top: '藏蓝色羊绒大衣', bottom: '深灰色西裤', accessories: ['金色围巾夹', '酒红色围巾', '棕色皮鞋'], material: '羊绒大衣面料' },
    { url: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=400&h=500&fit=crop', title: '新年静谧', description: '灰蓝色毛衣搭配红色配饰，静谧喜庆', colors: ['灰蓝', '红色', '金色'], style: '静谧喜庆', scene: 'festival', top: '灰蓝色高领毛衣', bottom: '深蓝色休闲裤', accessories: ['红色手套', '金色胸针'], material: '羊毛针织' },
  ],
};

// 女性穿搭
const OUTFIT_IMAGES_FEMALE: Record<FiveElement, OutfitImage[]> = {
  wood: [
    // 职场场景
    { url: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=400&h=500&fit=crop', title: '森系职场风', description: '浅绿色衬衫搭配米色阔腿裤，自然干练', colors: ['浅绿', '米色', '白色'], style: '森系职场', scene: 'work', top: '浅绿色亚麻衬衫', bottom: '米白色阔腿裤', accessories: ['草编手提包', '简约皮带'], material: '亚麻材质' },
    { url: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=400&h=500&fit=crop', title: '绿意盎然', description: '薄荷绿针织衫搭配白色半身裙，知性优雅', colors: ['薄荷绿', '白色', '卡其'], style: '清新知性', scene: 'work', top: '薄荷绿针织开衫', bottom: '白色A字裙', accessories: ['木质项链', '白色高跟鞋'], material: '针织面料' },
    // 日常场景
    { url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&h=500&fit=crop', title: '春日漫步', description: '绿色碎花连衣裙搭配草编帽，清新田园', colors: ['绿色', '米色', '棕色'], style: '田园森系', scene: 'casual', top: '', bottom: '', dress: '绿色碎花连衣裙', accessories: ['草编帽', '草编包', '罗马凉鞋'], material: '棉麻混纺' },
    { url: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=400&h=500&fit=crop', title: '文艺日常', description: '棉麻衬衫搭配卡其色休闲裤，舒适自在', colors: ['浅绿', '卡其', '米白'], style: '文艺休闲', scene: 'casual', top: '浅绿色棉麻衬衫', bottom: '卡其色休闲裤', accessories: ['帆布包', '渔夫帽'], material: '100%棉麻' },
    // 聚会场景
    { url: 'https://images.unsplash.com/photo-1485462537746-965f33f7f6a7?w=400&h=500&fit=crop', title: '绿野仙踪', description: '翠绿色雪纺上衣搭配白色蕾丝半裙，仙气飘飘', colors: ['翠绿', '白色', '银色'], style: '仙气森系', scene: 'party', top: '翠绿色雪纺上衣', bottom: '白色蕾丝半裙', accessories: ['珍珠耳环', '银色细带高跟鞋'], material: '雪纺面料' },
    { url: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=400&h=500&fit=crop', title: '森林精灵', description: '墨绿色丝绒吊带裙搭配白色薄纱外搭，神秘优雅', colors: ['墨绿', '白色', '金色'], style: '神秘优雅', scene: 'party', top: '', bottom: '', dress: '墨绿色丝绒吊带裙', accessories: ['金色手拿包', '羽毛耳饰'], material: '丝绒面料' },
    // 节日场景
    { url: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=400&h=500&fit=crop', title: '春日庆典', description: '翠绿色连衣裙搭配金色腰带，喜庆又不失优雅', colors: ['翠绿', '金色', '白色'], style: '庆典风格', scene: 'festival', top: '', bottom: '', dress: '翠绿色收腰连衣裙', accessories: ['金色腰带', '翡翠耳坠', '金色手包'], material: '丝绸面料' },
    { url: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=400&h=500&fit=crop', title: '新春绿意', description: '浅绿色套装搭配红色配饰，喜庆又清新', colors: ['浅绿', '红色', '米色'], style: '新春风格', scene: 'festival', top: '浅绿色中式立领上衣', bottom: '米色直筒裤', accessories: ['红色手包', '金色项链'], material: '棉丝混纺' },
  ],
  fire: [
    // 职场场景
    { url: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=400&h=500&fit=crop', title: '热情职场', description: '酒红色丝绸衬衫搭配黑色西裤，干练有气场', colors: ['酒红', '黑色', '金色'], style: '热情干练', scene: 'work', top: '酒红色丝绸衬衫', bottom: '黑色修身西裤', accessories: ['金色耳钉', '黑色皮带'], material: '真丝面料' },
    { url: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=400&h=500&fit=crop', title: '活力玫红', description: '玫红色针织衫搭配灰色半裙，优雅活力', colors: ['玫红', '灰色', '黑色'], style: '优雅活力', scene: 'work', top: '玫红色针织衫', bottom: '灰色毛呢半裙', accessories: ['银色手链', '黑色裸靴'], material: '针织羊毛' },
    // 日常场景
    { url: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=400&h=500&fit=crop', title: '热情日常', description: '橙红色卫衣搭配牛仔短裤，活力满满', colors: ['橙红', '牛仔蓝', '白色'], style: '活力休闲', scene: 'casual', top: '橙红色连帽卫衣', bottom: '浅蓝色牛仔短裤', accessories: ['白色运动鞋', '棒球帽'], material: '纯棉卫衣料' },
    { url: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=400&h=500&fit=crop', title: '浪漫日常', description: '粉紫色雪纺连衣裙，温柔浪漫', colors: ['粉紫', '白色', '银色'], style: '浪漫休闲', scene: 'casual', top: '', bottom: '', dress: '粉紫色雪纺连衣裙', accessories: ['银色项链', '小白鞋'], material: '雪纺面料' },
    // 聚会场景
    { url: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400&h=500&fit=crop', title: '闪耀全场', description: '红色亮片连衣裙成为焦点，惊艳全场', colors: ['正红', '金色', '黑色'], style: '惊艳闪耀', scene: 'party', top: '', bottom: '', dress: '红色亮片连衣裙', accessories: ['金色手拿包', '红色高跟鞋', '钻石耳饰'], material: '亮片面料' },
    { url: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=400&h=500&fit=crop', title: '热情如火', description: '橘红色丝绸连衣裙，热情似火', colors: ['橘红', '黑色', '金色'], style: '热情浪漫', scene: 'party', top: '', bottom: '', dress: '橘红色丝绸连衣裙', accessories: ['金色腰带', '黑色手拿包'], material: '重磅真丝' },
    // 节日场景
    { url: 'https://images.unsplash.com/photo-1517003091952-128b0c3a9bb3?w=400&h=500&fit=crop', title: '节日盛装', description: '正红色丝绒旗袍，复古喜庆', colors: ['正红', '金色', '黑色'], style: '中式庆典', scene: 'festival', top: '', bottom: '', dress: '正红色丝绒旗袍', accessories: ['翡翠耳坠', '金色手包', '红色高跟鞋'], material: '丝绒面料' },
    { url: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=400&h=500&fit=crop', title: '新春红装', description: '红色毛衣搭配金色百褶裙，喜庆时尚', colors: ['红色', '金色', '米白'], style: '新春时尚', scene: 'festival', top: '红色绞花毛衣', bottom: '金色百褶裙', accessories: ['金色耳环', '红色贝雷帽'], material: '羊毛针织' },
  ],
  earth: [
    // 职场场景
    { url: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=400&h=500&fit=crop', title: '知性大地', description: '驼色风衣搭配米色连衣裙，经典知性', colors: ['驼色', '米色', '焦糖'], style: '知性经典', scene: 'work', top: '驼色双排扣风衣', bottom: '米色针织连衣裙', accessories: ['棕色皮带', '卡其色手提包'], material: '风衣面料' },
    { url: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=400&h=500&fit=crop', title: '温暖职场', description: '焦糖色针织衫搭配卡其色西裤，温暖干练', colors: ['焦糖', '卡其', '深棕'], style: '温暖干练', scene: 'work', top: '焦糖色高领针织衫', bottom: '卡其色修身西裤', accessories: ['棕色皮带', '金色手表'], material: '羊绒混纺' },
    // 日常场景
    { url: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=400&h=500&fit=crop', title: '慵懒午后', description: '米色针织连衣裙搭配驼色开衫，慵懒舒适', colors: ['米色', '驼色', '焦糖'], style: '慵懒舒适', scene: 'casual', top: '', bottom: '', dress: '米色针织连衣裙', accessories: ['驼色毛绒包', '棕色乐福鞋'], material: '针织羊毛' },
    { url: 'https://images.unsplash.com/photo-1475180098004-ca77a66827be?w=400&h=500&fit=crop', title: '咖啡时光', description: '咖啡色卫衣搭配浅蓝色牛仔裤，休闲日常', colors: ['咖啡', '浅蓝', '白色'], style: '休闲日常', scene: 'casual', top: '咖啡色连帽卫衣', bottom: '浅蓝色直筒牛仔裤', accessories: ['帆布包', '白色运动鞋'], material: '纯棉卫衣料' },
    // 聚会场景
    { url: 'https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?w=400&h=500&fit=crop', title: '优雅焦糖', description: '焦糖色丝绸连衣裙，优雅女人味', colors: ['焦糖', '金色', '米色'], style: '优雅浪漫', scene: 'party', top: '', bottom: '', dress: '焦糖色丝绸连衣裙', accessories: ['金色耳坠', '棕色手拿包', '米色高跟鞋'], material: '真丝面料' },
    { url: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=400&h=500&fit=crop', title: '大地魅力', description: '棕色丝绒套装，复古高级感', colors: ['棕色', '金色', '米色'], style: '复古高级', scene: 'party', top: '棕色丝绒上衣', bottom: '同色系阔腿裤', accessories: ['金色胸针', '棕色手拿包'], material: '丝绒面料' },
    // 节日场景
    { url: 'https://images.unsplash.com/photo-1517003091952-128b0c3a9bb3?w=400&h=500&fit=crop', title: '金秋庆典', description: '驼色大衣搭配金色连衣裙，华贵喜庆', colors: ['驼色', '金色', '白色'], style: '华贵庆典', scene: 'festival', top: '驼色双面呢大衣', bottom: '', dress: '金色针织连衣裙', accessories: ['金色耳环', '珍珠项链'], material: '双面呢大衣' },
    { url: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=400&h=500&fit=crop', title: '暖冬时节', description: '焦糖色毛衣搭配米色百褶裙，温暖节日', colors: ['焦糖', '米色', '酒红'], style: '温暖节日', scene: 'festival', top: '焦糖色绞花毛衣', bottom: '米色百褶裙', accessories: ['酒红色围巾', '金色手链'], material: '羊毛针织' },
  ],
  metal: [
    // 职场场景
    { url: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=400&h=500&fit=crop', title: '纯净干练', description: '白色西装套装搭配银色衬衫，干练利落', colors: ['白色', '银色', '灰色'], style: '纯净干练', scene: 'work', top: '白色西装外套', bottom: '同款西裤', accessories: ['银色胸针', '白色手提包'], material: '西装面料' },
    { url: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=400&h=500&fit=crop', title: '银色魅力', description: '银灰色针织衫搭配黑色半裙，优雅干练', colors: ['银灰', '黑色', '白色'], style: '优雅干练', scene: 'work', top: '银灰色针织衫', bottom: '黑色皮裙', accessories: ['银色项链', '黑色高跟鞋'], material: '针织面料' },
    // 日常场景
    { url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=500&fit=crop', title: '简约日常', description: '白色T恤搭配银色阔腿裤，简约时尚', colors: ['白色', '银色', '灰色'], style: '简约休闲', scene: 'casual', top: '白色纯棉T恤', bottom: '银色阔腿裤', accessories: ['银色手表', '白色运动鞋'], material: '纯棉+金属丝面料' },
    { url: 'https://images.unsplash.com/photo-1485230405346-71acb9518d9c?w=400&h=500&fit=crop', title: '闪亮日常', description: '银色亮片卫衣搭配牛仔裤，时尚抢眼', colors: ['银色', '牛仔蓝', '黑色'], style: '时尚休闲', scene: 'casual', top: '银色亮片卫衣', bottom: '深蓝色牛仔裤', accessories: ['黑色棒球帽', '白色运动鞋'], material: '亮片面料' },
    // 聚会场景
    { url: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400&h=500&fit=crop', title: '银河璀璨', description: '银色亮片连衣裙，惊艳全场', colors: ['银色', '黑色', '白色'], style: '璀璨闪耀', scene: 'party', top: '', bottom: '', dress: '银色亮片连衣裙', accessories: ['黑色手拿包', '银色细带高跟鞋', '钻石耳饰'], material: '亮片面料' },
    { url: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=400&h=500&fit=crop', title: '白金优雅', description: '白色礼服裙搭配金色配饰，高贵典雅', colors: ['白色', '金色', '银色'], style: '高贵典雅', scene: 'party', top: '', bottom: '', dress: '白色抹胸礼服裙', accessories: ['金色手拿包', '金色细带高跟鞋'], material: '缎面面料' },
    // 节日场景
    { url: 'https://images.unsplash.com/photo-1517003091952-128b0c3a9bb3?w=400&h=500&fit=crop', title: '新年银装', description: '银色亮片连衣裙，喜庆闪耀', colors: ['银色', '金色', '白色'], style: '闪耀庆典', scene: 'festival', top: '', bottom: '', dress: '银色亮片连衣裙', accessories: ['金色腰带', '银色手拿包'], material: '亮片面料' },
    { url: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=400&h=500&fit=crop', title: '纯洁庆典', description: '白色套装搭配金色配饰，纯洁高贵', colors: ['白色', '金色', '银色'], style: '纯洁高贵', scene: 'festival', top: '白色粗花呢外套', bottom: '白色阔腿裤', accessories: ['金色胸针', '白色手包'], material: '粗花呢面料' },
  ],
  water: [
    // 职场场景
    { url: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=400&h=500&fit=crop', title: '深沉干练', description: '藏蓝色西装套装，稳重专业', colors: ['藏蓝', '黑色', '白色'], style: '稳重干练', scene: 'work', top: '藏蓝色西装外套', bottom: '同款西裤', accessories: ['银色领带夹', '藏蓝色手提包'], material: '西装面料' },
    { url: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=400&h=500&fit=crop', title: '优雅深蓝', description: '深蓝色丝绸衬衫搭配灰色西裤，优雅专业', colors: ['深蓝', '灰色', '黑色'], style: '优雅专业', scene: 'work', top: '深蓝色丝绸衬衫', bottom: '灰色修身西裤', accessories: ['银色手表', '黑色皮鞋'], material: '真丝面料' },
    // 日常场景
    { url: 'https://images.unsplash.com/photo-1502716119720-b23a93e5fe1b?w=400&h=500&fit=crop', title: '水墨日常', description: '灰蓝色调穿搭如水墨画般意境深远', colors: ['灰蓝', '白色', '黑色'], style: '意境日常', scene: 'casual', top: '灰蓝色针织衫', bottom: '黑色休闲裤', accessories: ['银色耳钉', '黑色帆布鞋'], material: '针织面料' },
    { url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&h=500&fit=crop', title: '静谧深邃', description: '深蓝色连衣裙搭配白色外套，宁静优雅', colors: ['深蓝', '白色', '银色'], style: '宁静优雅', scene: 'casual', top: '', bottom: '', dress: '深蓝色连衣裙', accessories: ['白色薄纱外套', '银色项链'], material: '棉混纺面料' },
    // 聚会场景
    { url: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400&h=500&fit=crop', title: '深海之谜', description: '藏蓝色丝绒礼服，神秘高贵', colors: ['藏蓝', '金色', '银色'], style: '神秘高贵', scene: 'party', top: '', bottom: '', dress: '藏蓝色丝绒礼服裙', accessories: ['金色手拿包', '银色耳饰', '同色系高跟鞋'], material: '丝绒面料' },
    { url: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=400&h=500&fit=crop', title: '午夜魅力', description: '黑色亮片礼服裙，低调奢华', colors: ['黑色', '银色', '白色'], style: '低调奢华', scene: 'party', top: '', bottom: '', dress: '黑色亮片礼服裙', accessories: ['银色手拿包', '黑色细带高跟鞋'], material: '亮片面料' },
    // 节日场景
    { url: 'https://images.unsplash.com/photo-1517003091952-128b0c3a9bb3?w=400&h=500&fit=crop', title: '深海庆典', description: '藏蓝色丝绒旗袍搭配金色配饰，高贵喜庆', colors: ['藏蓝', '金色', '银色'], style: '高贵喜庆', scene: 'festival', top: '', bottom: '', dress: '藏蓝色丝绒旗袍', accessories: ['金色翡翠耳坠', '金色手包'], material: '丝绒面料' },
    { url: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=400&h=500&fit=crop', title: '新年静谧', description: '灰蓝色套装搭配红色配饰，静谧中带喜庆', colors: ['灰蓝', '红色', '金色'], style: '静谧喜庆', scene: 'festival', top: '灰蓝色西装外套', bottom: '同款阔腿裤', accessories: ['红色手包', '金色胸针'], material: '西装面料' },
  ],
};

// ========== 原有数据库 ==========

const COLOR_DB: Record<FiveElement, ColorRecommendation[]> = {
  wood: [
    { color: '绿色', element: 'wood', description: '生机勃勃，带来活力' },
    { color: '青色', element: 'wood', description: '清新自然，舒缓心情' },
    { color: '翠色', element: 'wood', description: '春意盎然，充满希望' },
  ],
  fire: [
    { color: '红色', element: 'fire', description: '热情奔放，增强气场' },
    { color: '粉色', element: 'fire', description: '温柔浪漫，提升人缘' },
    { color: '紫色', element: 'fire', description: '高贵神秘，增强魅力' },
  ],
  earth: [
    { color: '黄色', element: 'earth', description: '温暖稳重，带来安定' },
    { color: '米色', element: 'earth', description: '柔和舒适，适合日常' },
    { color: '咖啡色', element: 'earth', description: '沉稳大气，提升信任' },
  ],
  metal: [
    { color: '白色', element: 'metal', description: '纯净简洁，提升专注' },
    { color: '银色', element: 'metal', description: '现代时尚，增强气场' },
    { color: '金色', element: 'metal', description: '富贵华丽，招财纳福' },
  ],
  water: [
    { color: '黑色', element: 'water', description: '神秘深邃，增强智慧' },
    { color: '深蓝色', element: 'water', description: '宁静沉稳，利于思考' },
    { color: '灰色', element: 'water', description: '低调内敛，适合商务' },
  ],
};

const STYLE_DB: Record<FiveElement, { style: string; material: string }> = {
  wood: { style: '森系，自然、文艺风格，棉麻材质，宽松舒适版型', material: '棉麻、镂空针织、亚麻等天然材质' },
  fire: { style: '热情、活力、时尚感，可适当选择亮色系或设计感强的单品', material: '丝绸、丝绒、亮面材质，展现光泽感' },
  earth: { style: '稳重、简约、经典风格，大地色系为主', material: '羊毛、呢料、针织等温暖质感的面料' },
  metal: { style: '简约、干练、现代感，线条利落，版型挺括', material: '金属感面料、亮片、皮革等有光泽的材质' },
  water: { style: '优雅、神秘、流动感，垂坠感好的服装', material: '丝绸、雪纺、缎面等流动感强的面料' },
};

// 手串图片 - 直接使用前端 public/images/ 目录的 SVG 路径
const BRACELET_IMAGE_DATA_URIS: Record<string, string> = {
  jade: '/images/jade.svg',
  lapis: '/images/lapis-lazuli.svg',
  redAgate: '/images/red-agate.svg',
  amber: '/images/amber.svg',
  white: '/images/white-crystal.svg',
  black: '/images/black-obsidian.svg',
  wood: '/images/wood.svg',
  turquoise: '/images/turquoise.svg',
  silver: '/images/silver-ring.svg',
  purple: '/images/purple-amethyst.svg',
  gold: '/images/gold-tiger-eye.svg',
};

// 手串图片数据库 - 使用本地SVG生成的data URI
const BRACELET_IMAGES: Record<string, string[]> = {
  // 绿色系 - 绿幽灵、翡翠 (使用本地SVG生成的data URI)
  '绿幽灵水晶手串': [BRACELET_IMAGE_DATA_URIS.jade, BRACELET_IMAGE_DATA_URIS.jade, BRACELET_IMAGE_DATA_URIS.jade],
  '翡翠手串': [BRACELET_IMAGE_DATA_URIS.jade, BRACELET_IMAGE_DATA_URIS.jade, BRACELET_IMAGE_DATA_URIS.jade],
  // 木质系 - 檀木手串
  '檀木手串': [BRACELET_IMAGE_DATA_URIS.wood, BRACELET_IMAGE_DATA_URIS.wood, BRACELET_IMAGE_DATA_URIS.wood],
  // 蓝绿色系 - 绿松石、海蓝宝、青金石
  '绿松石手串': [BRACELET_IMAGE_DATA_URIS.turquoise, BRACELET_IMAGE_DATA_URIS.turquoise, BRACELET_IMAGE_DATA_URIS.turquoise],
  '海蓝宝手串': [BRACELET_IMAGE_DATA_URIS.turquoise, BRACELET_IMAGE_DATA_URIS.turquoise, BRACELET_IMAGE_DATA_URIS.turquoise],
  '青金石手串': [BRACELET_IMAGE_DATA_URIS.lapis, BRACELET_IMAGE_DATA_URIS.lapis, BRACELET_IMAGE_DATA_URIS.lapis],
  // 红色系 - 南红、珊瑚、石榴石
  '南红玛瑙手串': [BRACELET_IMAGE_DATA_URIS.redAgate, BRACELET_IMAGE_DATA_URIS.redAgate, BRACELET_IMAGE_DATA_URIS.redAgate],
  '红珊瑚手串': [BRACELET_IMAGE_DATA_URIS.redAgate, BRACELET_IMAGE_DATA_URIS.redAgate, BRACELET_IMAGE_DATA_URIS.redAgate],
  '石榴石手串': [BRACELET_IMAGE_DATA_URIS.redAgate, BRACELET_IMAGE_DATA_URIS.redAgate, BRACELET_IMAGE_DATA_URIS.redAgate],
  // 黄色系 - 琥珀、蜜蜡、黄水晶、虎眼石、和田黄玉
  '琥珀手串': [BRACELET_IMAGE_DATA_URIS.amber, BRACELET_IMAGE_DATA_URIS.amber, BRACELET_IMAGE_DATA_URIS.amber],
  '蜜蜡手串': [BRACELET_IMAGE_DATA_URIS.amber, BRACELET_IMAGE_DATA_URIS.amber, BRACELET_IMAGE_DATA_URIS.amber],
  '黄水晶手串': [BRACELET_IMAGE_DATA_URIS.amber, BRACELET_IMAGE_DATA_URIS.amber, BRACELET_IMAGE_DATA_URIS.amber],
  '虎眼石手串': [BRACELET_IMAGE_DATA_URIS.amber, BRACELET_IMAGE_DATA_URIS.amber, BRACELET_IMAGE_DATA_URIS.amber],
  '和田黄玉手串': [BRACELET_IMAGE_DATA_URIS.amber, BRACELET_IMAGE_DATA_URIS.amber, BRACELET_IMAGE_DATA_URIS.amber],
  // 白色/透明系 - 白水晶、月光石
  '白水晶手串': [BRACELET_IMAGE_DATA_URIS.white, BRACELET_IMAGE_DATA_URIS.white, BRACELET_IMAGE_DATA_URIS.white],
  '月光石手串': [BRACELET_IMAGE_DATA_URIS.white, BRACELET_IMAGE_DATA_URIS.white, BRACELET_IMAGE_DATA_URIS.white],
  // 黑色系 - 黑曜石、黑玛瑙
  '黑曜石手串': [BRACELET_IMAGE_DATA_URIS.black, BRACELET_IMAGE_DATA_URIS.black, BRACELET_IMAGE_DATA_URIS.black],
  '黑玛瑙手串': [BRACELET_IMAGE_DATA_URIS.black, BRACELET_IMAGE_DATA_URIS.black, BRACELET_IMAGE_DATA_URIS.black],
  // 银色系 - 银饰手串
  '银饰手串': [BRACELET_IMAGE_DATA_URIS.silver, BRACELET_IMAGE_DATA_URIS.silver, BRACELET_IMAGE_DATA_URIS.silver],
  // 金色系 - 金发晶
  '金发晶手串': [BRACELET_IMAGE_DATA_URIS.amber, BRACELET_IMAGE_DATA_URIS.amber, BRACELET_IMAGE_DATA_URIS.amber],
  // 默认图片
  'default': [BRACELET_IMAGE_DATA_URIS.white, BRACELET_IMAGE_DATA_URIS.white, BRACELET_IMAGE_DATA_URIS.white],
};

// 手串数据库（使用本地SVG生成的data URI）
const BRACELET_DB: Record<FiveElement, BraceletItem[]> = {
  wood: [
    { name: '绿幽灵水晶手串', material: '绿幽灵水晶', color: '绿色', element: 'wood', effect: '招财聚财，增强事业运', image: BRACELET_IMAGE_DATA_URIS.jade },
    { name: '翡翠手串', material: '天然翡翠', color: '翠绿', element: 'wood', effect: '保平安，增进健康', image: BRACELET_IMAGE_DATA_URIS.jade },
    { name: '檀木手串', material: '小叶紫檀', color: '深棕', element: 'wood', effect: '安神静心，辟邪护身', image: BRACELET_IMAGE_DATA_URIS.wood },
    { name: '绿松石手串', material: '天然绿松石', color: '蓝绿', element: 'wood', effect: '增强沟通能力，带来好运', image: BRACELET_IMAGE_DATA_URIS.turquoise },
  ],
  fire: [
    { name: '南红玛瑙手串', material: '南红玛瑙', color: '红色', element: 'fire', effect: '增强自信，提升行动力', image: BRACELET_IMAGE_DATA_URIS.redAgate },
    { name: '红珊瑚手串', material: '天然红珊瑚', color: '朱红', element: 'fire', effect: '辟邪护身，增进人缘', image: BRACELET_IMAGE_DATA_URIS.redAgate },
    { name: '石榴石手串', material: '石榴石', color: '酒红', element: 'fire', effect: '增强活力，改善气血', image: BRACELET_IMAGE_DATA_URIS.redAgate },
    { name: '琥珀手串', material: '天然琥珀', color: '蜜黄', element: 'fire', effect: '安神定心，带来温暖', image: BRACELET_IMAGE_DATA_URIS.amber },
  ],
  earth: [
    { name: '黄水晶手串', material: '黄水晶', color: '金黄', element: 'earth', effect: '招财进宝，增强自信', image: BRACELET_IMAGE_DATA_URIS.amber },
    { name: '虎眼石手串', material: '虎眼石', color: '棕黄', element: 'earth', effect: '增强决断力，辟邪护身', image: BRACELET_IMAGE_DATA_URIS.amber },
    { name: '和田黄玉手串', material: '和田黄玉', color: '暖黄', element: 'earth', effect: '温润养身，安定心神', image: BRACELET_IMAGE_DATA_URIS.amber },
    { name: '蜜蜡手串', material: '天然蜜蜡', color: '蜜黄', element: 'earth', effect: '安神静心，辟邪纳福', image: BRACELET_IMAGE_DATA_URIS.amber },
  ],
  metal: [
    { name: '白水晶手串', material: '白水晶', color: '透明', element: 'metal', effect: '净化磁场，增强专注力', image: BRACELET_IMAGE_DATA_URIS.white },
    { name: '银饰手串', material: '925纯银', color: '银白', element: 'metal', effect: '辟邪护身，镇定安神', image: BRACELET_IMAGE_DATA_URIS.silver },
    { name: '金发晶手串', material: '金发晶', color: '金黄', element: 'metal', effect: '招财聚财，增强自信', image: BRACELET_IMAGE_DATA_URIS.amber },
    { name: '月光石手串', material: '月光石', color: '银白蓝光', element: 'metal', effect: '增强直觉，稳定情绪', image: BRACELET_IMAGE_DATA_URIS.white },
  ],
  water: [
    { name: '黑曜石手串', material: '黑曜石', color: '黑色', element: 'water', effect: '强力辟邪，吸收负能量', image: BRACELET_IMAGE_DATA_URIS.black },
    { name: '海蓝宝手串', material: '海蓝宝石', color: '海蓝', element: 'water', effect: '增强沟通能力，平复情绪', image: BRACELET_IMAGE_DATA_URIS.turquoise },
    { name: '青金石手串', material: '青金石', color: '深蓝', element: 'water', effect: '增强智慧，提升洞察力', image: BRACELET_IMAGE_DATA_URIS.lapis },
    { name: '黑玛瑙手串', material: '黑玛瑙', color: '深黑', element: 'water', effect: '稳定情绪，增强毅力', image: BRACELET_IMAGE_DATA_URIS.black },
  ],
};

function getRandomElement<T>(arr: T[], seed: string): T {
  const hash = seed.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return arr[hash % arr.length];
}

// 天气对穿搭的影响权重
const WEATHER_ADJUSTMENTS: Record<FiveElement, { boost: Record<string, FiveElement>; desc: Record<string, string> }> = {
  wood: {
    boost: { sunny: 'fire', clear: 'fire', partly_cloudy: 'wood', cloudy: 'earth', rain: 'water', snow: 'metal' },
    desc: { sunny: '晴天阳光明媚，适合浅绿色系', clear: '晴朗天气，绿色更显清新', partly_cloudy: '多云天，绿色保持自然', cloudy: '阴天可加暖色辅助', rain: '雨天宜防水材质', snow: '雪天金属光泽更亮眼' },
  },
  fire: {
    boost: { sunny: 'fire', clear: 'fire', partly_cloudy: 'fire', cloudy: 'earth', rain: 'water', snow: 'metal' },
    desc: { sunny: '晴天红色更热情耀眼', clear: '晴朗天红色系气场全开', partly_cloudy: '多云时红色提振精神', cloudy: '阴天可配暖色提气色', rain: '雨天玫红色更优雅', snow: '雪天酒红温暖有型' },
  },
  earth: {
    boost: { sunny: 'fire', clear: 'fire', partly_cloudy: 'earth', cloudy: 'earth', rain: 'metal', snow: 'metal' },
    desc: { sunny: '晴天焦糖色更温暖', clear: '晴朗天驼色经典大方', partly_cloudy: '多云天大地色系稳靠', cloudy: '阴天大地色系显气质', rain: '雨天金属配件提升质感', snow: '雪天同色系更和谐' },
  },
  metal: {
    boost: { sunny: 'metal', clear: 'metal', partly_cloudy: 'water', cloudy: 'metal', rain: 'water', snow: 'metal' },
    desc: { sunny: '晴天白色更纯净', clear: '晴朗天银色更闪耀', partly_cloudy: '多云天深色显专业', cloudy: '阴天灰色更低调优雅', rain: '雨天深色系更沉稳', snow: '雪天白色系更出众' },
  },
  water: {
    boost: { sunny: 'fire', clear: 'fire', partly_cloudy: 'water', cloudy: 'metal', rain: 'water', snow: 'metal' },
    desc: { sunny: '晴天可配红色点缀', clear: '晴朗天深蓝更稳重', partly_cloudy: '多云天水感更宁静', cloudy: '阴天深色系显深邃', rain: '雨天正蓝色最相宜', snow: '雪天灰蓝更意境深远' },
  },
};

// 五行生克关系描述
const WUXING_RELATIONSHIPS: Record<string, { name: string; effect: string; advice: string }> = {
  'sheng-wo': { name: '相生', effect: '助旺运势', advice: '今日贵人运佳，适合重要场合，展现魅力' },
  'wo-sheng': { name: '我生', effect: '付出有回报', advice: '今日付出较多但有贵人相助，适合主动出击' },
  'tong': { name: '同类', effect: '运势平稳', advice: '今日状态稳定，适合按计划行事' },
  'wo-ke': { name: '相克', effect: '需控制情绪', advice: '今日注意控制情绪，避免冲动决策' },
  'ke-wo': { name: '被克', effect: '运势较弱', advice: '今日运势较弱，建议低调行事，保存实力' },
};

// ========== 流日十神分析 ==========
type TenGodName = '正官' | '七杀' | '正财' | '偏财' | '正印' | '偏印' | '比肩' | '劫财' | '食神' | '伤官';

const STEM_ELEMENTS_R: Record<string, FiveElement> = {
  '甲': 'wood', '乙': 'wood', '丙': 'fire', '丁': 'fire',
  '戊': 'earth', '己': 'earth', '庚': 'metal', '辛': 'metal',
  '壬': 'water', '癸': 'water',
};

const SIBLING: Record<FiveElement, FiveElement> = { wood: 'wood', fire: 'fire', earth: 'earth', metal: 'metal', water: 'water' };
const ING: Record<FiveElement, FiveElement> = { wood: 'water', fire: 'wood', earth: 'fire', metal: 'earth', water: 'metal' };
const OUTPUT: Record<FiveElement, FiveElement> = { wood: 'fire', fire: 'earth', earth: 'metal', metal: 'water', water: 'wood' };
const RESTRAIN: Record<FiveElement, FiveElement> = { wood: 'metal', fire: 'water', earth: 'wood', metal: 'fire', water: 'earth' };
const WEALTH: Record<FiveElement, FiveElement> = { wood: 'earth', fire: 'metal', earth: 'water', metal: 'wood', water: 'fire' };

function getTenGodStem(dayGan: string, targetStem: string): TenGodName {
  const dmEl = STEM_ELEMENTS_R[dayGan];
  const tEl = STEM_ELEMENTS_R[targetStem];
  const dmYang = HEAVENLY_STEMS.indexOf(dayGan) % 2 === 0;
  const tYang = HEAVENLY_STEMS.indexOf(targetStem) % 2 === 0;
  if (SIBLING[dmEl] === tEl) return dmYang === tYang ? '比肩' : '劫财';
  if (ING[dmEl] === tEl) return dmYang === tYang ? '偏印' : '正印';
  if (OUTPUT[dmEl] === tEl) return dmYang === tYang ? '食神' : '伤官';
  if (RESTRAIN[dmEl] === tEl) return dmYang === tYang ? '七杀' : '正官';
  if (WEALTH[dmEl] === tEl) return dmYang === tYang ? '偏财' : '正财';
  return '比肩';
}

// 流日十神详细分析
interface FlowDayTenGodAnalysis {
  tenGod: TenGodName;
  careerScore: number;
  wealthScore: number;
  loveScore: number;
  healthScore: number;
  favorableElements: FiveElement[];
  unfavorableElements: FiveElement[];
  colorAdvice: string;
  outfitStrategy: string;
  overallBoost: number; // -10 ~ 10
  description: string;
}

function analyzeFlowDayTenGod(dayGan: string, dayGanZhi: string, liuriDayStem: string, liuriDayBranch: string): FlowDayTenGodAnalysis {
  const tenGod = getTenGodStem(dayGan, liuriDayStem);
  const liuriDayElement = STEM_ELEMENTS_R[liuriDayStem];

  // 地支藏干对本命的影响
  const branchHiddenStems: Record<string, string[]> = {
    '子': ['癸'], '丑': ['己', '癸', '辛'], '寅': ['甲', '丙', '戊'],
    '卯': ['乙'], '辰': ['戊', '乙', '癸'], '巳': ['丙', '庚', '戊'],
    '午': ['丁', '己'], '未': ['己', '丁', '乙'], '申': ['庚', '壬', '戊'],
    '酉': ['辛'], '戌': ['戊', '辛', '丁'], '亥': ['壬', '甲'],
  };
  const hiddenStems = branchHiddenStems[liuriDayBranch] || [];
  const hiddenTenGods = hiddenStems.map(s => getTenGodStem(dayGan, s));

  // 十神运势评分
  const tenGodScores: Record<TenGodName, { career: number; wealth: number; love: number; health: number; boost: number; desc: string }> = {
    '正官': { career: 9, wealth: 6, love: 7, health: 6, boost: 7, desc: '今日正官星现，利事业官运，职场贵人运佳，适合求职、面试、谈判、商务合作。' },
    '七杀': { career: 7, wealth: 5, love: 4, health: 3, boost: 3, desc: '今日七杀星动，挑战与机遇并存，需谨慎决策，防小人干扰，宜守不宜攻。' },
    '正财': { career: 5, wealth: 9, love: 6, health: 7, boost: 6, desc: '今日正财星高照，财运极佳，利投资理财、签订合同、购置大件，不宜投机。' },
    '偏财': { career: 4, wealth: 8, love: 5, health: 6, boost: 5, desc: '今日偏财星活跃，财运与风险并存，利投资理财、兼职副业，需见好就收。' },
    '正印': { career: 7, wealth: 4, love: 8, health: 8, boost: 6, desc: '今日正印星护佑，利学业进修、贵人相助、面试求职，身体状态良好。' },
    '偏印': { career: 5, wealth: 5, love: 4, health: 4, boost: 2, desc: '今日偏印星影响，思考多变动，利创意设计但需防过于敏感，不宜激进。' },
    '比肩': { career: 6, wealth: 5, love: 5, health: 6, boost: 4, desc: '今日比肩星同行，人际往来活跃，利合作共赢、团队协作，但易有竞争。' },
    '劫财': { career: 4, wealth: 3, love: 3, health: 4, boost: -3, desc: '今日劫财星干扰，财运受阻，人际冲突多发，注意破财和口舌是非，保守行事。' },
    '食神': { career: 6, wealth: 7, love: 8, health: 9, boost: 8, desc: '今日食神吐秀，才华横溢，利创作展示、艺术表演、社交聚会，身心愉悦。' },
    '伤官': { career: 4, wealth: 6, love: 5, health: 4, boost: 2, desc: '今日伤官星活跃，创意与口才佳但情绪波动大，利表达展示，防得罪人。' },
  };

  const scores = tenGodScores[tenGod];
  const hiddenBonus = hiddenTenGods.reduce((acc, h) => {
    const hScore = tenGodScores[h];
    return { career: acc.career + hScore.career * 0.2, wealth: acc.wealth + hScore.wealth * 0.2, love: acc.love + hScore.love * 0.2, health: acc.health + hScore.health * 0.2 };
  }, { career: 0, wealth: 0, love: 0, health: 0 });

  // 流日对本命五行的生克
  const shengKeRel = (() => {
    const dmElement = STEM_ELEMENTS_R[dayGan];
    if (ING[liuriDayElement] === dmElement) return 'sheng-wo';
    if (OUTPUT[dmElement] === liuriDayElement) return 'wo-sheng';
    if (RESTRAIN[dmElement] === liuriDayElement) return 'ke-wo';
    if (RESTRAIN[liuriDayElement] === dmElement) return 'wo-ke';
    return 'tong';
  })();

  const shengKeBonus: Record<string, number> = { 'sheng-wo': 3, 'wo-sheng': 1, 'tong': 0, 'wo-ke': -2, 'ke-wo': -4 };

  const overallBoost = Math.max(-10, Math.min(10, scores.boost + shengKeBonus[shengKeRel]));
  const totalCareer = Math.min(100, Math.round(scores.career + hiddenBonus.career + (shengKeBonus[shengKeRel] > 0 ? 5 : 0)));
  const totalWealth = Math.min(100, Math.round(scores.wealth + hiddenBonus.wealth + (shengKeBonus[shengKeRel] > 0 ? 5 : 0)));
  const totalLove = Math.min(100, Math.round(scores.love + hiddenBonus.love + (shengKeBonus[shengKeRel] > 0 ? 5 : 0)));
  const totalHealth = Math.min(100, Math.round(scores.health + hiddenBonus.health + (shengKeBonus[shengKeRel] > 0 ? 5 : 0)));

  // 基于十神的用神推荐
  const tenGodFavorable: Record<TenGodName, FiveElement[]> = {
    '正官': ['water', 'metal'], '七杀': ['metal', 'water'],
    '正财': ['metal', 'earth'], '偏财': ['earth', 'metal'],
    '正印': ['water', 'wood'], '偏印': ['wood', 'water'],
    '比肩': ['wood', 'fire'], '劫财': ['earth', 'metal'],
    '食神': ['fire', 'wood'], '伤官': ['fire', 'earth'],
  };
  const tenGodUnfavorable: Record<TenGodName, FiveElement[]> = {
    '正官': ['fire'], '七杀': ['fire', 'wood'],
    '正财': ['wood'], '偏财': ['wood', 'fire'],
    '正印': ['fire', 'earth'], '偏印': ['earth', 'fire'],
    '比肩': ['metal', 'water'], '劫财': ['water', 'wood'],
    '食神': ['water', 'metal'], '伤官': ['metal', 'water'],
  };

  // 颜色建议
  const colorAdviceMap: Record<TenGodName, string> = {
    '正官': '今日正官当令，宜穿金白、银灰、水蓝等正官吉色，提升事业气场，利职场发展。',
    '七杀': '今日七杀活跃，宜穿金白、银灰等沉稳色调以化解压力，忌大红大紫过于张扬。',
    '正财': '今日正财高照，宜穿金色、白色、银色招财色系，增强财运，利签订合同、投资理财。',
    '偏财': '今日偏财星动，宜穿金色或黄褐色系，冒险中求财但需见好就收，忌贪心。',
    '正印': '今日正印护身，宜穿蓝黑、绿色等贵人色，提升学业和贵人运，利面试谈判。',
    '偏印': '今日偏印影响，宜穿绿色或蓝黑色系平衡，偏印利创意但忌过度思虑。',
    '比肩': '今日比肩同行，宜穿绿色或红色系增强人际关系，合作共赢但防竞争。',
    '劫财': '今日劫财干扰，宜穿白色、金色、银灰等冷静色调，保守理财，防破财。',
    '食神': '今日食神吐秀，宜穿红色、粉色、紫色等活力色系，展现才华，利社交聚会。',
    '伤官': '今日伤官活跃，宜穿红色或黄色系展现实力，但需控制情绪，谨言慎行。',
  };

  const outfitStrategyMap: Record<TenGodName, string> = {
    '正官': '职场精英风格：干练西装、简约衬衫、挺括裤装，金银色配饰点缀，整体呈现专业气质。',
    '七杀': '稳重内敛风格：深色系西装、灰色大衣、金属扣件，整体低调有力度，防小人显眼。',
    '正财': '品质商务风格：精致衬衫、西装套装、金色手表，整体呈现财富气场，忌浮夸。',
    '偏财': '灵活多元风格：亮色点缀、休闲西服或精致polo衫，可适度混搭，展现财运机遇。',
    '正印': '知性文雅风格：针织衫、衬衫、简约连衣裙，蓝黑色系为主，整体知性有内涵。',
    '偏印': '创意文艺风格：设计感强的单品、不对称剪裁、蓝绿为主色系，整体独特不张扬。',
    '比肩': '活力社交风格：亮色单品、休闲西装或品质T恤，整体有活力，利人际互动。',
    '劫财': '保守务实风格：深色系套装、简约黑白灰，质感为先，整体克制内敛，忌张扬。',
    '食神': '魅力展示风格：丝绸亮面、红色/紫色系连衣裙或衬衫，整体优雅有魅力，利展示才华。',
    '伤官': '自信表达风格：亮黄色、正红等自信色、设计感单品，注意分寸，忌过度表现。',
  };

  return {
    tenGod,
    careerScore: totalCareer,
    wealthScore: totalWealth,
    loveScore: totalLove,
    healthScore: totalHealth,
    favorableElements: tenGodFavorable[tenGod],
    unfavorableElements: tenGodUnfavorable[tenGod],
    colorAdvice: colorAdviceMap[tenGod],
    outfitStrategy: outfitStrategyMap[tenGod],
    overallBoost,
    description: scores.desc,
  };
}

// 增强版穿搭推荐 - 包含天气和流日运势
export interface EnhancedOutfitRecommendation extends OutfitRecommendation {
  weatherInfo?: WeatherInfo;
  weatherBasedColors?: ColorRecommendation[];
  outfitImages?: OutfitImage[];
  liuriFortune?: {
    element: FiveElement;
    relation: string;
    boost: number; // -10 ~ 10
    description: string;
    relationshipAdvice: string;
  };
  gender?: 'male' | 'female';
}

// 天气类型映射
type WeatherType = 'sunny' | 'clear' | 'partly_cloudy' | 'cloudy' | 'overcast' | 'rain' | 'drizzle' | 'thunderstorm' | 'snow' | 'fog' | 'haze' | 'wind';

export function getOutfitRecommendation(
  favorable: FiveElement[],
  unfavorable: FiveElement[],
  gender: 'male' | 'female' = 'female',
  weather?: WeatherInfo,
  dayGan?: string,
  dayGanZhi?: string
): EnhancedOutfitRecommendation {
  const primary = favorable[0] || 'earth';
  const secondary = favorable[1] || primary;
  const avoid = unfavorable[0] || (['wood', 'fire', 'earth', 'metal', 'water'] as FiveElement[]).find(e => !favorable.includes(e)) || 'water';

  const today = getTodayLiuri();
  const seed = `${new Date().toDateString()}`;

  const liuriElementNames: Record<FiveElement, string> = { wood: '木', fire: '火', earth: '土', metal: '金', water: '水' };

  // ========== 流日十神详细分析（基于八字日主） ==========
  let flowDayAnalysis: FlowDayTenGodAnalysis | null = null;
  let liuriBoost = 0;
  let liuriDesc = '';
  let relationshipInfo = WUXING_RELATIONSHIPS['tong'];

  if (dayGan && dayGanZhi) {
    // 有八字日主信息：使用十神分析
    flowDayAnalysis = analyzeFlowDayTenGod(dayGan, dayGanZhi, today.dayPillar[0], today.dayPillar[1]);
    liuriBoost = flowDayAnalysis.overallBoost;
    liuriDesc = flowDayAnalysis.description;
  } else {
    // 无八字信息：降级使用基础五行分析
    const liuriDayRel = getRel(primary, today.dayElement);
    relationshipInfo = WUXING_RELATIONSHIPS[liuriDayRel] || WUXING_RELATIONSHIPS['tong'];
    if (liuriDayRel === 'sheng-wo') { liuriBoost = 8; liuriDesc = `今日流日五行为${liuriElementNames[today.dayElement]}，生扶您的喜用神${liuriElementNames[primary]}，运势极佳！${relationshipInfo.advice}`; }
    else if (liuriDayRel === 'tong') { liuriBoost = 5; liuriDesc = `今日流日五行与您的喜用神同属${liuriElementNames[primary]}，运势平稳。${relationshipInfo.advice}`; }
    else if (liuriDayRel === 'wo-sheng') { liuriBoost = 3; liuriDesc = `今日流日五行${liuriElementNames[today.dayElement]}被您生扶。${relationshipInfo.advice}`; }
    else if (liuriDayRel === 'wo-ke') { liuriBoost = -5; liuriDesc = `今日流日五行${liuriElementNames[today.dayElement]}被您克制。${relationshipInfo.advice}`; }
    else if (liuriDayRel === 'ke-wo') { liuriBoost = -8; liuriDesc = `今日流日五行${liuriElementNames[today.dayElement]}克制您的喜用神。${relationshipInfo.advice}`; }
    else { liuriBoost = 0; liuriDesc = '今日运势平稳，稳中求进。'; }
  }

  const isSupport = liuriBoost > 3;
  const tenGodName = flowDayAnalysis?.tenGod || '平和';
  const goodThings = flowDayAnalysis
    ? [`今日流日${today.dayPillar}，${tenGodName}当令，${flowDayAnalysis.description.replace('今日', '')}`, '今日宜积极行动，把握机遇']
    : isSupport
      ? [`今日流日五行为${liuriElementNames[today.dayElement]}，生扶喜用神，运势上佳`, '今日宜积极行动，把握机遇']
      : ['今日运势平稳，稳中求进'];

  // 根据流日十神分析调整颜色推荐
  let adjustedPrimary = primary;
  let adjustedSecondary = secondary;

  // 获取天气调整
  const weatherElement = weather?.element || 'earth';
  const weatherType = weather?.weather || 'cloudy';
  const weatherAdjustment = WEATHER_ADJUSTMENTS[primary];

  if (flowDayAnalysis) {
    // 有十神分析时：使用十神推荐的用神
    adjustedPrimary = flowDayAnalysis.favorableElements[0] || primary;
    adjustedSecondary = flowDayAnalysis.favorableElements[1] || secondary;
  } else if (liuriBoost < -5) {
    // 流日不利时，增加水/金属性缓冲
    adjustedPrimary = 'water';
    adjustedSecondary = 'metal';
  } else if (liuriBoost > 5) {
    // 流日大吉时，强化喜用神
    adjustedPrimary = primary;
    adjustedSecondary = favorable.includes('metal') ? 'metal' : secondary;
  } else if (weatherElement) {
    // 天气影响：在不利流日时允许天气色系作为调剂
    const weatherBoostElement = weatherAdjustment?.boost[weatherType];
    if (weatherBoostElement && weatherBoostElement !== primary) {
      adjustedSecondary = weatherBoostElement;
    }
  }

  // 根据性别选择详细穿搭方案数据库
  const outfitDetailsDb = gender === 'male' ? OUTFIT_DETAILS_MALE : OUTFIT_DETAILS_FEMALE;
  
  // 获取各场景的详细穿搭方案
  const getSceneOutfit = (element: FiveElement, scene: OutfitScene): OutfitDetail => {
    const db = outfitDetailsDb[element] || outfitDetailsDb['earth'];
    return db[scene] || db['casual'];
  };

  // 天气适应建议
  const weatherAdvice = weather 
    ? weatherAdjustment?.desc[weatherType] || '根据天气灵活调整穿搭'
    : '请设置位置以获取更精准的穿搭建议';

// 场景化穿搭推荐 - 生成更详细的个性化描述
function generateSceneExplanation(
  scene: OutfitScene,
  element: FiveElement,
  secondaryElement: FiveElement,
  weather: WeatherInfo | undefined,
  liuriBoost: number,
  flowDay: FlowDayTenGodAnalysis | null,
  gender: 'male' | 'female',
  outfit: OutfitDetail
): string {
  const temp = weather?.temperature ? `${weather.temperature}度` : '当前温度';
  const weatherDesc = weather?.weather || '适宜';
  const elementName = ELEMENT_NAMES[element];
  const secondaryName = ELEMENT_NAMES[secondaryElement];
  const tenGodIntro = flowDay ? `今日流日${today.dayPillar}，${flowDay.tenGod}当令` : `今日流日五行${liuriElementNames[today.dayElement]}`;

  // 根据场景生成个性化描述
  const sceneConfigs = {
    work: {
      title: gender === 'male' ? '职场' : '职场',
      intro: `${temp}${weatherDesc}的天气，`,
      recommendation: gender === 'male'
        ? `${tenGodIntro}，${flowDay?.description.replace('今日', '') || '职场运势平稳'}。职场穿搭建议选择${elementName}色系为主色调。`
        : `${tenGodIntro}，${flowDay?.description.replace('今日', '') || '职场运势平稳'}。职场穿搭建议选择${elementName}色系为主色调。`,
      outfit: `${outfit.top}，搭配${outfit.bottom}，配上${outfit.shoes}，整体呈现${STYLE_DB[element].style.split('、')[0]}的风格。`,
      accessories: `配饰方面推荐${outfit.accessories.slice(0, 2).join('和')}，材质建议选择${outfit.material.includes('[') ? '舒适面料' : outfit.material.split('或')[0]}。`
    },
    casual: {
      title: gender === 'male' ? '日常休闲' : '日常休闲',
      intro: `${temp}${weatherDesc}的天气，`,
      recommendation: gender === 'male'
        ? `今日日常休闲场景，${flowDay?.description.replace('今日', '') || '日常运势平稳'}，`
        : `今日日常休闲场景，${flowDay?.description.replace('今日', '') || '日常运势平稳'}，`,
      outfit: gender === 'male'
        ? `适合穿${outfit.top}搭配${outfit.bottom}，脚踩${outfit.shoes}。`
        : `适合穿${outfit.top}搭配${outfit.bottom}，脚踩${outfit.shoes}。`,
      accessories: `可搭配${outfit.accessories[0]}或${outfit.accessories[1] || outfit.accessories[0]}作为点缀，整体风格${STYLE_DB[secondaryElement].style.split('、')[0]}。`
    },
    party: {
      title: gender === 'male' ? '好友聚会' : '好友聚会',
      intro: `${temp}${weatherDesc}的天气，`,
      recommendation: liuriBoost > 0
        ? `今日${flowDay?.tenGod || '流日'}运势上佳！好友聚会场景非常适合展现个人魅力，建议以${elementName}色系为主打。`
        : `好友聚会场景，虽然今日${flowDay?.tenGod || '流日'}运势稍弱，但穿搭得体依然可以让你成为焦点，建议以${elementName}色系搭配${secondaryName}色系。`,
      outfit: gender === 'male'
        ? `可以选择${outfit.top}搭配${outfit.bottom}，再配上${outfit.shoes}，尽显绅士风度。`
        : `可以选择${outfit.top}搭配${outfit.bottom}，再配上${outfit.shoes}，优雅大方。`,
      accessories: `配饰推荐${outfit.accessories.slice(0, 3).join('、')}，${gender === 'male' ? '银色袖扣或手表能提升整体质感' : '精致耳饰和手拿包是加分项'}。`
    },
    festival: {
      title: gender === 'male' ? '特殊节日' : '特殊节日',
      intro: `${temp}${weatherDesc}的天气，`,
      recommendation: liuriBoost > 0
        ? `今日运势极佳！节日庆典场合建议以${elementName}色系为主打，喜庆又不失格调。`
        : `节日庆典场合，建议以稳重的${elementName}色系为主，搭配适当的喜庆元素。`,
      outfit: gender === 'male'
        ? `${outfit.top}搭配${outfit.bottom}，配上${outfit.shoes}，${gender === 'male' ? '尽显绅士风度' : '优雅大方又不失节日氛围'}。`
        : `${outfit.top}搭配${outfit.bottom}，配上${outfit.shoes}，优雅大方又不失节日氛围。`,
      accessories: `节日配饰推荐${outfit.accessories.slice(0, 2).join('和')}，${gender === 'male' ? '金色配饰能增添喜庆氛围' : '金色或红色元素能提升节日感'}。`
    }
  };

  const config = sceneConfigs[scene];
  return `${config.intro}${config.recommendation}${config.outfit}${config.accessories}`;
}

// 天气适应建议
function generateWeatherTip(weather: WeatherInfo | undefined, primary: FiveElement): string {
  if (!weather) return '请设置位置以获取精准的天气穿搭建议';
  
  const { weather: w, temperature: t, element: we } = weather;
  const weName = ELEMENT_NAMES[we];
  
  // 温度区间建议
  let tempAdvice = '';
  if (t >= 28) {
    tempAdvice = '高温天气建议选择轻薄透气材质，避免深色系吸热';
  } else if (t >= 20) {
    tempAdvice = '温暖天气适合轻便穿搭，可适当露出层次';
  } else if (t >= 10) {
    tempAdvice = '早晚温差较大，建议备件薄外套';
  } else {
    tempAdvice = '天气较凉，建议多层穿搭保暖';
  }
  
  // 天气情况建议
  let weatherAdvice = '';
  if (w.includes('晴')) {
    weatherAdvice = '晴天适合亮色系穿搭，阳光下更显活力';
  } else if (w.includes('雨')) {
    weatherAdvice = '雨天建议防泼水面料，颜色以深色系为主';
  } else if (w.includes('阴')) {
    weatherAdvice = '阴天适合低调配色，可加入亮色点缀';
  } else {
    weatherAdvice = '根据天气灵活调整穿搭';
  }
  
  return `${tempAdvice}。${weatherAdvice}`;
}

  // 构建场景化穿搭推荐
  const getSceneColors = (element: string): string[] => {
    const colors = COLOR_DB[element as FiveElement] || COLOR_DB.earth;
    return colors.slice(0, 2).map(c => c.color);
  };
  
  const sceneRecommendations = [
    {
      id: 'work',
      icon: '💼',
      label: '职场场景',
      subtitle: '专业得体 · 提升气场',
      element: adjustedPrimary,
      accentColor: '#6BD4FF',
      outfit: getSceneOutfit(adjustedPrimary, 'work'),
      colors: getSceneColors(adjustedPrimary),  // 同步色彩数据
      explanation: generateSceneExplanation('work', adjustedPrimary, adjustedSecondary, weather, liuriBoost, flowDayAnalysis, gender, getSceneOutfit(adjustedPrimary, 'work')),
      weatherTip: generateWeatherTip(weather, primary),
      tips: [`主色调：${COLOR_DB[adjustedPrimary][0]?.color}、${COLOR_DB[adjustedPrimary][1]?.color || COLOR_DB[adjustedPrimary][0]?.color}`, '材质建议：' + STYLE_DB[primary].material.split('、')[0]],
    },
    {
      id: 'casual',
      icon: '☕',
      label: '日常休闲',
      subtitle: '舒适自在 · 随性自然',
      element: adjustedSecondary,
      accentColor: '#7C3AED',
      outfit: getSceneOutfit(adjustedSecondary, 'casual'),
      colors: getSceneColors(adjustedSecondary),  // 同步色彩数据
      explanation: generateSceneExplanation('casual', adjustedSecondary, primary, weather, liuriBoost, flowDayAnalysis, gender, getSceneOutfit(adjustedSecondary, 'casual')),
      weatherTip: generateWeatherTip(weather, primary),
      tips: [`主色调：${COLOR_DB[adjustedSecondary][0]?.color}、${COLOR_DB[adjustedSecondary][1]?.color || COLOR_DB[adjustedSecondary][0]?.color}`, '材质建议：' + STYLE_DB[adjustedSecondary].material.split('、')[0]],
    },
    {
      id: 'party',
      icon: '🎉',
      label: '好友聚会',
      subtitle: '时尚活力 · 展现个性',
      element: primary,
      accentColor: '#FF6B9D',
      outfit: getSceneOutfit(primary, 'party'),
      colors: getSceneColors(primary),  // 同步色彩数据
      explanation: generateSceneExplanation('party', primary, secondary, weather, liuriBoost, flowDayAnalysis, gender, getSceneOutfit(primary, 'party')),
      weatherTip: generateWeatherTip(weather, primary),
      tips: [`主色调：${COLOR_DB[primary][0]?.color}`, '可适当加入亮色配饰提升活力'],
    },
    {
      id: 'festival',
      icon: '🎊',
      label: '特殊节日',
      subtitle: '喜庆吉祥 · 仪式感满满',
      element: adjustedPrimary,
      accentColor: '#FF9D6B',
      outfit: getSceneOutfit(adjustedPrimary, 'festival'),
      colors: getSceneColors(adjustedPrimary),  // 同步色彩数据
      explanation: generateSceneExplanation('festival', adjustedPrimary, primary, weather, liuriBoost, flowDayAnalysis, gender, getSceneOutfit(adjustedPrimary, 'festival')),
      weatherTip: generateWeatherTip(weather, primary),
      tips: [`主色调：${COLOR_DB[adjustedPrimary][0]?.color}、${COLOR_DB[primary][0]?.color}`, '可加入金色或喜庆红色元素增添节日氛围'],
    },
  ];

  // 基于十神的颜色建议
  const tenGodColorAdvice = flowDayAnalysis
    ? `今日${flowDayAnalysis.tenGod}当令，${flowDayAnalysis.colorAdvice}`
    : `今日流日运势${liuriBoost > 0 ? '较好' : '较弱'}，${liuriBoost > 0 ? '宜积极行动' : '建议低调行事'}`;

  const result = {
    primaryColors: COLOR_DB[adjustedPrimary].slice(0, 2),
    secondaryColors: COLOR_DB[adjustedSecondary].slice(0, 2),
    avoidColors: flowDayAnalysis
      ? COLOR_DB[flowDayAnalysis.unfavorableElements[0] || avoid].slice(0, 2)
      : COLOR_DB[avoid].slice(0, 2),
    styleSuggestion: flowDayAnalysis
      ? `${flowDayAnalysis.outfitStrategy}`
      : gender === 'male'
        ? `男性${STYLE_DB[primary].style.replace('可适当', '建议')}，版型以修身或标准为主`
        : `女性${STYLE_DB[primary].style}，可根据场合选择裙装或裤装`,
    materialSuggestion: STYLE_DB[primary].material,
    todayFortune: {
      goodThings,
      precautions: flowDayAnalysis
        ? [`避免过多接触${ELEMENT_NAMES[flowDayAnalysis.unfavorableElements[0]]}行色彩`, `今日${flowDayAnalysis.tenGod}日，宜根据其特性调整运势`]
        : unfavorable[0] ? [`避免过多接触${ELEMENT_NAMES[unfavorable[0]]}行色彩`] : ['保持良好心态'],
      luckyElements: flowDayAnalysis ? flowDayAnalysis.favorableElements : favorable,
      unluckyElements: flowDayAnalysis ? flowDayAnalysis.unfavorableElements : unfavorable,
    },
    liuriAnalysis: {
      yearPillar: today.yearPillar, monthPillar: today.monthPillar, dayPillar: today.dayPillar,
      dayElement: today.dayElement,
      dayShiShen: flowDayAnalysis ? flowDayAnalysis.tenGod : '平和',
      dayRelation: flowDayAnalysis ? `${flowDayAnalysis.tenGod}日` : (() => {
        const rel = getRel(primary, today.dayElement);
        return WUXING_RELATIONSHIPS[rel]?.name || rel;
      })(),
      favorableBoost: isSupport,
      yearRelation: '年支平和',
      monthRelation: '月令平和',
    },
    outfitPlans: [
      {
        element: primary, title: '职场正式穿搭方案',
        colors: COLOR_DB[adjustedPrimary].slice(0, 2),
        explanation: flowDayAnalysis
          ? `${flowDayAnalysis.tenGod}当令，${flowDayAnalysis.description.replace('今日', '')}职场穿搭建议：${flowDayAnalysis.outfitStrategy}`
          : `选择${ELEMENT_NAMES[adjustedPrimary]}行色彩能够增强您的喜用神，提升职场运势和专业气场。${liuriDesc}`,
        suitableOccasions: gender === 'male'
          ? ['商务会议', '正式面试', '重要谈判', '职场演讲']
          : ['商务会议', '正式面试', '职场演讲', '公司活动'],
        avoidOccasions: ['休闲度假', '运动健身'],
        styleTips: gender === 'male'
          ? `男性${STYLE_DB[primary].style.split('可适当')[0]}，建议选择${STYLE_DB[primary].material.split('、')[0]}材质`
          : `女性${STYLE_DB[primary].style.split('可适当')[0]}，建议选择${STYLE_DB[primary].material.split('、')[0]}材质，${primary === 'wood' ? '可选碎花或波点元素' : primary === 'fire' ? '可选亮面或丝绸材质' : '可选简约或设计感强的款式'}`,
        accessorySuggestions: gender === 'male'
          ? ['简约金属饰品', '皮质手表', '纯色领带/领结']
          : ['精致耳饰', '小巧手链', '简约丝巾', '质感手提包'],
      },
      {
        element: secondary, title: '日常休闲穿搭方案',
        colors: COLOR_DB[adjustedSecondary].slice(0, 2),
        explanation: flowDayAnalysis
          ? `${flowDayAnalysis.tenGod}日日常，${flowDayAnalysis.description.replace('今日', '')}日常穿着${ELEMENT_NAMES[adjustedSecondary]}行色彩能够让您保持平和舒适的状态。`
          : `日常穿着${ELEMENT_NAMES[adjustedSecondary]}行色彩能够让您保持平和舒适的状态。`,
        suitableOccasions: gender === 'male'
          ? ['朋友聚会', '逛街购物', '咖啡厅休闲', '居家办公']
          : ['闺蜜下午茶', '逛街购物', '约会出行', '居家休闲'],
        avoidOccasions: ['正式商务场合'],
        styleTips: gender === 'male'
          ? `男性${STYLE_DB[secondary].style.split('可适当')[0]}，注重舒适与实用性`
          : `女性${STYLE_DB[secondary].style.split('可适当')[0]}，注重舒适与时尚感`,
        accessorySuggestions: gender === 'male'
          ? ['休闲手环', '帆布包袋', '舒适运动鞋']
          : ['休闲耳饰', '时尚手提袋', '舒适平底鞋/小白鞋'],
      },
    ],
    dressingPrinciples: [
      flowDayAnalysis
        ? (() => {
            const tenGodIdx = ['食神','正官','偏财','正财','伤官','七杀','正印','偏印','比肩','劫财'].indexOf(flowDayAnalysis.tenGod);
            const tenGodMeanings = ['食神吐秀才华', '正官利事业', '偏财财运活跃', '正财稳定收入', '伤官创意表达', '七杀挑战机遇', '正印学业贵人', '偏印创意灵感', '比肩人际合作', '劫财破财注意'];
            return `今日流日${today.dayPillar}，${flowDayAnalysis.tenGod}当令。${flowDayAnalysis.tenGod}代表${tenGodMeanings[tenGodIdx] || '平和中庸'}。`;
          })()
        : `您的喜用神为${favorable.map(e => ELEMENT_NAMES[e]).join('、')}行，日常多穿对应色系能够增强运势。`,
      flowDayAnalysis
        ? `${flowDayAnalysis.description}`
        : `今日流日运势${liuriBoost > 0 ? '较好' : '较弱'}，${liuriBoost > 0 ? '宜积极行动' : '建议低调行事'}。${relationshipInfo.advice}`,
      tenGodColorAdvice,
      weather ? `当前天气（${weather.weather}，${weather.temperature}°C）${weatherAdvice}。` : '请设置位置以获取天气相关的穿搭建议。',
      gender === 'male' ? '男性穿搭建议注重线条利落和质感，建议选择修身或标准版型。' : '女性穿搭可根据场合灵活选择裙装或裤装，注重整体搭配协调性。',
    ],
    weatherInfo: weather,
    weatherBasedColors: weather ? COLOR_DB[weather.element] : undefined,
    sceneRecommendations,
    liuriFortune: {
      element: today.dayElement,
      relation: flowDayAnalysis ? flowDayAnalysis.tenGod : (() => { const rel = getRel(primary, today.dayElement); return WUXING_RELATIONSHIPS[rel]?.name || rel; })(),
      boost: liuriBoost,
      description: liuriDesc,
      relationshipAdvice: flowDayAnalysis?.description || relationshipInfo.advice,
    },
    gender,
  };

  return result;
}

// 获取手串的多张图片
function getBraceletImages(braceletName: string): string[] {
  const images = BRACELET_IMAGES[braceletName];
  if (images && images.length > 0) {
    return images;
  }
  // 如果没有找到对应图片，返回默认图片
  return [
    'https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1612198273689-b437f53152ca?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1598618443855-232ee0f819f6?w=400&h=400&fit=crop',
  ];
}

// 十神对应的手串五行推荐
const TENGOD_BRACELET_ELEMENTS: Record<string, { primary: FiveElement; secondary: FiveElement; advice: string }> = {
  '食神': { primary: 'fire', secondary: 'earth', advice: '食神吐秀日，才华与财气并重，火主礼尚往来，土孕育生机。' },
  '伤官': { primary: 'fire', secondary: 'earth', advice: '伤官伶俐日，创意勃发之时，火土相生助运。' },
  '正财': { primary: 'metal', secondary: 'earth', advice: '正财稳重日，财气通门户，金主义，土主信。' },
  '偏财': { primary: 'metal', secondary: 'earth', advice: '偏财流动日，财运星照耀，金银珠宝旺财气。' },
  '正官': { primary: 'metal', secondary: 'water', advice: '正官清正日，事业贵人运，金主义，水主智。' },
  '七杀': { primary: 'metal', secondary: 'water', advice: '七杀威权日，化杀为权宜用水金，水主智慧流通。' },
  '正印': { primary: 'water', secondary: 'wood', advice: '正印仁慈日，文昌学业运，水主智，木主仁。' },
  '偏印': { primary: 'water', secondary: 'wood', advice: '偏印深思日，学术研究运，水主智谋，木主生发。' },
  '比肩': { primary: 'wood', secondary: 'water', advice: '比肩自立日，合作竞争并存，木主仁，水主灵活。' },
  '劫财': { primary: 'metal', secondary: 'earth', advice: '劫财纷争日，财来财去易散，金银固财，土主信实。' },
};

// 手串场景类型
type BraceletScene = 'study' | 'work' | 'love' | 'wealth' | 'health' | 'social' | 'travel';

// 手串场景数据库 - 每种材质对应的适合场景
const BRACELET_SCENES: Record<string, { scenes: BraceletScene[]; reason: string }> = {
  '绿幽灵水晶手串': { scenes: ['work', 'wealth', 'social'], reason: '增强事业运和贵人运，利职场晋升和财运' },
  '翡翠手串': { scenes: ['health', 'love', 'social'], reason: '保平安，增进健康，利感情和人际' },
  '檀木手串': { scenes: ['health', 'study', 'work'], reason: '安神静心，利学业和健康' },
  '绿松石手串': { scenes: ['social', 'study', 'travel'], reason: '增强沟通能力，利学习和出行' },
  '南红玛瑙手串': { scenes: ['love', 'social', 'work'], reason: '增强自信和行动力，利人缘和事业' },
  '红珊瑚手串': { scenes: ['love', 'health', 'social'], reason: '辟邪护身，增进健康，利感情' },
  '石榴石手串': { scenes: ['love', 'health', 'work'], reason: '增强活力和魅力，利事业和感情' },
  '琥珀手串': { scenes: ['health', 'love', 'study'], reason: '安神定心，利学业和情绪平衡' },
  '蜜蜡手串': { scenes: ['health', 'wealth', 'love'], reason: '辟邪纳福，利健康和感情' },
  '黄水晶手串': { scenes: ['wealth', 'study', 'work'], reason: '招财进宝，利事业和学习' },
  '虎眼石手串': { scenes: ['work', 'wealth', 'social'], reason: '增强决断力，利事业和财运' },
  '和田黄玉手串': { scenes: ['health', 'love', 'wealth'], reason: '温润养身，利健康和感情' },
  '白水晶手串': { scenes: ['study', 'work', 'health'], reason: '净化磁场，利学业和事业' },
  '银饰手串': { scenes: ['health', 'social', 'travel'], reason: '辟邪护身，利出行和人际' },
  '金发晶手串': { scenes: ['wealth', 'love', 'work'], reason: '招财聚财，利事业和感情' },
  '月光石手串': { scenes: ['love', 'health', 'social'], reason: '增强直觉和魅力，利感情和健康' },
  '黑曜石手串': { scenes: ['health', 'work', 'social'], reason: '强力辟邪，利健康和事业' },
  '海蓝宝手串': { scenes: ['social', 'love', 'study'], reason: '增强沟通能力，利学习和感情' },
  '青金石手串': { scenes: ['study', 'work', 'social'], reason: '增强智慧和洞察力，利学业事业' },
  '黑玛瑙手串': { scenes: ['health', 'wealth', 'work'], reason: '稳定情绪，利健康和事业' },
};

// 身强身弱判断类型
type BodyStrengthType = 'strong' | 'weak' | 'neutral';

// 根据喜忌判断身强身弱
function analyzeBodyStrength(favorable: FiveElement[], unfavorable: FiveElement[]): BodyStrengthType {
  const favorCount = favorable.length;
  const avoidCount = unfavorable.length;
  
  // 身强：喜用神多，忌神少
  if (favorCount >= 3 && avoidCount <= 1) return 'strong';
  // 身弱：忌神多，喜用神少
  if (avoidCount >= 3 && favorCount <= 1) return 'weak';
  return 'neutral';
}

// 身强身弱的手串推荐策略
const BODY_STRENGTH_STRATEGY: Record<BodyStrengthType, { primaryAdvice: string; secondaryAdvice: string; avoidAdvice: string }> = {
  strong: {
    primaryAdvice: '身强宜泄不宜补，应选择能泄秀、转化的水晶，如火行、土行手串，帮助疏导能量。',
    secondaryAdvice: '可选择配合使用，平衡整体能量。',
    avoidAdvice: '不宜使用过多生扶之物。',
  },
  weak: {
    primaryAdvice: '身弱宜补不宜泄，应选择能生扶、增强的水晶，如金行、水行手串，帮助补充能量。',
    secondaryAdvice: '可选择配合使用，增强生扶力量。',
    avoidAdvice: '不宜使用过多泄耗之物。',
  },
  neutral: {
    primaryAdvice: '身势平衡，宜根据当日流日运势选择合适的手串调和。',
    secondaryAdvice: '可根据场景需求灵活选择。',
    avoidAdvice: '保持五行平衡即可。',
  },
};

export function getBraceletRecommendation(
  favorable: FiveElement[],
  unfavorable: FiveElement[] = [],
  gender: 'male' | 'female' = 'female',
  dayGan?: string,
  dayGanZhi?: string
): BraceletRecommendation {
  const primary = favorable[0] || 'earth';
  const secondary = favorable[1] || primary;
  const avoid = unfavorable[0];
  // 使用日期作为种子，确保每天推荐略有不同
  const today = new Date();
  const seed = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}-${today.getHours()}`;

  // ========== 身强身弱分析 ==========
  const bodyStrength = analyzeBodyStrength(favorable, unfavorable);
  const strengthStrategy = BODY_STRENGTH_STRATEGY[bodyStrength];

  // ========== 流日十神分析 ==========
  let flowDayAnalysis: FlowDayTenGodAnalysis | null = null;
  let tenGodAdvice = '';
  let tenGodName = '';

  if (dayGan && dayGanZhi) {
    const liuri = getTodayLiuri();
    flowDayAnalysis = analyzeFlowDayTenGod(dayGan, dayGanZhi, liuri.dayPillar[0], liuri.dayPillar[1]);
    tenGodName = flowDayAnalysis.tenGod;
    tenGodAdvice = TENGOD_BRACELET_ELEMENTS[tenGodName]?.advice || flowDayAnalysis.description;
  }

  // 根据身强身弱和十神分析调整五行用神
  let adjustedPrimary = primary;
  let adjustedSecondary = secondary;

  if (flowDayAnalysis) {
    // 流日运势影响
    const boost = flowDayAnalysis.overallBoost;
    
    if (bodyStrength === 'strong') {
      // 身强：需要泄秀，选择流日用神中能泄秀的五行
      const flowFavorable = flowDayAnalysis.favorableElements;
      // 火泄木、土泄火、金泄土、水泄金、木泄水
      adjustedPrimary = flowFavorable[0] || primary;
    } else if (bodyStrength === 'weak') {
      // 身弱：需要生扶，选择流日用神中能生扶的五行
      adjustedPrimary = flowDayAnalysis.favorableElements[0] || primary;
    } else {
      // 中性：直接使用流日用神
      adjustedPrimary = flowDayAnalysis.favorableElements[0] || primary;
    }
    adjustedSecondary = flowDayAnalysis.favorableElements[1] || flowDayAnalysis.favorableElements[0] || secondary;
  } else {
    // 无流日分析时，根据身强身弱做基础调整
    if (bodyStrength === 'strong') {
      // 身强宜泄：优先选择克的行（泄秀）
      adjustedPrimary = KE[primary] || primary; // 被日主克的五行
      adjustedSecondary = SHENG[primary] || secondary; // 日主生的五行（耗气）
    } else if (bodyStrength === 'weak') {
      // 身弱宜补：优先选择相生的行
      adjustedPrimary = SHENG[primary] || primary; // 生扶日主的五行
      adjustedSecondary = ING[primary] || secondary; // 印星生扶
    }
  }

  const primaryOpts = BRACELET_DB[adjustedPrimary] || BRACELET_DB[primary];
  const secondaryOpts = BRACELET_DB[adjustedSecondary] || BRACELET_DB[secondary];

  const primaryBracelet = getRandomElement(primaryOpts, `${seed}-pri-${adjustedPrimary}`);
  const shuffledSec = [...secondaryOpts].sort(() => 0.5 - Math.random());
  const secondaryBracelets = shuffledSec.slice(0, 2);

  const BRACELET_KNOWLEDGE: Record<string, { knowledge: string; benefits: string[]; tips: string[] }> = {
    '绿幽灵水晶手串': { knowledge: '绿幽灵水晶是木行宝石的代表，被称为"鬼佬财神"，是招财水晶中的佼佼者。', benefits: ['增强财运，招财聚财', '提升事业运和贵人运', '增强决策力'], tips: ['建议佩戴于左手', '避免接触化学物质', '每月清水冲洗净化'] },
    '翡翠手串': { knowledge: '翡翠属木，被誉为"玉石之王"，能够保平安，增进健康。', benefits: ['保平安，辟邪护身', '增进身体健康', '平衡情绪'], tips: ['贴身佩戴效果更佳', '避免碰撞和高温', '定期软布擦拭'] },
    '绿松石手串': { knowledge: '绿松石是木行宝石的代表石，蓝色代表天空与智慧，能够带来好运和平安。', benefits: ['增强沟通能力', '带来好运和平安', '舒缓眼疲劳'], tips: ['避免硬物摩擦', '单独存放', '定期清水冲洗'] },
    '小叶紫檀手串': { knowledge: '小叶紫檀是木行中的珍稀材质，被称为"帝王之木"，具有强大的辟邪功效。', benefits: ['安神静心', '辟邪护身', '调节气血'], tips: ['避免沾水', '定期用橄榄油保养', '避免暴晒'] },
    '南红玛瑙手串': { knowledge: '南红玛瑙属火，是中国特有的宝石品种，红色象征热情与活力。', benefits: ['增强自信心', '提升行动力和勇气', '改善血液循环'], tips: ['建议佩戴于左手', '避免高温和暴晒', '定期清水冲洗'] },
    '红珊瑚手串': { knowledge: '红珊瑚是火行宝石中的有机宝石，红色代表热情和生命力。', benefits: ['辟邪护身', '增进健康', '提升人缘'], tips: ['避免碰撞', '用软布擦拭', '避免化学物质'] },
    '石榴石手串': { knowledge: '石榴石是火行宝石的代表，被称为"女性之石"，具有强大的能量。', benefits: ['增强活力', '改善气血', '提升魅力'], tips: ['避免高温', '定期净化', '单独存放'] },
    '琥珀手串': { knowledge: '琥珀是火行中的有机宝石，是数千年前的树脂化石，蕴含着强大的能量。', benefits: ['安神定心', '带来温暖', '驱除邪气'], tips: ['避免明火', '怕高温', '定期用软布擦拭'] },
    '蜜蜡手串': { knowledge: '蜜蜡是琥珀的一种，属土行，不透明的黄色象征着财富和温暖。', benefits: ['安神静心', '辟邪纳福', '招财进宝'], tips: ['避免高温', '怕明火', '定期清水冲洗'] },
    '黄水晶手串': { knowledge: '黄水晶属土，被称为"财富之石"，金黄色泽象征财富与成功。', benefits: ['招财进宝，增强财运', '提升自信和决断力', '增强逻辑思维能力'], tips: ['建议佩戴于左手', '避免长时间暴晒', '每月清水冲洗'] },
    '虎眼石手串': { knowledge: '虎眼石属土，其独特的猫眼效应象征着勇气和力量。', benefits: ['增强决断力', '辟邪护身', '提升自信'], tips: ['避免碰撞', '定期净化', '单独存放'] },
    '和田黄玉手串': { knowledge: '和田黄玉是土行中的珍贵玉石，温暖的黄色象征着财富和地位。', benefits: ['温润养身', '安定心神', '招财纳福'], tips: ['避免碰撞', '定期保养', '单独存放'] },
    '白水晶手串': { knowledge: '白水晶属金，被称为"晶王"，是所有水晶中能量最纯净的一种。', benefits: ['净化磁场，清除负能量', '增强专注力和记忆力', '放大其他水晶能量'], tips: ['可佩戴于任意手', '定期清水冲洗', '可用月光净化'] },
    '银饰手串': { knowledge: '银饰属金，自古以来就是辟邪的圣物，具有强大的净化作用。', benefits: ['辟邪护身', '镇定安神', '净化磁场'], tips: ['避免氧化', '定期擦拭', '单独存放'] },
    '金发晶手串': { knowledge: '金发晶属金，内部金丝状包裹体象征着财富和好运。', benefits: ['招财聚财', '增强自信', '提升贵人运'], tips: ['避免碰撞', '定期净化', '配合白水晶使用效果更佳'] },
    '月光石手串': { knowledge: '月光石属金，具有月光般的柔和光泽，象征着爱情和直觉。', benefits: ['增强直觉', '稳定情绪', '提升女性魅力'], tips: ['避免暴晒', '定期净化', '适合女性佩戴'] },
    '黑曜石手串': { knowledge: '黑曜石属水，具有强大的辟邪作用，能够吸收负能量，保护佩戴者。', benefits: ['强力辟邪，驱除负能量', '吸收病气和浊气', '增强毅力和决心'], tips: ['建议佩戴于右手', '定期清水冲洗', '可用日光净化'] },
    '海蓝宝手串': { knowledge: '海蓝宝属水，其颜色如同海水般湛蓝，象征着平静与智慧。', benefits: ['增强沟通能力', '平复情绪', '保佑平安'], tips: ['避免碰撞', '定期净化', '适合需要表达的人群'] },
    '青金石手串': { knowledge: '青金石属水，深邃的蓝色被誉为"帝王之石"，象征着智慧和权威。', benefits: ['增强智慧', '提升洞察力', '保佑平安'], tips: ['避免摩擦', '单独存放', '定期用软布擦拭'] },
    '黑玛瑙手串': { knowledge: '黑玛瑙属水，具有稳定和保护的能量，能够消除负面情绪。', benefits: ['稳定情绪', '增强毅力', '辟邪护身'], tips: ['定期净化', '避免高温', '单独存放'] },
  };

  // 场景名称映射
  const SCENE_NAMES: Record<BraceletScene, string> = {
    study: '学习考试',
    work: '职场工作',
    love: '感情姻缘',
    wealth: '财运投资',
    health: '健康养生',
    social: '社交人际',
    travel: '出行旅游',
  };

  // 动态功效描述生成器
  const getDynamicEffect = (b: BraceletItem, el: FiveElement, isPrimary: boolean): string => {
    const baseEffect = b.effect || `${ELEMENT_NAMES[el]}行手串，增强运势`;
    if (!flowDayAnalysis || !isPrimary) return baseEffect;

    const liuri = getTodayLiuri();
    const boost = flowDayAnalysis.overallBoost;
    const tenGod = tenGodName;

    // 根据十神和运势加成生成今日增益描述
    const boostDesc = boost > 5 ? '今日流日' + tenGod + '大旺，运势加成显著！' :
                      boost > 2 ? '今日流日' + tenGod + '相助，运势小吉。' :
                      boost >= 0 ? '今日运势平稳，佩戴有助稳中求进。' :
                      '今日流日' + tenGod + '稍弱，宜静心养神。';

    const tenGodEffect: Record<string, string> = {
      '食神': '才华吐秀，利创意表达、财运亨通',
      '伤官': '自信表达，利竞争突破、财运提升',
      '正财': '正财稳健，利踏实积累、事业生财',
      '偏财': '偏财亨通，利投资好运、收益丰厚',
      '正官': '正官护财，利职场晋升、事业稳定',
      '七杀': '七杀激励，利魄力展现、突破困境',
      '正印': '正印生身，利学业进步、贵人相助',
      '偏印': '偏印养身，利创意思考、心灵成长',
      '比肩': '比肩相助，利朋友支持、合作共进',
      '劫财': '劫财竞争，利守财固本、谨慎投资',
    };

    const tenGodEffectDesc = tenGodEffect[tenGod] || tenGod + '运势';

    return `${baseEffect}。今日${liuri.dayPillar}，${tenGod}当令，${tenGodEffectDesc}，${boostDesc}`;
  };

  // 获取手串适合场景
  const getSuitableScenes = (braceletName: string): { scenes: BraceletScene[]; reason: string } => {
    const sceneInfo = BRACELET_SCENES[braceletName];
    if (sceneInfo) {
      // 根据流日十神微调场景优先级
      if (flowDayAnalysis) {
        const tenGod = flowDayAnalysis.tenGod;
        const scenePriority: Record<string, BraceletScene[]> = {
          '食神': ['study', 'love', 'wealth'],
          '伤官': ['social', 'work', 'love'],
          '正财': ['wealth', 'health', 'work'],
          '偏财': ['wealth', 'travel', 'social'],
          '正官': ['work', 'social', 'love'],
          '七杀': ['work', 'health', 'wealth'],
          '正印': ['study', 'health', 'work'],
          '偏印': ['study', 'health', 'social'],
          '比肩': ['social', 'work', 'wealth'],
          '劫财': ['wealth', 'health', 'work'],
        };
        const priorityScenes = scenePriority[tenGod] || sceneInfo.scenes;
        // 优先返回与流日十神匹配的场景
        const matchedScenes = priorityScenes.filter(s => sceneInfo.scenes.includes(s));
        if (matchedScenes.length > 0) {
          return { scenes: matchedScenes, reason: sceneInfo.reason };
        }
      }
      return sceneInfo;
    }
    // 默认场景
    return {
      scenes: ['work', 'health', 'social'],
      reason: '日常佩戴，增强整体运势',
    };
  };

  // 根据流日十神增加场景描述
  const getSceneAdvice = (scenes: BraceletScene[], tenGod: string): string => {
    const sceneTenGodMap: Record<string, BraceletScene> = {
      '正官': 'work',
      '七杀': 'work',
      '正财': 'wealth',
      '偏财': 'wealth',
      '正印': 'study',
      '偏印': 'study',
      '食神': 'love',
      '伤官': 'social',
      '比肩': 'social',
      '劫财': 'wealth',
    };
    const bestScene = sceneTenGodMap[tenGod];
    if (bestScene && scenes.includes(bestScene)) {
      return `今日${SCENE_NAMES[bestScene]}运势为重，佩戴此手串相得益彰。`;
    }
    return '';
  };

  const enhance = (b: BraceletItem, el: FiveElement, isPrimary: boolean): BraceletItem => {
    const info = BRACELET_KNOWLEDGE[b.name] || { knowledge: `${b.name}属${ELEMENT_NAMES[el]}行，能够增强运势。`, benefits: ['增强运势', '平衡五行'], tips: ['建议日常佩戴', '定期净化'] };
    const sceneInfo = getSuitableScenes(b.name);
    const sceneAdvice = flowDayAnalysis ? getSceneAdvice(sceneInfo.scenes, flowDayAnalysis.tenGod) : '';
    
    return {
      ...b,
      images: getBraceletImages(b.name),
      whyRecommended: isPrimary 
        ? `属${ELEMENT_NAMES[el]}行，是您的喜用神，能够有效增强您的运势。${strengthStrategy.primaryAdvice}`
        : `可与主选手串形成五行相生搭配，增强整体效果。${strengthStrategy.secondaryAdvice}`,
      benefits: info.benefits,
      usageTips: info.tips,
      knowledge: info.knowledge,
      energyLevel: isPrimary ? '高' : '中',
      effect: getDynamicEffect(b, el, isPrimary),
      suitableScenes: sceneInfo.scenes.map(s => ({
        scene: s,
        name: SCENE_NAMES[s],
        reason: sceneInfo.reason,
      })),
      sceneAdvice: sceneAdvice,
    };
  };

  // 生成今日运势提示
  const todayFortuneTips = flowDayAnalysis
    ? [
        `今日${tenGodName}当令，${flowDayAnalysis.description}`,
        tenGodAdvice,
        flowDayAnalysis.overallBoost > 3 ? '今日运势上佳，宜积极行动，把握机遇。' : flowDayAnalysis.overallBoost < -3 ? '今日运势低沉，宜静心养神，谨慎行事。' : '今日运势平稳，稳中求进。',
      ]
    : [
        `主选手串属${ELEMENT_NAMES[adjustedPrimary]}行，是您的命理喜用神。`,
        '辅助手串可搭配主选手串佩戴，或根据场合轮换使用。',
      ];

  // 生成五行相生相克图示
  const wuxingDiagram = (() => {
    const elements = ['木', '火', '土', '金', '水'];
    const sheng: Record<string, string> = { '木': '火', '火': '土', '土': '金', '金': '水', '水': '木' };
    const ke: Record<string, string> = { '木': '金', '火': '水', '土': '木', '金': '火', '水': '土' };
    
    return {
      primary: adjustedPrimary,
      primaryName: ELEMENT_NAMES[adjustedPrimary],
      secondaryName: ELEMENT_NAMES[adjustedSecondary],
      sheng: sheng[ELEMENT_NAMES[adjustedPrimary]] || '',
      ke: ke[ELEMENT_NAMES[adjustedPrimary]] || '',
      shengDesc: `${ELEMENT_NAMES[adjustedPrimary]} → ${sheng[ELEMENT_NAMES[adjustedPrimary]] || ''}`,
      keDesc: `${ELEMENT_NAMES[adjustedPrimary]} → ${ke[ELEMENT_NAMES[adjustedPrimary]] || ''}`,
    };
  })();

  // 生成运势评分
  const fortuneScores = flowDayAnalysis
    ? {
        career: flowDayAnalysis.careerScore,
        wealth: flowDayAnalysis.wealthScore,
        love: flowDayAnalysis.loveScore,
        health: flowDayAnalysis.healthScore,
        social: Math.round((flowDayAnalysis.careerScore + flowDayAnalysis.loveScore) / 2),
        study: Math.round((flowDayAnalysis.careerScore + flowDayAnalysis.healthScore) / 2),
      }
    : null;

  // 场景推荐优先级
  const scenePriority = flowDayAnalysis
    ? {
        study: { score: fortuneScores?.study || 60, icon: '📚', desc: '学业考试' },
        work: { score: fortuneScores?.career || 60, icon: '💼', desc: '职场工作' },
        love: { score: fortuneScores?.love || 60, icon: '💕', desc: '感情姻缘' },
        wealth: { score: fortuneScores?.wealth || 60, icon: '💰', desc: '财运投资' },
        health: { score: fortuneScores?.health || 60, icon: '💪', desc: '健康养生' },
        social: { score: fortuneScores?.social || 60, icon: '🤝', desc: '社交人际' },
        travel: { score: 65, icon: '✈️', desc: '出行旅游' },
      }
    : null;

  return {
    primaryBracelet: enhance(primaryBracelet, adjustedPrimary, true),
    secondaryBracelets: secondaryBracelets.map(b => enhance(b, adjustedSecondary, false)),
    notes: todayFortuneTips,
    matchingPrinciple: flowDayAnalysis
      ? `今日流日${tenGodName}，您的用神宜${ELEMENT_NAMES[adjustedPrimary]}行，手串主选${ELEMENT_NAMES[adjustedPrimary]}行（${tenGodName}），辅选${ELEMENT_NAMES[adjustedSecondary]}行，十神相助，运势加成。`
      : `您的命理用神为${favorable.map(e => ELEMENT_NAMES[e]).join('、')}行，主选手串属${ELEMENT_NAMES[adjustedPrimary]}行，辅助手串属${ELEMENT_NAMES[adjustedSecondary]}行。${bodyStrength === 'strong' ? '身强宜泄，选择泄秀之手串。' : bodyStrength === 'weak' ? '身弱宜补，选择生扶之手串。' : ''}`,
    elementKnowledge: {
      title: `${ELEMENT_NAMES[adjustedPrimary]}行手串与五行`,
      content: `${ELEMENT_NAMES[adjustedPrimary]}主${ELEMENT_NAMES[adjustedPrimary] === '木' ? '仁，代表生长、条达、向上的力量' : ELEMENT_NAMES[adjustedPrimary] === '火' ? '礼，代表热情、活力、光明' : ELEMENT_NAMES[adjustedPrimary] === '土' ? '信，代表稳重、包容、运化' : ELEMENT_NAMES[adjustedPrimary] === '金' ? '义，代表清净、肃杀、收敛' : '智，代表智慧、流动、柔和'}。${flowDayAnalysis ? `今日${tenGodName}当令，${ELEMENT_NAMES[adjustedPrimary]}行手串相助，运势更佳。` : `佩戴${ELEMENT_NAMES[adjustedPrimary]}行手串有助于增强运势。`}`,
    },
    userAnalysis: flowDayAnalysis
      ? `今日${tenGodName}日，您的命理用神为${ELEMENT_NAMES[primary]}，今日运势用神为${ELEMENT_NAMES[adjustedPrimary]}。${bodyStrength === 'strong' ? '身强宜泄，选择'+ELEMENT_NAMES[adjustedPrimary]+'行手串泄秀。' : bodyStrength === 'weak' ? '身弱宜补，选择'+ELEMENT_NAMES[adjustedPrimary]+'行手串生扶。' : ''}佩戴${ELEMENT_NAMES[adjustedPrimary]}行手串，${tenGodName}相助，运势加成。`
      : `${ELEMENT_NAMES[adjustedPrimary]}行是您的命理用神，${bodyStrength === 'strong' ? '身强宜泄，选择'+ELEMENT_NAMES[adjustedPrimary]+'行手串泄秀。' : bodyStrength === 'weak' ? '身弱宜补，选择'+ELEMENT_NAMES[adjustedPrimary]+'行手串生扶。' : ''}佩戴${ELEMENT_NAMES[adjustedPrimary]}行手串能够帮助您平衡五行，增强正面能量。`,
    flowDay: flowDayAnalysis,
    bodyStrength: {
      type: bodyStrength,
      strategy: strengthStrategy,
      description: bodyStrength === 'strong' ? '您的命格身强，宜泄不宜补，选择能疏导能量的手串。' : bodyStrength === 'weak' ? '您的命格身弱，宜补不宜泄，选择能生扶能量的手串。' : '您的命格平衡，可根据流日运势灵活选择手串。',
    },
    
    // ========== 新增：喜用神忌用神详细分析 ==========
    xiYongAnalysis: {
      // 喜用神分析
      favorableAnalysis: (() => {
        const total = favorable.length + unfavorable.length;
        const favorPercent = total > 0 ? Math.round((favorable.length / total) * 100) : 50;
        const elementPercentages = favorable.map((el, i) => ({
          element: el,
          name: ELEMENT_NAMES[el],
          percentage: i === 0 ? favorPercent : Math.round(favorPercent * 0.6),
        }));
        
        return {
          count: favorable.length,
          percentage: favorPercent,
          elements: elementPercentages,
          description: favorable.length >= 3
            ? '您的喜用神较为充足，命局整体能量较强。'
            : favorable.length >= 1
            ? '您的喜用神数量适中，命局能量较为平衡。'
            : '您的喜用神较少，需要外部能量补充。',
        };
      })(),
      
      // 忌神分析
      unfavorableAnalysis: (() => {
        const total = favorable.length + unfavorable.length;
        const avoidPercent = total > 0 ? Math.round((unfavorable.length / total) * 100) : 0;
        const elementPercentages = unfavorable.map((el) => ({
          element: el,
          name: ELEMENT_NAMES[el],
          percentage: avoidPercent,
        }));
        
        return {
          count: unfavorable.length,
          percentage: avoidPercent,
          elements: elementPercentages,
          description: unfavorable.length === 0
            ? '您的命局中忌神较少，整体较为和谐。'
            : unfavorable.length <= 2
            ? '您的忌神影响有限，通过手串调和可有效化解。'
            : '您的忌神较多，需要特别注意五行调和。',
        };
      })(),
      
      // 身强身弱与喜忌神的关系分析
      strengthRelation: {
        bodyStrength: bodyStrength,
        bodyStrengthName: bodyStrength === 'strong' ? '身强' : bodyStrength === 'weak' ? '身弱' : '中性',
        // 根据身强身弱分析用神策略
        strategy: bodyStrength === 'strong' ? {
          name: '泄秀为主',
          description: `身强则日主能量旺盛，需要通过"泄"来调和。选择${ELEMENT_NAMES[KE[primary]]}行（克）或${ELEMENT_NAMES[SHENG[primary]]}行（耗）的手串，可以疏导过旺的能量，达到阴阳平衡。`,
          recommendedElement: KE[primary],
          recommendedElementName: ELEMENT_NAMES[KE[primary]],
          avoidElement: SHENG[primary],
          avoidElementName: ELEMENT_NAMES[SHENG[primary]],
        } : bodyStrength === 'weak' ? {
          name: '生扶为主',
          description: `身弱则日主能量不足，需要通过"生"来补充。选择${ELEMENT_NAMES[SHENG[primary]]}行（印）或${ELEMENT_NAMES[ING[primary]]}行（水）的手串，可以生扶日主能量，增强自身力量。`,
          recommendedElement: SHENG[primary],
          recommendedElementName: ELEMENT_NAMES[SHENG[primary]],
          avoidElement: KE[primary],
          avoidElementName: ELEMENT_NAMES[KE[primary]],
        } : {
          name: '平衡调和',
          description: '身势较为平衡，可以根据流日运势灵活选择手串，既可补强也可泄秀，保持五行流通即可。',
          recommendedElement: primary,
          recommendedElementName: ELEMENT_NAMES[primary],
          avoidElement: null,
          avoidElementName: null,
        },
        // 综合判断
        overallJudgment: (() => {
          if (bodyStrength === 'strong') {
            return `您的命局身强，喜用神${favorable.length}个，忌神${unfavorable.length}个。身强格局应选择"泄"的方式，即选择克日主或日主所生的五行作为用神，疏导过剩能量。今日推荐${ELEMENT_NAMES[adjustedPrimary]}行手串，正是泄秀之选。`;
          } else if (bodyStrength === 'weak') {
            return `您的命局身弱，喜用神${favorable.length}个，忌神${unfavorable.length}个。身弱格局应选择"补"的方式，即选择生日主或与日主同类的五行作为用神，补充不足能量。今日推荐${ELEMENT_NAMES[adjustedPrimary]}行手串，正是生扶之选。`;
          } else {
            return `您的命局较为平衡，喜用神${favorable.length}个，忌神${unfavorable.length}个。可根据流日运势灵活选择手串，今日推荐${ELEMENT_NAMES[adjustedPrimary]}行手串，配合流日运势调和五行。`;
          }
        })(),
        // 手串推荐原理
        braceletPrinciple: `手串五行属性与命局喜忌神相配合：喜用神对应的五行手串可增强正面能量，忌神对应的五行手串需避免或谨慎使用。`,
        summary: `身强宜泄，身弱宜补。手串五行与命局喜忌神配合使用，可调和五行能量，增强运势。`,
      },
    },
    
    // 新增：详细总结信息
    summary: {
      // 五行相生相克图示
      wuxingDiagram,
      // 运势评分
      fortuneScores,
      // 场景推荐优先级
      scenePriority,
      // 身强身弱状态
      bodyStrengthStatus: bodyStrength,
      // 流日十神
      tenGod: tenGodName || null,
      // 今日用神
      favorableElement: adjustedPrimary,
      favorableElementName: ELEMENT_NAMES[adjustedPrimary],
      secondaryElement: adjustedSecondary,
      secondaryElementName: ELEMENT_NAMES[adjustedSecondary],
      // 运势等级
      fortuneLevel: flowDayAnalysis
        ? flowDayAnalysis.overallBoost > 5 ? '极佳'
          : flowDayAnalysis.overallBoost > 2 ? '上佳'
          : flowDayAnalysis.overallBoost >= 0 ? '平稳'
          : flowDayAnalysis.overallBoost > -3 ? '稍弱'
          : '低迷'
        : '普通',
      // 综合建议
      overallAdvice: flowDayAnalysis
        ? flowDayAnalysis.overallBoost > 5
          ? `今日运势极佳，${tenGodName}大旺，佩戴${ELEMENT_NAMES[adjustedPrimary]}行手串如虎添翼，宜积极进取！`
          : flowDayAnalysis.overallBoost > 2
          ? `今日运势上佳，${tenGodName}相助，佩戴手串可增强运势，宜把握机遇。`
          : flowDayAnalysis.overallBoost >= 0
          ? `今日运势平稳，${ELEMENT_NAMES[adjustedPrimary]}行手串可帮助稳中求进。`
          : `今日运势稍弱，${ELEMENT_NAMES[adjustedPrimary]}行手串可帮助化解，但宜静心养神。`
        : `根据您的命理，${ELEMENT_NAMES[adjustedPrimary]}行手串是您的用神之选。`,
      // 推荐佩戴方式
      wearingTips: bodyStrength === 'strong'
        ? '身强宜泄，建议单独佩戴主选手串，或与相生五行手串搭配'
        : bodyStrength === 'weak'
        ? '身弱宜补，建议主副手串同时佩戴，增强生扶之力'
        : '身格平衡，可根据场合灵活选择手串佩戴',
    },
  };
}
