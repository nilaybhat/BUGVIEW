/**
 * BUGTRACK content script (isolated world).
 * - Injects the main-world probe and relays its diagnostics into
 *   chrome.storage.session so the popup / annotator / background can read them.
 * - Provides the DOM element inspector (BT_PICK_ELEMENT) and the passive
 *   website health / security scanner (BT_SCAN).
 */
(() => {
  'use strict';
  const CHANNEL = '__bugtrack_diag__';
  const STORAGE_KEY = 'bt_diag';
  const LIMITS = { errors: 40, network: 40, warnings: 20, mixed: 10, actions: 50 };

  function injectProbe() {
    try {
      const script = document.createElement('script');
      script.src = chrome.runtime.getURL('inject/main-world.js');
      script.onload = () => script.remove();
      (document.documentElement || document.head || document.body || document).appendChild(script);
    } catch (_) {
      /* ignore */
    }
  }

  async function push(type, entry) {
    try {
      const data = await chrome.storage.session.get(STORAGE_KEY);
      const diag = data[STORAGE_KEY] || {};
      if (!diag.meta) {
        diag.meta = { url: location.href, pageTitle: document.title, capturedAt: new Date().toISOString() };
      }
      const bucket =
        type === 'network'
          ? 'network'
          : type === 'mixedContent'
            ? 'mixed'
            : type === 'action'
              ? 'actions'
              : entry.level === 'warn'
                ? 'warnings'
                : 'errors';
      diag[bucket] = diag[bucket] || [];
      diag[bucket].push(entry);
      if (diag[bucket].length > LIMITS[bucket]) {
        diag[bucket] = diag[bucket].slice(-LIMITS[bucket]);
      }
      const set = {};
      set[STORAGE_KEY] = diag;
      await chrome.storage.session.set(set);
    } catch (_) {
      /* storage unavailable (e.g. data: URLs) */
    }
  }

  window.addEventListener('message', (event) => {
    if (event.source !== window) return;
    const data = event.data;
    if (!data || data.source !== CHANNEL || !data.payload) return;
    push(data.payload.type, data.payload);
  });

  /* ------------------------------------------------------------------ */
  /* DOM element inspector                                               */
  /* ------------------------------------------------------------------ */

  let picking = false;
  let pickResolve = null;
  let highlightEl = null;

  function makeOverlay() {
    const div = document.createElement('div');
    div.id = '__bugtrack_pick_overlay__';
    div.style.cssText =
      'position:fixed;inset:0;z-index:2147483647;cursor:crosshair;background:rgba(230,0,46,0.04);';
    const label = document.createElement('div');
    label.id = '__bugtrack_pick_label__';
    label.style.cssText =
      'position:fixed;z-index:2147483648;background:#16160f;color:#fff;font:11px monospace;padding:4px 8px;pointer-events:none;max-width:70vw;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;box-shadow:2px 2px 0 rgba(0,0,0,0.4);';
    div.appendChild(label);
    return { div, label };
  }

  const overlay = makeOverlay();

  function updateHighlight(el, label) {
    if (highlightEl && highlightEl.isConnected) highlightEl.remove();
    if (!el) return;
    highlightEl = document.createElement('div');
    highlightEl.style.cssText =
      'position:absolute;z-index:2147483647;pointer-events:none;border:3px solid #e6002e;box-shadow:0 0 0 2px #fff;';
    const r = el.getBoundingClientRect();
    highlightEl.style.left = r.left + 'px';
    highlightEl.style.top = r.top + 'px';
    highlightEl.style.width = r.width + 'px';
    highlightEl.style.height = r.height + 'px';
    (document.body || document.documentElement).appendChild(highlightEl);
    label.textContent = label || '';
    const lr = el.getBoundingClientRect();
    label.style.left = Math.min(lr.left, window.innerWidth - 260) + 'px';
    label.style.top = Math.max(0, lr.top - 24) + 'px';
  }

  function buildElementInfo(el) {
    const rect = el.getBoundingClientRect();
    const id = el.id ? `#${String(el.id).replace(/[^\w-]/g, '')}` : '';
    const classes = Array.from(el.classList || []).filter((c) => /^[a-zA-Z_-]+$/.test(c));
    const tag = (el.tagName || '').toLowerCase();
    const selector = id || (classes.length ? `.${classes.join('.')}` : tag);
    const visible =
      !!rect.width &&
      !!rect.height &&
      getComputedStyle(el).visibility !== 'hidden' &&
      getComputedStyle(el).display !== 'none';
    const attrs = {};
    for (const attr of ['name', 'type', 'href', 'src', 'placeholder', 'role', 'aria-label', 'title']) {
      if (el.getAttribute(attr)) attrs[attr] = String(el.getAttribute(attr)).slice(0, 100);
    }
    const events = [];
    for (const ev of ['click', 'change', 'input', 'submit', 'keydown', 'focus', 'blur']) {
      if (el[`on${ev}`]) events.push(ev);
    }
    return {
      tagName: tag,
      id: el.id || '',
      selector,
      classes: classes.slice(0, 4),
      attributes: attrs,
      text: (el.innerText || '').trim().slice(0, 120),
      dimensions: { width: Math.round(rect.width), height: Math.round(rect.height) },
      position: { x: Math.round(rect.x), y: Math.round(rect.y), top: Math.round(rect.top), left: Math.round(rect.left) },
      viewport: { width: window.innerWidth, height: window.innerHeight },
      visibility: visible ? 'visible' : 'hidden',
      events,
    };
  }

  function startPicking() {
    if (picking) return;
    picking = true;
    document.documentElement.appendChild(overlay.div);
    document.documentElement.appendChild(overlay.label);

    overlay.div.addEventListener('mousemove', (e) => {
      const el = document.elementFromPoint(e.clientX, e.clientY);
      updateHighlight(el, buildElementInfo(el).selector);
    });

    overlay.div.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const el = document.elementFromPoint(e.clientX, e.clientY);
      const info = buildElementInfo(el);
      stopPicking();
      if (pickResolve) {
        pickResolve({ ok: true, element: info });
        pickResolve = null;
      }
    }, true);

    overlay.div.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        stopPicking();
        if (pickResolve) {
          pickResolve({ ok: false, error: 'Pick cancelled' });
          pickResolve = null;
        }
      }
    });
    overlay.div.setAttribute('tabindex', '-1');
    overlay.div.focus();
  }

  function stopPicking() {
    picking = false;
    overlay.div.remove();
    overlay.label.remove();
    if (highlightEl && highlightEl.isConnected) highlightEl.remove();
    highlightEl = null;
  }

  /* ------------------------------------------------------------------ */
  /* Passive health + security scanner                                   */
  /* ------------------------------------------------------------------ */

  async function scanHealth() {
    const issues = [];
    const data = await chrome.storage.session.get(STORAGE_KEY);
    const diag = data[STORAGE_KEY] || {};
    const errors = diag.errors || [];
    const network = diag.network || [];
    const mixed = diag.mixed || [];
    const warnings = diag.warnings || [];

    /* resources from performance */
    let largeResources = [];
    let failedResources = [];
    try {
      const entries = performance.getEntriesByType('resource') || [];
      for (const e of entries) {
        if (e.transferSize > 1024 * 1024) {
          largeResources.push({ url: e.name, sizeMB: Math.round(e.transferSize / 1024 / 1024) });
        }
        if (e.transferSize === 0 && e.initiatorType !== 'other') {
          failedResources.push(e.name);
        }
      }
    } catch (_) {
      /* ignore */
    }

    /* accessibility */
    const images = Array.from(document.images || []);
    const noAlt = images.filter((i) => !i.hasAttribute('alt') && !i.getAttribute('aria-hidden'));
    const inputs = Array.from(document.querySelectorAll('input,textarea,select'));
    const noLabel = inputs.filter((el) => {
      if (el.getAttribute('aria-label') || el.getAttribute('placeholder')) return false;
      const id = el.id;
      if (id && document.querySelector(`label[for="${id}"]`)) return false;
      if (el.closest('label')) return false;
      return true;
    });

    /* seo metadata */
    const meta = (name) => document.querySelector(`meta[name="${name}"],meta[property="${name}"]`);
    const hasTitle = !!document.title;
    const hasDescription = !!meta('description');
    const hasViewport = !!document.querySelector('meta[name="viewport"]');
    const hasOg = !!meta('og:title') || !!meta('og:image');

    /* security headers — ask the background worker */
    const headers = await new Promise((resolve) => {
      chrome.runtime.sendMessage({ type: 'BT_GET_HEADERS' }, (resp) => resolve((resp && resp.headers) || null));
    });

    const isHttps = location.protocol === 'https:';
    const missingHeaders = headers ? Object.entries(headers.missing || {}) : [];

    if (!isHttps) issues.push({ severity: 'high', category: 'security', message: 'Page served over HTTP', detail: 'HTTPS is not enabled for this page.' });
    if (mixed.length) issues.push({ severity: 'high', category: 'security', message: `${mixed.length} mixed-content resources`, detail: 'HTTPS page loaded HTTP resources.' });
    missingHeaders.forEach(([h]) =>
      issues.push({ severity: h === 'content-security-policy' ? 'critical' : 'medium', category: 'security', message: `Missing ${h.replace(/-/g, ' ')}`, detail: `Response does not include a ${h} header.` })
    );
    if (errors.length) issues.push({ severity: errors.length > 3 ? 'critical' : 'high', category: 'javascript', message: `${errors.length} JavaScript error${errors.length > 1 ? 's' : ''}`, detail: errors[0].message });
    if (network.length) issues.push({ severity: network.length > 2 ? 'high' : 'medium', category: 'network', message: `${network.length} failed network request${network.length > 1 ? 's' : ''}`, detail: `${network[0].method} ${network[0].url} → ${network[0].status}` });
    if (warnings.length) issues.push({ severity: 'low', category: 'javascript', message: `${warnings.length} console warning${warnings.length > 1 ? 's' : ''}`, detail: warnings[0].message });
    noAlt.slice(0, 5).forEach(() => issues.push({ severity: 'medium', category: 'accessibility', message: 'Image missing alt attribute', detail: `${noAlt.length} image${noAlt.length > 1 ? 's' : ''} have no alt text.` }));
    noLabel.slice(0, 5).forEach(() => issues.push({ severity: 'medium', category: 'accessibility', message: 'Input missing label', detail: `${noLabel.length} input${noLabel.length > 1 ? 's' : ''} have no associated label.` }));
    largeResources.slice(0, 3).forEach((r) => issues.push({ severity: 'low', category: 'performance', message: `Large resource ${r.sizeMB}MB`, detail: r.url }));
    failedResources.slice(0, 5).forEach((u) => issues.push({ severity: 'medium', category: 'network', message: 'Broken resource', detail: u }));
    if (!hasTitle) issues.push({ severity: 'high', category: 'seo', message: 'Missing page title', detail: 'No <title> tag found.' });
    if (!hasDescription) issues.push({ severity: 'medium', category: 'seo', message: 'Missing meta description', detail: 'No meta description tag found.' });
    if (!hasViewport) issues.push({ severity: 'medium', category: 'seo', message: 'Missing viewport meta', detail: 'No mobile viewport tag found.' });
    if (!hasOg) issues.push({ severity: 'low', category: 'seo', message: 'Missing Open Graph tags', detail: 'No og:title / og:image meta found.' });

    const clamp = (v) => Math.max(0, Math.min(100, Math.round(v)));
    const scores = {
      performance: clamp(100 - largeResources.length * 6 - failedResources.length * 2 - network.length * 4 - mixed.length * 4),
      accessibility: clamp(100 - noAlt.length * 3 - noLabel.length * 4),
      security: clamp(
        (isHttps ? 55 : 0) +
          (headers ? Object.keys(headers.present || {}).length * 6 : 0) -
          mixed.length * 8 +
          (headers && headers.missing && headers.missing['content-security-policy'] ? -15 : 0)
      ),
      seo: clamp(100 - (hasTitle ? 0 : 25) - (hasDescription ? 0 : 18) - (hasViewport ? 0 : 12) - (hasOg ? 0 : 5)),
      javascript: clamp(100 - errors.length * 5 - warnings.length * 1),
    };

    const severities = { critical: 0, high: 1, medium: 2, low: 3 };
    issues.sort((a, b) => severities[a.severity] - severities[b.severity]);
    return { scores, issues: issues.slice(0, 30) };
  }

  /* ------------------------------------------------------------------ */

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (!message) return false;
    switch (message.type) {
      case 'BT_REFRESH_DIAG': {
        try {
          window.postMessage({ source: '__bugtrack_hello__' }, '*');
        } catch (_) {
          /* ignore */
        }
        sendResponse({ ok: true });
        break;
      }
      case 'BT_PICK_ELEMENT': {
        startPicking();
        return true;
      }
      case 'BT_SCAN': {
        scanHealth()
          .then((result) => sendResponse({ ok: true, health: result }))
          .catch(() => sendResponse({ ok: false, error: 'Scan failed' }));
        return true;
      }
      case 'BT_GET_META': {
        sendResponse({
          page: {
            viewport: `${window.innerWidth}x${window.innerHeight}`,
            scrollY: window.scrollY,
            documentHeight: document.documentElement.scrollHeight,
            readyState: document.readyState,
          },
        });
        break;
      }
      default:
        return false;
    }
    return false;
  });

  injectProbe();
})();
