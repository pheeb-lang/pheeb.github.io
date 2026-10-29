# -*- coding: utf-8 -*-
import os
import re
import csv
import sys

# 自動確保安裝 pypdf (用於讀取 PDF)
try:
    import pypdf
except ImportError:
    import subprocess
    print("偵測到尚未安裝 pypdf 解析庫，正在為您自動下載並安裝...")
    subprocess.check_call([sys.executable, "-m", "pip", "install", "pypdf"])
    import pypdf

def parse_pdf_to_questions(pdf_path):
    print(f"📖 正在讀取 PDF 檔案: {pdf_path}...")
    reader = pypdf.PdfReader(pdf_path)
    full_text = ""
    for page in reader.pages:
        text = page.extract_text()
        if text:
            full_text += text + "\n"
            
    print("🔄 正在分析與切割題目內容...")
    
    # 根據評鑑主題的特徵切割成獨立題目的文字區塊
    blocks = re.split(r'(?=評鑑主題.*?：)', full_text)
    
    parsed_questions = []
    question_id = 1
    
    for block in blocks:
        block = block.strip()
        if not block:
            continue
            
        # 使用正則表達式撈取對應的屬性（忽略多餘的換行）
        category_match = re.search(r'評鑑主題.*?：\s*(.*?)(?=\n|\*評鑑內容|\*題幹|$)', block, re.S)
        subcategory_match = re.search(r'\*評鑑內容.*?：\s*(.*?)(?=\n|\*題幹|$)', block, re.S)
        question_match = re.search(r'\*題幹：\s*(.*?)(?=\n|\*選項|$)', block, re.S)
        
        opt1_match = re.search(r'\*選項\(1\)\s*(.*?)(?=\n|\*選項\(2\)|\*正確解答|$)', block, re.S)
        opt2_match = re.search(r'\*選項\(2\)\s*(.*?)(?=\n|\*選項\(3\)|\*正確解答|$)', block, re.S)
        opt3_match = re.search(r'\*選項\(3\)\s*(.*?)(\n|\*選項\(4\)|\*正確解答|$)', block, re.S)
        opt4_match = re.search(r'\*選項\(4\)\s*(.*?)(?=\n|\*正確解答|$)', block, re.S)
        
        ans_match = re.search(r'\*正確解答：\s*(.*?)(?=\n|\*題目難易度|$)', block, re.S)
        diff_match = re.search(r'\*題目難易度：\s*(.*?)(?=\n|$)', block, re.S)
        
        # 只要抓到題目主體，就進行資料格式化與清理
        if question_match:
            q_text = question_match.group(1).strip().replace('\n', '')
            cat = category_match.group(1).strip().replace('\n', '') if category_match else ""
            subcat = subcategory_match.group(1).strip().replace('\n', '') if subcategory_match else ""
            
            opt1 = opt1_match.group(1).strip().replace('\n', '') if opt1_match else ""
            opt2 = opt2_match.group(1).strip().replace('\n', '') if opt2_match else ""
            opt3 = opt3_match.group(1).strip().replace('\n', '') if opt3_match else ""
            opt4 = opt4_match.group(1).strip().replace('\n', '') if opt4_match else ""
            
            ans = ans_match.group(1).strip().replace('\n', '') if ans_match else ""
            diff = diff_match.group(1).strip().replace('\n', '') if diff_match else ""
            
            parsed_questions.append({
                "id": question_id,
                "category": cat,
                "subcategory": subcat,
                "question": q_text,
                "opt1": opt1,
                "opt2": opt2,
                "opt3": opt3,
                "opt4": opt4,
                "answer": ans,
                "difficulty": diff
            })
            question_id += 1

    return parsed_questions

def save_to_csv(questions, csv_path):
    if not questions:
        print("⚠️ 未成功解析出任何題目，請確認 PDF 中的文字格式是否與模板一致。")
        return
        
    print(f"💾 正在寫入資料，共 {len(questions)} 筆...")
    fieldnames = ["id", "category", "subcategory", "question", "opt1", "opt2", "opt3", "opt4", "answer", "difficulty"]
    
    with open(csv_path, "w", encoding="utf-8-sig", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(questions)
    print(f"🎉 成功！新產生的題庫已儲存至: {os.path.abspath(csv_path)}")

if __name__ == "__main__":
    # 預設會讀取同資料夾下的 input.pdf，並輸出 questions.csv
    pdf_file = "input.pdf"
    csv_file = "questions.csv"
    
    # 也支援指令帶入參數：python pdf_to_csv.py [你的PDF檔名.pdf]
    if len(sys.argv) > 1:
        pdf_file = sys.argv[1]
    if len(sys.argv) > 2:
        csv_file = sys.argv[2]
        
    if not os.path.exists(pdf_file):
        print(f"❌ 找不到 PDF 來源檔案: {pdf_file}")
        print("💡 請將 PDF 檔案改名為 'input.pdf' 放在同個資料夾，或使用：python pdf_to_csv.py YourFile.pdf 執行。")
    else:
        parsed_data = parse_pdf_to_questions(pdf_file)
        save_to_csv(parsed_data, csv_file)