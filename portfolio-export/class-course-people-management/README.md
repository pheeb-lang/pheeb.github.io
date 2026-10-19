# 班級、課程與人員整合管理｜靜態互動展示

純 HTML／CSS／JavaScript，不需建置。所有資料均為虛構；所有操作僅影響此瀏覽器的本機模擬資料。沒有 API、PHP、Moodle、資料庫、登入或 iSpan 執行依賴。

## 啟動與部署

在專案根目錄執行：

```powershell
python -m http.server 8080 --bind 127.0.0.1 --directory portfolio-export
```

開啟 `http://127.0.0.1:8080/class-course-people-management/`。請使用靜態 HTTP，避免 `file://` 的瀏覽器差異。無需 npm、套件下載、環境變數或建置。

將整個目錄複製到作品集，例如 `projects/class-course-people-management/`，用相對連結導向 `projects/class-course-people-management/index.html`。不需要設定 base URL；資源、範例檔與文件均為相對路徑，頁面以 hash 導覽，例如 `index.html#offerings?classid=1`。刷新與上一頁不需要伺服器重寫，也不需要 404.html。GitHub Pages 只需沿用作品集原本的靜態發布方式，本次沒有提交、推送、發布或啟用 Pages。

建議用獨立頁或 iframe 嵌入；CSS 限制於 `#classgroup-demo`，但既有作品集的全域 CSS 仍可能影響內部元件。若直接合併到別的 HTML，需一併保留唯一的 root ID、scripts、dialog 與 CSP；建議 iframe 以隔離作品集的全域樣式。CSP `connect-src 'none'` 禁止連線；本展示無任何背景網路請求，僅載入同源靜態資源。沒有站台商標或公司素材。

## 如何判定是實際使用的畫面

以目前工作目錄的程式碼為準，並非根據檔名猜測，也未登入原站。追查鏈與來源版本雜湊見 [SOURCE-MAP.md](SOURCE-MAP.md)。

1. `db/hooks.php` 註冊 `classes/hook_callbacks.php` 的主導覽 callback；它建立「班別管理」、班級與班級課程選單，且**管理子選單只對網站管理員顯示**。`lib.php` 的全域入口還包含 `mycourses.php`；舊的 category settings 程式在 `return` 後，不算現行入口。
2. `index.php`、`persons.php`、`programs.php` 應以實際轉址目標判斷；`persons.php` 轉到 dashboard，沒有獨立的人員 CRUD。管理主線是 `dashboard.php → classes.php?classgroupid → offerings.php?classid`。
3. `classes.php` 是班級匯入、三欄搜尋、固定日期排序、20 筆分頁與列內新增，實際載入 `local_classgroup/autosave_classes`。`classes/form/class_form.php` 等候選表單不是此頁實際使用的編輯功能，未據此新增編輯或刪除按鈕。
4. `offerings.php` 實際使用 `offering_import_form`、`instructor_form`，並載入 AMD `autosave_offerings` 及 `sortable_offerings`。`offering.php` 轉到 `content.php`，不是獨立的課程設定表單。因此名稱與教材入口在本版顯示「未納入展示」，沒有失效連結。
5. `importstudents.php` 執行檔案解析後 include `mystudents.php`，呈現共用左右欄學生工作區；`mycourses.php` 是班級／課程卡片工作區。兩者使用 `workspace_sidebar.php`。

未確認部署資料庫的主題設定、快取與原站即時頁面，不能宣稱與部署站逐像素一致。

## 頁面與資料關係

| 原概念／表格 | 展示資料 | 關係與用途 |
| --- | --- | --- |
| 班別 `local_classgroup` | `programs` | 隸屬可管理的範本分類，具有代號及外顯碼系列；不是班級 |
| 課程主檔 `local_classgroup_coursemaster` | `masters` | 共用的課程代號／名稱，多班可參照同一筆 |
| 班別課程／課綱 `local_classgroup_course` | `curricula` | 班別與課程主檔關聯，包含規劃時數、順序及 active；本版預設資料供產生草稿使用，設定入口未納入 |
| 班級 `local_classgroup_class` | `classes` | 指向班別，包含期間、外顯碼、地點、教務與導師姓名；正式環境另建 Moodle 分類與 cohort |
| 班級開課 `local_classgroup_offering` | `offerings` | 班級＋課程主檔唯一組合，另有課綱 ID、實際時數、講師、順序、來源、狀態及可空的 Moodle courseid |
| 人員 `local_classgroup_person` | `persons` | 與模擬 user 分開，以 `userid` 連結；不把姓名字串直接視為已授權帳號 |
| Moodle user | `users` | 講師／學生帳號辨識用的虛構資料，無密碼或憑證 |
| 班級學生 `local_classgroup_student` | `members` | 班級＋userid 關聯，可在多班使用同一人，學號保留在班級關聯上 |

班級新增自動從所屬班別課綱產生草稿。補產生草稿只補缺項，已有相同課程主檔的開課不重複建立，必要時補課綱關聯。課程匯入會更新共用主檔名稱，因此其他班的列表也會反映該名稱；每班時數、講師及發布狀態仍各自獨立。

正式環境 `access_service.php` 將講師、班級導師、教務及 active 學生投影至已連結的 Moodle 課程，由 `enrol/classgroup/lib.php` 管理角色／選課。展示版以班級關聯直接計算學生列表，課程所屬班級共用該人員集合，不建立 Moodle 角色、cohort 或選課，也不假裝已完成這些外部副作用。`courseid` 與 `published` 是不同概念：發布不會建立 Moodle 課程；「我的班級」只顯示 fixture 中已有 `courseid` 的課程。

## 保留的互動與業務規則

- 班別匯入及列表、班級匯入；班級代號前綴搜尋、教務／導師姓名包含搜尋、清除篩選、固定開課日由新到舊／代號排序、每頁 20 筆。
- 班級列內新增：保留八欄與填完才啟用「確認儲存」；英數代碼、同班別代碼唯一、必填名稱／外顯碼／地點、有效起迄日期、教務與導師不得同人。姓名僅在 active 人員有唯一相符時解析。原 `create_class` AJAX 與班級匯入均呼叫 `create(..., false, false)`，所以**新增時不強制代碼／外顯碼前綴**；發布時仍檢查外顯碼系列。
- 班級課程匯入：必要名稱、代號、正時數、講師；檔內代號不重複。可新增主檔，更新既有 draft／error 開課；published 禁止覆寫。名單與課程匯入先在副本驗證，失敗不留下部分資料。
- 時數與講師列內自動儲存：輸入等待 700ms、change 即儲存，顯示儲存中／已儲存／失敗；另有原本的整表儲存按鈕。只選 active 且已有模擬 user 連結的人員；匯入的文字講師仍可保留。忠於原 endpoint：空白選項保留原指派，不額外做解除指派。
- 拖曳排序及成功提示，順序必須是當班全部開課 ID，完整且不重複。以原 drag handle 為互動入口；Moodle core SortableList 無法在靜態環境直接執行，改用原生拖放，並以同一移動圖示提供選擇目標位置的鍵盤／觸控相容操作。
- 新增講師表單：姓名、帳號、email；相同帳號與唯一 email 可沿用，兩者不一致拒絕。新建的是本機 user／person，沒有帳號通知或正式登入。
- 單筆發布、全部草稿發布（原頁面已有的操作）：先確認，可取消；講師與正時數、draft／error、外顯碼系列與課綱班別關聯驗證。全部草稿先驗證完再變更，error 不包含在「全部草稿」。確認頁改為原生 dialog，保留確認／取消決策。原站的失敗例外在本版顯示明確通知。
- 我的班級左右欄、課程卡片與搜尋；我的學生左右欄、名單、匯入及取消返回。
- 沒有自行增加表頭點選排序、批次刪除、班級編輯、學生移除、講師移除、行事曆或統計圖表。教務／導師依現行班級新增表單輸入姓名，沒有額外打造人員指派頁。

這些本機驗證是重現展示結果的業務邏輯，**不代表正式系統的登入驗證、授權、防竄改或安全控制**。

## 展示角色

固定使用原系統的「網站管理員」，沒有另外製造跨角色的超級管理畫面或角色切換。此角色能看見管理子選單及完整班級流程，亦能匯入所有可見班級的學生。

| 原角色 | 原程式限制（本版不提供這些角色的登入或切換） |
| --- | --- |
| 網站管理員 | 管理導覽子選單；頁面仍有 create／category:manage／manage 等能力檢查；作為本版展示角色 |
| 導師 `ispan_mentor` | 類別／課程情境有 create、manage、category:manage；`content_access` 也允許被指派的班級導師；my_courses_service 的導師班級清單可含所有匯入班級，並不表示所有班的課程都有管理權 |
| 講師 `ispan_instructor` | 課程情境，依可見課程顯示班級；不能把課程能力推廣成類別管理能力 |
| 教務 `ispan_academic` | 課程與類別情境的教務能力不包含班級 create／manage；班級可見性來自實際可見課程等條件 |
| 學生 `ispan_student`／student archetype | 可見課程／班級；student_import_service 明確排除學生，mystudents 不給名單存取，即使另有班級可見性 |

`classes.php` 要 create + moodle/category:manage；`offerings.php` 使用 content_access（所指派導師或班別 category manage）；建立講師另查 category manage；publish.php／publish_all.php 另要求 create + manage。學生匯入依 active、非訪客、非學生及可見班級清單決定，不應僅憑 importstudents capability 就開放全部班級。

## 模擬資料與匯入

`assets/data.js` 是唯一初始資料來源：2 個班別、6 筆共用課程主檔、6 筆課綱、28 班、84 筆開課、6 位教職人員、45 位學生。包含 draft／published／error、已連結課程、純文字講師及同一導師負責多班。姓名、地點、代碼與 email 都是虛構，email 僅用 example.com。

使用 localStorage key `portfolio.class-course-people.v1` 保存，導覽和刷新會沿用；此 key 在相同 origin 的不同子路徑共用。頁面頂端「重設展示資料（展示工具）」有確認與取消，可恢復所有初始資料。localStorage 不可用時降為分頁記憶體並通知；跨分頁同時編輯不做同步。不要輸入真實個資，這是本機展示。

| 範例 | 用法 |
| --- | --- |
| `examples/programs.csv` | 在班別管理新增虛構班別；新班別初始沒有課綱 |
| `examples/classes.csv` | 在網頁應用班別匯入一個新班級，附帶產生課綱草稿 |
| `examples/offerings.csv` | 在第一班更新 draft 的 DEMO-C2 並新增 DEMO-C7；第二次可更新草稿，發布後則拒絕 |
| `examples/students.csv` | 匯入已存在 student001 及新虛構學生；再次匯入不重複成員 |
| `examples/students-duplicate.csv` | 檔內重複帳號測試，整批拒絕 |
| `examples/students-conflict.csv` | 既有帳號與 email 衝突測試，整批拒絕 |

檔案上限 5 MB，支援 UTF-8（可有 BOM）、Big5 CSV，逗號／tab／分號自動判別，支援同列引號與雙引號跳脫。不支援跨行引號欄位。保留原畫面的中英文欄位別名及必要欄位檢查；班級日期使用完整兩位數月日。原系統支援 XLS／XLSX（PHP PhpSpreadsheet），本版未帶入試算表函式庫，請先轉存 CSV，所有匯入區已標示限制。

學生匯入保留 username 小寫化、同檔重複判斷、姓名／email 驗證、先 username 再唯一 email 沿用、停用或 email 不同拒絕、既有班級成員更新學號及恢復 active。選填 password 可被辨識但立即忽略，**不保存、不產生密碼、不建立真實帳號、不寄信**。帳號清理採示範用 ASCII `a-z0-9_.@-`，無法完整模擬不同 Moodle 設定下的 username Unicode 規則。

外部資料同步：`local/ispan_sync/cli/import.php` 與 `cli/link_courses.php` 操作 importer；未找到此主線的網頁同步入口。故本版無新增同步按鈕、不提供真實服務位址，也不執行同步。fixture 只呈現已有匯入來源及關聯的結果，不宣稱重現 CLI 操作。原 importer 的外部請求、日期／講師資料轉換、舊資料關聯修復均留在原系統。

## 建議展示順序

1. 班別管理 →「網頁應用開發班別」管理班級：查看 24 班，翻到第 2 頁，測試代號 `DEMO-WEB-00`、導師 `星河`、教務 `晴空` 後清除。
2. 新增資料填八欄，或匯入 classes.csv，觀察班級與草稿同步建立。再次匯入檢查代號重複。
3. 第一班 → 管理班級課程：更改時數、選講師並等待已儲存；拖曳或點移動圖示排序。新增虛構講師再指派。
4. 匯入 offerings.csv，觀察課程主檔名稱與開課分離；發布時先取消、再確認。嘗試不填講師發布新班草稿，確認驗證失敗。
5. 我的學生 → 匯入學生名單：下載／匯入 students.csv，再次匯入查看沿用結果；用 duplicate／conflict 範例測試整批回滾。取消返回名單。
6. 我的班級查看課程卡片，理解 published 與 courseid 不同。最後取消一次重設，再確認重設，恢復初始資料。

## 檔案、樣式與來源

| 匯出檔案 | 用途 |
| --- | --- |
| index.html | 獨立殼層、相對資源、管理入口、展示標示、重設、確認 dialog、CSP |
| assets/app.js | 從 PHP html_writer 畫面轉成靜態模板，保留主要容器、表格、卡片、欄位和 class／data 屬性關係；hash 路由與本機事件綁定 |
| assets/domain.js | 原服務中影響操作結果的本機規則，副作用以資料模型代替 |
| assets/data.js | 可重建的純虛構 fixture |
| assets/original.css | 原 styles.css 在 AI helper 區段之前的相關規則，略去未使用的全站殼層／standard-course 列表樣式，加入 #classgroup-demo scope；涵蓋班級工作區、名單、課程表及手機斷點 |
| assets/compat.css | 最小 Boost／Bootstrap 相容字型、表格、按鈕、表單與通知；展示殼層樣式 |
| examples/ | 全部為虛構 CSV，可在頁面下載 |
| tests/ | 依賴 Node built-ins 的業務規則／模板狀態測試、Python 靜態／HTTP 檢查 |
| SOURCE-MAP.md、VERIFICATION.md、NOTICE.md、LICENSE.txt | 來源追查、實測界線與授權 |

原流程沒有獨立網頁字型或圖片依賴。採 Boost 系統字型堆疊，不複製整套 Moodle。drag handle 以文字移動圖示取代 core template／Font Awesome 依賴；核心拖曳、通知、filepicker 與確認頁改為最小本機相容元件。表格在手機保留原 min-width 與橫向捲動，工作區沿用原手機斷點。全站導覽、頁首與主題設定未完整複製，不能保證自訂主題完全相同。

## 檢查與限制

```powershell
python portfolio-export/class-course-people-management/tests/check_static.py
# 若本機已安裝 Node（展示本身不需要 Node）：
node portfolio-export/class-course-people-management/tests/domain.test.mjs
node portfolio-export/class-course-people-management/tests/render.test.mjs
```

詳細實測結果見 [VERIFICATION.md](VERIFICATION.md)。目前可用瀏覽器清單為空，內建瀏覽器回報不可用，故沒有桌面／手機截圖、真實拖放、原生 file input、自動儲存時序、瀏覽器上一頁／刷新或原站視覺對照的通過宣告。請在正式展示前以可用瀏覽器依上述流程實測。

教材版本、教材課程內容、AI 小幫手、學習統計、班別課綱設定、正式 RBAC／登入、真實帳號／cohort／Moodle 課程建立與外部同步不在展示範圍。固定管理員展示沒有擴大任何其他角色權限。本版無後端、無多人併發或存取保護。
