// Variant B — Dense table layout
// High information density, scannable columns, broker-app feel.

function VariantTable() {
  const [ccy, setCcy] = useState('USD');
  const [sort, setSort] = useState('value');
  const p = window.PORTFOLIO;
  const s = window.computeSummary(p);
  const conv = (n) => ccy === 'TWD' ? n * p.fxUsdTwd : n;
  const fmtMoney = (n, opts) => ccy === 'TWD' ? window.fmt.twd(conv(n)) : window.fmt.usd(n, opts);
  const fmtCompact = (n) => {
    const v = ccy === 'TWD' ? conv(n) : n;
    if (Math.abs(v) >= 1000) return (ccy === 'TWD' ? 'NT$' : '$') + (v / 1000).toFixed(1) + 'k';
    return fmtMoney(n);
  };

  const sorted = useMemo(() => {
    const rows = [...p.positions];
    if (sort === 'value') rows.sort((a, b) => b.shares * b.price - a.shares * a.price);
    if (sort === 'pnl') rows.sort((a, b) => (b.shares * (b.price - b.avg)) - (a.shares * (a.price - a.avg)));
    if (sort === 'day') rows.sort((a, b) => b.day - a.day);
    if (sort === 'sym') rows.sort((a, b) => a.sym.localeCompare(b.sym));
    return rows;
  }, [sort]);

  const SummaryRow = ({ label, value, tone }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
      <span style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 500 }}>{label}</span>
      <span className="mono" style={{
        fontSize: 13, fontWeight: 600,
        color: tone === 'up' ? 'var(--up)' : tone === 'down' ? 'var(--down)' : 'var(--ink)',
      }}>{value}</span>
    </div>
  );

  return (
    <Phone>
      <div className="scroll" style={{ flex: 1, overflow: 'auto', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '8px 18px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.02em' }}>持倉一覽</div>
        <CurrencyToggle value={ccy} onChange={setCcy} />
      </div>

      {/* Compact summary strip */}
      <div style={{ margin: '0 14px', padding: '14px 16px', background: 'var(--ink)', color: 'var(--bg)', borderRadius: 'var(--r-lg)' }}>
        <div style={{ fontSize: 10, opacity: 0.6, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>預估現值</div>
        <div className="mono" style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.03em', marginTop: 2, lineHeight: 1.1 }}>
          {fmtMoney(s.totalPortfolio)}
        </div>
        <div className="mono" style={{ fontSize: 12, fontWeight: 600, marginTop: 4, color: s.todayChg >= 0 ? '#86efac' : '#fca5a5' }}>
          {s.todayChg >= 0 ? '▲' : '▼'} {fmtMoney(Math.abs(s.todayChg))} · {window.fmt.pct(s.todayPct)}  <span style={{ opacity: 0.5, color: '#fff', fontWeight: 400 }}>今日</span>
        </div>
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.12)', display: 'grid', gap: 6 }}>
          <SummaryRow label="原始成本" value={fmtMoney(s.cost)} />
          <SummaryRow label="美金庫存" value={fmtMoney(p.usdCash)} />
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>未實現損益</span>
            <span className="mono" style={{ fontSize: 13, fontWeight: 600, color: s.unrealized >= 0 ? '#86efac' : '#fca5a5' }}>
              {window.fmt.usd(s.unrealized, { sign: true })} · {window.fmt.pct(s.unrealizedPct)}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>累積已實現</span>
            <span className="mono" style={{ fontSize: 13, fontWeight: 600, color: p.realizedPnL >= 0 ? '#86efac' : '#fca5a5' }}>
              {window.fmt.usd(p.realizedPnL, { sign: true })}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 6, marginTop: 4, borderTop: '1px dashed rgba(255,255,255,0.18)' }}>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.85)', fontWeight: 600 }}>累積淨盈餘</span>
            <span className="mono" style={{ fontSize: 13, fontWeight: 700, color: s.netCumulative >= 0 ? '#86efac' : '#fca5a5' }}>
              {window.fmt.usd(s.netCumulative, { sign: true })}
            </span>
          </div>
        </div>
      </div>

      {/* Sort tabs */}
      <div style={{ padding: '20px 14px 8px', display: 'flex', gap: 6, alignItems: 'center', overflowX: 'auto' }}>
        {[
          { id: 'value', label: '市值' },
          { id: 'pnl',   label: '損益' },
          { id: 'day',   label: '今日' },
          { id: 'sym',   label: '代號' },
        ].map((t) => (
          <button key={t.id} onClick={() => setSort(t.id)} style={{
            border: 0, padding: '6px 10px', borderRadius: 999,
            background: sort === t.id ? 'var(--ink)' : 'var(--surface-2)',
            color: sort === t.id ? 'var(--bg)' : 'var(--ink-2)',
            fontFamily: 'var(--font-ui)', fontSize: 11, fontWeight: 600, cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}>{t.label}</button>
        ))}
        <div style={{ flex: 1 }} />
        <div style={{ fontSize: 10, color: 'var(--ink-4)', fontFamily: 'var(--font-mono)' }}>{p.asOf}</div>
      </div>

      {/* Table header */}
      <div style={{
        padding: '8px 18px', display: 'grid',
        gridTemplateColumns: '60px 1fr 1fr', gap: 8,
        fontSize: 10, color: 'var(--ink-4)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase',
        borderBottom: '1px solid var(--line)',
      }}>
        <span>代號</span>
        <span style={{ textAlign: 'right' }}>市值 / 今日</span>
        <span style={{ textAlign: 'right' }}>損益 / %</span>
      </div>

      {/* Rows */}
      <div>
        {sorted.map((pos) => {
          const val = pos.shares * pos.price;
          const cost = pos.shares * pos.avg;
          const pnl = val - cost;
          const pnlPct = pnl / cost;
          return (
            <div key={pos.sym} style={{
              padding: '11px 18px', display: 'grid',
              gridTemplateColumns: '60px 1fr 1fr', gap: 8, alignItems: 'center',
              borderBottom: '1px solid var(--line)',
            }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13, letterSpacing: '-0.01em' }}>{pos.sym}</div>
                <div className="mono" style={{ fontSize: 10, color: 'var(--ink-4)', marginTop: 1 }}>{window.fmt.shares(pos.shares)}股</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="mono" style={{ fontSize: 13, fontWeight: 600, letterSpacing: '-0.01em' }}>{fmtCompact(val)}</div>
                <div className="mono" style={{ fontSize: 10, fontWeight: 600, color: pos.day >= 0 ? 'var(--up)' : 'var(--down)', marginTop: 1 }}>
                  {window.fmt.pct(pos.day)}
                </div>
              </div>
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
            </div>
          );
        })}
      </div>

      <div style={{ flex: 1 }} />
      </div>
      <TabBar active="Portfolio" />
    </Phone>
  );
}

window.VariantTable = VariantTable;
