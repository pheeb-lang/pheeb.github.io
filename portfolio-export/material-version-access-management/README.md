# 教材共用、版本發布與觀看權限管理

這是依目前 checkout 的 Moodle `local_classgroup` 實作轉出的純 HTML／CSS／JavaScript 互動展示。不需安裝套件或建置，不呼叫 API，不依賴 PHP、登入、資料庫或內部服務。頁面明示「展示資料：發布、匯入與權限設定僅作用於本機模擬資料」。所有班級、人名、教材與紀錄均為自行建立的虛構範例。

## 啟動與作品集整合

在 `C:\MoodleServer502` 執行：

```powershell
python -m http.server 8766 --bind 127.0.0.1
```

開啟 `http://127.0.0.1:8766/portfolio-export/material-version-access-management/`。亦可在本目錄執行相同命令，開啟根網址。請使用靜態 HTTP 預覽，避免 `file://` 的儲存差異。

複製**整個目錄**到作品集，例如 `demos/material-management/`，以相對連結 `demos/material-management/index.html` 導入。無 build 步驟；此目錄已是可部署的靜態成品。GitHub Pages 可放於 `https://帳號.github.io/儲存庫/demos/material-management/`，不用設定 base URL。沒有 `/assets` 絕對路徑；頁面切換使用 hash，不需要伺服器路由重寫。重新整理、上一頁及下一頁保留標準瀏覽器行為。這次未建立 GitHub workflow、未啟用 Pages、未提交、推送或部署。

樣式全部限於 `#material-demo`。嵌入既有頁面時，保留這個容器 ID 並避免重複 ID；建議直接以獨立頁面連結或 iframe 整合。若作品集本身會對 `button` 等元素套強制全站樣式，iframe 能提供更完整的樣式隔離。單頁不可放置兩份相同展示容器。

## 實際來源與導覽確認

查核依據為目前檔案的 route、require、資料查詢及呼叫關係，**未登入正式 Moodle 做畫面驗證**。不能把本展示視為原站已部署狀態的證明。完整對照見 [SOURCE-MAP.md](SOURCE-MAP.md)。

1. `db/hooks.php` 註冊 `hook_callbacks::extend_primary_navigation`；`classes/hook_callbacks.php` 加入班別管理入口，依角色／可編輯類別及指派班別決定入口。網站管理員才有其管理子選單，包含班別課程、班級與班級課程。
2. `offerings.php` 第 297 行建立「班級課程教材」→ `content.php?id=offeringid`；`offering.php` 直接 redirect 至同一路由，並非另一套舊版教材頁。`lib.php` 也在 Moodle 課程管理導覽中，對 `content_access::can_manage` 成立者加入教材入口。
3. `content.php` 載入 `template_service::versions_for_offering`，處理 import、bulk、empty、process，並在表格設定連結進入 `material.php?id=offeringid&cmid=活動ID`。後者載入 `material_form`，儲存呼叫 `material_service::save`。
4. `templates.php?id=curriculumid` 是可直接執行的 PHP route，呼叫 `require_curriculum`，處理編輯、指定課程、具名發布與立即處理；版本由同一個 `template_service` 建立，並由上面的班級教材流程讀取。**但全專案搜尋目前未找到其他頁面連到這個 route；`curriculum.php` 只有課程／搜尋連結，沒有「共用範本課程」連結。** 這是原 checkout 的導覽缺口；無證據宣稱原選單已接通，也沒有另一份候選範本管理實作可供替換。因此展示版提供清楚標示的「展示流程入口」，不修改原系統來補接。
5. 三個核心頁面沒有載入專用 JS 或 AMD 模組，主要靠 PHP 表單提交與重新整理。`sortable_offerings`／`autosave_offerings` 只供課程管理頁，AI JS 亦不屬本流程，均未帶入。Moodle 的表單元件原本負責 autocomplete、hideIf、日期選填與驗證；展示版以本機 JS 及原生表單元件相容。

### 角色與存取條件

- 原頁面均 `require_login()`；寫入要求 sesskey。展示版固定以可管理者的結果呈現，移除登入與憑證，沒有提供虛假的安全角色切換。
- 範本：`require_curriculum` 限 active curriculum，進一步透過 `curriculum_service::can_edit` 檢查類別 `local/classgroup:create`／`manage`，或班別內指派導師／講師（含 person 關聯）。指定既有課程另需 `moodle/course:update`，排除首頁及已作為班級 offering 使用的課程。
- 班級教材：`content_access` 限有效使用者、該班指定導師（含有效 person 關聯）或班別類別 `local/classgroup:manage`。單有講師指派不等於可管理班級教材。`db/access.php` 的 manage/create/view 預設賦予 manager、editingteacher，但判斷還受 context 與實際關聯影響。
- `require_offering` 阻擋其他 offering 共用的 course、curriculum 的 course/sourcecourse，以及 coursemaster 的 templatecourse。`material.php` 同時限制 cm 必須屬於本 offering 的 course。

## 資料關聯與匯入規則

```text
班別 program + 主課程 coursemaster
  ├─ 共用課綱 curriculum（local_classgroup_course）
  │   ├─ 可編輯的 Moodle course / sourcecourse
  │   └─ 發布 version（curriculumid、sourcecourseid、status、catalog）
  └─ 班級 class → offering（同 program + master，獨立 course）
      ├─ contentjob（versionid、selection、requestkey、status）
      └─ content（offeringid、cmid、versionid、sourcecmid、variant、audience…）
```

可用版本必須符合 active curriculum、同 program、同 master，且 status 為 `ready`。`catalog` 的原始欄位是 `id/name/module/section`；展示額外保存自行撰寫的 `text`，用來驗證內容快照。班級教材保存獨立活動 ID；追溯來源用 `versionid + sourcecmid`，不會用來源活動 ID 取代班級活動 ID。

原系統排隊時記錄 sourcecourseid，實際備份與 catalog 在 `build_version` 執行時產生。依本次展示要求，展示版**在按下發布時即深拷貝範本內容**，之後只改處理狀態；這與正式系統備份時點不同，避免訪客在延遲期間換範本使快照漂移。既有 ready 版本與已匯入教材永不隨範本變更同步覆蓋。可指定「探索方法・進階範本」再發布，以觀察新增教材與舊快照並存。

匯入時至少選一份有效教材；選取 ID 去重及排序。原系統以 `SHA256(versionid:selection)` 搭配 offering 唯一鍵去重；本機直接用相同正規化字串作 requestkey。相同請求返回既有工作；失敗請求重新排隊；重疊教材依 `(offeringid, versionid, sourcecmid)` 過濾，不重複新增。原表單把已加入教材停用，未加入預設勾選。不同版本的同一來源教材可並存；新版匯入使用 adding 行為，保留既有教材及學習紀錄，不做覆寫、刪除或紀錄移轉。

新教材預設 `audience=hidden`、空白 variant、無時間限制。匯入成功才建立尚未建立的獨立班級課程（本機僅產生 ID）。原版支援的「建立空白班級課程」亦有保留。`learningRecords` 是僅供檢查不被變動的虛構資料，不提供統計介面。

## 建議展示流程

1. 開啟「共用範本課程」；預設有同一範本 1.0、2.0 與處理中的秋季版。可切換另一個「溝通表達」共用課程。
2. 選擇「探索方法・進階範本」，按儲存變更；輸入版本名稱並發布。
3. 新版本先顯示等待處理。約 1.5 秒後按「重新整理進度」看到處理中；排隊後約 4.5 秒再次重新整理看到已完成。也可按原版的「立即處理」，再等 3 秒重新整理。
4. 前往「班級課程教材」選「星河探索班／探索方法」（初始尚未建立課程）；選剛發布的版本，勾選教材並加入。重新整理查看工作狀態，完成後列表出現教材且預設不開放。
5. 進入教材「設定」，填講師／教材版本文字，選指定群組或學生，啟用開放／結束時間並儲存；返回列表確認觀看對象及 variant 更新。
6. 勾選多份教材，批次套用不開放或全班可見。晨光班另有四種觀看設定範例及一份限制衝突案例；若選到衝突教材，整批設定維持原樣。
7. 改選舊版本，確認教材仍在；同版本已匯入項目無法再勾選。點「重設展示資料（展示工具）」可確認或取消重設。

原核心流程沒有發布／匯入／批次儲存的確認彈窗，因此未另加這些確認。展示工具的重設確認與課程編輯器限制說明使用 dialog，並非宣稱原版有相同業務彈窗。

## 觀看設定與驗證

- `variant` 為最多 255 字的自由文字，**不是**講師關聯或可切換的範本版本。每份教材可設定不同文字，不會變更其匯入來源版本。
- audience 沿用 `hidden/all/groups/students`。指定群組／學生必須至少選一個；群組屬於目前班級課程，學生屬於目前班級。種子只放有效、未停權的虛構學生。自動管理的教材群組不列為可選群組。
- 原版用 autocomplete multiple + hideIf；展示改為具搜尋欄的原生 multiple select，切換 audience 隱藏無關欄位。這是最小相容元件，不依賴 Moodle autocomplete JS；原生多選在手機及桌面樣貌會不同。
- optional datetime 未啟用為 0（不設該側界限）；可單填開始或結束。開始非負、結束非負；結束有填時必須嚴格晚於開始。開始含當下，結束不含該時刻。前端內部用毫秒；正式表格使用 Unix 秒。顯示／輸入採訪客瀏覽器本地時區，沒有伺服器／使用者時區轉換。
- 批次只支援 hidden/all，不批次修改講師文字、對象名單或時間；原程式會保留原規則帶入 save，原有時間仍存在。任一驗證失敗整批回復。
- 正式 `baseavailability` 與新群組／時間條件以 AND 合併，群組內採 OR；展示保留對應資料概念。正式指定學生會建立 managedgroup、維護成員，切換模式會移除該 managedgroup 成員；展示直接保存 student IDs，沒有建立 Moodle 群組。可見結果相同，不宣稱執行群組同步。
- 原活動限制若與 appliedavailability 不一致即拒絕覆蓋；示範的「資料整理練習／討論版 2.0」有 `conflict:true`。這是本機模擬後端保護，而非真的偵測 Moodle 編輯。共用課程保護案例也會顯示原錯誤訊息。
- 停用限制存取時，群組、學生或任一時間限制不可儲存；無時間的全班／不開放仍可儲存。

純前端**只能模擬管理表單與可見狀態，無法保護公開靜態教材、JavaScript 或 localStorage**，不代表正式環境的伺服器權限控制。任何人可直接開啟公開教材，也可改寫本機資料。外部影音權限不會因此改變。沒有加入學生預覽。README 預期情境：全班無時間可見、hidden 不開放、指定群組僅符合組員、指定學生僅名單內、未到開始／已達結束皆不應開放；正式環境仍由 Moodle enforce。

## 模擬、保存與開發驗證

資料位於 [assets/data.js](assets/data.js)，主要規則位於 [assets/domain.js](assets/domain.js)，頁面與事件位於 [assets/app.js](assets/app.js)。初始 2 個共用課綱、4 份可指定虛構課程、4 個版本、4 筆班級課程、5 份班級教材、群組與學生。教材是內嵌短文與 [materials/practice.html](materials/practice.html)，不含正式 PDF、備份檔或影音。短文為本展示自行製作，CC0。

`settle` 使用固定 1500ms 排隊＋3000ms 處理延遲。沒有計時器即時重繪、輪詢、通知推播或真背景工作；在初次載入、切換頁面及手動重新整理時，依保存的時間更新狀態。離開網頁後沒有處理程序，重開時只按經過時間推算。等待過久再刷新可能直接從等待到完成，符合原版只在刷新看到狀態的互動。立即處理／重試改為 processing，3 秒後刷新完成。原 Moodle ad-hoc task 的失敗／排程重試不會在前端真正執行；本機失敗後保留 error 直到手動重試。

開發失敗入口：`index.html?dev=1#templates`。頁底「開發驗證工具（非正式功能）」可選「下次發布／匯入模擬失敗」。發布後等 4.5 秒刷新，會看到失敗；按立即處理、3 秒後刷新可完成。匯入同理。也可切換限制存取啟用狀態以驗證錯誤。此開發旗標不出現在一般展示頁，不改教材版號或版本名稱來觸發失敗。

使用單一 localStorage key `portfolio-material-version-access-v1`，與其他作品集展示隔離；存版本快照、班級教材、設定及工作時間。重新整理保留變更。以同網域／port 儲存（不同路徑共用這個 key）；若需同站放多個獨立副本，調整 `app.js` 的 KEY。禁止儲存正式或私人資料。本機儲存停用／額度不足時顯示提示，變更僅留記憶體。重設只重建本展示 seed，不清空整個網域 localStorage。故意損壞或舊 schema 會以 seed 重新初始化。

## 匯出檔案及視覺依賴

| 檔案 | 用途 |
| --- | --- |
| index.html | 限定範圍的容器、導航、提示、展示工具與對話框 |
| assets/app.js | PHP 畫面轉靜態 DOM、form/table 結構、事件與安全文字逸出 |
| assets/domain.js | 範本發布、匯入冪等、觀看驗證與本機交易 |
| assets/data.js | 虛構班級、人員、範本、版本快照、短文 |
| assets/compat.css | 必要 Boost/Bootstrap 相容樣式，僅作用於容器 |
| materials/practice.html | 可合法公開的自行製作教材 |
| sources/*.txt + manifest.json | 8 份實際核心程式的原文參考與 SHA256，僅供來源比對，不執行 |
| tests/ | 零外部套件的規則、模板／事件及靜態檢查 |
| SOURCE-MAP.md、VERIFICATION.md、NOTICE.md、LICENSE.txt | 來源、實測與授權 |

保留模板頁的 edit → bind → release → version table 順序，班級頁的版本 select／教材勾選／工作提示／教材表格／bulk 順序，單教材表單的 variant／audience／groups／students／optional dates／action buttons。保留 `btn`、`form-control`、`form-select`、`generaltable`、`mform/fitem/row/felement` 關係；沒有以截圖代替頁面。

此三頁沒有專用插圖、圖片或自訂字型；原版由 Moodle Boost 的 admin layout 與 Bootstrap 提供基礎樣式。展示保留 system-ui 等原始 fallback 字型序列與 Boost `#0f6cbf` 主色、白底、表格邊框、圓角按鈕及通知色，不載入 Font Awesome、外部字型或全套 Moodle。`local/classgroup/styles.css` 的主要自訂規則供我的班級卡片、完整管理表格及 AI 畫面，非本三頁表單所需，未整包複製。相容 CSS 與頁面框架是最小抽取，並非原站編譯 CSS 的逐像素複製；未取得原站主題設定與瀏覽器畫面，不能宣稱像素級一致。

## 已排除與限制

完整班級、人員管理、課綱匯入、班級課程發布、AI、統計、版本比較／回滾、協作、浮水印、下載防護均未實作，也沒有失效入口。Moodle 完整編輯器按鈕保留並顯示限制說明，不提供假編輯器。核心三頁本身沒有檔案上傳；新增活動／上傳原屬完整課程編輯器，故不額外發明上傳功能。純前端不做課程備份／還原、MBZ 解壓、真實活動模組、檔案去重、學習紀錄移轉、交易鎖、Moodle 事件或 cron。多分頁同時修改未實作協同鎖，後寫入的儲存可能蓋掉另一分頁的本機變更。

## 檢查

```powershell
node tests/domain.test.cjs
node tests/render.test.cjs
python tests/check_static.py
```

本機若 PATH 沒有 Node，可用 `& 'C:/Program Files/nodejs/node.exe' tests/domain.test.cjs`（render 同理）。HTTP 子目錄與資源檢查記錄、未完成的瀏覽器 QA 及人工重測清單見 [VERIFICATION.md](VERIFICATION.md)。`sources` 只有程式原文，sesskey 等是函式呼叫文字，不包含登入憑證；沒有 `.env`、秘密值、正式教材或資料庫匯出。來源掃描是模式與人工檢查，不是對所有形式機密的形式化證明。
