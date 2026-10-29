# 驗證紀錄

執行日期：2026-10-29（Asia/Taipei）。範圍僅 portfolio-export/knowledge-base/。

## 實際執行與結果

| 項目                 | 方法                                                                                                                   | 結果                                           |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| 入口、腳本與樣式     | node verify.cjs 建立本地 HTTP server；實際載入 index.html、style.css、data.js、core.js、app.js、favicon.svg            | 通過                                           |
| 多層子目錄           | 同一份檔案分別以 / 及 /portfolio/demos/knowledge-base/ 取得，不使用 fallback rewrite                                   | 通過                                           |
| 下載 HTTP            | 以上兩種路徑取得 sample.pdf、sample.docx、sample.md，檢查 HTTP 200 及非空位元組                                        | 通過                                           |
| 組合篩選             | 5 種資料夾條件 × 4 種狀態 × 4 種格式，搭配「文件」搜尋，以獨立預期條件比較 ID 集合                                     | 通過                                           |
| 排除與狀態           | 初始可見 22 筆；排除 is_deleted、本地 deleted；false、缺欄位、0 的狀態規則                                             | 通過                                           |
| 分頁邊界             | 0、1、10、22 筆；第 1、2、3 頁；超界及負數頁碼；DOM 檢查 10/10/2 筆與上一頁／下一頁停用                                | 通過                                           |
| 搜尋、篩選、顯示     | jsdom 實際 input/change/click，檢查組合結果、無結果、清除條件、列表與卡片                                              | 通過                                           |
| 標籤                 | 單筆新增、重複項停用、標籤搜尋、批次聯集、完整替換、移除、清除取消及確認                                               | 通過                                           |
| 刪除                 | 取消、模擬失敗不變、成功後統計 22→21 及保存 deleted ID                                                                 | 通過                                           |
| 空白與重複提交       | 空白停用與 submit guard；等待中問題欄及按鈕停用，重複 submit 不增加請求                                                | 通過                                           |
| 問答五種狀態         | 固定成功、資料不足、回答無引用、錯誤、逾時；等待後可重試                                                               | 通過                                           |
| 引用                 | 預設 hidden、勾選展開，檔名／Chunk／92.6% 相似度及內容存在；新回答後恢復 hidden 與未勾選                               | 通過                                           |
| 保存與重設隔離       | 檢查 localStorage 實際寫入；將已保存狀態帶入新 jsdom 頁面重載；驗證標籤／刪除恢復；重設取消與確認；unrelated.test 不變 | 通過（程式模擬重新載入，非原生瀏覽器重新整理） |
| 損壞保存資料         | 錯誤 JSON、未知文件／標籤 ID、重複 ID 驗證                                                                             | 通過                                           |
| 網路及資源掃描       | 對五個執行來源檔掃描遠端 HTTP(S)、根絕對 href/src、fetch、XMLHttpRequest、axios、WebSocket                             | 未檢出                                         |
| 編碼                 | Node UTF-8 讀取與 U+FFFD／連續問號檢查                                                                                 | 未檢出異常                                     |
| 執行錯誤與 HTTP 失敗 | jsdom VirtualConsole、HTTP server request log                                                                          | errors=[]，所有記錄 HTTP 200                   |
| JavaScript 語法      | node --check app.js、core.js                                                                                           | 通過                                           |
| 格式                 | 原專案本地 Prettier，僅檢查／格式化匯出資料夾                                                                          | 通過（最後一次格式檢查見下方）                 |
| DOCX 結構            | Python zipfile.testzip，五個 OOXML XML／relationship part 逐一解析                                                     | 通過；非偽裝副檔名，無巨集或外部關聯           |
| PDF 基本格式         | ReportLab 實際生成 PDF，檢查 %PDF-1.3 header                                                                           | 通過基本格式，未完成視覺渲染                   |
| Markdown             | UTF-8 純文字及實際 HTTP 取得                                                                                           | 通過                                           |

自動測試摘要（最後一次功能測試）：

```json
{
  "checks": 236,
  "errors": [],
  "httpRequests": 28,
  "status": "PASS",
  "note": "DOM dialog methods polyfilled; native keyboard and layout require browser review."
}
```

## 可重跑方式

在原專案根目錄（已存在 node_modules/jsdom）：

```sh
node portfolio-export/knowledge-base/verify.cjs
node --check portfolio-export/knowledge-base/app.js
node --check portfolio-export/knowledge-base/core.js
node node_modules/prettier/bin/prettier.cjs --check portfolio-export/knowledge-base
```

單純預覽，不需要 jsdom：

```sh
node portfolio-export/knowledge-base/serve.cjs
```

預設預覽：`http://127.0.0.1:4179/portfolio/demos/knowledge-base/`，另可由 `http://127.0.0.1:4179/` 驗證根路徑。測試伺服器只服務本展示目錄。

## 未執行／受限項目

- 原系統未啟動後端、未登入、未在瀏覽器核對；功能依有效 Vue/store/service 程式確認，不能宣稱與實機畫面逐像素一致。
- 已嘗試真實瀏覽器檢查。瀏覽器連線清單回報 access host unavailable；改選 Windows Chrome 後，Computer Use 回報「could not determine the current browser URL on Windows with enough confidence to enforce policy」，並中止該回合 UI 操作。未取得展示頁的實際瀏覽器截圖。
- 因此桌面／手機視覺版面、原生 Tab／Shift+Tab、焦點可見性、dialog 焦點圈限／Esc／返回焦點、螢幕閱讀器、瀏覽器 Console／Network 及原生重新整理未完成驗證。CSS 斷點及語意結構已做程式檢查，不能視為以上項目通過。
- jsdom 不提供實際版面或原生 dialog，測試中的 showModal/close 使用明確 polyfill；這只驗證確認後的程式流程與取消規則。
- HTTP 已驗證下載位元組及格式，尚未於真實瀏覽器點選下載並檢查下載管理員。
- PDF/DOCX 未完成頁面 PNG 視覺校對。文件渲染器啟動即缺少 pdf2image；環境亦無 pdftoppm。未安裝新套件或宣稱 Word 相容性／視覺渲染通過。
- 未實際發布 GitHub Pages、未在真實 iOS／Android 或其他瀏覽器測試、未驗證 iframe 宿主額外 sandbox 政策與 file URL 儲存差異。
- 未在全專案執行會寫回 src 的 lint --fix／format。既有 src/services/scheduleService.js、src/views/DocumentUploadView.vue 修改在作業前即存在，本次未修改。

## 格式檢查補充

初次 Prettier write 後，core.js 的 IIFE 縮排需要第二次格式化；已再次執行只限匯出目錄的 write/check。此處如重跑結果不同，應以實際命令輸出為準。
