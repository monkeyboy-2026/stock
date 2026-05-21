// Shared components — phone shell, sparkline, header, etc.
// Loaded after data.js so window.PORTFOLIO / fmt are available.

const { useState, useMemo } = React;

// ─── Phone shell (no OS chrome — just the canvas; we're prototyping a web/PWA)
// On mobile (≤480px): fills the viewport, no border/shadow — feels like a native app.
// On desktop: shows as a centered 390×812 phone mock with shadow.
function Phone({ children, bg = 'var(--bg)' }) {
  return (
    <div className="gca-phone" style={{
      background: bg,
      display: 'flex', flexDirection: 'column',
      fontFamily: 'var(--font-ui)', color: 'var(--ink)',
      position: 'relative',
    }}>
      {children}
    </div>
  );
}

// ─── Compact SVG sparkline
function Spark({ data, w = 60, h = 22, color, strokeWidth = 1.5 }) {
  const min = Math.min(...data), max = Math.max(...data);
  const range = max - min || 1;
  const step = w / (data.length - 1);
  const d = data.map((v, i) => `${i === 0 ? 'M' : 'L'} ${(i * step).toFixed(1)} ${(h - ((v - min) / range) * h).toFixed(1)}`).join(' ');
  const up = data[data.length - 1] >= data[0];
  const stroke = color || (up ? 'var(--up)' : 'var(--down)');
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: 'block', overflow: 'visible' }}>
      <path d={d} fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Area sparkline (filled)
function SparkArea({ data, w = 100, h = 36, up }) {
  const min = Math.min(...data), max = Math.max(...data);
  const range = max - min || 1;
  const step = w / (data.length - 1);
  const pts = data.map((v, i) => [i * step, h - ((v - min) / range) * h]);
  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');
  const area = `${line} L ${w} ${h} L 0 ${h} Z`;
  const isUp = up ?? (data[data.length - 1] >= data[0]);
  const stroke = isUp ? 'var(--up)' : 'var(--down)';
  const fill = isUp ? 'rgba(22,163,74,0.10)' : 'rgba(220,38,38,0.10)';
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: 'block' }}>
      <path d={area} fill={fill} stroke="none" />
      <path d={line} fill="none" stroke={stroke} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Currency toggle pill (USD / TWD)
function CurrencyToggle({ value, onChange, size = 'sm' }) {
  const pad = size === 'sm' ? '4px' : '5px';
  const fs = size === 'sm' ? 11 : 12;
  return (
    <div style={{
      display: 'inline-flex', background: 'var(--surface-2)',
      borderRadius: 999, padding: pad, gap: 2,
    }}>
      {['USD', 'TWD'].map((c) => (
        <button key={c} onClick={() => onChange(c)} style={{
          border: 0, background: value === c ? 'var(--surface)' : 'transparent',
          color: value === c ? 'var(--ink)' : 'var(--ink-3)',
          padding: '4px 10px', borderRadius: 999, fontSize: fs, fontWeight: 600,
          fontFamily: 'var(--font-ui)', cursor: 'pointer',
          boxShadow: value === c ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
          letterSpacing: '0.02em',
        }}>{c}</button>
      ))}
    </div>
  );
}

// ─── Symbol avatar (initial-based, deterministic colors)
const SYMBOL_HUES = { AAPL: 240, MSFT: 200, NVDA: 130, TSLA: 0, GOOGL: 30, AMZN: 35, META: 220, VOO: 260 };
function SymAvatar({ sym, size = 36 }) {
  const hue = SYMBOL_HUES[sym] ?? (sym.charCodeAt(0) * 7) % 360;
  return (
    <div style={{
      width: size, height: size, borderRadius: size,
      background: `oklch(94% 0.04 ${hue})`,
      color: `oklch(35% 0.10 ${hue})`,
      display: 'grid', placeItems: 'center',
      fontFamily: 'var(--font-ui)', fontWeight: 700,
      fontSize: size * 0.32, letterSpacing: '-0.02em',
      flexShrink: 0,
    }}>{sym.slice(0, sym.length > 3 ? 3 : 2)}</div>
  );
}

// ─── Bottom tab bar (shared chrome)
// Data-driven: pass `tabs` = [{ id, label, glyph, isCta? }]
// ≤5 tabs: distributed evenly. >5 tabs: horizontally scrollable, fixed width
// per tab, active tab auto-centers into view.
function TabBar({ tabs, active, onChange = () => {} }) {
  const scrollerRef = React.useRef(null);
  if (!tabs || !tabs.length) return null;
  const fits = tabs.length <= 5;

  React.useEffect(() => {
    if (fits) return;
    const c = scrollerRef.current;
    if (!c) return;
    const btn = c.querySelector(`[data-tab-id="${active}"]`);
    if (!btn) return;
    const target = btn.offsetLeft + btn.offsetWidth / 2 - c.clientWidth / 2;
    c.scrollTo({ left: Math.max(0, target), behavior: 'smooth' });
  }, [active, tabs, fits]);

  return (
    <div style={{
      borderTop: '1px solid var(--line)', background: 'rgba(255,255,255,0.96)',
      backdropFilter: 'blur(20px)',
      padding: '10px 0 calc(10px + env(safe-area-inset-bottom, 0px))',
      position: 'relative',
    }}>
      <div
        ref={scrollerRef}
        className="tabbar-scroll"
        style={{
          display: 'flex', alignItems: 'flex-start',
          gap: fits ? 0 : 0,
          padding: '0 12px',
          overflowX: fits ? 'visible' : 'auto',
          scrollbarWidth: 'none',
        }}
      >
        {tabs.map((t) => {
          const isCta = t.isCta || t.id === 'Add';
          const isActive = t.id === active;
          return (
            <button key={t.id} data-tab-id={t.id} onClick={() => onChange(t.id)} style={{
              flex: fits ? '1 1 0' : '0 0 72px',
              minWidth: fits ? 0 : 72,
              border: 0, background: 'transparent', cursor: 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
              color: isActive ? 'var(--ink)' : 'var(--ink-4)',
              fontFamily: 'var(--font-ui)', fontSize: 10, fontWeight: 600,
              padding: '0 4px',
            }}>
              <span style={{
                width: isCta ? 32 : 22, height: isCta ? 32 : 22,
                borderRadius: isCta ? 12 : 0,
                background: isCta ? 'var(--ink)' : 'transparent',
                color: isCta ? 'var(--bg)' : 'inherit',
                display: 'grid', placeItems: 'center',
                fontSize: 18, fontWeight: 500,
              }}>{t.glyph}</span>
              <span style={{ maxWidth: '100%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.label}</span>
            </button>
          );
        })}
      </div>
      {/* Edge fades when scrollable */}
      {!fits && (
        <>
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 22, width: 18, pointerEvents: 'none', background: 'linear-gradient(to right, rgba(255,255,255,0.96), transparent)' }} />
          <div style={{ position: 'absolute', right: 0, top: 0, bottom: 22, width: 18, pointerEvents: 'none', background: 'linear-gradient(to left, rgba(255,255,255,0.96), transparent)' }} />
        </>
      )}
    </div>
  );
}

Object.assign(window, { Phone, Spark, SparkArea, CurrencyToggle, SymAvatar, TabBar });
