const ANON_USER_ID_KEY = 'wuxing-anon-user-id';

function safeGetItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSetItem(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // ignore
  }
}

function createId(): string {
  const anyCrypto = globalThis.crypto as any;
  if (anyCrypto?.randomUUID) return anyCrypto.randomUUID();
  return `anon_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export function getOrCreateAnonUserId(): string {
  const existing = safeGetItem(ANON_USER_ID_KEY);
  if (existing) return existing;
  const id = createId();
  safeSetItem(ANON_USER_ID_KEY, id);
  return id;
}

