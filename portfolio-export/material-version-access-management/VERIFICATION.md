# 驗證結果

執行日期：2026-10-19。下列「通過」僅指明列的檢查範圍，不代表完成瀏覽器、正式 Moodle 或真實 GitHub Pages 端到端驗證。

## 已執行

| 檢查 | 結果與範圍 |
| --- | --- |
| Node 語法 | data.js、domain.js、app.js 的 `node --check` 通過 |
| 核心規則 | `node tests/domain.test.cjs`：17 組通過；版本名稱、發行快照隔離、四種狀態、ready 版本資格、重複與重疊匯入、新版追加、學習紀錄不變、群組／學生班級範圍、時間／variant 驗證、共用／衝突保護、批次交易、base 限制合併、JSON 保存／重設與空白課程冪等 |
| 頁面與事件 | `node tests/render.test.cjs`：13 組通過；執行真 app.js 並使用最小 DOM 替身測試產生的 HTML、提交事件、切換對象、匯入／處理、設定儲存、重設確認及開發失敗旗標；不模擬 CSS、瀏覽器 history、原生控件或真 localStorage |
| 靜態檢查 | `python tests/check_static.py` 通過；HTML 連結資源存在、相對路徑、CSS scope、runtime 無 fetch/XHR/WebSocket/EventSource/sendBeacon 呼叫及 HTTP URL、常見密鑰模式、無 PHP／MBZ／env／私鑰執行資料；來源 SHA256 與目前 checkout 複本一致 |
| HTTP 子目錄 | 從專案根啟動 Python 靜態伺服器，透過 `/portfolio-export/material-version-access-management/` 開啟；子目錄 index、index.html、4 份 assets、示範教材、README、SOURCE-MAP、NOTICE、LICENSE 與來源 manifest 共 12 個請求均 HTTP 200，正確 content type |
| 輸入安全 | 模板／事件測試使用 `<script>`、`<img onerror>` 及引號 variant，確認輸出 HTML 逸出；所有訪客輸入經 esc 後放入 DOM。無 eval、無網路資料注入；無實際檔案上傳 |
| 隱私與網路 | 人工檢視輸出 assets／教材為新建虛構資料與短文；來源參考為程式碼，不含真實記錄或憑證值。runtime 無遠端位址、外部字型、圖像或 API；CSP `connect-src 'none'`，表單送出均 preventDefault，`form-action 'none'` |
| 原專案保護 | 只新增本匯出目錄；沒有修改原功能、Git 提交／推送、網站或 Pages 發布。原有 aihelper／語系／styles 的未提交差異在作業前即已存在，未重設或覆寫 |

子目錄檢查測試的是巢狀實體目錄，不是 GitHub Pages 的實際發布。hash route 的字串及頁面產生經測試，真正瀏覽器的重新整理／返回／鍵盤操作仍在下面的人工檢查清單。

## 未能執行

瀏覽器工具嘗試建立 in-app browser，回報 `Browser is not available: iab`；後續環境盤點回傳 `apps: [], browsers: []`。因此未完成桌面與手機實際截圖、像素比對、完整點擊流程、原生多選／日期元件、dialog 焦點／Esc、瀏覽器上一頁下一頁、真 localStorage 持久性與 CSP console/network 面板驗證。沒有將這些項目記為通過，也未另行安裝瀏覽器或啟動其他 GUI。

未登入正式 Moodle；未驗證實際資料庫、原站主題設定、上傳、MBZ 備份還原、真實 ad-hoc task／cron、學生觀看或正式伺服器權限。範本 route 的原選單缺口有記錄，沒有補寫原系統連結。

## 建議人工補測

1. 桌面約 1440px 與手機約 390px 開啟子目錄；檢查字體、表格橫向捲動、表單換行、無畫面整體溢出。
2. 按 README 主流程發布版本；1.5 秒及 4.5 秒刷新，確認等待→處理→完成；未 ready 版本不得出現在班級選單。
3. 星河班匯入新版勾選項，等待後刷新；確認新增活動、預設不開放、同版項目停用。晨光班匯入另一版本，確認既有項目未改、舊版仍可辨識。
4. 指定群組、指定學生各儲存一次；測空名單、開始等於／晚於結束、只填單邊、取消勾選時間。測個別 variant 文字及 255 字邊界。
5. 選兩份正常教材批次套用；再選含限制衝突的教材，確認整批沒有部分更動。
6. 測課程編輯器說明彈窗、返回／下一頁、直接 hash 深連結及重新整理，確保沒有 PHP route 或 404。
7. 開發模式觸發發布與匯入失敗，立即處理後刷新可恢復。限制存取停用時測對象／時間錯誤提示。
8. 真正關閉頁籤再開啟，確認儲存；重設取消保持變更、確認還原。關閉儲存權限時確認提示。檢查 network 無對外請求，console 無未處理錯誤。
9. 部署作品集時維持同一相對資源結構，發布前自行確認程式來源的公開授權範圍。此任務未啟用 Pages。
