import sys
import os
import json
import re

import fitz          # PyMuPDF
import pdfplumber

# make project root importable
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config import PDF_PATH, DOCS_DIR, CHUNK_SIZE, CHUNK_OVERLAP

os.makedirs(DOCS_DIR, exist_ok=True)


def clean_text(t: str) -> str:
    if not t:
        return ""
    # normalize whitespace, keep basic punctuation
    t = re.sub(r'\s+', ' ', t)
    return t.strip()


def extract_page_texts():
    """Extract text per page, using fitz first, pdfplumber as fallback."""
    pages = []
    doc = fitz.open(PDF_PATH)
    for i in range(len(doc)):
        page = doc.load_page(i)
        text = clean_text(page.get_text("text"))

        # fallback if very short text
        if len(text) < 40:
            with pdfplumber.open(PDF_PATH) as pdf:
                t2 = pdf.pages[i].extract_text() or ""
                t2 = clean_text(t2)
                if len(t2) > len(text):
                    text = t2

        pages.append(text)
    doc.close()
    print(f"Extracted {len(pages)} pages from PDF.")
    return pages


def chunk_text(pages, size=CHUNK_SIZE, overlap=CHUNK_OVERLAP):
    """
    Simple sliding-window character chunking over the whole document text.
    Big enough chunks + overlap so context is preserved.
    """
    full_text = "\n\n".join(p for p in pages if p)
    chunks = []
    start = 0
    n = len(full_text)

    while start < n:
        end = min(start + size, n)
        chunk = full_text[start:end].strip()
        if chunk:
            chunks.append(chunk)
        if end == n:
            break
        # move window forward with overlap
        start = end - overlap if end - overlap > 0 else end

    return chunks


def save_chunks(chunks):
    # clear any old json chunks
    for f in os.listdir(DOCS_DIR):
        if f.endswith(".json"):
            os.remove(os.path.join(DOCS_DIR, f))

    for i, text in enumerate(chunks, 1):
        out = {
            "id": f"lab_chunk_{i}",
            "text": text
        }
        path = os.path.join(DOCS_DIR, f"lab_chunk_{i}.json")
        with open(path, "w", encoding="utf-8") as fh:
            json.dump(out, fh, ensure_ascii=False, indent=2)

    print(f"✅ Created {len(chunks)} chunks.")


def main():
    pages = extract_page_texts()
    chunks = chunk_text(pages)
    save_chunks(chunks)


if __name__ == "__main__":
    main()
