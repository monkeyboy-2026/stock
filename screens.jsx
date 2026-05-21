// Screens for Add / Edit transaction and Trades history.
// Loaded after data.js, shared.jsx.

const { useState, useEffect, useMemo, useCallback, useRef } = React;

// ─── Small reusable bits
function ScreenHeader({ title, onBack, right }) {
  return (
    <div style={{
      padding: '6px 14px 12px',
      display: 'grid', gridTemplateColumns: '40px 1fr 40px', alignItems: 'center', gap: 8,
    }}>
      {onBack ? (
        <button onClick={onBack} style={{
          width: 36, height: 36, border: 0, background: 'var(--surface-2)',
          borderRadius: 12, cursor: 'pointer',
          fontSize: 18, color: 'var(--ink)',
        }}>‹</button>
      ) : <span />}
      <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.02em', textAlign: 'center' }}>{title}</div>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>{right}</div>
    </div>
  );
}

function Field({ label, hint, children, right }) {
  return (
    <label style={{ display: 'block', padding: '8px 18px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
        <span style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{label}</span>
        {right}
      </div>
      {children}
      {hint && <div style={{ fontSize: 10, color: 'var(--ink-4)', marginTop: 4 }}>{hint}</div>}
    </label>
  );
}

const inputBaseStyle = {
  width: '100%', height: 44,
  border: '1px solid var(--line)', borderRadius: 12,
  padding: '0 14px',
  fontFamily: 'var(--font-mono)', fontSize: 15, fontWeight: 500,
  color: 'var(--ink)', background: 'var(--surface)',
  outline: 'none',
};
function TextInput(props) {
  return <input {...props} style={{ ...inputBaseStyle, ...(props.style || {}) }} />;
}

// ─── Side toggle (BUY / SELL)
function SideToggle({ value, onChange }) {
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8,
    }}>
      {['BUY', 'SELL'].map((s) => {
        const active = value === s;
        const isBuy = s === 'BUY';
        const activeBg = isBuy ? 'var(--up)' : 'var(--down)';
        return (
          <button key={s} onClick={() => onChange(s)} style={{
            height: 48, border: 0, borderRadius: 14, cursor: 'pointer',
            background: active ? activeBg : 'var(--surface-2)',
            color: active ? '#fff' : 'var(--ink-2)',
            fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 14, letterSpacing: '0.02em',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}>
            <span style={{ fontSize: 16 }}>{isBuy ? '+' : '−'}</span>
            {isBuy ? '買入' : '賣出'}
          </button>
        );
      })}
    </div>
  );
}

// ─── Add / Edit Transaction Screen
function AddScreen({ onCancel, onSave, onDelete, editing, positions, presetMode, currentCash }) {
  const livePositions = positions || window.PORTFOLIO.positions;

  // Detect mode:
  //   - editing existing cash tx → 'cash'
  //   - presetMode passed → that
  //   - otherwise 'stock'
  const initialMode = (editing?.side === 'DEPOSIT' || editing?.side === 'WITHDRAW')
    ? 'cash'
    : (presetMode || 'stock');
  const [mode, setMode] = useState(initialMode);

  // Stock fields
  const [side, setSide]   = useState(editing?.side === 'SELL' ? 'SELL' : (editing?.side === 'BUY' ? 'BUY' : 'BUY'));
  const [sym, setSym]     = useState(editing?.sym || '');
  const [shares, setShares] = useState(editing?.shares?.toString() || '');
  const [price, setPrice]   = useState(editing?.price?.toString() || '');
  const [fee, setFee]       = useState(editing?.fee?.toString() || '0.99');
  const [broker, setBroker] = useState(editing?.broker || 'Firstrade');

  // Cash fields
  const [cashSide, setCashSide] = useState(editing?.side === 'WITHDRAW' ? 'WITHDRAW' : 'DEPOSIT');
  const [amount, setAmount]     = useState(editing?.amount?.toString() || '');

  // Shared
  const [date, setDate]     = useState(editing?.date || new Date().toISOString().slice(0, 10));
  const [note, setNote]     = useState(editing?.note || '');

  const sharesNum = parseFloat(shares) || 0;
  const priceNum  = parseFloat(price) || 0;
  const feeNum    = parseFloat(fee) || 0;
  const subtotal  = sharesNum * priceNum;
  const total     = side === 'BUY' ? subtotal + feeNum : subtotal - feeNum;
  const amountNum = parseFloat(amount) || 0;

  const suggestions = livePositions.filter((p) => p.shares > 0).map((p) => p.sym);
  const knownSym = livePositions.find((p) => p.sym === sym.toUpperCase());
  const livePrice = knownSym?.price;

  const sellTooMany = side === 'SELL' && knownSym && sharesNum > knownSym.shares;
  const stockValid = sym.length >= 1 && sharesNum > 0 && priceNum > 0 && !sellTooMany;
  const cashValid = amountNum > 0;
  const valid = mode === 'stock' ? stockValid : cashValid;

  const handleSave = () => {
    if (!valid || !onSave) return;
    if (mode === 'stock') {
      onSave({
        ...(editing?.id ? { id: editing.id } : {}),
        side, sym: sym.toUpperCase(),
        shares: sharesNum, price: priceNum, fee: feeNum,
        date, broker, note,
      });
    } else {
      onSave({
        ...(editing?.id ? { id: editing.id } : {}),
        side: cashSide,
        amount: amountNum,
        date, note,
      });
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <ScreenHeader
        title={editing ? '編輯交易' : '新增交易'}
        onBack={onCancel}
        right={<button onClick={onCancel} style={{ border: 0, background: 'transparent', cursor: 'pointer', color: 'var(--ink-3)', fontSize: 13, fontWeight: 600 }}>取消</button>}
      />
      <div className="scroll" style={{ flex: 1, overflow: 'auto', paddingBottom: 24 }}>
        {/* Mode tabs: 個股 / 現金 (hidden when editing — editing implies single mode) */}
        {!editing && (
          <div style={{ padding: '0 18px 12px' }}>
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0,
              background: 'var(--surface-2)', borderRadius: 12, padding: 3,
            }}>
              {[
                { id: 'stock', label: '個股交易' },
                { id: 'cash',  label: '現金存提' },
              ].map((m) => (
                <button key={m.id} onClick={() => setMode(m.id)} style={{
                  height: 36, border: 0, borderRadius: 10, cursor: 'pointer',
                  background: mode === m.id ? 'var(--surface)' : 'transparent',
                  color: mode === m.id ? 'var(--ink)' : 'var(--ink-3)',
                  fontFamily: 'var(--font-ui)', fontWeight: 600, fontSize: 12,
                  boxShadow: mode === m.id ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                }}>{m.label}</button>
              ))}
            </div>
          </div>
        )}

        {mode === 'stock' && <StockTxFields {...{
          side, setSide, sym, setSym, shares, setShares, price, setPrice,
          fee, setFee, date, setDate, broker, setBroker, note, setNote,
          sharesNum, priceNum, feeNum, subtotal, total,
          suggestions, knownSym, livePrice,
        }} />}

        {mode === 'cash' && <CashTxFields {...{
          cashSide, setCashSide, amount, setAmount, date, setDate, note, setNote,
          amountNum, currentCash,
        }} />}

        {editing && onDelete && (
          <div style={{ padding: '4px 18px 12px' }}>
            <button onClick={() => {
              if (confirm('確定刪除此筆交易？')) onDelete();
            }} style={{
              width: '100%', height: 44, border: '1px solid var(--down)',
              background: 'transparent', color: 'var(--down)',
              borderRadius: 12, cursor: 'pointer',
              fontFamily: 'var(--font-ui)', fontWeight: 600, fontSize: 13,
            }}>刪除此筆交易</button>
          </div>
        )}
      </div>

      {/* Sticky Save */}
      <div style={{
        padding: '12px 18px 8px', borderTop: '1px solid var(--line)',
        background: 'var(--surface)',
      }}>
        {sellTooMany && mode === 'stock' && (
          <div style={{ marginBottom: 8, padding: '6px 10px', background: 'var(--down-soft)', color: 'var(--down-ink)', borderRadius: 8, fontSize: 11, fontWeight: 600 }}>
            賣出股數超過持有 ({knownSym.shares} 股)
          </div>
        )}
        <button
          disabled={!valid}
          onClick={handleSave}
          style={{
            width: '100%', height: 50, border: 0, borderRadius: 14,
            background: valid ? 'var(--ink)' : 'var(--surface-3)',
            color: valid ? 'var(--bg)' : 'var(--ink-4)',
            cursor: valid ? 'pointer' : 'not-allowed',
            fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 14, letterSpacing: '0.02em',
          }}
        >{editing
            ? '儲存變更'
            : mode === 'stock'
              ? `儲存交易 · $${total.toFixed(2)}`
              : `${cashSide === 'DEPOSIT' ? '存入' : '提領'} · $${amountNum.toFixed(2)}`
        }</button>
      </div>
    </div>
  );
}

// ─── Stock transaction fields (extracted from AddScreen)
function StockTxFields({
  side, setSide, sym, setSym, shares, setShares, price, setPrice,
  fee, setFee, date, setDate, broker, setBroker, note, setNote,
  sharesNum, priceNum, feeNum, subtotal, total,
  suggestions, knownSym, livePrice,
}) {
  return (
    <>
      <div style={{ padding: '4px 18px 8px' }}>
        <SideToggle value={side} onChange={setSide} />
      </div>

      <Field label="股票代號" hint={knownSym ? `${knownSym.name} · 現價 $${window.fmt.num(knownSym.price)}` : sym ? '新標的 — 將自動建倉' : '從持倉中選擇或輸入新代號'}>
        <TextInput
          value={sym}
          onChange={(e) => setSym(e.target.value.toUpperCase().slice(0, 8))}
          placeholder="例：AAPL"
          style={{ fontWeight: 700, letterSpacing: '0.04em', fontSize: 18 }}
        />
        {!sym && (
          <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {suggestions.slice(0, 6).map((s) => (
              <button key={s} onClick={() => setSym(s)} style={{
                border: '1px solid var(--line)', background: 'var(--surface)',
                padding: '5px 10px', borderRadius: 999, cursor: 'pointer',
                fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600,
                color: 'var(--ink-2)',
              }}>{s}</button>
            ))}
          </div>
        )}
      </Field>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
        <Field label="股數">
          <TextInput type="number" inputMode="decimal" value={shares} onChange={(e) => setShares(e.target.value)} placeholder="0" />
        </Field>
        <Field
          label="成交價"
          right={livePrice && (
            <button onClick={() => setPrice(livePrice.toFixed(2))} style={{
              border: 0, background: 'transparent', cursor: 'pointer',
              fontSize: 10, fontWeight: 600, color: 'var(--accent)', padding: 0,
            }}>使用現價 ${livePrice.toFixed(2)}</button>
          )}
        >
          <div style={{ position: 'relative' }}>
            <span style={{
              position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
              color: 'var(--ink-3)', fontFamily: 'var(--font-mono)', fontSize: 15,
            }}>$</span>
            <TextInput type="number" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)}
              placeholder="0.00" style={{ paddingLeft: 26 }} />
          </div>
        </Field>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
        <Field label="手續費">
          <div style={{ position: 'relative' }}>
            <span style={{
              position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
              color: 'var(--ink-3)', fontFamily: 'var(--font-mono)', fontSize: 15,
            }}>$</span>
            <TextInput type="number" inputMode="decimal" value={fee} onChange={(e) => setFee(e.target.value)} style={{ paddingLeft: 26 }} />
          </div>
        </Field>
        <Field label="交易日期">
          <TextInput type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
      </div>

      <Field label="券商">
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {['Firstrade', 'IB', 'Charles Schwab', 'TD', '國泰', '其他'].map((b) => (
            <button key={b} onClick={() => setBroker(b)} style={{
              border: '1px solid ' + (broker === b ? 'var(--ink)' : 'var(--line)'),
              background: broker === b ? 'var(--ink)' : 'var(--surface)',
              color: broker === b ? 'var(--bg)' : 'var(--ink-2)',
              padding: '7px 12px', borderRadius: 999, cursor: 'pointer',
              fontFamily: 'var(--font-ui)', fontSize: 12, fontWeight: 600,
            }}>{b}</button>
          ))}
        </div>
      </Field>

      <Field label="備註">
        <textarea value={note} onChange={(e) => setNote(e.target.value)}
          placeholder="投資理由、stop loss 等" rows={2}
          style={{
            ...inputBaseStyle, height: 'auto', padding: '12px 14px',
            fontFamily: 'var(--font-ui)', fontSize: 13, fontWeight: 400, resize: 'none',
          }} />
      </Field>

      <div style={{ padding: '12px 18px 8px' }}>
        <div style={{
          background: 'var(--surface-2)', borderRadius: 14, padding: '14px 16px',
        }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--ink-3)' }}>預覽</div>
          <div style={{ marginTop: 8, display: 'grid', gap: 4 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--ink-2)' }}>
              <span>{sym || '— —'} · {sharesNum || 0} 股 × ${priceNum.toFixed(2)}</span>
              <span className="mono" style={{ fontWeight: 600 }}>${subtotal.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--ink-3)' }}>
              <span>手續費</span>
              <span className="mono">{side === 'BUY' ? '+' : '−'}${feeNum.toFixed(2)}</span>
            </div>
            <div style={{
              marginTop: 6, paddingTop: 8, borderTop: '1px dashed var(--line-2)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
            }}>
              <span style={{ fontSize: 13, fontWeight: 700 }}>{side === 'BUY' ? '應扣款' : '應入帳'}</span>
              <span className="mono" style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.02em' }}>
                ${total.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Cash transaction fields (deposit / withdraw)
function CashTxFields({
  cashSide, setCashSide, amount, setAmount, date, setDate, note, setNote,
  amountNum, currentCash,
}) {
  const cashAfter = (currentCash ?? 0) + (cashSide === 'DEPOSIT' ? amountNum : -amountNum);
  return (
    <>
      {/* Deposit / Withdraw toggle */}
      <div style={{ padding: '4px 18px 8px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {[
            { id: 'DEPOSIT',  label: '存入',  glyph: '↓', bg: 'var(--up)' },
            { id: 'WITHDRAW', label: '提領',  glyph: '↑', bg: 'var(--down)' },
          ].map((m) => {
            const active = cashSide === m.id;
            return (
              <button key={m.id} onClick={() => setCashSide(m.id)} style={{
                height: 48, border: 0, borderRadius: 14, cursor: 'pointer',
                background: active ? m.bg : 'var(--surface-2)',
                color: active ? '#fff' : 'var(--ink-2)',
                fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 14, letterSpacing: '0.02em',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}>
                <span style={{ fontSize: 16 }}>{m.glyph}</span>
                {m.label}
              </button>
            );
          })}
        </div>
      </div>

      <Field
        label="金額"
        hint={cashSide === 'DEPOSIT' ? '美金存入庫存，會同步累加到原始投入總成本' : '從庫存提領，原始投入總成本會減少'}
        right={currentCash != null && (
          <span className="mono" style={{ fontSize: 10, color: 'var(--ink-3)', fontWeight: 500 }}>
            目前庫存 <span style={{ color: 'var(--ink)', fontWeight: 700 }}>${currentCash.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </span>
        )}
      >
        <div style={{ position: 'relative' }}>
          <span style={{
            position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
            color: 'var(--ink-3)', fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 600,
          }}>$</span>
          <TextInput
            type="number" inputMode="decimal" value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            style={{ paddingLeft: 30, fontSize: 22, fontWeight: 700, height: 56 }}
          />
        </div>
      </Field>

      <Field label="日期">
        <TextInput type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </Field>

      <Field label="備註">
        <textarea value={note} onChange={(e) => setNote(e.target.value)}
          placeholder="例：第一銀行換匯、ATM 提領"
          rows={2}
          style={{
            ...inputBaseStyle, height: 'auto', padding: '12px 14px',
            fontFamily: 'var(--font-ui)', fontSize: 13, fontWeight: 400, resize: 'none',
          }} />
      </Field>

      <div style={{ padding: '12px 18px 8px' }}>
        <div style={{
          background: 'var(--surface-2)', borderRadius: 14, padding: '14px 16px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{ fontSize: 13, fontWeight: 700 }}>{cashSide === 'DEPOSIT' ? '美金庫存增加' : '美金庫存減少'}</span>
            <span className="mono" style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em',
              color: cashSide === 'DEPOSIT' ? 'var(--up)' : 'var(--down)' }}>
              {cashSide === 'DEPOSIT' ? '+' : '−'}${amountNum.toFixed(2)}
            </span>
          </div>
          {currentCash != null && amountNum > 0 && (
            <div style={{
              marginTop: 8, paddingTop: 8, borderTop: '1px dashed var(--line-2)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
            }}>
              <span style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 500 }}>調整後庫存</span>
              <span className="mono" style={{ fontSize: 14, fontWeight: 700 }}>
                ${cashAfter.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ─── Trades history Screen
function TradesScreen({ onEdit, onAdd, transactions }) {
  const [filter, setFilter] = useState('ALL');
  const txs = transactions || window.PORTFOLIO.transactions || [];
  const filtered = filter === 'ALL'
    ? txs
    : filter === 'CASH'
      ? txs.filter((t) => t.side === 'DEPOSIT' || t.side === 'WITHDRAW')
      : txs.filter((t) => t.side === filter);

  // Group by yyyy-mm
  const groups = {};
  for (const t of filtered) {
    const k = t.date.slice(0, 7);
    (groups[k] = groups[k] || []).push(t);
  }
  const groupKeys = Object.keys(groups).sort().reverse();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '6px 18px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-0.02em' }}>交易紀錄</div>
        <button onClick={onAdd} style={{
          border: 0, background: 'var(--ink)', color: 'var(--bg)',
          padding: '6px 12px 6px 10px', borderRadius: 999, cursor: 'pointer',
          display: 'inline-flex', alignItems: 'center', gap: 4,
          fontFamily: 'var(--font-ui)', fontSize: 12, fontWeight: 600,
        }}>+ 新增</button>
      </div>

      {/* Filter pills */}
      <div style={{ padding: '4px 14px 12px', display: 'flex', gap: 6, overflowX: 'auto' }}>
        {[
          { id: 'ALL',  label: `全部 · ${txs.length}` },
          { id: 'BUY',  label: `買入 · ${txs.filter(t => t.side === 'BUY').length}` },
          { id: 'SELL', label: `賣出 · ${txs.filter(t => t.side === 'SELL').length}` },
          { id: 'CASH', label: `現金 · ${txs.filter(t => t.side === 'DEPOSIT' || t.side === 'WITHDRAW').length}` },
        ].map((f) => (
          <button key={f.id} onClick={() => setFilter(f.id)} style={{
            border: 0, padding: '6px 12px', borderRadius: 999,
            background: filter === f.id ? 'var(--ink)' : 'var(--surface-2)',
            color: filter === f.id ? 'var(--bg)' : 'var(--ink-2)',
            fontFamily: 'var(--font-ui)', fontSize: 11, fontWeight: 600, cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}>{f.label}</button>
        ))}
      </div>

      <div className="scroll" style={{ flex: 1, overflow: 'auto' }}>
        {groupKeys.map((mo) => {
          return (
            <div key={mo}>
              <div style={{
                padding: '12px 18px 6px', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
                background: 'var(--surface-2)',
              }}>
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', color: 'var(--ink-3)', textTransform: 'uppercase' }}>{mo}</span>
                <span className="mono" style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 600 }}>
                  淨流出 ${groups[mo].reduce((sum, t) => {
                    if (t.side === 'BUY')      return sum + t.shares * t.price;
                    if (t.side === 'SELL')     return sum - t.shares * t.price;
                    if (t.side === 'WITHDRAW') return sum + (t.amount || 0);
                    if (t.side === 'DEPOSIT')  return sum - (t.amount || 0);
                    return sum;
                  }, 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                </span>
              </div>

              {groups[mo].map((t) => {
                const isCash = t.side === 'DEPOSIT' || t.side === 'WITHDRAW';
                const total = isCash ? (t.amount || 0) : t.shares * t.price;
                const isInflow = t.side === 'SELL' || t.side === 'DEPOSIT';
                const isUserTx = typeof t.id === 'string' && t.id.startsWith('u');

                let glyph, glyphBg, glyphFg, label, sublabel;
                if (t.side === 'BUY')      { glyph = '+'; glyphBg = 'var(--up-soft)';   glyphFg = 'var(--up-ink)';   label = `${t.sym}`; sublabel = `${t.shares}股 × $${t.price.toFixed(2)}`; }
                else if (t.side === 'SELL'){ glyph = '−'; glyphBg = 'var(--down-soft)'; glyphFg = 'var(--down-ink)'; label = `${t.sym}`; sublabel = `${t.shares}股 × $${t.price.toFixed(2)}`; }
                else if (t.side === 'DEPOSIT')  { glyph = '↓'; glyphBg = 'var(--up-soft)';   glyphFg = 'var(--up-ink)';   label = '存入'; sublabel = '美金庫存增加'; }
                else if (t.side === 'WITHDRAW') { glyph = '↑'; glyphBg = 'var(--down-soft)'; glyphFg = 'var(--down-ink)'; label = '提領'; sublabel = '美金庫存減少'; }

                return (
                  <button key={t.id} onClick={() => onEdit && onEdit(t)} style={{
                    width: '100%', textAlign: 'left',
                    padding: '12px 18px', display: 'grid',
                    gridTemplateColumns: '36px 1fr auto', gap: 12, alignItems: 'center',
                    borderBottom: '1px solid var(--line)',
                    background: 'transparent', border: 'none', borderBottomWidth: 1, borderBottomStyle: 'solid', borderBottomColor: 'var(--line)',
                    cursor: isUserTx ? 'pointer' : 'default',
                  }}>
                    <span style={{
                      width: 32, height: 32, borderRadius: 10,
                      background: glyphBg, color: glyphFg,
                      display: 'grid', placeItems: 'center',
                      fontSize: 18, fontWeight: 600,
                    }}>{glyph}</span>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
                        <span style={{ fontWeight: 700, fontSize: 13, letterSpacing: '-0.01em' }}>{label}</span>
                        <span className="mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>{sublabel}</span>
                        {!isUserTx && (
                          <span style={{
                            fontSize: 9, fontWeight: 700, color: 'var(--ink-4)',
                            background: 'var(--surface-3)', padding: '1px 5px', borderRadius: 4,
                            letterSpacing: '0.04em',
                          }}>SEED</span>
                        )}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--ink-4)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {t.date} {t.note ? '· ' + t.note : ''}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div className="mono" style={{
                        fontSize: 13, fontWeight: 700, letterSpacing: '-0.01em',
                        color: isInflow ? 'var(--up)' : 'var(--down)',
                      }}>{isInflow ? '+' : '−'}${total.toLocaleString('en-US', { maximumFractionDigits: 2 })}</div>
                      <div style={{ fontSize: 10, color: 'var(--ink-4)', marginTop: 1 }}>{isInflow ? '入帳' : '扣款'}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          );
        })}
        <div style={{ height: 24 }} />
      </div>
    </div>
  );
}

// ─── Placeholders for Research / Profile
function PlaceholderScreen({ title, hint }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <ScreenHeader title={title} />
      <div style={{ flex: 1, display: 'grid', placeItems: 'center', padding: 24, textAlign: 'center' }}>
        <div>
          <div style={{ fontSize: 32, color: 'var(--ink-4)', marginBottom: 8 }}>◇</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink-2)' }}>{title}</div>
          <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 4, maxWidth: 240 }}>{hint}</div>
        </div>
      </div>
    </div>
  );
}

// ─── Profile screen — settings entries
function ProfileScreen({ onEditTabs, onResetTabs }) {
  const Row = ({ glyph, label, hint, onClick, danger }) => (
    <button onClick={onClick} style={{
      width: '100%', textAlign: 'left', border: 0, background: 'transparent',
      cursor: 'pointer', padding: '14px 18px',
      display: 'grid', gridTemplateColumns: '32px 1fr 16px', gap: 12, alignItems: 'center',
      borderBottom: '1px solid var(--line)',
      color: danger ? 'var(--down)' : 'var(--ink)',
    }}>
      <span style={{
        width: 28, height: 28, borderRadius: 8,
        background: 'var(--surface-2)', display: 'grid', placeItems: 'center',
        fontSize: 14, color: danger ? 'var(--down)' : 'var(--ink-2)',
      }}>{glyph}</span>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600 }}>{label}</div>
        {hint && <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>{hint}</div>}
      </div>
      <span style={{ color: 'var(--ink-4)', fontSize: 16 }}>›</span>
    </button>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <ScreenHeader title="Profile" />
      <div className="scroll" style={{ flex: 1, overflow: 'auto' }}>
        <div style={{ padding: '12px 18px 4px', fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', color: 'var(--ink-4)', textTransform: 'uppercase' }}>外觀 · 導覽</div>
        <Row glyph="▦" label="編輯分頁" hint="新增、刪除、改名、重排" onClick={onEditTabs} />
        <Row glyph="↺" label="重設分頁" hint="還原為預設五個分頁" onClick={onResetTabs} />

        <div style={{ padding: '20px 18px 4px', fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', color: 'var(--ink-4)', textTransform: 'uppercase' }}>資料</div>
        <Row glyph="↓" label="匯出 JSON 備份" />
        <Row glyph="↑" label="匯入 JSON 資料" />

        <div style={{ padding: '20px 18px 4px', fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', color: 'var(--ink-4)', textTransform: 'uppercase' }}>連線</div>
        <Row glyph="◉" label="Finnhub API key" hint="未設定 — 將顯示快取價格" />

        <div style={{ padding: '20px 18px 4px', fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', color: 'var(--ink-4)', textTransform: 'uppercase' }}>其他</div>
        <Row glyph="⌫" label="清除所有資料" danger />
      </div>
    </div>
  );
}

// ─── Tab editor screen
const GLYPH_SET = ['◐','◑','○','◇','◆','□','△','▽','☆','⇅','+','↑','↓','◯','▣','◬','★','♦','♥','✦'];

function TabEditorScreen({ tabs, onChange, onBack }) {
  const [pickerOpen, setPickerOpen] = useState(null); // id of row whose glyph picker is open

  const update = (i, patch) => {
    const next = tabs.map((t, idx) => idx === i ? { ...t, ...patch } : t);
    onChange(next);
  };
  const remove = (i) => {
    if (tabs.length <= 2) return;
    onChange(tabs.filter((_, idx) => idx !== i));
  };
  const move = (i, dir) => {
    const j = i + dir;
    if (j < 0 || j >= tabs.length) return;
    const next = [...tabs];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  const add = () => {
    if (tabs.length >= 10) return;
    const id = 'tab-' + Date.now().toString(36);
    onChange([...tabs, { id, label: '新分頁', glyph: '◇' }]);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <ScreenHeader title="編輯分頁" onBack={onBack}
        right={<button onClick={onBack} style={{ border: 0, background: 'transparent', cursor: 'pointer', color: 'var(--accent)', fontSize: 13, fontWeight: 700 }}>完成</button>} />

      <div className="scroll" style={{ flex: 1, overflow: 'auto', paddingBottom: 24 }}>
        <div style={{
          margin: '4px 18px 14px', padding: '10px 14px',
          background: 'var(--surface-2)', borderRadius: 12,
          fontSize: 11, color: 'var(--ink-3)', lineHeight: 1.5,
        }}>
          底部分頁列可自訂。2–10 個之間，超過 5 個時自動變成可左右滑動。
        </div>

        {tabs.map((t, i) => (
          <div key={t.id} style={{
            margin: '0 14px 8px', padding: '10px 12px',
            background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 14,
          }}>
            <div style={{
              display: 'grid', gridTemplateColumns: '36px 1fr auto', gap: 8, alignItems: 'center',
            }}>
              {/* Glyph button */}
              <button onClick={() => setPickerOpen(pickerOpen === t.id ? null : t.id)} style={{
                width: 36, height: 36, borderRadius: 10,
                border: '1px solid ' + (pickerOpen === t.id ? 'var(--ink)' : 'var(--line)'),
                background: 'var(--surface-2)', cursor: 'pointer',
                fontSize: 16, color: 'var(--ink)',
              }}>{t.glyph}</button>

              {/* Label input */}
              <input
                value={t.label}
                onChange={(e) => update(i, { label: e.target.value.slice(0, 12) })}
                placeholder="標籤名稱"
                style={{
                  width: '100%', height: 36, border: '1px solid var(--line)',
                  borderRadius: 10, padding: '0 12px', outline: 'none',
                  fontFamily: 'var(--font-ui)', fontSize: 13, fontWeight: 600,
                  color: 'var(--ink)', background: 'var(--surface)',
                }}
              />

              {/* Actions */}
              <div style={{ display: 'flex', gap: 4 }}>
                <button onClick={() => move(i, -1)} disabled={i === 0} style={{
                  width: 30, height: 36, border: 0, background: 'var(--surface-2)',
                  borderRadius: 8, cursor: i === 0 ? 'not-allowed' : 'pointer',
                  opacity: i === 0 ? 0.3 : 1, fontSize: 14, color: 'var(--ink-2)',
                }}>↑</button>
                <button onClick={() => move(i, +1)} disabled={i === tabs.length - 1} style={{
                  width: 30, height: 36, border: 0, background: 'var(--surface-2)',
                  borderRadius: 8, cursor: i === tabs.length - 1 ? 'not-allowed' : 'pointer',
                  opacity: i === tabs.length - 1 ? 0.3 : 1, fontSize: 14, color: 'var(--ink-2)',
                }}>↓</button>
                <button onClick={() => remove(i)} disabled={tabs.length <= 2} style={{
                  width: 30, height: 36, border: 0, background: tabs.length <= 2 ? 'var(--surface-2)' : 'var(--down-soft)',
                  borderRadius: 8, cursor: tabs.length <= 2 ? 'not-allowed' : 'pointer',
                  opacity: tabs.length <= 2 ? 0.3 : 1,
                  color: 'var(--down)', fontSize: 14, fontWeight: 600,
                }}>×</button>
              </div>
            </div>

            {/* Glyph picker */}
            {pickerOpen === t.id && (
              <div style={{
                marginTop: 10, padding: 8, borderTop: '1px dashed var(--line-2)',
                display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: 4,
              }}>
                {GLYPH_SET.map((g) => (
                  <button key={g} onClick={() => { update(i, { glyph: g }); setPickerOpen(null); }} style={{
                    aspectRatio: '1', border: t.glyph === g ? '1.5px solid var(--ink)' : '1px solid transparent',
                    background: t.glyph === g ? 'var(--surface-2)' : 'transparent',
                    borderRadius: 8, cursor: 'pointer',
                    fontSize: 14, color: 'var(--ink)',
                  }}>{g}</button>
                ))}
              </div>
            )}

            {/* CTA hint */}
            {(t.isCta || t.id === 'Add') && (
              <div style={{
                marginTop: 8, fontSize: 10, color: 'var(--accent)',
                fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase',
              }}>★ 中央強調按鈕</div>
            )}
          </div>
        ))}

        {/* Add tab */}
        <div style={{ padding: '12px 14px 4px' }}>
          <button onClick={add} disabled={tabs.length >= 10} style={{
            width: '100%', height: 44, border: '1.5px dashed var(--line-2)',
            background: 'transparent', borderRadius: 12,
            cursor: tabs.length >= 10 ? 'not-allowed' : 'pointer',
            opacity: tabs.length >= 10 ? 0.4 : 1,
            fontFamily: 'var(--font-ui)', fontSize: 13, fontWeight: 600, color: 'var(--ink-2)',
          }}>+ 新增分頁 {tabs.length >= 10 ? '（已達上限 10）' : `（${tabs.length}/10）`}</button>
        </div>
      </div>
    </div>
  );
}

// ─── Stock detail screen — full info + tag editor + tx history
function StockDetailScreen({ position, transactions, allTags, onBack, onToggleTag, onSetTags, onSetNote, ccy }) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [newTagInput, setNewTagInput] = useState('');
  const [noteEditing, setNoteEditing] = useState(false);
  const [noteDraft, setNoteDraft] = useState('');

  const p = position;
  const val = p.shares * p.price;
  const cost = p.shares * p.avg;
  const pnl = val - cost;
  const pnlPct = cost > 0 ? pnl / cost : 0;
  const tags = p.tags || [];
  const availableNewTags = allTags.filter((t) => !tags.includes(t));

  const fmtUsd = (n) => window.fmt.usd(n);
  const fmtUsdSigned = (n) => window.fmt.usd(n, { sign: true });

  // Sync draft when switching stocks
  useEffect(() => {
    setNoteDraft(p.note || '');
    setNoteEditing(false);
  }, [p.sym]);

  // Transactions for this symbol (passed in or fallback to seed)
  const stockTxs = transactions || (window.PORTFOLIO.transactions || []).filter((t) => t.sym === p.sym);

  const addNewTag = () => {
    const trimmed = newTagInput.trim().slice(0, 12);
    if (!trimmed) return;
    if (tags.includes(trimmed)) return;
    onToggleTag(trimmed);
    setNewTagInput('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <ScreenHeader title={p.sym} onBack={onBack} right={null} />

      <div className="scroll" style={{ flex: 1, overflow: 'auto' }}>
        {/* Big price area */}
        <div style={{ padding: '4px 20px 16px' }}>
          <div style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 500 }}>{p.name}</div>
          <div className="mono" style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-0.03em', marginTop: 4, lineHeight: 1 }}>
            ${window.fmt.num(p.price)}
          </div>
          <div style={{ marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <span className="mono" style={{
              fontSize: 12, fontWeight: 600, padding: '3px 8px', borderRadius: 999,
              background: pnl >= 0 ? 'var(--up-soft)' : 'var(--down-soft)',
              color: pnl >= 0 ? 'var(--up-ink)' : 'var(--down-ink)',
            }}>{pnl >= 0 ? '▲' : '▼'} {fmtUsdSigned(pnl)} · {window.fmt.pct(pnlPct)}</span>
            <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>未實現損益</span>
          </div>
        </div>

        {/* Stat grid */}
        <div style={{ padding: '0 14px 18px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <Stat label="股數" value={window.fmt.shares(p.shares)} unit="股" />
            <Stat label="均價" value={'$' + window.fmt.num(p.avg)} />
            <Stat label="市值" value={fmtUsd(val)} />
            <Stat label="總成本" value={fmtUsd(cost)} />
          </div>
        </div>

        {/* Tag section */}
        <div style={{ padding: '0 18px 6px', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <div style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>標籤 · {tags.length}</div>
          <button onClick={() => setPickerOpen(!pickerOpen)} style={{
            border: 0, background: 'transparent', cursor: 'pointer',
            fontSize: 12, color: 'var(--accent)', fontWeight: 600, padding: 0,
          }}>{pickerOpen ? '完成' : '+ 編輯標籤'}</button>
        </div>

        <div style={{ padding: '4px 14px 16px' }}>
          {/* Current tags */}
          {tags.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {tags.map((tag) => (
                <span key={tag} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  background: 'var(--ink)', color: 'var(--bg)',
                  borderRadius: 999, padding: '5px 4px 5px 10px',
                  fontSize: 11, fontWeight: 600,
                }}>
                  {tag}
                  {pickerOpen && (
                    <button onClick={() => onToggleTag(tag)} style={{
                      width: 16, height: 16, border: 0, borderRadius: 999,
                      background: 'rgba(255,255,255,0.18)',
                      color: 'var(--bg)', cursor: 'pointer',
                      fontSize: 10, fontWeight: 700, padding: 0,
                      display: 'grid', placeItems: 'center',
                    }}>×</button>
                  )}
                </span>
              ))}
            </div>
          )}
          {tags.length === 0 && (
            <div style={{ fontSize: 12, color: 'var(--ink-3)', padding: '4px 0' }}>還沒有標籤 · 點上方「+ 編輯標籤」加入</div>
          )}

          {/* Picker — existing + new */}
          {pickerOpen && (
            <div style={{
              marginTop: 10, padding: 12,
              background: 'var(--surface-2)', borderRadius: 14,
            }}>
              {availableNewTags.length > 0 && (
                <>
                  <div style={{ fontSize: 10, color: 'var(--ink-3)', fontWeight: 600, marginBottom: 6 }}>從現有標籤加入</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                    {availableNewTags.map((tag) => (
                      <button key={tag} onClick={() => onToggleTag(tag)} style={{
                        border: '1px solid var(--line)',
                        background: 'var(--surface)',
                        color: 'var(--ink-2)',
                        padding: '5px 10px', borderRadius: 999, cursor: 'pointer',
                        fontFamily: 'var(--font-ui)', fontSize: 11, fontWeight: 600,
                      }}>+ {tag}</button>
                    ))}
                  </div>
                </>
              )}
              <div style={{ fontSize: 10, color: 'var(--ink-3)', fontWeight: 600, marginBottom: 6 }}>建立新標籤</div>
              <div style={{ display: 'flex', gap: 6 }}>
                <input
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') addNewTag(); }}
                  placeholder="例：我的最愛、長線、AI"
                  style={{
                    flex: 1, height: 36, border: '1px solid var(--line)',
                    borderRadius: 10, padding: '0 12px', outline: 'none',
                    fontFamily: 'var(--font-ui)', fontSize: 12, fontWeight: 500,
                    color: 'var(--ink)', background: 'var(--surface)',
                  }}
                />
                <button onClick={addNewTag} disabled={!newTagInput.trim()} style={{
                  height: 36, padding: '0 14px', border: 0, borderRadius: 10,
                  background: newTagInput.trim() ? 'var(--ink)' : 'var(--surface-3)',
                  color: newTagInput.trim() ? 'var(--bg)' : 'var(--ink-4)',
                  cursor: newTagInput.trim() ? 'pointer' : 'not-allowed',
                  fontFamily: 'var(--font-ui)', fontSize: 12, fontWeight: 700,
                }}>加入</button>
              </div>
              <div style={{ marginTop: 8, fontSize: 10, color: 'var(--ink-4)' }}>新標籤會同時建立對應的分類頁籤。</div>
            </div>
          )}
        </div>

        {/* Note — always shown, always editable */}
        <div style={{ padding: '0 18px 6px', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <div style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>備註</div>
          {noteEditing ? (
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => { setNoteDraft(p.note || ''); setNoteEditing(false); }}
                style={{ border: 0, background: 'transparent', cursor: 'pointer', fontSize: 12, color: 'var(--ink-3)', fontWeight: 600, padding: 0 }}
              >取消</button>
              <button
                onClick={() => { onSetNote && onSetNote(noteDraft); setNoteEditing(false); }}
                style={{ border: 0, background: 'transparent', cursor: 'pointer', fontSize: 12, color: 'var(--accent)', fontWeight: 700, padding: 0 }}
              >儲存</button>
            </div>
          ) : (
            <button
              onClick={() => { setNoteDraft(p.note || ''); setNoteEditing(true); }}
              style={{ border: 0, background: 'transparent', cursor: 'pointer', fontSize: 12, color: 'var(--accent)', fontWeight: 600, padding: 0 }}
            >{p.note ? '編輯' : '+ 新增備註'}</button>
          )}
        </div>
        <div style={{ padding: '4px 18px 16px' }}>
          {noteEditing ? (
            <textarea
              value={noteDraft}
              onChange={(e) => setNoteDraft(e.target.value)}
              placeholder="投資理由、停利停損、技術觀察…"
              autoFocus
              rows={3}
              style={{
                width: '100%', resize: 'vertical', minHeight: 64,
                border: '1px solid var(--line)', borderRadius: 12,
                padding: '10px 14px',
                fontFamily: 'var(--font-ui)', fontSize: 13, fontWeight: 400,
                color: 'var(--ink)', background: 'var(--surface)',
                outline: 'none', lineHeight: 1.5,
                boxSizing: 'border-box',
              }}
            />
          ) : (
            <div
              onClick={() => { setNoteDraft(p.note || ''); setNoteEditing(true); }}
              style={{
                padding: '10px 14px',
                background: p.note ? 'var(--surface-2)' : 'transparent',
                border: p.note ? '1px solid transparent' : '1px dashed var(--line-2)',
                borderRadius: 12,
                fontSize: 13, color: p.note ? 'var(--ink-2)' : 'var(--ink-4)',
                lineHeight: 1.5, cursor: 'pointer', minHeight: 38,
                whiteSpace: 'pre-wrap', wordBreak: 'break-word',
              }}
            >{p.note || '點此新增備註…'}</div>
          )}
        </div>

        {/* Tx history */}
        <div style={{ padding: '4px 18px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <div style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>交易紀錄 · {stockTxs.length}</div>
        </div>
        {stockTxs.length === 0 && (
          <div style={{ padding: '8px 18px 18px', fontSize: 12, color: 'var(--ink-3)' }}>沒有交易紀錄</div>
        )}
        {stockTxs.map((tx) => {
          const isBuy = tx.side === 'BUY';
          const total = tx.shares * tx.price;
          return (
            <div key={tx.id} style={{
              padding: '11px 18px', display: 'grid',
              gridTemplateColumns: '32px 1fr auto', gap: 10, alignItems: 'center',
              borderBottom: '1px solid var(--line)',
            }}>
              <span style={{
                width: 28, height: 28, borderRadius: 8,
                background: isBuy ? 'var(--up-soft)' : 'var(--down-soft)',
                color: isBuy ? 'var(--up-ink)' : 'var(--down-ink)',
                display: 'grid', placeItems: 'center',
                fontSize: 14, fontWeight: 600,
              }}>{isBuy ? '+' : '−'}</span>
              <div>
                <div className="mono" style={{ fontSize: 12, fontWeight: 600 }}>
                  {tx.shares}股 × ${tx.price.toFixed(2)}
                </div>
                <div style={{ fontSize: 10, color: 'var(--ink-4)', marginTop: 1 }}>{tx.date}</div>
              </div>
              <div className="mono" style={{
                fontSize: 12, fontWeight: 700,
                color: isBuy ? 'var(--down)' : 'var(--up)',
              }}>{isBuy ? '−' : '+'}${total.toLocaleString('en-US', { maximumFractionDigits: 2 })}</div>
            </div>
          );
        })}
        <div style={{ height: 24 }} />
      </div>
    </div>
  );
}

function Stat({ label, value, unit }) {
  return (
    <div style={{
      background: 'var(--surface-2)', borderRadius: 12,
      padding: '10px 14px',
    }}>
      <div style={{ fontSize: 10, color: 'var(--ink-3)', fontWeight: 600, letterSpacing: '0.04em' }}>{label}</div>
      <div className="mono" style={{
        marginTop: 4, fontSize: 16, fontWeight: 700, letterSpacing: '-0.02em',
      }}>{value} {unit && <span style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 500 }}>{unit}</span>}</div>
    </div>
  );
}

Object.assign(window, { AddScreen, TradesScreen, PlaceholderScreen, ProfileScreen, TabEditorScreen, StockDetailScreen, ScreenHeader });

