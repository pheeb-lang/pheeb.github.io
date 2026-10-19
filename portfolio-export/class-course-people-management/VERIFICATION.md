# 驗證紀錄

日期：2026-10-19（Asia/Taipei）。只新增此匯出目錄；未修改原系統功能，未提交、推送、部署或啟用 GitHub Pages。原工作目錄原本已有的 AI 檔案及樣式修改未覆寫。

## 已實際執行

- 原始碼載入鏈：`db/hooks.php → hook_callbacks → dashboard → classes → offerings`，以及 `lib.php → mycourses → importstudents → mystudents`；核對頁面標題、轉址、capability／context 及實際 AMD 載入。共 42 個 classgroup 來源和 6 個其他來源的 SHA-256 記於 SOURCE-MAP.md。沒有操作正式站登入或資料庫。
- JavaScript 語法檢查：data.js、domain.js、app.js 可由 Node VM 解析。
- **18 組業務規則檢查通過**：真正執行 domain.js 及 data.js，而非只掃描文字。
- **17 組模板／狀態檢查通過**：執行 app.js，使用小型 DOM double 接收模板輸出及綁定事件，測試搜尋與分頁結果、發布確認／取消、儲存後重新初始化、學生匯入處理器與重設。DOM double 不模擬 HTML parser、CSS、真實瀏覽器事件或原生控制項。
- Python 靜態／HTTP 檢查通過：匯出內容複製到臨時目錄，在 `/portfolio-demo/projects/class-course-people-management/` 啟動僅綁定 loopback 的測試 HTTP server，入口、相對 scripts／styles、README 及四個下載範例均為 HTTP 200。帶 hash 的班級課程網址仍可載入同一入口；沒有伺服器 rewrite。
- 檢查資源與範圍：CSS 規則皆以 #classgroup-demo 限定，媒體查詢保留；無 @import、url()、下載字型或圖片遺漏。必要圖示不依賴 Font Awesome，採文字移動符號。原 CSS 抽取區段未包含 AI helper。
- 靜態安全檢查：執行碼無 fetch、XHR、WebSocket、sendBeacon、動態程式碼執行、真實 URL 或 cookie；無敏感設定／資料庫／金鑰檔，fixture 與範例郵件僅 example.com。CSP 包含 connect-src 'none'；模板插入的文字使用 esc，確認／通知使用 textContent。模板測試驗證惡意班名與課程名被逸出。這是有限的程式檢查，不是滲透測試。

本環境 PATH 沒有 Node CLI，因此透過已提供的 Node REPL import 測試模組並呼叫 `runChecks()`；交付的測試也可在一般 Node CLI 執行，不需額外套件。Python 檢查直接由終端執行。

## 規則檢查涵蓋內容

| 功能 | 已實測結果 | 驗證界線 |
| --- | --- | --- |
| 初始資料 | 28 班、84 開課、多班別、多門課與 draft／published／error | 程式資料與模板，非視覺 |
| 班級新增 | 自動產生課綱草稿；重複代碼、無效日期、教務／導師同人拒絕 | 真正本機服務；新增列點擊狀態以 double 驗證，未實際鍵入全部欄位 |
| 搜尋／分頁 | 三欄組合條件、0 筆、第 1 頁 20 筆／第 2 頁 4 筆 | 真正模板程式的結果；未以瀏覽器點擊上一頁或搜尋按鈕 |
| 草稿產生 | 冪等、不重複同班課程主檔 | 本機規則 |
| 時數／講師 | 正時數、active linked 候選；空選項保留現有指派 | 本機 assignment；700ms 時序與原生 select 未實測 |
| 課程排序 | 完整 ID 集合、唯一、僅改當班 | 本機 reorder；真實 drag/drop 與觸控相容移動未實測 |
| 發布 | 講師／狀態／時數／外顯碼、整批失敗不部分發布、不建 courseid | 本機服務及 dialog 確認／取消事件 double；原生 focus trap 未實測 |
| 新增講師 | 帳號與 email 一致沿用，不一致拒絕 | 本機服務；非真實帳號建立 |
| 課程匯入 | 共用主檔名稱更新；已發布開課不能覆寫且回滾 | 本機規則；原生檔案選擇未實測 |
| 學生匯入 | CSV 解析、既有／新建計數、重複／帳號衝突回滾、重匯不重複成員 | 使用 students.csv 及實際 app 匯入 handler 搭配模擬 File，列表有更新 |
| 關聯一致性 | 新增課程沿用班級學生、唯一 email 可跨班連同帳號、主檔與開課分開 | 資料模型檢查，不是正式 enrol 投影 |
| 保存與重設 | JSON 保存後重新初始化、重設取消不變更／確認恢復資料 | localStorage double；真正瀏覽器持久化與多分頁未實測 |
| 輸入安全 | 惡意班名／課名以文字逸出 | 真正模板輸出比對；未進行瀏覽器 XSS 測試 |

## 未能執行

`cua.getBrowser({id:'iab'})` 回報 `Browser is not available: iab`，`cua.listBrowsers()` 回傳空清單。沒有可用瀏覽器，因此以下**未驗證**：

- 原站與展示頁的桌面／手機實際排版、字型落點、對照截圖、overflow、深色模式與手機鍵盤。
- 真實滑鼠拖放、觸控移動、dialog 焦點、原生日期／email／required 提示及 file input。
- Browser Network 面板、CSP 真正阻擋、實際上一頁／下一頁／刷新、localStorage 的裝置持久化。
- Big5 實際檔案在不同瀏覽器的 TextDecoder 轉換。CSV UTF-8 範例與 parser 已測試；XLS／XLSX 明確不支援。
- 正式 Moodle 的自訂主題、角色覆寫、已安裝 plugin、資料庫限制、cache 及外部 API。來源判定僅針對目前專案程式碼。

## 可重現的瀏覽器補驗

依 README 啟動，於桌面 1440px 與手機 390px 開啟，逐項操作推薦流程：搜尋／翻頁 → 新增班級與欄位錯誤 → 課程時數／講師自存 → 拖放／點移動 → 發布取消與確認 → 學生匯入與錯誤 → 重新整理／上一頁 → 重設取消與確認。確認手機表格只在容器橫向捲動、工作區堆疊、通知可讀；Network 只見本機同源靜態資源。最後恢復 fixture，避免帶著測試後資料展示。
