# GCA · 美股記帳 — PWA 部署指南

純前端、零後端、資料留本機（localStorage）。可以變成手機 App 圖示，離線可用。

---

## 一、先在本機跑跑看

```bash
# 在專案資料夾打開終端機，擇一執行
python3 -m http.server 8080
# 或
npx serve
# 或
php -S localhost:8080
```

開 `http://localhost:8080/美股記帳.html`。

⚠️ **直接雙擊 HTML 開啟（`file://`）會無法註冊 service worker**，PWA 需要 `http://` 或 `https://`。

---

## 二、部署到雲端（免費，3 個選項）

### 選項 A · Cloudflare Pages — 最推

1. 把專案 push 到 GitHub。
2. 到 [pages.cloudflare.com](https://pages.cloudflare.com)，**Connect to Git** → 選 repo。
3. Framework preset: **None**, Build command: 空白, Output dir: `/`
4. 部署完成 → 拿到 `xxx.pages.dev` 網址。
5. （選）綁定自己的網域：Custom domains → Set up a custom domain。

### 選項 B · Netlify — 拖拉就好

1. 到 [app.netlify.com/drop](https://app.netlify.com/drop)
2. **直接把整個專案資料夾拖進去**
3. 拿到 `xxx.netlify.app` 網址

### 選項 C · GitHub Pages

1. 把專案 push 到 GitHub repo（public）。
2. Repo Settings → Pages → Source: `Deploy from a branch` → `main / root`。
3. 拿到 `username.github.io/repo-name/` 網址。
4. **記得**：`美股記帳.html` 因為中文檔名要 URL encode，路徑會變成 `%E7%BE%8E%E8%82%A1%E8%A8%98%E5%B8%B3.html`。如果要避免，可把檔名改成 `index.html`（PWA 自動會用根路徑）。

---

## 三、在手機上「安裝」

### iPhone（Safari）
1. 開網址 → 點分享按鈕 → **加入主畫面**
2. App 圖示出現在桌面，點開就是全螢幕模式
3. 第一次安裝後即使離線也能用

### Android（Chrome）
1. 開網址 → 通常右下角會跳出「安裝 App」橫條
2. 或點右上角選單 → **加入主畫面 / 安裝應用程式**

---

## 四、更新 App

改了程式之後：

1. 修改 `sw.js` 裡的 `CACHE_VERSION = 'gca-v1'` → 改成 `gca-v2`（或任何新字串）
2. 重新部署
3. 使用者下次開啟會背景下載新版，下下次開啟生效

不改 version 會吃到舊的 cache。

---

## 五、資料同步 / 備份

目前資料全部存在瀏覽器的 `localStorage`，**不會自動同步到其他裝置**。

- 換手機前：（之後我可以幫你做）→ Profile 加「匯出 JSON」按鈕 → 把 JSON 存到 iCloud / Google Drive
- 新手機：開 App → 「匯入 JSON」

要做這個告訴我。

---

## 六、接真實股價（之後）

目前 `data.js` 是寫死的價格。接 [Finnhub](https://finnhub.io)（免費 60 req/min，CORS 允許）：

1. 註冊拿 API key
2. App 加設定頁讓使用者貼 key（存 localStorage）
3. 開盤時間每 30 秒輪詢一次，或用 WebSocket

要做這個也告訴我。

---

## 檔案結構

```
美股記帳.html          ← 主入口
data.js                ← 種子資料（從 sheet 匯入的持倉）
shared.jsx             ← 共用元件（Phone shell, Spark, TabBar...）
screens.jsx            ← 各畫面（AddScreen, TradesScreen, StockDetailScreen...）
tracker.jsx            ← 主應用程式（Tracker, PortfolioScreen, summary）
tweaks-panel.jsx       ← Tweaks 面板（即時樣式切換）
styles.css             ← 設計系統 tokens

manifest.webmanifest   ← PWA manifest
sw.js                  ← Service worker（cache + offline）
icons/                 ← App 圖示（192/512/maskable）
```
