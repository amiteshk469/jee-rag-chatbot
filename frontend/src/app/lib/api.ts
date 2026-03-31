const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
console.log('[DEBUG] API_BASE =', API_BASE);

export interface SourceChunk {
  text: string;
  chapter: string;
  section: string;
  source_file: string;
  score: number;
}

export interface QueryResponse {
  query_id: string;
  answer: string;
  sources: SourceChunk[];
  response_time_ms: number;
}

export interface HealthResponse {
  status: string;
  indexed_chunks: number;
}

export interface IndexInfoResponse {
  chapters: string[];
  total_chunks: number;
  collection_name: string;
}

export interface ChatMessage {
  id: string;
  queryId?: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: SourceChunk[];
  responseTime?: number;
  timestamp: Date;
}

export async function queryAPI(
  question: string,
  chapterFilter?: string | null,
  conversationHistory?: Array<{ role: string; content: string }>,
): Promise<QueryResponse> {
  const res = await fetch(`${API_BASE}/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      question,
      chapter_filter: chapterFilter || null,
      conversation_history: conversationHistory || null,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Network error' }));
    throw new Error(err.detail || `API error: ${res.status}`);
  }

  return res.json();
}

export async function getHealth(): Promise<HealthResponse> {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error('Backend unavailable');
  return res.json();
}

export async function getIndexInfo(): Promise<IndexInfoResponse> {
  const res = await fetch(`${API_BASE}/index/info`);
  if (!res.ok) throw new Error('Cannot fetch index info');
  return res.json();
}

export async function submitFeedback(
  queryId: string,
  question: string,
  feedback: 'helpful' | 'not_helpful',
): Promise<void> {
  await fetch(`${API_BASE}/feedback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query_id: queryId, question, feedback }),
  });
}

export async function triggerReindex(): Promise<{ status: string; message: string }> {
  const res = await fetch(`${API_BASE}/admin/reindex`, { method: 'POST' });
  if (!res.ok) throw new Error('Re-index failed');
  return res.json();
}

export async function getAnalytics(): Promise<Record<string, unknown>> {
  const res = await fetch(`${API_BASE}/analytics`);
  if (!res.ok) throw new Error('Cannot fetch analytics');
  return res.json();
}
