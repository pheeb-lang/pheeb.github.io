# 原始實作與展示版對照

## 入口與規範

已檢查工作區及上層適用 AGENTS.md，未發現該檔。已讀根 README.md、.editorconfig、.prettierrc.json、package.json，以及相關原始碼。README 介紹 Vue 3、Pinia、Vue Router、Tailwind、Axios、Vite；未提交，因此沒有執行會修改正式 src 的 npm run format / lint --fix。匯出檔以專屬範圍格式化／檢查。

src/main.js → 引入 variables.css / main.css → createApp(App) → Pinia / router → #app。
src/App.vue → route.meta.requiresAuth 時以 AppLayout 包住 RouterView；恢復登入狀態。
src/router/index.js → /data-analysis → DataAnalysisView，requiresAuth: true，pageTitle 為資料分析 Dashboard；beforeEach 會檢查登入狀態。
src/components/AppLayout.vue → 知識庫群組的資料分析連結、頂部標題與內容 slot；桌面側欄 260px，1024px 以下隱藏。

獨立版 index.html 直接載入 app.js，不複製登入、帳號、側欄其他模組及後端設定。

## 分析與資料

| 原始來源                                          | 原始流程                                                                            | 展示版                                                             |
| ------------------------------------------------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| DataAnalysisView.vue setSelectedFile / handleDrop | 取首個檔案，xlsx/xls/csv，非法提示                                                  | app.js setFile，保留副檔名與拖放，增加明確未解析提示               |
| submitFile                                        | loading、清除儲存訊息、uploadAnalysisFile(file, chartType)、error fallback、finally | analyze → service.analyze → 本地 fixture，延遲模擬，保留停用及失敗 |
| dataAnalysisService.js uploadAnalysisFile         | FormData(file, chart_type)，POST /api/data-analysis/upload，120 秒 timeout          | service.js 只 GET 相對 fixtures，不傳檔案，不執行 pandas           |
| summary computed                                  | result.summary ?? result ?? {}                                                      | renderResults 與 save 保留此 fallback                              |
| statCards                                         | row_count、column_count、field_count ?? column_count、缺失值彙總                    | 四張統計卡，原 formatNumber                                        |
| statistics                                        | 原頁僅傳給 save payload，不直接顯示                                                 | 保存相同欄位，另增加可展開範例統計明細                             |
| previewRows / previewColumns                      | 陣列檢查、首列 keys、formatCell 空值 -                                              | 相同邏輯、可橫向捲動、有表頭 scope                                 |
| charts / chartConfigs                             | pie 用 charts.pie，其餘 charts.bar                                                  | renderCharts 使用相同資料選擇                                      |
| normalizeChartSources / normalizeChartData        | 多種資料形狀與標籤／數值別名                                                        | core.js 原始函式直接抽取                                           |
| buildMultiCategoryChartData                       | source.data 標籤聯集，Map 對齊；缺分類補 0，重複標籤最後值覆蓋                      | 原樣保留，不只換標題；stacked 軸旗標區分堆疊／群組                 |
| watch(chartConfigs)                               | nextTick 後 destroy + render，不重分析                                              | radio change 直接重繪，同份 fixture，不 fetch                      |
| resetAnalysis / unmount                           | 清除檔案、結果、錯誤、儲存訊息、destroy charts                                      | reset / pagehide 釋放 Chart instances                              |

core.js 保留原正規化語意及限制：多分類只取 source.data 的 item 陣列；filter(Boolean) 排除空字串與數值 0 標籤；Map 重複鍵最後值覆蓋；hasChartData 對非空一般物件採寬鬆判斷。fixtures 使用原頁可正常處理的 item 形式；不宣稱修復或擴充任意資料格式。

## RAG 儲存

原 handleSaveToRag payload：
source_file、summary、statistics、charts、preview_data。
原 dataAnalysisService.js POST /api/data-analysis/save-to-rag，120 秒 timeout；依 rag_status / chunks_count 顯示成功，錯誤依 response message/detail/message fallback。
Axios interceptor 回傳 response.data，所以原頁直接取得結果物件。

展示 app.js 保留五個 payload 欄位、加入中／成功／失敗狀態；service.save 只保存到專用 localStorage key。chunks 為序列化 payload 每 500 字元的示意切分。成功文案移除「已建立 RAG／可前往 AI 問答」的真實服務暗示。沒有問答入口或向量建立功能。新增重設僅移除該 key。

## 樣式、編碼與差異

原 variables.css：slate 背景／白色卡片、#2563eb 藍操作、emerald RAG 按鈕、8px 圓角。main.css 為 Tailwind directives；package.json Chart.js ^4.5.1，實際本地套件為 4.5.1，另有 Tailwind、Element Plus 及其 icons；本頁樣式主要來自 Tailwind，獨立版不需 Vue / Tailwind runtime / Element Plus。

保留白卡、拖放區、四種模式、統計卡、圖表高度 288px、表格、桌面／行動斷點；CSS 大部分限於 #data-analysis-demo，body 只有邊距及背景設定。字型改系統字型。新增情境工具、統計明細、圖表文字替代與專屬紀錄重設。更換檔案／情境先清掉舊結果，避免原頁可能出現的新檔名配舊結果；忙碌時也停用檔案、情境、圖表、清除及儲存，避免非同步競態。

原 README、DataAnalysisView 與其他閱讀檔以 UTF-8 讀取可顯示正常中文；已確認 README 與 view 嚴格 UTF-8 解碼成功。PowerShell 預設顯示編碼曾導致終端亂碼；採 Node UTF-8 及 UTF-8 stdin 後確認，未修改正式檔案。新增展示文案由功能語意撰寫，群組名稱由原「分群長條圖」改為需求中的「群組長條圖」。尚未以原系統瀏覽器核對視覺與原始後端實際 response。
