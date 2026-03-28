'use client';

import { useState } from 'react';
import { SourceChunk } from '../lib/api';

interface SourceCardProps {
  sources: SourceChunk[];
}

export default function SourceCard({ sources }: SourceCardProps) {
  const [expanded, setExpanded] = useState(false);

  if (!sources || sources.length === 0) return null;

  return (
    <div className="sources-container" style={{ marginTop: '12px' }}>
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'none',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-sm)',
          padding: '8px 14px',
          color: 'var(--text-secondary)',
          fontSize: '12px',
          fontFamily: "'JetBrains Mono', monospace",
          fontWeight: 500,
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          letterSpacing: '0.02em',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'var(--border-active)';
          e.currentTarget.style.color = 'var(--text-accent)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'var(--border-subtle)';
          e.currentTarget.style.color = 'var(--text-secondary)';
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
          <path d="M13 2v7h7" />
        </svg>
        {sources.length} source{sources.length > 1 ? 's' : ''} referenced
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          style={{
            transform: expanded ? 'rotate(180deg)' : 'rotate(0)',
            transition: 'transform 0.2s ease',
          }}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {expanded && (
        <div
          className="animate-in"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            marginTop: '10px',
          }}
        >
          {sources.map((source, idx) => (
            <div
              key={idx}
              className="animate-slide"
              style={{
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                padding: '12px 16px',
                animationDelay: `${idx * 60}ms`,
                opacity: 0,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '8px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span
                    style={{
                      background: 'var(--accent-glow)',
                      color: 'var(--accent-primary)',
                      padding: '2px 8px',
                      borderRadius: '6px',
                      fontSize: '10px',
                      fontFamily: "'JetBrains Mono', monospace",
                      fontWeight: 600,
                      letterSpacing: '0.05em',
                      textTransform: 'uppercase',
                    }}
                  >
                    {source.chapter}
                  </span>
                  <span
                    style={{
                      color: 'var(--text-muted)',
                      fontSize: '11px',
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  >
                    {source.section}
                  </span>
                </div>
                <span
                  style={{
                    color: 'var(--accent-warm)',
                    fontSize: '10px',
                    fontFamily: "'JetBrains Mono', monospace",
                    fontWeight: 600,
                  }}
                >
                  {(source.score * 100).toFixed(0)}% match
                </span>
              </div>
              <p
                style={{
                  color: 'var(--text-secondary)',
                  fontSize: '12px',
                  lineHeight: '1.6',
                  margin: 0,
                }}
              >
                {source.text.length > 300
                  ? source.text.substring(0, 300) + '...'
                  : source.text}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
