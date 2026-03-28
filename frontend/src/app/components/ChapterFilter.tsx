'use client';

interface ChapterFilterProps {
  chapters: string[];
  selected: string | null;
  onSelect: (chapter: string | null) => void;
}

export default function ChapterFilter({ chapters, selected, onSelect }: ChapterFilterProps) {
  if (!chapters || chapters.length === 0) return null;

  return (
    <div
      style={{
        display: 'flex',
        gap: '8px',
        alignItems: 'center',
        flexWrap: 'wrap',
      }}
    >
      <span
        style={{
          fontSize: '10px',
          color: 'var(--text-muted)',
          fontFamily: "'JetBrains Mono', monospace",
          fontWeight: 600,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
        }}
      >
        Filter:
      </span>

      <button
        onClick={() => onSelect(null)}
        style={{
          padding: '5px 12px',
          borderRadius: '8px',
          border: '1px solid',
          borderColor: !selected ? 'var(--border-active)' : 'var(--border-subtle)',
          background: !selected ? 'var(--accent-glow)' : 'transparent',
          color: !selected ? 'var(--accent-primary)' : 'var(--text-secondary)',
          fontSize: '11px',
          fontWeight: 500,
          fontFamily: "'Outfit', sans-serif",
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        }}
      >
        All Chapters
      </button>

      {chapters.map((chapter) => (
        <button
          key={chapter}
          onClick={() => onSelect(selected === chapter ? null : chapter)}
          style={{
            padding: '5px 12px',
            borderRadius: '8px',
            border: '1px solid',
            borderColor: selected === chapter ? 'var(--border-active)' : 'var(--border-subtle)',
            background: selected === chapter ? 'var(--accent-glow)' : 'transparent',
            color: selected === chapter ? 'var(--accent-primary)' : 'var(--text-secondary)',
            fontSize: '11px',
            fontWeight: 500,
            fontFamily: "'Outfit', sans-serif",
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          {chapter}
        </button>
      ))}
    </div>
  );
}
