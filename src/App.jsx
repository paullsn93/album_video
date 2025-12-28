import React, { useState, useEffect, useMemo } from 'react';
import { Search, Calendar, Users, ExternalLink, Upload, Filter, Image as ImageIcon, X, ChevronUp, PlayCircle, Film, Lock, ShieldCheck, ArrowDownWideNarrow, ArrowUpNarrowWide, Cloud, RefreshCw } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';
import { getFirestore, collection, getDocs, doc, writeBatch, query, onSnapshot } from 'firebase/firestore';

// --- Firebase 設定區 (整合版) ---
// 為了確保單一檔案能運作，我們將設定直接寫在這裡
let firebaseConfig;

try {
  // 嘗試讀取環境變數 (適用於開發預覽環境)
  firebaseConfig = JSON.parse(__firebase_config);
} catch (e) {
  // ★★★ 如果部署到 GitHub 或其他主機，請確認這些資訊正確 ★★★
  firebaseConfig = {
    apiKey: "AIzaSyAbaXteigP5UTtvZ33XUIrXEumQ8HnRhqs",
    authDomain: "album-video-246b7.firebaseapp.com",
    projectId: "album-video-246b7",
    storageBucket: "album-video-246b7.firebasestorage.app",
    messagingSenderId: "1077095379252",
    appId: "1:1077095379252:web:d86c8f21ad2b972be27561",
    measurementId: "G-DPGPRCD160"
  };
}

// 初始化 Firebase
const app = initializeApp(firebaseConfig || {});
const auth = getAuth(app);
const db = getFirestore(app);

// 如果沒有特定 appId，使用預設值
// 修正：確保 appId 不包含斜線 '/'，否則會導致 Firestore 路徑段數錯誤 (Invalid collection reference)
const rawAppId = (typeof __app_id !== 'undefined') ? __app_id : 'teafriends-gallery';
const appId = rawAppId.replace(/\//g, '_');

// --- 安全設定 ---
const SITE_PASSWORD = "8888";   // 通關密碼
const ADMIN_PASSWORD = "admin"; // 管理員密碼

// 預設資料 (僅在資料庫連線前或全空時顯示)
const INITIAL_DATA = [
  {
    id: '2024-1',
    name: '20240324探訪柴山秘境(二)',
    category: '國內旅遊, 爬山',
    participants: '羅家1人, 陽家2人',
    videoLink1: '',
    thumbnail: 'https://lh3.googleusercontent.com/pw/AP1GczODW_eCrv2L_qGXX9QZqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZ=w3120-h1756-s-no-gm?authuser=1',
    link: 'https://photos.app.goo.gl/78jEZ78wrAksqNdE9',
    startDate: '2024/03/24',
    endDate: '2024/03/24'
  }
];

const getPlaceholderColor = (category) => {
  if (category.includes('聚會') || category.includes('聚餐')) return 'bg-amber-100 text-amber-600';
  if (category.includes('單車')) return 'bg-blue-100 text-blue-600';
  if (category.includes('國外')) return 'bg-purple-100 text-purple-600';
  if (category.includes('爬山') || category.includes('登山') || category.includes('山')) return 'bg-emerald-100 text-emerald-600';
  return 'bg-teal-100 text-teal-600';
};

const App = () => {
  // 狀態管理
  const [albums, setAlbums] = useState([]); // 初始為空，等待資料庫
  const [loading, setLoading] = useState(true); // 載入狀態
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [user, setUser] = useState(null);

  // 安全相關狀態
  const [isSiteLocked, setIsSiteLocked] = useState(true);
  const [sitePasswordInput, setSitePasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');
  
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isAdminAuthOpen, setIsAdminAuthOpen] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [adminError, setAdminError] = useState('');
  const [uploadProgress, setUploadProgress] = useState(''); // 上傳進度顯示

  // 1. Firebase Auth 初始化
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (error) {
        console.error("Firebase Auth Error:", error);
        // 即便 Auth 失敗，也可以讓 UI 繼續顯示預設資料，而不是崩潰
        setLoading(false); 
        setAlbums(INITIAL_DATA);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  // 2. 從 Firestore 讀取資料
  useEffect(() => {
    if (!user) return;

    try {
      // 使用公開資料路徑
      const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'albums'));
      
      // 設置即時監聽器
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const fetchedAlbums = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        if (fetchedAlbums.length > 0) {
          setAlbums(fetchedAlbums);
        } else {
          setAlbums(INITIAL_DATA); // 若資料庫為空，顯示預設範例
        }
        setLoading(false);
      }, (error) => {
        console.error("Error fetching data:", error);
        setAlbums(INITIAL_DATA);
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (error) {
      console.error("Firestore Init Error:", error);
      setLoading(false);
      setAlbums(INITIAL_DATA);
    }
  }, [user]);

  // UI 捲動監聽
  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const categories = useMemo(() => {
    const allCats = new Set();
    albums.forEach(album => {
      const cleanCat = album.category ? album.category.replace(/^"|"$/g, '') : '一般';
      const splitCats = cleanCat.split(/,\s*/);
      splitCats.forEach(c => {
        if (c.trim()) allCats.add(c.trim());
      });
    });
    return Array.from(allCats).sort();
  }, [albums]);

  // 排序與過濾邏輯
  const filteredAlbums = useMemo(() => {
    const filtered = albums.filter(album => {
      const matchesSearch = 
        (album.name && album.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (album.participants && album.participants.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (album.startDate && album.startDate.includes(searchTerm)) ||
        (album.endDate && album.endDate.includes(searchTerm));
      
      const cleanCat = album.category ? album.category.replace(/^"|"$/g, '') : '';
      const matchesCategory = selectedCategory === 'All' || cleanCat.includes(selectedCategory);
      return matchesSearch && matchesCategory;
    });

    return filtered.sort((a, b) => {
      // 處理日期格式 (YYYY/MM/DD 或 YYYY-MM-DD)
      const dateA = new Date(a.startDate ? a.startDate.replace(/\//g, '-') : '').getTime();
      const dateB = new Date(b.startDate ? b.startDate.replace(/\//g, '-') : '').getTime();
      
      const validA = !isNaN(dateA);
      const validB = !isNaN(dateB);
      if (!validA && !validB) return 0;
      if (!validA) return 1;
      if (!validB) return -1;

      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });
  }, [albums, searchTerm, selectedCategory, sortOrder]);

  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
  };

  const parseCSVLine = (line) => {
    const result = [];
    let start = 0;
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      if (line[i] === '"') {
        inQuotes = !inQuotes;
      } else if (line[i] === ',' && !inQuotes) {
        result.push(line.substring(start, i));
        start = i + 1;
      }
    }
    result.push(line.substring(start));
    return result.map(col => {
      let val = col.trim();
      if (val.startsWith('"') && val.endsWith('"')) {
        val = val.substring(1, val.length - 1);
      }
      return val.replace(/""/g, '"');
    });
  };

  // ★★★ 資料庫批次寫入邏輯 ★★★
  const saveToFirestore = async (newAlbums) => {
    if (!user) {
        alert("尚未登入 Firebase，無法寫入資料。請確認網路連線或重新整理頁面。");
        return;
    }

    setUploadProgress('正在準備寫入資料庫...');
    
    const batchSize = 500; // Firestore 批次限制
    const collectionRef = collection(db, 'artifacts', appId, 'public', 'data', 'albums');
    
    try {
        setUploadProgress('正在清理舊資料...');
        const snapshot = await getDocs(collectionRef);
        const deleteBatch = writeBatch(db);
        snapshot.docs.forEach((doc) => {
            deleteBatch.delete(doc.ref);
        });
        await deleteBatch.commit();
    } catch (e) {
        console.error("清理舊資料失敗 (可能是權限或連線問題)", e);
        // 不中斷，繼續嘗試寫入
    }

    // 2. 分批寫入新資料
    try {
        let batch = writeBatch(db);
        let count = 0;
        let totalBatches = 0;

        for (let i = 0; i < newAlbums.length; i++) {
            const album = newAlbums[i];
            const docRef = doc(collectionRef); 
            batch.set(docRef, album);
            count++;

            if (count >= batchSize) {
                await batch.commit();
                batch = writeBatch(db);
                count = 0;
                totalBatches++;
                setUploadProgress(`已上傳 ${i + 1} / ${newAlbums.length} 筆資料...`);
            }
        }

        if (count > 0) {
            await batch.commit();
        }
        
        setUploadProgress('完成！資料已同步到雲端。');
        setTimeout(() => {
            setIsUploadModalOpen(false);
            setUploadProgress('');
            setSearchTerm('');
            setSelectedCategory('All');
        }, 1500);

    } catch (error) {
        console.error("寫入資料庫失敗:", error);
        setUploadProgress('上傳失敗: ' + error.message);
        // 👇 更清楚的錯誤提示
        if (error.code === 'permission-denied') {
            alert("上傳失敗：權限不足。\n請到 Firebase Console -> Firestore Database -> Rules，將 allow write 設為 true。");
        } else {
            alert("上傳失敗，錯誤訊息: " + error.message);
        }
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result;
      if (!text) return;
      const lines = text.split(/\r\n|\n|\r/); 
      const newAlbums = [];
      
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const cols = parseCSVLine(line);
        if (cols.length >= 1) { 
          const rawThumbnail = cols[6] || '';
          const isValidThumbnail = rawThumbnail.startsWith('http');
          newAlbums.push({
            name: cols[0] || '未命名相簿',
            category: cols[1] || '未分類',
            participants: cols[2] || '',
            videoLink2: cols[3],
            videoLink3: cols[4],
            videoLink1: cols[5],
            thumbnail: isValidThumbnail ? rawThumbnail : undefined,
            link: cols[7],
            endDate: cols[8],
            startDate: cols[9]
          });
        }
      }

      if (newAlbums.length > 0) {
        saveToFirestore(newAlbums);
      } else {
        alert('無法解析檔案，請確認格式是否正確。');
      }
    };
    reader.readAsText(file);
  };

  // --- 登入處理 ---
  const handleSiteLogin = (e) => {
    e.preventDefault();
    if (sitePasswordInput === SITE_PASSWORD) {
      setIsSiteLocked(false);
      setLoginError('');
    } else {
      setLoginError('密碼錯誤，請重新輸入');
    }
  };

  // --- 管理員驗證處理 ---
  const handleAdminAuth = (e) => {
    e.preventDefault();
    if (adminPasswordInput === ADMIN_PASSWORD) {
      setIsAdminAuthOpen(false); 
      setIsUploadModalOpen(true); 
      setAdminError('');
      setAdminPasswordInput(''); 
    } else {
      setAdminError('管理員密碼錯誤');
    }
  };

  const openAdminCheck = () => {
    setIsAdminAuthOpen(true);
    setAdminError('');
    setAdminPasswordInput('');
  };

  // 鎖定畫面
  if (isSiteLocked) {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center space-y-6 animate-in fade-in zoom-in duration-300">
          <div className="mx-auto w-20 h-20 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center mb-4">
            <Lock className="w-10 h-10" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-stone-800 mb-2">茶友時光 - 專屬回憶錄</h1>
            <p className="text-stone-500">此頁面為私人珍藏，請輸入通關密碼以繼續。</p>
          </div>
          <form onSubmit={handleSiteLogin} className="space-y-4">
            <div className="relative">
              <input
                type="password"
                placeholder="請輸入密碼"
                className="w-full px-4 py-3 rounded-lg border border-stone-300 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all text-center tracking-widest text-lg"
                value={sitePasswordInput}
                onChange={(e) => setSitePasswordInput(e.target.value)}
                autoFocus
              />
            </div>
            {loginError && <p className="text-red-500 text-sm font-medium">{loginError}</p>}
            <button
              type="submit"
              className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg transition-colors shadow-md"
            >
              進入瀏覽
            </button>
            <p className="text-xs text-stone-400 mt-4">提示：預設密碼為 8888</p>
          </form>
        </div>
      </div>
    );
  }

  // 主程式介面
  return (
    <div className="min-h-screen bg-stone-50 text-stone-800 font-sans">
      {/* Header Section */}
      <header className="bg-white shadow-sm border-b border-stone-200 sticky top-0 z-30 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div 
              className="flex items-center gap-3 cursor-pointer group" 
              onClick={() => {setSearchTerm(''); setSelectedCategory('All'); scrollToTop();}}
            >
              <div className="p-2.5 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-xl shadow-lg group-hover:shadow-xl transition-all duration-300 transform group-hover:scale-105">
                <ImageIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-stone-900 tracking-tight group-hover:text-teal-700 transition-colors">茶友時光</h1>
                <p className="text-xs text-stone-500 font-medium flex items-center gap-1">
                  {loading ? (
                    <span className="flex items-center text-teal-600"><RefreshCw className="w-3 h-3 animate-spin mr-1"/> 讀取雲端資料...</span>
                  ) : (
                    <span className="flex items-center"><Cloud className="w-3 h-3 mr-1"/> 共 {albums.length} 本相簿</span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <div className="relative flex-1 md:w-72">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-stone-400" />
                </div>
                <input
                  type="text"
                  placeholder="搜尋活動、參與者..."
                  className="block w-full pl-10 pr-3 py-2.5 border border-stone-200 rounded-full leading-5 bg-stone-50 placeholder-stone-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 sm:text-sm transition-all shadow-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                    <button 
                      onClick={() => setSearchTerm('')}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-stone-400 hover:text-stone-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                )}
              </div>
              
              <button 
                onClick={openAdminCheck}
                className="p-2.5 text-stone-500 bg-white border border-stone-200 hover:text-teal-600 hover:border-teal-200 hover:bg-teal-50 rounded-full transition-all shadow-sm tooltip flex items-center gap-2"
                title="更新資料庫 (限管理員)"
              >
                <ShieldCheck className="w-5 h-5" />
                <span className="text-xs font-medium hidden md:inline">管理員更新</span>
              </button>
            </div>
          </div>

          {/* Categories Filter & Sort */}
          <div className="mt-4 flex flex-wrap gap-2 pb-1 overflow-x-auto no-scrollbar items-center select-none">
            
            <button
              onClick={toggleSortOrder}
              className="flex items-center gap-1.5 px-3 py-1 bg-white text-stone-600 border border-stone-200 hover:border-teal-300 hover:text-teal-600 hover:bg-teal-50 rounded-full text-xs font-medium transition-all mr-2"
              title={sortOrder === 'desc' ? "目前：由新到舊" : "目前：由舊到新"}
            >
              {sortOrder === 'desc' ? (
                <>
                  <ArrowDownWideNarrow className="w-3.5 h-3.5" />
                  由新到舊
                </>
              ) : (
                <>
                  <ArrowUpNarrowWide className="w-3.5 h-3.5" />
                  由舊到新
                </>
              )}
            </button>

            <div className="flex items-center text-stone-400 mr-2 text-xs font-medium uppercase tracking-wider border-l border-stone-300 pl-3">
              <Filter className="w-3 h-3 mr-1" />
              篩選
            </div>
            <button
              onClick={() => setSelectedCategory('All')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 ${
                selectedCategory === 'All'
                  ? 'bg-stone-800 text-white shadow-md transform scale-105'
                  : 'bg-white text-stone-600 border border-stone-200 hover:border-stone-400 hover:bg-stone-50'
              }`}
            >
              全部
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 whitespace-nowrap ${
                  selectedCategory === cat
                    ? 'bg-teal-600 text-white shadow-md transform scale-105'
                    : 'bg-white text-stone-600 border border-stone-200 hover:border-teal-300 hover:text-teal-600 hover:bg-teal-50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-[calc(100vh-200px)]">
        
        {/* Results Header */}
        <div className="mb-6 flex items-end justify-between border-b border-stone-200 pb-2">
          <h2 className="text-xl font-bold text-stone-800 flex items-center gap-2">
            {selectedCategory === 'All' ? '所有活動' : selectedCategory}
            <span className="text-sm font-normal text-stone-500 bg-stone-100 px-2 py-0.5 rounded-full">
              {loading ? '載入中...' : filteredAlbums.length}
            </span>
          </h2>
          <span className="text-xs text-stone-400">
              排序方式：{sortOrder === 'desc' ? '日期 (新→舊)' : '日期 (舊→新)'}
          </span>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
             {[1,2,3,4,5,6].map(i => (
               <div key={i} className="h-80 bg-stone-200 rounded-xl"></div>
             ))}
          </div>
        ) : filteredAlbums.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {filteredAlbums.map((album) => (
              <article 
                key={album.id} 
                className="group bg-white rounded-xl shadow-sm hover:shadow-xl hover:-translate-y-1 border border-stone-100 overflow-hidden transition-all duration-300 flex flex-col h-full relative"
              >
                <div className="absolute top-3 left-3 z-10 flex flex-wrap gap-1">
                  {album.category && album.category.replace(/^"|"$/g, '').split(/,\s*/).map((tag, idx) => (
                    <span key={idx} className="bg-white/90 backdrop-blur-md text-stone-700 text-[10px] font-bold px-2 py-1 rounded shadow-sm border border-stone-100">
                      {tag.trim()}
                    </span>
                  ))}
                </div>

                <a 
                  href={album.link || '#'} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className={`block h-52 w-full ${getPlaceholderColor(album.category || '')} relative overflow-hidden cursor-pointer group-hover:brightness-105 transition-all`}
                  title={album.link ? "點擊開啟 Google 相簿" : "無相簿連結"}
                >
                  {album.thumbnail ? (
                    <div className="w-full h-full relative overflow-hidden">
                        <img 
                          src={album.thumbnail} 
                          alt={album.name} 
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                          loading="lazy"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </div>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center relative">
                      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#444_1px,transparent_1px)] [background-size:16px_16px]"></div>
                      <ImageIcon className="w-12 h-12 opacity-30 transform group-hover:scale-110 group-hover:opacity-50 transition-all duration-500 mb-2" />
                      <span className="text-xs font-medium opacity-40">無縮圖</span>
                    </div>
                  )}
                  
                  {album.link && (
                    <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-2.5 py-1.5 rounded-full backdrop-blur-sm flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-y-2 group-hover:translate-y-0">
                      瀏覽相簿 <ExternalLink className="w-3 h-3" />
                    </div>
                  )}
                </a>

                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-teal-600 mb-2">
                    <Calendar className="w-3.5 h-3.5" />
                    <time>{album.startDate}</time>
                    {album.startDate !== album.endDate && album.endDate && (
                      <>
                        <span className="text-stone-300">|</span>
                        <time>{album.endDate}</time>
                      </>
                    )}
                  </div>

                  <h3 className="text-lg font-bold text-stone-800 leading-snug mb-3 line-clamp-2 group-hover:text-teal-700 transition-colors">
                    <a href={album.link || '#'} target="_blank" rel="noopener noreferrer">
                      {album.name}
                    </a>
                  </h3>

                  <div className="mb-4">
                      <div className="flex items-start gap-2">
                        <Users className="w-4 h-4 text-stone-400 mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-stone-500 leading-relaxed line-clamp-2 hover:line-clamp-none transition-all cursor-default" title={album.participants}>
                            {album.participants || "未記錄參與者"}
                        </p>
                    </div>
                  </div>

                  <div className="mt-auto pt-4 border-t border-stone-100 flex items-center gap-2 flex-wrap min-h-[40px]">
                    {(album.videoLink1 || album.videoLink2 || album.videoLink3) ? (
                      <div className="flex gap-2 w-full">
                        {album.videoLink1 && (
                          <a href={album.videoLink1} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-medium hover:bg-red-100 transition-colors border border-red-100 group/btn">
                             <PlayCircle className="w-3.5 h-3.5 group-hover/btn:fill-current" /> 
                             <span className="truncate">影片 1</span>
                          </a>
                        )}
                          {album.videoLink2 && (
                          <a href={album.videoLink2} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-medium hover:bg-red-100 transition-colors border border-red-100 group/btn">
                             <PlayCircle className="w-3.5 h-3.5 group-hover/btn:fill-current" /> 
                             <span className="truncate">影片 2</span>
                          </a>
                        )}
                        {!album.videoLink2 && !album.videoLink3 && (
                            <span className="text-[10px] text-stone-400 self-center ml-auto">
                                <Film className="w-3 h-3 inline mr-1" />
                                紀錄影片
                            </span>
                        )}
                          {album.videoLink3 && (
                          <a href={album.videoLink3} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-medium hover:bg-red-100 transition-colors border border-red-100 group/btn">
                             <PlayCircle className="w-3.5 h-3.5 group-hover/btn:fill-current" />
                             <span className="truncate">影片 3</span>
                          </a>
                        )}
                      </div>
                    ) : (
                        <div className="w-full text-center">
                            <span className="text-[10px] text-stone-300 italic">無影片紀錄</span>
                        </div>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="text-center py-24 bg-white rounded-2xl border border-dashed border-stone-200">
            <div className="mx-auto h-16 w-16 bg-stone-50 rounded-full flex items-center justify-center mb-4 text-stone-300 animate-pulse">
              <Search className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-stone-800 mb-1">沒有找到相關活動</h3>
            <p className="text-stone-500 mb-6 max-w-xs mx-auto text-sm">試著輸入不同的關鍵字或切換上方分類。</p>
            <button 
                onClick={() => {setSearchTerm(''); setSelectedCategory('All');}}
                className="px-6 py-2.5 bg-teal-600 text-white rounded-full hover:bg-teal-700 transition-all shadow-md hover:shadow-lg font-medium text-sm flex items-center gap-2 mx-auto"
            >
                <X className="w-4 h-4" /> 清除所有篩選
            </button>
          </div>
        )}
      </main>

      <button
        onClick={scrollToTop}
        className={`fixed bottom-8 right-8 p-3.5 bg-stone-800 text-white rounded-full shadow-xl hover:bg-teal-600 transition-all duration-500 z-40 transform hover:scale-110 ${
          showBackToTop ? 'translate-y-0 opacity-100' : 'translate-y-16 opacity-0 pointer-events-none'
        }`}
        title="回到頂端"
      >
        <ChevronUp className="w-5 h-5" />
      </button>

      <footer className="bg-white border-t border-stone-200 py-10 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-stone-800 font-bold mb-2">茶友時光 Tea Friends Memories</p>
          <p className="text-stone-400 text-xs">© {new Date().getFullYear()} 珍貴回憶錄 • 建議使用電腦瀏覽以獲得最佳體驗</p>
        </div>
      </footer>

      {isAdminAuthOpen && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-opacity duration-300">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 animate-in fade-in zoom-in duration-200">
             <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-stone-800 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-teal-600" />
                  管理者驗證
                </h3>
                <button onClick={() => setIsAdminAuthOpen(false)} className="text-stone-400 hover:text-stone-600">
                  <X className="w-5 h-5" />
                </button>
             </div>
             
             <form onSubmit={handleAdminAuth} className="space-y-4">
               <p className="text-sm text-stone-500">此功能僅限管理員使用，請輸入管理員密碼。</p>
               <input
                type="password"
                placeholder="輸入管理員密碼"
                className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                value={adminPasswordInput}
                onChange={(e) => setAdminPasswordInput(e.target.value)}
                autoFocus
               />
               {adminError && <p className="text-red-500 text-xs font-medium">{adminError}</p>}
               <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={() => setIsAdminAuthOpen(false)} className="px-4 py-2 text-stone-500 hover:bg-stone-100 rounded-lg text-sm">取消</button>
                  <button type="submit" className="px-4 py-2 bg-teal-600 text-white hover:bg-teal-700 rounded-lg text-sm font-medium">驗證</button>
               </div>
               <p className="text-[10px] text-stone-300 text-center">預設密碼: admin</p>
             </form>
          </div>
        </div>
      )}

      {isUploadModalOpen && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4 transition-opacity duration-300">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8 animate-in fade-in zoom-in duration-200 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-teal-400 to-emerald-500"></div>
            <button 
                onClick={() => setIsUploadModalOpen(false)}
                className="absolute top-4 right-4 p-1.5 hover:bg-stone-100 rounded-full text-stone-400 hover:text-stone-600 transition-colors"
            >
                <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-2">
               <Cloud className="w-6 h-6 text-teal-600" />
               <h3 className="text-2xl font-bold text-stone-800">更新雲端資料庫</h3>
            </div>
            
            <p className="text-sm text-stone-500 mb-6 leading-relaxed">
              請上傳您的 <code>.csv</code> 檔案。系統會將內容同步至雲端，所有使用者重新整理後皆可看到最新資料。
              <br/>
              <span className="text-amber-600 font-medium">注意：</span>這將覆蓋現有資料庫內容。
            </p>

            {uploadProgress ? (
                <div className="w-full py-8 text-center">
                    <RefreshCw className="w-8 h-8 text-teal-600 animate-spin mx-auto mb-2" />
                    <p className="text-stone-600 font-medium">{uploadProgress}</p>
                </div>
            ) : (
                <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-stone-200 border-dashed rounded-xl cursor-pointer hover:bg-teal-50/50 hover:border-teal-400 transition-all group relative overflow-hidden">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6 z-10">
                        <div className="p-3 bg-stone-100 rounded-full mb-3 group-hover:bg-white group-hover:text-teal-500 transition-all shadow-sm">
                        <Upload className="w-6 h-6 text-stone-400 group-hover:text-teal-500" />
                        </div>
                        <p className="mb-1 text-sm text-stone-600 font-medium group-hover:text-teal-700">點擊選擇檔案 或 拖曳至此</p>
                        <p className="text-xs text-stone-400">支援 CSV 格式</p>
                    </div>
                    <input type="file" className="hidden" accept=".csv,.tsv,.txt" onChange={handleFileUpload} />
                </label>
            )}
            
            {!uploadProgress && (
                <div className="mt-8 flex justify-end gap-3">
                    <button 
                        onClick={() => setIsUploadModalOpen(false)}
                        className="px-5 py-2 text-stone-500 font-medium hover:text-stone-800 hover:bg-stone-100 rounded-lg transition-colors"
                    >
                        關閉
                    </button>
                </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default App;