import os
from dotenv import load_dotenv

load_dotenv()

# Google Gemini
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

# Paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "data")
CHAPTERS_DIR = os.path.join(DATA_DIR, "chapters")
CHUNKS_FILE = os.path.join(DATA_DIR, "chunks.json")
CHROMA_PATH = os.getenv("CHROMA_PATH", os.path.join(DATA_DIR, "chroma_index"))

# Chunking
CHUNK_SIZE = 500  # characters
CHUNK_OVERLAP = 100  # characters

# Retrieval
TOP_K = 5

# LLM
LLM_MODEL = os.getenv("LLM_MODEL", "gemini-2.0-flash")
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "models/gemini-embedding-001")

