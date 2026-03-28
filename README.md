# JEE Physics RAG Chatbot 🔬⚛️

A **Retrieval-Augmented Generation (RAG)** chatbot that answers JEE Physics questions from **Kinematics** and **Laws of Motion** chapters, backed by a persistent vector index, grounded LLM answers with source citations, and a clean chat interface.

![Stack](https://img.shields.io/badge/Backend-FastAPI-009688?style=flat-square)
![Stack](https://img.shields.io/badge/Frontend-Next.js-000?style=flat-square)
![Stack](https://img.shields.io/badge/Vector_DB-ChromaDB-blue?style=flat-square)
![Stack](https://img.shields.io/badge/LLM-GPT--3.5--turbo-74aa9c?style=flat-square)

---

## Architecture

```
┌──────────────┐     ┌────────────────────────────────────────┐
│   Frontend   │────▶│            Backend (FastAPI)            │
│  (Next.js)   │◀────│                                        │
│              │     │  ┌──────────┐  ┌──────────┐  ┌──────┐ │
│ Chat UI      │     │  │ Retriever│──│ ChromaDB │  │ LLM  │ │
│ Source Cards │     │  │          │  │ (Vector  │  │(GPT) │ │
│ Chapter      │     │  │ Embed    │  │  Index)  │  │      │ │
│ Filters      │     │  │ Query    │  └──────────┘  └──────┘ │
│              │     │  └──────────┘                          │
└──────────────┘     └────────────────────────────────────────┘
```

## Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- OpenAI API key

### 1. Clone & Setup

```bash
git clone https://github.com/your-username/jee-rag-chatbot.git
cd jee-rag-chatbot
```

### 2. Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # or `venv\Scripts\activate` on Windows
pip install -r requirements.txt
```

Create `.env` in the project root:
```
OPENAI_API_KEY=sk-your-key-here
```

### 3. Ingest & Index

```bash
# Step 1: Parse chapters into chunks
python ingestion/ingest.py

# Step 2: Build vector index (runs once)
python indexer/build_index.py
```

### 4. Start Backend

```bash
uvicorn main:app --reload --port 8000
```

API docs available at: http://localhost:8000/docs

### 5. Start Frontend

```bash
cd ../frontend
npm install
npm run dev
```

Open http://localhost:3000

---

## API Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/query` | POST | Send a question, get grounded answer + sources |
| `/health` | GET | Health check with indexed chunk count |
| `/index/info` | GET | Chapters and total chunks in the index |
| `/feedback` | POST | Submit helpful/not_helpful feedback on a response |
| `/admin/reindex` | POST | Manually trigger re-ingestion and index rebuild |
| `/analytics` | GET | Query stats, feedback counts, recent queries |

### POST /query

```json
{
  "question": "What is projectile motion?",
  "chapter_filter": "Kinematics",
  "conversation_history": []
}
```

**Response:**
```json
{
  "query_id": "1711590000000",
  "answer": "Projectile motion is...",
  "sources": [
    {
      "text": "...",
      "chapter": "Kinematics",
      "section": "9. Projectile Motion",
      "score": 0.89
    }
  ],
  "response_time_ms": 1200
}
```

---

## Project Structure

```
jee-rag-chatbot/
├── .github/workflows/ci.yml # CI/CD pipeline
├── data/chapters/           # Source markdown files
├── backend/
│   ├── ingestion/ingest.py  # Parsing + chunking
│   ├── indexer/
│   │   ├── build_index.py   # Embedding + ChromaDB index
│   │   └── retriever.py     # Similarity search
│   ├── llm/generator.py     # Grounded LLM answers
│   ├── logger.py            # Query & feedback logging
│   ├── main.py              # FastAPI application
│   └── config.py            # Environment config
├── frontend/
│   └── src/app/
│       ├── components/      # React components
│       ├── lib/api.ts       # API client
│       └── page.tsx         # Main chat page
├── docker-compose.yml
└── README.md
```

---

## Deployment

### Backend → Render
1. Connect GitHub repo, set root to `backend/`
2. Add env var: `OPENAI_API_KEY`
3. Add a persistent disk at `/app/data/chroma_index/`

### Frontend → Vercel
1. Import repo, set root to `frontend/`
2. Add env var: `NEXT_PUBLIC_API_URL=https://your-backend.onrender.com`

---

## Features

**Core:**
- ✅ Document ingestion with overlap chunking + metadata
- ✅ Persistent ChromaDB vector index
- ✅ Grounded answers with source citations
- ✅ Mobile-responsive dark-theme chatbot UI

**Bonus:**
- ✅ Chapter filter in UI
- ✅ Manual re-index trigger (`POST /admin/reindex`)
- ✅ Session-based conversation memory
- ✅ Docker + docker-compose support
- ✅ CI/CD pipeline (GitHub Actions)
- ✅ Feedback buttons (👍/👎) wired to backend
- ✅ Query & retrieval logging with analytics dashboard (`GET /analytics`)

## Limitations & Future Improvements

- **Limited scope**: Only 2 chapters indexed. Could expand to full JEE syllabus.
- **No persistent chat history**: Conversations are session-only (React state). Could add database-backed history.
- **No re-ranking**: Uses raw cosine similarity. HyDE or cross-encoder re-ranking could improve retrieval quality.
- **No image/diagram support**: Physics diagrams are not indexed. Could add multi-modal support.
- **Single LLM**: GPT-3.5-turbo only. Could add fallback to local models for cost savings.

---

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Backend | FastAPI (Python 3.11) |
| Vector Store | ChromaDB (persistent) |
| Embeddings | OpenAI text-embedding-3-small |
| LLM | GPT-3.5-turbo |
| Frontend | Next.js 15 + TypeScript |
| Deployment | Docker, Render, Vercel |
