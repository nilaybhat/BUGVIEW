import { Link, NavLink } from 'react-router-dom';

export default function Nav({ theme, toggle }) {
  return (
    <nav className="bt-nav">
      <div className="wrap bt-nav-inner">
        <Link to="/" className="bt-logo">
          <span className="bt-logo-mark">BT</span>
          <span>
            <span className="bt-logo-name">BUGTRACK</span>
            <span className="bt-logo-sub">signal recorder · wiretap</span>
          </span>
        </Link>

        <div className="bt-nav-links">
          <NavLink to="/" end className="bt-nav-link">
            Overview
          </NavLink>
          <NavLink to="/bugs" className="bt-nav-link">
            Bugs
          </NavLink>
          <button
            className="bt-theme-btn"
            onClick={toggle}
            title="Toggle theme"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? '☀' : '☾'}
          </button>
        </div>
      </div>
    </nav>
  );
}
