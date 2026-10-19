// Local demonstration data only; no requests, course retrieval, or personal analysis.
export const mockSettings = Object.freeze({delayMs: 900});
export const validationMessage = '問題不可為空白，且不得超過 2000 個字元。';
export const mockErrorMessage = '模擬回覆暫時無法顯示，請稍後再試。（開發驗證）';

// Ordered rules: more specific learning scenarios precede generic course questions.
export const scenarios = [
    {
        keywords: /重點|整理|複習|摘要/iu,
        reply: '以下以虛構的「網頁入門」課程示範學習重點整理：\n\n1. HTML：用標題、段落與表單描述內容結構。\n2. CSS：練習選擇器、間距、配色與響應式版面。\n3. JavaScript：透過事件接收輸入，再更新畫面。\n\n複習方式：做一個簡單留言區，練習輸入檢查與安全顯示文字。\n\n這是預設範例，沒有讀取你本週的課程教材。'
    },
    {
        keywords: /概念|解釋|變數|迴圈|函式|function|javascript/iu,
        reply: '以「函式」作為概念解釋的示範：\n\n函式是一段可以重複使用的步驟。你可以把資料當作參數傳入，並取得回傳值。\n\n例如：計算總價的函式接收單價與數量，回傳兩者相乘的結果。\n\n試著想想：如果購買 3 本、每本 100 元的筆記本，應傳入哪些數值？預期結果是什麼？\n\n這是固定的教學範例；其他概念可先依「用途、例子、練習」三步整理。'
    },
    {
        keywords: /作業|繳交|上傳|課程|教材|選課/iu,
        reply: '以下以虛構的「網頁入門」作業為例：\n\n先確認題目要求、截止時間與檔案格式，再將工作拆成：建立 HTML 結構、加入 CSS 樣式、測試互動三個步驟。\n\n若不確定要求，可整理「題目描述、已完成部分、卡住的地方」向授課者提問。\n\n此展示沒有連接課程系統，也無法確認任何實際作業或截止時間。'
    }
];

export const defaultReply = '這是本機預設模擬回覆，沒有連接即時 AI。\n\n你可以試著輸入：\n•「網頁入門課程的作業要如何準備？」\n•「請解釋函式的概念」\n•「請幫我整理這週的學習重點」\n\n若要整理其他疑問，可以先寫下學習目標、目前的理解，以及遇到的困難。此展示只依關鍵字選擇範例，不會分析個人資料。';

/** Input: question string. Output: Promise<{reply: string}>, matching the original UI boundary. */
export async function askQuestion(question) {
    const text = typeof question === 'string' ? question.trim() : '';
    if (!text || question.length > 2000) {
        throw new Error(validationMessage);
    }
    await new Promise(resolve => setTimeout(resolve, mockSettings.delayMs));
    // Explicit development opt-in only; no visible extra controls or failure keywords.
    if (typeof location !== 'undefined' && new URLSearchParams(location.search).get('demo-error') === '1') {
        throw new Error(mockErrorMessage);
    }
    return {reply: scenarios.find(scenario => scenario.keywords.test(text))?.reply ?? defaultReply};
}
