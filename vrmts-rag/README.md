# 🎓 Human Anatomy RAG Chatbot & MCQ Generator

A RAG (Retrieval-Augmented Generation) based chatbot for the Human Anatomy Lab Manual, with an integrated MCQ (Multiple Choice Question) generator for student assessment.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Installation](#installation)
- [Usage](#usage)
- [API Reference](#api-reference)
- [MCQ Generation](#mcq-generation)
- [Project Structure](#project-structure)
- [Configuration](#configuration)
- [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

This project provides an intelligent tutoring system for Human Anatomy students, powered by:

- **RAG Chatbot**: Answers questions using content from the lab manual with semantic search
- **MCQ Generator**: Creates comprehensive question banks (50-100 MCQs per lab) for all 10 labs
- **Local LLM Integration**: Uses Ollama with llama3.2 for response generation
- **FAISS Vector Search**: Fast semantic similarity search across document chunks

### Labs Covered

| Lab # | Topic |
|-------|-------|
| 1 | Anatomical Language - body planes, directional terms, body regions |
| 2 | Bones and Bone Markings - skeletal system, bone types |
| 3 | Spinal Cord and Spinal Nerves - nerve pathways, dermatomes |
| 4 | Brain and Cranial Nerves - brain regions, neural pathways |
| 5 | Special Senses - eye, ear, taste, smell anatomy |
| 6 | Muscles - muscle groups, origins, insertions, actions |
| 7 | Heart and Blood Vessels - cardiac anatomy, circulation |
| 8 | Respiratory System - lungs, airways, gas exchange |
| 9 | Digestive System - GI tract, accessory organs |
| 10 | Urinary and Reproductive Systems |

---

## ✨ Features

### RAG Chatbot
- **Semantic Search**: Uses all-MiniLM-L6-v2 embeddings for accurate retrieval
- **Question Type Detection**: Automatically detects question types (definition, list, explanation, comparison, etc.)
- **Lab-Aware Retrieval**: Prioritizes content from specific labs when mentioned
- **Context-Rich Answers**: Provides detailed explanations with citations

### MCQ Generator
- **High Volume**: Generates 50-100 MCQs per lab
- **Diverse Categories**: Covers definitions, identification, function, location, clinical relevance
- **Quality Control**: Validates MCQ structure and removes duplicates
- **Batch Processing**: Efficient generation with retry logic

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      User Interface                         │
│                      (index.html)                           │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     RAG Server (FastAPI)                    │
│                   scripts/rag_server.py                     │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────┐  │
│  │  FAISS      │  │  Question    │  │  LLM Integration   │  │
│  │  Index      │  │  Type        │  │  (Ollama)          │  │
│  │  Search     │  │  Detection   │  │                    │  │
│  └─────────────┘  └──────────────┘  └────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Document Chunks                          │
│                    data/docs/*.json                         │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Installation

### Prerequisites

1. **Python 3.8+**
2. **Ollama** with llama3.2 model installed

### Setup Steps

```bash
# 1. Clone/navigate to the project
cd vrmts-rag

# 2. Create virtual environment (recommended)
python -m venv venv
.\venv\Scripts\activate  # Windows
# source venv/bin/activate  # Linux/Mac

# 3. Install dependencies
pip install -r requirements.txt

# 4. Ensure Ollama is running with llama3.2
ollama pull llama3.2
ollama serve
```

### Dependencies

```
fastapi
uvicorn
faiss-cpu
numpy
transformers
onnxruntime
requests
pydantic
tqdm
```

---

## 📖 Usage

### 1. Start the RAG Server

```bash
python -m scripts.rag_server
```

The server will start at `http://127.0.0.1:8000`

### 2. Open the Chat Interface

Open `index.html` in your browser or navigate to `http://127.0.0.1:8000/`

### 3. Generate MCQs

```bash
# Generate MCQs for all 10 labs (default: 60 MCQs each)
python generate_mcqs.py

# Generate for specific labs
python generate_mcqs.py --labs 1 2 3

# Specify target MCQ count
python generate_mcqs.py --count 80
```

---

## 🔌 API Reference

### POST `/ask`

Ask a question to the RAG chatbot.

**Request Body:**
```json
{
  "q": "What is the purpose of Lab 2?",
  "k": 6,
  "use_llm": true
}
```

**Response:**
```json
{
  "mode": "llm_answer",
  "question_type": "explanation",
  "answer": "Lab 2 focuses on...",
  "citations": ["lab_chunk_45"],
  "retrieved": [...]
}
```

### GET `/lab_content/{lab_num}`

Get all content chunks for a specific lab.

**Response:**
```json
{
  "lab_num": 2,
  "chunk_count": 15,
  "chunks": [...],
  "combined_text": "..."
}
```

---

## 📝 MCQ Generation

### Output Format

MCQs are saved to `mcqs/lab{N}.json`:

```json
{
  "lab": 1,
  "title": "Anatomical Language - body planes, directional terms...",
  "total_questions": 60,
  "questions": [
    {
      "id": 1,
      "question": "Which plane divides the body into left and right halves?",
      "options": ["Sagittal plane", "Frontal plane", "Transverse plane", "Oblique plane"],
      "correctIndex": 0,
      "difficulty": "easy",
      "category": "definitions",
      "explanation": "The sagittal plane divides the body into left and right portions."
    }
  ]
}
```

### Question Categories

- **definitions**: Terminology and definitions
- **structure_identification**: Identifying anatomical structures
- **function**: Functions of organs/structures
- **location**: Anatomical locations and positions
- **relationships**: How structures relate to each other
- **clinical_relevance**: Clinical applications
- **comparisons**: Compare/contrast questions
- **procedures**: Lab procedures and activities

---

## 📁 Project Structure

```
vrmts-rag/
├── config.py              # Configuration settings
├── generate_mcqs.py       # MCQ generation script
├── index.html             # Chat interface
├── requirements.txt       # Python dependencies
├── README.md              # This file
│
├── data/
│   └── docs/              # Document chunks (lab_chunk_*.json)
│
├── indices/
│   ├── faiss.index        # FAISS vector index
│   └── metas.pkl          # Chunk metadata
│
├── mcqs/                  # Generated MCQ files
│   ├── lab1.json
│   ├── lab2.json
│   └── ...
│
├── onnx/
│   └── all-MiniLM-L6-v2.onnx  # Embedding model
│
├── outputs/               # Output files
│
└── scripts/
    ├── build_index.py     # Build FAISS index
    ├── pdf_to_docs.py     # Convert PDF to chunks
    └── rag_server.py      # FastAPI server
```

---

## ⚙️ Configuration

Edit `config.py` to customize:

```python
# Paths
PDF_PATH = "data/Human-Anatomy-Lab-Manual.pdf"
DOCS_DIR = "data/docs"
INDEX_DIR = "indices"

# LLM Model
MODEL_NAME = "llama3.2"

# Embedding
EMBED_MODEL = "onnx/all-MiniLM-L6-v2.onnx"
EMBEDDING_DIM = 384

# Chunking
CHUNK_SIZE = 800
CHUNK_OVERLAP = 200

# Retrieval
TOP_K = 6
```

---

## 🔧 Troubleshooting

### Common Issues

**1. Ollama Connection Failed**
```
Error: LLM call failed: Connection refused
```
Solution: Ensure Ollama is running: `ollama serve`

**2. No Lab Content Found**
```
Error: Lab X not found
```
Solution: Rebuild the index: `python scripts/build_index.py`

**3. MCQ JSON Parse Errors**
The script has built-in fallback mechanisms. If issues persist, try:
- Reducing batch size in `generate_mcqs.py`
- Increasing timeout values

**4. Empty Responses from RAG**
- Check that FAISS index exists in `indices/`
- Verify document chunks exist in `data/docs/`
- Ensure the tokenizer cache is available

### Rebuilding the Index

If you update the PDF or documents:

```bash
# 1. Convert PDF to chunks
python scripts/pdf_to_docs.py

# 2. Rebuild FAISS index
python scripts/build_index.py
```

---

## 📊 Performance Tips

1. **First Run**: The first query may be slow as models load into memory
2. **Batch MCQ Generation**: Run during off-peak hours for large batches
3. **Memory**: FAISS index loads entirely into RAM (~50MB for 262 chunks)

---

## 📄 License

Based on the Human Anatomy Lab Manual by Malgosia Wilk-Blaszczak, licensed under Creative Commons Attribution 4.0 International License.

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Submit a pull request

---

*Built with ❤️ for anatomy students*
