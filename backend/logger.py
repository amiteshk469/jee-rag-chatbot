"""
Query & retrieval logger for analytics.
Logs every query, retrieved chunks, and feedback to a JSON Lines file.
"""

import json
import os
import sys
from datetime import datetime, timezone

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config import DATA_DIR

LOG_DIR = os.path.join(DATA_DIR, "logs")
QUERY_LOG_FILE = os.path.join(LOG_DIR, "queries.jsonl")
FEEDBACK_LOG_FILE = os.path.join(LOG_DIR, "feedback.jsonl")


def _ensure_log_dir():
    os.makedirs(LOG_DIR, exist_ok=True)


def _append_jsonl(filepath: str, record: dict):
    """Append a single JSON record to a JSONL file."""
    _ensure_log_dir()
    with open(filepath, 'a', encoding='utf-8') as f:
        f.write(json.dumps(record, ensure_ascii=False) + '\n')


def log_query(
    question: str,
    chapter_filter: str | None,
    retrieved_chunks: list[dict],
    answer: str,
    response_time_ms: int,
):
    """Log a query with its retrieval results and generated answer."""
    record = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "type": "query",
        "question": question,
        "chapter_filter": chapter_filter,
        "num_chunks_retrieved": len(retrieved_chunks),
        "top_chunk_scores": [c.get("score", 0) for c in retrieved_chunks[:3]],
        "top_chunk_chapters": [c.get("chapter", "") for c in retrieved_chunks[:3]],
        "answer_length": len(answer),
        "response_time_ms": response_time_ms,
    }
    _append_jsonl(QUERY_LOG_FILE, record)


def log_feedback(
    query_id: str,
    question: str,
    feedback: str,  # "helpful" or "not_helpful"
):
    """Log user feedback on a response."""
    record = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "type": "feedback",
        "query_id": query_id,
        "question": question,
        "feedback": feedback,
    }
    _append_jsonl(FEEDBACK_LOG_FILE, record)


def get_analytics() -> dict:
    """Read logs and compute basic analytics."""
    stats = {
        "total_queries": 0,
        "avg_response_time_ms": 0,
        "total_feedback": 0,
        "helpful_count": 0,
        "not_helpful_count": 0,
        "top_chapters_queried": {},
        "recent_queries": [],
    }

    # Query stats
    if os.path.exists(QUERY_LOG_FILE):
        total_time = 0
        with open(QUERY_LOG_FILE, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                try:
                    record = json.loads(line)
                    stats["total_queries"] += 1
                    total_time += record.get("response_time_ms", 0)

                    # Track chapter usage
                    for ch in record.get("top_chunk_chapters", []):
                        if ch:
                            stats["top_chapters_queried"][ch] = stats["top_chapters_queried"].get(ch, 0) + 1

                    # Keep last 10 queries
                    stats["recent_queries"].append({
                        "question": record.get("question", ""),
                        "timestamp": record.get("timestamp", ""),
                        "response_time_ms": record.get("response_time_ms", 0),
                    })
                except json.JSONDecodeError:
                    continue

        if stats["total_queries"] > 0:
            stats["avg_response_time_ms"] = round(total_time / stats["total_queries"])
        stats["recent_queries"] = stats["recent_queries"][-10:]

    # Feedback stats
    if os.path.exists(FEEDBACK_LOG_FILE):
        with open(FEEDBACK_LOG_FILE, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                try:
                    record = json.loads(line)
                    stats["total_feedback"] += 1
                    if record.get("feedback") == "helpful":
                        stats["helpful_count"] += 1
                    elif record.get("feedback") == "not_helpful":
                        stats["not_helpful_count"] += 1
                except json.JSONDecodeError:
                    continue

    return stats
