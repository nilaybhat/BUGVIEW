import { useCallback, useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { Link, useParams } from 'react-router-dom';
import { api, PRIORITY_META, STATUS_META, timeAgo } from '../api';
import ScreenshotModal from '../components/ScreenshotModal';

const TABS = [
  { key: 'console', label: 'CONSOLE' },
  { key: 'network', label: 'NETWORK' },
  { key: 'repro', label: 'REPRODUCTION' },
  { key: 'health', label: 'HEALTH' },
  { key: 'element', label: 'ELEMENT' },
  { key: 'history', label: 'HISTORY' },
];

export default function BugDetail() {
  const { id } = useParams();
  const root = useRef(null);
  const [bug, setBug] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [tab, setTab] = useState('console');
  const [shot, setShot] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    api
      .getBug(id)
      .then((b) => {
        setBug(b);
        setNotFound(false);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => load(), [load]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.bd-rise', { y: 30, opacity: 0, duration: 0.7, ease: 'power3.out', stagger: 0.08 });
    }, root);
    return () => ctx.revert();
  }, [bug]);

  if (loading) {
    return (
      <div className="wrap" style={{ paddingTop: 120, fontFamily: 'var(--font-mono)', color: 'var(--ink-soft)' }}>
        TUNING CHANNEL…
      </div>
    );
  }

  if (notFound || !bug) {
    return (
      <div className="wrap" style={{ paddingTop: 120 }}>
        <div className="big-num" style={{ fontSize: 60 }}>404</div>
        <div className="mono" style={{ color: 'var(--ink-soft)', margin: '12px 0 24px' }}>SIGNAL LOST — this bug does not exist.</div>
        <Link to="/bugs" className="btn">← Back to queue</Link>
      </div>
    );
  }

  const p = PRIORITY_META[bug.priority] || PRIORITY_META.medium;

  return (
    <div ref={root} className="wrap" style={{ paddingTop: 36, paddingBottom: 90 }}>
      <Link to="/bugs" className="btn btn-sm btn-ghost bd-rise" style={{ marginBottom: 20 }}>
        ← Back to queue
      </Link>

      <div className="bd-rise" style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 8 }}>
        <div>
          <div className="sec-label">{bug.bugId} · {bug.project}</div>
          <h1 style={{ fontSize: 'clamp(24px, 3.5vw, 40px)', lineHeight: 1.08, maxWidth: 760 }}>{bug.title}</h1>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <button className="btn btn-sm" onClick={() => setShot(true)} disabled={!bug.screenshotUrl}>
            📷 Screenshot
          </button>
          <GitHubButton bug={bug} onDone={load} />
        </div>
      </div>

      <div className="bd-rise mono" style={{ fontSize: 11, color: 'var(--ink-soft)', marginBottom: 22 }}>
        reported by <b style={{ color: 'var(--ink)' }}>{bug.reporter}</b> · {timeAgo(bug.createdAt)}
        {bug.assignee ? ` · assigned to ${bug.assignee}` : ' · unassigned'}
      </div>

      {bug.occurrences > 1 && (
        <div className="bd-rise panel" style={{ padding: '14px 18px', borderLeft: '8px solid var(--amber)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <span className="rec" style={{ color: 'var(--amber)' }}><span className="rec-dot" style={{ background: 'var(--amber)' }} />DUPLICATE GROUP</span>
          <span className="mono" style={{ fontSize: 12 }}>
            <b style={{ fontSize: 18 }}>{bug.occurrences}</b> occurrences · {bug.occurrenceReporters?.length || 1} reporters · {bug.browsersSeen?.join(' / ')}
          </span>
          {bug.duplicateOf && <span className="mono" style={{ fontSize: 11, color: 'var(--ink-soft)' }}>grouped with {bug.duplicateOf}</span>}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20 }}>
        <div>
          {bug.analysis && bug.analysis.issue && <AnalysisPanel bug={bug} className="bd-rise" />}

          {bug.description && (
            <div className="panel bd-rise" style={{ marginTop: 20 }}>
              <div className="panel-head"><span className="panel-title">REPORT</span></div>
              <div className="panel-body" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6, fontSize: 13 }}>{bug.description}</div>
            </div>
          )}

          {bug.element && (
            <div className="panel bd-rise" style={{ marginTop: 20 }}>
              <div className="panel-head"><span className="panel-title">ATTACHED ELEMENT</span></div>
              <div className="panel-body mono" style={{ fontSize: 12, lineHeight: 1.9 }}>
                <div><b style={{ color: 'var(--red)' }}>&lt;{bug.element.tagName}&gt;</b> <code>{bug.element.selector}</code></div>
                <div style={{ color: 'var(--ink-soft)' }}>classes: {bug.element.classes?.join(' ') || '—'}</div>
                <div style={{ color: 'var(--ink-soft)' }}>dimensions: {bug.element.dimensions?.width} × {bug.element.dimensions?.height} px · position: x:{bug.element.position?.x} y:{bug.element.position?.y}</div>
                <div style={{ color: 'var(--ink-soft)' }}>visibility: {bug.element.visibility} · events: {bug.element.events?.join(', ') || '—'}</div>
                {bug.element.text && <div style={{ color: 'var(--ink-soft)' }}>text: “{bug.element.text}”</div>}
              </div>
            </div>
          )}
        </div>

        <div>
          <ControlsPanel bug={bug} onDone={load} className="bd-rise" />
          <CommentPanel bug={bug} onDone={load} className="bd-rise" />
        </div>
      </div>

      <div className="bd-rise panel" style={{ marginTop: 24 }}>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', padding: '10px 12px', borderBottom: '2px solid var(--ink)', background: 'var(--bg-2)' }}>
          {TABS.map((t) => (
            <button key={t.key} className={`chip ${tab === t.key ? 'is-on' : ''}`} onClick={() => setTab(t.key)}>
              {t.label}
            </button>
          ))}
        </div>
        <div style={{ padding: 20 }}>
          {tab === 'console' && <ConsoleTab bug={bug} />}
          {tab === 'network' && <NetworkTab bug={bug} />}
          {tab === 'repro' && <ReproTab bug={bug} />}
          {tab === 'health' && <HealthTab bug={bug} />}
          {tab === 'element' && <ElementTab bug={bug} />}
          {tab === 'history' && <HistoryTab bug={bug} />}
        </div>
      </div>

      {shot && <ScreenshotModal bug={bug} onClose={() => setShot(false)} />}
    </div>
  );
}

/* ------------------------------------------------------------------ */

function ConfidenceMeter({ value }) {
  const pct = Math.round((value || 0) * 100);
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-soft)', marginBottom: 4 }}>
        <span>CONFIDENCE</span>
        <span>{pct}%</span>
      </div>
      <div style={{ height: 10, background: 'var(--bg-2)', border: '1px solid var(--line-strong)' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: pct >= 80 ? 'var(--teal)' : pct >= 60 ? 'var(--amber)' : 'var(--red)', transition: 'width 0.8s ease' }} />
      </div>
    </div>
  );
}

function AnalysisPanel({ bug }) {
  const [expand, setExpand] = useState(false);
  const a = bug.analysis;
  return (
    <div className="panel" style={{ borderTop: '6px solid var(--red)' }}>
      <div className="panel-head">
        <span className="panel-title">AI ROOT-CAUSE ANALYSIS</span>
        <span className="rec"><span className="rec-dot" />ANALYZED</span>
      </div>
      <div className="panel-body">
        <div className="mono" style={{ fontSize: 11, color: 'var(--ink-soft)', letterSpacing: '0.16em' }}>DETECTED ISSUE</div>
        <div style={{ fontSize: 20, fontWeight: 700, margin: '6px 0 14px' }}>{a.issue}</div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          {a.endpoint && (
            <div>
              <div className="mono" style={{ fontSize: 10, color: 'var(--ink-soft)' }}>ENDPOINT</div>
              <div className="mono" style={{ fontSize: 13 }}>{a.endpoint} {a.status ? <span className={`pill pill-${a.status >= 500 ? 'critical' : a.status >= 400 ? 'high' : 'medium'}`} style={{ marginLeft: 8 }}>{a.status}</span> : null}</div>
            </div>
          )}
          {a.console && (
            <div>
              <div className="mono" style={{ fontSize: 10, color: 'var(--ink-soft)' }}>CONSOLE</div>
              <div className="mono" style={{ fontSize: 12, color: 'var(--red)', wordBreak: 'break-word' }}>{a.console}</div>
            </div>
          )}
          {a.likelyLocation && (
            <div>
              <div className="mono" style={{ fontSize: 10, color: 'var(--ink-soft)' }}>LIKELY LOCATION</div>
              <div className="mono" style={{ fontSize: 13 }}>
                {a.likelyLocation.fileName}
                <span style={{ color: 'var(--red)' }}> → line {a.likelyLocation.line}</span>
              </div>
            </div>
          )}
          <div>
            <div className="mono" style={{ fontSize: 10, color: 'var(--ink-soft)' }}>ANALYSIS</div>
            <div style={{ fontSize: 12, lineHeight: 1.5 }}>{a.analysis}</div>
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <ConfidenceMeter value={a.confidence} />
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button className="btn btn-sm" onClick={() => setExpand(!expand)}>
            {expand ? 'Hide suggestions ▴' : 'Suggest Fix ▾'}
          </button>
        </div>

        {expand && (
          <ul style={{ margin: '16px 0 0 20px', display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
            {a.suggestions.map((s, i) => (
              <li key={i} style={{ lineHeight: 1.45 }}>{s}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function ControlsPanel({ bug, onDone }) {
  const [draft, setDraft] = useState({
    status: bug.status,
    priority: bug.priority,
    assignee: bug.assignee || '',
  });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => setDraft({ status: bug.status, priority: bug.priority, assignee: bug.assignee || '' }), [bug.bugId]);

  async function save() {
    setBusy(true);
    setMsg('');
    try {
      await api.updateBug(bug.bugId, draft);
      setMsg('Saved ✓');
      onDone();
    } catch (err) {
      setMsg(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="panel" style={{ marginBottom: 20 }}>
      <div className="panel-head"><span className="panel-title">CONTROLS</span></div>
      <div className="panel-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label className="label">STATUS</label>
          <select className="select" style={{ width: '100%' }} value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value })}>
            {Object.entries(STATUS_META).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">PRIORITY</label>
          <select className="select" style={{ width: '100%' }} value={draft.priority} onChange={(e) => setDraft({ ...draft, priority: e.target.value })}>
            {Object.entries(PRIORITY_META).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">ASSIGNEE</label>
          <input className="input" value={draft.assignee} onChange={(e) => setDraft({ ...draft, assignee: e.target.value })} placeholder="dev name" />
        </div>
        <button className="btn btn-sm btn-primary" onClick={save} disabled={busy}>
          {busy ? 'Saving…' : 'Apply changes'}
        </button>
        {msg && <div className="mono" style={{ fontSize: 11, color: 'var(--teal)' }}>{msg}</div>}
      </div>
    </div>
  );
}

function GitHubButton({ bug, onDone }) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  if (bug.github && bug.github.issueUrl) {
    return (
      <a className="btn btn-sm" href={bug.github.issueUrl} target="_blank" rel="noreferrer" style={{ background: 'var(--ink)', color: 'var(--bg)' }}>
        ⭐ GitHub #{bug.github.issueNumber}
      </a>
    );
  }

  async function go() {
    setBusy(true);
    setMsg('');
    try {
      const res = await api.exportGithub(bug.bugId);
      setMsg(res.issueNumber ? `Created #${res.issueNumber}` : 'Done');
      onDone();
    } catch (err) {
      setMsg(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <button className="btn btn-sm" onClick={go} disabled={busy} style={{ background: '#17150f', color: '#f3f0e8' }}>
        {busy ? '…' : '⭐ GitHub'}
      </button>
      {msg && <span className="mono" style={{ fontSize: 10, color: 'var(--amber)', maxWidth: 160 }}>{msg}</span>}
    </div>
  );
}

/* ------------------------------------------------------------------ */

function ConsoleTab({ bug }) {
  const entries = [
    ...(bug.diagnostics?.errors || []).map((e) => ({ ...e, kind: 'ERR' })),
    ...(bug.diagnostics?.warnings || []).map((e) => ({ ...e, kind: 'WRN' })),
    ...(bug.diagnostics?.mixed || []).map((e) => ({ ...e, kind: 'MIX' })),
  ];
  return (
    <pre className="code">
      {entries.length === 0 && '— no console signals captured —'}
      {entries.map((e, i) => (
        <div key={i} style={{ marginBottom: 10 }}>
          <span className="tok" style={{ color: e.kind === 'ERR' ? 'var(--red)' : e.kind === 'WRN' ? 'var(--amber)' : 'var(--teal)' }}>
            [{e.kind}]
          </span>{' '}
          {e.message}
          {e.source && (
            <div style={{ color: 'var(--ink-soft)', fontSize: 11 }}>
              {e.source}{e.lineno ? `:${e.lineno}` : ''}
            </div>
          )}
          {e.stack && <div style={{ whiteSpace: 'pre-wrap', color: 'var(--ink-soft)', fontSize: 11 }}>{e.stack}</div>}
        </div>
      ))}
    </pre>
  );
}

function NetworkTab({ bug }) {
  const entries = bug.diagnostics?.network || [];
  return (
    <div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--ink)', textAlign: 'left', color: 'var(--ink-soft)', fontSize: 10, letterSpacing: '0.1em' }}>
            <th style={{ padding: '6px 8px' }}>METHOD</th>
            <th style={{ padding: '6px 8px' }}>ENDPOINT</th>
            <th style={{ padding: '6px 8px' }}>STATUS</th>
            <th style={{ padding: '6px 8px' }}>TIME</th>
            <th style={{ padding: '6px 8px' }}>INITIATOR</th>
          </tr>
        </thead>
        <tbody>
          {entries.length === 0 && (
            <tr><td colSpan={5} style={{ padding: '14px 8px', color: 'var(--ink-soft)' }}>— no failed requests captured —</td></tr>
          )}
          {entries.map((e, i) => (
            <tr key={i} style={{ borderBottom: '1px dashed var(--line-strong)' }}>
              <td style={{ padding: '7px 8px', fontWeight: 700 }}>{e.method}</td>
              <td style={{ padding: '7px 8px', wordBreak: 'break-all' }}>{e.url}</td>
              <td style={{ padding: '7px 8px' }}>
                <span className={`pill pill-${e.status >= 500 ? 'critical' : e.status >= 400 ? 'high' : e.status === 0 ? 'medium' : 'low'}`}>
                  {e.status === 0 ? 'BLOCKED' : e.status}
                </span>
              </td>
              <td style={{ padding: '7px 8px', color: 'var(--ink-soft)' }}>{e.durationMs != null ? `${e.durationMs}ms` : '—'}</td>
              <td style={{ padding: '7px 8px', color: 'var(--ink-soft)' }}>{e.initiator || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ReproTab({ bug }) {
  const [copied, setCopied] = useState(false);
  const steps = bug.reproduction?.steps || [];
  const playwright = bug.reproduction?.playwright || '';
  const icons = { click: '🖱', input: '⌨', keydown: '⏎', submit: '📮', navigate: '➜' };

  async function copy() {
    try {
      await navigator.clipboard.writeText(playwright);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch (_) {
      /* ignore */
    }
  }

  return (
    <div>
      <div className="panel-head" style={{ border: 'none', padding: 0, marginBottom: 14 }}>
        <span className="panel-title">RECORDED STEPS {steps.length ? `(${steps.length})` : ''}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
        {steps.length === 0 && <div className="mono" style={{ color: 'var(--ink-soft)' }}>No interactions recorded for this report.</div>}
        {steps.map((s, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
            <span style={{ color: 'var(--ink-soft)', minWidth: 22 }}>{String(i + 1).padStart(2, '0')}</span>
            <span style={{ width: 22 }}>{icons[s.action] || '·'}</span>
            <span>{s.action.toUpperCase()}</span>
            {s.selector && <code style={{ color: 'var(--red)' }}>{s.selector}</code>}
            {s.action === 'input' && (
              <span style={{ color: 'var(--ink-soft)' }}>→ “{s.type === 'password' ? '••••••' : s.value}”</span>
            )}
            {s.action === 'navigate' && <span style={{ color: 'var(--ink-soft)' }}>{s.url}</span>}
          </div>
        ))}
      </div>

      {playwright && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span className="panel-title">GENERATED PLAYWRIGHT TEST</span>
            <button className="btn btn-sm" onClick={copy}>{copied ? 'Copied ✓' : 'Copy'}</button>
          </div>
          <pre className="code">{playwright}</pre>
        </>
      )}
    </div>
  );
}

function HealthTab({ bug }) {
  const h = bug.health;
  if (!h || (!h.scores && (!h.issues || !h.issues.length))) {
    return <div className="mono" style={{ color: 'var(--ink-soft)' }}>No health scan attached to this report.</div>;
  }
  const scores = h.scores || {};
  const labels = { performance: 'PERFORMANCE', accessibility: 'ACCESSIBILITY', security: 'SECURITY', seo: 'SEO', javascript: 'JAVASCRIPT' };
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10, marginBottom: 20 }}>
        {Object.keys(labels).map((k) => (
          <div key={k} style={{ border: '2px solid var(--ink)', background: 'var(--bg-3)', padding: 12, textAlign: 'center', boxShadow: '3px 3px 0 var(--ink)' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 26 }}>{scores[k] ?? '—'}</div>
            <div className="mono" style={{ fontSize: 8, letterSpacing: '0.1em', color: 'var(--ink-soft)', marginTop: 4 }}>{labels[k]}</div>
          </div>
        ))}
      </div>
      {(h.issues || []).map((i, idx) => (
        <div key={idx} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '8px 0', borderBottom: '1px dashed var(--line-strong)', fontSize: 13 }}>
          <span className={`pill pill-${i.severity}`} style={{ minWidth: 62, justifyContent: 'center', flexShrink: 0 }}>{i.severity}</span>
          <div>
            <div style={{ fontWeight: 700 }}>{i.message}</div>
            {i.detail && <div className="mono" style={{ fontSize: 11, color: 'var(--ink-soft)' }}>{i.detail}</div>}
          </div>
        </div>
      ))}
    </div>
  );
}

function ElementTab({ bug }) {
  const e = bug.element;
  if (!e) return <div className="mono" style={{ color: 'var(--ink-soft)' }}>No element attached.</div>;
  const rows = [
    ['selector', e.selector],
    ['tag', e.tagName],
    ['id', e.id || '—'],
    ['classes', e.classes?.join(' ') || '—'],
    ['dimensions', `${e.dimensions?.width} × ${e.dimensions?.height} px`],
    ['position', `x:${e.position?.x} y:${e.position?.y}`],
    ['visibility', e.visibility],
    ['events', e.events?.join(', ') || '—'],
    ['text', e.text || '—'],
  ];
  return (
    <div>
      <div className="mono" style={{ fontSize: 20, marginBottom: 16 }}>
        &lt;{e.tagName} <span style={{ color: 'var(--red)' }}>{e.selector}</span>&gt;
      </div>
      {rows.map(([k, v], i) => (
        <div key={i} style={{ display: 'flex', gap: 12, padding: '6px 0', borderBottom: '1px dashed var(--line-strong)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
          <span style={{ color: 'var(--ink-soft)', minWidth: 90 }}>{k.toUpperCase()}</span>
          <span style={{ wordBreak: 'break-all' }}>{v}</span>
        </div>
      ))}
    </div>
  );
}

function HistoryTab({ bug }) {
  const history = [...(bug.history || [])].reverse();
  return (
    <div style={{ position: 'relative', paddingLeft: 24 }}>
      <div style={{ position: 'absolute', left: 7, top: 4, bottom: 4, width: 2, background: 'var(--line-strong)' }} />
      {history.length === 0 && <div className="mono" style={{ color: 'var(--ink-soft)' }}>No history.</div>}
      {history.map((h, i) => (
        <div key={i} style={{ position: 'relative', marginBottom: 14 }}>
          <div style={{ position: 'absolute', left: -24, top: 4, width: 12, height: 12, borderRadius: '50%', background: h.action === 'created' ? 'var(--red)' : 'var(--bg-3)', border: '2px solid var(--ink)' }} />
          <div className="mono" style={{ fontSize: 11, color: 'var(--ink-soft)' }}>
            <b style={{ color: 'var(--ink)' }}>{h.actor}</b> · {h.action} · {timeAgo(h.at)}
          </div>
          <div style={{ fontSize: 13, marginTop: 2 }}>
            {h.action === 'created' && 'Bug opened'}
            {h.action === 'commented' && <>commented: “{h.to}”</>}
            {h.action === 'updated' && h.field && (
              <>
                {h.field}: <s style={{ color: 'var(--ink-soft)' }}>{h.from || '—'}</s> → <b>{h.to}</b>
              </>
            )}
            {h.action === 'duplicate' && <span className="mono" style={{ color: 'var(--amber)' }}>new occurrence recorded ({h.to})</span>}
            {h.action === 'exported' && <span style={{ color: 'var(--teal)' }}>→ {h.to}</span>}
          </div>
        </div>
      ))}
    </div>
  );
}

function CommentPanel({ bug, onDone }) {
  const [body, setBody] = useState('');
  const [author, setAuthor] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  async function post() {
    if (!body.trim()) return;
    setBusy(true);
    setMsg('');
    try {
      await api.addComment(bug.bugId, { author: author.trim() || 'Anonymous', body: body.trim() });
      setBody('');
      onDone();
    } catch (err) {
      setMsg(err.message);
    } finally {
      setBusy(false);
    }
  }

  const comments = bug.comments || [];
  return (
    <div className="panel">
      <div className="panel-head"><span className="panel-title">COMMENTS ({comments.length})</span></div>
      <div className="panel-body" style={{ maxHeight: 300, overflowY: 'auto' }}>
        {comments.length === 0 && <div className="mono" style={{ color: 'var(--ink-soft)', fontSize: 12 }}>No comments yet.</div>}
        {comments.map((c, i) => (
          <div key={i} style={{ padding: '10px 0', borderBottom: '1px dashed var(--line-strong)' }}>
            <div className="mono" style={{ fontSize: 11 }}>
              <b style={{ color: 'var(--red)' }}>{c.author}</b>
              <span style={{ color: 'var(--ink-soft)', marginLeft: 8 }}>{timeAgo(c.createdAt)}</span>
            </div>
            <div style={{ fontSize: 13, marginTop: 4, lineHeight: 1.5 }}>{c.body}</div>
          </div>
        ))}
      </div>
      <div style={{ padding: 14, borderTop: '2px solid var(--ink)' }}>
        <textarea className="input" rows={3} placeholder="Add a comment…" value={body} onChange={(e) => setBody(e.target.value)} style={{ resize: 'vertical', marginBottom: 8 }} />
        <div style={{ display: 'flex', gap: 8 }}>
          <input className="input" placeholder="Your name" value={author} onChange={(e) => setAuthor(e.target.value)} style={{ flex: 1 }} />
          <button className="btn btn-sm btn-primary" onClick={post} disabled={busy || !body.trim()}>Post</button>
        </div>
        {msg && <div className="mono" style={{ fontSize: 11, color: 'var(--red)', marginTop: 8 }}>{msg}</div>}
      </div>
    </div>
  );
}
