"""
FastAPI main application — JEE RAG Chatbot Backend.
Exposes /query, /health, /index/info, /admin/reindex, /feedback, and /analytics endpoints.
"""

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from contextlib import asynccontextmanager
import os
import time
from indexer.retriever import retrieve, get_index_info
from llm.generator import generate_answer
from logger import log_query, log_feedback, get_analytics


# --- Lifespan ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    info = get_index_info()
    if info.get("error"):
        print(f"⚠️  Index not found: {info['error']}")
        print("   Run: python indexer/build_index.py")
    else:
        print(f"✅ Index loaded: {info['total_chunks']} chunks, {len(info['chapters'])} chapters")
    yield
    print("👋 Shutting down...")


# --- App ---
app = FastAPI(
    title="JEE Physics RAG Chatbot API",
    description="RAG-based API for answering JEE Physics questions from Kinematics and Laws of Motion chapters.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Request/Response Models ---
class QueryRequest(BaseModel):
    question: str = Field(..., min_length=2, max_length=500, description="The student's question")
    chapter_filter: str | None = Field(None, description="Optional chapter to filter by")
    conversation_history: list[dict] | None = Field(None, description="Previous messages for session memory")


class SourceChunk(BaseModel):
    text: str
    chapter: str
    section: str
    source_file: str
    score: float


class QueryResponse(BaseModel):
    query_id: str
    answer: str
    sources: list[SourceChunk]
    response_time_ms: int


class HealthResponse(BaseModel):
    status: str
    indexed_chunks: int


class IndexInfoResponse(BaseModel):
    chapters: list[str]
    total_chunks: int
    collection_name: str


class FeedbackRequest(BaseModel):
    query_id: str = Field(..., description="ID of the query to give feedback on")
    question: str = Field(..., description="The original question")
    feedback: str = Field(..., pattern="^(helpful|not_helpful)$", description="Either 'helpful' or 'not_helpful'")


class FeedbackResponse(BaseModel):
    status: str
    message: str


class ReindexResponse(BaseModel):
    status: str
    message: str


class AnalyticsResponse(BaseModel):
    total_queries: int
    avg_response_time_ms: int
    total_feedback: int
    helpful_count: int
    not_helpful_count: int
    top_chapters_queried: dict
    recent_queries: list[dict]


# --- Core Endpoints ---

@app.post("/query", response_model=QueryResponse)
async def query_endpoint(request: QueryRequest):
    """Answer a JEE Physics question using RAG. Returns a grounded answer with source references."""
    start_time = time.time()
    query_id = str(int(time.time() * 1000))

    try:
        # 1. Retrieve relevant chunks
        chunks = retrieve(
            query=request.question,
            top_k=5,
            chapter_filter=request.chapter_filter,
        )

        if not chunks:
            raise HTTPException(
                status_code=404,
                detail="No relevant content found. Try rephrasing your question.",
            )

        # 2. Generate grounded answer
        answer = generate_answer(
            question=request.question,
            chunks=chunks,
            conversation_history=request.conversation_history,
        )

        # 3. Compute response time
        elapsed_ms = int((time.time() - start_time) * 1000)

        # 4. Log the query (non-blocking)
        try:
            log_query(
                question=request.question,
                chapter_filter=request.chapter_filter,
                retrieved_chunks=chunks,
                answer=answer,
                response_time_ms=elapsed_ms,
            )
        except Exception:
            pass  # Logging should never break the response

        sources = [
            SourceChunk(
                text=chunk["text"],
                chapter=chunk["chapter"],
                section=chunk["section"],
                source_file=chunk["source_file"],
                score=chunk["score"],
            )
            for chunk in chunks
        ]

        return QueryResponse(
            query_id=query_id,
            answer=answer,
            sources=sources,
            response_time_ms=elapsed_ms,
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")


@app.get("/health", response_model=HealthResponse)
async def health_endpoint():
    """Health check — returns status and indexed chunk count."""
    info = get_index_info()
    return HealthResponse(
        status="ok" if not info.get("error") else "degraded",
        indexed_chunks=info.get("total_chunks", 0),
    )


@app.get("/index/info", response_model=IndexInfoResponse)
async def index_info_endpoint():
    """Get information about the vector index."""
    info = get_index_info()
    if info.get("error"):
        raise HTTPException(status_code=503, detail=f"Index unavailable: {info['error']}")

    return IndexInfoResponse(
        chapters=info["chapters"],
        total_chunks=info["total_chunks"],
        collection_name=info["collection_name"],
    )


# --- Bonus Endpoints ---

@app.post("/admin/reindex", response_model=ReindexResponse)
async def reindex_endpoint(background_tasks: BackgroundTasks):
    """
    Manually trigger a re-index of all chapter data.
    Runs ingestion + index rebuild in the background.
    """
    def _run_reindex():
        try:
            from ingestion.ingest import ingest_chapters, save_chunks
            from indexer.build_index import build_index

            print("🔄 Re-index triggered via API...")
            chunks = ingest_chapters()
            save_chunks(chunks)
            build_index(force_rebuild=True)
            print("✅ Re-index complete!")
        except Exception as e:
            print(f"❌ Re-index failed: {e}")

    background_tasks.add_task(_run_reindex)

    return ReindexResponse(
        status="accepted",
        message="Re-indexing started in background. Check /health for updated chunk count.",
    )


@app.post("/feedback", response_model=FeedbackResponse)
async def feedback_endpoint(request: FeedbackRequest):
    """Submit feedback (helpful/not_helpful) for a specific query response."""
    try:
        log_feedback(
            query_id=request.query_id,
            question=request.question,
            feedback=request.feedback,
        )
        return FeedbackResponse(
            status="ok",
            message=f"Feedback '{request.feedback}' recorded for query {request.query_id}.",
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to log feedback: {str(e)}")


@app.get("/analytics", response_model=AnalyticsResponse)
async def analytics_endpoint():
    """Get query and feedback analytics."""
    stats = get_analytics()
    return AnalyticsResponse(**stats)
