# 教室管理：作品集展示版

此目錄本身就是可部署的純 HTML／CSS／JavaScript 靜態成品，沒有框架、安裝套件、後端或建置需求。原系統檔案未修改，亦未提交、推送或發布。

## 如何確認畫面

原始 `frontend/index.html` 的導覽按鈕「教室管理」使用 `data-view="instructors"`，對應 `#instructors-view`，其 `h1#instructors-title` 為「教室管理」。`frontend/src/navigation.js` 讀取網址 `?view=instructors`、同步區塊與歷史紀錄。雖然程式命名為 instructors，畫面是教室管理。

另一個 `?view=utilization` 是「教室使用率」，其標題為「每間教室，使用得如何？」；既有 `portfolio-export/classroom-usage/` 是該統計頁的匯出，這次未沿用。講師管理與查詢課表也屬其他導覽項目，未帶入。

## 原始實作與匯出依賴

| 原始位置（相對專案根目錄） | 用途與匯出處理 |
| --- | --- |
| `frontend/index.html` | 擷取教室管理區塊、原講師指派 dialog、頁首結構；只留下該頁導覽，替換展示文字與相對資源路徑，輸出 `index.html` |
| `frontend/src/instructors.js` | 原課表 DOM 渲染、摘要、六日／每日模式、日期捷徑、重新載入與指派彈窗；複用於 `src/instructors.js`，僅限制 DOM 查詢範圍、更換儲存 key 與資料來源標籤 |
| `frontend/src/navigation.js` | 原 query string／瀏覽器上一頁下一頁同步；展示版預設改為 instructors |
| `frontend/src/booking-store.js` | 原預約快取、載入狀態、重試與資料驗證流程，直接複製 |
| `frontend/src/booking-schedule.js` | 原三時段定義及預約格索引，直接複製 |
| `frontend/src/schedule-range.js` | 原日期驗證、最多六日與跨月計算，直接複製 |
| `frontend/src/instructor-data.js` | 保留原 `assignmentState`、`validateAssignment`、`filterSessions`；以虛構資料替換原教室、講師與課堂 |
| `frontend/src/reference-timetable.js` | 原 session 結構依據；展示版使用重新編製的虛構課表，沒有複製原轉錄內容與計畫資料 |
| `frontend/src/api.js` | 僅保留原 `validateEvents`，`fetchEvents` 改讀 `src/mock-bookings.js`，無網路請求 |
| `frontend/src/styles.css` | 沿用原宣告、配色、格線、彈窗、斷點及行動版橫向捲動；移除其他頁面專用規則，所有選擇器限制於 `#classroom-demo` |

原頁沒有拆分 JSX／Vue 元件：列表、表格與課堂卡片由 `instructors.js` 建立，表單與彈窗位於 HTML。沒有圖片、下載字型、圖示套件或其他靜態素材依賴；圖示為原本 Unicode 字元。保留原字型堆疊 `Inter, "Noto Sans TC", "Microsoft JhengHei", sans-serif`，實際顯示依裝置已有字型選取，沒有外連字型。

`standalone.css` 只負責獨立頁 body 邊界。`tools/export.py` 是可重現的擷取／替換腳本，從原專案根目錄執行 `python portfolio-export/classroom-management/tools/export.py` 可重新產生展示資產；它只寫入本匯出目錄，會覆寫手動修改的展示資產。README、測試與 package.json 不受重建影響。

## 啟動與 GitHub Pages 整合

在本目錄執行：

```sh
python -m http.server 8765 --bind 127.0.0.1
```

開啟 `http://127.0.0.1:8765/`。ES modules 需經 HTTP 提供，請勿以 `file://` 開啟。無需 npm install 或 build，部署檔案就是 `index.html`、`standalone.css` 與整個 `src/`。

將上述檔案保持相對結構，放入作品集的任意子目錄，例如 `demos/classroom-management/`，即可在 GitHub Pages 的 `/儲存庫/demos/classroom-management/` 使用。所有 script、CSS 與 import 都是相對路徑，不需要路由 rewrite。這裡未執行任何發布。

建議用獨立連結，或 iframe 嵌入，讓作品集導覽、URL 與字型環境各自獨立：

```html
<iframe src="./demos/classroom-management/"
  title="教室管理展示資料"
  style="width:100%;height:900px;border:0"></iframe>
```

若直接嵌入 DOM，複製 `#classroom-demo`，載入 `src/styles.css` 和 `src/instructors.js`，**不要載入 standalone.css**。CSS 與程式查詢都限制在根節點內；只支援每頁一份展示。原導航仍會管理宿主 URL 的 `view` 參數與 history，因此宿主有自身 query 路由時請採 iframe。宿主自行管理 CSP；獨立頁的 CSP 禁止所有 connect 請求。

## 資料、操作與限制

所有資料皆明示「展示資料」，沒有 .env、密鑰、Token、登入、資料庫或內部服務位址。

- `src/instructor-data.js`：22 個虛構教室、5 位明示虛構的講師；保留原教室排序結構。
- `src/reference-timetable.js`：20 筆課堂／活動，涵蓋已指派、缺負責講師、缺備選講師、自習、活動與假期。預設六日區間為 2025/11/04–11/09，進入即有內容。
- `src/mock-bookings.js`：21 筆虛構預約，涵蓋上午、下午、晚間和六個原月份捷徑。事件維持 id、bookingId、title、instructorName、resource、resourceId、courseCode、courseType、timeSlot、start、end 格式；開始日包含、結束日不包含。
- 保留日期選擇、六日前後切換、從今天開始、每日模式前後一天／今天、月份捷徑、重新載入預約、課堂點擊、彈窗取消／Escape、講師儲存與焦點返回。摘要與空白日期提示使用本機資料。課表依原固定教室及時段排序。
- 指派保留原驗證：必須為有效講師，負責與備選不能相同；允許未指派或只指定備選。原流程沒有另外的儲存確認視窗，因此沒有新增。活動、自習與假期及藍色預約卡原本不可編輯，維持唯讀。
- 指派存於 `localStorage` 的 `portfolio.classroom-management.assignments.v1`，不讀寫原系統的 key。重整後保留；儲存被拒時，原彈窗會顯示錯誤且不儲存。
- 重設：在展示頁的瀏覽器開發工具 Application／Storage 中刪除此單一 key，再重新整理；或 Console 執行 `localStorage.removeItem('portfolio.classroom-management.assignments.v1'); location.reload();`。不要清空整個作品集的 storage。
- 「重新載入預約」只重讀虛構預約，不會清除已儲存指派。今天按鈕使用台灣日期，固定範例範圍以外顯示無排課，可使用月份捷徑返回有資料的日期。
- 此畫面原本沒有文字搜尋、講師或狀態篩選控制、可操作排序、分頁、新增／刪除教室、狀態切換或檔案上傳，未自行新增。原 `filterSessions` 雖保留其他篩選參數，畫面實際只使用日期篩選。指派狀態依欄位自動推導。
- 沒有原課表參考圖片；原頁本就以轉錄資料渲染，此處保留同一渲染實作，改用虛構內容。沒有上傳、跨裝置同步、多人編輯或真實預約寫入功能。

## 檢查與實際驗證

```sh
python tools/verify.py
node tests/demo.test.mjs
```

也可在已安裝 Node 的環境使用 `npm test`、`npm run check`、`npm run preview`，不需要第三方套件。

已通過資源／模組引用、HTML ID、相對路徑、CSS scope、網路程式與原始識別文字掃描；JavaScript 測試涵蓋四種指派狀態、同人／無效講師驗證、日期範圍與跨年、預約快取與重新載入、時段格對應、空白日期，以及禁止 fetch 的本機資料流程。所有輸出 JS 另經解析檢查。詳細結果見 `VALIDATION.md`。

本次環境無可用瀏覽器，尚未進行桌面／手機視覺、實際彈窗鍵盤操作與 localStorage 重整持久化的瀏覽器驗證。保留原 850px／520px 斷點與表格橫向捲動，仍需在目標作品集環境做一次實機確認。
