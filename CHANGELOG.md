# Changelog

所有值得使用者與維護者注意的變更都會記錄在此檔案。

## [0.7.5] - 2026-07-07

### 新功能

- **新增 TOC 顯示設定**：選項頁現在可切換 `Light` / `Dark` 目錄風格，並可輸入 8 到 32 px 的 TOC 字型大小。
- **新增負面網站清單**：可在選項頁加入不啟用 TOC 的 domain。列入清單後，自動載入與手動啟用都會避開該網站。
- **新增快速加入負面清單的右鍵選單**：可從 extension context menu 將目前分頁 domain 加入負面網站清單。

### 改進

- **改用 pnpm 與 Node.js 24.18 建置**：專案相依性與建置流程改為使用 pnpm，並新增 Node 版本檔，讓開發與發行環境更一致。
- **更新依賴至最新版**：Rollup、TypeScript、web-ext、Mithril 與相關型別套件已更新，並同步調整 Rollup 4 建置設定。
- **簡化 options page**：移除不再使用的 Twitter 相關選項腳本與 CSP 設定，降低 options page 的維護負擔。
- **改善繁體中文在地化文字**：更新 extension 名稱、描述與開發註解用語，讓介面文字更貼近台灣繁體中文。

### 修正

- **修正 content script 在瀏覽器執行時的 `process is not defined` 錯誤**：Rollup 現在會正確替換 `process.env.ENV`，避免瀏覽器執行 `toc.js` 時引用 Node.js 專用全域變數。
- **修正 Inoreader / Feedly selector 設定讀取時機**：content script 會使用已正規化的目前設定來偵測閱讀器文章區塊，避免非同步 storage 讀取造成 selector 不一致。

### 文件與測試

- **新增自動化測試**：加入 content/background settings helper 測試，涵蓋 theme、font size、domain normalization 與負面網站清單判斷。
- **更新 README**：補齊目前功能、pnpm 工作流程、測試指令、打包輸出與常見問題。
- **新增 AGENTS.md**：提供開發 Agent 所需的專案結構、建置流程、測試要求、設定模型與除錯提示。
