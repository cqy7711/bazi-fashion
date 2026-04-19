// 用户行为追踪工具
const API_BASE = '/api';

interface TrackEvent {
  userId: string;
  eventType: string;
  eventData?: any;
  sessionId?: string;
  duration?: number;
  page?: string;
}

// 获取当前用户ID（从localStorage）
function getCurrentUserId(): string {
  // 尝试从多种来源获取用户ID
  const stored = localStorage.getItem('current-user-id');
  if (stored) return stored;
  
  // 如果没有，生成一个临时ID
  const tempId = 'anonymous-' + Date.now();
  localStorage.setItem('current-user-id', tempId);
  return tempId;
}

// 获取会话ID
function getSessionId(): string {
  let sessionId = sessionStorage.getItem('session-id');
  if (!sessionId) {
    sessionId = 'session-' + Date.now();
    sessionStorage.setItem('session-id', sessionId);
  }
  return sessionId;
}

// 追踪事件
export async function trackEvent(event: Omit<TrackEvent, 'userId' | 'sessionId'>) {
  try {
    const payload = {
      userId: getCurrentUserId(),
      sessionId: getSessionId(),
      ...event,
    };
    
    await fetch(`${API_BASE}/analytics/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch (e) {
    console.error('追踪失败:', e);
  }
}

// 开始会话
export async function startSession() {
  try {
    const userId = getCurrentUserId();
    const res = await fetch(`${API_BASE}/analytics/session/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    const data = await res.json();
    if (data.sessionId) {
      sessionStorage.setItem('session-id', data.sessionId);
      return data.sessionId;
    }
  } catch (e) {
    console.error('开始会话失败:', e);
  }
}

// 结束会话
export async function endSession(duration?: number) {
  try {
    const sessionId = sessionStorage.getItem('session-id');
    if (!sessionId) return;
    
    await fetch(`${API_BASE}/analytics/session/end`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, duration }),
    });
    
    sessionStorage.removeItem('session-id');
  } catch (e) {
    console.error('结束会话失败:', e);
  }
}

// 预设事件类型
export const EventTypes = {
  PAGE_VIEW: 'page_view',
  CLICK: 'click',
  AI_CHAT: 'ai_chat',
  STYLE_SELECT: 'style_select',
  OUTFIT_VIEW: 'outfit_view',
  BRACELET_VIEW: 'bracelet_view',
  FORTUNE_VIEW: 'fortune_view',
  BAZI_CALC: 'bazi_calc',
  DAYUN_VIEW: 'dayun_view',
  SESSION_START: 'session_start',
  SESSION_END: 'session_end',
};

// 预设页面名称
export const PageNames = {
  HOME: '首页',
  RESULT: '命盘结果',
  AI_CHAT: 'AI解读',
  ADMIN: '管理后台',
};

// 导出追踪钩子
export default {
  track: trackEvent,
  startSession,
  endSession,
  EventTypes,
  PageNames,
};
