"""
Ingestion script: reads chapter files (PDF or Markdown), cleans content,
splits into overlapping chunks with metadata, and saves to chunks.json.
"""

import json
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config import CHAPTERS_DIR, CHUNKS_FILE, CHUNK_SIZE, CHUNK_OVERLAP

# Chapter name mapping for PDF files
CHAPTER_NAMES = {
    "keph102": "Kinematics",
    "keph104": "Laws Of Motion",
}


def clean_text(text: str) -> str:
    """Remove excessive whitespace and normalize text."""
    text = re.sub(r'\n{3,}', '\n\n', text)
    text = re.sub(r' {2,}', ' ', text)
    return text.strip()


def read_pdf(filepath: str) -> str:
    """Extract text from a PDF file using PyMuPDF."""
    import fitz  # PyMuPDF

    doc = fitz.open(filepath)
    text_parts = []
    for page in doc:
        text_parts.append(page.get_text())
    doc.close()
    return "\n\n".join(text_parts)


def read_markdown(filepath: str) -> str:
    """Read a markdown file."""
    with open(filepath, 'r', encoding='utf-8') as f:
        return f.read()


def extract_sections(text: str) -> list[dict]:
    """Split text into sections based on ## headings or page breaks."""
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

    # If no sections were found (e.g., PDFs without ## headings),
    # split into fixed-size sections based on paragraphs
    if len(sections) == 1 and len(sections[0]["content"]) > 2000:
        full_text = sections[0]["content"]
        paragraphs = full_text.split('\n\n')
        sections = []
        current_section = []
        current_len = 0
        section_num = 1

        for para in paragraphs:
            para = para.strip()
            if not para:
                continue
            current_section.append(para)
            current_len += len(para)

            if current_len > 1500:
                sections.append({
                    "title": f"Section {section_num}",
                    "content": '\n\n'.join(current_section)
                })
                current_section = []
                current_len = 0
                section_num += 1

        if current_section:
            sections.append({
                "title": f"Section {section_num}",
                "content": '\n\n'.join(current_section)
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


def get_chapter_name(filename: str) -> str:
    """Derive a human-readable chapter name from a filename."""
    basename = os.path.splitext(filename)[0]

    # Check the mapping first
    if basename in CHAPTER_NAMES:
        return CHAPTER_NAMES[basename]

    # Fallback: clean up the filename
    return basename.replace('_', ' ').replace('-', ' ').title()


def ingest_chapters(chapters_dir: str = CHAPTERS_DIR) -> list[dict]:
    """Read all chapter files (PDF + Markdown), chunk them, and return structured chunks."""
    all_chunks = []
    chunk_index = 0
    supported_extensions = ('.md', '.pdf')

    for filename in sorted(os.listdir(chapters_dir)):
        if not filename.lower().endswith(supported_extensions):
            continue

        filepath = os.path.join(chapters_dir, filename)
        chapter_name = get_chapter_name(filename)

        print(f"📖 Processing: {chapter_name} ({filename})")

        # Read file based on extension
        if filename.lower().endswith('.pdf'):
            raw_text = read_pdf(filepath)
        else:
            raw_text = read_markdown(filepath)

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
    print("\n📊 Ingestion Stats:")
    print(f"   Chapters: {len(chapters)}")
    print(f"   Total chunks: {len(chunks)}")
    for ch in chapters:
        ch_chunks = [c for c in chunks if c["chapter"] == ch]
        print(f"   - {ch}: {len(ch_chunks)} chunks")
    if chunks:
        avg_len = sum(c["char_count"] for c in chunks) / len(chunks)
        print(f"   Avg chunk size: {avg_len:.0f} chars")
        print("\n📝 Sample chunk:")
        print(f"   Chapter: {chunks[0]['chapter']}")
        print(f"   Section: {chunks[0]['section']}")
        print(f"   Text: {chunks[0]['text'][:200]}...")
