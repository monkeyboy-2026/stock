// App — design canvas composing the 3 variants + design notes
const { createRoot } = ReactDOM;

function NotesCard() {
  return (
    <div style={{
      width: 760, padding: '32px 36px', background: 'var(--surface)',
      borderRadius: 'var(--r-lg)', border: '1px solid var(--line)',
      fontFamily: 'var(--font-ui)', color: 'var(--ink)',
    }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-3)' }}>Design rationale</div>
      <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em', margin: '6px 0 14px' }}>美股記帳 — 三種資訊架構</h1>
      <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--ink-2)', margin: 0, maxWidth: 620 }}>
        三個方向都建在同一套設計系統上（白底 + Manrope + JetBrains Mono 數字 + 美股慣例綠漲紅跌），
        差別在於<strong>主畫面如何排列資訊</strong>。每個變體都顯示相同的計算：預估現值、原始成本、未實現損益、美金庫存、累積淨盈餘。
      </p>

      <div style={{ marginTop: 24, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 18 }}>
        {[
          { tag: 'A · Dashboard', headline: '單一焦點 + 4 格指標', body: '頂部大數字壓陣，下方 2×2 卡片補齊細節，持倉清單緊湊。最適合每天打開只想看「我今天賺/賠多少」的人。' },
          { tag: 'B · Table',     headline: '深色摘要條 + 緊湊表格', body: '把所有摘要疊進一張深色卡，下方表格 3 欄高密度顯示。資訊量最大，最像專業券商。可切換排序：市值 / 損益 / 今日 / 代號。' },
          { tag: 'C · Cards',     headline: '橫向 chips + 大卡片',  body: '摘要做成橫向滑動的 chips，下方每檔股票一張大卡片（含 sparkline 與配置佔比）。最適合喜歡視覺化、不介意捲動的使用者。' },
        ].map((v) => (
          <div key={v.tag}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, color: 'var(--accent)' }}>{v.tag}</div>
            <div style={{ fontSize: 14, fontWeight: 700, marginTop: 4, letterSpacing: '-0.01em' }}>{v.headline}</div>
            <div style={{ fontSize: 12, lineHeight: 1.55, color: 'var(--ink-2)', marginTop: 6 }}>{v.body}</div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 28, padding: '16px 18px', background: 'var(--surface-2)', borderRadius: 'var(--r-md)' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink)' }}>關於即時股價</div>
        <div style={{ fontSize: 12, lineHeight: 1.6, color: 'var(--ink-2)', marginTop: 4 }}>
          原型內為 mock 資料。實作建議接 <span className="mono" style={{ background: 'var(--surface)', padding: '1px 5px', borderRadius: 4 }}>Finnhub</span>、
          <span className="mono" style={{ background: 'var(--surface)', padding: '1px 5px', borderRadius: 4, marginLeft: 4 }}>Polygon.io</span>、
          <span className="mono" style={{ background: 'var(--surface)', padding: '1px 5px', borderRadius: 4, marginLeft: 4 }}>Alpha Vantage</span> 或
          <span className="mono" style={{ background: 'var(--surface)', padding: '1px 5px', borderRadius: 4, marginLeft: 4 }}>IEX Cloud</span>。
          延遲 15 分鐘的免費方案通常已足夠記帳用途；要逐筆 tick 則需付費方案。建議以 WebSocket 訂閱持倉股票，並用 localStorage cache 一份做離線顯示。
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <DesignCanvas>
      <DCSection id="notes" title="Design notes" subtitle="從這裡開始 — 三個方向的取捨">
        <DCArtboard id="rationale" label="設計說明" width={760} height={520} style={{ background: 'transparent', boxShadow: 'none' }}>
          <NotesCard />
        </DCArtboard>
      </DCSection>

      <DCSection id="variants" title="3 個變體" subtitle="同一套資料、同一套設計系統，3 種資訊架構 — 拖曳排序，點任一張進入 focus mode">
        <DCArtboard id="dashboard" label="A · Dashboard" width={390} height={812}>
          <VariantDashboard />
        </DCArtboard>
        <DCArtboard id="table" label="B · 表格" width={390} height={812}>
          <VariantTable />
        </DCArtboard>
        <DCArtboard id="cards" label="C · 卡片" width={390} height={812}>
          <VariantCards />
        </DCArtboard>
      </DCSection>
    </DesignCanvas>
  );
}

createRoot(document.getElementById('root')).render(<App />);
