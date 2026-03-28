"""
Ingestion script: reads markdown chapter files, cleans content,
splits into overlapping chunks with metadata, and saves to chunks.json.
"""

import json
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config import CHAPTERS_DIR, CHUNKS_FILE, CHUNK_SIZE, CHUNK_OVERLAP


def clean_text(text: str) -> str:
    """Remove excessive whitespace and normalize text."""
    text = re.sub(r'\n{3,}', '\n\n', text)
    text = re.sub(r' {2,}', ' ', text)
    return text.strip()


def extract_sections(text: str) -> list[dict]:
    """Split markdown into sections based on ## headings."""
    sections = []
    current_title = "Introduction"
    current_content = []

    for line in text.split('\n'):
        if line.startswith('## '):
            if current_content:
                sections.append({
                    "title": current_title,
                    "content": '\n'.join(current_content).strip()
                })
            current_title = line.lstrip('#').strip()
            current_content = []
        else:
            current_content.append(line)

    if current_content:
        sections.append({
            "title": current_title,
            "content": '\n'.join(current_content).strip()
        })

    return sections


def chunk_text(text: str, chunk_size: int = CHUNK_SIZE, overlap: int = CHUNK_OVERLAP) -> list[str]:
    """Split text into overlapping chunks at sentence boundaries."""
    sentences = re.split(r'(?<=[.!?])\s+|\n\n', text)
    chunks = []
    current_chunk = ""

    for sentence in sentences:
        sentence = sentence.strip()
        if not sentence:
            continue

        if len(current_chunk) + len(sentence) + 1 > chunk_size and current_chunk:
            chunks.append(current_chunk.strip())
            # Keep overlap from end of current chunk
            overlap_text = current_chunk[-overlap:] if len(current_chunk) > overlap else current_chunk
            current_chunk = overlap_text + " " + sentence
        else:
            current_chunk = (current_chunk + " " + sentence).strip()

    if current_chunk.strip():
        chunks.append(current_chunk.strip())

    return chunks


def ingest_chapters(chapters_dir: str = CHAPTERS_DIR) -> list[dict]:
    """Read all markdown files, chunk them, and return structured chunks."""
    all_chunks = []
    chunk_index = 0

    for filename in sorted(os.listdir(chapters_dir)):
        if not filename.endswith('.md'):
            continue

        filepath = os.path.join(chapters_dir, filename)
        chapter_name = filename.replace('.md', '').replace('_', ' ').title()

        print(f"📖 Processing: {chapter_name} ({filename})")

        with open(filepath, 'r', encoding='utf-8') as f:
            raw_text = f.read()

        cleaned = clean_text(raw_text)
        sections = extract_sections(cleaned)

        for section in sections:
            chunks = chunk_text(section["content"])
            for chunk_text_content in chunks:
                if len(chunk_text_content.strip()) < 50:
                    continue  # Skip tiny chunks

                all_chunks.append({
                    "chunk_id": chunk_index,
                    "chapter": chapter_name,
                    "section": section["title"],
                    "source_file": filename,
                    "text": chunk_text_content,
                    "char_count": len(chunk_text_content),
                })
                chunk_index += 1

    return all_chunks


def save_chunks(chunks: list[dict], output_path: str = CHUNKS_FILE):
    """Save chunks to JSON file."""
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(chunks, f, indent=2, ensure_ascii=False)
    print(f"💾 Saved {len(chunks)} chunks to {output_path}")


if __name__ == "__main__":
    chunks = ingest_chapters()
    save_chunks(chunks)

    # Print stats
    chapters = set(c["chapter"] for c in chunks)
    print(f"\n📊 Ingestion Stats:")
    print(f"   Chapters: {len(chapters)}")
    print(f"   Total chunks: {len(chunks)}")
    for ch in chapters:
        ch_chunks = [c for c in chunks if c["chapter"] == ch]
        print(f"   - {ch}: {len(ch_chunks)} chunks")
    if chunks:
        avg_len = sum(c["char_count"] for c in chunks) / len(chunks)
        print(f"   Avg chunk size: {avg_len:.0f} chars")
        print(f"\n📝 Sample chunk:")
        print(f"   Chapter: {chunks[0]['chapter']}")
        print(f"   Section: {chunks[0]['section']}")
        print(f"   Text: {chunks[0]['text'][:200]}...")
