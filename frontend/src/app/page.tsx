'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import MessageBubble from './components/MessageBubble';
import TypingIndicator from './components/TypingIndicator';
import InputBar from './components/InputBar';
import ChapterFilter from './components/ChapterFilter';
import { ChatMessage, queryAPI, getIndexInfo } from './lib/api';

const AVAILABLE_CHAPTERS = ['Kinematics', 'Laws Of Motion'];

const WELCOME_SUGGESTIONS = [
  "What is projectile motion?",
  "Explain Newton's three laws",
  "Derive v² = u² + 2as",
  "What is the difference between speed and velocity?",
  "Explain friction and its types",
  "What is centripetal acceleration?",
];

export default function Home() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [chapterFilter, setChapterFilter] = useState<string | null>(null);
  const [indexStatus, setIndexStatus] = useState<{ chunks: number; chapters: string[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Fetch index info on load
  useEffect(() => {
    getIndexInfo()
      .then((info) => {
        setIndexStatus({ chunks: info.total_chunks, chapters: info.chapters });
      })
      .catch(() => {
        // Backend not available yet, that's okay
        setIndexStatus(null);
      });
  }, []);

  const handleSend = useCallback(async (text: string) => {
    setError(null);
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Build conversation history for session memory
      const history = messages.slice(-6).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const response = await queryAPI(text, chapterFilter, history);

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        queryId: response.query_id,
        role: 'assistant',
        content: response.answer,
        sources: response.sources,
        responseTime: response.response_time_ms,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Something went wrong';
      setError(errorMessage);

      const errorAssistant: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `⚠️ ${errorMessage}\n\nPlease make sure the backend is running at the configured API URL.`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorAssistant]);
    } finally {
      setIsLoading(false);
    }
  }, [messages, chapterFilter]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        position: 'relative',
        zIndex: 1,
      }}
    >
      {/* === HEADER === */}
      <header
        style={{
          padding: '16px 24px',
          borderBottom: '1px solid var(--border-subtle)',
          background: 'rgba(10, 12, 16, 0.8)',
          backdropFilter: 'blur(16px)',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}
      >
        <div
          style={{
            maxWidth: 'var(--chat-max-width)',
            margin: '0 auto',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: '16px',
            flexWrap: 'wrap',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '18px',
                  boxShadow: '0 0 24px rgba(56, 189, 248, 0.2)',
                }}
              >
                ⚛
              </div>
              <div>
                <h1
                  style={{
                    fontSize: '18px',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    lineHeight: 1.2,
                    letterSpacing: '-0.01em',
                  }}
                >
                  JEE Physics Tutor
                </h1>
                <p
                  style={{
                    fontSize: '11px',
                    color: 'var(--text-muted)',
                    fontFamily: "'JetBrains Mono', monospace",
                    letterSpacing: '0.02em',
                  }}
                >
                  RAG-powered • Grounded answers from study material
                </p>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
            {indexStatus && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <div
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: '#22c55e',
                    boxShadow: '0 0 8px rgba(34, 197, 94, 0.4)',
                  }}
                />
                <span
                  style={{
                    fontSize: '10px',
                    color: 'var(--text-muted)',
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  {indexStatus.chunks} chunks indexed
                </span>
              </div>
            )}
            <ChapterFilter
              chapters={AVAILABLE_CHAPTERS}
              selected={chapterFilter}
              onSelect={setChapterFilter}
            />
          </div>
        </div>
      </header>

      {/* === CHAT AREA === */}
      <main
        style={{
          flex: 1,
          overflow: 'auto',
          padding: '20px 24px',
        }}
      >
        <div
          style={{
            maxWidth: 'var(--chat-max-width)',
            margin: '0 auto',
          }}
        >
          {/* Welcome state */}
          {messages.length === 0 && (
            <div
              className="animate-in"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '60vh',
                gap: '32px',
              }}
            >
              <div style={{ textAlign: 'center' }}>
                <div
                  style={{
                    width: '72px',
                    height: '72px',
                    borderRadius: '20px',
                    background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '36px',
                    margin: '0 auto 20px',
                    boxShadow: '0 0 48px rgba(56, 189, 248, 0.2)',
                  }}
                >
                  ⚛
                </div>
                <h2
                  style={{
                    fontSize: '28px',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    marginBottom: '8px',
                    letterSpacing: '-0.02em',
                  }}
                >
                  JEE Physics Tutor
                </h2>
                <p
                  style={{
                    fontSize: '14px',
                    color: 'var(--text-secondary)',
                    maxWidth: '400px',
                    lineHeight: '1.6',
                  }}
                >
                  Ask any question from{' '}
                  <span style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>
                    Kinematics
                  </span>{' '}
                  or{' '}
                  <span style={{ color: 'var(--accent-secondary)', fontWeight: 600 }}>
                    Laws of Motion
                  </span>
                  . Answers are grounded in study material with cited sources.
                </p>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '10px',
                  width: '100%',
                  maxWidth: '600px',
                }}
              >
                {WELCOME_SUGGESTIONS.map((suggestion, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(suggestion)}
                    className="animate-in"
                    style={{
                      padding: '12px 16px',
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      color: 'var(--text-secondary)',
                      fontSize: '13px',
                      fontFamily: "'Outfit', sans-serif",
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      animationDelay: `${idx * 80}ms`,
                      opacity: 0,
                      lineHeight: '1.4',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border-active)';
                      e.currentTarget.style.color = 'var(--text-primary)';
                      e.currentTarget.style.background = 'var(--bg-elevated)';
                      e.currentTarget.style.boxShadow = 'var(--shadow-glow)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border-subtle)';
                      e.currentTarget.style.color = 'var(--text-secondary)';
                      e.currentTarget.style.background = 'var(--bg-card)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <span style={{ color: 'var(--accent-primary)', marginRight: '6px' }}>→</span>
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Messages */}
          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}

          {/* Typing indicator */}
          <TypingIndicator visible={isLoading} />

          <div ref={chatEndRef} />
        </div>
      </main>

      {/* === INPUT BAR === */}
      <InputBar onSend={handleSend} disabled={isLoading} />
    </div>
  );
}
