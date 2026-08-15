import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const ORDER = ['critical', 'high', 'medium', 'low'];
const COLORS = { critical: '#e6002e', high: '#ff7a00', medium: '#c99a00', low: '#00856f' };

export function Donut({ data, size = 220 }) {
  const ref = useRef(null);
  const total = (data && ORDER.reduce((s, k) => s + (data[k] || 0), 0)) || 1;
  const r = size / 2 - 22;
  const circ = 2 * Math.PI * r;

  let offset = 0;
  const segments = ORDER.map((key) => {
    const frac = (data && data[key]) || 0;
    const seg = { key, value: frac, frac: frac / total, dashoffset: offset, length: frac / total * circ };
    offset += seg.length;
    return seg;
  });

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.donut-seg',
        { strokeDasharray: (i) => `${0} ${circ}` },
        {
          strokeDasharray: (i) => `${segments[i].length} ${circ}`,
          duration: 1.4,
          ease: 'power3.inOut',
          stagger: 0.1,
          scrollTrigger: { trigger: ref.current, start: 'top 85%' },
        }
      );
    }, ref);
    return () => ctx.revert();
  }, [data]);

  return (
    <div ref={ref} className="donut" style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--line)" strokeWidth="22" />
        {segments.map((s, i) => (
          <circle
            key={s.key}
            className="donut-seg"
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={COLORS[s.key]}
            strokeWidth="22"
            strokeDasharray={`0 ${circ}`}
            strokeDashoffset={-s.dashoffset}
            strokeLinecap="butt"
            data-index={i}
          />
        ))}
      </svg>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'grid',
          placeItems: 'center',
          textAlign: 'center',
        }}
      >
        <div>
          <div className="big-num" style={{ fontSize: 46 }}>{total}</div>
          <div className="mono" style={{ fontSize: 10, color: 'var(--ink-soft)', letterSpacing: '0.2em' }}>
            TOTAL BUGS
          </div>
        </div>
      </div>
    </div>
  );
}

export function StatusBars({ data }) {
  const ref = useRef(null);
  const order = ['open', 'in_progress', 'verified', 'closed'];
  const labels = { open: 'Open', in_progress: 'In Progress', verified: 'Verified', closed: 'Closed' };
  const max = Math.max(1, ...order.map((k) => (data && data[k]) || 0));

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.status-fill',
        { scaleY: 0 },
        {
          scaleY: 1,
          transformOrigin: 'bottom',
          duration: 1.1,
          ease: 'power3.out',
          stagger: 0.12,
          scrollTrigger: { trigger: ref.current, start: 'top 85%' },
        }
      );
    }, ref);
    return () => ctx.revert();
  }, [data]);

  return (
    <div ref={ref}>
      {order.map((k) => {
        const v = (data && data[k]) || 0;
        return (
          <div key={k} style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: 11, marginBottom: 6 }}>
              <span className="mono" style={{ color: 'var(--ink-soft)', letterSpacing: '0.14em' }}>
                {labels[k].toUpperCase()}
              </span>
              <span>{v}</span>
            </div>
            <div style={{ height: 14, background: 'var(--bg-2)', border: '1px solid var(--line-strong)' }}>
              <div
                className="status-fill"
                style={{
                  height: '100%',
                  width: `${(v / max) * 100}%`,
                  background: k === 'open' ? 'var(--red)' : k === 'in_progress' ? 'var(--amber)' : k === 'verified' ? 'var(--teal)' : 'var(--ink-soft)',
                  transform: 'scaleY(0)',
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function Trend({ data }) {
  const ref = useRef(null);
  const points = data || [];
  const W = 560;
  const H = 140;
  const max = Math.max(2, ...points.map((p) => p.count));
  const pad = 20;

  const coords = points.map((p, i) => {
    const x = pad + (i / Math.max(1, points.length - 1)) * (W - pad * 2);
    const y = H - pad - (p.count / max) * (H - pad * 2);
    return { x, y };
  });

  const line = coords.map((c, i) => `${i === 0 ? 'M' : 'L'}${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' ');
  const area = `${line} L${W - pad},${H - pad} L${pad},${H - pad} Z`;

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.trend-line',
        { strokeDasharray: '0 1', strokeDashoffset: 1 },
        {
          strokeDasharray: '1 1',
          strokeDashoffset: 0,
          duration: 1.8,
          ease: 'power2.inOut',
          scrollTrigger: { trigger: ref.current, start: 'top 85%' },
        }
      );
      gsap.fromTo('.trend-dot', { scale: 0 }, {
        scale: 1,
        stagger: 0.06,
        ease: 'back.out(2)',
        scrollTrigger: { trigger: ref.current, start: 'top 85%' },
      });
    }, ref);
    return () => ctx.revert();
  }, [data]);

  if (!points.length) return <div className="mono" style={{ color: 'var(--ink-soft)' }}>No data yet</div>;

  return (
    <div ref={ref}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto' }}>
        {[0.25, 0.5, 0.75].map((f) => (
          <line key={f} x1={pad} x2={W - pad} y1={H * f} y2={H * f} stroke="var(--line)" strokeDasharray="3 5" />
        ))}
        <path d={area} fill="var(--red)" opacity="0.08" />
        <path className="trend-line" d={line} fill="none" stroke="var(--red)" strokeWidth="3" pathLength="1" style={{ strokeDasharray: '0 1', strokeDashoffset: 1 }} />
        {coords.map((c, i) => (
          <circle
            key={i}
            className="trend-dot"
            cx={c.x}
            cy={c.y}
            r="4"
            fill="var(--bg-3)"
            stroke="var(--red)"
            strokeWidth="2"
          />
        ))}
      </svg>
      <div className="mono" style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--ink-soft)', marginTop: 6 }}>
        <span>{points[0]?.date}</span>
        <span>last 14 days</span>
        <span>{points[points.length - 1]?.date}</span>
      </div>
    </div>
  );
}

export function MiniBars({ items, colorKey }) {
  const ref = useRef(null);
  const max = Math.max(1, ...items.map((i) => i.count));

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.minibar-fill',
        { scaleX: 0 },
        {
          scaleX: 1,
          transformOrigin: 'left',
          duration: 1,
          ease: 'power3.out',
          stagger: 0.08,
          scrollTrigger: { trigger: ref.current, start: 'top 90%' },
        }
      );
    }, ref);
    return () => ctx.revert();
  }, [items]);

  if (!items.length) return <div className="mono" style={{ color: 'var(--ink-soft)' }}>No data yet</div>;

  return (
    <div ref={ref} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {items.map((item, i) => (
        <div key={i}>
          <div className="mono" style={{ fontSize: 11, color: 'var(--ink-soft)', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {item.name ?? item.message ?? item.url}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ flex: 1, height: 12, background: 'var(--bg-2)', border: '1px solid var(--line-strong)' }}>
              <div
                className="minibar-fill"
                style={{
                  height: '100%',
                  width: `${(item.count / max) * 100}%`,
                  background: i === 0 ? 'var(--red)' : i === 1 ? 'var(--amber)' : 'var(--line-strong)',
                  transform: 'scaleX(0)',
                }}
              />
            </div>
            <span className="mono" style={{ fontSize: 11, minWidth: 22, textAlign: 'right' }}>
              {item.count}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
