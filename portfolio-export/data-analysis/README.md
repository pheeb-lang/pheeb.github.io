# 資料分析 Dashboard 獨立展示

複製整個 data-analysis/ 即可使用，入口 index.html。不需 npm install、build、登入、後端、資料庫或 AI。需以 HTTP(S) 開啟；直接雙擊 file:// 因 ES modules/fetch 的瀏覽器限制不保證可用。

## 預覽與操作

若已安裝 Node.js，在此目錄執行：

    node serve.cjs 4183

開啟 http://127.0.0.1:4183/ 或 http://127.0.0.1:4183/portfolio/demos/data-analysis/ 。這只是選用的靜態預覽伺服器；部署後由 GitHub Pages 提供靜態檔案，無需任何常駐 Node 服務。亦可使用任意靜態 HTTP 伺服器。

1. 選擇一般、堆疊、群組長條圖或圓餅圖。
2. 使用「新增展示工具：切換情境」選擇資料。「載入範例」選取隨附 CSV；或下載 CSV 後透過選檔／拖放選取。
3. 按「開始模擬分析」，查看四張統計卡、圖表、文字圖表資料、statistics 與預覽。
4. 切換圖表立即使用相同結果重繪，不重讀 fixture。
5. 「加入 RAG 知識庫」保存至此瀏覽器 localStorage；重新整理仍顯示保存筆數。
6. 「清除」重設當次檔案、結果、錯誤、儲存訊息與圖表。「重設本展示紀錄」只刪除本功能保存紀錄。

## 六種情境

| 情境       | 列 × 欄 | 缺失值 | 行為                                         |
| ---------- | ------- | ------ | -------------------------------------------- |
| 正常       | 3 × 2   | 0      | 一個類別分布                                 |
| 多分類     | 4 × 3   | 0      | 兩個分類欄位、共用及相異標籤，測試聯集與補零 |
| 缺失值     | 4 × 3   | 3      | 分欄缺失統計、空值排除計數、預覽顯示 -       |
| 無圖表資料 | 2 × 2   | 0      | 故意提供空 charts，保留統計與預覽            |
| 分析失敗   | 3 × 2   | 0      | 模擬分析錯誤，無結果                         |
| 儲存失敗   | 3 × 2   | 0      | 分析成功、儲存拒絕，不寫入紀錄               |

CSV 與 fixtures/ 中的 JSON 為自行建立的虛構資料。圖表呈現分類欄位的「出現次數」，不是件數欄的總和；數值件數的 count、sum、mean 在 statistics 明細。缺失值包含所有欄位。多分類堆疊累計的是各分類欄位次數，並非列數或業務總量。無圖表情境刻意省略圖表，不代表自動偵測結果。

## 模擬範圍與限制

- 所有使用者 CSV、XLS、XLSX 都只檢查副檔名，**未解析檔案內容**。不辨識上傳內容，也不執行 pandas；依選取情境呈現預設範例。分析前選檔狀態有明確提示，檔案不傳送至任何服務。
- 不新增大小、必填欄位、檔名衝突等限制；每次取第一個檔案，與原頁相同。
- 分析 650ms、儲存 500ms 的延遲是展示載入狀態，非運算耗時。
- RAG 是 localStorage 紀錄與每 500 個 JavaScript UTF-16 字元切分的模擬 chunks；沒有嵌入、向量索引、檢索、聊天或 AI 問答。
- 保存欄位包含所選檔名與範例結果，未保存使用者檔案內容。儲存可能因權限、配額、損毀資料而失敗，畫面顯示錯誤。
- namespace：portfolio:data-analysis:v1:records。同網域下本展示的不同複本共用此 key；不讀寫其他功能 key，不呼叫 localStorage.clear()。
- 支援現代瀏覽器 ES modules、fetch、File、localStorage、CSS :has()。使用系統字型，無遠端字型。
- 本次未在原系統瀏覽器做逐像素比對；樣式由原始 template、Tailwind 規則與變數轉寫。

## 複製與部署

將整個資料夾複製到作品集，例如 demos/data-analysis/，保留 vendor/、fixtures/、samples/ 及程式檔的相對位置。GitHub Pages 設定由作品集維護者操作，本次未提交、推送或部署。無路由重寫需求。

作品集相對連結範例：

    <a href="./demos/data-analysis/index.html">資料分析 Dashboard 互動展示</a>

同源 iframe 範例（可自行調整高度）：

    <iframe src="./demos/data-analysis/index.html"
      title="資料分析 Dashboard 互動展示"
      width="100%" height="1000" style="border:0"
      loading="lazy"></iframe>

iframe 若使用 sandbox，ES modules 及 localStorage 需要適當 allow-scripts / allow-same-origin；儲存被限制時會顯示失敗。一般連結不受 iframe 儲存限制影響。

## 檔案與授權

- index.html、style.css、app.js：獨立介面。
- core.js：由原 DataAnalysisView.vue 抽取的正規化與 fallback。
- service.js：本地 fixture 與專用 localStorage 模擬。
- samples/_.csv、fixtures/_.json：六組虛構資料與預設結果。
- vendor/：Chart.js 4.5.1 UMD、本地 source map、Chart.js 與 @kurkle/color MIT 授權及 NOTICE。
- SOURCE-MAP.md、VERIFICATION.md：追溯與驗證紀錄。
- verify.mjs：開發驗證腳本，使用原專案已安裝的 jsdom。從原專案執行 node portfolio-export/data-analysis/verify.mjs。獨立展示不需 jsdom 或 node_modules；serve.cjs 與 verify.mjs 可不部署。
