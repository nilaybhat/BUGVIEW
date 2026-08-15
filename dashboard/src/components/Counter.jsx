import { useEffect, useRef } from 'react';
import gsap from 'gsap';

export default function Counter({ value, duration = 1.6 }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obj = { v: 0 };
    const tween = gsap.to(obj, {
      v: value,
      duration,
      ease: 'power2.out',
      onUpdate: () => {
        el.textContent = Math.round(obj.v);
      },
    });
    return () => tween.kill();
  }, [value, duration]);

  return <span ref={ref}>0</span>;
}
