import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Send, Loader2, MessageCircle, Sparkles, Trash2, BookOpen, Shirt, Gem, RefreshCw, ArrowLeft, Info } from 'lucide-react';
import type { UserBirthInfo } from '../../shared/types';

const USER_ID = 'user_default';

function cn(...c: (string | boolean | undefined)[]) { return c.filter(Boolean).join(' '); }

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const QUICK_QUESTIONS = [
  { icon: <BookOpen className="w-4 h-4" />, text: '我的八字命局解读', prompt: '请详细解读我的八字命局，包括性格特点、人生运势和建议。' },
  { icon: <Shirt className="w-4 h-4" />, text: '今日穿搭建议', prompt: '根据我的八字，今日穿什么颜色的衣服最好？' },
  { icon: <Gem className="w-4 h-4" />, text: '适合我的手串', prompt: '根据我的八字五行，什么材质的手串最适合我？' },
  { icon: <Sparkles className="w-4 h-4" />, text: '流年运势', prompt: '请分析我今年的流年运势，有哪些需要注意的事项？' },
];

const SUGGESTIONS_ABOUT: Record<string, string> = {
  wood: '您的八字喜木，代表生长、条达、向上。您适合从事文化、教育、创意、木材、纺织等相关行业。性格上您往往富有同情心，善于表达，适合需要沟通能力的工作。',
  fire: '您的八字喜火，代表热情、活力、光明。您适合从事能源、光电、餐饮、娱乐、文化传播等充满活力的行业。性格上您积极主动，善于社交，人缘较好。',
  earth: '您的八字喜土，代表稳重、包容、诚信。您适合从事建筑、农业、房地产、财务、法律等需要稳重踏实品质的工作。性格上您务实可靠，值得信赖。',
  metal: '您的八字喜金，代表清净、肃杀、决断。您适合从事金融、科技、医疗、金属加工、军事等需要决断力和逻辑思维的工作。性格上您理性果断，原则性强。',
  water: '您的八字喜水，代表智慧、流动、变通。您适合从事贸易、运输、航海、IT、咨询等需要灵活应变的工作。性格上您思维敏捷，善于观察，适合需要智慧的工作。',
};

function generateAIResponse(userInfo: UserBirthInfo | null, question: string): string {
  if (!userInfo || !userInfo.baziResult) {
    return '您还没有录入生辰八字信息，无法进行AI解读。请先返回首页录入您的生辰信息，AI将根据您的八字为您提供个性化的解答。';
  }

  const bazi = userInfo.baziResult;
  const fav = userInfo.favorableElements || [];
  const unfav = userInfo.unfavorableElements || [];
  const unav = unfav;
  const dm = bazi.dayMasterElement;
  const dmName = { wood: '木', fire: '火', earth: '土', metal: '金', water: '水' }[dm] || '木';

  const lowerQ = question.toLowerCase();

  if (lowerQ.includes('命局') || lowerQ.includes('性格') || lowerQ.includes('解读')) {
    return `【八字命局解读】

📌 您的基本信息：
四柱：${bazi.yearPillar} · ${bazi.monthPillar} · ${bazi.dayPillar} · ${bazi.hourPillar}
日主：${bazi.dayMaster}（${dmName}行）
喜用神：${fav.map(e => ({ wood: '木🪵', fire: '火🔥', earth: '土🏔', metal: '金⚪', water: '水🌊' }[e])).join('、')}

💡 命局特点：
您的日主为${bazi.dayMaster}，${dmName}行之人往往${dm === 'wood' ? '仁慈善良，有条理，善于计划和协调' : dm === 'fire' ? '热情开朗，善于表达，富有感染力' : dm === 'earth' ? '务实稳重，诚实守信，有责任心' : dm === 'metal' ? '刚毅果断，原则性强，善于决断' : '聪慧灵活，善于变通，适应力强'}。

🏆 您的优势：
• 喜用神为${dmName}，意味着您在与该五行相关的领域会更有优势
${dm === 'wood' ? '• 适合从事需要条理和计划的工作' : dm === 'fire' ? '• 适合从事需要热情和表达力的工作' : dm === 'earth' ? '• 适合从事需要稳重和信誉的工作' : dm === 'metal' ? '• 适合从事需要决断力和逻辑的工作' : '• 适合从事需要智慧和灵活性的工作'}

⚠️ 注意事项：
忌神为${unfav.map(e => ({ wood: '木', fire: '火', earth: '土', metal: '金', water: '水' }[e])).join('、')}，在相关场合需特别注意调整心态。`;
  }

  if (lowerQ.includes('穿搭') || lowerQ.includes('颜色') || lowerQ.includes('衣服') || lowerQ.includes('今日')) {
    const colors: Record<string, string[]> = { wood: ['绿色', '青色', '翠色'], fire: ['红色', '粉色', '紫色'], earth: ['黄色', '米色', '咖啡色'], metal: ['白色', '银色', '金色'], water: ['黑色', '深蓝色', '灰色'] };
    const c = colors[dm] || colors.earth!;
    return `【穿搭色彩建议】

🌈 今日推荐颜色：
根据您的喜用神为${dmName}行，最适合您的颜色是：**${c.join('、')}**

💡 颜色解读：
${c.map((color, i) => `${color}：${i === 0 ? '主色，可大面积穿着，增强运势' : i === 1 ? '辅助色，搭配主色使用，平衡气场' : '点缀色，小面积配饰画龙点睛'}`).join('\n')}

👔 场合建议：
• 职场：选择${c[0]}为主色调，搭配${c[1]}作为辅助，体现专业又有气场
• 日常：${c[0]}休闲装既舒适又能保持运势
• 约会：${c[2]}点缀能增加神秘感和魅力

⚠️ 避免颜色：
忌神${unav.map(e => ({ wood: '木', fire: '火', earth: '土', metal: '金', water: '水' }[e as any])).join('、')}对应的颜色不宜大面积使用，以免影响运势。`;
  }

  if (lowerQ.includes('手串') || lowerQ.includes('首饰') || lowerQ.includes('饰品') || lowerQ.includes('珠宝')) {
    const gems: Record<string, string> = { wood: '绿幽灵水晶、翡翠、檀木', fire: '南红玛瑙、红珊瑚、石榴石', earth: '黄水晶、虎眼石、蜜蜡', metal: '白水晶、银饰、金发晶', water: '黑曜石、海蓝宝、青金石' };
    const g = gems[dm] || gems.earth!;
    return `【开运手串推荐】

📿 适合您的手串材质：
根据您的喜用神为${dmName}行，以下材质最适合您：
**${g}**

💎 材质详解：
${g.split('、').map(item => `• ${item}：${dm === 'wood' ? '属木，增强生机与活力' : dm === 'fire' ? '属火，增强热情与魅力' : dm === 'earth' ? '属土，增强稳重与财运' : dm === 'metal' ? '属金，增强决断与财运' : '属水，增强智慧与财运'}，非常适合您的命格`).join('\n')}

🔮 佩戴建议：
• 主推：${g.split('、')[0]} — 属${dmName}行，与您的喜用神完全匹配
• 辅助：${g.split('、')[1]} — 可搭配主串增强效果
• 佩戴手：建议佩戴于左手
• 保养：定期清水冲洗净化，避免碰撞

💡 小贴士：
手串不仅是装饰品，更是您八字喜用神的能量载体，佩戴得当可为您带来好运！`;
  }

  if (lowerQ.includes('流年') || lowerQ.includes('今年') || lowerQ.includes('运势')) {
    const today = new Date();
    const year = today.getFullYear();
    return `【${year}年流年运势】

🔮 当前运势分析：
${year}年流年运势受多重因素影响，结合您的八字来看：

✨ 有利方面：
• 流年与您的喜用神${fav[0] ? { wood: '木🪵', fire: '火🔥', earth: '土🏔', metal: '金⚪', water: '水🌊' }[fav[0]] : ''}相关联
${dm === 'wood' ? '• 今年木气旺盛，对您的事业和学业都有积极影响' : dm === 'fire' ? '• 今年火气当令，您的活力和魅力得到充分展现' : dm === 'earth' ? '• 今年土气沉稳，您的事业发展稳固扎实' : dm === 'metal' ? '• 今年金气清肃，您的决断力和财运都有提升' : '• 今年水气灵动，您的智慧和财运都有增长机会'}

⚠️ 需要注意：
• 注意控制情绪，避免冲动决策
${dm === 'wood' ? '• 肝胆健康需多加关注' : dm === 'fire' ? '• 心脏和眼部健康需多加关注' : dm === 'earth' ? '• 脾胃健康需多加关注' : dm === 'metal' ? '• 肺部健康需多加关注' : '• 肾脏健康需多加关注'}

💡 建议：
• 多接触${fav[0] ? { wood: '森林、绿植', fire: '阳光、温暖', earth: '山地、大地', metal: '金属、清新空气', water: '水域、流动的水' }[fav[0]] : '自然'}相关的环境
• 重要决策可咨询专业人士
• 保持平和心态，稳中求进`;
  }

  if (lowerQ.includes('事业') || lowerQ.includes('工作') || lowerQ.includes('职场')) {
    const careers: Record<string, string> = { wood: '教育、文化出版、互联网IT、策划设计、家具木材、纺织品、环保', fire: '餐饮娱乐、能源光电、演艺传媒、销售公关、心理咨询、培训讲师', earth: '建筑房地产、农业种植、财务会计、法律咨询、行政管理、酒店旅游', metal: '金融投资、科技技术、医疗健康、军事执法、金属加工、咨询服务', water: '贸易物流、航海运输、IT互联网、咨询策划、媒体传播、金融保险' };
    const c = careers[dm] || careers.earth!;
    return `【事业方向建议】

💼 您的职业优势：
${SUGGESTIONS_ABOUT[dm]}

🎯 推荐职业方向：
最适合您的行业：**${c}**

🌟 具体建议：
• ${c.split('、')[0]}：这是与您喜用神最契合的领域，深耕此方向会有事半功倍的效果
• ${c.split('、')[1]}：作为备选方向，同样能够发挥您的优势
• ${c.split('、')[2]}：如果您对此感兴趣，可以作为副业或转型方向

📈 职场建议：
• 在工作中多展现${dmName}行的特质（如：${dm === 'wood' ? '条理性、计划性、协调能力' : dm === 'fire' ? '热情、表达能力、感染力' : dm === 'earth' ? '稳重、诚信、责任心' : dm === 'metal' ? '决断力、原则性、逻辑思维' : '灵活性、适应性、洞察力'}）
• 避免在工作中过多接触${unav.map(e => ({ wood: '火', fire: '水', earth: '木', metal: '火', water: '土' }[e as any])).join('、')}相关的元素`;
  }

  if (lowerQ.includes('感情') || lowerQ.includes('婚姻') || lowerQ.includes('恋爱') || lowerQ.includes('桃花')) {
    const traits: Record<string, string> = { wood: '善良、有条理、善于照顾人，但有时过于追求完美', fire: '热情主动、善于表达、人缘好，但有时情绪波动较大', earth: '务实稳重、责任心强、忠诚可靠，但有时过于保守', metal: '理性果断、原则性强、有品位，但有时过于挑剔', water: '温柔体贴、善解人意、浪漫，但有时缺乏安全感' };
    const t = traits[dm] || traits.earth!;
    return `【感情运势分析】

💕 您的性格特点：
${t}

🎯 理想伴侣类型：
根据您的八字分析，最适合您的伴侣是${fav[0] ? { wood: '木行或水行之人，能与您形成水木相生的和谐关系', fire: '木行或火行之人，与您热情相投，感情热烈', earth: '火行或土行之人，与您相互扶持，关系稳定', metal: '土行或金行之人，与您理性相投，价值观一致', water: '金行或水行之人，与您默契十足，心意相通' }[fav[0]] : '五行属性与您互补的异性'}。

💡 感情建议：
• ${dm === 'wood' ? '在感情中多表达自己的想法，不要过于压抑' : dm === 'fire' ? '学会控制情绪，给对方稳定的情感支持' : dm === 'earth' ? '适度放松控制欲，给彼此一些空间' : dm === 'metal' ? '不要太挑剔，学会欣赏对方的优点' : '增强安全感，过于敏感会影响感情'}
• 避免与${unav.map(e => ({ wood: '金', fire: '水', earth: '木', metal: '火', water: '土' }[e as any])).join('、')}属性过强的人深度交往
• 佩戴喜用神手串可增强感情运势`;
  }

  if (lowerQ.includes('健康') || lowerQ.includes('养生') || lowerQ.includes('身体')) {
    const organs: Record<string, string> = { wood: '肝胆系统、神经系统、筋骨关节、头发指甲', fire: '心脏血液循环、眼睛视力、精神状态、血压', earth: '脾胃消化系统、口腔健康、肌肉骨骼、皮肤', metal: '肺部呼吸系统、大肠排泄、皮肤毛发、免疫系统', water: '肾脏泌尿系统、生殖系统、耳朵听力、骨髓脑部' };
    const exercises: Record<string, string> = { wood: '瑜伽、太极、户外徒步、散步', fire: '有氧跑步、游泳、健身操、骑行', earth: '力量训练、八段锦、登山、园艺', metal: '深呼吸练习、冥想、游泳、快走', water: '游泳、太极、瑜伽、冥想' };
    const foods: Record<string, string> = { wood: '绿色蔬菜、豆制品、坚果、绿茶', fire: '红色食物（红豆、红枣）、苦瓜、西瓜', earth: '黄色食物（玉米、小米）、山药、红薯', metal: '白色食物（梨、银耳）、百合、莲子', water: '黑色食物（黑豆、黑芝麻）、海带、山药' };
    const o = organs[dm] || organs.earth!;
    return `【健康养生建议】

🏥 需要特别注意的部位：
${o}

💪 推荐运动方式：
${exercises[dm] || exercises.earth!}

🥗 饮食调理建议：
${foods[dm] || foods.earth!}

🌿 环境养生：
多接触${dm === 'wood' ? '绿色植物、森林、公园，有养肝明目之效' : dm === 'fire' ? '阳光充足的环境，但避免暴晒，有温养心阳之效' : dm === 'earth' ? '山地、泥土、大自然，有健脾和胃之效' : dm === 'metal' ? '空气清新的环境，适当进行深呼吸，有润肺之效' : '流动的水域、湖泊，有滋肾益精之效'}

⚠️ 特别提醒：
• 保持规律作息，避免熬夜
• 注意情绪管理，怒伤肝、喜伤心、思伤脾、悲伤肺、恐伤肾
• 建议每年定期体检，重点关注上述器官`;
  }

  // 默认回复
  return `【AI八字助手】

您好！我是您的专属八字AI助手，可以帮您解答以下问题：

🔮 **命理解读**：解读您的八字命局、性格特点
👔 **穿搭建议**：根据您的喜用神推荐适合的颜色
📿 **手串推荐**：推荐最适合您的开运手串材质
📈 **流年运势**：分析您今年的整体运势
💼 **事业方向**：提供职业发展建议
💕 **感情运势**：分析感情特点和理想伴侣
🏥 **健康养生**：给出养生和健康建议

您可以直接问我任何问题，我会根据您的八字信息给出个性化解答！
`;
}

export default function AiChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [userInfo, setUserInfo] = useState<UserBirthInfo | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 加载用户列表，取最新记录
    fetch(`/api/users/${USER_ID}/birth-info`)
      .then(r => r.json())
      .then(data => {
        if (data.items?.length > 0) {
          const latest = data.items[0];
          setCurrentUserId(latest.id);
          fetch(`/api/users/${USER_ID}/birth-info/${latest.id}`)
            .then(r => r.json())
            .then(info => { if (!info.error) setUserInfo(info); });
        }
      })
      .catch(console.error);

    // 欢迎消息
    setMessages([{
      id: 'welcome',
      role: 'assistant',
      content: '🌟 欢迎来到八字AI助手！\n\n我是您的专属命理顾问，可以根据您的八字为您提供个性化的命理解读、穿搭建议、手串推荐等服务。\n\n请选择您感兴趣的话题，或直接向我提问！',
      timestamp: new Date(),
    }]);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return;
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: text, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    // 模拟AI思考延迟
    await new Promise(r => setTimeout(r, 600 + Math.random() * 800));

    const response = generateAIResponse(userInfo, text);
    const aiMsg: ChatMessage = { id: (Date.now() + 1).toString(), role: 'assistant', content: response, timestamp: new Date() };
    setMessages(prev => [...prev, aiMsg]);
    setLoading(false);
  }

  function handleQuickQuestion(prompt: string) {
    sendMessage(prompt);
  }

  function clearChat() {
    setMessages([{
      id: 'welcome-' + Date.now(),
      role: 'assistant',
      content: '🌟 聊天已清空！请选择您感兴趣的话题，或直接向我提问。',
      timestamp: new Date(),
    }]);
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* 顶部信息栏 */}
      {userInfo && (
        <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
          className="mb-4 px-4 py-2.5 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-100 flex items-center gap-3">
          <Sparkles className="w-4 h-4 text-primary shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-foreground font-medium truncate">
              基于：{userInfo.name} · {userInfo.baziResult?.yearPillar}年{userInfo.baziResult?.monthPillar}月{userInfo.baziResult?.dayPillar}日{userInfo.baziResult?.hourPillar}时 · 日主{userInfo.baziResult?.dayMaster}
            </p>
          </div>
          <a href="/" className="text-xs text-primary hover:underline shrink-0">修改</a>
        </motion.div>
      )}

      {!userInfo && (
        <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
          className="mb-4 px-4 py-3 bg-amber-50 rounded-xl border border-amber-100 flex items-center gap-3">
          <Info className="w-4 h-4 text-amber-600 shrink-0" />
          <p className="text-sm text-amber-700">
            您还没有录入生辰信息，AI将提供通用性建议。
            <a href="/" className="ml-1 underline font-medium">先去录入 →</a>
          </p>
        </motion.div>
      )}

      {/* 快捷问题 */}
      {messages.length <= 2 && (
        <div className="mb-4">
          <p className="text-xs text-muted-foreground mb-2 font-medium">快捷问题</p>
          <div className="grid grid-cols-2 gap-2">
            {QUICK_QUESTIONS.map((q, i) => (
              <motion.button key={i} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                onClick={() => handleQuickQuestion(q.prompt)}
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white border border-border text-left hover:border-primary/50 hover:bg-amber-50/50 transition-all group">
                <span className="text-primary group-hover:scale-110 transition-transform">{q.icon}</span>
                <span className="text-xs font-medium text-foreground">{q.text}</span>
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* 聊天记录 */}
      <div className="space-y-3 mb-4 max-h-[55vh] overflow-y-auto pr-1">
        {messages.map(msg => (
          <motion.div key={msg.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className={cn('flex gap-2.5', msg.role === 'user' && 'flex-row-reverse')}>
            <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-sm font-black',
              msg.role === 'user' ? 'bg-primary text-white' : 'bg-secondary border border-border text-foreground')}>
              {msg.role === 'user' ? '我' : '☯'}
            </div>
            <div className={cn('flex-1 max-w-[80%]', msg.role === 'user' && 'text-right')}>
              <div className={cn('inline-block px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap text-left',
                msg.role === 'user'
                  ? 'bg-primary text-white rounded-tr-sm'
                  : 'bg-white border border-border rounded-tl-sm shadow-sm')}>
                {msg.content}
              </div>
              <p className="text-[10px] text-muted-foreground mt-1 px-1">
                {msg.timestamp.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </motion.div>
        ))}

        {loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-secondary border border-border flex items-center justify-center text-sm font-black shrink-0">☯</div>
            <div className="inline-block px-4 py-3 rounded-2xl rounded-tl-sm bg-white border border-border shadow-sm">
              <div className="flex items-center gap-1">
                {[0, 1, 2].map(i => (
                  <div key={i} className="w-2 h-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          </motion.div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* 输入框 */}
      <div className="bg-white rounded-2xl border border-border p-3 flex gap-2 items-end shadow-sm">
        {messages.length > 1 && (
          <button onClick={clearChat} className="p-2 rounded-xl hover:bg-secondary/50 text-muted-foreground transition-colors shrink-0" title="清空聊天">
            <Trash2 className="w-4 h-4" />
          </button>
        )}
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
          placeholder="输入您的问题，按 Enter 发送..."
          rows={1}
          className="flex-1 resize-none text-sm bg-transparent focus:outline-none max-h-32 placeholder:text-muted-foreground/60"
        />
        <button onClick={() => sendMessage(input)} disabled={!input.trim() || loading}
          className="p-2.5 rounded-xl bg-primary text-white hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </div>
      <p className="text-[10px] text-muted-foreground/60 text-center mt-2">AI助手基于您的八字信息提供参考建议，内容仅供参考</p>
    </div>
  );
}
