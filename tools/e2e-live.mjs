const BASE = 'http://localhost:8787';

const results = [];
function check(name, cond, extra = '') {
  results.push({ name, pass: !!cond, extra });
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${extra ? '  ·  ' + extra : ''}`);
}

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720"><rect width="1280" height="720" fill="#f3f0e8"/><rect x="720" y="540" width="140" height="48" fill="#e6002e"/><text x="790" y="570" fill="#fff" font-size="24" text-anchor="middle">Pay now</text></svg>`;

function makePayload(title, suffix) {
  return {
    title,
    description: 'Clicked Pay now on the cart page; the request to the checkout API fails with a server error and the spinner never resolves.',
    priority: 'critical',
    reporter: 'alice@example.com',
    page: {
      url: 'https://shop.example.com/cart',
      pageTitle: 'Cart — Shop',
      favIconUrl: 'https://shop.example.com/favicon.ico',
      hostname: 'shop.example.com',
    },
    browser: {
      name: 'Chrome',
      version: '131.0.0.0',
      os: 'Windows',
      deviceType: 'desktop',
      language: 'en-US',
      resolution: '1920x1080',
      referrer: 'https://shop.example.com/',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/131.0.0.0',
    },
    diagnostics: {
      errors: [
        {
          level: 'error',
          message: "Uncaught (in promise) TypeError: Cannot read properties of undefined (reading 'orderId')",
          source: 'checkout.41af22.js',
          lineno: 214,
          colno: 8,
          stack: "TypeError: Cannot read properties of undefined (reading 'orderId')\n    at Checkout.placeOrder (checkout.41af22.js:214:8)\n    at https://shop.example.com/checkout.41af22.js:300:14",
        },
      ],
      network: [
        { method: 'POST', url: 'https://api.example.com/v1/checkout', status: 500, statusText: 'Internal Server Error', durationMs: 1423, initiator: 'checkout.41af22.js', error: 'HTTP 500' },
        { method: 'GET', url: 'https://fonts.gstatic.com/roboto.woff2', status: 0, statusText: '', durationMs: 0, initiator: 'index.html' },
      ],
      warnings: [
        { level: 'warning', message: 'Consider using the async clipboard API', source: 'checkout.41af22.js', lineno: 12 },
      ],
      mixed: [
        { message: 'Mixed Content: insecure element requested over HTTPS', url: 'https://cdn.example.com/img.png' },
      ],
    },
    summary: { errorCount: 1, networkCount: 2, warningCount: 1, mixedCount: 1 },
    reproduction: {
      steps: [
        { action: 'navigate', url: 'https://shop.example.com/cart' },
        { action: 'click', selector: '#item-42 .qty-plus' },
        { action: 'input', selector: '#promo', type: 'text', value: 'SAVE20' },
        { action: 'input', selector: '#pw', type: 'password', value: 'hunter2secret' },
        { action: 'click', selector: 'button[data-testid=pay-now]' },
        { action: 'submit', selector: '#checkout-form' },
      ],
    },
    health: {
      scores: { performance: 71, accessibility: 88, security: 74, seo: 95, javascript: 100 },
      issues: [
        { severity: 'high', category: 'security', message: 'Missing Content-Security-Policy header', detail: 'No CSP header found on response.' },
        { severity: 'medium', category: 'performance', message: 'Largest Contentful Paint above threshold', detail: 'LCP 3.8s' },
        { severity: 'low', category: 'accessibility', message: 'Image missing alt attribute', detail: '<img id="banner">' },
      ],
    },
    element: {
      tagName: 'BUTTON',
      selector: 'button[data-testid=pay-now]',
      id: '',
      classes: ['btn', 'btn-primary'],
      dimensions: { width: 164, height: 48 },
      position: { x: 720, y: 560 },
      visibility: 'visible',
      events: ['click'],
      text: 'Pay now',
    },
    screenshot: {
      mime: 'image/svg+xml',
      dataUrl: 'data:image/svg+xml;base64,' + Buffer.from(svg).toString('base64'),
      annotations: [{ type: 'rect', color: '#e6002e', x1: 700, y1: 540, x2: 870, y2: 605 }],
    },
    _suffix: suffix,
  };
}

async function post(payload) {
  const res = await fetch(`${BASE}/api/bugs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const text = await res.text();
  const json = text ? JSON.parse(text) : {};
  if (res.status >= 400) console.log('  [post] body:', text.slice(0, 1200));
  return { status: res.status, json };
}

async function main() {
  const a = makePayload('Checkout "Pay now" returns HTTP 500 on /v1/checkout', 'A');

  const first = await post(a);
  check('create returns 2xx', first.status >= 200 && first.status < 300, `status=${first.status}`);
  const d = first.json.data || {};
  check('bug created with id', !!d.bugId, d.bugId);
  check('not a duplicate', d.duplicate === false);
  check('bugId sequential format BUG-1xxx', /^BUG-\d{4}$/.test(d.bugId), d.bugId);
  const bugId = d.bugId;

  check('analysis.issue generated', !!d.analysis && d.analysis.issue, d.analysis && d.analysis.issue);
  check('analysis.confidence numeric', typeof d.analysis?.confidence === 'number');
  check('analysis.endpoint = /v1/checkout', d.analysis?.endpoint === '/v1/checkout');
  check('analysis.likelyLocation present', !!d.analysis?.likelyLocation?.fileName);
  check('analysis.suggestions array', Array.isArray(d.analysis?.suggestions) && d.analysis.suggestions.length > 0);
  check('humanSteps present for annotator', Array.isArray(d.humanSteps) && d.humanSteps.length > 0, `(${d.humanSteps?.length} steps)`);
  check('reproduction.playwright generated', !!d.reproduction?.playwright, `(${d.reproduction?.playwright?.length} chars)`);
  check('playwright redacts password', !/(hunter2|secret)/.test(d.reproduction?.playwright || ''));
  check('screenshot stored', !!d.screenshotUrl, d.screenshotUrl);
  check('repro steps stored (6)', d.reproduction?.steps?.length === 6);
  check('element attached', d.element?.selector === 'button[data-testid=pay-now]');
  check('health scores attached', d.health?.scores?.security === 74);

  const full = await (await fetch(`${BASE}/api/bugs/${bugId}`)).json();
  const f = full.data || {};
  check('getBug round-trip', f.bugId === bugId && f.analysis?.issue);
  check('screenshot annotations saved', f.screenshot?.annotations?.length === 1, JSON.stringify(f.screenshot?.annotations?.[0]?.type));

  const shot = await fetch(`${BASE}${f.screenshotUrl}`);
  const shotBody = await shot.text();
  check('screenshot served with SVG', shot.status === 200 && shotBody.includes('<svg'), `status=${shot.status}, ${shotBody.length}b`);

  // Dedup: identical diagnostics -> duplicate, not a new bug
  const dup = await post(makePayload('Checkout "Pay now" returns HTTP 500 on /v1/checkout', 'A-dup'));
  const dd = dup.json.data || {};
  check('duplicate detected', dd.duplicate === true, `groupedWith=${dd.groupedWith}`);
  check('grouped with original', dd.groupedWith === bugId);
  check('occurrences incremented (1->2)', dd.occurrences === 2, `occurrences=${dd.occurrences}`);

  // Different diagnostics -> new bug
  const bPayload = makePayload('Another unrelated bug', 'B');
  bPayload.diagnostics.errors[0].message = 'ReferenceError: somethingElse is not defined';
  bPayload.diagnostics.errors[0].stack = 'ReferenceError: somethingElse is not defined\n    at app.77ac12.js:1:1';
  bPayload.diagnostics.network = [{ method: 'GET', url: 'https://api.example.com/v1/users', status: 404, statusText: 'Not Found', durationMs: 90, initiator: 'app.77ac12.js' }];
  bPayload.diagnostics.mixed = [];
  const second = await post(bPayload);
  const sd = second.json.data || {};
  check('different bug not deduped', sd.duplicate === false && sd.bugId !== bugId, sd.bugId);
  const bugId2 = sd.bugId;

  // Update -> history
  const up = await (await fetch(`${BASE}/api/bugs/${bugId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'in_progress', priority: 'high', assignee: 'dev-rama' }),
  })).json();
  const ud = up.data || {};
  check('update applied', ud.status === 'in_progress' && ud.priority === 'high' && ud.assignee === 'dev-rama');
  check('history has updated entry', ud.history?.some((h) => h.action === 'updated' && h.field === 'status'));

  // Comment
  const cm = await (await fetch(`${BASE}/api/bugs/${bugId}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ author: 'dev-rama', body: 'Reproduced locally — API swallows the DB error.' }),
  })).json();
  check('comment added', (cm.data?.comments || []).some((c) => c.body.includes('swallows')), `count=${cm.data?.comments?.length}`);

  // Explain
  const ex = await (await fetch(`${BASE}/api/explain`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ kind: 'network', entry: { status: 500, method: 'POST', url: 'https://api.example.com/v1/checkout' } }),
  })).json();
  check('explain returns diagnosis', ex.data?.summary && ex.data.confidence === 0.87, ex.data?.summary);

  // Cleanup
  for (const id of [bugId, bugId2]) {
    const del = await fetch(`${BASE}/api/bugs/${id}`, { method: 'DELETE' });
    check(`cleanup DELETE ${id}`, del.status === 200);
  }

  const failed = results.filter((r) => !r.pass).length;
  console.log(`\n==== ${results.length - failed}/${results.length} checks passed ====`);
  process.exit(failed ? 1 : 0);
}

main().catch((e) => {
  console.error('SCRIPT ERROR:', e.message);
  process.exit(1);
});
