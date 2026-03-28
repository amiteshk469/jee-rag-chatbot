'use client';

interface TypingIndicatorProps {
  visible: boolean;
}

export default function TypingIndicator({ visible }: TypingIndicatorProps) {
  if (!visible) return null;

  return (
    <div
      className="animate-in"
      style={{
        display: 'flex',
        justifyContent: 'flex-start',
        padding: '4px 0',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
        }}
      >
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
              animation: 'float 2s ease-in-out infinite',
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
        </div>

        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '18px 18px 18px 4px',
            padding: '16px 22px',
            display: 'flex',
            gap: '6px',
            alignItems: 'center',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: 'var(--accent-primary)',
                animation: `typing-dot 1.4s ease-in-out ${i * 0.2}s infinite`,
              }}
            />
          ))}
          <span
            style={{
              marginLeft: '8px',
              fontSize: '12px',
              color: 'var(--text-muted)',
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            Searching chapters...
          </span>
        </div>
      </div>
    </div>
  );
}
