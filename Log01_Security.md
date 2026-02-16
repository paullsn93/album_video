# Log01: 安全性修復與金鑰管理優化

**日期：** 2026-02-16
**性質：** 緊急安全性修復

## 1. 問題概述
在開發過程中，Google Firebase API Key 被直接寫死在 `App.jsx` 與 `firebase.js` 中，並推送到公開的 GitHub 倉庫。這導致任何人都可以在網路上取得連線權限。

## 2. 採取行動
為了在維持程式運作的前提下解決此問題，執行了以下操作：

### 2.1 導入環境變數 (Environment Variables)
- 建立 `.env` 檔案存放敏感金鑰（排除在 Git 之外）。
- 建立 `.env.example` 提供設定模板供開發參考。
- 修改 `App.jsx` 與 `firebase.js`，將硬編碼的 `apiKey` 等資訊改為讀取 `import.meta.env`。

### 2.2 更新 Git 忽略清單
- 在 `.gitignore` 中加入 `.env` 規章，防止金鑰再次被上傳至雲端。

### 2.3 清理程式碼
- 移除 `firebase.js` 檔案結尾因先前操作產生的殘留 Markdown 符號。

## 3. 重要後續步驟 (需使用者執行)
> [!WARNING]
> 金鑰一經外洩即視為不安全。請務必執行以下操作：

## 4. 修復狀態確任
- [x] **撤銷舊金鑰：** 已完成，舊金鑰已在 Google Cloud 控制台停用。
- [x] **更新新金鑰：** 已完成，新金鑰已寫入本地 `.env`。
- [x] **設定來源限制：** 已完成，已透過 Google Cloud 控制台限制僅限 `localhost` 與 `github.io` 域名使用，大幅提升安全性。
