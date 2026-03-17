import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import os
import json
import pickle
import numpy as np
import faiss
from tqdm import tqdm
import onnxruntime as ort
from transformers import AutoTokenizer

from config import DOCS_DIR, INDEX_DIR, EMBED_MODEL

os.makedirs(INDEX_DIR, exist_ok=True)


def load_texts():
    texts, metas = [], []
    for f in sorted(os.listdir(DOCS_DIR)):
        if not f.endswith(".json"):
            continue
        path = os.path.join(DOCS_DIR, f)
        with open(path, "r", encoding="utf-8") as fh:
            data = json.load(fh)
        texts.append(data["text"])
        metas.append({"id": data["id"], "file": f})
    print(f"DEBUG: Loaded {len(texts)} chunks from DOCS_DIR")
    return texts, metas


def embed_texts(texts):
    print("Loading ONNX model...")
    session = ort.InferenceSession(EMBED_MODEL)
    input_names = [i.name for i in session.get_inputs()]
    print("ONNX input names:", input_names)

    # local tokenizer only (already cached on your machine)
    tokenizer = AutoTokenizer.from_pretrained(
        "sentence-transformers/all-MiniLM-L6-v2",
        local_files_only=True
    )

    embeddings = []
    for i, t in enumerate(tqdm(texts, desc="Embedding texts")):
        toks = tokenizer(
            t,
            truncation=True,
            padding="max_length",
            max_length=128,
            return_tensors="np"
        )

        ort_inputs = {
            name: toks[name].astype(np.int64)
            for name in input_names
            if name in toks
        }

        out = session.run(None, ort_inputs)[0]

        if out.ndim == 3:
            vec = out.mean(axis=1)
        else:
            vec = out

        embeddings.append(vec[0].astype("float32"))

    embs = np.vstack(embeddings).astype("float32")
    print("Embedding dimension:", embs.shape[1])
    return embs


def main():
    texts, metas = load_texts()
    if not texts:
        raise SystemExit("No chunks found in DOCS_DIR – run pdf_to_docs.py first.")

    embs = embed_texts(texts)
    dim = embs.shape[1]

    index = faiss.IndexFlatL2(dim)
    index.add(embs)
    print(f"DEBUG: FAISS index contains {index.ntotal} vectors")

    faiss.write_index(index, os.path.join(INDEX_DIR, "faiss.index"))
    with open(os.path.join(INDEX_DIR, "metas.pkl"), "wb") as f:
        pickle.dump(metas, f)

    print(f"✅ FAISS index built for {len(metas)} chunks!")


if __name__ == "__main__":
    main()
