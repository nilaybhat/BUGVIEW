import { useEffect, useRef } from 'react';
import gsap from 'gsap';

export default function Cursor() {
  const dotRef = useRef(null);
  const ringRef = useRef(null);

  useEffect(() => {
    const fine = window.matchMedia('(pointer: fine)').matches;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!fine || reduced) return;

    const dot = gsap.quickTo(dotRef.current, 'x', { duration: 0.12, ease: 'power2.out' });
    const dotY = gsap.quickTo(dotRef.current, 'y', { duration: 0.12, ease: 'power2.out' });
    const ring = gsap.quickTo(ringRef.current, 'x', { duration: 0.35, ease: 'power3.out' });
    const ringY = gsap.quickTo(ringRef.current, 'y', { duration: 0.35, ease: 'power3.out' });

    const onMove = (e) => {
      dot(e.clientX);
      dotY(e.clientY);
      ring(e.clientX);
      ringY(e.clientY);
    };
    const onOver = (e) => {
      const interactive = e.target.closest('a,button,.chip,.bt-nav-link,.select');
      ringRef.current.classList.toggle('is-hover', !!interactive);
    };

    window.addEventListener('mousemove', onMove);
    document.addEventListener('mouseover', onOver);
    return () => {
      window.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseover', onOver);
    };
  }, []);

  return (
    <>
      <div className="bt-cursor" ref={dotRef} />
      <div className="bt-cursor-ring" ref={ringRef} />
    </>
  );
}
