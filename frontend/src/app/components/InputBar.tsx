'use client';

import { useState, useRef, KeyboardEvent } from 'react';

interface InputBarProps {
  onSend: (message: string) => void;
  disabled: boolean;
}

export default function InputBar({ onSend, disabled }: InputBarProps) {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = '48px';
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = () => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = '48px';
      el.style.height = Math.min(el.scrollHeight, 160) + 'px';
    }
  };

  return (
    <div
      style={{
        padding: '16px 20px 20px',
        borderTop: '1px solid var(--border-subtle)',
        background: 'var(--bg-secondary)',
      }}
    >
      <div
        style={{
          maxWidth: 'var(--chat-max-width)',
          margin: '0 auto',
          display: 'flex',
          gap: '12px',
          alignItems: 'flex-end',
        }}
      >
        <div
          style={{
            flex: 1,
            position: 'relative',
          }}
        >
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onInput={handleInput}
            placeholder="Ask a JEE Physics question..."
            disabled={disabled}
            style={{
              width: '100%',
              height: '48px',
              padding: '13px 18px',
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '14px',
              color: 'var(--text-primary)',
              fontSize: '14px',
              fontFamily: "'Outfit', sans-serif",
              lineHeight: '1.5',
              resize: 'none',
              outline: 'none',
              transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
              ...(disabled ? { opacity: 0.5, cursor: 'not-allowed' } : {}),
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-active)';
              e.currentTarget.style.boxShadow = 'var(--shadow-glow)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-subtle)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          />
        </div>

        <button
          onClick={handleSend}
          disabled={disabled || !input.trim()}
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '14px',
            border: 'none',
            background:
              input.trim() && !disabled
                ? 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))'
                : 'var(--bg-tertiary)',
            color:
              input.trim() && !disabled
                ? '#fff'
                : 'var(--text-muted)',
            cursor: input.trim() && !disabled ? 'pointer' : 'not-allowed',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
            boxShadow:
              input.trim() && !disabled
                ? '0 4px 20px rgba(56, 189, 248, 0.2)'
                : 'none',
            flexShrink: 0,
          }}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M22 2L11 13" />
            <path d="M22 2L15 22L11 13L2 9L22 2Z" />
          </svg>
        </button>
      </div>

      <p
        style={{
          textAlign: 'center',
          fontSize: '10px',
          color: 'var(--text-muted)',
          marginTop: '10px',
          fontFamily: "'JetBrains Mono', monospace",
          letterSpacing: '0.02em',
        }}
      >
        Powered by RAG • Answers grounded in study material only
      </p>
    </div>
  );
}
