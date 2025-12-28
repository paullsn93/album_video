import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// 👇 新增這兩行來引入 Auth (驗證) 和 Firestore (資料庫)
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAbaXteigP5UTtvZ33XUIrXEumQ8HnRhqs",
  authDomain: "album-video-246b7.firebaseapp.com",
  projectId: "album-video-246b7",
  storageBucket: "album-video-246b7.firebasestorage.app",
  messagingSenderId: "1077095379252",
  appId: "1:1077095379252:web:d86c8f21ad2b972be27561",
  measurementId: "G-DPGPRCD160"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// 👇 初始化並匯出這些變數，讓其他檔案可以使用
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
```

### 3. 如何在其他檔案使用？
在您負責上傳 CSV 的頁面（例如 `Admin.jsx` 或 `Upload.js`）最上方，原本可能寫錯或漏掉的地方，改成這樣引入：

```javascript
// 引入剛剛建立好的設定
import { auth, db } from './firebase'; 
// 注意路徑 './firebase' 要對應您實際檔案的位置