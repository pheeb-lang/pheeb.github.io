# 驗證紀錄

驗證日期：2026-10-19（Asia/Taipei）。

| 檢查 | 結果 |
| --- | --- |
| 導覽／路由／標題確認 | `data-view=instructors` → `?view=instructors` → `#instructors-view`／「教室管理」。排除 utilization 統計頁 |
| `python tools/verify.py` | 通過：38 個唯一 HTML ID、資源存在、模組引用、DOM ID、相對路徑、CSS scope、無網路呼叫與原始識別文字 |
| 全部 9 個 JS 模組語法解析 | 通過：Node VM `SourceTextModule` |
| 子目錄 HTTP 預覽 | 通過：以 `/portfolio-export/classroom-management/` 提供頁面，全部 12 個部署檔案回應 200，JS MIME 正確 |
| 重新產生匯出 | 通過：重跑 export.py 前後全部檔案 SHA-256 一致 |
| `tests/demo.test.mjs` | 通過：虛構資料完整性、四種指派狀態、無效／重複講師、日期邊界、跨年、最多六日、資料範圍、快取及重新載入、上午／下午／晚間預約格、空白日期、回應副本隔離 |
| 防止真實 API | 測試將 global fetch 換成會拋錯的函式，資料流程仍通過；靜態掃描無 fetch 呼叫／XMLHttpRequest／WebSocket／外部 URL／API 路徑；頁面 CSP 另設 connect-src none |
| 字型／圖片／圖示依賴 | 系統字型堆疊與 Unicode 圖示；沒有外部字型、圖片、CSS url 或 @import |
| 桌面／手機實際視覺 | 未執行：瀏覽器工具回報沒有可用瀏覽器 |
| 彈窗取消／Escape／焦點、儲存後重整 | 保留原處理程式，尚未以瀏覽器操作驗證 |

環境的命令列沒有 Node 可執行檔，JS 測試透過可用的 Node REPL 執行。該受限 REPL 未提供全域 Event／EventTarget，測試執行前從原生 AbortSignal 的繼承鏈及 abort 事件取得原生建構子後補入；未修改展示頁程式或測試內容。一般 Node 環境可直接執行 README 中的測試命令。

展示版是原生 ES modules 靜態成品，無編譯或打包步驟；index.html、standalone.css、src/ 即為部署內容。未提交、推送或發布專案。

建議實機驗收：1440px 與 390px 寬度各開啟一次，確認只有表格區域橫向捲動、日期／月份捷徑及重新載入正常。點擊灰色授課卡，選同一負責／備選講師確認錯誤，再選不同講師儲存、重新整理驗證持久化；最後移除專屬 localStorage key 重新整理以重設。藍色預約卡與自習／活動／假期保持唯讀。
