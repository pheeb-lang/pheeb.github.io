# AI 小幫手：作品集互動展示

純 HTML／CSS／原生 JavaScript ES modules，無套件安裝、無建置、無真實 AI/API 請求。頁面標示「互動展示：回覆為預設模擬內容，未連接即時 AI」。保留原始元件的 DOM 與樣式關係，沒有用截圖或另做一個聊天產品代替。

**訪客使用時，開發者電腦可以關機，也不必啟動 ADK。** GitHub Pages 提供靜態檔案後，對話邏輯與延遲都在訪客瀏覽器執行。訪客可自行輸入，或點選作品集展示專用的「播放對話示範」，自動依序展示三輪「問題 → 等待動畫 → 模擬回覆」。這個播放控制是依後續作品集需求新增，並非原 Moodle 的功能。

## 如何確認正式入口

以下路徑均相對於目前專案根目錄，依當前工作目錄檔案確認，而非只看檔名或 Git 已提交版本：

| 原始檔案 | 用途及載入關係 |
| --- | --- |
| `moodle/public/local/classgroup/db/hooks.php` | 註冊 `primary_extend` 導覽 hook 到 `hook_callbacks::extend_primary_navigation`。 |
| `moodle/public/local/classgroup/classes/hook_callbacks.php` | 已登入且非訪客，並符合學生角色時，在主要導覽新增 `local_classgroup_aihelper`，指向 `/local/classgroup/aihelper.php`。 |
| `moodle/public/local/classgroup/classes/local/role_service.php` | `user_is_student()` 查角色指派；符合外掛學生角色或角色 archetype 為 `student` 即成立，不是特定課程的教材授權檢查。 |
| `moodle/public/local/classgroup/lang/zh_tw/local_classgroup.php` | `aihelper` 字串為「AI小幫手」；英文語系為「AI Assistant」。另提供影片搜尋標籤。 |
| `moodle/public/local/classgroup/aihelper.php` | `require_login()` 及學生角色檢查；設定同名 title/heading、standard layout、active tab；輸出歡迎區、訊息區、輸入框、送出按鈕及影片連結。 |
| 同上 PHP 的 `$PAGE->requires->js(...)` | **直接載入 `/local/classgroup/aihelper.js?v=2026101903`**。這是本次沿用的實際前端。 |
| `moodle/public/local/classgroup/aihelper.js` | IIFE 初始化、純文字訊息、三點等待動畫、POST、錯誤處理、鍵盤操作及外部影片搜尋。 |
| `moodle/public/local/classgroup/amd/src/aihelper.js`、`amd/build/aihelper.min.js` | 另一份內含固定回覆的 AMD 實作。入口未呼叫 `js_call_amd('local_classgroup/aihelper', ...)`，未發現其引用，**未作為正式功能或模擬資料來源**。 |
| `moodle/public/local/classgroup/styles.css` | 只抽取 `/* Student AI helper. */` 下面的 AI 元件規則至下一個 program-list 區段之前。隱藏 Moodle secondary-navigation 的規則無須攜入。 |
| `moodle/public/theme/boost/scss/bootstrap/`、`preset/default.scss` | 補足元件依賴的 box-sizing、系統字型、表單、按鈕與 sr-only 最小相容樣式，未複製整套 Moodle／Bootstrap。 |

以上導覽、頁面標題、DOM 與明確的 JavaScript 引用形成同一條載入鏈。**本環境無可用瀏覽器，未登入原站確認實際渲染或 Network 紀錄**；沒有將原站視覺比對宣稱為通過。若部署端主題或快取覆寫了工作目錄檔案，仍需在原站核對。此次沒有更動原系統檔案，也沒有操作帳號或資料庫。

## 檔案與依賴

| 匯出檔案 | 用途 |
| --- | --- |
| `index.html` | PHP 輸出的元件轉為靜態 HTML；移除 endpoint、sesskey 與 Moodle 頁首頁尾；增加展示與外部連結說明。 |
| `styles.css` | 抽取的原始 AI 樣式與最小相容規則，所有選擇器限制於 `[data-region="aihelper"]`；動畫改為專用名稱防止碰撞。 |
| `aihelper.js` | 從實際載入的腳本改作的畫面互動，改呼叫 `askQuestion()`。 |
| `mock-responder.js` | 集中管理關鍵字情境、預設回覆、900ms 延遲與開發錯誤模式；回傳 `Promise<{reply: string}>`。 |
| `tests/interaction.test.mjs` | 無第三方依賴的 UI 狀態測試，使用簡化 DOM double，不是瀏覽器測試。 |
| `tests/check_static.py` | 資源、安全靜態掃描及巢狀子目錄 HTTP 載入測試，僅用 Python 標準函式庫。 |
| `package.json` | 只設定 ES module 與選用的測試命令；預覽不需要 npm。 |
| `NOTICE.md`、`COPYING.txt` | 來源、改作與授權聲明。 |
| `VERIFICATION.md` | 本次實際測試結果與未驗證項目。 |

實際執行僅需前四個檔案；發布時請同時保留授權聲明。沒有圖片、CDN、字型檔或圖示套件依賴：原始星形 SVG 內嵌於 HTML，箭頭與播放符號使用文字／emoji，字型沿用 Boost 預設系統字型堆疊。不同作業系統的中文字型及 emoji 可能略有差異；沒有存取資料庫中的站台自訂字型設定。

## 啟動與預覽

在專案根目錄執行（Python 3）：

```powershell
python -m http.server 8765 --bind 127.0.0.1 --directory portfolio-export
```

瀏覽 `http://127.0.0.1:8765/ai-learning-assistant/`。按 Ctrl+C 結束。請透過 HTTP 預覽，瀏覽器對 `file://` 的 ES modules 有限制。無需建置，這些原始檔案就是部署用靜態檔。

## 整合至作品集及 GitHub Pages

將整個目錄放到作品集的 `projects/ai-learning-assistant/`，保留檔名與相對位置；例如 Pages 專案站點的網址為 `https://<帳號>.github.io/<儲存庫>/projects/ai-learning-assistant/`。在作品集用相對連結 `./projects/ai-learning-assistant/` 進入。HTML 的 `./styles.css`、`./aihelper.js` 與 JS 的 `./mock-responder.js` 均為相對路徑，不需要設定 base URL，也不要改為 `/styles.css`。

若希望在既有頁面嵌入，優先用 iframe，其 `src` 指向這個目錄，並提供適當 title 與高度；或直接搬入 `<main>`、連結 CSS 與 module，依所在位置調整兩個檔案路徑。CSS 不會對 body、全站 `.btn` 或導覽選單設定樣式。直接內嵌時宿主網站的樣式仍可能影響元件；要完整隔離請用 iframe。直接內嵌需避免重複 `local-classgroup-aiinput` ID；目前設計為每頁一個元件。不要把此頁的 CSP meta 原封不動放進有其他 API 的作品集頁面，以免限制宿主功能；獨立頁的 CSP 禁止任何 script 連線。

未建立提交、推送、部署流程或啟用 GitHub Pages。

## 模擬問題與設定

在 `mock-responder.js` 修改 `scenarios`、`defaultReply`、`mockSettings.delayMs`。規則依序比對，先符合者優先：

| 輸入範例 | 情境 |
| --- | --- |
| 請幫我整理這週的學習重點 | 虛構「網頁入門」HTML／CSS／JavaScript 重點。 |
| 請解釋函式的概念 | 固定的函式與總價例子，不會依不同概念即時生成。 |
| 網頁入門課程作業要如何準備？ | 虛構作業的準備步驟，沒有真實截止日或教材。 |
| 其他未匹配輸入 | 清楚說明本機模擬並提供可嘗試問題。 |

不是課程檢索、模型推論或個人學習分析。回覆不依對話歷史改變。初次開啟保持原本歡迎區、空的訊息區、輸入 placeholder 與鍵盤提示，沒有自動插入假歷史。

「播放對話示範」點擊一次後會自動跑完三輪，不需逐一送出問題。題目順序集中在 `demoConversation`；每輪回覆仍經過同一個 `askQuestion()`，沿用一般送出的等待、顯示與錯誤處理。`mockSettings.playbackPauseMs` 控制兩輪間的閱讀停頓（預設 1600ms）。播放期間輸入與播放按鈕皆鎖定，避免與訪客操作交錯；結束後恢復原本尚未送出的草稿並可繼續聊天。再次播放會附加示範，不清空已有訊息。遇到模擬錯誤則停止播放、保留錯誤並恢復操作。開頁不會自行播放，保留原始歡迎狀態。

開發錯誤模式：在網址加入 `?demo-error=1`，任何有效問題會等待後顯示模擬錯誤，解除鎖定並可再次輸入。移除參數並重新整理恢復正常；沒有新增訪客用錯誤按鈕。測試模組與畫面之間的契約仍是 `{reply}`，錯誤以 rejected Promise 傳遞。

## 已保留的互動與資料生命週期

- trim 空白檢查、原有 `maxlength="2000"`、Enter 送出、Shift+Enter 原生換行、中文組字的 Enter 防護。補充 `compositionstart/end` 與 229 防護；另在送出時拒絕程式注入的超長值。瀏覽器 maxlength 依 UTF-16 計算，emoji 常占 2 單位；原 PHP 使用 Unicode 字元長度，展示版沿用原前端較嚴的上限。
- 文字安全顯示、換行與長字串折行、左右訊息樣式、三點動畫、reduced-motion、手機斷點、固定高度的可捲動訊息區。
- 送出後顯示問題、清空並鎖定輸入與按鈕，等待時避免重複提交；成功或失敗後移除動畫、恢復輸入與焦點。每次附加訊息及完成時捲到底部。
- 原版錯誤以助理訊息相同樣式顯示；展示版保留，不另外添加錯誤面板。
- **原本就存在的**「搜尋相關教學影片」連結：點擊才開啟 YouTube，查詢優先為輸入框、上一則問題、預設學習查詢；沒有內嵌影片、搜尋 API 或自動網路請求。頁面有明示查詢文字會傳給外部網站。此次未實際送出外部搜尋。

原版以 `textContent` 顯示文字，沒有 Markdown parser、可點擊訊息連結或程式碼高亮，因此本版也沒有；Markdown、HTML 與網址均按純文字顯示。動畫節點以 DOM API 建立，不使用 HTML 字串插入。

對話與上一則問題僅在當前頁面的 DOM／記憶體中，不用 localStorage、sessionStorage、Cookie 或資料庫。重新整理、關閉後重開會回到空對話；無重設按鈕、歷史側欄、附件或語音功能。無法以問答驗證實際課程資訊。

## 原系統 AI 流程與展示版差異

原前端從 root 的 `data-endpoint`、`data-sesskey` 取得設定，以 same-origin credentials 的表單 POST 傳送 `action=ask`、`sesskey`、`question`。PHP 先檢查登入、學生資格及 Moodle CSRF sesskey，再驗證空白／2000 字元。

後端使用伺服器設定的 Agent 服務，送出 JSON：`app_name`、`user_id`、`session_id`、`new_message: {role: 'user', parts: [{text: question}]}`。使用者與 Agent session ID 由 Moodle 使用者 ID 決定，因此不是每次開頁隨機新建。先呼叫執行路徑；遇到 404 則建立使用者 session，成功後重試。逾時為連線 5 秒、總計 90 秒。Agent session 的實際保存期限不在此 PHP 中定義，未推測其持久化機制。

回應為事件陣列，PHP 收集 model role 的文字 parts，保留最後一個非空事件文字。成功回前端 `{reply: string}`；輸入錯誤 HTTP 400 或失敗 HTTP 502 搭配 `{error: string}`。前端將錯誤文字加入助理訊息。未在此目錄保留任何 Agent 主機位置、原帳號識別值或 session 憑證，也未搬入 PHP 或 AI Agent 程式。

展示版將這整段 I/O 改為同頁模組的 Promise 與本機計時器，完全不建立 Session，不載入登入／資料庫依賴。若未來要串真實模型，必須另外使用具備金鑰保護、身分驗證、速率限制與輸入驗證的後端代理；不要將金鑰加入這個靜態專案。

## 檢查方式與限制

```powershell
python portfolio-export/ai-learning-assistant/tests/check_static.py
```

可選 Node.js（不需 npm install）：

```powershell
node portfolio-export/ai-learning-assistant/tests/interaction.test.mjs
```

本次透過可用的 Node REPL 執行同一測試檔；系統 PATH 沒有 `node` 命令。互動狀態檢查與靜態子路徑載入檢查的結果及限制見 `VERIFICATION.md`。請在有瀏覽器的環境完成桌面、手機、真實中文輸入法及原站對照後，再決定公開；這些項目沒有被標記為通過。
