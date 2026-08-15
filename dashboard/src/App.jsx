import { useEffect, useRef, useState } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import gsap from 'gsap';
import { useTheme } from './hooks/useTheme';
import Loader from './components/Loader';
import Cursor from './components/Cursor';
import Nav from './components/Nav';
import Overview from './pages/Overview';
import Bugs from './pages/Bugs';
import BugDetail from './pages/BugDetail';

function TransitionOverlay() {
  const ref = useRef(null);
  const location = useLocation();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    gsap.set(el, { clipPath: 'inset(0 0 100% 0)', display: 'block' });
    const tl = gsap.timeline();
    tl.to(el, { clipPath: 'inset(0 0 0% 0)', duration: 0.35, ease: 'power3.inOut' });
    tl.to(el, { clipPath: 'inset(0 0 100% 0)', duration: 0.45, ease: 'power3.inOut', delay: 0.05 });
    tl.set(el, { display: 'none' });
  }, [location.pathname]);

  return (
    <div
      ref={ref}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 4000,
        background: 'var(--red)',
        pointerEvents: 'none',
        display: 'none',
      }}
    />
  );
}

function Shell() {
  const location = useLocation();
  const { theme, toggle } = useTheme();
  const [booted, setBooted] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <>
      {!booted && <Loader onDone={() => setBooted(true)} />}
      <Cursor />
      <TransitionOverlay />
      <Nav theme={theme} toggle={toggle} />
      <Routes location={location}>
        <Route path="/" element={<Overview />} />
        <Route path="/bugs" element={<Bugs />} />
        <Route path="/bugs/:id" element={<BugDetail />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Shell />
    </BrowserRouter>
  );
}
