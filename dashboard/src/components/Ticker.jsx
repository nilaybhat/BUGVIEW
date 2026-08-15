import { useEffect, useRef } from 'react';
import gsap from 'gsap';

const PRIORITY_DOT = { critical: '#e6002e', high: '#ff7a00', medium: '#c99a00', low: '#00856f' };

export default function Ticker({ bugs }) {
  const trackRef = useRef(null);
  const items = bugs || [];

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const item = track.firstElementChild;
    if (!item) return;
    const width = item.scrollWidth;
    const dur = Math.max(12, (width / 60) * 0.35);
    const anim = gsap.to(track, {
      x: -width / 2,
      duration: dur,
      ease: 'none',
      repeat: -1,
    });
    return () => anim.kill();
  }, [items.length]);

  if (!items.length) return null;
  const doubled = [...items, ...items];

  return (
    <div className="ticker" aria-hidden="true">
      <div className="ticker-track" ref={trackRef}>
        {doubled.map((b, i) => (
          <span className="ticker-item" key={`${b.bugId}-${i}`}>
            <span className="t-dot" style={{ background: PRIORITY_DOT[b.priority] || '#888' }} />
            <b>{b.bugId}</b>
            <span>{b.title}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
