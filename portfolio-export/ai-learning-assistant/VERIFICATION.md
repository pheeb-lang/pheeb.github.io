# 驗證紀錄

日期：2026-10-19（Asia/Taipei）。只新增 `portfolio-export/ai-learning-assistant/`，未提交、推送、發布或啟用 GitHub Pages。原專案五個已有修改的檔案保持原狀。

## 已實際執行

1. **載入鏈靜態追查**：導覽 hook → 學生角色判斷 → `aihelper.php` 的標題與畫面 → `$PAGE->requires->js()` → 同目錄 `aihelper.js`。AMD src/build 僅為候選，這個入口未引用。以目前工作目錄檔案為準，未操作原站 Session 或登入資料。
2. **JavaScript 7 組狀態檢查通過**：透過本環境 Node REPL import `tests/interaction.test.mjs` 執行原檔（PATH 沒有 Node CLI）。使用自製簡化 DOM double，執行真正的畫面模組與模擬模組，未假裝是瀏覽器測試。
3. **靜態／HTTP 檢查通過**：執行 `python portfolio-export/ai-learning-assistant/tests/check_static.py`。將匯出複製至暫存目錄，以本機標準 HTTP server 掛在 `/portfolio-demo/projects/ai-learning-assistant/`；入口、CSS 與遞迴 module import 皆回應 200，JS MIME 正確。測試伺服器自動關閉，未連外。
4. **資源與安全靜態掃描通過**：四個執行檔無 fetch、XHR、WebSocket、EventSource、sendBeacon、儲存 API、Cookie 存取、endpoint/sesskey 或金鑰欄位，無動態 HTML 插入。沒有 PHP、資料庫、金鑰檔或 `.env`；沒有原服務位址。CSS 無外部字型、圖片 URL 或 import，星形 SVG 已內嵌。唯一執行檔外部網址為原有 YouTube 搜尋連結；不會自動請求。
5. **樣式抽取檢查**：沿用原 AI 元件規則與手機／reduced-motion 媒體查詢，補最小全站相容樣式，所有規則範圍限制於展示元件；未搬入整套 Moodle。另核對來源 CSS 抽取區段，除元件 scope 與動畫名稱外保留原規則。

| 操作／性質 | 本次結果 | 驗證界線 |
| --- | --- | --- |
| 初始空對話、輸入焦點、送出停用 | 狀態測試通過 | 非視覺驗證。 |
| 空白／純換行與超過 2000 字元 | 狀態測試通過 | 原生 maxlength 屬性已核對；真實鍵入／貼上截斷未實測。 |
| 2000 個中文字與長訊息 | 狀態測試通過 | 安全插入文字已確認；實際畫面折行未實測。 |
| Enter 送出 | 狀態測試通過 | 測試事件觸發送出且 preventDefault。 |
| Shift+Enter | 程式分支通過 | 確認不攔截、不送出；原生 textarea 換行未在瀏覽器鍵入。 |
| 中文組字 | 程式事件防護通過 | isComposing、compositionstart/end、keyCode 229；真實作業系統輸入法未驗證。 |
| 等待動畫、900ms 延遲 | 節點、延遲與清理通過 | 三個 span 與 status label 已檢查；動畫視覺未實測。 |
| 等待鎖定、重複點擊及 Enter | 狀態測試通過 | 未產生第二個請求／使用者訊息。 |
| 自動捲動 | scrollTop 賦值通過 | DOM double 的捲動高度，未驗證真實排版後高度。 |
| 多輪連續對話與三類情境／預設回覆 | 狀態測試通過 | 共用同一頁面狀態，無真實 AI。 |
| 惡意 HTML、換行、Markdown 字串 | 純文字檢查通過 | 測試 fixture 禁止 innerHTML；未在真實瀏覽器執行 XSS 測試。 |
| 模擬錯誤與再次成功送出 | 狀態測試通過 | 檢查錯誤訊息、移除等待、解除鎖定。 |
| 影片搜尋參數優先序與 URL encoding | 狀態測試通過 | 未開啟或提交外部搜尋。 |
| 新頁面空對話 | 狀態及靜態檢查通過 | 無保存 API；未透過真實瀏覽器重新整理驗證。 |
| GitHub Pages 多層子目錄資源 | 本機 HTTP 測試通過 | 未發布到 GitHub Pages。 |

## 未能執行及尚存限制

- `cua.getState()` 回傳沒有可用瀏覽器；嘗試建立內建瀏覽器分頁回報 `Browser is not available: iab`。因此沒有桌面／手機截圖、真實瀏覽器主流程、Network 面板紀錄、輔助科技測試或原站視覺對照。
- 未登入原 Moodle 或啟動其 AI 服務；正式頁面的判定依目前程式載入鏈，無法確認部署端快取或資料庫自訂主題。站台全域導覽、頁首頁尾與品牌未移植；字型採原預設系統字型堆疊，無法保證自訂主題的逐像素一致。
- 手機 575.98px 斷點與 reduced-motion 規則已保留，但實際手機鍵盤、直橫向、縮放、捲動與視覺溢位未驗證。簡化 DOM 不計算 CSS 或原生 textarea 行為。
- 本版沒有 Markdown、程式碼區塊、可點擊訊息連結、歷史記錄、重設按鈕或真實課程功能，因實際使用的前端沒有提供這些功能。
- 安全掃描是程式規則與人工來源檢查，沒有宣稱做過完整滲透測試。CSP `connect-src 'none'` 已配置，但瀏覽器實際執行情況未驗證。

## 後續可重現的瀏覽器驗證

在可用瀏覽器依 README 啟動後，分別以桌面與 390px 手機寬度開啟頁面，檢查初始歡迎區、長訊息與連續對話；實際鍵入空白、2000／2001 字元、中文組字確認鍵、Enter 與 Shift+Enter；在 900ms 等待期間連點送出，並用 `?demo-error=1` 驗證錯誤。確認訊息區捲到底部、無橫向溢位、刷新清空，Network 除本機靜態資源外沒有自動請求。若需要與原站比對，請以合法學生身分開啟原頁，核對標題、DOM、theme 覆寫與真正載入的 JS，再記錄差異。
