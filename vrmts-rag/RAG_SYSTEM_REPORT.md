# RAG-Based MCQ Generation & AI Assistant — Technical Report
**Project:** VRMTS (Virtual Reality Medical Training System)  
**Module:** Human Anatomy Lab Manual — RAG Pipeline

---

## 1. Overview

This system uses Retrieval-Augmented Generation (RAG) to serve two purposes:
1. **AI Quiz Generator** — generates MCQs from a pre-built question bank of 399 questions across 10 labs
2. **AI Assistant** — answers student questions about anatomy labs using semantic search over the lab manual

---

## 2. System Architecture

```
PDF (Human Anatomy Lab Manual)
        ↓
  pdf_to_docs.py         → Splits PDF into text chunks → data/docs/*.json
        ↓
  build_index.py         → Embeds chunks using all-MiniLM-L6-v2 (ONNX)
                         → Stores vectors in FAISS index (indices/faiss.index)
        ↓
  rag_server.py (FastAPI) → Serves /ask, /mcqs/{lab}, /lab_content/{lab}
        ↓
  Ollama (llama3.2)      → Generates final answers from retrieved context
```

---

## 3. Chunking Strategy & Optimal Parameters

### 3.1 Why Chunking Matters

The lab manual PDF contains dense anatomical content. If chunks are too small, a retrieved chunk lacks sufficient context. If too large, retrieval becomes imprecise and important details from other sections are excluded.

### 3.2 Parameter Selection

We evaluated three chunk size configurations against two criteria:
- **Retrieval relevance**: Does the retrieved chunk contain the answer?
- **MCQ quality**: Are generated MCQs factually accurate and well-formed?

| Chunk Size | Overlap | Observed Behavior |
|-----------|---------|------------------|
| 400 tokens | 100 | Chunks too narrow — missing anatomical context, MCQs often incomplete |
| 600 tokens | 150 | Better coverage but some topics split across boundaries |
| **800 tokens** | **200** | ✅ Best balance — full concept coverage, clean topic boundaries |
| 1000 tokens | 250 | Retrieval less precise — unrelated content mixed into answers |

**Final Settings (config.py):**
```python
CHUNK_SIZE = 800       # tokens per chunk
CHUNK_OVERLAP = 200    # overlap between consecutive chunks (25%)
TOP_K = 6              # number of chunks retrieved per query
```

The **25% overlap** (200/800) ensures that concepts spanning chunk boundaries are not lost, which is critical for anatomical structures that are described across multiple paragraphs.

### 3.3 TOP_K Selection

`TOP_K = 6` was chosen because:
- Overview/list questions benefit from more context → server dynamically increases to 8–10 for these
- Definition/specific questions need precise, focused context → 6 chunks is sufficient
- Beyond 6 chunks, LLM context becomes noisy and answer quality drops

The server automatically adjusts TOP_K per question type:

| Question Type | TOP_K Used |
|--------------|-----------|
| Definition ("What is...") | 6 |
| List ("Name all...") | 8 |
| Overview ("About Lab X") | 10 |
| Comparison | 6 |

---

## 4. Embedding Model

- **Model:** `all-MiniLM-L6-v2` (384-dimensional embeddings)
- **Format:** ONNX (runs locally without internet, no GPU required)
- **Tokenizer max length:** 128 tokens
- **Index type:** FAISS `IndexFlatL2` (exact L2 distance search)
- **Total chunks indexed:** 262 chunks from 10 labs

The MiniLM model was chosen for its balance of speed and semantic accuracy for domain-specific medical text retrieval.

---

## 5. MCQ Generation Pipeline

### 5.1 How MCQs Were Generated

1. RAG server retrieves relevant chunks for each lab topic
2. Ollama (llama3.2) generates MCQs from the retrieved context
3. MCQs are validated: structure check, deduplication, correctIndex validation
4. Final MCQs saved to `mcqs/lab{N}.json`

### 5.2 MCQ Bank Statistics

| Lab | Topic | Questions |
|-----|-------|-----------|
| 1 | Anatomical Language | ~40 |
| 2 | Bones & Bone Markings | ~40 |
| 3–10 | Various Systems | ~40 each |
| **Total** | | **399 MCQs** |

### 5.3 MCQ Structure

Each MCQ contains:
```json
{
  "id": 1,
  "question": "Which plane divides the body into left and right halves?",
  "options": ["Sagittal plane", "Frontal plane", "Transverse plane", "Oblique plane"],
  "correctIndex": 0,
  "difficulty": "easy",
  "topic": "body planes",
  "explanation": "The sagittal plane divides the body into left and right portions."
}
```

### 5.4 Difficulty Distribution (per lab)
- **Easy** (recall/definition): ~35%
- **Medium** (application/understanding): ~45%
- **Hard** (analysis/comparison): ~20%

---

## 6. AI Assistant Integration

Students can ask questions through the web portal. The flow:

```
Student Question → Backend /api/chat → RAG POST /ask
                                          ↓
                              FAISS semantic search (TOP_K chunks)
                                          ↓
                              Ollama llama3.2 generates answer
                                          ↓
                              Answer returned to student
```

The assistant detects question type automatically (definition, list, overview, comparison, procedure, explanation) and adapts its retrieval and prompting strategy accordingly.

---

## 7. Web Integration (VRMTS-WebModule)

| Feature | Endpoint | Description |
|---------|----------|-------------|
| Teacher generates quiz | `POST /api/quiz/generate-rag-quiz` | Fetches MCQs from RAG, stores in DB |
| Student sees quiz | `GET /api/quiz/module/:id/custom` | Returns published quizzes |
| Student asks AI | `POST /api/modules/:id/chat` | Proxies to RAG `/ask` |
| Teacher previews quiz | `GET /api/quiz/:id/questions` | Shows generated questions |

---

## 8. Key Technical Decisions

| Decision | Choice | Reason |
|----------|--------|--------|
| Vector DB | FAISS (flat L2) | Simple, fast, no server needed for 262 chunks |
| Embedding | all-MiniLM-L6-v2 ONNX | Runs offline, fast CPU inference |
| LLM | Ollama llama3.2 | Local, no API cost, privacy-safe |
| Chunk size | 800 tokens / 200 overlap | Best MCQ quality in evaluation |
| MCQ storage | Pre-generated JSON files | Faster retrieval, consistent quality |

---

*Report generated for VRMTS project — RAG pipeline by Dania*
