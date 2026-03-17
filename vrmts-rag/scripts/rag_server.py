import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import json
import pickle
import re
import requests
import numpy as np
import faiss

from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from config import DOCS_DIR, INDEX_DIR, EMBED_MODEL, TOP_K, MODEL_NAME

import onnxruntime as ort
from transformers import AutoTokenizer

# ---------------------------------------------------------
# FastAPI app
# ---------------------------------------------------------
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

print(f">>> RAG_SERVER.PY LOADED from: {os.path.abspath(__file__)}")

# ---------------------------------------------------------
# Load FAISS index + metadata
# ---------------------------------------------------------
index_path = os.path.join(INDEX_DIR, "faiss.index")
meta_path = os.path.join(INDEX_DIR, "metas.pkl")

index = faiss.read_index(index_path)
metas = pickle.load(open(meta_path, "rb"))

print(f"DEBUG: Loaded {len(metas)} chunks from FAISS index")

# Load ALL chunks into memory once (for lexical lab search)
ALL_CHUNKS = []
for m in metas:
    path = os.path.join(DOCS_DIR, m["file"])
    with open(path, "r", encoding="utf-8") as fh:
        d = json.load(fh)
    ALL_CHUNKS.append(d)

# Build a mapping from lab number -> list of chunks that mention that lab
LAB_CHUNKS = {}  # e.g. 1 -> [chunk_dicts...]
for ch in ALL_CHUNKS:
    text_low = ch.get("text", "").lower()
    for n in range(1, 11):
        if f"lab {n}:" in text_low:
            LAB_CHUNKS.setdefault(n, []).append(ch)

print("DEBUG: Lab mapping:")
for n in sorted(LAB_CHUNKS.keys()):
    print(f"  Lab {n}: {len(LAB_CHUNKS[n])} chunks")


# ---------------------------------------------------------
# Embedding model (local ONNX + tokenizer)
# ---------------------------------------------------------
tokenizer = AutoTokenizer.from_pretrained(
    "sentence-transformers/all-MiniLM-L6-v2"
)
onnx_session = ort.InferenceSession(EMBED_MODEL)
onnx_input_names = [i.name for i in onnx_session.get_inputs()]


def embed_query(text: str):
    toks = tokenizer(
        text,
        truncation=True,
        padding="max_length",
        max_length=128,
        return_tensors="np"
    )
    ort_inputs = {
        name: toks[name].astype(np.int64)
        for name in onnx_input_names
        if name in toks
    }
    out = onnx_session.run(None, ort_inputs)[0]
    vec = out.mean(axis=1) if out.ndim == 3 else out
    return vec.astype("float32").reshape(1, -1)


# ---------------------------------------------------------
# RAG behaviour - Enhanced prompts for different question types
# ---------------------------------------------------------
SYSTEM_PROMPT_BASE = """You are an expert Human Anatomy tutor helping students learn from their Lab Manual.
You will be given CONTEXT from the lab manual. Follow these rules:

1. Use ONLY the provided CONTEXT to answer questions.
2. Be specific and detailed when explaining anatomical concepts.
3. When listing structures, include their locations and functions when available.
4. Do NOT mention chunks, PDFs, metadata, or technical details.
5. If the context doesn't contain enough information, say so politely.
6. Include citations like [lab_chunk_XX] only when helpful."""

QUESTION_PROMPTS = {
    "definition": """Answer this definition/terminology question using the context.
Provide clear, concise definitions with anatomical accuracy.""",
    
    "list": """List all relevant items from the context.
Be comprehensive and organized. Group related items if helpful.""",
    
    "explanation": """Explain this concept thoroughly using the context.
Break down complex topics into understandable parts.""",
    
    "comparison": """Compare and contrast the items mentioned using the context.
Highlight key similarities and differences.""",
    
    "location": """Describe the anatomical location(s) using proper anatomical terms.
Include relationships to surrounding structures when available.""",
    
    "function": """Explain the function(s) using the context.
Connect structure to function when possible.""",
    
    "procedure": """Describe the lab procedure or activity based on the context.
Include steps and expected observations when available.""",
    
    "general": """Answer this question using the context provided.
Be helpful, accurate, and educational."""
}

def detect_question_type(question: str) -> str:
    """Detect the type of question to use appropriate prompt."""
    q_lower = question.lower()
    
    if any(w in q_lower for w in ["what is", "define", "meaning of", "what does"]):
        return "definition"
    elif any(w in q_lower for w in ["list", "name all", "what are the", "identify"]):
        return "list"
    elif any(w in q_lower for w in ["explain", "describe", "how does", "why"]):
        return "explanation"
    elif any(w in q_lower for w in ["compare", "difference", "versus", "vs"]):
        return "comparison"
    elif any(w in q_lower for w in ["where", "location", "located", "position"]):
        return "location"
    elif any(w in q_lower for w in ["function", "purpose", "role", "job"]):
        return "function"
    elif any(w in q_lower for w in ["procedure", "steps", "how to", "activity"]):
        return "procedure"
    else:
        return "general"

# Legacy support
SYSTEM_PROMPT = SYSTEM_PROMPT_BASE

CITE_RE = re.compile(r"(lab_\d+|lab_chunk_\d+)")
# Ollama host: use env var so Docker can point to host machine
_OLLAMA_HOST = os.environ.get("OLLAMA_HOST", "http://localhost:11434")
OLLAMA_API = f"{_OLLAMA_HOST}/v1/completions"
OLLAMA_CHAT_API = f"{_OLLAMA_HOST}/api/chat"


def call_llm(prompt: str, max_tokens: int = 256, temperature: float = 0.3) -> str:
    """Call LLM with improved error handling and fallbacks."""
    try:
        # Try chat API first for better responses
        chat_response = requests.post(
            OLLAMA_CHAT_API,
            json={
                "model": MODEL_NAME,
                "messages": [{"role": "user", "content": prompt}],
                "stream": False,
                "options": {
                    "temperature": temperature,
                    "num_predict": max_tokens
                }
            },
            timeout=300,
        )
        
        if chat_response.status_code == 200:
            r = chat_response.json()
            if "message" in r and "content" in r["message"]:
                return r["message"]["content"]
        
        # Fallback to completions API
        r = requests.post(
            OLLAMA_API,
            json={
                "model": MODEL_NAME,
                "prompt": prompt,
                "max_tokens": max_tokens,
                "temperature": temperature,
            },
            timeout=300,
        ).json()

        if isinstance(r, dict) and "choices" in r and r["choices"]:
            choice = r["choices"][0]
            return (
                choice.get("text")
                or choice.get("message", {}).get("content", "")
                or ""
            )

        if isinstance(r, dict):
            return r.get("text", "") or r.get("response", "") or ""
        return ""
    except Exception as e:
        return f"LLM call failed: {e}"


def extract_lab_numbers(question: str):
    """Return list of lab numbers mentioned in the question (e.g. [1,2])."""
    nums = set()
    for m in re.findall(r"\blab\s*([0-9]{1,2})\b", question.lower()):
        try:
            n = int(m)
            if 1 <= n <= 10:
                nums.add(n)
        except ValueError:
            continue
    return sorted(nums)


def retrieve_chunks(question: str, k: int = TOP_K):
    """
    1) If the question mentions Lab numbers, use LAB_CHUNKS first (lexical).
    2) Otherwise, normal FAISS retrieval.
    """
    lab_nums = extract_lab_numbers(question)
    chunks = []

    if lab_nums:
        for n in lab_nums:
            chunks.extend(LAB_CHUNKS.get(n, []))
        if chunks:
            print(f"DEBUG: Lab-aware retrieval for labs {lab_nums}, got {len(chunks)} chunks")
            # limit to k at most, but keep as many as needed for context
            return chunks[:max(k, len(lab_nums))]

    # Fallback: normal vector search
    q_emb = embed_query(question)
    D, I = index.search(q_emb, min(k, index.ntotal))
    for idx in I[0]:
        if 0 <= idx < len(metas):
            meta = metas[idx]
            # find corresponding chunk (we already loaded them)
            fname = meta["file"]
            for ch in ALL_CHUNKS:
                if ch["id"] == meta["id"]:
                    chunks.append(ch)
                    break

    print(f"DEBUG: Vector retrieval, got {len(chunks)} chunks for query: {question}")
    return chunks


# ---------------------------------------------------------
# API schema
# ---------------------------------------------------------
class Query(BaseModel):
    q: str
    k: int = TOP_K
    use_llm: bool = True


class MCQRequest(BaseModel):
    lab_num: int
    count: int = 50


# ---------------------------------------------------------
# /lab_content endpoint - Get all content for a specific lab
# ---------------------------------------------------------
@app.get("/lab_content/{lab_num}")
def get_lab_content(lab_num: int):
    """Get all chunks associated with a specific lab number."""
    if lab_num not in LAB_CHUNKS:
        return {"error": f"Lab {lab_num} not found", "available_labs": list(LAB_CHUNKS.keys())}
    
    chunks = LAB_CHUNKS.get(lab_num, [])
    combined_text = "\n\n".join(c.get("text", "") for c in chunks)
    
    return {
        "lab_num": lab_num,
        "chunk_count": len(chunks),
        "chunks": chunks,
        "combined_text": combined_text
    }


# ---------------------------------------------------------
# /ask endpoint
# ---------------------------------------------------------
@app.post("/ask")
def ask(query: Query):
    chunks = retrieve_chunks(query.q, query.k)

    if not query.use_llm:
        return {"mode": "retriever_only", "retrieved": chunks}

    # Detect question type for tailored prompting
    q_type = detect_question_type(query.q)
    type_prompt = QUESTION_PROMPTS.get(q_type, QUESTION_PROMPTS["general"])

    context_text = "\n\n".join(
        f"[{c['id']}]\n{c['text']}" for c in chunks
    )

    prompt = (
        f"{SYSTEM_PROMPT_BASE}\n\n"
        f"{type_prompt}\n\n"
        f"CONTEXT:\n{context_text}\n\n"
        f"QUESTION: {query.q}\n\n"
        f"ANSWER:"
    )

    answer = call_llm(prompt)

    # fallback if completely empty
    if not answer.strip():
        fallback = (
            f"{SYSTEM_PROMPT_BASE}\n\n"
            f"Using ONLY the context, give a detailed answer.\n"
            f"CONTEXT:\n{context_text}\n\n"
            f"QUESTION: {query.q}\n"
            f"ANSWER:"
        )
        answer = call_llm(fallback, max_tokens=600)

    if not answer.strip():
        # last resort: synthesize from raw text
        answer = "Based on the lab manual content: " + " ".join(
            c.get("text", "")[:400] + "..." for c in chunks[:3]
        )

    citations = CITE_RE.findall(answer)
    return {
        "mode": "llm_answer",
        "question_type": q_type,
        "answer": answer,
        "citations": citations,
        "retrieved": chunks,
    }


# ---------------------------------------------------------
# /mcqs/{lab_num} endpoint - Serve pre-built MCQ JSON bank for a lab
# ---------------------------------------------------------
@app.get("/mcqs/{lab_num}")
def get_mcqs(lab_num: int):
    """Return the pre-built MCQ bank for a lab as JSON."""
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    mcq_path = os.path.join(root, "mcqs", f"lab{lab_num}.json")
    if not os.path.exists(mcq_path):
        return {"error": f"MCQs for lab {lab_num} not found", "available": list(range(1, 11))}
    with open(mcq_path, "r", encoding="utf-8") as f:
        mcqs = json.load(f)
    return {"lab_num": lab_num, "count": len(mcqs), "mcqs": mcqs}


# ---------------------------------------------------------
# Serve the frontend
# ---------------------------------------------------------
@app.get("/")
def home():
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    index_path = os.path.join(root, "index.html")
    return FileResponse(index_path)


# ---------------------------------------------------------
# Run (for python -m scripts.rag_server)
# ---------------------------------------------------------
if __name__ == "__main__":
    import uvicorn

    print("🚀 RAG Server running at: http://127.0.0.1:8000")
    uvicorn.run(
        "scripts.rag_server:app",
        host="127.0.0.1",
        port=8000,
        log_level="info",
    )
