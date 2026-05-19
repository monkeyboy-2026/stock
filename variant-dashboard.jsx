// Variant A — Dashboard layout
// Hero total value + today, then 4-up stat grid, then holdings list.

function VariantDashboard() {
  const [ccy, setCcy] = useState('USD');
  const p = window.PORTFOLIO;
  const s = window.computeSummary(p);
  const conv = (n) => ccy === 'TWD' ? n * p.fxUsdTwd : n;
  const fmtMoney = (n, opts) => ccy === 'TWD' ? window.fmt.twd(conv(n)) : window.fmt.usd(n, opts);

  const stats = [
    { label: '原始成本',   value: fmtMoney(s.cost),       tone: 'ink' },
    { label: '美金庫存',   value: fmtMoney(p.usdCash),    tone: 'ink' },
    { label: '未實現損益', value: fmtMoney(s.unrealized, { sign: true }), tone: s.unrealized >= 0 ? 'up' : 'down', sub: window.fmt.pct(s.unrealizedPct) },
    { label: '累積已實現', value: fmtMoney(p.realizedPnL, { sign: true }), tone: p.realizedPnL >= 0 ? 'up' : 'down' },
  ];

  return (
    <Phone>
      <div className="scroll" style={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
      <div style={{ padding: '8px 22px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Portfolio</div>
          <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.02em', marginTop: 2 }}>主要帳戶</div>
        </div>
        <CurrencyToggle value={ccy} onChange={setCcy} />
      </div>

      {/* Hero */}
      <div style={{ padding: '12px 22px 24px' }}>
        <div style={{ fontSize: 12, color: 'var(--ink-3)', fontWeight: 500 }}>預估現值</div>
        <div className="mono" style={{ fontSize: 42, fontWeight: 700, letterSpacing: '-0.035em', marginTop: 4, lineHeight: 1 }}>
          {fmtMoney(s.totalPortfolio)}
        </div>
        <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            background: s.todayChg >= 0 ? 'var(--up-soft)' : 'var(--down-soft)',
            color: s.todayChg >= 0 ? 'var(--up-ink)' : 'var(--down-ink)',
            fontWeight: 600, fontSize: 12, padding: '4px 9px', borderRadius: 999,
            fontFamily: 'var(--font-mono)',
          }}>
            {s.todayChg >= 0 ? '▲' : '▼'} {fmtMoney(Math.abs(s.todayChg))} · {window.fmt.pct(s.todayPct)}
          </span>
          <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>今日</span>
        </div>
        <div style={{ marginTop: 14, height: 56 }}>
          <SparkArea data={[63100,63400,63250,63800,64200,64050,64500,64900,64700,65200,65300,65800,66100,66500,66800,67300,67200,67500,68100,68600,68900,69300,69500,69800,70200,70800,71200,71600,72100,72400,72690]} w={346} h={56} />
        </div>
      </div>

      {/* 4-up stat grid */}
      <div style={{ padding: '0 22px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {stats.map((st) => (
            <div key={st.label} style={{
              background: 'var(--surface-2)', borderRadius: 'var(--r-lg)',
              padding: '14px 14px 12px',
            }}>
              <div style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 500 }}>{st.label}</div>
              <div className="mono" style={{
                marginTop: 6, fontSize: 18, fontWeight: 700, letterSpacing: '-0.02em',
                color: st.tone === 'up' ? 'var(--up)' : st.tone === 'down' ? 'var(--down)' : 'var(--ink)',
              }}>{st.value}</div>
              {st.sub && (
                <div className="mono" style={{
                  fontSize: 11, marginTop: 2,
                  color: st.tone === 'up' ? 'var(--up)' : st.tone === 'down' ? 'var(--down)' : 'var(--ink-3)',
                }}>{st.sub}</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Holdings */}
      <div style={{ padding: '24px 22px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '-0.01em' }}>持倉 · {p.positions.length}</div>
        <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>依市值排序</div>
      </div>

      <div style={{ padding: '0 14px 24px' }}>
        {[...p.positions].sort((a, b) => b.shares * b.price - a.shares * a.price).map((pos) => {
          const val = pos.shares * pos.price;
          const cost = pos.shares * pos.avg;
          const pnl = val - cost;
          const pnlPct = pnl / cost;
          return (
            <div key={pos.sym} style={{
              display: 'grid', gridTemplateColumns: 'auto 1fr auto', alignItems: 'center',
              gap: 12, padding: '12px 8px', borderRadius: 12,
            }}>
              <SymAvatar sym={pos.sym} />
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                  <span style={{ fontWeight: 700, fontSize: 14, letterSpacing: '-0.01em' }}>{pos.sym}</span>
                  <span className="mono" style={{ fontSize: 10, color: pos.day >= 0 ? 'var(--up)' : 'var(--down)', fontWeight: 600 }}>
                    {window.fmt.pct(pos.day)}
                  </span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {window.fmt.shares(pos.shares)} 股 · 均價 <span className="mono">${window.fmt.num(pos.avg)}</span>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="mono" style={{ fontWeight: 700, fontSize: 14, letterSpacing: '-0.01em' }}>
                  {fmtMoney(val)}
                </div>
                <div className="mono" style={{ fontSize: 11, fontWeight: 600, color: pnl >= 0 ? 'var(--up)' : 'var(--down)', marginTop: 2 }}>
                  {pnl >= 0 ? '+' : ''}{fmtMoney(pnl).replace(/^[-+]/, pnl >= 0 ? '+' : '−')} · {window.fmt.pct(pnlPct)}
                </div>
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

window.VariantDashboard = VariantDashboard;
