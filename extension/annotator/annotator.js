(() => {
  'use strict';
  const DEFAULT_API = 'http://localhost:8787';
  const SCREENSHOT_KEY = 'bt_pending_screenshot';

  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d');
  const wrap = document.getElementById('canvasWrap');
  const hintText = document.getElementById('hintText');
  const doneScreen = document.getElementById('doneScreen');

  let settings = { apiBase: DEFAULT_API, reporter: '' };
  let img = null;
  let annotations = [];
  let activeTool = 'rect';
  let color = '#e6002e';
  let drawing = false;
  let start = null;
  let draft = null;
  let pendingShot = null;
  let diagnostics = { errors: [], network: [], warnings: [], mixed: [] };
  let pageMeta = {};

  const HINTS = {
    rect: 'Drag to draw a rectangle around the problem',
    arrow: 'Drag to point at the problem',
    highlight: 'Drag to highlight an area',
    blur: 'Drag over sensitive information to blur it',
    text: 'Drag an area, then type your text',
  };

  function getPos(event) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const point = event.touches ? event.touches[0] : event;
    return {
      x: (point.clientX - rect.left) * scaleX,
      y: (point.clientY - rect.top) * scaleY,
    };
  }

  function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
  }

  function normalRect() {
    return {
      x: Math.min(start.x, draft.x),
      y: Math.min(start.y, draft.y),
      w: Math.abs(draft.x - start.x),
      h: Math.abs(draft.y - start.y),
    };
  }

  function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!img) return;
    ctx.drawImage(img, 0, 0);

    for (const a of annotations) {
      if (a.type === 'blur') drawBlur(a);
    }

    for (const a of annotations) {
      if (a.type === 'blur') continue;
      drawShape(a);
    }

    if (draft) {
      const d = { ...draft };
      if (d.type === 'blur') drawBlur(d);
      else drawShape(d, true);
    }
  }

  function drawBlur(a) {
    const r = normalRectOf(a);
    if (r.w < 1 || r.h < 1) return;
    ctx.save();
    ctx.filter = 'blur(18px)';
    ctx.drawImage(img, r.x, r.y, r.w, r.h, r.x, r.y, r.w, r.h);
    ctx.restore();
  }

  function normalRectOf(a) {
    if (a.w !== undefined) return a;
    return { x: Math.min(a.x1, a.x2), y: Math.min(a.y1, a.y2), w: Math.abs(a.x2 - a.x1), h: Math.abs(a.y2 - a.y1) };
  }

  function drawShape(a, isDraft) {
    const lw = isDraft ? 2 : 3;
    ctx.save();
    if (a.type === 'rect') {
      const r = normalRectOf(a);
      ctx.strokeStyle = a.color;
      ctx.lineWidth = lw;
      ctx.strokeRect(r.x, r.y, r.w, r.h);
      const m = 5;
      ctx.fillStyle = a.color;
      [[r.x, r.y], [r.x + r.w, r.y], [r.x, r.y + r.h], [r.x + r.w, r.y + r.h]].forEach(([cx, cy]) => {
        ctx.fillRect(cx - m / 2, cy - m / 2, m, m);
      });
    } else if (a.type === 'highlight') {
      const r = normalRectOf(a);
      ctx.globalAlpha = 0.32;
      ctx.fillStyle = a.color;
      ctx.fillRect(r.x, r.y, r.w, r.h);
      ctx.globalAlpha = 1;
      ctx.strokeStyle = a.color;
      ctx.lineWidth = lw;
      ctx.setLineDash([8, 5]);
      ctx.strokeRect(r.x, r.y, r.w, r.h);
      ctx.setLineDash([]);
    } else if (a.type === 'arrow') {
      const x1 = a.x1, y1 = a.y1, x2 = a.x2, y2 = a.y2;
      const angle = Math.atan2(y2 - y1, x2 - x1);
      const len = Math.min(28, Math.hypot(x2 - x1, y2 - y1) * 0.35);
      ctx.strokeStyle = a.color;
      ctx.lineWidth = lw;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      ctx.fillStyle = a.color;
      ctx.beginPath();
      ctx.moveTo(x2, y2);
      ctx.lineTo(x2 - len * Math.cos(angle - 0.5), y2 - len * Math.sin(angle - 0.5));
      ctx.lineTo(x2 - len * Math.cos(angle + 0.5), y2 - len * Math.sin(angle + 0.5));
      ctx.closePath();
      ctx.fill();
    } else if (a.type === 'text') {
      const size = Math.max(16, (a.w || 60) * 0.28);
      ctx.font = `700 ${size}px "Space Mono", monospace`;
      ctx.lineWidth = size * 0.35;
      ctx.strokeStyle = '#ffffff';
      ctx.strokeText(a.text, a.x1, a.y1 + size);
      ctx.fillStyle = a.color;
      ctx.fillText(a.text, a.x1, a.y1 + size);
      ctx.beginPath();
      ctx.arc(a.x1, a.y1, 4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function commitDraft() {
    if (!draft) return;
    const d = draft;
    if (d.type === 'rect' || d.type === 'highlight') {
      const r = normalRect();
      if (r.w < 4 || r.h < 4) return;
      annotations.push({ type: d.type, color: d.color, x1: r.x, y1: r.y, x2: r.x + r.w, y2: r.y + r.h });
    } else if (d.type === 'blur') {
      const r = normalRect();
      const min = 14;
      const x = r.x - min / 2, y = r.y - min / 2, w = r.w + min, h = r.h + min;
      annotations.push({ type: 'blur', x1: clamp(x, 0, canvas.width), y1: clamp(y, 0, canvas.height), x2: clamp(x + w, 0, canvas.width), y2: clamp(y + h, 0, canvas.height) });
    } else if (d.type === 'arrow') {
      annotations.push({ type: 'arrow', color: d.color, x1: start.x, y1: start.y, x2: draft.x, y2: draft.y });
    } else if (d.type === 'text') {
      const r = normalRect();
      const text = prompt('Annotation text:') || '';
      if (text.trim()) {
        annotations.push({ type: 'text', color: d.color, x1: r.x, y1: r.y, w: Math.max(60, r.w), text: text.trim().slice(0, 120) });
      }
    }
    draft = null;
    render();
  }

  /* ---------- events ---------- */
  function onDown(e) {
    e.preventDefault();
    if (!img) return;
    const p = getPos(e);
    drawing = true;
    start = p;
    draft = { type: activeTool, color, x1: p.x, y1: p.y, x2: p.x, y2: p.y };
    if (activeTool === 'blur') {
      const s = 7;
      draft = { type: 'blur', color, x1: p.x - s, y1: p.y - s, x2: p.x + s, y2: p.y + s };
    }
  }

  function onMove(e) {
    if (!drawing || !draft) return;
    e.preventDefault();
    const p = getPos(e);
    draft.x2 = p.x;
    draft.y2 = p.y;
    render();
  }

  function onUp(e) {
    if (!drawing) return;
    drawing = false;
    commitDraft();
  }

  canvas.addEventListener('mousedown', onDown);
  canvas.addEventListener('mousemove', onMove);
  window.addEventListener('mouseup', onUp);
  canvas.addEventListener('touchstart', onDown, { passive: false });
  canvas.addEventListener('touchmove', onMove, { passive: false });
  canvas.addEventListener('touchend', onUp);

  /* ---------- toolbar ---------- */
  document.querySelectorAll('.an-tool[data-tool]').forEach((btn) => {
    btn.addEventListener('click', () => {
      activeTool = btn.dataset.tool;
      document.querySelectorAll('.an-tool').forEach((b) => b.classList.remove('is-active'));
      btn.classList.add('is-active');
      hintText.textContent = HINTS[activeTool];
      canvas.style.cursor = activeTool === 'text' ? 'text' : 'crosshair';
    });
  });

  document.getElementById('colorPicker').addEventListener('input', (e) => {
    color = e.target.value;
  });

  document.getElementById('undoBtn').addEventListener('click', () => {
    annotations.pop();
    render();
  });

  document.getElementById('clearBtn').addEventListener('click', () => {
    annotations = [];
    render();
  });

  document.getElementById('downloadBtn').addEventListener('click', () => {
    const a = document.createElement('a');
    a.download = 'bugtrack-annotated.png';
    a.href = canvas.toDataURL('image/png');
    a.click();
  });

  /* ---------- priority ---------- */
  document.querySelectorAll('.an-prio').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.an-prio').forEach((b) => b.removeAttribute('data-selected'));
      btn.setAttribute('data-selected', 'true');
    });
  });
  document.querySelector('.an-prio[data-value="medium"]').setAttribute('data-selected', 'true');

  /* ---------- load ---------- */
  async function load() {
    const stored = (await chrome.storage.local.get(['bt_api_base', 'bt_reporter'])) || {};
    settings.apiBase = stored.bt_api_base || DEFAULT_API;
    settings.reporter = stored.bt_reporter || '';
    document.getElementById('anReporter').value = settings.reporter;

    const shot = (await chrome.storage.session.get(SCREENSHOT_KEY))[SCREENSHOT_KEY];
    const diag = (await chrome.storage.session.get('bt_diag'))['bt_diag'] || {};

    diagnostics.errors = diag.errors || [];
    diagnostics.network = diag.network || [];
    diagnostics.warnings = diag.warnings || [];
    diagnostics.mixed = diag.mixed || [];
    pageMeta = { url: (shot && shot.url) || diag.meta && diag.meta.url || '', pageTitle: (shot && shot.title) || (diag.meta && diag.meta.pageTitle) || '' };

    document.getElementById('diagErrors').textContent = diagnostics.errors.length;
    document.getElementById('diagNet').textContent = diagnostics.network.length;
    document.getElementById('diagMixed').textContent = diagnostics.mixed.length;

    if (!shot || !shot.dataUrl) {
      hintText.textContent = 'No screenshot available — go back to the page and press "Capture & Annotate".';
      return;
    }
    pendingShot = shot;

    const image = new Image();
    image.onload = () => {
      img = image;
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      fitToWindow();
      render();
    };
    image.src = shot.dataUrl;
  }

  function fitToWindow() {
    const stage = document.querySelector('.an-stage');
    const maxW = stage.clientWidth - 48;
    const maxH = stage.clientHeight - 60;
    const scale = Math.min(1, maxW / canvas.width, maxH / canvas.height);
    canvas.style.width = canvas.width * scale + 'px';
    canvas.style.height = canvas.height * scale + 'px';
  }

  window.addEventListener('resize', () => {
    if (img) fitToWindow();
  });

  /* ---------- submit ---------- */
  function showStatus(message, ok) {
    const status = document.getElementById('status');
    status.hidden = false;
    status.textContent = (ok ? '✔ ' : '✕ ') + message;
    status.style.background = ok ? '#00856f' : '#e6002e';
    setTimeout(() => { status.hidden = true; }, 6000);
  }

  function priorityFor(status) {
    if (status >= 500) return 'critical';
    if (status >= 400) return 'high';
    return 'medium';
  }

  async function submit() {
    const title = document.getElementById('anTitle').value.trim();
    if (!title) {
      showStatus('Give the bug a title first.', false);
      return;
    }
    if (!img) {
      showStatus('Nothing to submit — no screenshot captured.', false);
      return;
    }
    render();
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    const priority = document.querySelector('.an-prio[data-selected="true"]')?.dataset.value || 'medium';
    const reporter = document.getElementById('anReporter').value.trim() || 'Anonymous';

    const extra = (await chrome.storage.session.get('bt_report_extra'))['bt_report_extra'] || {};

    const payload = {
      title,
      description: document.getElementById('anDesc').value.trim(),
      priority,
      reporter,
      page: {
        url: pageMeta.url,
        pageTitle: pageMeta.pageTitle,
        hostname: safeHostname(pageMeta.url),
        element: extra.element || undefined,
      },
      browser: await collectBrowser(),
      diagnostics: {
        errors: diagnostics.errors,
        network: diagnostics.network.map((n) => ({ ...n, priorityHint: priorityFor(n.status) })),
        warnings: diagnostics.warnings,
        mixed: diagnostics.mixed,
      },
      summary: {
        errorCount: diagnostics.errors.length,
        networkCount: diagnostics.network.length,
        warningCount: diagnostics.warnings.length,
        mixedCount: diagnostics.mixed.length,
      },
      reproduction: { steps: (extra.actions || []).slice(0, 80) },
      health: extra.health || undefined,
      element: extra.element || undefined,
      screenshot: {
        mime: 'image/jpeg',
        dataUrl,
        annotations,
      },
    };

    const btn = document.getElementById('submitBtn');
    btn.disabled = true;
    btn.textContent = 'Submitting…';
    try {
      const res = await fetch(`${settings.apiBase}/api/bugs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showStatus(`API ${res.status}: ${data.error || data.message || 'unknown'}`, false);
        btn.disabled = false;
        btn.textContent = 'Submit Report ➔';
        return;
      }
      document.getElementById('doneId').textContent = data.data.bugId;
      doneScreen.hidden = false;
      await chrome.storage.session.remove(SCREENSHOT_KEY);
      await chrome.storage.session.remove('bt_diag');
      await chrome.storage.session.remove('bt_report_extra');
    } catch (_) {
      showStatus(`Cannot reach ${settings.apiBase} — is the server running?`, false);
      btn.disabled = false;
      btn.textContent = 'Submit Report ➔';
    }
  }

  function collectBrowser() {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ type: 'BT_COLLECT' }, (resp) => {
        if (resp && resp.ok && resp.report && resp.report.env) {
          resolve(resp.report.env);
        } else {
          resolve({ userAgent: navigator.userAgent, platform: 'unknown', language: navigator.language, screenResolution: screen.width + 'x' + screen.height, viewport: 'unknown' });
        }
      });
    });
  }

  function safeHostname(url) {
    try {
      return new URL(url).hostname;
    } catch (_) {
      return '';
    }
  }

  document.getElementById('submitBtn').addEventListener('click', submit);
  document.getElementById('doneOpen').addEventListener('click', () => {
    chrome.tabs.create({ url: settings.apiBase.replace(/\/+$/, '') });
  });
  document.getElementById('doneClose').addEventListener('click', () => {
    window.close();
  });

  document.getElementById('anReporter').addEventListener('change', () => {
    settings.reporter = document.getElementById('anReporter').value;
    chrome.storage.local.set({ bt_reporter: settings.reporter });
  });

  load();
})();
