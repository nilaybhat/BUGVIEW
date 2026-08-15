import { useCallback, useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { api, PRIORITY_META } from '../api';
import BugRow from '../components/BugRow';

const STATUS_CHIPS = [
  { key: '', label: 'ALL' },
  { key: 'open', label: 'OPEN', color: '#e6002e' },
  { key: 'in_progress', label: 'IN PROGRESS', color: '#ff7a00' },
  { key: 'verified', label: 'VERIFIED', color: '#00856f' },
  { key: 'closed', label: 'CLOSED', color: '#888' },
];

const PRIORITY_CHIPS = [
  { key: '', label: 'ALL' },
  { key: 'critical', label: 'CRITICAL', color: '#e6002e' },
  { key: 'high', label: 'HIGH', color: '#ff7a00' },
  { key: 'medium', label: 'MEDIUM', color: '#c99a00' },
  { key: 'low', label: 'LOW', color: '#00856f' },
];

const SORTS = [
  { key: 'newest', label: 'Newest first' },
  { key: 'oldest', label: 'Oldest first' },
  { key: 'priority-asc', label: 'Critical first' },
  { key: 'priority-desc', label: 'Low first' },
  { key: 'updated', label: 'Recently updated' },
];

export default function Bugs() {
  const root = useRef(null);
  const [bugs, setBugs] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [drawer, setDrawer] = useState(false);

  const load = useCallback(
    (overrides = {}) => {
      setLoading(true);
      api
        .listBugs({
          page: overrides.page ?? page,
          limit: 15,
          status: overrides.status ?? status,
          priority: overrides.priority ?? priority,
          search: overrides.search ?? search,
          sort: overrides.sort ?? sort,
        })
        .then((res) => {
          setBugs(res.items);
          setPagination(res.pagination);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    },
    [page, status, priority, search, sort]
  );

  useEffect(() => load(), [load]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.bug-row', { opacity: 0, x: -24, duration: 0.45, ease: 'power3.out', stagger: 0.04 });
    }, root);
    return () => ctx.revert();
  }, [bugs]);

  return (
    <div ref={root} className="wrap" style={{ paddingTop: 36, paddingBottom: 80 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
        <div>
          <div className="sec-label">ALL SIGNALS</div>
          <h1 style={{ fontSize: 'clamp(28px, 4vw, 44px)', lineHeight: 1 }}>Bug queue</h1>
        </div>
        <button className="btn btn-primary" onClick={() => setDrawer(true)}>
          + New Bug
        </button>
      </div>

      <div className="panel" style={{ padding: 16, marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            className="input"
            style={{ flex: '1 1 220px' }}
            placeholder="Search title, description, BUG id, reporter…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
              load({ search: e.target.value, page: 1 });
            }}
          />
          <select
            className="select"
            value={sort}
            onChange={(e) => {
              setSort(e.target.value);
              setPage(1);
              load({ sort: e.target.value, page: 1 });
            }}
          >
            {SORTS.map((s) => (
              <option key={s.key} value={s.key}>{s.label}</option>
            ))}
          </select>
        </div>

        <div style={{ marginTop: 14 }}>
          <div className="mono" style={{ fontSize: 9, letterSpacing: '0.2em', color: 'var(--ink-soft)', marginBottom: 8 }}>STATUS</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {STATUS_CHIPS.map((c) => (
              <button key={c.key} className={`chip ${status === c.key ? 'is-on' : ''}`} onClick={() => { setStatus(c.key); setPage(1); load({ status: c.key, page: 1 }); }}>
                {c.color && <span className="dot" style={{ background: c.color }} />}
                {c.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginTop: 12 }}>
          <div className="mono" style={{ fontSize: 9, letterSpacing: '0.2em', color: 'var(--ink-soft)', marginBottom: 8 }}>PRIORITY</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {PRIORITY_CHIPS.map((c) => (
              <button key={c.key} className={`chip ${priority === c.key ? 'is-on' : ''}`} onClick={() => { setPriority(c.key); setPage(1); load({ priority: c.key, page: 1 }); }}>
                {c.color && <span className="dot" style={{ background: c.color }} />}
                {c.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="mono" style={{ color: 'var(--ink-soft)', padding: 30 }}>LISTENING…</div>
      ) : (
        <div className="panel">
          {bugs.length === 0 && (
            <div style={{ padding: 34, fontFamily: 'var(--font-mono)', color: 'var(--ink-soft)' }}>
              No bugs match the current filters.
            </div>
          )}
          {bugs.map((b, i) => (
            <BugRow key={b.bugId} bug={b} index={i} />
          ))}
        </div>
      )}

      {pagination && pagination.pages > 1 && (
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 24 }}>
          {Array.from({ length: pagination.pages }).map((_, i) => (
            <button
              key={i}
              className={`chip ${page === i + 1 ? 'is-on' : ''}`}
              onClick={() => {
                setPage(i + 1);
                load({ page: i + 1 });
              }}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}

      <CreateDrawer open={drawer} onClose={() => setDrawer(false)} onCreated={() => { setDrawer(false); load({ page: 1 }); }} />
    </div>
  );
}

function CreateDrawer({ open, onClose, onCreated }) {
  const root = useRef(null);
  const [form, setForm] = useState({ title: '', description: '', priority: 'medium', reporter: '', url: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (open) {
        gsap.fromTo('.drawer-panel', { x: '100%' }, { x: 0, duration: 0.45, ease: 'power3.out' });
      }
    }, root);
    return () => ctx.revert();
  }, [open]);

  if (!open) return null;

  async function submit() {
    if (!form.title.trim()) {
      setError('Title is required');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await api.createBug({ ...form, title: form.title.trim(), reporter: form.reporter.trim() || 'Anonymous' });
      onCreated();
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <div ref={root} style={{ position: 'fixed', inset: 0, zIndex: 1500 }} onClick={onClose}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(2px)' }} />
      <aside
        className="drawer-panel"
        style={{ position: 'absolute', top: 0, right: 0, height: '100%', width: 'min(440px, 92vw)', background: 'var(--bg-2)', borderLeft: '3px solid var(--ink)', boxShadow: '-14px 0 0 rgba(0,0,0,0.3)', padding: 28, overflowY: 'auto', transform: 'translateX(100%)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div className="sec-label">NEW TRANSMISSION</div>
          <button className="btn btn-sm btn-ghost" onClick={onClose}>✕</button>
        </div>

        <label className="label">TITLE *</label>
        <input className="input" style={{ marginBottom: 14 }} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Login button doesn't work" />

        <label className="label">DESCRIPTION</label>
        <textarea className="input" rows={5} style={{ marginBottom: 14, resize: 'vertical' }} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What happened? Steps to reproduce…" />

        <label className="label">URL</label>
        <input className="input" style={{ marginBottom: 14 }} value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://…" />

        <label className="label">PRIORITY</label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
          {Object.entries(PRIORITY_META).map(([k, v]) => (
            <button key={k} className={`chip ${form.priority === k ? 'is-on' : ''}`} style={{ justifyContent: 'center' }} onClick={() => setForm({ ...form, priority: k })}>
              <span className="dot" style={{ background: v.dot }} />
              {v.label}
            </button>
          ))}
        </div>

        <label className="label">REPORTER</label>
        <input className="input" style={{ marginBottom: 20 }} value={form.reporter} onChange={(e) => setForm({ ...form, reporter: e.target.value })} placeholder="Your name" />

        {error && <div className="mono" style={{ color: 'var(--red)', marginBottom: 12, fontSize: 12 }}>{error}</div>}

        <button className="btn btn-primary" style={{ width: '100%' }} disabled={busy} onClick={submit}>
          {busy ? 'Transmitting…' : 'Create Bug'}
        </button>
      </aside>
    </div>
  );
}
