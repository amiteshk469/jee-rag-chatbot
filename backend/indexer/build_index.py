"""
Build and persist a ChromaDB vector index from ingested chunks.
Uses Google Gemini text-embedding-004 for embeddings.
"""

import json
import os
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config import CHUNKS_FILE, CHROMA_PATH, GEMINI_API_KEY, EMBEDDING_MODEL

import chromadb
from google import genai

COLLECTION_NAME = "jee_physics"

# Initialize Gemini client
client = genai.Client(api_key=GEMINI_API_KEY)


def get_chroma_client():
    """Get persistent ChromaDB client."""
    return chromadb.PersistentClient(path=CHROMA_PATH)


def embed_texts(texts: list[str], model: str = EMBEDDING_MODEL) -> list[list[float]]:
    """Get embeddings from Gemini in batches."""
    all_embeddings = []
    batch_size = 50

    for i in range(0, len(texts), batch_size):
        batch = texts[i:i + batch_size]
        result = client.models.embed_content(
            model=model,
            contents=batch,
        )
        for emb in result.embeddings:
            all_embeddings.append(emb.values)
        print(f"   Embedded batch {i // batch_size + 1}/{(len(texts) - 1) // batch_size + 1}")

    return all_embeddings


def build_index(force_rebuild: bool = False):
    """Build ChromaDB index from chunks.json."""
    chroma_client = get_chroma_client()

    # Check if collection already exists
    existing_collections = [c.name for c in chroma_client.list_collections()]
    if COLLECTION_NAME in existing_collections and not force_rebuild:
        collection = chroma_client.get_collection(COLLECTION_NAME)
        count = collection.count()
        print(f"✅ Index already exists with {count} documents. Skipping rebuild.")
        print(f"   Use --force to rebuild.")
        return collection

    # Load chunks
    if not os.path.exists(CHUNKS_FILE):
        print(f"❌ Chunks file not found: {CHUNKS_FILE}")
        print(f"   Run ingestion first: python ingestion/ingest.py")
        sys.exit(1)

    with open(CHUNKS_FILE, 'r', encoding='utf-8') as f:
        chunks = json.load(f)

    print(f"📦 Loading {len(chunks)} chunks...")

    # Delete existing collection if force rebuild
    if COLLECTION_NAME in existing_collections:
        chroma_client.delete_collection(COLLECTION_NAME)
        print("🗑️  Deleted existing collection.")

    # Create new collection
    collection = chroma_client.create_collection(
        name=COLLECTION_NAME,
        metadata={"hnsw:space": "cosine"}
    )

    # Generate embeddings
    texts = [chunk["text"] for chunk in chunks]

    print(f"🔄 Generating embeddings with Gemini {EMBEDDING_MODEL}...")
    start_time = time.time()
    embeddings = embed_texts(texts)
    elapsed = time.time() - start_time
    print(f"   Done in {elapsed:.1f}s")

    # Add to ChromaDB
    print(f"📥 Adding to ChromaDB...")
    ids = [str(chunk["chunk_id"]) for chunk in chunks]
    metadatas = [
        {
            "chapter": chunk["chapter"],
            "section": chunk["section"],
            "source_file": chunk["source_file"],
            "chunk_id": chunk["chunk_id"],
        }
        for chunk in chunks
    ]
    documents = texts

    batch_size = 100
    for i in range(0, len(ids), batch_size):
        end = min(i + batch_size, len(ids))
        collection.add(
            ids=ids[i:end],
            embeddings=embeddings[i:end],
            metadatas=metadatas[i:end],
            documents=documents[i:end],
        )

    print(f"✅ Index built: {collection.count()} documents in {CHROMA_PATH}")
    return collection


if __name__ == "__main__":
    force = "--force" in sys.argv
    build_index(force_rebuild=force)
