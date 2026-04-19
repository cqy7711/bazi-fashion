import { useCallback, useEffect, useState } from 'react';
import { ChevronDown, ChevronUp, Ruler, Smartphone } from 'lucide-react';

const KEY = (s: string) => `wuxing-dev-mobile-${s}`;

/**
 * 仅开发环境：移动端视口预览与排版辅助（线框、安全区、桌面「手机宽」约束）。
 * 真机预览：与本机同一 WiFi，访问终端里 Vite 打印的 Network 地址（需 vite server.host）。
 */
export function MobileVisualDebug() {
  const [open, setOpen] = useState(false);
  const [vv, setVv] = useState({ iw: 0, ih: 0, vw: 0, vh: 0, dpr: 1 });
  const [outline, setOutline] = useState(() => sessionStorage.getItem(KEY('outline')) === '1');
  const [fakeSafe, setFakeSafe] = useState(() => sessionStorage.getItem(KEY('safe')) === '1');
  const [phoneFrame, setPhoneFrame] = useState(() => sessionStorage.getItem(KEY('frame')) === '1');
  const [frameW, setFrameW] = useState(() => {
    const n = Number(sessionStorage.getItem(KEY('frameW')));
    return Number.isFinite(n) && n >= 300 ? n : 390;
  });

  const measure = useCallback(() => {
    const vvApi = window.visualViewport;
    setVv({
      iw: window.innerWidth,
      ih: window.innerHeight,
      vw: vvApi?.width ?? window.innerWidth,
      vh: vvApi?.height ?? window.innerHeight,
      dpr: window.devicePixelRatio || 1,
    });
  }, []);

  useEffect(() => {
    measure();
    window.addEventListener('resize', measure);
    window.visualViewport?.addEventListener('resize', measure);
    window.visualViewport?.addEventListener('scroll', measure);
    return () => {
      window.removeEventListener('resize', measure);
      window.visualViewport?.removeEventListener('resize', measure);
      window.visualViewport?.removeEventListener('scroll', measure);
    };
  }, [measure]);

  useEffect(() => {
    document.documentElement.classList.toggle('dev-mobile-outline', outline);
    sessionStorage.setItem(KEY('outline'), outline ? '1' : '0');
  }, [outline]);

  useEffect(() => {
    document.documentElement.classList.toggle('dev-mobile-fake-safe', fakeSafe);
    sessionStorage.setItem(KEY('safe'), fakeSafe ? '1' : '0');
  }, [fakeSafe]);

  useEffect(() => {
    document.documentElement.classList.toggle('dev-mobile-phone-frame', phoneFrame);
    document.documentElement.style.setProperty('--dev-mobile-frame-max', `${frameW}px`);
    sessionStorage.setItem(KEY('frame'), phoneFrame ? '1' : '0');
    sessionStorage.setItem(KEY('frameW'), String(frameW));
  }, [phoneFrame, frameW]);

  return (
    <>
      <style>{`
        html.dev-mobile-outline * {
          outline: 1px solid rgba(180, 60, 100, 0.22) !important;
          outline-offset: -1px;
        }
        html.dev-mobile-fake-safe body {
          padding-top: max(env(safe-area-inset-top, 0px), 48px);
          padding-bottom: max(env(safe-area-inset-bottom, 0px), 34px);
        }
        html.dev-mobile-phone-frame {
          background: #c8c4ce !important;
        }
        html.dev-mobile-phone-frame body {
          background: #c8c4ce !important;
        }
        html.dev-mobile-phone-frame #root {
          width: 100%;
          max-width: var(--dev-mobile-frame-max, 390px);
          margin-left: auto;
          margin-right: auto;
          min-height: 100vh;
          box-shadow: 0 0 0 1px rgba(0,0,0,0.06), 0 16px 48px rgba(40, 36, 56, 0.14);
          background: inherit;
        }
      `}</style>

      <div
        style={{
          position: 'fixed',
          right: 10,
          bottom: 'max(10px, env(safe-area-inset-bottom, 0px))',
          zIndex: 2147483000,
          fontFamily: 'Outfit, Noto Sans SC, system-ui, sans-serif',
          touchAction: 'manipulation',
        }}
      >
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '10px 14px',
            borderRadius: 999,
            border: '1px solid rgba(90,86,102,0.2)',
            background: 'linear-gradient(165deg, rgba(252,251,253,0.96), rgba(236,234,240,0.92))',
            boxShadow: '0 8px 24px rgba(40,36,56,0.12)',
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 700,
            color: '#4a4658',
          }}
        >
          <Smartphone style={{ width: 16, height: 16, flexShrink: 0 }} />
          移动端视觉
          {open ? <ChevronDown style={{ width: 16, height: 16 }} /> : <ChevronUp style={{ width: 16, height: 16 }} />}
        </button>

        {open && (
          <div
            style={{
              marginTop: 8,
              width: 'min(320px, calc(100vw - 20px))',
              maxHeight: 'min(70vh, 520px)',
              overflowY: 'auto',
              padding: 12,
              borderRadius: 16,
              border: '1px solid rgba(90,86,102,0.14)',
              background: 'linear-gradient(165deg, rgba(252,251,253,0.98), rgba(244,242,246,0.96))',
              boxShadow: '0 12px 36px rgba(40,36,56,0.14)',
              WebkitOverflowScrolling: 'touch',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10, color: '#5c5866' }}>
              <Ruler style={{ width: 14, height: 14 }} />
              <span style={{ fontSize: 12, fontWeight: 700 }}>视口</span>
            </div>
            <div style={{ fontSize: 11, color: '#6e6a78', lineHeight: 1.55, marginBottom: 12 }}>
              inner：<b>{vv.iw}</b>×<b>{vv.ih}</b>
              <br />
              visualViewport：<b>{Math.round(vv.vw)}</b>×<b>{Math.round(vv.vh)}</b>
              <br />
              DPR：<b>{vv.dpr}</b>
            </div>

            <div style={{ fontSize: 10, color: '#8a8694', lineHeight: 1.5, marginBottom: 12, padding: '8px 10px', borderRadius: 10, background: 'rgba(108,102,124,0.08)' }}>
              <b>真机预览：</b>电脑运行 <code style={{ fontSize: 10 }}>npm run dev</code> 后，查看终端里的 <b>Network</b> 地址；手机与电脑同一 Wi‑Fi，浏览器打开{' '}
              <code style={{ fontSize: 10 }}>http://&lt;该IP&gt;:5173</code>
              。本机 IP 示例（Mac）：<code style={{ fontSize: 10 }}>ipconfig getifaddr en0</code>
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, cursor: 'pointer', fontSize: 12, color: '#4a4658' }}>
              <input type="checkbox" checked={outline} onChange={(e) => setOutline(e.target.checked)} />
              线框模式（看边界与遮挡）
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, cursor: 'pointer', fontSize: 12, color: '#4a4658' }}>
              <input type="checkbox" checked={fakeSafe} onChange={(e) => setFakeSafe(e.target.checked)} />
              模拟刘海 / 底部横条留白
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, cursor: 'pointer', fontSize: 12, color: '#4a4658' }}>
              <input type="checkbox" checked={phoneFrame} onChange={(e) => setPhoneFrame(e.target.checked)} />
              桌面端收窄为「手机宽」
            </label>
            {phoneFrame && (
              <div style={{ marginBottom: 12, paddingLeft: 22 }}>
                <div style={{ fontSize: 10, color: '#7a7688', marginBottom: 6 }}>最大宽度 {frameW}px</div>
                <input
                  type="range"
                  min={320}
                  max={430}
                  step={1}
                  value={frameW}
                  onChange={(e) => setFrameW(Number(e.target.value))}
                  style={{ width: '100%' }}
                />
              </div>
            )}
            <p style={{ fontSize: 10, color: '#9a96a4', margin: 0, lineHeight: 1.45 }}>
              选项会记在 sessionStorage，刷新仍保留；正式打包不会出现本面板。
            </p>
          </div>
        )}
      </div>
    </>
  );
}
