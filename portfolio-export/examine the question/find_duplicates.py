# -*- coding: utf-8 -*-
import os
import sys
import hashlib
import pandas as pd
import jieba
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

# 隱藏 jieba 預設的載入載入提示訊息，保持介面乾淨
jieba.setLogLevel(20)

def calculate_md5(text):
    """計算字串的 MD5 雜湊值（確保精準度）"""
    clean_text = "".join(text.split()).lower()
    return hashlib.md5(clean_text.encode('utf-8')).hexdigest()

def chinese_tokenizer(text):
    """使用 jieba 進行中文斷詞，有助於 TF-IDF 精準計算"""
    return list(jieba.cut(text))

def check_duplicate_questions(csv_path, similarity_threshold=0.85):
    if not os.path.exists(csv_path):
        print(f"❌ 找不到檔案：{csv_path}，請確認檔案路徑是否正確。")
        return

    print("📖 正在載入題庫...")
    try:
        # 自動嘗試 utf-8 或 utf-8-sig (避免 Excel 產生的 BOM 擋路)
        df = pd.read_csv(csv_path, encoding='utf-8-sig')
    except UnicodeDecodeError:
        try:
            df = pd.read_csv(csv_path, encoding='big5')
        except Exception as e:
            print(f"❌ 檔案編碼讀取失敗，請確認是否為 UTF-8 或 Big5。錯誤: {e}")
            return

    # 檢查必備欄位
    if 'question' not in df.columns:
        print("❌ CSV 檔案中必須包含 'question' 欄位（代表題目文字）。")
        return

    # 清洗資料：去除空值並轉為字串
    df = df.dropna(subset=['question'])
    df['clean_question'] = df['question'].astype(str).str.strip()
    
    total_questions = len(df)
    print(f"✅ 成功載入 {total_questions} 筆題目。開始進行比對...\n")

    # ================= 1. 精準比對 (MD5 Hash) =================
    print("🔍 步驟 1: 正在進行【精準完全一致 (MD5)】比對...")
    md5_map = {}
    exact_duplicates = []

    for idx, row in df.iterrows():
        q_text = row['clean_question']
        md5_val = calculate_md5(q_text)
        if md5_val in md5_map:
            exact_duplicates.append((md5_map[md5_val], q_text))
        else:
            md5_map[md5_val] = q_text

    # ================= 2. 相似度比對 (TF-IDF + Cosine) =================
    print(f"🔍 步驟 2: 正在進行【語意相似度 >= {int(similarity_threshold*100)}%】比對...")
    questions_list = df['clean_question'].tolist()
    
    # 透過 jieba 斷詞後轉成空間向量
    vectorizer = TfidfVectorizer(tokenizer=chinese_tokenizer, token_pattern=None)
    tfidf_matrix = vectorizer.fit_transform(questions_list)
    
    # 計算兩兩之間的餘弦相似度
    similarity_matrix = cosine_similarity(tfidf_matrix)
    
    similar_duplicates = []
    for i in range(len(questions_list)):
        for j in range(i + 1, len(questions_list)):
            score = similarity_matrix[i][j]
            if score >= similarity_threshold:
                # 如果兩題極度相似，但不是完全一模一樣，就歸類在相似度
                if calculate_md5(questions_list[i]) != calculate_md5(questions_list[j]):
                    similar_duplicates.append((questions_list[i], questions_list[j], score))

    # ================= 呈現結果 =================
    print("\n" + "="*60)
    print("📊 【比對結果報告】")
    print("="*60)

    # 輸出完全相同的題目
    if exact_duplicates:
        print(f"🚨 發現 {len(exact_duplicates)} 組【完全一模一樣】的重複題目：")
        for num, (orig, dup) in enumerate(exact_duplicates, 1):
            print(f"  [{num}]")
            print(f"    - 題目 A: {orig}")
            print(f"    - 題目 B: {dup}")
            print("-" * 40)
    else:
        print("✅ 未發現完全一模一樣的題目。")

    print("\n" + "-"*60 + "\n")

    # 輸出高度相似的題目
    if similar_duplicates:
        print(f"⚠️ 發現 {len(similar_duplicates)} 組【高度相似 (>= {int(similarity_threshold*100)}%)】的題目：")
        for num, (q1, q2, score) in enumerate(similar_duplicates, 1):
            print(f"  [{num}] 相似度: {score:.2%}")
            print(f"    - 題目 A: {q1}")
            print(f"    - 題目 B: {q2}")
            print("-" * 40)
    else:
        print(f"✅ 未發現相似度大於 {int(similarity_threshold*100)}% 的題目。")

    print("="*60)
    print("比對結束！")

if __name__ == "__main__":
    target_csv = "questions.csv"
    
    # 支援指令參數帶入其他 CSV 檔
    if len(sys.argv) > 1:
        target_csv = sys.argv[1]
        
    check_duplicate_questions(target_csv, similarity_threshold=0.85)