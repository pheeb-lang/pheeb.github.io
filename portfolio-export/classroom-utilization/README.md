# 教室使用率｜作品集展示版

可直接部署的純 HTML／CSS／JavaScript，無框架、後端、登入、資料庫、CDN 或套件安裝需求。所有名稱、預約及休館日均為**展示資料**。入口 `index.html`；已附靜態成品 `dist/`。本次只建立此匯出目錄，未修改原系統功能，也未提交、推送或發布。

## 如何確認找到正確畫面

1. `frontend/index.html` 的管理導覽：「教室使用率」按鈕為 `data-view="utilization"`；「教室管理」按鈕為 `data-view="instructors"`，兩者不同。
2. `frontend/src/navigation.js` 的 `setupNavigation` 讀取 `?view=utilization`，切換 `#utilization-view`；沒有合法 view 時也預設為 utilization。這是查詢參數路由，不是獨立 `/utilization` 路徑。
3. 目標區塊的 eyebrow 是 `SPACE UTILIZATION`，主標題是「每間教室，使用得如何？」，結果區標題是「使用概況」。原始 HTML 的瀏覽器頁籤標題是整套系統名稱，不能單憑頁籤標題判定。
4. 「教室管理」區塊是 `#instructors-view`，含每日課表、講師指派與預約彈窗；這些不是本頁功能，未搬入。

展示版保留單一「教室使用率」導覽與上述主標題，頁籤標題改為「教室使用率｜展示資料」，不保留其他頁面的空連結。

## 原始檔案與匯出對應

| 原始位置 | 用途與匯出處理 |
| --- | --- |
| `frontend/index.html` 的 topbar、main、view-nav、utilization-view | 沿用必要容器與目標頁 HTML，輸出 `index.html`；替換機構名稱，移除其他頁面、對話框與資料 |
| `frontend/src/main.js` | 沿用卡片、表格、CSS 長條比較、排序、狀態及查詢流程；`src/main.js` 移除其他頁面的 import／分類跳頁，固定展示日期並自動查詢，DOM 查找限於展示容器 |
| `frontend/src/navigation.js` | `src/navigation.js` 沿用查詢參數、選中狀態與返回／前進還原；只保留 `setupNavigation`，不帶會議歷史流程 |
| `frontend/src/api.js` | `src/api.js` 保留 `validateReport` 及非負數／欄位型別／唯一 ID／使用率範圍檢查；移除真實 API、固定機構與網路錯誤流程，改為本機 adapter |
| `frontend/src/styles.css` | `src/styles.css` 保留使用率頁規則、導覽與 850px／520px 響應式斷點；每條選擇器限制於 `#utilization-demo`，不帶課表、講師與會議樣式 |
| `backend/app/services/utilization_service.py` | 僅閱讀並移植純計算函式到 `src/utilization.js`，不複製資料庫或 Python 服務；`parse_period` 驗證轉為 JS |
| `frontend/API.md`、`backend/tests/test_utilization.py` | 核對欄位、空值、預約計數與邊界案例，不作為執行依賴 |
| `backend/app/services/utilization_snapshot.py` | 原系統離線快照機制；展示無資料庫故障，不搬入 |

匯出目錄另外包含 `src/mock-data.js`（唯一虛構資料來源）、`standalone.css`（只重設獨立頁的 body margin）、`package.json`（便利指令）、`tests/`、`tools/`、此 README、`VALIDATION.md`。`dist/` 僅包含入口、樣式與六個 JS／CSS 模組，不含測試、來源專案、設定、環境檔或 source map。

## 保留的功能與實際範圍

- 開始／結束日期、原生日期欄位 required 驗證、起訖順序提示、送出按鈕忙碌狀態、成功與錯誤訊息。補上原本由後端執行的有效日期、2000–2100 年與最長 366 天檢查。
- 整棟使用率、占用時數、可開放時數及教室數四張卡片。
- CSS 長條比較圖、教室統計表；兩者由同一報表以使用率遞減、同值名稱 `zh-TW` 排序，null 排最後。沒有新增點擊排序。
- 開放日數、排除假日數、原生 `<details>` 假日清單開合、最後計算時間（以台灣時區顯示）。
- 原有手機堆疊版面、兩欄卡片與表格水平捲動、焦點樣式、aria 狀態。

原畫面**沒有**學期／教室／場地選單、文字搜尋、可切換排序、分頁、圖表 tooltip／圖例切換、預約紀錄明細彈窗、資料編輯、匯出／下載／列印／上傳；因此沒有添加這些操作。地點在原 API 中固定，展示也固定為虛構學苑。長條圖為 DOM/CSS，不使用圖表函式庫。

## 啟動、建置與檢查

在此目錄執行（Windows PowerShell 請使用 `npm.cmd`，避免 `npm.ps1` 執行原則限制）：

```powershell
python -m http.server 4174 --bind 127.0.0.1
# 瀏覽 http://127.0.0.1:4174/?view=utilization
```

不需 npm install。ES modules 需 HTTP 靜態伺服器；不建議雙擊 `file://` 預覽。

```powershell
node --test tests/*.test.mjs
python tools/build.py
python tools/verify.py
```

也可使用 `npm.cmd test`、`npm.cmd run build`、`npm.cmd run dev`。建置只是以明確清單複製可運行資源至 `dist/`，無轉譯及外部下載。

`python tools/export.py` 僅在原專案中需要重新抽取頁面時使用，會覆寫 `index.html`、原 renderer／validator／navigation 的整理版與樣式，不覆寫 `mock-data.js`、`utilization.js` 或 README。執行後請重新建置、測試。作品集整合不需原專案或此工具。

`python tools/verify_port.py` 是原專案內的額外驗證：需要原 Python 依賴（如 SQLAlchemy、holidays），只呼叫原純 `build_report`，不連線任何資料庫；也以暫時的 loopback HTTP 伺服器測試多層子目錄載入，結束即關閉。部署及一般檢查都不需要它。

## 整合至靜態作品集與 GitHub Pages

最直接方式：將 `dist/` **內容**複製到作品集的 `demos/classroom-utilization/`，例如 `docs/demos/classroom-utilization/index.html`，連結至 `./demos/classroom-utilization/?view=utilization`。入口的 CSS／JS 與模組 import 全為相對路徑，支援 `/<repository>/demos/classroom-utilization/`，無根目錄 `/src`、API 或 SPA rewrite 需求。保留結尾斜線，或明確指向 `index.html`。

若要嵌入現有頁面，建議 iframe，完全隔離作品集導覽、ID、字型與全域樣式：

```html
<iframe src="./demos/classroom-utilization/?view=utilization"
  title="教室使用率互動展示" style="width:100%;height:1500px;border:0"></iframe>
```

若選擇直接組合 HTML，將 `#utilization-demo` 容器及其內容放入頁面、載入 `src/styles.css` 與 `src/main.js`，不要載入 `standalone.css`。保留相對模組目錄結構；同頁限一個展示，既有 DOM 不應重複目標 ID（例如 `utilization-view`）。作品集的全域 `!important` 規則仍可能影響嵌入結果，因此 iframe 是建議方式。

CSS 選擇器均加展示容器前綴；`:root` 的色彩變數與字型也移到展示容器，避免改動作品集導覽。未引用任何外部字型檔：沿用原 `Inter, "Noto Sans TC", "Microsoft JhengHei", sans-serif` 系統字型堆疊，實際呈現依裝置已安裝字型。圖示 `▦`、箭頭均為原 Unicode 字元，不需圖檔；原頁無需額外圖片。第三方 runtime 依賴：**無**。實際檢查環境 Node.js 24.22.0、Python 3.14.6；純靜態部署不需要兩者。

入口附 CSP：禁止 connect、外部程式及外部資源。`style-src` 允許 inline 是為了原長條 renderer 的動態寬度；沒有 inline script。直接嵌入時應以作品集自己的 CSP 為準，請確保原長條寬度仍可設定。

## 模擬資料、重設及範例操作

`src/mock-data.js` 定義 `rooms`、`reservations`、`closedDates`，只由 `src/utilization.js` 彙整；卡片、圖與表不分別硬編統計。教室 ID 為 `DEMO-*`，均非原系統資料。預約欄位對應原 `resource_id`、`reservation_instance_id`、`start_date`、`end_date`；`status_id` 代表原查詢前置篩選，僅 1 有效。額外的虛構 title 只供理解範例，原使用率頁不顯示預約標題。沒有預約者或講師個資。

| 日期 | 展示結果 |
| --- | --- |
| 2026-10-01～2026-10-07（預設） | 4 間、101.5 / 280 h、36.25%；晨光 100%、森林 41.43%、海風 3.57%、留白 0% |
| 2026-10-01（單日） | 含查詢前開始的跨日預約；有效占用 16 / 40 h、40% |
| 2026-10-09～2026-10-10 | 全展示休館；使用率「不適用」，假日清單 2 筆 |
| 2026-10-11 | 一般週日仍開放，沒有有效預約，0% |
| 2026-11-01～2026-11-07 | 無預約；仍顯示全部 4 間教室及 0%，不是空白畫面 |
| 起日晚於迄日／超過 366 天 | 原訊息區顯示驗證錯誤，可改日期重新送出 |

原始系統按日期查預約，不按日期刪除教室清單，因此「查詢無結果」應呈現零預約，不能人為隱藏所有教室。renderer 的 rooms=[] 分支仍保留並以資料測試覆蓋；正常固定教室資料不會進入該分支。

本頁沒有資料異動，不使用 localStorage、cookie、登入或資料庫。重新整理會重設為預設展示日期；資料檔修改後，重新整理並重新建置即可。日期範圍可查 2000–2100，但虛構預約只涵蓋示例日期，其他日期大多為零預約。

## 計算方式與限制

已找到明確後端公式，`src/utilization.js` 移植其純運算：

1. 台灣時區、日期雙端包含，所有一般週末開放。每天 09:00–12:00、13:30–17:30、18:45–21:45，共 10 h；休息時段不計。
2. 去除教室名稱空白後，以名稱尾綴排除講師休息室、線上教室01、線上教室02。沒有預約的教室仍計分母。
3. 模擬原 SQL 僅納入 `status_id=1` 的實例；預約時間裁切到查詢範圍及開放窗口，同教室重疊／相接區段合併，跨日可計入多天。
4. 每教室有效預約次數是至少與一個開放窗口重疊的不同 `reservation_instance_id` 數量，不是合併區段數，也不是課堂／人次。
5. 教室使用率 = 合併占用毫秒 / 可開放毫秒 × 100；整棟 = 所有教室合計占用 / 所有教室合計可開放 × 100。內部不先將各筆時數四捨五入；回報小時／百分比最多 6 位小數，原 renderer 用 `Intl.NumberFormat('zh-TW', {maximumFractionDigits:2})` 顯示最多 2 位，小時卡片附 `h`。分母 0 回傳 null、顯示「不適用」。

本機使用毫秒；範例全為整秒，已用 7 組日期與原 Python 計算逐欄完全相等比較。Python 與 JS 在極端小數的四捨五入 tie 規則不完全相同，未驗證任意微秒精度資料。

**假日日曆是有意保留的限制**：原程式以 Python holidays 的台灣行事曆加機構覆寫檔求休館日。展示未攜帶該套件、機構檔或正式日曆，而是使用兩個明確標示的虛構休館日；其他日期視為開放。純占用運算已移植，但不可把展示結果視為正式營運或國定假日統計。

原系統資料庫故障後的舊快照／503 錯誤無法在無後端展示中重現，`is_stale` 固定 false、`updated_at` 是本機本次計算時間。未虛構故障操作或添加控制介面。原始 renderer 的錯誤提示及取消流程保留，但本機計算通常立即完成。

實際執行及未驗證項目詳見 `VALIDATION.md`。
