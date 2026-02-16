# Log02: 自動化雲端佈署教學 (GitHub Pages)

**日期：** 2026-02-16
**目標：** 透過 GitHub Actions 實現「推送即佈署」，同時保護 Firebase 金鑰。

## 1. 運作原理
我們建立了 `.github/workflows/deploy.yml`。每當你將程式碼推送到 `main` 分支，GitHub 會啟動一個虛擬機：
1. 下載你的程式碼。
2. 安裝環境（Node.js）。
3. **從 GitHub Secrets 注入環境變數**（這也是為什麼我們不需要上傳 `.env`）。
4. 執行 `npm run build` 產生網頁檔案。
5. 自動將結果推送到 `gh-pages` 分支完成佈署。

## 2. 關鍵步驟：設定 GitHub Secrets
為了讓 GitHub 能夠成功連線到你的 Firebase，你必須手動執行一次設定：

1. 開啟你的 GitHub 專案網頁：`https://github.com/paullsn93/album_video`
2. 點擊上方的 **Settings** 頁籤。
3. 在左側選單找到 **Secrets and variables** -> 點擊 **Actions**。
4. 點擊 **New repository secret** 按鈕。
5. 根據你的本地 `.env` 內容，分別建立以下 7 個密鑰：

| Name (名稱) | Value (值) |
| :--- | :--- |
| `VITE_FIREBASE_API_KEY` | `AIzaSyDGtyEyNalJWjteFWheRf35GLk3ajDn_60` |
| `VITE_FIREBASE_AUTH_DOMAIN` | `album-video-246b7.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | `album-video-246b7` |
| `VITE_FIREBASE_STORAGE_BUCKET` | `album-video-246b7.firebasestorage.app` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `1077095379252` |
| `VITE_FIREBASE_APP_ID` | `1:1077095379252:web:d86c8f21ad2b972be27561` |
| `VITE_FIREBASE_MEASUREMENT_ID` | `G-DPGPRCD160` |
| `VITE_SITE_PASSWORD` | `8888` |
| `VITE_ADMIN_PASSWORD` | `admin` |

## 4. 佈署狀態
- [x] Secrets 設定完成。
- [x] 自動化佈署觸發成功。

## 3. 如何佈署
設定完 Secrets 後，你只需要在終端機執行：
```bash
git add .
git commit -m "chore: add github actions deployment"
git push origin main
```
之後到 GitHub 的 **Actions** 頁籤，就可以看到佈署進度了！
