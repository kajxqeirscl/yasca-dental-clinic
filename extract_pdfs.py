import PyPDF2
import os
import sys

# Force UTF-8 output
sys.stdout.reconfigure(encoding='utf-8')

pdf_files = [
    "Proje_Raporu_İçeriği.pdf",
    "Grup_4_Proje_Adım1.pdf",
    "Grup_4_Proje_Adım2.pdf",
    "Grup_4_Proje_Adım3.pdf",
    "YAZ402_Grup4.pdf",
]

base_dir = r"c:\Users\Ali\yasca-dental-clinic"

for pdf_file in pdf_files:
    filepath = os.path.join(base_dir, pdf_file)
    print(f"\n{'='*80}")
    print(f"FILE: {pdf_file}")
    print(f"{'='*80}")
    try:
        reader = PyPDF2.PdfReader(filepath)
        for i, page in enumerate(reader.pages):
            text = page.extract_text()
            if text:
                print(f"\n--- Page {i+1} ---")
                print(text)
    except Exception as e:
        print(f"Error reading {pdf_file}: {e}")
