/**
 * 真太阳时计算
 * 根据出生地经度，将北京时间换算为真太阳时
 */

// 中国主要城市经纬度及区时
const CITY_LONGITUDES: Record<string, { lon: number; tzOffset: number }> = {
  // 东北
  '哈尔滨': { lon: 126.63, tzOffset: 8 },
  '齐齐哈尔': { lon: 123.97, tzOffset: 8 },
  '牡丹江': { lon: 129.60, tzOffset: 8 },
  '佳木斯': { lon: 130.37, tzOffset: 8 },
  '大庆': { lon: 125.03, tzOffset: 8 },
  '绥化': { lon: 126.99, tzOffset: 8 },
  '长春': { lon: 125.32, tzOffset: 8 },
  '吉林': { lon: 126.55, tzOffset: 8 },
  '四平': { lon: 124.35, tzOffset: 8 },
  '延吉': { lon: 129.51, tzOffset: 8 },
  '沈阳': { lon: 123.43, tzOffset: 8 },
  '大连': { lon: 121.62, tzOffset: 8 },
  '鞍山': { lon: 122.99, tzOffset: 8 },
  '抚顺': { lon: 123.97, tzOffset: 8 },
  '锦州': { lon: 121.13, tzOffset: 8 },
  '丹东': { lon: 124.35, tzOffset: 8 },
  // 华北
  '北京': { lon: 116.40, tzOffset: 8 },
  '天津': { lon: 117.20, tzOffset: 8 },
  '石家庄': { lon: 114.48, tzOffset: 8 },
  '唐山': { lon: 118.18, tzOffset: 8 },
  '保定': { lon: 115.47, tzOffset: 8 },
  '邯郸': { lon: 114.49, tzOffset: 8 },
  '秦皇岛': { lon: 119.60, tzOffset: 8 },
  '沧州': { lon: 116.83, tzOffset: 8 },
  '廊坊': { lon: 116.68, tzOffset: 8 },
  '张家口': { lon: 114.88, tzOffset: 8 },
  '承德': { lon: 117.93, tzOffset: 8 },
  '太原': { lon: 112.53, tzOffset: 8 },
  '大同': { lon: 113.30, tzOffset: 8 },
  '运城': { lon: 111.00, tzOffset: 8 },
  '呼和浩特': { lon: 111.73, tzOffset: 8 },
  '包头': { lon: 109.84, tzOffset: 8 },
  // 西北
  '西安': { lon: 108.95, tzOffset: 8 },
  '宝鸡': { lon: 107.24, tzOffset: 8 },
  '咸阳': { lon: 108.71, tzOffset: 8 },
  '延安': { lon: 109.49, tzOffset: 8 },
  '榆林': { lon: 109.73, tzOffset: 8 },
  '兰州': { lon: 103.83, tzOffset: 8 },
  '天水': { lon: 105.69, tzOffset: 8 },
  '西宁': { lon: 101.78, tzOffset: 8 },
  '银川': { lon: 106.27, tzOffset: 8 },
  '乌鲁木齐': { lon: 87.62, tzOffset: 8 },
  '克拉玛依': { lon: 84.87, tzOffset: 8 },
  '喀什': { lon: 75.98, tzOffset: 8 },
  // 华东
  '济南': { lon: 116.99, tzOffset: 8 },
  '青岛': { lon: 120.38, tzOffset: 8 },
  '烟台': { lon: 121.39, tzOffset: 8 },
  '威海': { lon: 122.12, tzOffset: 8 },
  '潍坊': { lon: 119.16, tzOffset: 8 },
  '淄博': { lon: 118.05, tzOffset: 8 },
  '临沂': { lon: 118.35, tzOffset: 8 },
  '郑州': { lon: 113.65, tzOffset: 8 },
  '洛阳': { lon: 112.45, tzOffset: 8 },
  '开封': { lon: 114.35, tzOffset: 8 },
  '新乡': { lon: 113.92, tzOffset: 8 },
  '武汉': { lon: 114.31, tzOffset: 8 },
  '宜昌': { lon: 111.29, tzOffset: 8 },
  '襄阳': { lon: 112.12, tzOffset: 8 },
  '黄石': { lon: 115.04, tzOffset: 8 },
  '长沙': { lon: 112.94, tzOffset: 8 },
  '岳阳': { lon: 113.13, tzOffset: 8 },
  '株洲': { lon: 113.13, tzOffset: 8 },
  '合肥': { lon: 117.28, tzOffset: 8 },
  '蚌埠': { lon: 117.38, tzOffset: 8 },
  '芜湖': { lon: 118.38, tzOffset: 8 },
  '阜阳': { lon: 115.82, tzOffset: 8 },
  '南京': { lon: 118.79, tzOffset: 8 },
  '苏州': { lon: 120.62, tzOffset: 8 },
  '无锡': { lon: 120.30, tzOffset: 8 },
  '常州': { lon: 119.97, tzOffset: 8 },
  '南通': { lon: 120.86, tzOffset: 8 },
  '徐州': { lon: 117.20, tzOffset: 8 },
  '连云港': { lon: 119.22, tzOffset: 8 },
  '扬州': { lon: 119.42, tzOffset: 8 },
  '镇江': { lon: 119.45, tzOffset: 8 },
  '泰州': { lon: 119.92, tzOffset: 8 },
  '盐城': { lon: 120.16, tzOffset: 8 },
  '淮安': { lon: 119.02, tzOffset: 8 },
  '宿迁': { lon: 118.30, tzOffset: 8 },
  '上海': { lon: 121.47, tzOffset: 8 },
  '杭州': { lon: 120.19, tzOffset: 8 },
  '宁波': { lon: 121.55, tzOffset: 8 },
  '温州': { lon: 120.67, tzOffset: 8 },
  '嘉兴': { lon: 120.76, tzOffset: 8 },
  '绍兴': { lon: 120.58, tzOffset: 8 },
  '金华': { lon: 119.65, tzOffset: 8 },
  '台州': { lon: 121.42, tzOffset: 8 },
  '湖州': { lon: 120.09, tzOffset: 8 },
  '舟山': { lon: 122.11, tzOffset: 8 },
  '衢州': { lon: 118.87, tzOffset: 8 },
  '丽水': { lon: 119.92, tzOffset: 8 },
  '福州': { lon: 119.30, tzOffset: 8 },
  '厦门': { lon: 118.09, tzOffset: 8 },
  '泉州': { lon: 118.58, tzOffset: 8 },
  '漳州': { lon: 117.65, tzOffset: 8 },
  '莆田': { lon: 119.01, tzOffset: 8 },
  '宁德': { lon: 119.55, tzOffset: 8 },
  '南昌': { lon: 115.89, tzOffset: 8 },
  '赣州': { lon: 114.94, tzOffset: 8 },
  '九江': { lon: 116.00, tzOffset: 8 },
  '景德镇': { lon: 117.18, tzOffset: 8 },
  '上饶': { lon: 117.94, tzOffset: 8 },
  // 华南
  '广州': { lon: 113.27, tzOffset: 8 },
  '深圳': { lon: 114.07, tzOffset: 8 },
  '珠海': { lon: 113.58, tzOffset: 8 },
  '东莞': { lon: 113.75, tzOffset: 8 },
  '佛山': { lon: 113.12, tzOffset: 8 },
  '中山': { lon: 113.38, tzOffset: 8 },
  '惠州': { lon: 114.42, tzOffset: 8 },
  '汕头': { lon: 116.68, tzOffset: 8 },
  '湛江': { lon: 110.36, tzOffset: 8 },
  '江门': { lon: 113.08, tzOffset: 8 },
  '茂名': { lon: 110.92, tzOffset: 8 },
  '肇庆': { lon: 112.47, tzOffset: 8 },
  '韶关': { lon: 113.60, tzOffset: 8 },
  '梅州': { lon: 116.12, tzOffset: 8 },
  '潮州': { lon: 116.63, tzOffset: 8 },
  '揭阳': { lon: 116.37, tzOffset: 8 },
  '汕尾': { lon: 115.37, tzOffset: 8 },
  '阳江': { lon: 111.98, tzOffset: 8 },
  '清远': { lon: 113.05, tzOffset: 8 },
  '云浮': { lon: 112.05, tzOffset: 8 },
  '河源': { lon: 114.70, tzOffset: 8 },
  '南宁': { lon: 108.33, tzOffset: 8 },
  '桂林': { lon: 110.29, tzOffset: 8 },
  '柳州': { lon: 109.42, tzOffset: 8 },
  '北海': { lon: 109.12, tzOffset: 8 },
  '梧州': { lon: 111.28, tzOffset: 8 },
  '玉林': { lon: 110.17, tzOffset: 8 },
  '钦州': { lon: 108.62, tzOffset: 8 },
  '贵港': { lon: 109.60, tzOffset: 8 },
  '贺州': { lon: 111.57, tzOffset: 8 },
  '百色': { lon: 106.62, tzOffset: 8 },
  '河池': { lon: 108.09, tzOffset: 8 },
  '来宾': { lon: 109.23, tzOffset: 8 },
  '崇左': { lon: 107.36, tzOffset: 8 },
  '防城港': { lon: 108.35, tzOffset: 8 },
  '海口': { lon: 110.35, tzOffset: 8 },
  '三亚': { lon: 109.51, tzOffset: 8 },
  // 西南
  '成都': { lon: 104.07, tzOffset: 8 },
  '绵阳': { lon: 104.68, tzOffset: 8 },
  '德阳': { lon: 104.40, tzOffset: 8 },
  '南充': { lon: 106.11, tzOffset: 8 },
  '达州': { lon: 107.47, tzOffset: 8 },
  '宜宾': { lon: 104.64, tzOffset: 8 },
  '自贡': { lon: 104.78, tzOffset: 8 },
  '泸州': { lon: 105.44, tzOffset: 8 },
  '内江': { lon: 105.06, tzOffset: 8 },
  '乐山': { lon: 103.77, tzOffset: 8 },
  '眉山': { lon: 103.85, tzOffset: 8 },
  '资阳': { lon: 104.63, tzOffset: 8 },
  '广安': { lon: 106.63, tzOffset: 8 },
  '遂宁': { lon: 105.59, tzOffset: 8 },
  '雅安': { lon: 103.00, tzOffset: 8 },
  '重庆': { lon: 106.55, tzOffset: 8 },
  '万州': { lon: 108.41, tzOffset: 8 },
  '昆明': { lon: 102.83, tzOffset: 8 },
  '丽江': { lon: 100.23, tzOffset: 8 },
  '大理': { lon: 100.27, tzOffset: 8 },
  '曲靖': { lon: 103.80, tzOffset: 8 },
  '玉溪': { lon: 102.55, tzOffset: 8 },
  '红河': { lon: 103.38, tzOffset: 8 },
  '楚雄': { lon: 101.53, tzOffset: 8 },
  '昭通': { lon: 103.72, tzOffset: 8 },
  '贵阳': { lon: 106.71, tzOffset: 8 },
  '遵义': { lon: 106.91, tzOffset: 8 },
  '毕节': { lon: 105.29, tzOffset: 8 },
  '安顺': { lon: 105.93, tzOffset: 8 },
  '黔南': { lon: 107.52, tzOffset: 8 },
  '拉萨': { lon: 91.17, tzOffset: 8 },
  // 港澳台
  '香港': { lon: 114.17, tzOffset: 8 },
  '澳门': { lon: 113.55, tzOffset: 8 },
  '台北': { lon: 121.56, tzOffset: 8 },
  '高雄': { lon: 120.30, tzOffset: 8 },
  // 省份关键词（省府城市）
  '黑龙江': { lon: 126.63, tzOffset: 8 },
  '辽宁': { lon: 123.43, tzOffset: 8 },
  '河北': { lon: 114.48, tzOffset: 8 },
  '山西': { lon: 112.53, tzOffset: 8 },
  '内蒙古': { lon: 111.73, tzOffset: 8 },
  '山东': { lon: 116.99, tzOffset: 8 },
  '河南': { lon: 113.65, tzOffset: 8 },
  '湖北': { lon: 114.31, tzOffset: 8 },
  '湖南': { lon: 112.94, tzOffset: 8 },
  '江苏': { lon: 118.79, tzOffset: 8 },
  '浙江': { lon: 120.19, tzOffset: 8 },
  '安徽': { lon: 117.28, tzOffset: 8 },
  '福建': { lon: 119.30, tzOffset: 8 },
  '江西': { lon: 115.89, tzOffset: 8 },
  '广东': { lon: 113.27, tzOffset: 8 },
  '广西': { lon: 108.33, tzOffset: 8 },
  '海南': { lon: 110.35, tzOffset: 8 },
  '四川': { lon: 104.07, tzOffset: 8 },
  '贵州': { lon: 106.71, tzOffset: 8 },
  '云南': { lon: 102.83, tzOffset: 8 },
  '西藏': { lon: 91.17, tzOffset: 8 },
  '陕西': { lon: 108.95, tzOffset: 8 },
  '甘肃': { lon: 103.83, tzOffset: 8 },
  '青海': { lon: 101.78, tzOffset: 8 },
  '宁夏': { lon: 106.27, tzOffset: 8 },
  '新疆': { lon: 87.62, tzOffset: 8 },
  '台湾': { lon: 121.56, tzOffset: 8 },
};

// 统一经度（去除市/省/县等后缀进行匹配）
function normalizeCity(s: string): string {
  return s.replace(/[省市县区镇]/g, '').trim();
}

// 获取城市的经度（度）
export function getLongitude(cityName: string): number | null {
  if (!cityName || !cityName.trim()) return null;
  const name = normalizeCity(cityName);
  const info = CITY_LONGITUDES[name];
  if (info) return info.lon;

  // 模糊匹配：检查城市名中是否包含已知的城市关键词
  for (const [key, val] of Object.entries(CITY_LONGITUDES)) {
    if (name.includes(key) || key.includes(name)) {
      return val.lon;
    }
  }
  return null;
}

/**
 * 计算给定日期的时差方程（Equation of Time）
 * 返回值：太阳时比区时快（正）或慢（负）的分钟数
 * 使用近似公式（Meeus 算法简化版）
 */
function equationOfTime(year: number, month: number, day: number): number {
  // 使用儒略日
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  const jd = day + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
  // 儒略世纪数
  const n = jd - 2451545.0;
  const L = (280.460 + 0.9856474 * n) % 360;
  const g = (357.528 + 0.9856003 * n) % 360;
  const lambda = L + 1.915 * Math.sin(g * Math.PI / 180) + 0.020 * Math.sin(2 * g * Math.PI / 180);
  const eps = 23.439 - 0.0000004 * n;
  const eot = (L - lambda) - Math.atan2(Math.cos(eps * Math.PI / 180) * Math.sin(lambda * Math.PI / 180), Math.cos(lambda * Math.PI / 180)) * 180 / Math.PI;
  // 标准化到 -30 ~ +30 分钟范围
  let eotMin = eot * 4;
  while (eotMin > 30) eotMin -= 60;
  while (eotMin < -30) eotMin += 60;
  return eotMin;
}

/**
 * 将北京时间（出生地时间）换算为真太阳时
 * @param beijingHour 北京时间小时（0-23）
 * @param longitude   出生地经度
 * @param year/month/day 出生日期（用于计算时差方程）
 * @returns 真太阳时小时（0-23，可能是小数）
 */
export function toTrueSolarHour(
  beijingHour: number,
  longitude: number,
  year: number,
  month: number,
  day: number,
): number {
  // 区时（北京时间 = 东八区，120°E）
  const beijingLon = 120.0;
  // 经度差（度）：正值表示当地在东八区东边，太阳更早到中天
  const lonDiff = longitude - beijingLon;
  // 经度时差（分钟）：每度 4 分钟
  const lonCorrection = lonDiff * 4;
  // 时差方程（分钟）
  const eot = equationOfTime(year, month, day);
  // 真太阳时 = 北京时间 + 经度时差 + 时差方程
  const trueSolarMinutes = beijingHour * 60 + lonCorrection + eot;
  // 处理跨日
  const result = ((trueSolarMinutes % 1440) + 1440) % 1440;
  return result / 60;
}

/**
 * 将真太阳时小时转为八字时辰（每时辰 2 小时，23:00-01:00 为子时）
 * @param trueSolarHour 真太阳时（0-24，可能是小数）
 * @returns 八字时辰小时（0-23）
 */
export function trueSolarHourToBaziHour(trueSolarHour: number): number {
  // 23:00-01:00 = 子时（0），但八字用23:00起算
  // 真太阳时 23.0-1.0 -> 子时(23)
  // 从真太阳时角度：
  // 子时 23:00-01:00 (23-25, 折算为 23-1)
  // 丑时 01:00-03:00
  // ...
  // 亥时 21:00-23:00
  const h = trueSolarHour % 24;
  // 如果在 0-1 点之间，实际属于前一天的亥时
  if (h >= 0 && h < 1) {
    // 子时（23:00-01:00），但真太阳时0点=北京时间约23:52+经度差
    // 用常规处理：0-2点为丑时，子时范围 23-1
    // 简化为：0-1点视为23点（子时）
    return 23;
  }
  return Math.floor(h);
}

export interface TrueSolarResult {
  trueSolarHour: number;        // 真太阳时（小时）
  baziHour: number;             // 八字时辰小时（0-23）
  longitude: number;            // 出生地经度
  lonDiffMinutes: number;        // 经度时差（分钟）
  eotMinutes: number;            // 时差方程（分钟）
  description: string;           // 描述文字
}

/**
 * 主函数：计算真太阳时和对应八字时辰
 */
export function calculateTrueSolar(
  birthLocation: string,
  beijingHour: number,
  year: number,
  month: number,
  day: number,
): TrueSolarResult {
  const lon = getLongitude(birthLocation);
  if (lon === null) {
    return {
      trueSolarHour: beijingHour,
      baziHour: beijingHour,
      longitude: 120,
      lonDiffMinutes: 0,
      eotMinutes: 0,
      description: `未找到「${birthLocation}」的经度信息，使用北京时间`,
    };
  }

  const beijingLon = 120.0;
  const lonDiff = lon - beijingLon;
  const lonDiffMinutes = Math.round(lonDiff * 4);
  const eot = equationOfTime(year, month, day);
  const trueSolarHour = toTrueSolarHour(beijingHour, lon, year, month, day);
  const baziHour = trueSolarHourToBaziHour(trueSolarHour);

  const lonDir = lonDiff > 0 ? '东' : '西';
  const eotDir = eot > 0 ? '快' : '慢';
  const totalDiff = Math.round(lonDiffMinutes + eot);

  return {
    trueSolarHour: Math.round(trueSolarHour * 100) / 100,
    baziHour,
    longitude: lon,
    lonDiffMinutes,
    eotMinutes: Math.round(eot),
    description: `出生地经度${lon.toFixed(2)}°E（${lonDir}${Math.abs(Math.round(lonDiff * 100) / 100)}°），` +
      `经度时差约${Math.abs(lonDiffMinutes)}分钟（${lonDir}偏${lonDir === '东' ? '早' : '晚'}），` +
      `时差方程约${Math.abs(Math.round(eot))}分钟（太阳比区时${eotDir}），` +
      `合计约${Math.abs(totalDiff)}分钟（${totalDiff > 0 ? '偏早' : '偏晚'}）`,
  };
}
