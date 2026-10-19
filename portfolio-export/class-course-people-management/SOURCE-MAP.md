# 原始來源對照與追查紀錄

調查日期：2026-10-19（Asia/Taipei）。以下 SHA-256 取自本機工作目錄，包含既有未提交內容，並非部署站或 Git commit 的保證。未複製設定、Session、真實資料或內部服務位址。

所有下列相對來源以 `moodle/public/local/classgroup/` 為起點：

| 來源 | 用途／判斷 | SHA-256 |
| --- | --- | --- |
| `db/hooks.php` | 主導覽 callback 註冊 | `cae6c563b320350016186ddecfd095265af35eebc6c82a27d7680a5fee4fb8d9` |
| `classes/hook_callbacks.php` | 角色分支、網站管理員管理子選單及目標路由 | `579ec4692ae550d5d4cc96b2646954507cb51817521962ea8057fd92e6f3a6d2` |
| `lib.php` | mycourses 全域入口；舊 category 選單 return 後不執行 | `374462fb94e50e2320da009ca61305f1862376bc2ad02685120200b687381844` |
| `index.php` | 轉址 dashboard | `9e8eea0cd98cebaf06493253b7dd53c13f449a95e34c5e971f1fb563022ca02f` |
| `persons.php` | 轉址 dashboard，沒有獨立人員管理表單 | `7e97417d61ff7fc79892c8abbfc53ed96a049e726b306b6bd3f62ef8b4ad8901` |
| `programs.php` | 轉址 dashboard | `dca3522705cd7786918e3e2c34b6d1847a842ff55038a3b5d4d77f496ca904d2` |
| `dashboard.php` | 班別匯入與班級入口 | `33c82c6d6632c21cd56525192d219f95caa16b047f8378cd802dd92f4726b2be` |
| `classes.php` | 班級匯入、搜尋、20 筆分頁、列內新增及 AMD 載入 | `a573e59d269f0749fa504478c38f2ed37e2b67ffcc85a01e6e5319587730b4e0` |
| `offerings.php` | 課程匯入、講師表單、時數／講師表格、發布及 AMD 載入 | `2e13b425d10ac2bca663d0b0a04232164c95a4d0b87cf6ecfb2e1a6eab276c5f` |
| `offering.php` | 轉址 content，不是課程編輯頁 | `007c4460f46ac466411cde1caaf3a091a8c39158b6a2c86019075483b18e302f` |
| `publish.php` | 單筆發布確認與 create+manage 檢查 | `e3dcfa5553d2130cca4c37645d10613d3665ddb67db7293c793c7730302414a2` |
| `publish_all.php` | 全部草稿發布確認與 create+manage 檢查 | `891d2239ecee5fdc1213ac0006b28ef5c6bc8114e32f3eb90d4d86071d1b851b` |
| `mycourses.php` | 班級／課程卡片與搜尋工作區 | `40e78fe65b8143e87a712f7c3f6ef4912e04e4ddf75b94ba097ee1bccf7f1a01` |
| `mystudents.php` | 學生名單、左右欄及可匯入權限 | `34fe00fa82d3f60ff6ba53eeecb66f0b7a8d872b162b89af5ecd9379233a0bb0` |
| `importstudents.php` | 名單解析與共用工作區載入 | `1a62d1f899f0a0869bf4807b0ff00d352c0d1e1e25ec4968e987278373274676` |
| `classes/local/workspace_sidebar.php` | 左右欄班級選單 | `c0fe39809cc3e8c13894c27f0cf79e24e92e787bfeffab09a42bece72de3e590` |
| `classes/local/class_search_form.php` | 共用三欄搜尋 | `3696bc0a16d2b961b7b50bb01bf4517dac41b2924f805f48a05ffd498b245d1c` |
| `classes/local/ui.php` | 頁面路由／標題、可管理類別檢查 | `bfdd39081f677957debd58f85e7a87af3f4cb7493077328d8016ecf30b0cc217` |
| `classes/form/import_form.php` | 範本類別選擇與班別檔案 | `44f5938098b06cf5f0f8d1ab81c95efc36a2fa0e2753d1152e048d3666ceb986` |
| `classes/form/class_import_form.php` | 班級檔案限制 | `adc807822c23bca6b549abb0876080ab9994ecf9c5c41de501747f2870630c00` |
| `classes/form/offering_import_form.php` | 班級課程檔案限制 | `6957c88e16c87fac1eb584de15056773e578076bbd0840adc33a2dfc0114057f` |
| `classes/form/instructor_form.php` | 講師姓名／帳號／email 必填 | `47422344384b31c2f658859db43ebd39762fd545eee2e29aa80ccaee9b2c4390` |
| `classes/form/student_import_form.php` | 學生檔案、5 MB 及取消 | `5799936b229d1d324b3d403fbb6f3b30190fadd97588a9f1ae7b6848e85f1226` |
| `classes/local/class_service.php` | 班級模型、唯一代碼、日期、姓名、草稿、固定排序與篩選 | `e8d1ab6071dd5e40d64337783e151977ee9ee858f734787ffe352a82840c9b9f` |
| `classes/external/create_class.php` | 真實 AJAX 新增使用 false,false 前綴旗標 | `201ce1c75697dca1de1ebbdddd9e1accc9a536d2e83e8aedc85d471da987b1a5` |
| `classes/local/offering_service.php` | 課程主檔、開課、時數、指派、排序與發布規則 | `0e96ac67cbb1e2a651f1c708b77684ca7830a137acc46faa1bd940838c92641e` |
| `classes/local/person_resolver.php` | 唯一 active 姓名解析、不自動新增人員 | `714eb8fb71209dbf90ce54be4d887139b5b563d602578b28d153319d80dbd499` |
| `classes/local/instructor_service.php` | 連結人員選項與帳號衝突規則 | `7f1d8852e00c3f3bbc6deeadbe8cd753c2a75b4a6d05d4566b59ed0e64ad9a1e` |
| `classes/local/student_import_service.php` | 學生排除、可見班級、匯入及去重 | `9228bbc34a2685648830f4ff5fda68980baba7ae72541036a0355e01bbfff67b` |
| `classes/local/role_service.php` | 四種業務角色的能力與情境 | `15a7686259a9d3c0f537ea825d1bca828014d97e32037f25b0959fbc3c35b64a` |
| `classes/local/content_access.php` | 班級導師與 category manage 權限 | `b7bbb408d99d20b77c75da13b65b96c07225b7c67e6ee9d3f53581f6fa61faf8` |
| `classes/local/my_courses_service.php` | RBAC 可見課程與班級清單 | `c21a4b0836e3b99a8a6cbc554cf04811a4640b72bb1eef409d4048b5f5d6c820` |
| `classes/local/access_service.php` | 班級／課程人員投影到 enrol_classgroup | `59ccdcf4aeabc88849c6b0c26301908b4359d4a6e3f481299238b30c791f17a3` |
| `classes/local/classgroup_service.php` | 可管理分類與班別建立 | `30ede7c5ca6aa77ef50efcc310c8bcd102d80d4e446d19c9b1ee92960342610b` |
| `db/access.php` | capability 預設角色 | `991a89b84b404bb9259ca9ba636a3360a4bf2bb6abc2e4329f7c456286410349` |
| `db/install.xml` | 原始資料表關係 | `35124d0407b80a0e0b336f33d7bb751e73190c0c95b71a1d8355dfb185df0971` |
| `amd/src/autosave_classes.js` | 新增列、完整輸入、確認儲存、狀態 | `d045741a1da616b8f399858e804445e07095000cea40bf5245413df4c057f549` |
| `amd/src/autosave_offerings.js` | 700ms debounce、change、自動儲存狀態 | `d166443803496933c6177fe4347d52a954cfe6c0e9e572cf5a62d3b694f87468` |
| `amd/src/sortable_offerings.js` | core SortableList 及完整 ID 順序 | `a2fc77f8386c8a36cc063ce8f2524b7313ad1a2f58a7f1b65d3821e52dc11359` |
| `db/services.php` | 三支現行前端 AJAX 的服務註冊 | `b335e72d543c1f907af3caaf83ad9aaf9e00983e4d3c44caaecb6ed315f322dd` |
| `styles.css` | 工作區、表格、卡片、學生及手機樣式 | `cd68242795f814892c2f4cb4b95a2459bbbbf05388bc5aa106074c08cc2863f2` |
| `lang/zh_tw/local_classgroup.php` | 原有畫面用語 | `9e9c1141c988166002fd62bc4bd2807d5ec57f463433c8ca3ebf87d6a3ea832b` |

其他來源：

| 路徑 | 用途 | SHA-256 |
| --- | --- | --- |
| `moodle/public/local/ispan_sync/cli/import.php` | 僅 CLI 的外部匯入入口，不新增網頁按鈕 | `e7ae7b3fbfe886ff49314faf422647ce6db5091900f58283661a44e7f3b01ffd` |
| `moodle/public/local/ispan_sync/cli/link_courses.php` | CLI 的既存課程連結 | `6e3587028b624c47d936311ebcd4543e7e3a086f9b5c9c5038ccf686508f7044` |
| `moodle/public/local/ispan_sync/classes/local/importer.php` | 班級、課程主檔、班級開課與講師同步，外部執行相依不移植 | `33e9708cdab810d1eb3a72808a035972e41c01276fee352a6fbbdb2ac9c46cb7` |
| `moodle/public/enrol/classgroup/lib.php` | 由系統投影的選課，不可手動解除 | `149e6f5ded99556360d1cf7a4eb947e2f5173136ea6171a80d0427972b125dd2` |
| `moodle/public/theme/boost/scss/preset/default.scss` | Boost 相容變數來源 | `5cff06156ff878ad162f0a18abc936f797f7eb8c747b387e67922bb3132d5a92` |
| `moodle/COPYING.txt` | GPL 條款原文 | `0b383d5a63da644f628d99c33976ea6487ed89aaa59f0b3257992deac1171e6b` |

## 匯出配接方式

- `assets/original.css` 複製原 styles.css 的 AI helper 區段前相關規則，略去未使用的 Moodle 殼層／standard-course 列表規則，逐 selector 限定 root；保留媒體查詢與原數值。沒有複製 AI CSS。
- `assets/app.js` 的 dashboard、classes、offeringPage、workspace 對應同名 PHP 頁面；保留主要 html_writer class、表格欄序、data-region 與 data-offering-id，動態字串先經 esc。
- `assets/domain.js` 對應上述五個主要服務；交易改為 structuredClone 副本驗證後再保存，原 DB/RBAC 與外部副作用不執行。
- AMD 的 core/ajax、Notification、SortableList、jquery 不能獨立運行，故保留輸入與儲存時機，用原生事件、本機資料及 dialog 配接；不複製 Moodle core。
- 未移植的候選：class_form.php／create_form.php 不能從現行 classes.php 載入鏈當成班級編輯功能；persons.php 無表單；offering.php 只導向教材；delete.php 是班別刪除路由，現行 dashboard 沒有該入口，並非班級刪除。
- 不使用 aihelper.js 或 AMD AI 模組；教材 content、material、templates、學習統計等未納入。
- 本版固定一個虛構範本分類，保留班別匯入的分類選擇控制；不模擬多組織分類與分類管理。

完整操作範圍、差異、權限與執行方式見 README.md；實測與未驗證項目見 VERIFICATION.md。
