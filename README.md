<p align="center">
  <img src="src/background/icon_128.png" alt="Simple Outliner icon" width="96" height="96" />
</p>

# Simple Outliner / 智慧網頁大綱

![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-4285F4?style=flat-square&logo=googlechrome&logoColor=white)
![Firefox Extension](https://img.shields.io/badge/Firefox-Extension-FF7139?style=flat-square&logo=firefoxbrowser&logoColor=white)
![Manifest V3](https://img.shields.io/badge/Manifest-V3-4B5563?style=flat-square)
![TypeScript](https://img.shields.io/badge/TypeScript-6.x-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-24.18-3C873A?style=flat-square&logo=nodedotjs&logoColor=white)
![pnpm](https://img.shields.io/badge/pnpm-11.x-F69220?style=flat-square&logo=pnpm&logoColor=white)

Simple Outliner 是一個 Chrome / Firefox 瀏覽器擴充功能，會自動偵測網頁主內容並產生可點選的 Table of Contents。它也針對 Inoreader 與 Feedly 網頁版閱讀器提供專門的文章區塊選取器設定。

 [功能](#功能) · [本機開發](#本機開發) · [建置與打包](#建置與打包)

> [!NOTE]
> 目前專案使用 `pnpm` 與 Node.js `24.18.x`。請以 `pnpm-lock.yaml` 作為相依性鎖定檔。

## 功能

- 自動從網頁標題結構產生可浮動的 TOC。
- 支援點選目錄項目後平滑捲動到對應標題。
- 支援 Chrome action 與快捷鍵載入 / 卸載 TOC，預設快捷鍵為 `Ctrl+Shift+E`，macOS 為 `Command+Shift+E`。
- 針對 Inoreader / Feedly 可自訂文章內容 DOM selector。
- 可在選項頁設定：
  - 自動載入模式：停用、所有網頁、僅 Inoreader / Feedly。
  - TOC 風格：`Light` / `Dark`。
  - TOC 字型大小：`8` 到 `32` px。
  - 是否顯示偵測提示、是否記住 TOC 位置。
  - 負面網站清單：列入後該 domain 不啟用 TOC。
- Context Menu 提供：
  - 重設 TOC 位置。
  - 將目前分頁 domain 加入負面網站清單。

## 技術棧

- **Browser extension**：Chrome / Firefox，Manifest V3。
- **Language**：TypeScript。
- **UI**：Mithril.js。
- **Bundler**：Rollup。
- **Package manager**：pnpm。
- **Firefox packaging**：web-ext。

## 專案結構

```text
src/
  background/       # manifest、service worker、options page、icons
  content/          # content script、TOC 產生與 UI 渲染
  types/            # TypeScript 型別宣告
test/               # 自動化測試與手動測試目標清單
dist/               # 可載入瀏覽器測試的 unpacked extension
chrome/             # Chrome 發行 zip
firefox/            # Firefox 套件與 source zip
```

## 需求

- Node.js `24.18.x`
- pnpm `11.10.0` 或更新版本

如果本機尚未安裝 pnpm，可使用 Corepack：

```bash
corepack enable
corepack prepare pnpm@11.10.0 --activate
```

## 本機開發

安裝相依套件：

```bash
pnpm install
```

啟動開發監控：

```bash
pnpm run start
```

這個指令會複製 `src/background` 到 `dist/`，並用 Rollup 監控 `src/content/index.ts` 及其相依檔案。

### 載入 Chrome 測試

1. 開啟 `chrome://extensions/`。
2. 啟用右上角的 **Developer mode**。
3. 點選 **Load unpacked**。
4. 選擇此專案的 `dist/` 資料夾。
5. 修改後若不是 content bundle watch 自動產物，請在 extensions 頁面重新載入擴充功能。

> [!TIP]
> 若 Chrome DevTools 顯示 content script 仍在執行舊版 `toc.js`，請重新載入 unpacked extension，並刷新目標網頁。

## 測試與檢查

執行自動化測試：

```bash
pnpm test
```

執行 TypeScript 檢查：

```bash
pnpm run lint
```

開發時監控型別檢查：

```bash
pnpm run lint:watch
```

手動測試可參考 [`test/list.md`](test/list.md)，涵蓋 Wikipedia、Pony Foo、npm package 頁面等不同內容結構。修改 TOC 偵測、層級縮排、捲動或樣式時，建議至少測試一般文章頁、長文件頁，以及 Inoreader / Feedly。

## 建置與打包

清除建置輸出：

```bash
pnpm run clean
```

完整建置 Chrome 與 Firefox 發行檔：

```bash
pnpm run build
```

輸出內容：

- `dist/`：本機瀏覽器測試用的 unpacked extension。
- `chrome/smart-toc.zip`：Chrome 發行壓縮檔。
- `firefox/*.zip`：Firefox extension 套件與 source zip。

只打包單一目標：

```bash
pnpm run build:chrome
pnpm run build:firefox
```

## 常見問題

### DevTools 顯示 `process is not defined`

請重新執行：

```bash
pnpm run build
```

接著在 `chrome://extensions/` 重新載入 unpacked extension，並刷新目標頁面。`dist/toc.js` 不應包含 `process.env`。

### TOC 沒有出現

- 確認目前 domain 未列在選項頁的負面網站清單。
- 確認自動載入模式不是停用。
- 對於 Inoreader / Feedly，確認文章 selector 仍符合網站目前 DOM。
- 可用 extension action 或 `Ctrl+Shift+E` 手動切換 TOC。

### 樣式或位置不符合預期

- 在選項頁切換 `Light` / `Dark`。
- 調整 TOC font size。
- 透過 extension context menu 執行 **Reset TOC Position**。
