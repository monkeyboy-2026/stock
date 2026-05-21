// Finnhub price API + localStorage cache
// Loaded after data.js, before tracker.jsx

window.PriceAPI = {
  KEY_LS: 'gca.finnhubKey',
  CACHE_LS: 'gca.priceCache.v1',
  TS_LS: 'gca.priceTs',

  getKey() { return localStorage.getItem(this.KEY_LS) || ''; },
  setKey(k) {
    if (k) localStorage.setItem(this.KEY_LS, k);
    else localStorage.removeItem(this.KEY_LS);
  },

  getCachedPrices() {
    try { return JSON.parse(localStorage.getItem(this.CACHE_LS) || '{}'); }
    catch { return {}; }
  },
  setCachedPrices(prices) {
    try {
      localStorage.setItem(this.CACHE_LS, JSON.stringify(prices));
      localStorage.setItem(this.TS_LS, Date.now().toString());
    } catch {}
  },
  getLastUpdate() {
    return parseInt(localStorage.getItem(this.TS_LS), 10) || 0;
  },

  // Fetch one quote. Throws on failure.
  async fetchOne(sym, key) {
    const url = `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(sym)}&token=${encodeURIComponent(key)}`;
    const r = await fetch(url);
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const d = await r.json();
    if (typeof d.c !== 'number' || d.c === 0) throw new Error('No price');
    return {
      price: d.c,
      day: (typeof d.dp === 'number' ? d.dp : 0) / 100,
      prevClose: d.pc,
    };
  },

  // Test a key with a single AAPL fetch. Returns { ok: true } or { ok: false, error }.
  async testKey(key) {
    try {
      await this.fetchOne('AAPL', key);
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e.message || String(e) };
    }
  },

  // Batch fetch with small concurrency. Returns map of sym → { price, day }.
  async fetchAll(syms, key, onProgress) {
    const out = {};
    let done = 0;
    const CONCURRENCY = 4;
    const queue = [...syms];
    const workers = [];
    for (let i = 0; i < CONCURRENCY; i++) {
      workers.push((async () => {
        while (queue.length) {
          const s = queue.shift();
          try {
            out[s] = await this.fetchOne(s, key);
          } catch (e) {
            // ignore failed symbol; keep going
          }
          done++;
          if (onProgress) onProgress(done, syms.length);
        }
      })());
    }
    await Promise.all(workers);
    return out;
  },

  // Full refresh — fetches all given symbols, merges into cache, returns final map.
  async refresh(syms, onProgress) {
    const key = this.getKey();
    if (!key) throw new Error('沒有 API key');
    if (!syms.length) return this.getCachedPrices();
    const fresh = await this.fetchAll(syms, key, onProgress);
    const merged = { ...this.getCachedPrices(), ...fresh };
    this.setCachedPrices(merged);
    return merged;
  },
};
