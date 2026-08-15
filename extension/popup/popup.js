(() => {
  'use strict';
  const DEFAULT_API = 'http://localhost:8787';
  const $ = (id) => document.getElementById(id);

  let report = null;
  let settings = { apiBase: DEFAULT_API, reporter: '' };
  let pickedElement = null;
  let healthScan = null;

  const el = {
    pageIcon: $('pageIcon'),
    pageTitle: $('pageTitle'),
    pageUrl: $('pageUrl'),
    mErrors: $('mErrors'),
    mNetwork: $('mNetwork'),
    mWarnings: $('mWarnings'),
    mMixed: $('mMixed'),
    feedSection: $('feedSection'),
    feedCount: $('feedCount'),
    feedList: $('feedList'),
    actionsSection: $('actionsSection'),
    actionsCount: $('actionsCount'),
    actionsList: $('actionsList'),
    elementPanel: $('elementPanel'),
    elementBody: $('elementBody'),
    healthPanel: $('healthPanel'),
    healthBody: $('healthBody'),
    title: $('btTitle'),
    desc: $('btDesc'),
    reporter: $('btReporter'),
    btnReport: $('btnReport'),
    btnCapture: $('btnCapture'),
    btnInspect: $('btnInspect'),
    btnScan: $('btnScan'),
    status: $('status'),
    refreshBtn: $('refreshBtn'),
    explainBox: $('explainBox'),
    explainBody: $('explainBody'),
  };

  function sendToBackground(message) {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(message, (resp) => resolve(resp || { ok: false }));
    });
  }

  function sendToTab(message) {
    return new Promise((resolve) => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (!tabs[0] || !tabs[0].id) return resolve({ ok: false });
        chrome.tabs.sendMessage(tabs[0].id, message, (resp) => resolve(resp || { ok: false, error: 'No page listening' }));
      });
    });
  }

  async function loadSettings() {
    const stored = (await chrome.storage.local.get(['bt_api_base', 'bt_reporter'])) || {};
    settings.apiBase = stored.bt_api_base || DEFAULT_API;
    settings.reporter = stored.bt_reporter || '';
    el.reporter.value = settings.reporter;
  }

  function hostnameOf(url) {
    try {
      return new URL(url).hostname;
    } catch (_) {
      return url || 'unknown';
    }
  }

  function feedBadge(kind) {
    if (kind === 'network') return { cls: 'net', label: 'HTTP' };
    if (kind === 'mixed') return { cls: 'mix', label: 'MIX' };
    if (kind === 'warn') return { cls: 'warn', label: 'WRN' };
    return { cls: 'err', label: 'ERR' };
  }

  function feedText(kind, entry) {
    if (kind === 'network') {
      const failed = entry.status === 0;
      return `${failed ? '✕' : ''} ${entry.method} ${entry.url} → ${failed ? 'network error' : entry.status + ' ' + entry.statusText}`;
    }
    if (kind === 'mixed') return entry.message || `Mixed content: ${entry.url}`;
    if (kind === 'warn') return entry.message || '';
    const src = entry.source ? ` — ${entry.source}${entry.lineno ? ':' + entry.lineno : ''}` : '';
    return `${entry.message}${src}`;
  }

  function renderReport() {
    if (!report || !report.tab) return;
    const d = report.diagnostics;
    el.pageTitle.textContent = report.tab.title || 'Untitled page';
    el.pageUrl.textContent = report.tab.url || '';
    try {
      const u = new URL(report.tab.url || '');
      el.pageIcon.textContent = (u.hostname[0] || '?').toUpperCase();
    } catch (_) {
      el.pageIcon.textContent = '?';
    }

    el.mErrors.textContent = d.errors.length;
    el.mNetwork.textContent = d.network.length;
    el.mWarnings.textContent = d.warnings.length;
    el.mMixed.textContent = d.mixed.length;

    const items = [
      ...d.errors.map((e) => ({ kind: 'err', entry: e })),
      ...d.network.map((e) => ({ kind: 'network', entry: e })),
      ...d.warnings.map((e) => ({ kind: 'warn', entry: e })),
      ...d.mixed.map((e) => ({ kind: 'mixed', entry: e })),
    ].slice(0, 30);

    el.feedSection.hidden = items.length === 0;
    el.feedCount.textContent = items.length + ' signals';
    el.feedList.innerHTML = '';
    items.forEach(({ kind, entry }) => {
      const li = document.createElement('li');
      li.className = 'bt-feed-item';
      const badge = feedBadge(kind);
      li.innerHTML = `
        <span class="bt-feed-badge ${badge.cls}">${badge.label}</span>
        <span class="bt-feed-text"></span>`;
      li.querySelector('.bt-feed-text').textContent = feedText(kind, entry);
      li.title = feedText(kind, entry);
      li.addEventListener('click', () => showExplain(kind, entry));
      el.feedList.appendChild(li);
    });

    const actions = d.actions || [];
    el.actionsSection.hidden = actions.length === 0;
    el.actionsCount.textContent = actions.length + ' actions';
    el.actionsList.innerHTML = '';
    const icons = { click: '🖱', input: '⌨', keydown: '⏎', submit: '📮', navigate: '➜' };
    actions.forEach((a) => {
      const li = document.createElement('li');
      li.className = 'bt-feed-item';
      const value = a.action === 'input' ? (a.type === 'password' ? ' ••••••' : ` → "${a.value}"`) : a.action === 'keydown' ? ` ${a.value}` : '';
      li.innerHTML = `<span class="bt-feed-badge mix">${icons[a.action] || '·'}</span><span class="bt-feed-text"></span>`;
      li.querySelector('.bt-feed-text').textContent = `${a.action} ${a.selector || ''}${value}`;
      li.title = li.querySelector('.bt-feed-text').textContent;
      el.actionsList.appendChild(li);
    });

    const canReport = d.errors.length + d.network.length > 0;
    el.btnReport.disabled = !canReport;
    if (!canReport && !el.title.value) {
      el.title.placeholder = 'Describe the bug… (no errors detected yet)';
    }
  }

  function autoSuggestTitle() {
    if (!report || el.title.value) return;
    const d = report.diagnostics;
    if (d.network.length) {
      const n = d.network[0];
      el.title.value = `${n.method} ${new URL(n.url, 'http://x').pathname} returns ${n.status}`;
      return;
    }
    if (d.errors.length) {
      const e = d.errors[0];
      el.title.value = (e.message || 'JavaScript error').slice(0, 120);
    }
  }

  function selectedPriority() {
    return document.querySelector('.bt-prio[data-selected="true"]')?.dataset.value || 'medium';
  }

  function priorityFor(status) {
    if (status >= 500) return 'critical';
    if (status === 404) return 'medium';
    if (status >= 400) return 'high';
    return 'medium';
  }

  /* ------------------------------------------------------------------ */
  /* Local explainer — mirrors the server analysis engine                */
  /* ------------------------------------------------------------------ */

  function explainError(kind, entry) {
    const m = (entry && entry.message) || '';
    if (kind === 'network') {
      const s = entry.status;
      if (s >= 500) return { title: `Server error — HTTP ${s}`, cause: 'The server threw an unhandled error for this request, often because input validation is missing before database/service code runs.', conf: '87%', suggestions: ['Add request validation before accessing nested payload fields', 'Inspect server logs for the stack'] };
      if (s === 404) return { title: 'HTTP 404 — resource not found', cause: 'The endpoint or asset no longer exists, was renamed, or the path changed.', conf: '82%', suggestions: ['Restore or redirect the missing resource'] };
      if (s === 401) return { title: 'HTTP 401 — authentication failed', cause: 'The request carried no valid token, or the session/token expired.', conf: '84%', suggestions: ['Refresh the access token', 'Redirect to login on 401'] };
      if (s === 429) return { title: 'HTTP 429 — rate limited', cause: 'The client exceeded the API rate limit.', conf: '85%', suggestions: ['Implement exponential backoff', 'Respect Retry-After'] };
      if (s === 0) return { title: 'Request failed before a response', cause: 'CORS blocked the request, it was aborted, or the resource was unreachable.', conf: '76%', suggestions: ['Check server CORS config', 'Verify DNS/endpoint reachability'] };
      return { title: `Failed request — HTTP ${s || 'unknown'}`, cause: 'The server returned an error status for this request.', conf: '60%', suggestions: ['Check the API contract for this status'] };
    }
    if (/cannot read propert\w+ of undefined/i.test(m)) return { title: 'Property read on undefined', cause: 'An API response, selector result or object was undefined when a property was accessed.', conf: '87%', suggestions: ['Validate the API response before nested access', 'Use optional chaining: data?.user?.email'] };
    if (/cannot read propert\w+ of null/i.test(m)) return { title: 'Property read on null', cause: 'A DOM lookup or data field returned null and a property was accessed on it.', conf: '85%', suggestions: ['Guard with a null check', 'Use a safe default'] };
    if (/is not defined/i.test(m)) return { title: 'ReferenceError — identifier not in scope', cause: 'A variable was used before declaration or never imported.', conf: '90%', suggestions: ['Add the missing import', 'Check script load order'] };
    if (/is not a function/i.test(m)) return { title: 'TypeError — called a non-function', cause: 'A method was expected but the value holds an object, string or undefined.', conf: '86%', suggestions: ['Verify library version', 'Polyfill the missing method'] };
    if (/failed to fetch|networkerror/i.test(m)) return { title: 'Network request failed', cause: 'CORS, offline state, or an unreachable endpoint.', conf: '78%', suggestions: ['Check CORS headers', 'Check for service-worker interference'] };
    if (/unhandled promise rejection/i.test(m)) return { title: 'Unhandled promise rejection', cause: 'An async operation failed and no catch handled it.', conf: '82%', suggestions: ['Add try/catch around the async call'] };
    if (/deprecated/i.test(m)) return { title: 'Deprecated API in use', cause: 'The page uses a deprecated browser API.', conf: '90%', suggestions: ['Migrate to the replacement API'] };
    return { title: 'JavaScript exception', cause: 'An exception was thrown during script execution.', conf: '60%', suggestions: ['Reproduce with the stack trace'] };
  }

  function showExplain(kind, entry) {
    const ex = explainError(kind, entry);
    el.explainBox.hidden = false;
    el.explainBody.innerHTML = `
      <div class="ex-title">${ex.title}</div>
      <div class="ex-cause">${ex.cause}</div>
      <ul>${ex.suggestions.map((s) => `<li>${s}</li>`).join('')}</ul>
      <div class="ex-conf">confidence ${ex.conf}</div>`;
  }

  /* ------------------------------------------------------------------ */

  async function runInspect() {
    setBusyTool(el.btnInspect, true);
    const resp = await sendToTab({ type: 'BT_PICK_ELEMENT' });
    setBusyTool(el.btnInspect, false);
    if (!resp.ok) {
      showStatus(resp.error || 'Inspect failed — reload the page and retry.', 'err');
      return;
    }
    pickedElement = resp.element;
    renderElement();
    await saveExtra();
  }

  function renderElement() {
    if (!pickedElement) return;
    el.elementPanel.hidden = false;
    el.elementBody.innerHTML = `
      <div class="kv"><b>&lt;${pickedElement.tagName}&gt;</b><span>${pickedElement.selector}</span></div>
      <div class="kv"><b>classes</b><span>${(pickedElement.classes || []).join(' ') || '—'}</span></div>
      <div class="kv"><b>dimensions</b><span>${pickedElement.dimensions.width} × ${pickedElement.dimensions.height} px</span></div>
      <div class="kv"><b>position</b><span>x:${pickedElement.position.x} y:${pickedElement.position.y}</span></div>
      <div class="kv"><b>visibility</b><span>${pickedElement.visibility}</span></div>
      <div class="kv"><b>events</b><span>${(pickedElement.events || []).join(', ') || '—'}</span></div>
      <div class="kv"><b>text</b><span>${pickedElement.text || '—'}</span></div>`;
  }

  async function runScan() {
    setBusyTool(el.btnScan, true);
    const resp = await sendToTab({ type: 'BT_SCAN' });
    setBusyTool(el.btnScan, false);
    if (!resp.ok || !resp.health) {
      showStatus(resp.error || 'Scan failed — reload the page and retry.', 'err');
      return;
    }
    healthScan = resp.health;
    renderHealth();
    await saveExtra();
  }

  function healthCls(v) {
    if (v == null) return '';
    return v < 60 ? 'is-bad' : v < 80 ? 'is-mid' : '';
  }

  function renderHealth() {
    if (!healthScan) return;
    el.healthPanel.hidden = false;
    const scores = healthScan.scores || {};
    const labels = { performance: 'PERF', accessibility: 'A11Y', security: 'SEC', seo: 'SEO', javascript: 'JS' };
    const sevCls = { critical: 'critical', high: 'high', medium: 'medium', low: 'low' };
    el.healthBody.innerHTML = `
      <div class="health-scores">
        ${Object.keys(labels)
          .map(
            (k) =>
              `<div class="health-score ${healthCls(scores[k])}"><b>${scores[k] ?? '—'}</b><span>${labels[k]}</span></div>`
          )
          .join('')}
      </div>
      ${(healthScan.issues || [])
        .map(
          (i) =>
            `<div class="health-issue"><span class="health-sev ${sevCls[i.severity]}">${i.severity.toUpperCase()}</span><span>${i.message}</span></div>`
        )
        .join('')}`;
  }

  async function saveExtra() {
    const d = (report && report.diagnostics) || {};
    await chrome.storage.session.set({
      bt_report_extra: {
        actions: d.actions || [],
        element: pickedElement,
        health: healthScan,
      },
    });
  }

  async function submitReport() {
    const title = el.title.value.trim();
    if (!title) {
      showStatus('Provide a title before submitting.', 'err');
      return;
    }
    const d = report.diagnostics;
    const payload = {
      title,
      description: el.desc.value.trim(),
      priority: selectedPriority(),
      reporter: el.reporter.value.trim() || 'Anonymous',
      page: {
        url: report.tab.url,
        pageTitle: report.tab.title,
        favIconUrl: report.tab.favIconUrl,
        hostname: hostnameOf(report.tab.url),
      },
      browser: report.env,
      diagnostics: {
        errors: d.errors,
        network: d.network.map((n) => ({ ...n, priorityHint: priorityFor(n.status) })),
        warnings: d.warnings,
        mixed: d.mixed,
      },
      summary: {
        errorCount: d.errors.length,
        networkCount: d.network.length,
        warningCount: d.warnings.length,
        mixedCount: d.mixed.length,
      },
      reproduction: { steps: (d.actions || []).slice(0, 80) },
      health: healthScan || undefined,
      element: pickedElement || undefined,
    };
    if (pickedElement) payload.page.element = pickedElement;

    setBusy(true);
    try {
      const res = await fetch(`${settings.apiBase}/api/bugs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showStatus(`API error ${res.status}: ${data.error || data.message || 'unknown'}`, 'err');
        return;
      }
      const msg = data.data.duplicate
        ? `↺ Duplicate of ${data.data.groupedWith} — occurrence #${data.data.occurrences}`
        : `✔ Bug ${data.data.bugId} recorded.`;
      showStatus(msg, data.data.duplicate ? 'err' : 'ok');
      el.btnReport.disabled = true;
      await sendToBackground({ type: 'BT_CLEAR_DIAG' });
      await chrome.storage.session.remove('bt_report_extra');
    } catch (err) {
      showStatus(`Cannot reach server at ${settings.apiBase} — is it running?`, 'err');
    } finally {
      setBusy(false);
    }
  }

  function setBusy(busy) {
    el.btnReport.disabled = busy;
    el.btnReport.textContent = busy ? 'Submitting…' : 'Submit Bug Report';
  }

  function setBusyTool(btn, busy) {
    btn.classList.toggle('is-busy', busy);
    btn.disabled = busy;
  }

  function showStatus(message, kind) {
    el.status.hidden = false;
    el.status.className = 'bt-status ' + (kind || '');
    el.status.textContent = message;
  }

  async function init() {
    await loadSettings();
    document.querySelectorAll('.bt-prio').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.bt-prio').forEach((b) => b.removeAttribute('data-selected'));
        btn.setAttribute('data-selected', 'true');
      });
    });
    document.querySelector('.bt-prio[data-value="medium"]').setAttribute('data-selected', 'true');

    el.reporter.value = settings.reporter;
    el.reporter.addEventListener('change', async () => {
      settings.reporter = el.reporter.value;
      await chrome.storage.local.set({ bt_reporter: settings.reporter });
    });

    const resp = await sendToBackground({ type: 'BT_COLLECT' });
    if (resp.ok) {
      report = resp.report;
      renderReport();
      autoSuggestTitle();
      await saveExtra();
    } else {
      el.pageTitle.textContent = 'Could not read page diagnostics';
      showStatus(resp.error || 'Failed to collect diagnostics', 'err');
    }

    el.btnCapture.addEventListener('click', async () => {
      await saveExtra();
      const r = await sendToBackground({ type: 'BT_CAPTURE' });
      if (r.ok) window.close();
      else showStatus(r.error || 'Capture failed', 'err');
    });

    el.btnReport.addEventListener('click', submitReport);
    el.btnInspect.addEventListener('click', runInspect);
    el.btnScan.addEventListener('click', runScan);

    el.refreshBtn.addEventListener('click', async () => {
      await sendToBackground({ type: 'BT_REFRESH_DIAG' });
      const r = await sendToBackground({ type: 'BT_COLLECT' });
      if (r.ok) {
        report = r.report;
        renderReport();
        autoSuggestTitle();
        await saveExtra();
      }
    });

    $('btnDashboard').addEventListener('click', () => {
      chrome.tabs.create({ url: settings.apiBase.replace(/\/+$/, '') });
    });

    $('btnSettings').addEventListener('click', () => {
      const next = prompt('API server base URL:', settings.apiBase);
      if (next && next.trim()) {
        settings.apiBase = next.trim().replace(/\/+$/, '');
        chrome.storage.local.set({ bt_api_base: settings.apiBase });
        showStatus('API base updated to ' + settings.apiBase, 'ok');
      }
    });

    $('elementClose').addEventListener('click', () => {
      el.elementPanel.hidden = true;
      pickedElement = null;
      saveExtra();
    });
    $('healthClose').addEventListener('click', () => {
      el.healthPanel.hidden = true;
    });
    $('explainClose').addEventListener('click', () => {
      el.explainBox.hidden = true;
    });
  }

  init();
})();
