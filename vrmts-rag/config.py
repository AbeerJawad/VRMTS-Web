# ================= CONFIG.PY =================
import os

PDF_PATH = "data/Human-Anatomy-Lab-Manual.pdf"
DOCS_DIR = "data/docs"
INDEX_DIR = "indices"
OUTPUTS_DIR = "outputs"

# Embedding model
MODEL_NAME = "llama3.2"
EMBED_MODEL = os.path.join(os.path.dirname(__file__), "onnx", "all-MiniLM-L6-v2.onnx")
EMBEDDING_DIM = 384

# FINAL CHUNK SETTINGS
CHUNK_SIZE = 800
CHUNK_OVERLAP =200

# Retrieval
TOP_K = 6
