// 美股記帳 — main app (Variant B + multi-screen + tweaks + tag-driven view tabs)
// Loaded after data.js, shared.jsx, screens.jsx and tweaks-panel.jsx.

const { useState, useMemo, useEffect, useCallback } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "summaryStyle": "dark",
  "density": "cozy",
  "ccy": "USD",
  "colorRule": "us"
}/*EDITMODE-END*/;

const SUMMARY_STYLES = ['dark', 'light', 'accent'];
const DENSITIES = ['compact', 'cozy'];
const COLOR_RULES = ['us', 'tw', 'neutral'];

function applyColorRule(rule) {
  const root = document.documentElement;
  if (rule === 'tw') {
    root.style.setProperty('--up', '#dc2626');
    root.style.setProperty('--up-soft', '#fef2f2');
    root.style.setProperty('--up-ink', '#b91c1c');
    root.style.setProperty('--down', '#16a34a');
    root.style.setProperty('--down-soft', '#ecfdf5');
    root.style.setProperty('--down-ink', '#047857');
  } else if (rule === 'neutral') {
    root.style.setProperty('--up', '#2563eb');
    root.style.setProperty('--up-soft', '#eff6ff');
    root.style.setProperty('--up-ink', '#1d4ed8');
    root.style.setProperty('--down', '#ea580c');
    root.style.setProperty('--down-soft', '#fff7ed');
    root.style.setProperty('--down-ink', '#c2410c');
  } else {
    root.style.setProperty('--up', '#16a34a');
    root.style.setProperty('--up-soft', '#ecfdf5');
    root.style.setProperty('--up-ink', '#047857');
    root.style.setProperty('--down', '#dc2626');
    root.style.setProperty('--down-soft', '#fef2f2');
    root.style.setProperty('--down-ink', '#b91c1c');
  }
}

// ──────────────────────────────────────────────
// Summary card (top of Portfolio screen)
// ──────────────────────────────────────────────
function Summary({ style, fmtMoney, s, p, onAddCash }) {
  const isDark = style === 'dark';
  const isAccent = style === 'accent';
  const bg = isDark ? 'var(--ink)' : isAccent ? 'var(--accent)' : 'var(--surface)';
  const fg = isDark || isAccent ? '#fff' : 'var(--ink)';
  const muted = isDark || isAccent ? 'rgba(255,255,255,0.62)' : 'var(--ink-3)';
  const upClr = isDark || isAccent ? '#86efac' : 'var(--up)';
  const downClr = isDark || isAccent ? '#fca5a5' : 'var(--down)';
  const upTone = (n) => n >= 0 ? upClr : downClr;
  const divider = isDark || isAccent ? 'rgba(255,255,255,0.12)' : 'var(--line)';
  const dashed = isDark || isAccent ? 'rgba(255,255,255,0.18)' : 'var(--line-2)';

  const Row = ({ label, value, tone }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
      <span style={{ fontSize: 11, color: muted, fontWeight: 500 }}>{label}</span>
      <span className="mono" style={{
        fontSize: 13, fontWeight: 600,
        color: tone === 'pnl' ? upTone(value.raw ?? 0) : fg,
      }}>{value.text ?? value}</span>
    </div>
  );

  const CashRow = ({ value }) => (
    <button
      onClick={() => onAddCash && onAddCash('DEPOSIT')}
      style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
        border: 0, background: 'transparent', padding: 0,
        cursor: onAddCash ? 'pointer' : 'default',
        width: '100%', textAlign: 'left',
        fontFamily: 'var(--font-ui)',
      }}
    >
      <span style={{ fontSize: 11, color: muted, fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
        美金庫存
        {onAddCash && (
          <span style={{
            fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 4,
            background: isDark || isAccent ? 'rgba(255,255,255,0.14)' : 'var(--surface-2)',
            color: isDark || isAccent ? 'rgba(255,255,255,0.85)' : 'var(--ink-3)',
            marginLeft: 4,
          }}>+ 調整</span>
        )}
      </span>
      <span className="mono" style={{ fontSize: 13, fontWeight: 600, color: fg }}>
        {value}
      </span>
    </button>
  );

  return (
    <div style={{
      margin: '0 14px', padding: '14px 16px',
      background: bg, color: fg,
      borderRadius: 'var(--r-lg)',
      border: style === 'light' ? '1px solid var(--line)' : 'none',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ fontSize: 10, opacity: isDark || isAccent ? 0.6 : 1, color: isDark || isAccent ? '#fff' : 'var(--ink-3)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>預估現值</div>
        <div className="mono" style={{ fontSize: 11, fontWeight: 600, color: upTone(s.todayChg), textAlign: 'right', lineHeight: 1.3, whiteSpace: 'nowrap' }}>
          <span style={{ color: '#fff', fontWeight: 500, marginRight: 6 }}>
            {new Date().toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '/')}
          </span>
          {s.todayChg >= 0 ? '▲' : '▼'} {fmtMoney(Math.abs(s.todayChg))} · {window.fmt.pct(s.todayPct)}
        </div>
      </div>
      <div className="mono" style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.03em', marginTop: 4, lineHeight: 1.1 }}>
        {fmtMoney(s.value)}
      </div>
      <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${divider}`, display: 'grid', gap: 6 }}>
        <Row label="原始成本" value={{ text: fmtMoney(s.cost) }} />
        <CashRow value={fmtMoney(p.usdCash)} />
        <Row label="未實現損益" tone="pnl" value={{
          raw: s.unrealized,
          text: (s.unrealized > 0 ? '+' : s.unrealized < 0 ? '−' : '')
            + fmtMoney(Math.abs(s.unrealized))
            + ' · ' + window.fmt.pct(s.unrealizedPct),
        }} />
        <Row label="累積已實現" tone="pnl" value={{
          raw: p.realizedPnL,
          text: (p.realizedPnL > 0 ? '+' : p.realizedPnL < 0 ? '−' : '')
            + fmtMoney(Math.abs(p.realizedPnL)),
        }} />
        <div style={{ paddingTop: 6, marginTop: 4, borderTop: `1px dashed ${dashed}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 11, color: isDark || isAccent ? 'rgba(255,255,255,0.85)' : 'var(--ink)', fontWeight: 600 }}>累積淨盈餘</span>
            <span className="mono" style={{
              fontSize: 13, fontWeight: 700,
              color: upTone(s.netCumulative),
            }}>{(s.netCumulative > 0 ? '+' : s.netCumulative < 0 ? '−' : '')
                + fmtMoney(Math.abs(s.netCumulative))}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// Tag-driven view tabs — persistence + defaults
//   tab = { id, label, kind: 'all' | 'tag' }
//   For kind='tag', the label IS the tag name to filter by.
// ──────────────────────────────────────────────
const VIEW_TABS_LS = 'gca.viewTabs.v2';
const TAGS_LS = 'gca.tags.v1';   // per-symbol tag overrides
const NOTES_LS = 'gca.notes.v1'; // per-symbol note overrides
const PORTFOLIO_LS = 'gca.portfolio.v1';  // user transactions + cash/realized deltas

// Replay user transactions on top of seed positions to produce live state.
// Returns { positions, usdCash, realizedPnL, totalDeposited }.
function replayTransactions(seedPositions, seedCash, seedRealized, seedDeposited, userTxs) {
  // Clone positions by symbol for mutation
  const map = new Map();
  for (const p of seedPositions) {
    map.set(p.sym, { ...p, tags: p.tags ? [...p.tags] : [] });
  }
  let cash = seedCash;
  let realized = seedRealized;
  let totalDeposited = seedDeposited;

  // Apply txs in chronological order (oldest first)
  const sorted = [...userTxs].sort((a, b) => (a.date || '').localeCompare(b.date || '') || (a.id || '').localeCompare(b.id || ''));
  for (const tx of sorted) {
    if (tx.side === 'DEPOSIT' || tx.side === 'WITHDRAW') {
      const amt = Number(tx.amount) || 0;
      if (tx.side === 'DEPOSIT') {
        cash += amt;
        totalDeposited += amt;
      } else {
        cash -= amt;
        totalDeposited -= amt;
      }
      continue;
    }

    const sharesNum = Number(tx.shares) || 0;
    const priceNum  = Number(tx.price)  || 0;
    const feeNum    = Number(tx.fee)    || 0;
    const total     = sharesNum * priceNum;

    if (tx.side === 'BUY') {
      const cur = map.get(tx.sym);
      if (cur) {
        const totalShares = cur.shares + sharesNum;
        const newAvg = totalShares > 0
          ? (cur.shares * cur.avg + sharesNum * priceNum) / totalShares
          : priceNum;
        cur.shares = totalShares;
        cur.avg = newAvg;
      } else {
        map.set(tx.sym, {
          sym: tx.sym,
          name: tx.sym,
          sector: '其他',
          tags: [],
          shares: sharesNum,
          avg: priceNum,
          price: priceNum,
          day: 0,
          spark: [priceNum, priceNum, priceNum, priceNum, priceNum],
          note: tx.note || '',
        });
      }
      cash -= (total + feeNum);
    } else if (tx.side === 'SELL') {
      const cur = map.get(tx.sym);
      if (cur && cur.shares > 0) {
        const sold = Math.min(sharesNum, cur.shares);
        realized += (priceNum - cur.avg) * sold - feeNum;
        cur.shares -= sold;
      }
      cash += (total - feeNum);
    }
  }

  return {
    positions: Array.from(map.values()),
    usdCash: cash,
    realizedPnL: realized,
    totalDeposited,
  };
}

const loadUserTxs = () => {
  try {
    const raw = localStorage.getItem(PORTFOLIO_LS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed?.userTxs)) return parsed.userTxs;
    }
  } catch {}
  return [];
};

const buildDefaultViewTabs = (positions) => {
  const tags = [];
  const seen = new Set();
  for (const p of positions) {
    for (const tg of (p.tags || [])) {
      if (!seen.has(tg)) { seen.add(tg); tags.push(tg); }
    }
  }
  return [
    { id: 'v-all', label: '全部', kind: 'all' },
    ...tags.map((tg, i) => ({ id: 'v-tag-' + i, label: tg, kind: 'tag' })),
  ];
};

const loadViewTabs = (positions) => {
  try {
    const raw = localStorage.getItem(VIEW_TABS_LS);
    if (raw) {
      const parsed = JSON.parse(raw);
      // sanity: make sure there's at least one "all" tab
      if (Array.isArray(parsed) && parsed.find((t) => t.kind === 'all')) return parsed;
    }
  } catch {}
  return buildDefaultViewTabs(positions);
};

const loadTagOverrides = () => {
  try {
    const raw = localStorage.getItem(TAGS_LS);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {};
};

const loadNoteOverrides = () => {
  try {
    const raw = localStorage.getItem(NOTES_LS);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {};
};

// Build live positions array with tag + note overrides applied
const buildLivePositions = (sourcePositions, tagOverrides, noteOverrides = {}) => {
  return sourcePositions.map((p) => ({
    ...p,
    tags: tagOverrides[p.sym] != null ? tagOverrides[p.sym] : (p.tags || []),
    note: noteOverrides[p.sym] != null ? noteOverrides[p.sym] : (p.note || ''),
  }));
};

// ──────────────────────────────────────────────
// Portfolio screen body — receives state from Tracker
// ──────────────────────────────────────────────
function PortfolioScreen({
  t, ccy, setCcy, setTweak,
  positions, usdCash, realizedPnL, totalDeposited,
  viewTabs, setViewTabs, activeView, setActiveView,
  onOpenStock, onAddCash,
  priceStatus, priceUpdated, priceMsg, onRefreshPrices,
}) {
  const [editingTabs, setEditingTabs] = useState(false);
  const [sortMode, setSortMode] = useState(() => {
    try { return localStorage.getItem('gca.sortMode') || 'value'; } catch { return 'value'; }
  });
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  useEffect(() => { try { localStorage.setItem('gca.sortMode', sortMode); } catch {} }, [sortMode]);

  const activeTab = viewTabs.find((v) => v.id === activeView) || viewTabs[0];

  const p = window.PORTFOLIO;
  const conv = (n) => ccy === 'TWD' ? n * p.fxUsdTwd : n;
  const fmtMoney = (n) => ccy === 'TWD' ? window.fmt.twd(conv(n)) : window.fmt.usd(n);
  const fmtCompact = (n) => {
    const v = ccy === 'TWD' ? conv(n) : n;
    const prefix = (ccy === 'TWD' ? 'NT$' : '$');
    if (Math.abs(v) >= 10000) return prefix + (v / 1000).toFixed(1) + 'k';
    if (Math.abs(v) >= 1000)  return prefix + v.toLocaleString('en-US', { maximumFractionDigits: 0 });
    return fmtMoney(n);
  };

  // Summary uses ALL positions (the portfolio total is global, not per tab)
  // Hide rows with 0 shares (fully sold out) — transaction history still kept.
  const allPositions = positions.filter((p) => p.shares > 0);
  const summarySource = { ...p, positions: allPositions, usdCash, realizedPnL, totalDeposited };
  const s = window.computeSummary(summarySource);

  // Filtered list by active tab
  const filtered = useMemo(() => {
    if (!activeTab || activeTab.kind === 'all') return allPositions;
    return allPositions.filter((pos) => (pos.tags || []).includes(activeTab.label));
  }, [allPositions, activeTab]);

  const sorted = useMemo(() => {
    const rows = [...filtered];
    const pnl = (p) => p.shares * (p.price - p.avg);
    if (sortMode === 'sym-asc')  rows.sort((a, b) => a.sym.localeCompare(b.sym));
    else if (sortMode === 'sym-desc') rows.sort((a, b) => b.sym.localeCompare(a.sym));
    else if (sortMode === 'pnl-desc') rows.sort((a, b) => pnl(b) - pnl(a));
    else if (sortMode === 'pnl-asc')  rows.sort((a, b) => pnl(a) - pnl(b));
    else rows.sort((a, b) => b.shares * b.price - a.shares * a.price);   // value (default)
    return rows;
  }, [filtered, sortMode]);

  const rowPad = t.density === 'compact' ? '8px 18px' : '12px 18px';
  // 4 even columns: 代號 / 市值 / 成本 / 損益
  const cols = 'repeat(4, minmax(0, 1fr))';

  // ── View tab editors ──
  const renameTab = (id, label) => {
    const tab = viewTabs.find((v) => v.id === id);
    if (!tab || tab.kind === 'all') return;  // 全部 not renameable
    const oldLabel = tab.label;
    const trimmed = label.slice(0, 12);
    setViewTabs(viewTabs.map((v) => v.id === id ? { ...v, label: trimmed } : v));
    // Cascade rename into all positions' tags
    if (oldLabel !== trimmed) {
      window.dispatchEvent(new CustomEvent('gca:renameTag', { detail: { oldLabel, newLabel: trimmed } }));
    }
  };
  const deleteTab = (id) => {
    const tab = viewTabs.find((v) => v.id === id);
    if (!tab || tab.kind === 'all') return;  // 全部 not deletable
    if (viewTabs.length <= 1) return;
    setViewTabs(viewTabs.filter((v) => v.id !== id));
    // Cascade: remove this tag from all positions
    window.dispatchEvent(new CustomEvent('gca:deleteTag', { detail: { label: tab.label } }));
  };
  const addTab = () => {
    if (viewTabs.length >= 12) return;
    const id = 'v-' + Date.now().toString(36);
    const next = [...viewTabs, { id, label: '新分類', kind: 'tag' }];
    setViewTabs(next);
    setActiveView(id);
  };

  // Compute counts per tab (active count badge)
  const tabsWithCount = useMemo(() => viewTabs.map((v) => ({
    ...v,
    count: v.kind === 'all' ? allPositions.length : allPositions.filter((p) => (p.tags || []).includes(v.label)).length,
  })), [viewTabs, allPositions]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ padding: '2px 18px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-0.02em' }}>持倉一覽</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <PriceRefreshBtn status={priceStatus} updated={priceUpdated} msg={priceMsg} onClick={onRefreshPrices} />
          <CurrencyToggle value={ccy} onChange={(c) => { setCcy(c); setTweak('ccy', c); }} />
          <button
            onClick={() => window.postMessage({ type: '__activate_edit_mode' }, '*')}
            title="設定"
            style={{
              width: 28, height: 28, border: 0, borderRadius: 999,
              background: 'var(--surface-2)', color: 'var(--ink-2)',
              cursor: 'pointer', display: 'grid', placeItems: 'center',
              fontSize: 14, lineHeight: 1, padding: 0,
            }}
          >⚙</button>
        </div>
      </div>

      <Summary style={t.summaryStyle} fmtMoney={fmtMoney} s={s} p={summarySource} onAddCash={onAddCash} />

      {/* View tabs row */}
      <ViewTabsRow
        tabs={tabsWithCount}
        active={activeView}
        editing={editingTabs}
        onActivate={setActiveView}
        onToggleEdit={() => setEditingTabs(!editingTabs)}
        onRename={renameTab}
        onDelete={deleteTab}
        onAdd={addTab}
      />

      {/* Table header */}
      <div style={{
        padding: '8px 18px', display: 'grid',
        gridTemplateColumns: cols, gap: 6,
        fontSize: 10, color: 'var(--ink-4)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase',
        borderBottom: '1px solid var(--line)',
      }}>
        <span>代號</span>
        <span style={{ textAlign: 'right' }}>市值</span>
        <span style={{ textAlign: 'right' }}>成本</span>
        <span style={{ textAlign: 'right' }}>損益</span>
      </div>

      {/* Rows — wrapped in relative container so the FAB can hover over it */}
      <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
        {/* Top edge fade — visually separates from fixed summary area above */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 16,
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.10), rgba(0,0,0,0.03) 60%, transparent)',
          pointerEvents: 'none', zIndex: 2,
        }} />
        <div className="scroll" style={{ height: '100%', overflowY: 'auto' }}>
          {sorted.length === 0 && (
            <div style={{
              padding: '28px 24px', textAlign: 'center', color: 'var(--ink-3)',
              fontSize: 12,
            }}>
              <div style={{ fontSize: 22, marginBottom: 6, color: 'var(--ink-4)' }}>◌</div>
              「{activeTab?.label}」標籤底下還沒有個股<br />
              <span style={{ fontSize: 11, color: 'var(--ink-4)' }}>點任一個股 → 加上「{activeTab?.label}」標籤</span>
            </div>
          )}
          {sorted.map((pos) => {
            const val = pos.shares * pos.price;
            const cost = pos.shares * pos.avg;
            const pnl = val - cost;
            const pnlPct = pnl / cost;
            return (
              <button
                key={pos.sym}
                onClick={() => onOpenStock(pos.sym)}
                style={{
                  width: '100%', textAlign: 'left',
                  padding: rowPad, display: 'grid',
                  gridTemplateColumns: cols, gap: 6, alignItems: 'center',
                  borderBottom: '1px solid var(--line)',
                  background: 'transparent', border: 0,
                  borderBottomWidth: 1, borderBottomStyle: 'solid', borderBottomColor: 'var(--line)',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-ui)', color: 'var(--ink)',
                }}
              >
                {/* 代號 */}
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, letterSpacing: '-0.01em' }}>{pos.sym}</div>
                  <div className="mono" style={{ fontSize: 10, color: pos.day >= 0 ? 'var(--up)' : 'var(--down)', fontWeight: 600, marginTop: 1 }}>
                    {window.fmt.pct(pos.day)}
                  </div>
                </div>
                {/* 市值 */}
                <div style={{ textAlign: 'right' }}>
                  <div className="mono" style={{ fontSize: 13, fontWeight: 600, letterSpacing: '-0.01em' }}>{fmtCompact(val)}</div>
                  <div className="mono" style={{ fontSize: 10, color: 'var(--ink-4)', marginTop: 1 }}>
                    {pos.shares}股
                  </div>
                </div>
                {/* 成本 */}
                <div style={{ textAlign: 'right' }}>
                  <div className="mono" style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink-2)' }}>{fmtCompact(cost)}</div>
                  <div className="mono" style={{ fontSize: 10, color: 'var(--ink-4)', marginTop: 1 }}>
                    ${window.fmt.num(pos.avg)}
                  </div>
                </div>
                {/* 損益 */}
                <div style={{ textAlign: 'right' }}>
                  <div className="mono" style={{
                    fontSize: 13, fontWeight: 600, letterSpacing: '-0.01em',
                    color: pnl >= 0 ? 'var(--up)' : 'var(--down)',
                  }}>
                    {pnl >= 0 ? '+' : '−'}{fmtCompact(Math.abs(pnl))}
                  </div>
                  <div className="mono" style={{ fontSize: 10, fontWeight: 600, color: pnl >= 0 ? 'var(--up)' : 'var(--down)', marginTop: 1 }}>
                    {window.fmt.pct(pnlPct)}
                  </div>
                </div>
              </button>
            );
          })}
          <div style={{ height: 56 }} />{/* spacer so last row isn't covered by FAB */}
        </div>

        {/* Bottom edge fade — visually separates from fixed tab bar below */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 18,
          background: 'linear-gradient(to top, rgba(0,0,0,0.10), rgba(0,0,0,0.03) 60%, transparent)',
          pointerEvents: 'none', zIndex: 2,
        }} />

        {/* Floating sort FAB */}
        <SortFab mode={sortMode} setMode={setSortMode} open={sortMenuOpen} setOpen={setSortMenuOpen} />
      </div>
    </div>
  );
}

// ─── Floating sort control (bottom-right of holdings list)
function SortFab({ mode, setMode, open, setOpen }) {
  const options = [
    { id: 'value',    label: '依市值',         hint: '由高到低' },
    { id: 'pnl-desc', label: '依損益（高到低）', hint: '賺最多在前' },
    { id: 'pnl-asc',  label: '依損益（低到高）', hint: '虧最多在前' },
    { id: 'sym-asc',  label: '依代號 A → Z' },
    { id: 'sym-desc', label: '依代號 Z → A' },
  ];
  const current = options.find((o) => o.id === mode) || options[0];

  return (
    <div style={{
      position: 'absolute', right: 14, bottom: 14, zIndex: 10,
    }}>
      {/* Popover menu */}
      {open && (
        <>
          <div
            onClick={() => setOpen(false)}
            style={{
              position: 'fixed', inset: 0, zIndex: 0,
            }}
          />
          <div style={{
            position: 'absolute', right: 0, bottom: 50, zIndex: 1,
            background: 'var(--surface)',
            border: '1px solid var(--line)',
            borderRadius: 14,
            boxShadow: '0 10px 30px -8px rgba(0,0,0,0.18), 0 4px 10px rgba(0,0,0,0.06)',
            padding: 6, minWidth: 180,
          }}>
            <div style={{ padding: '6px 10px 4px', fontSize: 10, color: 'var(--ink-4)', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>排列方式</div>
            {options.map((opt) => {
              const active = opt.id === mode;
              return (
                <button key={opt.id} onClick={() => { setMode(opt.id); setOpen(false); }} style={{
                  width: '100%', textAlign: 'left',
                  border: 0, background: active ? 'var(--surface-2)' : 'transparent',
                  borderRadius: 10, padding: '8px 10px', cursor: 'pointer',
                  fontFamily: 'var(--font-ui)', fontSize: 12, fontWeight: 600,
                  color: 'var(--ink)',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8,
                }}>
                  <span>
                    {opt.label}
                    {opt.hint && (
                      <span style={{ marginLeft: 6, fontSize: 10, color: 'var(--ink-4)', fontWeight: 500 }}>{opt.hint}</span>
                    )}
                  </span>
                  {active && <span style={{ color: 'var(--ink)', fontSize: 13 }}>✓</span>}
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* FAB button */}
      <button
        onClick={() => setOpen(!open)}
        title={current.label}
        style={{
          height: 38, padding: '0 14px',
          border: 0, borderRadius: 999,
          background: 'var(--ink)', color: 'var(--bg)',
          boxShadow: '0 6px 16px -4px rgba(0,0,0,0.25), 0 2px 4px rgba(0,0,0,0.08)',
          cursor: 'pointer',
          fontFamily: 'var(--font-ui)', fontSize: 12, fontWeight: 600,
          display: 'inline-flex', alignItems: 'center', gap: 6,
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 6h16M7 12h10M10 18h4" />
        </svg>
        {current.label}
      </button>
    </div>
  );
}

// ──────────────────────────────────────────────
// Finnhub API key control (in Tweaks panel)
// ──────────────────────────────────────────────
function FinnhubKeyControl() {
  const [key, setKey] = useState(() => window.PriceAPI?.getKey() || '');
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState(null);  // {ok, error?}
  const masked = key && key.length > 8 ? key.slice(0, 4) + '…' + key.slice(-4) : key;
  const [showFull, setShowFull] = useState(false);

  const save = () => {
    window.PriceAPI?.setKey(key.trim());
    setResult({ ok: true, saved: true });
  };
  const test = async () => {
    setTesting(true);
    setResult(null);
    const r = await window.PriceAPI?.testKey(key.trim());
    setTesting(false);
    setResult(r);
  };
  const clear = () => {
    setKey('');
    window.PriceAPI?.setKey('');
    setResult(null);
  };

  return (
    <div style={{ padding: '4px 0' }}>
      <input
        type={showFull ? 'text' : 'password'}
        value={key}
        onChange={(e) => { setKey(e.target.value); setResult(null); }}
        placeholder="貼上 Finnhub API key"
        style={{
          width: '100%', height: 32, border: '1px solid rgba(0,0,0,0.12)',
          borderRadius: 8, padding: '0 8px', outline: 'none',
          fontFamily: 'var(--font-mono)', fontSize: 11,
          background: 'rgba(255,255,255,0.6)', color: '#111',
          boxSizing: 'border-box',
        }}
      />
      <div style={{ marginTop: 6, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        <button onClick={save} disabled={!key.trim()} style={btnStyle(!!key.trim())}>儲存</button>
        <button onClick={test} disabled={!key.trim() || testing} style={btnStyle(!!key.trim() && !testing)}>
          {testing ? '測試中…' : '測試連線'}
        </button>
        <button onClick={() => setShowFull(!showFull)} style={btnStyle(true, true)}>
          {showFull ? '隱藏' : '顯示'}
        </button>
        {key && <button onClick={clear} style={btnStyle(true, true)}>清除</button>}
      </div>
      {result && (
        <div style={{
          marginTop: 6, fontSize: 10, fontWeight: 600,
          color: result.ok ? '#0a7c3e' : '#b91c1c',
        }}>
          {result.saved ? '✓ 已儲存' : (result.ok ? '✓ 連線正常' : '✗ ' + (result.error || '失敗'))}
        </div>
      )}
      <div style={{ marginTop: 6, fontSize: 10, color: 'rgba(0,0,0,0.55)', lineHeight: 1.4 }}>
        到 <span style={{ textDecoration: 'underline' }}>finnhub.io</span> 免費註冊取得 key（60 次/分鐘）。
        Key 只存在這支手機，不會上傳。
      </div>
    </div>
  );
}

function btnStyle(enabled, secondary = false) {
  return {
    border: 0, padding: '5px 10px', borderRadius: 6,
    background: !enabled ? 'rgba(0,0,0,0.06)' : (secondary ? 'rgba(0,0,0,0.06)' : '#111'),
    color: !enabled ? 'rgba(0,0,0,0.35)' : (secondary ? '#111' : '#fff'),
    cursor: enabled ? 'pointer' : 'not-allowed',
    fontFamily: 'var(--font-ui)', fontSize: 10, fontWeight: 700,
  };
}

// ──────────────────────────────────────────────
// Price refresh button (header)
// ──────────────────────────────────────────────
function PriceRefreshBtn({ status, updated, msg, onClick }) {
  const [showMsg, setShowMsg] = useState(false);
  const fmtAge = () => {
    if (!updated) return '尚未更新';
    const age = Math.floor((Date.now() - updated) / 1000);
    if (age < 60) return age + '秒前';
    const m = Math.floor(age / 60);
    if (m < 60) return m + '分前';
    const h = Math.floor(m / 60);
    return h + '時前';
  };
  const label = status === 'loading' ? '更新中…' : fmtAge();
  const isErr = status === 'error';
  const today = new Date().toLocaleDateString('zh-TW', { month: '2-digit', day: '2-digit' }).replace(/\//g, '/');

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => { onClick && onClick(); }}
        title={msg || '更新即時股價'}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          padding: '4px 8px', border: 0, borderRadius: 999,
          background: isErr ? 'var(--down-soft)' : 'var(--surface-2)',
          color: isErr ? 'var(--down-ink)' : 'var(--ink-2)',
          cursor: status === 'loading' ? 'wait' : 'pointer',
          fontFamily: 'var(--font-ui)', fontSize: 10, fontWeight: 600,
          whiteSpace: 'nowrap',
        }}
      >
        <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          style={{
            animation: status === 'loading' ? 'gca-spin 0.9s linear infinite' : 'none',
            transformOrigin: 'center',
          }}>
          <path d="M14 8a6 6 0 1 1-2-4.5" />
          <path d="M14 3v4h-4" />
        </svg>
        <span className="mono">{label}</span>
      </button>
      {isErr && msg && (
        <div
          onClick={() => setShowMsg(!showMsg)}
          style={{
            position: 'absolute', top: '110%', right: 0, zIndex: 5,
            background: 'var(--down-soft)', color: 'var(--down-ink)',
            border: '1px solid var(--down)', borderRadius: 8,
            padding: '6px 10px', fontSize: 10, fontWeight: 600,
            maxWidth: 220, whiteSpace: 'normal', cursor: 'pointer',
            display: showMsg ? 'block' : 'none',
          }}
        >{msg}</div>
      )}
    </div>
  );
}
function ViewTabsRow({ tabs, active, editing, onActivate, onToggleEdit, onRename, onDelete, onAdd }) {
  const scrollerRef = React.useRef(null);
  const [edges, setEdges] = useState({ left: false, right: false });

  const updateEdges = useCallback(() => {
    const c = scrollerRef.current;
    if (!c) return setEdges({ left: false, right: false });
    setEdges({
      left:  c.scrollLeft > 2,
      right: c.scrollLeft + c.clientWidth < c.scrollWidth - 2,
    });
  }, []);

  useEffect(() => {
    updateEdges();
    const c = scrollerRef.current;
    if (!c) return;
    c.addEventListener('scroll', updateEdges, { passive: true });
    const ro = new ResizeObserver(updateEdges);
    ro.observe(c);
    return () => { c.removeEventListener('scroll', updateEdges); ro.disconnect(); };
  }, [updateEdges, tabs, editing]);

  useEffect(() => {
    if (editing) return;
    const c = scrollerRef.current;
    if (!c) return;
    const btn = c.querySelector(`[data-view-id="${active}"]`);
    if (!btn) return;
    const target = btn.offsetLeft + btn.offsetWidth / 2 - c.clientWidth / 2;
    c.scrollTo({ left: Math.max(0, target), behavior: 'smooth' });
  }, [active, editing, tabs]);

  useEffect(() => {
    if (!editing) return;
    const c = scrollerRef.current;
    if (!c) return;
    requestAnimationFrame(() => c.scrollTo({ left: c.scrollWidth, behavior: 'smooth' }));
  }, [editing]);

  return (
    <div style={{
      marginTop: 7, padding: '0 14px',
      display: 'flex', alignItems: 'center', gap: 8,
    }}>
      <div style={{ flex: 1, minWidth: 0, position: 'relative' }}>
        <div
          ref={scrollerRef}
          className="tabbar-scroll"
          style={{
            display: 'flex', gap: 6, alignItems: 'center',
            overflowX: 'auto', scrollbarWidth: 'none',
            padding: '2px 0',
          }}
        >
          {tabs.map((v) => {
            const isActive = v.id === active;
            const isAll = v.kind === 'all';
            if (editing) {
              if (isAll) {
                // 全部 stays as a non-editable static pill in edit mode
                return (
                  <div key={v.id} data-view-id={v.id} style={{
                    flex: '0 0 auto', display: 'inline-flex', alignItems: 'center', gap: 4,
                    background: 'var(--surface-2)', borderRadius: 999, padding: '6px 10px',
                    border: '1px solid var(--line)',
                    fontFamily: 'var(--font-ui)', fontSize: 11, fontWeight: 600,
                    color: 'var(--ink-3)',
                  }}>
                    <span style={{ fontSize: 9 }}>🔒</span>
                    {v.label}
                  </div>
                );
              }
              return (
                <div key={v.id} data-view-id={v.id} style={{
                  flex: '0 0 auto', display: 'inline-flex', alignItems: 'center', gap: 4,
                  background: 'var(--surface-2)', borderRadius: 999, padding: '3px 4px 3px 8px',
                  border: '1px solid var(--line)',
                }}>
                  <input
                    value={v.label}
                    onChange={(e) => onRename(v.id, e.target.value)}
                    style={{
                      width: Math.max(40, (v.label.length + 1) * 11),
                      border: 0, background: 'transparent', outline: 'none',
                      fontFamily: 'var(--font-ui)', fontSize: 11, fontWeight: 600, color: 'var(--ink)',
                      padding: '3px 2px',
                    }}
                  />
                  <button onClick={() => onDelete(v.id)} style={{
                    width: 20, height: 20, border: 0, borderRadius: 999,
                    background: 'var(--down-soft)',
                    color: 'var(--down)', cursor: 'pointer',
                    fontSize: 13, fontWeight: 600, padding: 0,
                    display: 'grid', placeItems: 'center',
                  }}>×</button>
                </div>
              );
            }
            return (
              <button key={v.id} data-view-id={v.id} onClick={() => onActivate(v.id)} style={{
                flex: '0 0 auto', border: 0, padding: '6px 12px', borderRadius: 999,
                background: isActive ? 'var(--ink)' : 'var(--surface-2)',
                color: isActive ? 'var(--bg)' : 'var(--ink-2)',
                fontFamily: 'var(--font-ui)', fontSize: 11, fontWeight: 600, cursor: 'pointer',
                whiteSpace: 'nowrap',
                display: 'inline-flex', alignItems: 'center', gap: 6,
              }}>
                {v.label}
                {typeof v.count === 'number' && (
                  <span className="mono" style={{
                    fontSize: 9, fontWeight: 600, opacity: 0.6,
                  }}>{v.count}</span>
                )}
              </button>
            );
          })}

          {editing && (
            <button onClick={onAdd} disabled={tabs.length >= 12} style={{
              flex: '0 0 auto', border: '1px dashed var(--line-2)',
              background: 'transparent', padding: '6px 12px', borderRadius: 999,
              color: 'var(--ink-3)', cursor: tabs.length >= 12 ? 'not-allowed' : 'pointer',
              opacity: tabs.length >= 12 ? 0.4 : 1,
              fontFamily: 'var(--font-ui)', fontSize: 11, fontWeight: 600,
              whiteSpace: 'nowrap',
            }}>+ 新增</button>
          )}
        </div>

        {edges.left && (
          <div style={{
            position: 'absolute', left: 0, top: 0, bottom: 0, width: 22,
            pointerEvents: 'none',
            background: 'linear-gradient(to right, var(--bg) 30%, transparent)',
          }} />
        )}
        {edges.right && (
          <div style={{
            position: 'absolute', right: 0, top: 0, bottom: 0, width: 22,
            pointerEvents: 'none',
            background: 'linear-gradient(to left, var(--bg) 30%, transparent)',
          }} />
        )}
      </div>

      <button onClick={onToggleEdit} style={{
        flex: '0 0 auto', width: 30, height: 28, border: 0, borderRadius: 8,
        background: editing ? 'var(--ink)' : 'var(--surface-2)',
        color: editing ? 'var(--bg)' : 'var(--ink-2)',
        cursor: 'pointer', display: 'grid', placeItems: 'center',
        fontSize: editing ? 14 : 13, fontWeight: 700, lineHeight: 1,
      }}>{editing ? '×' : '☰'}</button>
    </div>
  );
}

// ──────────────────────────────────────────────
// Top-level app
// ──────────────────────────────────────────────
const InventoryIcon = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 3 V12 L20 8" />
  </svg>
);

const NAV_TABS = [
  { id: 'Portfolio', label: '庫存',     glyph: InventoryIcon },
  { id: 'Add',       label: '增減個股', glyph: '+', isCta: true },
  { id: 'Trades',    label: '交易紀錄', glyph: '⇅' },
];

function Tracker() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [ccy, setCcy] = useState(t.ccy);
  const [screen, setScreen] = useState('Portfolio');
  const [editing, setEditing] = useState(null);
  const [presetMode, setPresetMode] = useState(null);
  const [activeSym, setActiveSym] = useState(null);

  // ── Live prices (Finnhub) ──
  const [livePrices, setLivePrices] = useState(() => window.PriceAPI?.getCachedPrices() || {});
  const [priceStatus, setPriceStatus] = useState('idle'); // idle | loading | error
  const [priceUpdated, setPriceUpdated] = useState(() => window.PriceAPI?.getLastUpdate() || 0);
  const [priceMsg, setPriceMsg] = useState('');

  const refreshPrices = useCallback(async () => {
    const api = window.PriceAPI;
    if (!api) return;
    const key = api.getKey();
    if (!key) { setPriceMsg('尚未設定 API key（Tweaks → 即時股價）'); return; }
    setPriceStatus('loading');
    setPriceMsg('');
    try {
      const syms = window.PORTFOLIO.positions.filter((p) => p.shares > 0).map((p) => p.sym);
      const out = await api.refresh(syms);
      setLivePrices({ ...out });
      setPriceUpdated(api.getLastUpdate());
      setPriceStatus('idle');
    } catch (e) {
      setPriceStatus('error');
      setPriceMsg(e.message || '更新失敗');
    }
  }, []);

  // Auto-fetch on mount if cache is stale (>60s)
  useEffect(() => {
    const api = window.PriceAPI;
    if (!api || !api.getKey()) return;
    if (Date.now() - api.getLastUpdate() > 60_000) {
      refreshPrices();
    }
  }, [refreshPrices]);
  const [userTxs, setUserTxs] = useState(loadUserTxs);
  useEffect(() => {
    try { localStorage.setItem(PORTFOLIO_LS, JSON.stringify({ userTxs })); } catch {}
  }, [userTxs]);

  // Replay txs → live state
  const live = useMemo(() => replayTransactions(
    window.PORTFOLIO.positions,
    window.PORTFOLIO.usdCash,
    window.PORTFOLIO.realizedPnL,
    window.PORTFOLIO.totalDeposited != null ? window.PORTFOLIO.totalDeposited : 0,
    userTxs,
  ), [userTxs]);

  // Combined transaction list shown in Trades screen (seed + user, newest first)
  const allTxs = useMemo(() => {
    const seeds = window.PORTFOLIO.transactions || [];
    return [...userTxs, ...seeds].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  }, [userTxs]);

  // Lift positions & viewTabs to top-level state for cross-screen mutation
  const [tagOverrides, setTagOverrides] = useState(loadTagOverrides);
  const [noteOverrides, setNoteOverrides] = useState(loadNoteOverrides);
  // Overlay live prices onto seed positions
  const positionsWithLivePrices = useMemo(() => {
    return live.positions.map((p) => {
      const lp = livePrices[p.sym];
      if (lp) return { ...p, price: lp.price, day: lp.day };
      return p;
    });
  }, [live.positions, livePrices]);
  const positions = useMemo(
    () => buildLivePositions(positionsWithLivePrices, tagOverrides, noteOverrides),
    [positionsWithLivePrices, tagOverrides, noteOverrides]
  );
  const [viewTabs, setViewTabs] = useState(() => loadViewTabs(buildLivePositions(window.PORTFOLIO.positions, loadTagOverrides())));
  const [activeView, setActiveView] = useState(() => {
    const tabs = loadViewTabs(window.PORTFOLIO.positions);
    return tabs[0]?.id;
  });

  // Persist
  useEffect(() => { try { localStorage.setItem(VIEW_TABS_LS, JSON.stringify(viewTabs)); } catch {} }, [viewTabs]);
  useEffect(() => { try { localStorage.setItem(TAGS_LS, JSON.stringify(tagOverrides)); } catch {} }, [tagOverrides]);
  useEffect(() => { try { localStorage.setItem(NOTES_LS, JSON.stringify(noteOverrides)); } catch {} }, [noteOverrides]);

  // If active view disappears (deleted), fall back to first
  useEffect(() => {
    if (!viewTabs.find((v) => v.id === activeView)) setActiveView(viewTabs[0]?.id);
  }, [viewTabs, activeView]);

  // Tweaks
  useEffect(() => { setCcy(t.ccy); }, [t.ccy]);
  useEffect(() => { applyColorRule(t.colorRule); }, [t.colorRule]);

  // ── Tag mutation API ──
  // Build a fresh overrides map that includes ALL positions (preserves seeded tags)
  const ensureOverrides = useCallback(() => {
    const cur = { ...tagOverrides };
    for (const p of window.PORTFOLIO.positions) {
      if (cur[p.sym] == null) cur[p.sym] = [...(p.tags || [])];
    }
    return cur;
  }, [tagOverrides]);

  const setStockTags = useCallback((sym, newTags) => {
    setTagOverrides((prev) => ({ ...ensureOverrides(), [sym]: newTags }));
  }, [ensureOverrides]);

  const setStockNote = useCallback((sym, newNote) => {
    setNoteOverrides((prev) => ({ ...prev, [sym]: newNote }));
  }, []);

  const toggleStockTag = useCallback((sym, tag) => {
    const cur = positions.find((p) => p.sym === sym);
    if (!cur) return;
    const has = cur.tags.includes(tag);
    const next = has ? cur.tags.filter((x) => x !== tag) : [...cur.tags, tag];
    setStockTags(sym, next);
    // Ensure tab exists for new tag
    if (!has && !viewTabs.find((v) => v.kind === 'tag' && v.label === tag)) {
      const id = 'v-' + Date.now().toString(36);
      setViewTabs((p) => [...p, { id, label: tag, kind: 'tag' }]);
    }
  }, [positions, viewTabs, setStockTags]);

  // Listen for rename/delete from ViewTabsRow (cascades into tags)
  useEffect(() => {
    const onRename = (e) => {
      const { oldLabel, newLabel } = e.detail;
      setTagOverrides((prev) => {
        const next = { ...ensureOverrides() };
        for (const sym of Object.keys(next)) {
          next[sym] = next[sym].map((t) => t === oldLabel ? newLabel : t);
        }
        return next;
      });
    };
    const onDelete = (e) => {
      const { label } = e.detail;
      setTagOverrides((prev) => {
        const next = { ...ensureOverrides() };
        for (const sym of Object.keys(next)) {
          next[sym] = next[sym].filter((t) => t !== label);
        }
        return next;
      });
    };
    window.addEventListener('gca:renameTag', onRename);
    window.addEventListener('gca:deleteTag', onDelete);
    return () => {
      window.removeEventListener('gca:renameTag', onRename);
      window.removeEventListener('gca:deleteTag', onDelete);
    };
  }, [ensureOverrides]);

  // ── Navigation ──
  const goToAdd = () => { setEditing(null); setPresetMode(null); setScreen('Add'); };
  const goToEdit = (tx) => { setEditing(tx); setPresetMode(null); setScreen('Add'); };
  const goToDetail = (sym) => { setActiveSym(sym); setScreen('Detail'); };
  const back = () => {
    if (screen === 'Detail') return setScreen('Portfolio');
    setScreen(editing ? 'Trades' : 'Portfolio'); setEditing(null); setPresetMode(null);
  };

  // ── Save/delete transaction ──
  const saveTransaction = useCallback((tx) => {
    setUserTxs((prev) => {
      // Edit existing user tx
      if (tx.id && prev.find((x) => x.id === tx.id)) {
        return prev.map((x) => x.id === tx.id ? { ...x, ...tx } : x);
      }
      // New tx — generate id
      const id = 'u' + Date.now().toString(36);
      return [{ ...tx, id }, ...prev];
    });
  }, []);

  const deleteTransaction = useCallback((id) => {
    setUserTxs((prev) => prev.filter((x) => x.id !== id));
  }, []);

  const handleTab = (id) => {
    if (id === 'Add') return goToAdd();
    setEditing(null);
    setActiveSym(null);
    setScreen(id);
  };

  const renderScreen = () => {
    if (screen === 'Portfolio') return (
      <PortfolioScreen
        t={t} ccy={ccy} setCcy={setCcy} setTweak={setTweak}
        positions={positions} usdCash={live.usdCash} realizedPnL={live.realizedPnL}
        totalDeposited={live.totalDeposited}
        viewTabs={viewTabs} setViewTabs={setViewTabs}
        activeView={activeView} setActiveView={setActiveView}
        onOpenStock={goToDetail}
        onAddCash={() => { setEditing(null); setPresetMode('cash'); setScreen('Add'); }}
        priceStatus={priceStatus}
        priceUpdated={priceUpdated}
        priceMsg={priceMsg}
        onRefreshPrices={refreshPrices}
      />
    );
    if (screen === 'Trades') return <TradesScreen
      transactions={allTxs}
      onEdit={(tx) => tx.id?.startsWith('u') ? goToEdit(tx) : null}
      onAdd={goToAdd}
    />;
    if (screen === 'Add') return <AddScreen
      editing={editing}
      presetMode={presetMode}
      positions={positions}
      currentCash={live.usdCash}
      onCancel={back}
      onSave={(tx) => { saveTransaction(tx); back(); }}
      onDelete={editing && editing.id?.startsWith('u') ? () => { deleteTransaction(editing.id); back(); } : null}
    />;
    if (screen === 'Detail') {
      const pos = positions.find((p) => p.sym === activeSym);
      if (!pos) { setScreen('Portfolio'); return null; }
      return (
        <StockDetailScreen
          position={pos}
          transactions={allTxs.filter((x) => x.sym === pos.sym)}
          allTags={viewTabs.filter((v) => v.kind === 'tag').map((v) => v.label)}
          onBack={back}
          onToggleTag={(tag) => toggleStockTag(pos.sym, tag)}
          onSetTags={(tags) => setStockTags(pos.sym, tags)}
          onSetNote={(note) => setStockNote(pos.sym, note)}
          ccy={ccy}
        />
      );
    }
    return null;
  };

  return (
    <Phone>
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        {renderScreen()}
      </div>

      <TabBar tabs={NAV_TABS} active={screen === 'Add' ? 'Add' : (screen === 'Detail' ? 'Portfolio' : screen)} onChange={handleTab} />

      <TweaksPanel title="Tweaks">
        <TweakSection label="摘要卡風格">
          <TweakRadio label="樣式" value={t.summaryStyle} options={SUMMARY_STYLES.map(v => ({ value: v, label: { dark: '深色', light: '淺色', accent: '強調' }[v] }))}
            onChange={(v) => setTweak('summaryStyle', v)} />
        </TweakSection>

        <TweakSection label="表格">
          <TweakRadio label="密度" value={t.density} options={DENSITIES.map(v => ({ value: v, label: { compact: '緊湊', cozy: '舒適' }[v] }))}
            onChange={(v) => setTweak('density', v)} />
        </TweakSection>

        <TweakSection label="顯示偏好">
          <TweakRadio label="預設幣別" value={t.ccy} options={[{ value: 'USD', label: 'USD' }, { value: 'TWD', label: 'TWD' }]}
            onChange={(v) => setTweak('ccy', v)} />
          <TweakSelect label="漲跌色慣例" value={t.colorRule} options={[
            { value: 'us',      label: '美股（綠漲紅跌）' },
            { value: 'tw',      label: '台股（紅漲綠跌）' },
            { value: 'neutral', label: '中性（藍/橘）' },
          ]} onChange={(v) => setTweak('colorRule', v)} />
        </TweakSection>

        <TweakSection label="即時股價 (Finnhub)">
          <FinnhubKeyControl />
        </TweakSection>

        <TweakSection label="資料">
          <TweakButton label="重設標籤與分類頁籤" secondary onClick={() => {
            try { localStorage.removeItem(VIEW_TABS_LS); localStorage.removeItem(TAGS_LS); } catch {}
            setTagOverrides({});
            const fresh = buildDefaultViewTabs(window.PORTFOLIO.positions);
            setViewTabs(fresh);
            setActiveView(fresh[0]?.id);
          }} />
          <TweakButton label="清除所有交易紀錄" secondary onClick={() => {
            if (!confirm('確定清除所有手動新增的交易紀錄？此動作無法復原。')) return;
            try { localStorage.removeItem(PORTFOLIO_LS); } catch {}
            setUserTxs([]);
          }} />
        </TweakSection>
      </TweaksPanel>
    </Phone>
  );
}

function Shell() {
  return (
    <div className="gca-shell">
      <div className="gca-shell-inner">
        <Tracker />
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<Shell />);
