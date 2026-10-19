# 原始來源與移植對照

所有路徑相對於專案根目錄；原 plugin 前綴為 `moodle/public/local/classgroup/`。調查日期：2026-10-19。參考原文複本在 `sources/`，只保留本流程直接需要的 8 份檔案；PHP 儲存為 `.php.txt`，不會執行。

| 原檔 | 正式用途／載入證據 | 展示對應 |
| --- | --- | --- |
| db/hooks.php、classes/hook_callbacks.php | 註冊 primary hook；班別選單→curriculum/classes/offerings，依網站管理員及指派／能力決定 | 精簡導航；範本缺口另標展示入口 |
| lib.php | 課程管理節點→content.php，先檢查 can_manage | 班級課程列表→教材 |
| classes/local/ui.php | admin layout、URL、title、heading；navigation() 回傳空字串 | h1 與最小 admin 相容框架 |
| curriculum.php | active 課綱資料表格；目前只有 course view/search link，沒有 templates.php link | 不宣稱此處已提供範本發布入口 |
| classes/local/curriculum_service.php | can_edit：類別能力或班別導師／講師；course/master/sourcecourse 關聯 | 虛構可管理資料，README 明列正式條件 |
| offerings.php:297–298 | 真正連至 content.php?id=offeringid | #offerings → #content?id=… |
| offering.php | redirect 至 content.php | 不另外製作舊授課畫面 |
| templates.php | require_curriculum；edit/bind/release/process；版本表格 | renderTemplates；forms edit/bind/release、process 按鈕 |
| content.php | require_offering；versions_for_offering；selection[]；contentjob 狀態；bulk 僅 hidden/all；material.php 設定 link | renderContent；queueImport、bulk、empty、process |
| material.php | cm 屬於 offering course；本課程可選群組（排除 managedgroup）、本班 active 且未刪除停權學生；material_form；save | renderMaterial；班級限定選項、安全 cm lookup |
| classes/form/material_form.php | variant 255 字；audience 四選；多選 autocomplete + hideIf；optional dates；save/cancel；required 與時間驗證 | mform/fitem/row/felement；原生多選加搜尋；optional datetime；錯誤通知 |
| classes/local/template_service.php | queued 版本→user-free backup→catalog；僅 ready 可用；requestkey 去重；選定活動 restore TARGET_EXISTING_ADDING；匯入 hidden | domain.release/versions/queueImport/settle；獨立深拷貝、追加教材 |
| classes/local/material_service.php | 時間／對象／variant 驗證、managedgroup、baseavailability AND、新限制衝突、visibility、交易與 cache/event | domain.save/bulk；保留語意；不操作真群組、cache/event |
| classes/local/content_access.php | 指派導師／類別 manage；防共用 offering／範本課程；有效使用者 | domain.offering 的本機保護案例；不模擬安全登入 |
| classes/task/prepare_content.php | ad-hoc execute 分派 version/import，catch 後標 error 並 rethrow | settle 的 error；人工重試；時間推算，非真背景工作 |
| classes/local/content_schema.php | upgrade 從 db/install.xml 建三個 content 表 | 不帶資料庫依賴 |
| db/install.xml | version(curriculumid)；contentjob(offeringid,versionid,requestkey,selection)；content(offeringid,cmid,versionid,sourcecmid,variant,audience,groupids,managedgroupid,timefrom,timeuntil,base/appliedavailability) | data.js 的 versions/jobs/materials，毫秒時間與學生 ID 為本機簡化 |
| db/access.php | manage/create/view 預設 manager、editingteacher；課程類別 context | README 權限說明 |
| lang/zh_tw/local_classgroup.php:3–46 | 標題、按鈕、狀態、提示與錯誤文案 | 同義文案；僅將正式備份／平台敘述改成展示限制 |
| theme/boost/scss/preset/default.scss、bootstrap/_variables.scss、design-system/tokens/scss/_primitives.scss | Boost 字型 fallback、primary #0f6cbf、圓角與表單表格樣式來源 | assets/compat.css scoped 最小相容規則 |
| styles.css | 多為我的班級 master/detail、完整班級表格、AI；非三頁專用表單 CSS | 不攜帶無關整包樣式、圖示、字型或 AI assets |

原頁三個檔案均沒有 `js_call_amd` 或 script 載入。Moodle 核心表單與 Boost 的 JS 由執行環境提供，本展示以原生元件代替。沒有另搬 `aihelper.js`、`sortable_offerings`、`autosave_offerings`；它們不提供本次教材流程的互動。

本 checkout 存在既有未提交修改；調查與匯出沒有改寫原系統檔案。sources/manifest.json 記錄的是本次讀到的內容，並非宣稱上游某 commit 的原始版本。授權見 NOTICE.md。
