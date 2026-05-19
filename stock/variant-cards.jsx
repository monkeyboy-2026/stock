// Variant C — Card-rich layout
// Each holding is an expressive card with sparkline, % allocation, full PnL.
// Hero stats live as horizontally-scrollable summary chips above.

function VariantCards() {
  const [ccy, setCcy] = useState('USD');
  const p = window.PORTFOLIO;
  const s = window.computeSummary(p);
  const conv = (n) => ccy === 'TWD' ? n * p.fxUsdTwd : n;
  const fmtMoney = (n, opts) => ccy === 'TWD' ? window.fmt.twd(conv(n)) : window.fmt.usd(n, opts);

  const chips = [
    { label: '預估現值',   value: fmtMoney(s.totalPortfolio), accent: false, big: true },
    { label: '未實現',     value: window.fmt.usd(s.unrealized, { sign: true }),  tone: s.unrealized >= 0 ? 'up' : 'down', sub: window.fmt.pct(s.unrealizedPct) },
    { label: '今日',       value: window.fmt.usd(s.todayChg, { sign: true }),    tone: s.todayChg >= 0 ? 'up' : 'down', sub: window.fmt.pct(s.todayPct) },
    { label: '原始成本',   value: fmtMoney(s.cost) },
    { label: '美金庫存',   value: fmtMoney(p.usdCash) },
    { label: '累積已實現', value: window.fmt.usd(p.realizedPnL, { sign: true }), tone: p.realizedPnL >= 0 ? 'up' : 'down' },
    { label: '累積淨盈餘', value: window.fmt.usd(s.netCumulative, { sign: true }), tone: s.netCumulative >= 0 ? 'up' : 'down' },
  ];

  return (
    <Phone bg="var(--surface-2)">
      <div className="scroll" style={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
      <div style={{ padding: '6px 22px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Hello, Allen</div>
          <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.025em', marginTop: 2 }}>美股組合</div>
        </div>
        <CurrencyToggle value={ccy} onChange={setCcy} />
      </div>

      {/* Horizontally-scrollable summary chips */}
      <div className="scroll" style={{
        overflowX: 'auto', padding: '8px 22px 6px', display: 'flex', gap: 10,
      }}>
        {chips.map((c, i) => (
          <div key={i} style={{
            flex: '0 0 auto', minWidth: c.big ? 180 : 130,
            background: 'var(--surface)', borderRadius: 'var(--r-lg)',
            padding: c.big ? '14px 16px' : '12px 14px',
            border: '1px solid var(--line)',
          }}>
            <div style={{ fontSize: 10, color: 'var(--ink-3)', fontWeight: 600, letterSpacing: '0.04em' }}>{c.label}</div>
            <div className="mono" style={{
              marginTop: 4, fontSize: c.big ? 22 : 15, fontWeight: 700, letterSpacing: '-0.025em',
              color: c.tone === 'up' ? 'var(--up)' : c.tone === 'down' ? 'var(--down)' : 'var(--ink)',
            }}>{c.value}</div>
            {c.sub && (
              <div className="mono" style={{
                marginTop: 2, fontSize: 10, fontWeight: 600,
                color: c.tone === 'up' ? 'var(--up)' : c.tone === 'down' ? 'var(--down)' : 'var(--ink-3)',
              }}>{c.sub}</div>
            )}
          </div>
        ))}
      </div>

      {/* Holdings cards */}
      <div style={{ padding: '14px 14px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '-0.01em' }}>持倉 · {p.positions.length} 檔</div>
        <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>依市值排序</div>
      </div>

      <div style={{ padding: '0 14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {[...p.positions].sort((a, b) => b.shares * b.price - a.shares * a.price).map((pos) => {
          const val = pos.shares * pos.price;
          const cost = pos.shares * pos.avg;
          const pnl = val - cost;
          const pnlPct = pnl / cost;
          const alloc = val / s.value;
          const up = pos.day >= 0;
          return (
            <div key={pos.sym} style={{
              background: 'var(--surface)', borderRadius: 'var(--r-lg)',
              padding: '14px 16px',
              border: '1px solid var(--line)',
            }}>
              {/* Top row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <SymAvatar sym={pos.sym} size={38} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                    <span style={{ fontWeight: 700, fontSize: 15, letterSpacing: '-0.01em' }}>{pos.sym}</span>
                    <span style={{ fontSize: 11, color: 'var(--ink-3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{pos.name}</span>
                  </div>
                  <div className="mono" style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>
                    {window.fmt.shares(pos.shares)} 股 · 均價 ${window.fmt.num(pos.avg)}
                  </div>
                </div>
                <SparkArea data={pos.spark} w={70} h={28} up={up} />
              </div>

              {/* Bottom row — price + pnl */}
              <div style={{
                marginTop: 12, paddingTop: 12, borderTop: '1px dashed var(--line)',
                display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8,
              }}>
                <div>
                  <div style={{ fontSize: 10, color: 'var(--ink-4)', fontWeight: 600 }}>市值</div>
                  <div className="mono" style={{ fontSize: 13, fontWeight: 700, marginTop: 2, letterSpacing: '-0.01em' }}>{fmtMoney(val)}</div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: 'var(--ink-4)', fontWeight: 600 }}>未實現</div>
                  <div className="mono" style={{
                    fontSize: 13, fontWeight: 700, marginTop: 2, letterSpacing: '-0.01em',
                    color: pnl >= 0 ? 'var(--up)' : 'var(--down)',
                  }}>
                    {pnl >= 0 ? '+' : '−'}{fmtMoney(Math.abs(pnl))}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 10, color: 'var(--ink-4)', fontWeight: 600 }}>今日 · 損益%</div>
                  <div className="mono" style={{
                    fontSize: 13, fontWeight: 700, marginTop: 2, letterSpacing: '-0.01em',
                    color: up ? 'var(--up)' : 'var(--down)',
                  }}>
                    {window.fmt.pct(pos.day)}
                  </div>
                  <div className="mono" style={{ fontSize: 10, fontWeight: 600, color: pnl >= 0 ? 'var(--up)' : 'var(--down)' }}>
                    {window.fmt.pct(pnlPct)}
                  </div>
                </div>
              </div>

              {/* Allocation bar */}
              <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ flex: 1, height: 4, background: 'var(--surface-3)', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ width: `${alloc * 100}%`, height: '100%', background: 'var(--ink)', borderRadius: 4 }} />
                </div>
                <span className="mono" style={{ fontSize: 10, color: 'var(--ink-3)', fontWeight: 600 }}>
                  {(alloc * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          );
        })}
      </div>

      </div>
      <TabBar active="Portfolio" />
    </Phone>
  );
}

window.VariantCards = VariantCards;
