// ───────────────────────────────────────────────────────────
// Portfolio data — imported from "2026美股比例 - 0518.csv"
//   Filtered to positions with shares > 0.
//   Stocks fully sold by 5/18 (UUUU / CCJ / EOSE) are excluded
//   per import rule; their realized PnL is rolled into cash.
// ───────────────────────────────────────────────────────────

window.PORTFOLIO = {
  // Display label for "資料日期" — falls back to today's date at runtime.
  // The Portfolio screen uses new Date() so it always shows today.
  asOf: '2026-05-18 (Google Sheet 匯入)',
  usdCash: 9366.89,                // 美金庫存 (0518)
  realizedPnL: 1304.60,            // 26/02/26 前已實現獲利
  totalDeposited: 18635.02,        // 原始投入總成本
  fxUsdTwd: 31.58,                 // ~預估現值 TWD / 預估現值 USD
  positions: [
    // (AI All) 鏟子
    { sym: 'NVDA',  name: '輝達 NVIDIA',           sector: 'AI 鏟子',   tags: ['AI 鏟子', '利潤倉'], shares: 10, avg: 180.578,    price: 225.32, day: 0, note: '有利潤倉❤', spark: [200,205,210,215,212,218,222,220,224,223,225.32] },
    { sym: 'AVGO',  name: '博通 Broadcom',         sector: 'AI 鏟子',   tags: ['AI 鏟子'],          shares: 2,  avg: 323.25,     price: 425.19, day: 0, spark: [380,390,395,400,405,415,418,420,422,424,425.19] },

    // 記憶體
    { sym: 'MU',    name: 'Micron 記憶體',         sector: '記憶體',    tags: ['記憶體'],            shares: 2,  avg: 410.58,     price: 724.66, day: 0, spark: [700,720,740,760,750,770,755,740,730,725,724.66] },

    // 先進封裝
    { sym: 'ONTO',  name: 'Onto Innovation 先進封裝', sector: '先進封裝', tags: ['先進封裝'],         shares: 3,  avg: 288.043333, price: 271.77, day: 0, spark: [295,290,288,285,282,280,278,277,275,273,271.77] },
    { sym: 'AMKR',  name: '艾克爾 Amkor',          sector: '先進封裝', tags: ['先進封裝'],          shares: 5,  avg: 76.956,     price: 70.35,  day: 0, note: '2028', spark: [80,79,78,77,76,75,74,73,72,71,70.35] },
    { sym: 'ASX',   name: '日月光 ASE Technology', sector: '先進封裝', tags: ['先進封裝'],          shares: 5,  avg: 35.288,     price: 33.81,  day: 0, spark: [36,35.5,35,34.8,34.5,34.2,34,33.9,33.85,33.82,33.81] },

    // 光通訊
    { sym: 'GLW',   name: '康寧 Corning 光通訊',   sector: '光通訊',    tags: ['光通訊'],            shares: 10, avg: 167.338,    price: 191.81, day: 0, spark: [180,185,190,195,198,200,202,198,195,193,191.81] },
    { sym: 'GLWG',  name: '2x 康寧',               sector: '光通訊',    tags: ['光通訊'],            shares: 5,  avg: 32.10,      price: 29.11,  day: 0, spark: [31,31.5,32,32.5,33,33.5,33.2,31.8,30,29.5,29.11] },

    // 控制晶片
    { sym: 'RMBS',  name: 'Rambus 藍博士',         sector: '控制晶片', tags: ['控制晶片'],         shares: 5,  avg: 129.554,    price: 127.05, day: 0, spark: [125,128,130,132,131,133,134,132,130,128,127.05] },

    // 能源
    { sym: 'SMR',   name: 'NuScale Power 核能',    sector: '能源',     tags: ['能源'],              shares: 5,  avg: 41.21,      price: 11.23,  day: 0, spark: [13,12.5,12,11.8,11.6,11.5,11.4,11.3,11.25,11.23,11.23] },

    // 軍工
    { sym: 'ONDS',  name: 'Ondas Holdings',        sector: '軍工',     tags: ['軍工', '利潤倉'],    shares: 320, avg: 7.957406,  price: 10.62, day: 0, note: '利潤倉❤', spark: [8.86,9.2,9.5,9.8,10,10.2,10.4,10.5,10.55,10.6,10.62] },

    // ETF
    { sym: 'VT',    name: 'Vanguard 全球型 ETF',   sector: 'ETF',      tags: ['ETF'],               shares: 10, avg: 142.03,     price: 153.52, day: 0, spark: [145,148,150,152,151,153,154,153.8,153.7,153.6,153.52] },

    // 平台
    { sym: 'AMZN',  name: '亞馬遜 Amazon',         sector: '平台',     tags: ['平台'],              shares: 3,  avg: 234.966667, price: 264.14, day: 0, spark: [255,258,260,262,263,264,265,264.5,264.3,264.2,264.14] },

    // 貴金屬
    { sym: 'SLV',   name: 'iShares 白銀',          sector: '貴金屬',   tags: ['貴金屬'],            shares: 5,  avg: 99.446,     price: 69.04,  day: 0, spark: [79,77,75,73,72,71,70,69.5,69.2,69.1,69.04] },
  ],
};

// Auto-generate one BUY transaction per position for the Trades screen.
// Replace with real history when transaction data is available.
window.PORTFOLIO.transactions = window.PORTFOLIO.positions.map((p, i) => ({
  id: 't' + String(i + 1).padStart(3, '0'),
  sym: p.sym,
  side: 'BUY',
  shares: p.shares,
  price: p.avg,
  fee: 0.99,
  date: '2026-01-30',
  note: p.note || p.sector,
})).reverse();

// Compute summary
//   Matches the user's spreadsheet conventions:
//   - 預估現值: current positions value ONLY (excludes cash)
//   - 原始成本: total ever-deposited (p.totalDeposited) if provided,
//              otherwise falls back to current positions' cost basis
//   - 未實現損益: 預估現值 - 原始成本  (sheet semantics)
//   - 累積淨盈餘: (預估現值 + 美金庫存) - 原始成本
window.computeSummary = function (p) {
  let positionsCost = 0, value = 0, todayChg = 0;
  for (const pos of p.positions) {
    positionsCost += pos.shares * pos.avg;
    value += pos.shares * pos.price;
    todayChg += pos.shares * pos.price * pos.day;
  }
  const basis = p.totalDeposited != null ? p.totalDeposited : positionsCost;
  const unrealized = value - basis;
  const totalPortfolio = value + p.usdCash;
  const netCumulative = totalPortfolio - basis;
  return {
    positionsCost,
    cost: basis,           // shown as 原始成本
    value,                 // shown as 預估現值 (big number)
    unrealized,
    unrealizedPct: basis > 0 ? unrealized / basis : 0,
    todayChg,
    todayPct: value > 0 ? todayChg / value : 0,
    totalPortfolio,
    netCumulative,
  };
};

// Format helpers
window.fmt = {
  usd: (n, opts = {}) => {
    const sign = opts.sign && n > 0 ? '+' : (n < 0 ? '-' : '');
    const abs = Math.abs(n);
    return sign + '$' + abs.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  },
  twd: (n) => 'NT$' + Math.round(n).toLocaleString('en-US'),
  pct: (n) => (n > 0 ? '+' : '') + (n * 100).toFixed(2) + '%',
  num: (n, d = 2) => n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d }),
  shares: (n) => n.toLocaleString('en-US'),
};
