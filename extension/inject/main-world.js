/**
 * BUGTRACK main-world probe.
 * Runs in the PAGE world (injected via <script> tag by the content script),
 * so it can intercept the page's own fetch/XHR/console calls.
 * Everything it learns is forwarded to the content script via postMessage.
 */
(function () {
  'use strict';
  if (window.__BUGTRACK_PROBE__) return;
  window.__BUGTRACK_PROBE__ = true;

  const CHANNEL = '__bugtrack_diag__';
  const MAX = 60;

  function send(payload) {
    try {
      window.postMessage({ source: CHANNEL, payload }, '*');
    } catch (_) {
      /* page may be shutting down */
    }
  }

  function now() {
    return new Date().toISOString();
  }

  function safeStack(stack, limit = 8) {
    if (!stack) return null;
    try {
      return String(stack)
        .split('\n')
        .filter(Boolean)
        .slice(0, limit)
        .join('\n');
    } catch (_) {
      return null;
    }
  }

  /* ---------- console interception ---------- */
  const nativeError = console.error;
  const nativeWarn = console.warn;
  const nativeLog = console.log;
  const nativeInfo = console.info;

  const LEVELS = { error: 'error', warn: 'warn', log: 'log', info: 'info' };
  const COUNT = { error: 0, warn: 0, log: 0, info: 0 };

  function captureConsole(level, args, stack) {
    if (++COUNT[level] > MAX) return;
    let message;
    try {
      message = args
        .map((a) => {
          if (a instanceof Error) return `${a.name}: ${a.message}`;
          if (typeof a === 'string') return a;
          try {
            const s = JSON.stringify(a);
            return s === undefined ? String(a) : s;
          } catch (_) {
            return String(a);
          }
        })
        .join(' ');
    } catch (_) {
      message = '<unserializable message>';
    }
    if (!message || message.length > 4000) message = (message || '').slice(0, 4000);
    send({
      type: 'console',
      level,
      message,
      stack: level === 'error' ? safeStack(stack) : null,
      timestamp: now(),
    });
  }

  console.error = function () {
    captureConsole('error', Array.from(arguments), new Error().stack);
    return nativeError.apply(this, arguments);
  };
  console.warn = function () {
    captureConsole('warn', Array.from(arguments));
    return nativeWarn.apply(this, arguments);
  };
  console.log = function () {
    captureConsole('log', Array.from(arguments));
    return nativeLog.apply(this, arguments);
  };
  console.info = function () {
    captureConsole('info', Array.from(arguments));
    return nativeInfo.apply(this, arguments);
  };

  window.addEventListener('error', (event) => {
    if (COUNT.error++ > MAX) return;
    send({
      type: 'console',
      level: 'error',
      message: `${event.message || 'Unknown error'}`,
      source: event.filename || null,
      lineno: event.lineno || null,
      colno: event.colno || null,
      stack: safeStack(event.error && event.error.stack),
      timestamp: now(),
    });
  }, true);

  window.addEventListener('unhandledrejection', (event) => {
    if (COUNT.error++ > MAX) return;
    const reason = event.reason;
    send({
      type: 'console',
      level: 'error',
      message:
        reason instanceof Error
          ? `Unhandled promise rejection: ${reason.message}`
          : `Unhandled promise rejection: ${String(reason)}`,
      stack: safeStack(reason && reason.stack),
      timestamp: now(),
    });
  }, true);

  /* ---------- network interception ---------- */
  const nativeFetch = window.fetch;
  const reportedFetch = new WeakSet();

  window.fetch = function (input, init) {
    const url = typeof input === 'string' ? input : input && input.url ? input.url : String(input);
    const method = ((init && init.method) || (input && input.method) || 'GET').toUpperCase();
    const started = performance.now();
    return nativeFetch.apply(this, arguments).then(
      (response) => {
        if (response.status >= 400) {
          send({
            type: 'network',
            kind: 'failed',
            url,
            method,
            status: response.status,
            statusText: response.statusText || '',
            durationMs: Math.round(performance.now() - started),
            initiator: 'fetch',
            timestamp: now(),
          });
        }
        return response;
      },
      (err) => {
        send({
          type: 'network',
          kind: 'failed',
          url,
          method,
          status: 0,
          statusText: '',
          durationMs: Math.round(performance.now() - started),
          initiator: 'fetch',
          error: (err && err.message) || 'NetworkError',
          timestamp: now(),
        });
        throw err;
      }
    );
  };

  const nativeOpen = XMLHttpRequest.prototype.open;
  const nativeSend = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function (method, url, ...rest) {
    this.__bugtrackUrl = String(url);
    this.__bugtrackMethod = String(method || 'GET').toUpperCase();
    return nativeOpen.call(this, method, url, ...rest);
  };

  XMLHttpRequest.prototype.send = function (...args) {
    this.addEventListener('loadend', () => {
      if (reportedFetch.has(this)) return;
      const status = this.status;
      if (status >= 400 || status === 0) {
        send({
          type: 'network',
          kind: 'failed',
          url: this.__bugtrackUrl,
          method: this.__bugtrackMethod,
          status,
          statusText: this.statusText || '',
          durationMs: 0,
          initiator: 'xhr',
          timestamp: now(),
        });
      }
    });
    return nativeSend.apply(this, args);
  };

  /* ---------- resource / mixed-content detection ---------- */
  function classifyResource(name, pageIsHttps) {
    let resourceIsHttp = false;
    let resourceIsHttps = false;
    try {
      const u = new URL(name, location.href);
      resourceIsHttp = u.protocol === 'http:';
      resourceIsHttps = u.protocol === 'https:';
    } catch (_) {
      return null;
    }
    if (pageIsHttps && resourceIsHttp) return 'mixed';
    if (!resourceIsHttp && !resourceIsHttps) return null;
    return resourceIsHttps ? 'https' : 'http';
  }

  function observeResources() {
    if (!('PerformanceObserver' in window)) return;
    const pageIsHttps = location.protocol === 'https:';
    const seen = new Set();
    const onEntry = (entry) => {
      const name = entry.name || '';
      if (seen.has(name)) return;
      seen.add(name);
      const klass = classifyResource(name, pageIsHttps);

      if (klass === 'mixed') {
        send({
          type: 'mixedContent',
          url: name,
          message: `Mixed content: ${pageIsHttps ? 'HTTPS' : 'HTTP'} page loaded HTTP resource`,
          timestamp: now(),
        });
        return;
      }

      if (entry.initiatorType === 'other' && entry.transferSize === 0) {
        send({
          type: 'network',
          kind: 'resource',
          url: name,
          method: 'GET',
          status: 0,
          statusText: 'failed / blocked',
          durationMs: Math.round(entry.duration),
          initiator: entry.initiatorType || 'resource',
          timestamp: now(),
        });
      }
    };

    try {
      new PerformanceObserver((list) => list.getEntries().forEach(onEntry)).observe({
        type: 'resource',
        buffered: true,
      });
    } catch (_) {
      /* unsupported */
    }
    try {
      window.performance.getEntriesByType &&
        window.performance.getEntriesByType('resource').forEach(onEntry);
    } catch (_) {
      /* ignore */
    }
  }
  observeResources();

  /* request a snapshot when the popup asks for it */
  window.addEventListener('message', (event) => {
    if (event.source !== window) return;
    if (event.data && event.data.source === '__bugtrack_hello__') {
      observeResources();
    }
  });

  /* ---------- reproduction recorder ---------- */
  const ACTION_LIMIT = 50;
  let actionCount = 0;
  let lastInputSig = '';

  function buildSelector(el) {
    try {
      if (!el || el.nodeType !== 1) return null;
      if (el.id) return `#${String(el.id).replace(/[^\w-]/g, '')}`;
      const classes = Array.from(el.classList || [])
        .filter((c) => /^[a-zA-Z_-]+$/.test(c))
        .slice(0, 2);
      if (classes.length) return `.${classes.join('.')}`;
      if (el.tagName) {
        const parent = el.parentElement;
        if (parent) {
          const idx = Array.from(parent.children).indexOf(el) + 1;
          return `${el.tagName.toLowerCase()}:nth-of-type(${idx})`;
        }
        return el.tagName.toLowerCase();
      }
      return null;
    } catch (_) {
      return null;
    }
  }

  function recordAction(action, target, value, type) {
    if (actionCount++ > ACTION_LIMIT) return;
    const selector = buildSelector(target);
    const isPassword = (target && (target.type === 'password' || target.getAttribute && target.getAttribute('type') === 'password'));
    const payload = {
      type: 'action',
      action,
      selector,
      value: isPassword ? '[redacted]' : String(value == null ? '' : value).slice(0, 500),
      type: isPassword ? 'password' : type,
      url: location.href,
      timestamp: now(),
    };
    if (action === 'input') {
      const sig = `${selector}|${payload.value}`;
      if (sig === lastInputSig) return;
      lastInputSig = sig;
    }
    send(payload);
  }

  document.addEventListener(
    'click',
    (e) => {
      const t = e.target && e.target.closest ? e.target.closest('button,a,input,select,textarea,[role="button"],[onclick]') : e.target;
      if (t) recordAction('click', t, (t.innerText || t.value || '').trim().slice(0, 60));
    },
    true
  );

  document.addEventListener(
    'input',
    (e) => {
      const t = e.target;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT')) {
        recordAction('input', t, t.type === 'password' ? '[redacted]' : String(t.value || ''), t.type || 'text');
      }
    },
    true
  );

  document.addEventListener(
    'keydown',
    (e) => {
      if (e.key === 'Enter') {
        const t = e.target;
        if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) {
          recordAction('keydown', t, 'Enter');
        }
      }
    },
    true
  );

  document.addEventListener(
    'submit',
    (e) => {
      if (e.target) recordAction('submit', e.target, e.target.getAttribute('action') || '');
    },
    true
  );

  const nativePushState = history.pushState;
  history.pushState = function (...args) {
    send({ type: 'action', action: 'navigate', value: location.href, selector: null, timestamp: now() });
    return nativePushState.apply(this, args);
  };
  window.addEventListener('popstate', () => {
    send({ type: 'action', action: 'navigate', value: location.href, selector: null, timestamp: now() });
  });
})();
