# 來源與授權

此目錄由目前工作目錄的 Moodle `local_classgroup` 學生 AI 小幫手頁面抽取及改作（2026-10-19）。原始程式的著作權屬於各原作者；沒有將原作者的著作權轉移給匯出者。

- `index.html` 的元件 DOM、文字及 SVG：`moodle/public/local/classgroup/aihelper.php`。
- `aihelper.js` 的初始化、訊息建立、送出流程、鍵盤處理與外部連結邏輯：`moodle/public/local/classgroup/aihelper.js`。改為 ES module、本機模擬、輸入驗證及組字防護。
- `styles.css` 主體：`moodle/public/local/classgroup/styles.css` 的 `Student AI helper` 區段；加入元件範圍與最小 Boost/Bootstrap 相容規則，保留原配色、尺寸、媒體查詢與動畫。
- 最小相容樣式參考 `theme/boost/scss/bootstrap/_variables.scss`、`_reboot.scss`、`forms/_form-control.scss`、`_buttons.scss`、`theme/boost/scss/preset/default.scss`，未包含完整框架。
- 模擬資料、說明及測試為此次匯出新增，採 GPL-3.0-or-later 隨同此衍生展示提供。
- 後續依作品集需求新增「播放對話示範」控制、三輪自動播放與草稿保留；這些是靜態展示專用功能，不是原 Moodle 功能。

根目錄 Moodle 的 `COPYING.txt` 原文附於此目錄。Moodle 採 GNU GPL 第 3 版或更新版本；此衍生展示保留相同授權。所讀取的 `local_classgroup` 頁面、JS、CSS 本身未附獨立作者或授權標頭；沒有另行宣稱它們是 MIT 或專有授權。公開前應由專案擁有者確認客製程式與品牌資產的公開權利。未攜入校名、公司標誌、使用者資料或 Moodle 全站導覽。

Bootstrap 相容規則所參考的上游樣式採 MIT：

Copyright (c) 2011-2024 The Bootstrap Authors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
