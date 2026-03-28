'use client';

import { ChatMessage, submitFeedback } from '../lib/api';
import SourceCard from './SourceCard';
import { useState } from 'react';

interface MessageBubbleProps {
  message: ChatMessage;
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const [feedbackGiven, setFeedbackGiven] = useState<'up' | 'down' | null>(null);

  return (
    <div
      className="animate-in"
      style={{
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        padding: '4px 0',
      }}
    >
      <div
        style={{
          maxWidth: isUser ? '75%' : '88%',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
        }}
      >
        {/* Avatar + Name */}
        {!isUser && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '4px',
            }}
          >
            <div
              style={{
                width: '26px',
                height: '26px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '13px',
                boxShadow: '0 0 16px rgba(56, 189, 248, 0.2)',
              }}
            >
              ⚛
            </div>
            <span
              style={{
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                letterSpacing: '0.03em',
              }}
            >
              PHYSICS TUTOR
            </span>
            {message.responseTime && (
              <span
                style={{
                  fontSize: '10px',
                  color: 'var(--text-muted)',
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                {message.responseTime}ms
              </span>
            )}
          </div>
        )}

        {/* Message bubble */}
        <div
          style={{
            background: isUser
              ? 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))'
              : 'var(--bg-card)',
            border: isUser ? 'none' : '1px solid var(--border-subtle)',
            borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
            padding: '14px 18px',
            color: isUser ? '#fff' : 'var(--text-primary)',
            fontSize: '14px',
            lineHeight: '1.7',
            boxShadow: isUser
              ? '0 4px 20px rgba(56, 189, 248, 0.15)'
              : 'var(--shadow-card)',
          }}
        >
          {/* Render markdown-like formatting from the answer */}
          {message.content.split('\n').map((line, i) => {
            if (!line.trim()) return <br key={i} />;
            
            // Bold text
            const processedLine = line.replace(
              /\*\*(.*?)\*\*/g,
              '<strong>$1</strong>'
            );
            
            // Bullet points
            if (line.trim().startsWith('- ') || line.trim().startsWith('• ')) {
              return (
                <div
                  key={i}
                  style={{
                    paddingLeft: '16px',
                    position: 'relative',
                    marginBottom: '4px',
                  }}
                >
                  <span
                    style={{
                      position: 'absolute',
                      left: '4px',
                      color: 'var(--accent-primary)',
                    }}
                  >
                    •
                  </span>
                  <span
                    dangerouslySetInnerHTML={{
                      __html: processedLine.replace(/^[-•]\s*/, ''),
                    }}
                  />
                </div>
              );
            }

            // Numbered items
            const numMatch = line.trim().match(/^(\d+)\.\s/);
            if (numMatch) {
              return (
                <div
                  key={i}
                  style={{
                    paddingLeft: '20px',
                    position: 'relative',
                    marginBottom: '4px',
                  }}
                >
                  <span
                    style={{
                      position: 'absolute',
                      left: '0',
                      color: 'var(--accent-warm)',
                      fontWeight: 600,
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: '12px',
                    }}
                  >
                    {numMatch[1]}.
                  </span>
                  <span
                    dangerouslySetInnerHTML={{
                      __html: processedLine.replace(/^\d+\.\s/, ''),
                    }}
                  />
                </div>
              );
            }

            return (
              <p
                key={i}
                dangerouslySetInnerHTML={{ __html: processedLine }}
                style={{ margin: '2px 0' }}
              />
            );
          })}
        </div>

        {/* Sources */}
        {!isUser && message.sources && (
          <SourceCard sources={message.sources} />
        )}

        {/* Feedback buttons (bonus) */}
        {!isUser && (
          <div
            style={{
              display: 'flex',
              gap: '6px',
              marginTop: '4px',
              marginLeft: '4px',
            }}
          >
            {(['up', 'down'] as const).map((type) => (
              <button
                key={type}
                onClick={() => {
                  const newVal = feedbackGiven === type ? null : type;
                  setFeedbackGiven(newVal);
                  if (newVal && message.queryId) {
                    submitFeedback(
                      message.queryId,
                      message.content.substring(0, 100),
                      newVal === 'up' ? 'helpful' : 'not_helpful',
                    ).catch(() => {});
                  }
                }}
                style={{
                  background: feedbackGiven === type
                    ? 'var(--accent-glow)'
                    : 'transparent',
                  border: '1px solid',
                  borderColor: feedbackGiven === type
                    ? 'var(--border-active)'
                    : 'var(--border-subtle)',
                  borderRadius: '8px',
                  padding: '4px 8px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  color: feedbackGiven === type
                    ? 'var(--accent-primary)'
                    : 'var(--text-muted)',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                {type === 'up' ? '👍' : '👎'}
              </button>
            ))}
          </div>
        )}

        {/* Timestamp */}
        <span
          style={{
            fontSize: '10px',
            color: 'var(--text-muted)',
            textAlign: isUser ? 'right' : 'left',
            fontFamily: "'JetBrains Mono', monospace",
            padding: '0 4px',
          }}
        >
          {message.timestamp.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      </div>
    </div>
  );
}
