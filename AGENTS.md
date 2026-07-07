# AGENTS.md

此檔案是給開發 Agent 使用的專案操作指南。README.md 面向使用者與維護者；本檔案補充實作細節、可執行指令、測試要求與常見陷阱。

## 專案概覽 (Project Overview)

`smart-toc` / Simple Outliner 是一個 Chrome / Firefox 瀏覽器擴充功能，用於自動偵測網頁主內容並產生浮動 Table of Contents。專案特別支援 Inoreader 與 Feedly 網頁版閱讀器，可透過 options page 自訂文章區塊 selector。

### 核心技術

- **語言**：TypeScript、少量瀏覽器端 JavaScript。
- **UI**：Mithril.js，用於 content script 中的 TOC UI。
- **打包**：Rollup，content script 入口為 `src/content/index.ts`，輸出為 `dist/toc.js`。
- **瀏覽器擴充功能**：Manifest V3，manifest 與背景/options 檔案位於 `src/background/`。
- **套件管理**：pnpm。
- **Node 版本**：`24.18.x`，版本檔為 `.node-version` 與 `.nvmrc`。

### 重要目錄

- `src/content/`：content script、TOC 偵測、TOC UI、樣式與共用設定。
- `src/background/`：`manifest.json`、service worker、options page、icons、背景端設定 helper。
- `src/types/`：TypeScript 模組宣告。
- `test/`：Node test runner 測試與手動測試目標清單。
- `dist/`：本機載入 Chrome/Firefox 測試用的 unpacked extension 輸出。
- `chrome/`：Chrome 發行 zip 輸出。
- `firefox/`：Firefox 套件與 source zip 輸出。

## 設定指令 (Setup Commands)

使用 pnpm 安裝相依性：

```bash
pnpm install
```

若本機沒有 pnpm，先使用 Corepack：

```bash
corepack enable
corepack prepare pnpm@11.10.0 --activate
```

> [!NOTE]
> 以 `pnpm-lock.yaml` 為唯一相依性鎖定檔。不要重新引入其他套件管理器的 lockfile。

## 開發工作流程 (Development Workflow)

啟動開發監看：

```bash
pnpm run start
```

此指令會：

1. 設定 `ENV=development`。
2. 執行 `pnpm run build:background`，將 `src/background/*` 複製到 `dist/`。
3. 啟動 Rollup watch，將 `src/content/index.ts` bundle 成 `dist/toc.js`。

### 載入 Chrome 測試

1. 開啟 `chrome://extensions/`。
2. 啟用 **Developer mode**。
3. 點選 **Load unpacked**。
4. 選擇專案根目錄下的 `dist/`。
5. 修改 background/options/manifest 後，需在 extensions 頁面重新載入 extension。

### 開發注意事項

- `src/background/*.js` 不經 Rollup bundle，會直接複製到 `dist/`。請保持 service worker 與 options script 為瀏覽器可直接執行的 JavaScript。
- `src/background/background.js` 使用 `importScripts('settings.js')` 載入背景端設定 helper。
- `src/content/settings.ts` 與 `src/background/settings.js` 都包含設定正規化邏輯；若變更 storage key、預設值或 domain normalization，兩端都要同步並更新測試。
- `rollup.config.js` 會精準替換 `process.env.ENV`。不要改回替換整個 `process.env`，否則 content script 可能在瀏覽器發生 `process is not defined`。
- 修改 TOC 外觀時，優先調整 `src/content/style/toc.css` 與 `src/content/ui/`，避免在 content script 入口塞入樣式邏輯。

## 測試說明 (Testing Instructions)

執行自動化測試：

```bash
pnpm test
```

執行 TypeScript 檢查：

```bash
pnpm run lint
```

監看 TypeScript 檢查：

```bash
pnpm run lint:watch
```

建議提交前至少執行：

```bash
pnpm test
pnpm run lint
pnpm run build
```

### 測試檔案慣例

- 測試使用 Node.js 內建 test runner，透過 `tsx --test test/**/*.test.ts` 執行。
- 新增或修改純邏輯 helper 時，優先新增 `test/*.test.ts`。
- 設定相關測試目前涵蓋：
  - `test/settings.test.ts`：content 端設定正規化。
  - `test/background-settings.test.ts`：background/options 端設定正規化。

### 手動測試

修改文章偵測、標題階層、捲動或樣式後，參考 `test/list.md` 的網站清單做瀏覽器手動測試。至少確認：

1. TOC 是否能生成。
2. h1 到 h6 層級與縮排是否合理。
3. 點選目錄項目是否平滑跳轉到對應標題。
4. Light/Dark theme 與 font size 在不同網站背景下是否可讀。
5. 負面網站清單加入 domain 後，該 domain 不再載入 TOC。
6. Context menu 的 **Reset TOC Position** 與 **Disable Smart TOC on this domain** 是否正常。

## 程式碼風格 (Code Style)

- 使用 TypeScript ESNext module 寫 content 端程式。
- 使用瀏覽器可直接執行的 JavaScript 寫 `src/background/` 下的 service worker/options helper。
- Prettier 設定位於 `prettier.config.js`：
  - `semi: false`
  - `singleQuote: true`
  - `trailingComma: 'all'`
  - `arrowParens: 'always'`
- 專案 `tsconfig.json` 保留部分嚴格檢查，例如 `strictNullChecks`、`strictFunctionTypes`、`strictPropertyInitialization`、`noImplicitThis`。
- 不要直接手動編輯 `dist/toc.js`；請修改 `src/content/` 並重新建置。
- 不要把 Chrome/Firefox 建置輸出當成 source of truth；source of truth 在 `src/`、`package.json`、`pnpm-lock.yaml` 與測試。

## 建置與打包 (Build and Deployment)

清除輸出：

```bash
pnpm run clean
```

只建 content script：

```bash
pnpm run build:content
```

只複製 background/options/manifest/icons：

```bash
pnpm run build:background
```

完整建置與打包：

```bash
pnpm run build
```

輸出：

- `dist/`：unpacked extension，可直接載入瀏覽器測試。
- `chrome/smart-toc.zip`：Chrome 發行包。
- `firefox/simple_outliner_-<version>.zip`：Firefox extension 套件。
- `firefox/smart-toc_source.zip`：Firefox source zip。

> [!IMPORTANT]
> `pnpm run build` 會清除並重建 `dist/`、`chrome/`、`firefox/`。若正在用 Chrome 載入 `dist/`，建置後需重新載入 extension。

## 設定與行為模型

主要設定儲存在 `chrome.storage.local`：

- `autoType`：`0` 停用、`1` 所有網頁、`2` 僅 Inoreader / Feedly。
- `isShowTip`：是否顯示偵測失敗提示。
- `isRememberPos`：是否記住 TOC 位置。
- `selectorInoreader` / `selectorFeedly`：閱讀器文章區塊 selector。
- `theme`：`light` 或 `dark`。
- `fontSize`：TOC px 字級，正規化範圍為 8 到 32。
- `disabledDomains`：負面網站清單，domain 會正規化、去重並移除 `www.`。
- `smarttoc_offset`：TOC 位置偏移。

修改這些設定時，請同步檢查：

- `src/content/settings.ts`
- `src/background/settings.js`
- `src/background/options.html`
- `src/background/options.js`
- `src/background/background.js`
- 相關 `test/*.test.ts`

## 安全考量 (Security Considerations)

- 此 extension 具備 `activeTab`、`storage`、`contextMenus`、`scripting` 權限與 `http://*/*` / `https://*/*` host permissions。新增權限前需確認必要性。
- 不要在 repository 中加入 secrets、token、私鑰或真實使用者資料。
- Content script 會在一般網頁環境中執行；避免注入不可信 HTML，TOC 文字應維持為文字節點或 Mithril 安全輸出。
- Options page 的 CSP 在 `src/background/manifest.json` 與 `src/background/options.html`，修改 inline script/style 前要確認 MV3 限制。

## Pull Request 與 Commit 指南

- Commit 訊息優先使用 Conventional Commits，例如：
  - `feat(extension): 新增 TOC 設定`
  - `fix(build): 移除 content bundle 的 process.env`
  - `docs(readme): 更新 pnpm 建置說明`
- PR 或提交前確認：
  - `pnpm test`
  - `pnpm run lint`
  - `pnpm run build`
- 若變更影響瀏覽器行為，請在說明中列出手動測試過的網站或情境。

## 偵錯與疑難排解 (Debugging and Troubleshooting)

### Browser console 出現 `process is not defined`

1. 執行 `pnpm run build`。
2. 確認 `dist/toc.js` 不包含 `process.env`。
3. 在 `chrome://extensions/` 重新載入 extension。
4. 刷新目標網頁。

### Options page 更新後 content script 沒反應

- 確認 `chrome.storage.onChanged` 的 key 是否包含新設定。
- 若新增 storage key，更新 content/background 兩端 settings helper 與測試。

### Inoreader / Feedly 偵測失敗

- 檢查 options page 中的 selector 是否仍符合網站 DOM。
- 檢查 `src/content/lib/extract.ts` 與 `src/content/index.ts` 中閱讀器分支。

### pnpm install 因 build script policy 失敗

- `pnpm-workspace.yaml` 目前允許 `esbuild` build script。
- 若新增工具帶來新的 native/build script，先理解需求再更新允許清單。
