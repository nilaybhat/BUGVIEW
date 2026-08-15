import { useEffect, useRef } from 'react';
import gsap from 'gsap';

function AnnotationOverlay({ annotations, naturalWidth, naturalHeight }) {
  if (!annotations || !annotations.length) return null;
  return (
    <>
      {annotations.map((a, i) => {
        if (a.type === 'blur') return null;
        const x1 = Math.min(a.x1, a.x2);
        const y1 = Math.min(a.y1, a.y2);
        const w = Math.abs(a.x2 - a.x1);
        const h = Math.abs(a.y2 - a.y1);
        const style = {
          position: 'absolute',
          left: `${(x1 / naturalWidth) * 100}%`,
          top: `${(y1 / naturalHeight) * 100}%`,
          width: `${(w / naturalWidth) * 100}%`,
          height: `${(h / naturalHeight) * 100}%`,
          border: a.type === 'highlight' ? '2px dashed ' + (a.color || '#e6002e') : '3px solid ' + (a.color || '#e6002e'),
          background: a.type === 'highlight' ? 'rgba(230,0,46,0.15)' : 'transparent',
          pointerEvents: 'none',
          boxSizing: 'border-box',
          zIndex: 5,
        };
        if (a.type === 'text') {
          style.border = 'none';
          style.background = 'none';
          style.fontFamily = "'Space Mono', monospace";
          style.fontWeight = 700;
          style.color = a.color || '#e6002e';
          style.fontSize = `${Math.max(14, Math.min(28, w * 0.16))}px`;
          style.textShadow = '0 0 4px var(--bg), 0 0 4px var(--bg)';
          style.display = 'grid';
          style.alignItems = 'center';
        }
        return (
          <div key={i} style={style}>
            {a.type === 'text' ? a.text : a.type === 'arrow' ? null : null}
          </div>
        );
      })}
    </>
  );
}

export default function ScreenshotModal({ bug, onClose }) {
  const ref = useRef(null);
  const url = bug?.screenshotUrl;

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.shot-box', { scale: 0.92, opacity: 0, duration: 0.4, ease: 'power3.out' });
      gsap.from('.shot-backdrop', { opacity: 0, duration: 0.3 });
    }, ref);
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => {
      ctx.revert();
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="shot-backdrop"
      style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(0,0,0,0.78)', display: 'grid', placeItems: 'center', padding: 24, backdropFilter: 'blur(3px)' }}
      onClick={onClose}
    >
      <div
        className="shot-box"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 'min(1100px, 92vw)', maxHeight: '88vh', overflow: 'auto', background: 'var(--bg)', border: '3px solid var(--ink)', boxShadow: '16px 16px 0 rgba(0,0,0,0.5)' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'var(--ink)', color: 'var(--bg)' }}>
          <span className="mono" style={{ letterSpacing: '0.14em', fontSize: 12 }}>
            SCREENSHOT · {bug?.bugId}
          </span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--bg)', fontSize: 16, cursor: 'pointer' }}>
            ✕
          </button>
        </div>
        {url ? (
          <div style={{ position: 'relative', width: '100%', background: '#fff' }}>
            <img src={url} alt={bug?.title} style={{ display: 'block', width: '100%', height: 'auto' }} />
            <AnnotationOverlay annotations={bug?.screenshot?.annotations} naturalWidth={bug?.screenshot?.naturalWidth || 1280} naturalHeight={bug?.screenshot?.naturalHeight || 720} />
          </div>
        ) : (
          <div style={{ padding: 40, fontFamily: 'var(--font-mono)', color: 'var(--ink-soft)' }}>No screenshot attached.</div>
        )}
      </div>
    </div>
  );
}
