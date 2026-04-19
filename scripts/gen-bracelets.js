/**
 * 生成逼真手串实物图 - 使用 sharp + Canvas 风格绘制
 * 每种材质生成一张带真实珠子质感的手串照片
 */
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const OUT_DIR = path.join(__dirname, '../client/public/images/bracelets');
fs.mkdirSync(OUT_DIR, { recursive: true });

const W = 500, H = 350;

// 材质配置 - 每种手串的颜色、质感参数
const MATERIALS = {
  'green-jade': {
    name: '绿幽灵/翡翠',
    baseColors: ['#C8E6C9', '#81C784', '#4CAF50', '#388E3C', '#1B5E20'],
    highlight: '#E8F5E9',
    shadow: '#0D3D0F',
    stringColor: '#8D6E63',
    bgColor: '#FAFAFA',
    veinColor: 'rgba(76,175,80,0.15)',
  },
  'red-sandalwood': {
    name: '小叶紫檀',
    baseColors: ['#D7CCC8', '#A1887F', '#6D4C41', '#4E342E', '#3E2723'],
    highlight: '#EFEBE9',
    shadow: '#1B0F0A',
    stringColor: '#5D4037',
    bgColor: '#FFF8E1',
    grainColor: 'rgba(62,39,35,0.2)',
  },
  'turquoise': {
    name: '绿松石',
    baseColors: ['#B2DFDB', '#4DB6AC', '#009688', '#00796B', '#004D40'],
    highlight: '#E0F2F1',
    shadow: '#00251a',
    stringColor: '#FFD54F',
    bgColor: '#E0F7FA',
    matrixColor: 'rgba(0,77,64,0.25)',
  },
  'red-agate': {
    name: '南红玛瑙',
    baseColors: ['#FFCDD2', '#EF9A9A', '#E57373', '#F44336', '#C62828'],
    highlight: '#FFEBEE',
    shadow: '#7f0000',
    stringColor: '#5D4037',
    bgColor: '#FFF3E0',
    bandColor: 'rgba(255,235,238,0.3)',
  },
  'amber': {
    name: '琥珀/蜜蜡',
    baseColors: ['#FFE082', '#FFD54F', '#FFC107', '#FF9800', '#E65100'],
    highlight: '#FFFDE7',
    shadow: '#bf360c',
    stringColor: '#5D4037',
    bgColor: '#FFF8E1',
    inclusionColor: 'rgba(230,81,0,0.15)',
  },
  'black-obsidian': {
    name: '黑曜石',
    baseColors: ['#424242', '#212121', '#1a1a1a', '#0d0d0d', '#000000'],
    highlight: '#616161',
    shadow: '#000000',
    stringColor: '#FFD54F',
    bgColor: '#ECEFF1',
    sheenColor: 'rgba(255,255,255,0.08)',
  },
  'purple-amethyst': {
    name: '紫水晶',
    baseColors: ['#E1BEE7', '#CE93D8', '#AB47BC', '#8E24AA', '#4A148C'],
    highlight: '#F3E5F5',
    shadow: '#2a004d',
    stringColor: '#5D4037',
    bgColor: '#F3E5F5',
    zoneColor: 'rgba(142,36,170,0.12)',
  },
  'white-crystal': {
    name: '白水晶',
    baseColors: ['#FFFFFF', '#F5F5F5', '#EEEEEE', '#E0E0E0', '#BDBDBD'],
    highlight: '#FFFFFF',
    shadow: '#757575',
    stringColor: '#90A4AE',
    bgColor: '#FAFAFA',
    rainbowColor: 'rgba(100,181,246,0.08)',
  },
  'gold-tiger-eye': {
    name: '金曜石/虎眼',
    baseColors: ['#FFE0B2', '#FFCC80', '#FFB74D', '#FF9800', '#E65100'],
    highlight: '#FFF3E0',
    shadow: '#bf360c',
    stringColor: '#5D4037',
    bgColor: '#FFF3E0',
    silkColor: 'rgba(230,81,0,0.12)',
  },
  'lapis-lazuli': {
    name: '青金石',
    baseColors: ['#9FA8DA', '#7986CB', '#5C6BC0', '#3F51B5', '#283593'],
    highlight: '#C5CAE9',
    shadow: '#1a237e',
    stringColor: '#FFD54F',
    bgColor: '#E8EAF6',
    pyriteColor: 'rgba(255,215,0,0.3)',
  },
  'silver': {
    name: '925纯银/银饰',
    baseColors: ['#FFFFFF', '#F5F5F5', '#E0E0E0', '#BDBDBD', '#9E9E9E'],
    highlight: '#FFFFFF',
    shadow: '#616161',
    stringColor: '#757575',
    bgColor: '#FAFAFA',
    sheenColor: 'rgba(255,255,255,0.4)',
  },
  'bodhi': {
    name: '菩提子/星月菩提',
    baseColors: ['#FFF8E1', '#FFECB3', '#FFE082', '#FFD54F', '#FFCA28'],
    highlight: '#FFFDE7',
    shadow: '#F57F17',
    stringColor: '#5D4037',
    bgColor: '#FFF3E0',
    dotColor: 'rgba(93,64,55,0.15)',
  },
  'hetian-jade': {
    name: '和田玉',
    baseColors: ['#F5F5F5', '#EEEEEE', '#E0E0E0', '#BDBDBD', '#9E9E9E'],
    highlight: '#FFFFFF',
    shadow: '#616161',
    stringColor: '#8D6E63',
    bgColor: '#FAFAFA',
    muttonColor: 'rgba(158,158,158,0.08)',
  },
  'tourmaline': {
    name: '碧玺/电气石',
    baseColors: ['#FFCDD2', '#F8BBD9', '#E1BEE7', '#C5CAE9', '#B2DFDB'],
    highlight: '#FFFFFF',
    shadow: '#424242',
    stringColor: '#5D4037',
    bgColor: '#F3E5F5',
    multiColor: 'rgba(0,0,0,0.05)',
  },
  'gold-sheen-obsidian': {
    name: '金曜石',
    baseColors: ['#212121', '#1a1a1a', '#0d0d0d', '#000000', '#000000'],
    highlight: '#FFD700',
    shadow: '#000000',
    stringColor: '#FFD54F',
    bgColor: '#ECEFF1',
    goldSheen: 'rgba(255,215,0,0.25)',
  },
};

/**
 * 创建单个逼真珠子的 SVG
 */
function createBeadSVG(mat, size = 70) {
  const r = size / 2;
  return `
  <defs>
    <radialGradient id="bg" cx="35%" cy="30%" r="70%">
      <stop offset="0%" stop-color="${mat.baseColors[0]}"/>
      <stop offset="20%" stop-color="${mat.baseColors[1]}"/>
      <stop offset="45%" stop-color="${mat.baseColors[2]}"/>
      <stop offset="70%" stop-color="${mat.baseColors[3]}"/>
      <stop offset="100%" stop-color="${mat.baseColors[4]}"/>
    </radialGradient>
    <radialGradient id="spec" cx="28%" cy="22%" r="22%">
      <stop offset="0%" stop-color="${mat.highlight}" stop-opacity="0.95"/>
      <stop offset="35%" stop-color="${mat.highlight}" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="${mat.highlight}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="rim" cx="50%" cy="52%" r="50%">
      <stop offset="60%" stop-color="${mat.baseColors[1]}" stop-opacity="0"/>
      <stop offset="85%" stop-color="${mat.baseColors[0]}" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="${mat.highlight}" stop-opacity="0.55"/>
    </radialGradient>
    <radialGradient id="shad" cx="50%" cy="52%" r="48%">
      <stop offset="0%" stop-color="${mat.shadow}" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="${mat.shadow}" stop-opacity="0"/>
    </radialGradient>
    <filter id="noise">
      <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="4" seed="${Math.floor(Math.random()*999)}" result="n"/>
      <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.18 0" in="n"/>
    </filter>
    <filter id="blur3"><feGaussianBlur stdDeviation="3"/></filter>
    <filter id="blur1"><feGaussianBlur stdDeviation="1"/></filter>
  </defs>

  <!-- 珠子阴影 -->
  <ellipse cx="2" cy="${r+4}" rx="${r*0.85}" ry="${r*0.25}" fill="#000" opacity="0.2" filter="url(#blur3)"/>

  <!-- 主体球 -->
  <circle r="${r}" fill="url(#bg)"/>

  <!-- 材质纹理层 -->
  <circle r="${r-1}" fill="url(#bg)" filter="url(#noise)" opacity="0.5"/>

  <!-- 内部深色渐变（立体感） -->
  <circle r="${r}" fill="url(#shad)" opacity="0.6"/>

  <!-- 边缘透光 -->
  <circle r="${r-0.5}" fill="url(#rim)"/>

  <!-- 主高光 -->
  <ellipse cx="${-r*0.32}" cy="${-r*0.32}" rx="${r*0.38}" ry="${r*0.26}" fill="url(#spec)"/>

  <!-- 次高光（底部反光） -->
  <ellipse cx="${r*0.22}" cy="${r*0.28}" rx="${r*0.14}" ry="${r*0.1}" fill="${mat.highlight}" opacity="0.2"/>

  <!-- 顶部微小点高光 -->
  <circle cx="${-r*0.15}" cy="${-r*0.45}" r="${r*0.05}" fill="#fff" opacity="0.6"/>
`;
}

/**
 * 生成完整手串 SVG
 */
function createBraceletSVG(mat) {
  // 手串弧形排列参数
  const beads = [];
  const cx = W / 2, cy = H / 2 + 10;
  const rx = 165, ry = 65; // 椭圆弧

  // 上半圈珠子 (从左到右)
  for (let i = -7; i <= 7; i++) {
    const angle = Math.PI * (0.12 + 0.76 * (i + 7) / 14);
    const x = cx + rx * Math.cos(Math.PI - angle);
    const y = cy - ry * Math.sin(angle);
    const scale = 0.78 + 0.22 * Math.sin(angle); // 远处珠子小，近处大
    const zOrder = Math.sin(angle); // 用于前后遮挡
    beads.push({ x, y, scale, zOrder, idx: i });
  }

  // 下半圈珠子
  for (let i = -6; i <= 6; i++) {
    const angle = Math.PI * (0.88 + 0.2 * (i + 6) / 12);
    const x = cx + rx * Math.cos(Math.PI - angle);
    const y = cy - ry * Math.sin(angle);
    const scale = 0.72 + 0.18 * (1 - Math.abs(i)/6.5);
    const zOrder = -Math.sin(angle);
    beads.push({ x, y, scale, zOrder, idx: i + 100 });
  }

  // 按 zOrder 排序（先画后面的）
  beads.sort((a, b) => a.zOrder - b.zOrder);

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
  <rect width="${W}" height="${H}" fill="${mat.bgColor}"/>

  <!-- 底部投影 -->
  <ellipse cx="${cx}" cy="${cy+ry+35}" rx="${rx*0.9}" ry="18" fill="#000" opacity="0.07" filter="url(#blur3)"/>

  <!-- 穿绳（后半段） -->
  <path d="M ${beads.find(b=>b.idx===-7)?.x||cx-rx} ${beads.find(b=>b.idx===-7)?.y||cy}
           Q ${cx} ${cy-ry-25} ${beads.find(b=>b.idx===7)?.x||cx+rx} ${beads.find(b=>b.idx===7)?.y||cy}"
        fill="none" stroke="${mat.stringColor}" stroke-width="2.5" opacity="0.5"/>

`;

  // 绘制每个珠子
  for (const b of beads) {
    const beadSize = 68 * b.scale;
    svg += `
  <g transform="translate(${b.x}, ${b.y}) scale(${b.scale})">
    <svg width="${beadSize}" height="${beadSize}" viewBox="-40 -40 80 80">
      ${createBeadSVG(mat, beadSize)}
    </svg>
  </g>`;
  }

  // 穿绳（前半段）
  svg += `
  <!-- 穿绳（前半段） -->
  <path d="M ${beads.find(b=>b.idx===-7)?.x||cx-rx} ${beads.find(b=>b.idx===-7)?.y||cy}
           Q ${cx} ${cy-ry-25} ${beads.find(b=>b.idx===7)?.x||cx+rx} ${beads.find(b=>b.idx===7)?.y||cy}"
        fill="none" stroke="${mat.stringColor}" stroke-width="2" opacity="0.7"/>
</svg>`;

  return svg;
}

async function main() {
  const entries = Object.entries(MATERIALS);
  
  for (const [key, mat] of entries) {
    console.log(`Generating ${mat.name} (${key})...`);
    
    const svg = createBraceletSVG(mat);
    const svgPath = path.join(OUT_DIR, `${key}.svg`);
    fs.writeFileSync(svgPath, svg);

    // 转换为 PNG/JPG
    const outPath = path.join(OUT_DIR, `${key}.jpg`);
    await sharp(Buffer.from(svg))
      .resize(W, H)
      .jpeg({ quality: 92 })
      .toFile(outPath);
    
    const stat = fs.statSync(outPath);
    console.log(`  ✓ ${key}.jpg (${(stat.size/1024).toFixed(1)}KB)`);
  }
  
  console.log('\nDone! All bracelet images generated.');
}

main().catch(console.error);
