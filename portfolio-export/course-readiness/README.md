# 教室管理：逐堂安排講師與開課檢核

這是可獨立部署的純 HTML／CSS／JavaScript 展示，資料全部虛構。只修改此匯出目錄，沒有變更原系統、提交、推送或發布。

## 已確認的來源

以目前主系統為準，未從既有 portfolio-export 複製：

- `frontend/index.html`：主導覽 `data-view="instructors"` 的文字為「教室管理」，頁面為 `#instructors-view`，標題為「教室管理」。
- `frontend/src/navigation.js`：以 `?view=instructors` 選取此頁；不是 `utilization`「教室使用率」，也不是 `lecturers`「講師管理」。
- `frontend/src/instructors.js`：`sessionButton()` 的 click 呼叫 `openEditor()`，開啟 `#assignment-dialog`，標題「安排講師與開課檢核」。保留其課程卡片、候選人搜尋與可用條件、選主講、清除接課確認、表單驗證、逐堂儲存及確認開課流程。
- `frontend/src/course-readiness.js`：保留 `canTeach`、`lessonRequired`、`interval`、`overlaps`、`inspectLesson` 的函式與原有狀態優先順序；只替換資格資料來源與課名正規化（虛構課名只需 trim）。
- `frontend/src/styles.css`：抽取原有基礎配色、系統字型、藍色課程卡片、表單、候選人、狀態標籤與右側面板樣式。外層課表改為依日期及有課教室分組，保留卡片樣式及原有點擊行為。

## 檔案與依賴

部署必需：`index.html`、`styles.css`、`app.js`、`course-readiness.js`、`demo-data.js`、`local-store.js`。

`tests/readiness.test.js`、`package.json` 只供開發檢查，不必部署。無第三方執行依賴、CDN、外部字型、圖片、登入、資料庫或 API。字型沿用 Inter、Noto Sans TC、Microsoft JhengHei、sans-serif 的本機候選順序，未安裝則由系統回退。

使用現代瀏覽器，需支援原生 `<dialog>`、ES modules、CSS `@scope`、`:has()` 與 `dvh`。未驗證舊版瀏覽器；建議 iframe 隔離宿主 CSS。

## 啟動與部署

不需安裝 npm 套件，也不需建置。請透過 HTTP 開啟，避免 file:// 的 ES module 限制。

在專案根目錄執行：

```powershell
python -m http.server 8765 --bind 127.0.0.1
```

預覽 `http://127.0.0.1:8765/portfolio-export/course-readiness/`。

在此匯出目錄可執行 `npm run check` 與 `npm test`（使用 Node.js 內建測試工具；本次為 Node.js 24.22.0）。Windows PowerShell 若阻擋 npm.ps1，使用 `npm.cmd run check` 與 `npm.cmd test`；本次實際使用後者，未調整系統執行原則。

GitHub Pages：將上述六個必需檔案放在作品集的 `demos/course-readiness/`（保留彼此的相對位置），隨既有靜態網站流程部署，即可使用 `https://你的帳號.github.io/儲存庫/demos/course-readiness/`。所有載入路徑均為相對路徑；沒有根路徑 `/src`、SPA rewrite 或環境變數。此任務未執行發布。

## 嵌入作品集

建議保留獨立文件，以 iframe 隔離 fixed 面板、遮罩、字型、宿主選擇器與捲動：

```html
<iframe
  src="./demos/course-readiness/index.html"
  title="教室管理：講師安排與開課檢核互動展示"
  style="width:100%;height:900px;border:0;display:block"
  loading="lazy">
</iframe>
```

相對 src 請依作品集目前頁面位置調整。手機可將 iframe 高度設為 `100dvh`。面板與 backdrop 僅涵蓋 iframe 範圍；宿主頁需自行提供足夠展示高度。不要額外添加會阻擋 scripts 或 localStorage 的 sandbox；若作品集自行使用限制，需另行驗證。

全部樣式置於 `@scope (.course-readiness-demo)`，避免作用到外部頁面；仍建議 iframe，避免宿主樣式反向干擾。直接合併 DOM 也須避免相同元素 ID 並保留此 body scope；尚未驗證各種作品集宿主環境。

## 精簡內容與情境

固定為 2026/11/05 與 11/06，只有拾光 201、青禾 202、晴嶼 203 三間虛構教室、六堂課。不依電腦當日日期。初始數量：全部 6、缺講師 1、待確認 1、有衝突／資格待補 3、已就緒 1。

| 課程 | 初始狀態與體驗 |
| --- | --- |
| 互動網頁入門，11/05 09:00–12:00，拾光 201 | 缺講師。選林沐禾或許映安，勾選已取得接課同意，等本機重新檢核完成，按「確認本堂開課」可完成整個流程。也可先儲存安排，之後再開課。 |
| 介面設計實作，11/05 13:30–17:30，拾光 201 | 許映安已安排、尚未接課，為待確認。勾選接課後可確認開課。 |
| 資料探索工作坊，11/05 09:00–12:00，青禾 202 | 陳星澄同時出現在 Python 課堂，形成講師時間衝突。 |
| Python 資料練習，11/05 10:00–12:00，晴嶼 203 | 與資料探索共用陳星澄，另與視覺化專題重疊同一教室；兩種衝突皆阻擋開課。 |
| 視覺化專題，11/05 11:00–12:00，晴嶼 203 | 周予森缺少此課資格紀錄，並與 Python 同教室重疊。即使改選合資格講師，教室衝突仍阻擋開課。 |
| 雲端應用入門，11/06 09:00–12:00，晴嶼 203 | 周予森資格、接課及開課確認都完成，初始已就緒。 |

取消候選人條件篩選，可看見不符條件的原因；搜尋支援姓名或專長。缺少資格紀錄不代表不會教，無排課衝突不代表已確認有空。

僅顯示該日期與篩選狀態實際有課的教室群組，沒有空白教室列、完整六日表、重複無排課格、使用率統計、公司導覽、圖片轉錄說明、歷史月份或會議管理。保留狀態篩選與數量、簡短提示、所有課程卡片及清楚空結果提示。外層範圍縮減只發生在本展示，原系統規則不變。

## 資料、檢核與儲存

`demo-data.js` 含完整六堂課、四位講師及獨立 `qualificationRecords`。目前展示沒有額外隱藏的會議紀錄；原有邏輯仍可檢查其他課程或會議占用，測試另有會議 fixture。

所有衝突檢查始終使用完整 `items`，不使用篩選後的清單。沿用原有嚴格重疊公式 `left < end && start < right`，端點相接不算重疊，以 `id` 排除課堂本身。支援帶時區 startAt/endAt，否則以台灣時間日期與時段解析。

依原規則檢查講師存在、資格紀錄、講師重疊、教室重疊、資料載入及接課同意；`opened` 控制最終已就緒狀態。面板列出原有五項檢核，資料載入狀態併入時間與教室項目，確認開課則由按鈕與卡片狀態表達；沒有新增另一套狀態。

開啟面板與確認開課前，由 `local-store.js` 模擬 120ms 本機重新載入並驗證完整資料；載入未完成或失敗會阻擋確認。沒有真正請求後端，也不會查詢現實中的資格、講師行事曆或接課情況。

更換主講師會清除接課確認；儲存安排沿用原規則，將本堂 `opened` 設為 false，需再次確認本堂開課。確認前會重新讀取面板最新值並檢核。每次只保存該 id，保留其他堂次；localStorage 寫入失敗不更新課堂。

本機儲存鍵僅為 `portfolio.course-readiness.assignments.v1`，不讀寫原系統儲存鍵。重設方式：在展示頁開發者工具的 Console 執行以下程式，重新整理即可；不在畫面新增管理按鈕。

```js
localStorage.removeItem('portfolio.course-readiness.assignments.v1');
location.reload();
```

同一 origin 的相同展示共用此鍵；不同裝置或網站不會同步。接課勾選只是訪客自行記錄，無法作為真實講師承諾。未提供正式後端、多使用者同步、跨分頁協調、講師通知、備選講師、整期批次指派、容量或設備檢查。

## 實際驗證與尚未驗證

已執行：JavaScript 語法檢查、Node 邏輯與靜態資源測試，涵蓋初始狀態、成功開課及重新載入、逐堂寫入不覆蓋、隱藏課程仍參與衝突、講師不存在／資格缺漏／時間衝突／教室衝突／未接課／資料未載入的阻擋、端點相接、自身排除、跨日重疊、會議占用、儲存失敗、相對資源存在及執行檔無外部請求。

另以本機 HTTP 實際請求子目錄頁面及全部六個執行資源，確認回應成功。沒有 .env、密鑰、Token、真實個資或公司服務位址；無第三方網路資源。

尚未完成瀏覽器視覺與互動驗證：工具回報 browser access host unavailable，嘗試既有 Chrome 視窗時因無法可靠辨識目前網址而停止。本次未宣稱已實測桌面、手機、右側面板捲動、焦點返回、Escape／Tab、搜尋／下拉／候選人點擊、空結果或完整 UI 點擊流程；這些保留原有事件與響應式 CSS，但仍需在實際瀏覽器人工驗收。GitHub Pages 正式網域與宿主 iframe 也尚未發布驗證。
