import { useEffect, useRef } from 'react';
import gsap from 'gsap';

export default function Loader({ onDone }) {
  const root = useRef(null);
  const done = useRef(false);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const bars = gsap.utils.toArray('.loader-bar');
      const tl = gsap.timeline({ defaults: { ease: 'power3.inOut' } });

      bars.forEach((bar, i) => {
        tl.fromTo(
          bar,
          { scaleY: 0.08 },
          { scaleY: gsap.utils.random(0.4, 1.4, 0.1), duration: 0.5, yoyo: true, repeat: 3, ease: 'sine.inOut', delay: i * 0.05 }
        );
      });

      tl.to('.loader-word span', {
        y: 0,
        duration: 0.6,
        stagger: 0.07,
        ease: 'power4.out',
      });

      tl.to(
        '.loader-tag',
        { opacity: 1, duration: 0.3 },
        '-=0.2'
      );

      tl.to(
        root.current,
        {
          clipPath: 'inset(0 0 100% 0)',
          duration: 0.7,
          ease: 'power4.inOut',
        },
        '+=0.25'
      );
      tl.call(() => {
        if (!done.current) {
          done.current = true;
          onDone && onDone();
        }
      });
    }, root);

    return () => ctx.revert();
  }, [onDone]);

  return (
    <div className="loader" ref={root} style={{ clipPath: 'inset(0 0 0% 0)' }}>
      <div className="loader-bars">
        {Array.from({ length: 9 }).map((_, i) => (
          <div className="loader-bar" key={i} style={{ height: '70px', transformOrigin: 'bottom' }} />
        ))}
      </div>
      <div className="loader-word">
        {['B', 'U', 'G', 'T', 'R', 'A', 'C', 'K'].map((ch, i) => (
          <span key={i} style={{ display: 'inline-block' }}>
            {ch}
          </span>
        ))}
      </div>
      <div className="loader-tag" style={{ opacity: 0 }}>
        [ SIGNAL RECORDER · CHANNEL 7 ]
      </div>
    </div>
  );
}
