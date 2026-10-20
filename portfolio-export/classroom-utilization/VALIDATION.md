# 驗證紀錄

執行日期：2026-10-20（Asia/Taipei）。沒有提交、推送或發布。

## 已實際執行

- 以原始導覽、`?view=utilization`、`#utilization-view`、主標題「每間教室，使用得如何？」及 renderer import 關係核對目標。未選取教室管理課表頁。
- `node --test tests/*.test.mjs`：8 項通過，0 失敗。包含預設摘要／教室一致性、重疊／跨日／休息時段、排除教室、無效狀態、全休館 null、一般週末、無預約零值、空教室報表、日期上下限及取消訊號。
- 同一測試內以最小 DOM fixture **實際執行 `src/main.js`** 的初始化、送出與 renderer，確認預設自動載入、36.25%／101.5 h、4 張長條與 4 行表格名稱及百分比相同；查詢 11 月 0%、全休館「不適用」及 2 筆假日、無效順序／過長範圍錯誤後可恢復。此檢查不是瀏覽器視覺測試。
- `python tools/build.py`：產生完整 `dist/`。
- `python tools/verify.py`：檢查 source 與 dist 的 HTML 資源、ES module 相對路徑均存在，CSS 選擇器皆限制展示容器；runtime 檔未發現外部 URL、fetch／XHR／WebSocket／EventSource／Beacon、API 路徑、原機構名稱、常見憑證及個資模式。目錄無 `.env`、私鑰、source map。檔案來源亦經人工檢視，資料由虛構 fixture 新建。模式掃描不是對所有可能敏感文字的數學保證。
- `python tools/verify_port.py`：同一份虛構資料、展示休館清單，在 7 組日期逐欄比較原 Python `build_report`，完全一致（含摘要、教室、假日、開放日數、時區）。只呼叫純函式，無後端／資料庫連線。
- 同一工具以實際 loopback HTTP 請求載入 `/portfolio-export/classroom-utilization/dist/?view=utilization` 多層子目錄；所有入口引用及 JS 模組皆回應 200，內容與建置檔位元組相符。伺服器結束即關閉。
- 原專案未執行套件安裝或建置。所有新增／整理檔案位於 `portfolio-export/classroom-utilization/`。

## 尚未實際驗證

- 瀏覽器工具 `iab` 回報 unavailable，瀏覽器與應用程式清單均為空。因此沒有實際桌面／手機截圖、原頁與展示頁的逐像素比較、原生日期欄位操作、表格觸控橫捲、details 點擊、瀏覽器返回／前進或真實 CSP/network 面板紀錄。
- 已沿用原 responsive 宣告，尚未以實際視窗寬度確認 850px／520px 行為；原系統未提供圖像及打包字型，顯示會受裝置字型影響。
- 沒有實際發布 GitHub Pages，只有相對路徑靜態掃描及子目錄 HTTP 實測。
- 未驗證任意微秒精度、正式台灣假日及機構覆寫日曆；展示日曆是虛構資料，非原日曆的完整復刻。

## 建議後續人工確認

開啟獨立頁後，以桌面及約 390px 手機寬度檢視，依 README 的日期表測試預設、無預約、全休館、錯誤範圍，展開假日清單，確認表格可橫捲及 Network 僅載入同源靜態檔。嵌入作品集後再確認導覽及其他頁面樣式沒有受到影響。
