import { useNavigate } from 'react-router-dom';
import { PRIORITY_META, STATUS_META, timeAgo } from '../api';

export default function BugRow({ bug, index = 0 }) {
  const navigate = useNavigate();
  const p = PRIORITY_META[bug.priority] || PRIORITY_META.medium;
  const s = STATUS_META[bug.status] || STATUS_META.open;

  return (
    <button
      className="bug-row"
      onClick={() => navigate(`/bugs/${bug.bugId}`)}
      style={{ display: 'flex', alignItems: 'center', gap: 14, width: '100%', textAlign: 'left', padding: '14px 10px', border: 'none', borderBottom: '1px dashed var(--line-strong)', background: 'transparent', color: 'var(--ink)', cursor: 'pointer', transition: 'background 0.15s ease', position: 'relative' }}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-2)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
    >
      <span className="mono" style={{ color: 'var(--red)', fontWeight: 700, fontSize: 12, minWidth: 76 }}>{bug.bugId}</span>
      <span className={`pill pill-${bug.priority}`} style={{ minWidth: 72, justifyContent: 'center' }}>{p.label}</span>
      <span className={`pill pill-${bug.status}`} style={{ minWidth: 84, justifyContent: 'center' }}>{s.label}</span>
      <span style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
        <span style={{ display: 'block', fontWeight: 700, fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {bug.title}
        </span>
        <span className="mono" style={{ fontSize: 10, color: 'var(--ink-soft)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {bug.project} · {bug.reporter}
        </span>
      </span>
      {bug.occurrences > 1 && (
        <span className="mono" title={`${bug.occurrences} occurrences · ${bug.occurrenceReporters?.length || 0} reporters`} style={{ fontSize: 10, background: 'var(--bg-2)', border: '1px solid var(--line-strong)', padding: '3px 7px', color: 'var(--ink-soft)', whiteSpace: 'nowrap' }}>
          ×{bug.occurrences}
        </span>
      )}
      {bug.screenshotUrl && <span title="Has screenshot">📷</span>}
      <span className="mono" style={{ fontSize: 10, color: 'var(--ink-soft)', minWidth: 64, textAlign: 'right' }}>{timeAgo(bug.createdAt)}</span>
    </button>
  );
}
