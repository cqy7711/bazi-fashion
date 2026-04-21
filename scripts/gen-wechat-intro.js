const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const width = 500;
const height = 900;

const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFF0F5"/>
      <stop offset="30%" stop-color="#FDF2FC"/>
      <stop offset="70%" stop-color="#F0F4FF"/>
      <stop offset="100%" stop-color="#E8F5FF"/>
    </linearGradient>
    <linearGradient id="topBar" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#FF6B9D"/>
      <stop offset="25%" stop-color="#C084FC"/>
      <stop offset="50%" stop-color="#818CF8"/>
      <stop offset="75%" stop-color="#38BDF8"/>
      <stop offset="100%" stop-color="#34D399"/>
    </linearGradient>
    <linearGradient id="titleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#E040FB"/>
      <stop offset="40%" stop-color="#C084FC"/>
      <stop offset="100%" stop-color="#818CF8"/>
    </linearGradient>
    <linearGradient id="card1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFE0EC"/>
      <stop offset="100%" stop-color="#FFCCE0"/>
    </linearGradient>
    <linearGradient id="card2" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#E0F0FF"/>
      <stop offset="100%" stop-color="#CCE0FF"/>
    </linearGradient>
    <linearGradient id="card3" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFF0D0"/>
      <stop offset="100%" stop-color="#FFE8B0"/>
    </linearGradient>
    <linearGradient id="card4" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#E0FFF4"/>
      <stop offset="100%" stop-color="#CCFFE8"/>
    </linearGradient>
    <filter id="softShadow">
      <feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="rgba(192,132,252,0.15)"/>
    </filter>
    <filter id="glow">
      <feGaussianBlur stdDeviation="6" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>

  <!-- 浅色渐变背景 -->
  <rect width="${width}" height="${height}" fill="url(#bgGrad)"/>

  <!-- 顶部彩虹条 -->
  <rect x="0" y="0" width="${width}" height="5" fill="url(#topBar)"/>

  <!-- 装饰光斑 -->
  <ellipse cx="-20" cy="100" rx="180" ry="180" fill="#FF6B9D" opacity="0.08"/>
  <ellipse cx="480" cy="200" rx="140" ry="140" fill="#C084FC" opacity="0.08"/>
  <ellipse cx="100" cy="600" rx="120" ry="120" fill="#38BDF8" opacity="0.07"/>
  <ellipse cx="420" cy="700" rx="100" ry="100" fill="#34D399" opacity="0.08"/>
  <ellipse cx="200" cy="800" rx="130" ry="130" fill="#FBBF24" opacity="0.07"/>
  <ellipse cx="80" cy="450" rx="80" ry="80" fill="#F472B6" opacity="0.06"/>
  <ellipse cx="380" cy="500" rx="90" ry="90" fill="#A78BFA" opacity="0.07"/>

  <!-- 顶部 logo -->
  <text x="${width/2}" y="50" text-anchor="middle" font-family="Outfit, sans-serif" font-size="11" font-weight="600" fill="rgba(100,60,180,0.5)" letter-spacing="6">WUXING · COLOR · FORTUNE</text>

  <!-- 主标题 -->
  <text x="${width/2}" y="175" text-anchor="middle" font-family="Noto Sans SC, sans-serif" font-size="58" font-weight="900" fill="url(#titleGrad)" letter-spacing="4">五行 · 色彩</text>
  <text x="${width/2}" y="210" text-anchor="middle" font-family="Noto Sans SC, sans-serif" font-size="17" font-weight="300" fill="rgba(100,60,180,0.55)" letter-spacing="14">· 命 运 ·</text>

  <!-- 五行图标行 -->
  <!-- 木 - 绿色 -->
  <rect x="55" y="268" width="70" height="80" rx="18" fill="url(#card4)" filter="url(#softShadow)"/>
  <text x="90" y="298" text-anchor="middle" font-family="Noto Sans SC, sans-serif" font-size="28" font-weight="900" fill="#16A34A">木</text>
  <text x="90" y="318" text-anchor="middle" font-family="Outfit, sans-serif" font-size="9" font-weight="600" fill="#16A34A" opacity="0.7" letter-spacing="1">WOOD</text>
  <text x="90" y="337" text-anchor="middle" font-family="Noto Sans SC, sans-serif" font-size="9" fill="#16A34A" opacity="0.5">青 · 绿</text>

  <!-- 火 - 红色 -->
  <rect x="135" y="268" width="70" height="80" rx="18" fill="url(#card1)" filter="url(#softShadow)"/>
  <text x="170" y="298" text-anchor="middle" font-family="Noto Sans SC, sans-serif" font-size="28" font-weight="900" fill="#E11D48">火</text>
  <text x="170" y="318" text-anchor="middle" font-family="Outfit, sans-serif" font-size="9" font-weight="600" fill="#E11D48" opacity="0.7" letter-spacing="1">FIRE</text>
  <text x="170" y="337" text-anchor="middle" font-family="Noto Sans SC, sans-serif" font-size="9" fill="#E11D48" opacity="0.5">赤 · 红</text>

  <!-- 土 - 黄色 -->
  <rect x="215" y="268" width="70" height="80" rx="18" fill="url(#card3)" filter="url(#softShadow)"/>
  <text x="250" y="298" text-anchor="middle" font-family="Noto Sans SC, sans-serif" font-size="28" font-weight="900" fill="#D97706">土</text>
  <text x="250" y="318" text-anchor="middle" font-family="Outfit, sans-serif" font-size="9" font-weight="600" fill="#D97706" opacity="0.7" letter-spacing="1">EARTH</text>
  <text x="250" y="337" text-anchor="middle" font-family="Noto Sans SC, sans-serif" font-size="9" fill="#D97706" opacity="0.5">黄 · 棕</text>

  <!-- 金 - 蓝色 -->
  <rect x="295" y="268" width="70" height="80" rx="18" fill="url(#card2)" filter="url(#softShadow)"/>
  <text x="330" y="298" text-anchor="middle" font-family="Noto Sans SC, sans-serif" font-size="28" font-weight="900" fill="#2563EB">金</text>
  <text x="330" y="318" text-anchor="middle" font-family="Outfit, sans-serif" font-size="9" font-weight="600" fill="#2563EB" opacity="0.7" letter-spacing="1">METAL</text>
  <text x="330" y="337" text-anchor="middle" font-family="Noto Sans SC, sans-serif" font-size="9" fill="#2563EB" opacity="0.5">白 · 银</text>

  <!-- 水 - 青色 -->
  <rect x="375" y="268" width="70" height="80" rx="18" fill="#E0FEFE" filter="url(#softShadow)"/>
  <text x="410" y="298" text-anchor="middle" font-family="Noto Sans SC, sans-serif" font-size="28" font-weight="900" fill="#0891B2">水</text>
  <text x="410" y="318" text-anchor="middle" font-family="Outfit, sans-serif" font-size="9" font-weight="600" fill="#0891B2" opacity="0.7" letter-spacing="1">WATER</text>
  <text x="410" y="337" text-anchor="middle" font-family="Noto Sans SC, sans-serif" font-size="9" fill="#0891B2" opacity="0.5">黑 · 蓝</text>

  <!-- 功能卡片区 -->
  <!-- AI智能解读 -->
  <rect x="30" y="385" width="${width-60}" height="80" rx="20" fill="white" filter="url(#softShadow)"/>
  <rect x="30" y="385" width="6" height="80" rx="3" fill="#C084FC"/>
  <circle cx="72" cy="425" r="22" fill="#F3E8FF"/>
  <text x="72" y="431" text-anchor="middle" font-size="20">🔮</text>
  <text x="105" y="418" font-family="Noto Sans SC, sans-serif" font-size="15" font-weight="700" fill="#1E1B4B">AI 智能解读</text>
  <text x="105" y="438" font-family="Noto Sans SC, sans-serif" font-size="12" font-weight="400" fill="#6B7280">输入生辰，自动分析命盘五行</text>
  <text x="462" y="431" text-anchor="middle" font-family="Noto Sans SC, sans-serif" font-size="18" fill="#C084FC">›</text>

  <!-- 专属色彩搭配 -->
  <rect x="30" y="480" width="${width-60}" height="80" rx="20" fill="white" filter="url(#softShadow)"/>
  <rect x="30" y="480" width="6" height="80" rx="3" fill="#F472B6"/>
  <circle cx="72" cy="520" r="22" fill="#FCE7F3"/>
  <text x="72" y="526" text-anchor="middle" font-size="20">🎨</text>
  <text x="105" y="513" font-family="Noto Sans SC, sans-serif" font-size="15" font-weight="700" fill="#1E1B4B">专属色彩搭配</text>
  <text x="105" y="533" font-family="Noto Sans SC, sans-serif" font-size="12" font-weight="400" fill="#6B7280">根据五行属性定制穿搭配色</text>
  <text x="462" y="526" text-anchor="middle" font-family="Noto Sans SC, sans-serif" font-size="18" fill="#F472B6">›</text>

  <!-- 五行手串推荐 -->
  <rect x="30" y="575" width="${width-60}" height="80" rx="20" fill="white" filter="url(#softShadow)"/>
  <rect x="30" y="575" width="6" height="80" rx="3" fill="#38BDF8"/>
  <circle cx="72" cy="615" r="22" fill="#E0F2FE"/>
  <text x="72" y="621" text-anchor="middle" font-size="20">📿</text>
  <text x="105" y="608" font-family="Noto Sans SC, sans-serif" font-size="15" font-weight="700" fill="#1E1B4B">五行手串推荐</text>
  <text x="105" y="628" font-family="Noto Sans SC, sans-serif" font-size="12" font-weight="400" fill="#6B7280">旺运材质与款式智能推荐</text>
  <text x="462" y="621" text-anchor="middle" font-family="Noto Sans SC, sans-serif" font-size="18" fill="#38BDF8">›</text>

  <!-- 今日运势提示 -->
  <rect x="30" y="670" width="${width-60}" height="80" rx="20" fill="white" filter="url(#softShadow)"/>
  <rect x="30" y="670" width="6" height="80" rx="3" fill="#FBBF24"/>
  <circle cx="72" cy="710" r="22" fill="#FEF9C3"/>
  <text x="72" y="716" text-anchor="middle" font-size="20">✨</text>
  <text x="105" y="703" font-family="Noto Sans SC, sans-serif" font-size="15" font-weight="700" fill="#1E1B4B">今日运势提示</text>
  <text x="105" y="723" font-family="Noto Sans SC, sans-serif" font-size="12" font-weight="400" fill="#6B7280">每日运势、方位、颜色全面指引</text>
  <text x="462" y="716" text-anchor="middle" font-family="Noto Sans SC, sans-serif" font-size="18" fill="#FBBF24">›</text>

  <!-- 底部标签 -->
  <rect x="55" y="788" width="80" height="30" rx="15" fill="#F3E8FF" stroke="#C084FC" stroke-width="1.5"/>
  <text x="95" y="807" text-anchor="middle" font-family="Noto Sans SC, sans-serif" font-size="11" font-weight="600" fill="#7C3AED">免费使用</text>

  <rect x="145" y="788" width="70" height="30" rx="15" fill="#FCE7F3" stroke="#EC4899" stroke-width="1.5"/>
  <text x="180" y="807" text-anchor="middle" font-family="Noto Sans SC, sans-serif" font-size="11" font-weight="600" fill="#BE185D">AI 解读</text>

  <rect x="225" y="788" width="90" height="30" rx="15" fill="#E0F2FE" stroke="#0EA5E9" stroke-width="1.5"/>
  <text x="270" y="807" text-anchor="middle" font-family="Noto Sans SC, sans-serif" font-size="11" font-weight="600" fill="#0369A1">个性化配色</text>

  <rect x="75" y="828" width="80" height="30" rx="15" fill="#FEF9C3" stroke="#F59E0B" stroke-width="1.5"/>
  <text x="115" y="847" text-anchor="middle" font-family="Noto Sans SC, sans-serif" font-size="11" font-weight="600" fill="#B45309">每日运势</text>

  <rect x="165" y="828" width="80" height="30" rx="15" fill="#DCFCE7" stroke="#16A34A" stroke-width="1.5"/>
  <text x="205" y="847" text-anchor="middle" font-family="Noto Sans SC, sans-serif" font-size="11" font-weight="600" fill="#15803D">智能推荐</text>

  <!-- 底部提示 -->
  <text x="${width/2}" y="888" text-anchor="middle" font-family="Noto Sans SC, sans-serif" font-size="11" font-weight="400" fill="rgba(100,60,180,0.35)" letter-spacing="2">长按识别二维码 · 免费体验</text>
</svg>`;

const outputPath = path.join(__dirname, 'wechat-intro.png');

sharp(Buffer.from(svg))
  .png({ quality: 95 })
  .toFile(outputPath)
  .then(() => {
    console.log('✅ 生成成功:', outputPath);
    const stats = fs.statSync(outputPath);
    console.log('大小:', (stats.size / 1024).toFixed(1), 'KB');
  })
  .catch(err => {
    console.error('❌ 失败:', err.message);
    process.exit(1);
  });
