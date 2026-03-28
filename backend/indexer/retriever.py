"""
Retriever: queries the ChromaDB vector index and returns relevant chunks.
Uses Google Gemini for query embeddings via the google-genai SDK.
"""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config import CHROMA_PATH, GEMINI_API_KEY, EMBEDDING_MODEL, TOP_K

import chromadb
from google import genai

COLLECTION_NAME = "jee_physics"

# Initialize Gemini client
client = genai.Client(api_key=GEMINI_API_KEY)


def get_collection():
    """Get the ChromaDB collection."""
    chroma_client = chromadb.PersistentClient(path=CHROMA_PATH)
    return chroma_client.get_collection(COLLECTION_NAME)


def embed_query(query: str) -> list[float]:
    """Embed a single query string using Gemini."""
    result = client.models.embed_content(
        model=EMBEDDING_MODEL,
        contents=query,
    )
    return result.embeddings[0].values


def retrieve(
    query: str,
    top_k: int = TOP_K,
    chapter_filter: str | None = None,
) -> list[dict]:
    """
    Retrieve the top-k most relevant chunks for a query.
    """
    collection = get_collection()

    # Build query embedding
    query_embedding = embed_query(query)

    # Prepare where filter
    where_filter = None
    if chapter_filter:
        where_filter = {"chapter": chapter_filter}

    # Query ChromaDB
    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=top_k,
        where=where_filter,
        include=["documents", "metadatas", "distances"],
    )

    # Format results
    chunks = []
    if results and results["documents"] and results["documents"][0]:
        for i, doc in enumerate(results["documents"][0]):
            metadata = results["metadatas"][0][i]
            distance = results["distances"][0][i]
            score = 1 - distance / 2

            chunks.append({
                "text": doc,
                "chapter": metadata.get("chapter", ""),
                "section": metadata.get("section", ""),
                "source_file": metadata.get("source_file", ""),
                "score": round(score, 4),
            })

    return chunks


def get_index_info() -> dict:
    """Get information about the current index."""
    try:
        collection = get_collection()
        count = collection.count()

        all_metadata = collection.get(include=["metadatas"])
        chapters = list(set(m.get("chapter", "") for m in all_metadata["metadatas"]))

        return {
            "total_chunks": count,
            "chapters": sorted(chapters),
            "collection_name": COLLECTION_NAME,
        }
    except Exception as e:
        return {
            "total_chunks": 0,
            "chapters": [],
            "collection_name": COLLECTION_NAME,
            "error": str(e),
        }


if __name__ == "__main__":
    info = get_index_info()
    print(f"📊 Index Info: {info}")

    test_query = "What is Newton's second law?"
    print(f"\n🔍 Test query: '{test_query}'")
    results = retrieve(test_query, top_k=3)
    for i, r in enumerate(results):
        print(f"\n--- Result {i+1} (score: {r['score']}) ---")
        print(f"Chapter: {r['chapter']} | Section: {r['section']}")
        print(f"Text: {r['text'][:200]}...")
