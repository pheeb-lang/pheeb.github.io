# 原始實作與展示版對照

## 讀取範圍與規範

已檢查工作區與父層適用的 AGENTS.md，未找到。已讀 README.md、package.json、.editorconfig、格式設定及下列有效程式。README 的提交前 format/lint 規範已知；本次不提交、不執行會修改正式 src 的全專案 --fix/format，只格式化匯出目錄。

來源使用 UTF-8。PowerShell 首次讀取出現亂碼，改以 Node UTF-8 讀取後文字正常，無需修改正式來源。匯出檔生成時也遇到 Windows stdin 編碼問題，已改用 UTF-8 編碼傳入並掃描 U+FFFD 與問號連續字串，最後未檢出。文案修復僅在匯出目錄。

## 真正入口

`src/main.js` 先載入 variables.css、main.css，再掛載 Vue、Pinia、router；`src/App.vue` 對 requiresAuth 路由包 AppLayout。路由守衛要求登入，因此正式系統不是公開展示。

`src/router/index.js` 的 `/documents` 載入 DocumentsView，該頁直接使用 RagAskPanel；不是 SearchView 的聊天搜尋。`/documents/new` 與 `/documents/:id/edit` 均載入 DocumentEditView，實際內容為既有文件標籤管理。註解的 Top K 及 DocumentsView 底部候選腳本均未採用。

## 對應表

| 原始位置                          | 有效行為                                                                             | 匯出對應                                                           |
| --------------------------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------ |
| main.js、App.vue、router/index.js | Vue/Pinia 掛載、登入及歷史路由                                                       | index.html 載入本地腳本；app.js hash 路由，不依賴登入              |
| components/AppLayout.vue          | 260px 深色側欄、64px 頁首、藍色強調、群組入口                                        | index.html、style.css；公開訪客身分與範圍提示                      |
| views/DocumentsView.vue           | 統計、資料夾、搜尋、狀態／類型、列表／卡片、每頁 10 筆、下載刪除                     | app.js documentsView/renderResults；core.js filter/paginate/status |
| components/RagAskPanel.vue        | 問題、停用送出、答案／錯誤、引用勾選展開、回答後收合                                 | app.js ask/renderRag；保留同頁位置                                 |
| views/DocumentEditView.vue        | 文件選取、標籤搜尋、單筆／批次／替換、移除、清除確認                                 | app.js tagsView/update；#tags 與 #tags/:id                         |
| stores/document.js                | 列表快取、軟刪除、資料更新                                                           | data.js 虛構資料；state.deleted 保存刪除 ID                        |
| stores/folder.js                  | activeFolders 排除 is_deleted，依文件計數                                            | data.js 四個有效資料夾；app.js 動態計數                            |
| stores/documentTagStore.js        | 文件標籤快取；批次只加差集、替換、清除                                               | core.js updateTags 與 localStorage 的 tags map                     |
| stores/tagStore.js                | fetchTags 及標籤清單                                                                 | data.js 八個固定標籤；不展示建立全域標籤功能                       |
| stores/rag.js                     | question/answer/sourceChunks/isAsking/errorMessage；清空舊結果、資料不足、錯誤／逾時 | app.js rag 狀態及 generation 防止重設後舊請求覆蓋                  |
| services/documentService.js       | 文件列表、刪除、版本下載                                                             | 無 API；本地 mock 刪除、downloads/ 靜態檔                          |
| services/documentTagService.js    | 取得／新增／移除／PUT 替換標籤                                                       | core.js 純規則及 namespace 保存                                    |
| services/tagService.js            | 標籤列表及搜尋                                                                       | 本地固定資料與名稱搜尋                                             |
| services/ragService.js            | ask POST、top_k 預設 5、300000ms 逾時                                                | core.js ragResult 固定情境，等待 700/1400ms；不恢復 Top K UI       |
| assets/variables.css              | slate 色系、blue 強調、字型、圓角、布局                                              | style.css 使用相同主要色與尺寸；系統字型替代未附字型               |
| assets/main.css                   | Tailwind directives                                                                  | style.css 手寫 CSS，不需 Tailwind/build                            |

folder store 直接使用共用 axios，沒有額外獨立 folder service。共用 axios 僅用於理解原始資料呼叫，不複製其位址、認證或攔截器。

## 模擬與相容性調整

- is_deleted 或本地刪除 ID 一律排除文件；統計不隨篩選縮減。只有嚴格 false 是草稿，其餘已發布；待審核始終 0，沒有審批流程。
- 原始型別直接使用 extension，篩選卻用 word/markdown；展示版將 doc/docx 映射 word、md 映射 markdown，下載仍保留真正副檔名。
- 原列表資料夾文字顯示「資料夾 ID」；展示使用虛構資料夾名稱，也支援搜尋「資料夾 2」等原表示法。
- 搜尋原提示提到內容，但實際只查 title/folder；展示修正文案為標題／資料夾搜尋，不新增正文搜尋。
- 原分頁未隨所有篩選自動修正；展示條件變動回第 1 頁，刪除後夾限到有效頁，無結果為 0–0／第 1 頁。
- 已套用標籤在單筆、批次及替換都不可重選，依原有效 handleTagClick 保留。單筆不重複；批次加入差集；替換要求至少選一項；清空經獨立確認。純規則另去重重複 ID。
- 原標籤頁未依 route id 預選文件；展示 #tags/:id 會預選，讓清單操作能連貫。標籤頁也排除已刪除文件，避免修改已刪除項目。
- 原標籤 UI 也有 AI 自動標籤 confidence 提示；此展示不建立 AI 標籤流程，虛構標籤皆為一般標籤。
- 原 confirm／自製 modal 改為具標題、取消、Esc 與原生焦點約束的 dialog；基本操作有 label、按鈕、可見焦點、狀態／錯誤 live region。
- 小螢幕不隱藏全部導覽與資料夾；保留橫向換行導覽，列表表格於內部捲動，卡片／標籤頁單欄。
- AI 使用固定回答與尚未刪除的前兩份文件引用；清單篩選不作用於問答，符合原 ask 呼叫未傳目前列表篩選的行為。來源內容為虛構摘錄，不保證等於下載文件全文。
- 引用預設隱藏內容；回答開始及完成後收合。預設成功、無足夠資料、無引用、錯誤與逾時可由展示工具重現。
- 下載為每格式共用的虛構範例素材，提供真正的 PDF、DOCX、Markdown 位元組。沒有版本資料或後端下載。
- 專屬 key 保存及重設，不載入原系統使用者、session、資料庫、帳號或設定。

## 核對限制

未啟動原系統後端或使用真實帳號登入；原系統的視覺、API 回傳、權限及運作結果均未經瀏覽器核對。本次以有效程式追蹤還原規則。展示版瀏覽器驗證受 Computer Use 中止限制，詳見 VERIFICATION.md。
