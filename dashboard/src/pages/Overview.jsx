import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Link } from 'react-router-dom';
import { api, PRIORITY_META } from '../api';
import { Donut, StatusBars, Trend, MiniBars } from '../components/charts';
import Counter from '../components/Counter';
import BugRow from '../components/BugRow';
import Ticker from '../components/Ticker';

gsap.registerPlugin(ScrollTrigger);

const METERS = [
  { key: 'critical', label: 'CRITICAL', color: 'var(--red)' },
  { key: 'high', label: 'HIGH', color: 'var(--amber)' },
  { key: 'medium', label: 'MEDIUM', color: 'var(--yellow)' },
  { key: 'low', label: 'LOW', color: 'var(--teal)' },
];

export default function Overview() {
  const root = useRef(null);
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.stats(), api.listBugs({ limit: 6 })])
      .then(([s, r]) => {
        setStats(s);
        setRecent(r.items);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.ov-hero .ov-rise', {
        y: 60,
        opacity: 0,
        duration: 0.9,
        ease: 'power3.out',
        stagger: 0.12,
      });
      gsap.from('.meter-cell', {
        y: 40,
        opacity: 0,
        duration: 0.8,
        ease: 'power3.out',
        stagger: 0.1,
        delay: 0.2,
      });
      gsap.utils.toArray('.ov-reveal').forEach((el) => {
        gsap.from(el, {
          y: 48,
          opacity: 0,
          duration: 0.9,
          ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 88%' },
        });
      });
    }, root);
    return () => ctx.revert();
  }, [loading]);

  if (loading) {
    return (
      <div className="wrap" style={{ paddingTop: 120, fontFamily: 'var(--font-mono)', color: 'var(--ink-soft)' }}>
        TUNING SIGNALS…
      </div>
    );
  }

  const a = stats.analytics || {};

  return (
    <div ref={root}>
      <Ticker bugs={recent} />

      <section className="wrap ov-hero" style={{ paddingTop: 40, paddingBottom: 40 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 24, flexWrap: 'wrap' }}>
          <div>
            <div className="ov-rise sec-label">LIVE SIGNAL FEED · ALL PROJECTS</div>
            <div className="ov-rise big-num" style={{ margin: '8px 0 6px' }}>
              <Counter value={stats.total} />
            </div>
            <div className="ov-rise mono" style={{ color: 'var(--ink-soft)', letterSpacing: '0.1em', fontSize: 13 }}>
              bugs captured by the recorder — <span style={{ color: 'var(--red)' }}>{stats.openTotal} open</span>
            </div>
          </div>
          <div className="ov-rise" style={{ textAlign: 'right' }}>
            <div className="rec"><span className="rec-dot" />REC</div>
            <div className="mono" style={{ fontSize: 11, color: 'var(--ink-soft)', marginTop: 10, lineHeight: 1.8 }}>
              {stats.byProject[0]?._id || '—'} monitored<br />
              {recent.length} channels streaming
            </div>
          </div>
        </div>
      </section>

      <section className="wrap" style={{ marginBottom: 48 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {METERS.map((m) => (
            <div key={m.key} className="meter-cell panel" style={{ padding: '18px 16px', borderTop: `6px solid ${m.color}` }}>
              <div className="metric-count"><Counter value={stats.byPriority[m.key]} /></div>
              <div className="mono" style={{ fontSize: 10, letterSpacing: '0.2em', color: 'var(--ink-soft)', marginTop: 6 }}>
                {m.label}
              </div>
              <div style={{ height: 5, background: 'var(--bg-2)', marginTop: 12, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${stats.total ? (stats.byPriority[m.key] / stats.total) * 100 : 0}%`, background: m.color }} />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="wrap" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 48 }}>
        <div className="panel ov-reveal">
          <div className="panel-head"><span className="panel-title">PRIORITY DISTRIBUTION</span></div>
          <div className="panel-body" style={{ display: 'flex', justifyContent: 'center', padding: '28px 16px' }}>
            <Donut data={stats.byPriority} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 18, paddingBottom: 18, flexWrap: 'wrap' }}>
            {METERS.map((m) => (
              <span key={m.key} className="mono" style={{ fontSize: 11, color: 'var(--ink-soft)', display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                <span style={{ width: 9, height: 9, background: m.color, display: 'inline-block' }} />
                {PRIORITY_META[m.key].label} · {stats.byPriority[m.key]}
              </span>
            ))}
          </div>
        </div>

        <div className="panel ov-reveal">
          <div className="panel-head"><span className="panel-title">LIFECYCLE STATE</span></div>
          <div className="panel-body">
            <StatusBars data={stats.byStatus} />
          </div>
        </div>
      </section>

      <section className="wrap" style={{ marginBottom: 48 }}>
        <div className="panel ov-reveal">
          <div className="panel-head"><span className="panel-title">REPORT VELOCITY · 14 DAYS</span></div>
          <div className="panel-body">
            <Trend data={stats.last14Days} />
          </div>
        </div>
      </section>

      <section className="wrap" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginBottom: 64 }}>
        <div className="panel ov-reveal">
          <div className="panel-head"><span className="panel-title">TOP ERRORS</span></div>
          <div className="panel-body">
            <MiniBars items={a.topErrors || []} />
          </div>
        </div>
        <div className="panel ov-reveal">
          <div className="panel-head"><span className="panel-title">MOST AFFECTED PAGES</span></div>
          <div className="panel-body">
            <MiniBars items={a.topPages || []} />
          </div>
        </div>
        <div className="panel ov-reveal">
          <div className="panel-head"><span className="panel-title">BROWSERS</span></div>
          <div className="panel-body">
            <MiniBars items={a.browsers || []} />
          </div>
        </div>
      </section>

      <section className="wrap ov-reveal" style={{ marginBottom: 80 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <span className="sec-label">LATEST TRANSMISSIONS</span>
          <Link to="/bugs" className="btn btn-sm btn-ghost">View all →</Link>
        </div>
        <div className="panel">
          {recent.map((b, i) => (
            <BugRow key={b.bugId} bug={b} index={i} />
          ))}
          {!recent.length && (
            <div style={{ padding: 30, fontFamily: 'var(--font-mono)', color: 'var(--ink-soft)' }}>No signals yet — install the extension and report a bug.</div>
          )}
        </div>
      </section>
    </div>
  );
}
