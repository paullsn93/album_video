import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

// 手動解析 .env 檔案
const envPath = path.resolve('.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const process_env = {};
envContent.split('\n').forEach(line => {
    const [key, ...value] = line.split('=');
    if (key && value) {
        process_env[key.trim()] = value.join('=').trim();
    }
});

const firebaseConfig = {
    apiKey: process_env.VITE_FIREBASE_API_KEY,
    authDomain: process_env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process_env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process_env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process_env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process_env.VITE_FIREBASE_APP_ID,
    measurementId: process_env.VITE_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const appId = 'teafriends-gallery';

async function backup() {
    console.log('正在從 Firestore 讀取資料...');
    try {
        const querySnapshot = await getDocs(collection(db, 'artifacts', appId, 'public', 'data', 'albums'));
        const albums = [];
        querySnapshot.forEach((doc) => {
            albums.push({ id: doc.id, ...doc.data() });
        });

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupDir = './backups';
        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir);
        }

        const filePath = path.join(backupDir, `albums_backup_${timestamp}.json`);
        fs.writeFileSync(filePath, JSON.stringify(albums, null, 2));
        console.log(`備份成功！檔案儲存於: ${filePath}`);
        console.log(`總計備份筆數: ${albums.length}`);
    } catch (error) {
        console.error('備份失敗:', error);
        process.exit(1);
    }
}

backup().then(() => process.exit(0));
