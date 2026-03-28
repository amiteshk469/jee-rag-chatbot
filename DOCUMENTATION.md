# JEE RAG Chatbot — Complete Code Documentation

> A detailed explanation of every file, function, and component in the repository.
> Separated into **Backend** and **Frontend** sections.

---

# Table of Contents

- [Architecture Overview](#architecture-overview)
- [Data Flow](#data-flow)
- **BACKEND**
  - [config.py](#1-configpy)
  - [ingestion/ingest.py](#2-ingestioningestpy)
  - [indexer/build_index.py](#3-indexerbuild_indexpy)
  - [indexer/retriever.py](#4-indexerretrieverpy)
  - [llm/generator.py](#5-llmgeneratorpy)
  - [logger.py](#6-loggerpy)
  - [main.py — FastAPI Application](#7-mainpy--fastapi-application)
- **FRONTEND**
  - [lib/api.ts](#1-libapits)
  - [page.tsx — Main Page](#2-pagetsx--main-page)
  - [components/MessageBubble.tsx](#3-componentsmessagebubbletsx)
  - [components/SourceCard.tsx](#4-componentssourcecardtsx)
  - [components/InputBar.tsx](#5-componentsinputbartsx)
  - [components/ChapterFilter.tsx](#6-componentschapterfiltertsx)
  - [components/TypingIndicator.tsx](#7-componentstypingindicatortsx)
  - [globals.css](#8-globalscss)
- **DEVOPS**
  - [Dockerfile](#dockerfile)
  - [docker-compose.yml](#docker-composeyml)
  - [CI/CD Pipeline](#cicd-pipeline)

---

# Architecture Overview

```
User types question
        │
        ▼
┌──────────────────┐         ┌──────────────────────────────────────┐
│    FRONTEND      │  POST   │           BACKEND (FastAPI)          │
│    (Next.js)     │────────▶│                                      │
│                  │         │  1. Embed query (OpenAI)             │
│  • Chat UI       │◀────────│  2. Search ChromaDB (cosine sim)     │
│  • Source cards   │  JSON   │  3. Build grounded prompt            │
│  • Chapter filter │         │  4. Call GPT-3.5-turbo               │
│  • Feedback btns  │         │  5. Return answer + sources          │
└──────────────────┘         └──────────────────────────────────────┘
```

# Data Flow

```
Markdown chapters → ingest.py → chunks.json → build_index.py → ChromaDB (on disk)
                                                                       │
User question → /query endpoint → retriever.py (embed + search) ───────┘
                                       │
                                 top-K chunks
                                       │
                               generator.py (LLM) → grounded answer + sources → JSON response
```

---

# BACKEND

All backend files are in `backend/`. The backend is a Python FastAPI application.

---

## 1. `config.py`

**Purpose:** Central configuration module. Loads environment variables and defines constants used across all backend modules.

### Constants & Variables

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `OPENAI_API_KEY` | `str` | `""` | API key for OpenAI (embeddings + LLM) |
| `BASE_DIR` | `str` | Auto-detected | Root of the project (parent of `backend/`) |
| `DATA_DIR` | `str` | `{BASE_DIR}/data` | Location of chapter files and generated data |
| `CHAPTERS_DIR` | `str` | `{DATA_DIR}/chapters` | Folder containing markdown chapter files |
| `CHUNKS_FILE` | `str` | `{DATA_DIR}/chunks.json` | Output file from ingestion |
| `CHROMA_PATH` | `str` | `{DATA_DIR}/chroma_index` | Persistent ChromaDB directory |
| `CHUNK_SIZE` | `int` | `500` | Max characters per chunk |
| `CHUNK_OVERLAP` | `int` | `100` | Characters of overlap between adjacent chunks |
| `TOP_K` | `int` | `5` | Number of chunks to retrieve per query |
| `LLM_MODEL` | `str` | `gpt-3.5-turbo` | OpenAI chat model for answer generation |
| `EMBEDDING_MODEL` | `str` | `text-embedding-3-small` | OpenAI model for text embeddings |
| `CORS_ORIGINS` | `list[str]` | `localhost:3000, :5173` | Allowed frontend origins for CORS |

**How it works:** Uses `python-dotenv` to load a `.env` file at the project root. All other modules import from this file rather than reading env vars directly, keeping configuration centralized.

---

## 2. `ingestion/ingest.py`

**Purpose:** Reads raw markdown chapter files, cleans them, splits into overlapping chunks with metadata, and saves the result as `chunks.json`.

### Functions

#### `clean_text(text: str) → str`
- **What:** Normalizes whitespace — collapses 3+ consecutive newlines to 2, and multiple spaces to 1.
- **Input:** Raw markdown string.
- **Output:** Cleaned string.
- **Why:** Prevents embedding noise from formatting inconsistencies.

#### `extract_sections(text: str) → list[dict]`
- **What:** Splits a markdown document into sections using `## ` (H2) headings as delimiters.
- **Input:** Cleaned markdown text.
- **Output:** List of `{"title": "section name", "content": "section text"}`.
- **Why:** Keeps section-level metadata for each chunk so we know which topic it came from.

#### `chunk_text(text: str, chunk_size=500, overlap=100) → list[str]`
- **What:** Splits section content into chunks of approximately `chunk_size` characters, with `overlap` characters carried from the end of the previous chunk.
- **Splitting strategy:** Uses a regex to split at sentence boundaries (`[.!?]` followed by space) or double newlines. This produces semantically meaningful chunks rather than hard character cuts.
- **Overlap:** Ensures continuity — if a concept spans a chunk boundary, the beginning of the next chunk contains the tail of the previous one.
- **Output:** List of text strings.

#### `ingest_chapters(chapters_dir: str) → list[dict]`
- **What:** The main pipeline. Iterates over all `.md` files in the chapters directory, extracts sections, chunks each section, and assembles the final list.
- **Each chunk dict contains:**
  - `chunk_id` (int) — sequential global ID
  - `chapter` (str) — chapter name derived from filename (e.g., `"Kinematics"`)
  - `section` (str) — section heading (e.g., `"5. Equations of Motion"`)
  - `source_file` (str) — original filename (e.g., `"kinematics.md"`)
  - `text` (str) — the chunk content
  - `char_count` (int) — length of the text
- **Filter:** Chunks shorter than 50 characters are dropped (too small to be meaningful).

#### `save_chunks(chunks: list[dict], output_path: str)`
- **What:** Writes the chunks list to a JSON file.
- **Output:** `data/chunks.json`.

#### `__main__` block
When run directly (`python ingestion/ingest.py`), it:
1. Runs `ingest_chapters()`
2. Saves to disk
3. Prints stats: number of chapters, total chunks, per-chapter breakdown, average chunk size, and a sample chunk.

---

## 3. `indexer/build_index.py`

**Purpose:** Takes the `chunks.json` file, generates OpenAI embeddings for each chunk, and stores them in a persistent ChromaDB collection.

### Constants

| Constant | Value | Description |
|----------|-------|-------------|
| `COLLECTION_NAME` | `"jee_physics"` | Name of the ChromaDB collection |

### Functions

#### `get_chroma_client() → PersistentClient`
- **What:** Creates and returns a ChromaDB `PersistentClient` pointing to the `CHROMA_PATH` directory.
- **Why persistent:** Data survives server restarts. The assessment requires the index to NOT rebuild on every restart.

#### `embed_texts(texts: list[str], client: OpenAI, model: str) → list[list[float]]`
- **What:** Sends texts to OpenAI's embedding API in batches of 100.
- **Batching:** OpenAI has payload limits; batching avoids request failures for large datasets.
- **Output:** List of embedding vectors (list of floats), one per input text.
- **Logging:** Prints progress (`Embedded batch 1/4`).

#### `build_index(force_rebuild: bool = False) → Collection`
- **What:** The main function. Orchestrates the full indexing pipeline:
  1. **Check for existing index:** If the collection already exists and `force_rebuild=False`, prints a message and returns early. This prevents accidental re-spending on embeddings.
  2. **Load chunks:** Reads `chunks.json`. Errors if file doesn't exist.
  3. **Delete existing** (if `force_rebuild=True`): Removes the old collection.
  4. **Create collection:** With `hnsw:space=cosine` (cosine similarity metric).
  5. **Generate embeddings:** Calls `embed_texts()` for all chunk texts.
  6. **Add to ChromaDB:** Inserts IDs, embeddings, metadata, and documents in batches of 100.
  7. **Reports stats:** Total documents indexed, time taken.

#### `__main__` block
Runs `build_index()`. Passes `--force` flag if provided as CLI argument to force a rebuild.

---

## 4. `indexer/retriever.py`

**Purpose:** Queries the ChromaDB vector index to find chunks most relevant to a user's question.

### Functions

#### `get_collection() → Collection`
- **What:** Opens the persistent ChromaDB client and returns the `jee_physics` collection.
- **Called by:** Every retrieval request.

#### `embed_query(query: str) → list[float]`
- **What:** Takes a single query string and returns its embedding vector via OpenAI.
- **Why separate from `embed_texts`:** Retrieval is single-query, not batch.

#### `retrieve(query: str, top_k: int = 5, chapter_filter: str | None = None) → list[dict]`
- **What:** The main retrieval function. End-to-end: embeds the query, searches ChromaDB, returns formatted results.
- **Parameters:**
  - `query` — the student's question
  - `top_k` — number of results (default 5)
  - `chapter_filter` — optional chapter name to restrict search (e.g., `"Kinematics"`)
- **Process:**
  1. Embed the query using `embed_query()`
  2. Build a ChromaDB `where` filter if `chapter_filter` is provided
  3. Call `collection.query()` with the embedding
  4. Convert ChromaDB's cosine distance to a similarity score: `score = 1 - distance/2`
  5. Format each result as `{ text, chapter, section, source_file, score }`
- **Returns:** List of dicts sorted by relevance (ChromaDB returns them sorted).

#### `get_index_info() → dict`
- **What:** Returns metadata about the current index: total chunks, list of unique chapters, collection name.
- **Error handling:** If the collection doesn't exist, returns an error dict instead of crashing.
- **Used by:** The `/health` and `/index/info` API endpoints.

#### `__main__` block
Quick test: prints index info and runs a sample query for "What is Newton's second law?".

---

## 5. `llm/generator.py`

**Purpose:** Takes retrieved chunks + the user's question and generates a grounded answer using GPT-3.5-turbo.

### Constants

#### `SYSTEM_PROMPT`
A carefully crafted system prompt that instructs the LLM to:
1. Answer **only** from the provided context
2. Admit when information is insufficient
3. Be concise but thorough with formulas and examples
4. Reference chapters/sections when possible
5. Redirect off-topic questions

### Functions

#### `build_context(chunks: list[dict]) → str`
- **What:** Formats retrieved chunks into a single context string.
- **Format:** Each chunk gets a header like `[Source 1: Kinematics — Projectile Motion]` followed by the text, separated by `---`.
- **Why:** Gives the LLM clear attribution markers so it can reference sources in its answer.

#### `generate_answer(question: str, chunks: list[dict], conversation_history: list[dict] | None) → str`
- **What:** The main generation function.
- **Process:**
  1. Build the system message with `SYSTEM_PROMPT`
  2. Append last 6 messages from `conversation_history` (if provided) for session memory
  3. Build user message with the context + question
  4. Call `client.chat.completions.create()` with:
     - `temperature=0.3` (low randomness for factual answers)
     - `max_tokens=1000` (cap answer length)
  5. Return the response text
- **Error handling:** Catches all exceptions and returns a user-friendly error message instead of crashing.
- **Session memory:** By including recent conversation history, the LLM can handle follow-up questions like "explain that more simply" or "give me an example".

---

## 6. `logger.py`

**Purpose:** Lightweight analytics — logs every query and feedback submission to JSONL files for later analysis.

### Constants

| Constant | Path | Description |
|----------|------|-------------|
| `LOG_DIR` | `data/logs/` | Directory for log files |
| `QUERY_LOG_FILE` | `data/logs/queries.jsonl` | One JSON object per line, one per query |
| `FEEDBACK_LOG_FILE` | `data/logs/feedback.jsonl` | One JSON object per line, one per feedback submission |

### Functions

#### `_ensure_log_dir()`
- **What:** Creates `data/logs/` if it doesn't exist.
- **Private helper** (underscore prefix).

#### `_append_jsonl(filepath: str, record: dict)`
- **What:** Appends a single JSON object as one line to a JSONL file.
- **Why JSONL:** Append-friendly (no need to read-modify-write the entire file), easy to parse line by line, and human-readable.

#### `log_query(question, chapter_filter, retrieved_chunks, answer, response_time_ms)`
- **What:** Logs a complete query event. Records:
  - Timestamp (UTC ISO format)
  - The question text
  - Which chapter filter was active (if any)
  - Number of chunks retrieved
  - Top 3 chunk scores and chapters
  - Answer length in characters
  - Response time in milliseconds
- **Called by:** The `/query` endpoint in `main.py` after every successful query.

#### `log_feedback(query_id, question, feedback)`
- **What:** Logs a user feedback event (`"helpful"` or `"not_helpful"`).
- **Links back to:** The original query via `query_id`.
- **Called by:** The `/feedback` endpoint.

#### `get_analytics() → dict`
- **What:** Reads both log files and computes aggregate statistics:
  - `total_queries` — total number of queries ever made
  - `avg_response_time_ms` — average response time
  - `total_feedback` / `helpful_count` / `not_helpful_count` — feedback breakdown
  - `top_chapters_queried` — which chapters appear most in retrieved results
  - `recent_queries` — last 10 queries with timestamps
- **Error handling:** Silently skips malformed JSON lines.

---

## 7. `main.py` — FastAPI Application

**Purpose:** The HTTP server. Exposes all API endpoints and wires together retrieval, generation, and logging.

### Lifespan Handler

#### `lifespan(app)`
- **What:** Runs on server startup/shutdown.
- **Startup:** Checks if the ChromaDB index exists and prints status.
- **Shutdown:** Prints goodbye message.

### Pydantic Models

These define the request/response schemas (with automatic validation and OpenAPI docs):

| Model | Purpose |
|-------|---------|
| `QueryRequest` | Input: `question` (2-500 chars), optional `chapter_filter`, optional `conversation_history` |
| `SourceChunk` | A single retrieved chunk with text, chapter, section, source file, and relevance score |
| `QueryResponse` | Output: `query_id`, `answer`, list of `SourceChunk`, `response_time_ms` |
| `HealthResponse` | Output: `status` ("ok" or "degraded"), `indexed_chunks` count |
| `IndexInfoResponse` | Output: `chapters` list, `total_chunks`, `collection_name` |
| `FeedbackRequest` | Input: `query_id`, `question`, `feedback` (must be "helpful" or "not_helpful") |
| `FeedbackResponse` | Output: `status`, `message` |
| `ReindexResponse` | Output: `status`, `message` |
| `AnalyticsResponse` | Output: all analytics fields from `get_analytics()` |

### Endpoints

#### `POST /query` → `QueryResponse`
The main endpoint. Full RAG pipeline:
1. Call `retrieve()` to get top-K chunks
2. 404 if no chunks found
3. Call `generate_answer()` with chunks + question + conversation history
4. Log the query via `log_query()` (wrapped in try/except so logging never breaks responses)
5. Return answer + sources + response time + query_id

#### `GET /health` → `HealthResponse`
Simple health check. Returns `"ok"` if index is available, `"degraded"` otherwise, plus the count of indexed chunks.

#### `GET /index/info` → `IndexInfoResponse`
Returns the list of indexed chapters, total chunk count, and collection name. 503 if index is unavailable.

#### `POST /admin/reindex` → `ReindexResponse`
**Bonus feature.** Triggers a full re-ingestion + index rebuild in a **background task** (non-blocking). Uses FastAPI's `BackgroundTasks` to run `ingest_chapters()` → `save_chunks()` → `build_index(force_rebuild=True)` asynchronously.

#### `POST /feedback` → `FeedbackResponse`
**Bonus feature.** Accepts user feedback (helpful/not_helpful) for a specific query and logs it to the JSONL file.

#### `GET /analytics` → `AnalyticsResponse`
**Bonus feature.** Returns aggregated analytics: total queries, avg response time, feedback counts, most-queried chapters, and recent queries.

### Middleware
- **CORS:** Configured via `CORS_ORIGINS` to allow the frontend to make cross-origin requests.

---

# FRONTEND

All frontend files are in `frontend/src/app/`. The frontend is a Next.js 16 app with TypeScript.

---

## 1. `lib/api.ts`

**Purpose:** Typed API client — all backend communication goes through this file.

### Interfaces

| Interface | Purpose |
|-----------|---------|
| `SourceChunk` | Mirrors the backend's source chunk structure |
| `QueryResponse` | Response from `/query` — includes `query_id`, `answer`, `sources[]`, `response_time_ms` |
| `HealthResponse` | Response from `/health` |
| `IndexInfoResponse` | Response from `/index/info` |
| `ChatMessage` | Internal UI type: `id`, `queryId?`, `role`, `content`, `sources?`, `responseTime?`, `timestamp` |

### Functions

#### `queryAPI(question, chapterFilter?, conversationHistory?) → Promise<QueryResponse>`
- **What:** Sends a POST to `/query` with the question, optional chapter filter, and optional conversation history.
- **Error handling:** Parses error detail from response body or falls back to "Network error".

#### `getHealth() → Promise<HealthResponse>`
- **What:** GET `/health`. Used to check if backend is alive.

#### `getIndexInfo() → Promise<IndexInfoResponse>`
- **What:** GET `/index/info`. Used on page load to show chunk count and available chapters.

#### `submitFeedback(queryId, question, feedback) → Promise<void>`
- **What:** POST to `/feedback`. Called when user clicks 👍 or 👎.
- **Fire-and-forget:** Errors are caught silently (feedback should never disrupt the user experience).

#### `triggerReindex() → Promise<{status, message}>`
- **What:** POST to `/admin/reindex`. Triggers background re-indexing.

#### `getAnalytics() → Promise<Record<string, unknown>>`
- **What:** GET `/analytics`. Fetches query stats and feedback counts.

---

## 2. `page.tsx` — Main Page

**Purpose:** The root page component. Orchestrates the entire chat experience.

### State Variables

| State | Type | Purpose |
|-------|------|---------|
| `messages` | `ChatMessage[]` | All messages in the conversation |
| `isLoading` | `boolean` | True while waiting for API response |
| `chapterFilter` | `string \| null` | Currently selected chapter filter |
| `indexStatus` | `{chunks, chapters} \| null` | Backend index status (fetched on load) |
| `error` | `string \| null` | Current error message |
| `chatEndRef` | `Ref<HTMLDivElement>` | DOM ref for auto-scrolling to bottom |

### Effects

#### Auto-scroll effect
- **Triggers:** `[messages, isLoading]`
- **What:** Scrolls the chat to the bottom whenever a new message appears or loading starts.

#### Index info fetch effect
- **Triggers:** `[]` (once on mount)
- **What:** Calls `getIndexInfo()` on page load to display the green "X chunks indexed" badge. Silently fails if backend isn't running.

### Functions

#### `handleSend(text: string) → Promise<void>`
The main send handler (wrapped in `useCallback`):
1. Creates a user `ChatMessage` and appends it to state
2. Sets `isLoading = true` (triggers typing indicator)
3. Extracts last 6 messages as `conversation_history` for session memory
4. Calls `queryAPI()` with the question + filter + history
5. On success: creates an assistant `ChatMessage` with `queryId`, answer, sources, and response time
6. On error: creates an error assistant message with the error text
7. Resets `isLoading = false`

### Render Structure

1. **Header** — Sticky top bar with:
   - App icon + title + subtitle
   - Green dot + chunk count (if connected to backend)
   - `ChapterFilter` component
2. **Chat area** — Scrollable main content:
   - Welcome screen (shown when `messages` is empty) with centered icon, description, and 6 suggestion buttons
   - Message list (`MessageBubble` for each message)
   - `TypingIndicator` (shown when `isLoading`)
3. **Input bar** — Fixed bottom `InputBar` component

---

## 3. `components/MessageBubble.tsx`

**Purpose:** Renders a single message bubble — different styles for user vs. assistant.

### Props
- `message: ChatMessage` — the message to render

### State
- `feedbackGiven: 'up' | 'down' | null` — tracks which feedback button was clicked

### Rendered Elements

1. **Avatar + Name** (assistant only): Blue gradient icon with "PHYSICS TUTOR" label + response time badge
2. **Message bubble**: 
   - **User:** Right-aligned, blue-to-indigo gradient, rounded corners
   - **Assistant:** Left-aligned, dark card background, subtle border
3. **Markdown rendering:** The content text is processed line-by-line:
   - `**bold**` → `<strong>` tags
   - Lines starting with `- ` or `• ` → styled bullet points with blue dots
   - Lines starting with `1. ` → numbered items with amber numbers
   - Normal lines → `<p>` tags
4. **Source card** (assistant only): Renders `<SourceCard>` if sources are present
5. **Feedback buttons** (assistant only): 👍 and 👎 buttons that:
   - Toggle on/off visually
   - Call `submitFeedback()` to the backend API with the `queryId`
6. **Timestamp:** Shows `HH:MM` in monospace at the bottom

---

## 4. `components/SourceCard.tsx`

**Purpose:** Collapsible panel showing the source chunks that the answer was grounded in.

### Props
- `sources: SourceChunk[]` — retrieved chunks from the API

### State
- `expanded: boolean` — whether source list is showing

### Rendered Elements

1. **Toggle button:** Shows "N sources referenced" with a document icon and chevron arrow. Hover effect changes border/text color.
2. **Source list** (when expanded): For each source chunk:
   - **Chapter badge** — colored pill with chapter name
   - **Section name** — muted text
   - **Match score** — amber percentage badge (e.g., "89% match")
   - **Chunk text** — truncated to 300 characters
   - **Animation:** Each source card slides in with staggered delay (`animationDelay: idx * 60ms`)

---

## 5. `components/InputBar.tsx`

**Purpose:** The chat input area at the bottom of the screen.

### Props
- `onSend: (message: string) → void` — callback when user sends a message
- `disabled: boolean` — disables input while loading

### State
- `input: string` — current text in the textarea

### Functions

#### `handleSend()`
- Trims whitespace, returns early if empty or disabled
- Calls `onSend(trimmed)`
- Clears the input and resets textarea height

#### `handleKeyDown(e)`
- **Enter** (without Shift) → sends the message
- **Shift+Enter** → allows newline

#### `handleInput()`
- Auto-resizes the textarea based on content (min 48px, max 160px)

### Rendered Elements
1. **Textarea:** Auto-resizing, glowing border on focus, placeholder text
2. **Send button:** Gradient when text is present, gray when empty. Send icon (paper plane SVG).
3. **Footer text:** "Powered by RAG • Answers grounded in study material only"

---

## 6. `components/ChapterFilter.tsx`

**Purpose:** Toggle buttons to filter queries by chapter.

### Props
- `chapters: string[]` — list of available chapter names
- `selected: string | null` — currently selected chapter (null = all)
- `onSelect: (chapter: string | null) → void` — callback when selection changes

### Rendered Elements
- **"All Chapters"** button — highlighted when no filter is active
- **One button per chapter** — toggles on/off. Active state shown with blue glow background and active border.

---

## 7. `components/TypingIndicator.tsx`

**Purpose:** Animated "typing" indicator shown while the backend is processing.

### Props
- `visible: boolean` — controls visibility

### Rendered Elements
- **Avatar:** Same blue gradient icon as assistant messages, with a floating animation
- **Bubble:** Dark card with 3 bouncing dots (CSS animation with staggered `animation-delay`) + "Searching chapters..." text

---

## 8. `globals.css`

**Purpose:** Design system — CSS variables, base styles, scrollbar styling, and animations.

### Design Tokens

| Category | Key Variables |
|----------|--------------|
| Background | `--bg-primary: #0a0c10`, `--bg-secondary`, `--bg-tertiary`, `--bg-card`, `--bg-elevated` |
| Accent | `--accent-primary: #38bdf8` (electric blue), `--accent-secondary: #818cf8` (indigo), `--accent-warm: #f59e0b` (amber) |
| Text | `--text-primary: #e8ecf4`, `--text-secondary`, `--text-muted` |
| Border | `--border-subtle`, `--border-active` |
| Shadow | `--shadow-glow`, `--shadow-card` |
| Layout | `--chat-max-width: 820px`, `--radius: 16px` |

### Animations

| Name | Effect | Used By |
|------|--------|---------|
| `fadeInUp` | Fade in + slide up 12px | `.animate-in` — messages, source cards, welcome screen |
| `slideIn` | Fade in + slide left 8px | `.animate-slide` — individual source cards |
| `pulse-border` | Border color pulsing | Available for interactive elements |
| `shimmer` | Background gradient sweep | Available for loading skeletons |
| `float` | Gentle vertical bobbing | Typing indicator avatar |
| `typing-dot` | Scale + opacity bounce | Three dots in typing indicator |

### Special Elements
- **Grid background:** `body::before` creates a subtle graph-paper pattern using CSS linear gradients (2% opacity blue lines, 40px spacing). Evokes physics graph paper.
- **Custom scrollbar:** 5px wide, rounded, matches the dark theme.

---

# DEVOPS

## Dockerfile

Located at `backend/Dockerfile`. Based on `python:3.11-slim`:
1. Installs `build-essential` (needed for some Python packages)
2. Copies and installs `requirements.txt`
3. Copies application code
4. Exposes port 8000
5. Runs `uvicorn main:app --host 0.0.0.0 --port 8000`

## docker-compose.yml

Single service `backend`:
- Builds from `backend/Dockerfile`
- Maps port `8000:8000`
- Mounts `data/` as a volume (for persistent index)
- Loads `.env` file for API keys

## CI/CD Pipeline

Located at `.github/workflows/ci.yml`. GitHub Actions workflow:

### Jobs

1. **`backend`** (runs on every push/PR to `main`)
   - Sets up Python 3.11 with pip caching
   - Installs requirements
   - Runs `ruff` linter
   - Runs `mypy` type checker (non-blocking)
   - Tests ingestion pipeline (no API key needed)

2. **`frontend`** (runs on every push/PR to `main`)
   - Sets up Node.js 20 with npm caching
   - Runs `npm ci` → `npm run lint` → `npm run build`

3. **`deploy-backend`** (only on push to `main`, after tests pass)
   - Placeholder for Render deploy hook

4. **`deploy-frontend`** (only on push to `main`, after tests pass)
   - Placeholder for Vercel deployment

---

# Summary of File Count

| Layer | Files | Lines of Code |
|-------|-------|--------------|
| Backend | 7 Python files | ~600 lines |
| Frontend | 8 TS/TSX/CSS files | ~950 lines |
| Data | 2 markdown chapters | ~650 lines |
| DevOps | 3 config files | ~100 lines |
| Docs | README + this doc | ~700 lines |
| **Total** | **~20 files** | **~3,000 lines** |
