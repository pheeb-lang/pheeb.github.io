# 驗證紀錄

日期：2026-10-29（Asia/Taipei）。環境：Windows / Node.js v24.11.1，原專案既有 jsdom。僅新增 portfolio-export/data-analysis/，未修改正式功能、提交、推送或部署。專案原有其他本地變更不屬於此次工作。

## 執行方式

在原專案根目錄執行：

    node portfolio-export/data-analysis/verify.mjs

獨立 HTTP 預覽：

    node portfolio-export/data-analysis/serve.cjs 4183

入口：

- http://127.0.0.1:4183/
- http://127.0.0.1:4183/portfolio/demos/data-analysis/

測試伺服器使用 Node HTTP 真正監聽本機隨機埠，以 fetch 取得資源，結束後關閉；手動預覽伺服器使用 4183。多層路徑是靜態資料夾掛載，無 SPA fallback。相對資源同時在根目錄及四層子目錄驗證。

## 已執行結果

自動驗證 32 組檢查通過（最新重跑結果見工作紀錄）：

| 檢查                                           | 方法／結果                                                                                            |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| 入口、CSS、JS、favicon、Chart.js 與 source map | 根目錄／多層子目錄實際 HTTP GET，200                                                                  |
| 六個 CSV 與六個 JSON fixture                   | 根目錄／多層子目錄實際 HTTP GET，200                                                                  |
| README、來源對照及授權                         | 實際 HTTP GET，200                                                                                    |
| Chart.js 版本及控制器                          | 以 vm 執行本地 UMD，版本 4.5.1，bar / pie 控制器可用                                                  |
| 未選檔不可分析                                 | DOM 按鈕停用，直接呼叫分析也不發請求                                                                  |
| 副檔名／拖放                                   | txt 拒絕；CSV、XLSX、xls 接受；change / drop 事件已測試                                               |
| 任意檔案揭露                                   | 選取狀態明示未解析內容及使用預設情境                                                                  |
| 載入停用                                       | 控制分析 Promise，檢查選檔、情境、圖表 fieldset、清除停用；忽略期間更換檔案／重設                     |
| 成功及統計                                     | DOM 卡片值、preview 列數、field_count fallback 正確                                                   |
| 四種圖表與資源釋放                             | Chart spy 驗證 bar/pie 類型、堆疊軸、每次重繪先 destroy；切換無額外 fixture 請求                      |
| 多分類對齊                                     | 精確檢查 labels 文件／報表／手冊／待處理／已完成，datasets [2,1,1,0,0] 與 [1,0,0,1,2]                 |
| 正規化                                         | labels/values、x/y、categories、map、month/date/name、value/count/total、原生 datasets                |
| 原始分類語意                                   | 標籤聯集順序、缺分類補零、重複鍵最後值覆蓋、排除 falsy 標籤                                           |
| 缺失值                                         | 五種 key fallback、優先序、物件彙總；畫面 3 個缺失、3 個 -                                            |
| CSV、統計、圖表、預覽一致                      | 六組逐列比對 CSV、欄數、缺失彙總、類別頻率；numeric sum/mean                                          |
| 空圖表                                         | Chart instances 為 0，空圖表提示、統計／預覽仍存在                                                    |
| 分析失敗及重新分析                             | 錯誤可見、結果隱藏、按鈕恢復；後續成功                                                                |
| 本地儲存                                       | 五欄 payload、chunks 拼回原 JSON、成功訊息、保存筆數                                                  |
| 儲存失敗                                       | 模擬失敗未寫入；真實 storage denied / quota 例外轉為錯誤                                              |
| 保存與重設                                     | 同一 storage 新建 mount 仍可讀取；只刪本功能 key，其他 demo key 保留                                  |
| 清除                                           | 舊圖表 destroy，檔案／結果／分析錯誤／儲存訊息清空，再次分析成功                                      |
| 本地範例載入                                   | service.sample 真正 fetch CSV，建立 File，檔名與中文內容正確                                          |
| 遺失 fixture                                   | 模擬 HTTP 非成功，產生本地資源錯誤                                                                    |
| 非必要網路與後端掃描                           | runtime 無遠端 URL、原 API、根路徑資源、innerHTML 或 eval；測試請求皆為相對本地資源，無失敗 HTTP 紀錄 |

已對新增 HTML/CSS/JS/測試及文件執行專案既有 Prettier 格式化與 --check；以 node --check 驗證 app、core、service、server、測試語法。未跑全專案 lint --fix / format，以免變更正式檔案。原 README 的提交前要求未涉及此次提交（沒有提交）。

## 未驗證與限制

- 瀏覽器工具探測回報「browser access host is unavailable」；原生 Chrome 操作回報「Computer Use was not approved to use Google Chrome」。沒有繞過拒絕。
- **未實際驗證桌面／手機視覺、Canvas 繪製／縮放／tooltip、鍵盤巡覽、瀏覽器 Console 或 DevTools Network。** DOM 整合測試使用 jsdom 與 Chart spy，不能替代真實瀏覽器渲染。Chart.js UMD 載入／控制器註冊驗證不等於繪圖測試。
- 已從 CSS 靜態確認 640 / 768 / 1280 斷點、288px 圖表容器及表格橫向捲動，但未在實機量測溢出或截圖核對。
- 網路驗證為實際 HTTP 資源存取、呼叫紀錄與靜態掃描，沒有宣稱已透過瀏覽器網路面板觀察零遠端請求。
- 保存持續性使用同一 jsdom localStorage 重新掛載驗證；未在真實瀏覽器重新開啟後確認持久化。
- 未登入原系統、未呼叫原後端、未對原頁做逐像素核對，未驗證原後端 pandas 回傳內容。
- 未發佈到 GitHub Pages；已以多層 HTTP 路徑驗證相對部署方式，未宣稱正式部署已成功。
- 未執行任意 Excel／CSV 分析；這是明示的模擬範圍，而非驗證缺陷。
