# 茶友時光 - 雲端回憶相冊與影片館

這是一個基於 **React** 與 **Firebase** 開發的個人化雲端相簿管理系統。旨在提供茶友們一個私密、優雅且高效的活動紀錄瀏覽空間。

## 🌟 主要功能

- **雲端同步存取：** 即時從 Firestore 讀取最新的相簿資料。
- **多維度篩選：** 支援透過活動名稱、參與者或日期進行關鍵字搜尋，並提供分類標籤（如：國內旅遊、爬山、聚餐等）一鍵篩選。
- **影片整合瀏覽：** 每個活動可連結多個 YouTube 影片，直接跳轉觀看精彩紀錄。
- **管理員更新：** 內建管理員驗證機制，支援上傳 `.csv` 檔案快速更新雲端資料庫。
- **安全防護：** 
  - 訪客進入需輸入通關密碼。
  - 配置環境變數管理敏感金鑰，確保原始碼安全性。

## 🛠️ 技術棧

- **Frontend:** React, Vite, Tailwind CSS
- **Backend:** Firebase App (Auth, Firestore, Analytics)
- **Icons:** Lucide React

## 🚀 快速開始

### 1. 安裝依賴
```bash
npm install
```

### 2. 環境變數設定
請在專案根目錄建立 `.env` 檔案，內容參考 `.env.example`：
```env
VITE_FIREBASE_API_KEY=你的_API_KEY
VITE_FIREBASE_PROJECT_ID=你的_專案ID
# ...其餘其項請自行填入
```

### 3. 本地運作
```bash
npm run dev
```

## 📝 開發記錄
詳細的開發歷程、安全性修復與更新步驟請參閱：
- [Log01_Security.md](./Log01_Security.md)：API 金鑰外洩修復與安全建議。
- [Log02_Deployment.md](./Log02_Deployment.md)：GitHub Actions 自動化佈署教學。
- [Log03_Final_Review.md](./Log03_Final_Review.md)：最後的代碼清理與專案健檢總結。
