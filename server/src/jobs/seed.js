/**
 * BUGTRACK seed — wipes the bugs collection and inserts realistic demo data
 * (mirrors the README example: BUG-1042 "Login API returns 500").
 * Usage: npm run seed
 */
import { connectDatabase, disconnectDatabase } from '../database/connection.js';
import { Bug } from '../models/Bug.js';
import { Counter } from '../models/Counter.js';
import { storeScreenshot, ensureUploadDir } from '../services/screenshot.service.js';
import { buildAnalysis, fingerprintDiagnostics, playwrightFromSteps } from '../services/analysis.service.js';
import { logger } from '../utils/logger.js';

const REPORTERS = ['Nilay', 'Ayesha', 'Rohan', 'Priya', 'Marcus', 'Elena', 'Dev', 'Zoe'];
const ASSIGNEES = ['', '', 'Rohan', 'Ayesha', 'Marcus', 'Priya', '', 'Dev', 'Elena'];

function svgPage(title, url, { box = null, lines = 7 } = {}) {
  const lineEls = Array.from({ length: lines }, (_, i) => {
    const w = 60 + ((i * 37) % 35);
    return `<rect x="28" y="${86 + i * 26}" width="${w}%" height="9" rx="4.5" fill="${i % 3 === 2 ? '#ffd9de' : '#e6e1d5'}"/>`;
  }).join('');
  const boxEl = box
    ? `<rect x="${box.x}" y="${box.y}" width="${box.w}" height="${box.h}" fill="none" stroke="#e6002e" stroke-width="5" stroke-dasharray="14 10"/><circle cx="${box.x + 26}" cy="${box.y + 26}" r="26" fill="#e6002e"/><text x="${box.x + 26}" y="${box.y + 33}" font-family="monospace" font-size="30" fill="#fff" text-anchor="middle" font-weight="bold">!</text>`
    : '';
  return (
    'data:image/svg+xml;base64,' +
    Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
<rect width="1280" height="720" fill="#f3f0e8"/>
<rect width="1280" height="52" fill="#17150f"/>
<circle cx="30" cy="26" r="8" fill="#e6002e"/><circle cx="56" cy="26" r="8" fill="#ff7a00"/><circle cx="82" cy="26" r="8" fill="#c99a00"/>
<rect x="110" y="12" width="420" height="28" rx="14" fill="#2c2a20"/>
<text x="130" y="32" font-family="monospace" font-size="15" fill="#f3f0e8">${url}</text>
<rect x="28" y="84" width="1224" height="540" fill="#fff" stroke="#17150f" stroke-width="3"/>
<rect x="56" y="112" width="480" height="34" fill="#17150f"/>
<text x="70" y="135" font-family="monospace" font-size="20" fill="#fff" font-weight="bold">${title}</text>
${lineEls}
<rect x="56" y="${130 + lines * 26}" width="180" height="44" rx="6" fill="#e6002e"/>
<text x="146" y="${158 + lines * 26}" font-family="monospace" font-size="18" fill="#fff" text-anchor="middle">Submit</text>
${boxEl}
</svg>`
    ).toString('base64')
  );
}

function consoleError(message, source, lineno) {
  return {
    level: 'error',
    message,
    source,
    lineno,
    stack: `TypeError\n    at ${source.split('/').pop()}:${lineno}:12\n    at HTMLButtonElement.onclick (${source}:${lineno + 2}:5)`,
    timestamp: new Date().toISOString(),
  };
}

function networkFail(method, url, status, statusText, priorityHint) {
  return {
    url,
    method,
    status,
    statusText,
    durationMs: Math.floor(Math.random() * 900) + 120,
    initiator: 'fetch',
    priorityHint,
    timestamp: new Date().toISOString(),
  };
}

const SEEDS = [
  {
    title: 'Login API returns 500',
    description:
      "Submitting valid credentials on the login form always returns HTTP 500. Reproducible on staging and prod. The request reaches /api/login then crashes — nothing is written to the session store.\n\nSteps:\n1. Open https://app.example.com/login\n2. Enter demo@example.com / demo1234\n3. Press Sign in\n4. Observe 500 and a flash of the error toast.",
    url: 'https://app.example.com/login',
    pageTitle: 'Sign in — Example App',
    project: 'app.example.com',
    priority: 'high',
    status: 'open',
    reporter: 'Nilay',
    assignee: '',
    tags: ['auth', 'api'],
    box: { x: 900, y: 200, w: 260, h: 180 },
    browser: 'Chrome',
    occurrences: 50,
    occurrenceReporters: ['Nilay', 'Ayesha', 'Rohan', 'Priya', 'Marcus', 'Elena', 'Dev', 'Zoe', 'Ira', 'Sam', 'Lea', 'Omar', 'Nina'],
    browsersSeen: ['Chrome', 'Firefox', 'Safari', 'Microsoft Edge'],
    reproSteps: [
      { action: 'navigate', url: 'https://app.example.com/login', at: new Date(Date.now() - 86400000) },
      { action: 'input', selector: '#email', value: 'demo@example.com', type: 'email', at: new Date(Date.now() - 86400000 + 1000) },
      { action: 'input', selector: '#password', value: 'demo1234', type: 'password', at: new Date(Date.now() - 86400000 + 2000) },
      { action: 'click', selector: '#login', at: new Date(Date.now() - 86400000 + 3000) },
    ],
    health: {
      scores: { performance: 84, accessibility: 76, security: 82, seo: 90, javascript: 68 },
      issues: [
        { severity: 'critical', category: 'security', message: 'Missing Content-Security-Policy', detail: 'Response does not include a Content-Security-Policy header.' },
        { severity: 'high', category: 'security', message: 'Missing X-Frame-Options', detail: 'Page can be embedded in frames (clickjacking risk).' },
        { severity: 'medium', category: 'accessibility', message: 'Form inputs missing labels', detail: '3 inputs have no associated <label>.' },
        { severity: 'medium', category: 'security', message: 'Missing Referrer-Policy', detail: 'Referrer leaks query parameters to third parties.' },
        { severity: 'low', category: 'seo', message: 'Missing meta description', detail: 'No meta description tag found.' },
      ],
    },
    diag: {
      errors: [
        consoleError("TypeError: Cannot read properties of undefined (reading 'session')", 'https://app.example.com/assets/login.9f2c1e.js', 214),
        consoleError('Unhandled promise rejection: HTTP 500 on POST /api/login', 'https://app.example.com/assets/login.9f2c1e.js', 221),
      ],
      network: [networkFail('POST', 'https://api.example.com/v1/login', 500, 'Internal Server Error', 'critical')],
      warnings: [],
      mixed: [],
    },
    comments: [
      { author: 'Ayesha', body: 'Confirmed on staging too. Backend logs show a null deref in session store initialization.', createdAt: new Date(Date.now() - 86400000 * 2) },
      { author: 'Nilay', body: 'Also happens on Safari 17, so it is not Chrome-specific.', createdAt: new Date(Date.now() - 86400000 * 1) },
    ],
  },
  {
    title: 'Checkout page loads http images on https (mixed content blocked)',
    description: 'Product thumbnails on the checkout page are served from http://cdn2.example.com and get blocked. Layout breaks.',
    url: 'https://shop.example.com/checkout',
    pageTitle: 'Checkout — Shop',
    project: 'shop.example.com',
    priority: 'critical',
    status: 'open',
    reporter: 'Priya',
    assignee: 'Rohan',
    tags: ['security', 'cdn'],
    box: { x: 560, y: 120, w: 300, h: 220 },
    diag: {
      errors: [],
      network: [],
      warnings: [],
      mixed: [
        { url: 'http://cdn2.example.com/thumb/78412.jpg', message: 'Mixed content: HTTPS page loaded HTTP resource', timestamp: new Date().toISOString() },
        { url: 'http://cdn2.example.com/thumb/78413.jpg', message: 'Mixed content: HTTPS page loaded HTTP resource', timestamp: new Date().toISOString() },
      ],
    },
    comments: [{ author: 'Rohan', body: 'Moving the CDN to https tonight.', createdAt: new Date(Date.now() - 3600000 * 5) }],
  },
  {
    title: 'POST /api/cart returns 503 under load',
    description: 'During peak hours the cart endpoint times out and returns 503. Retry storm on the client.',
    url: 'https://shop.example.com/cart',
    pageTitle: 'Your cart — Shop',
    project: 'shop.example.com',
    priority: 'critical',
    status: 'in_progress',
    reporter: 'Marcus',
    assignee: 'Dev',
    tags: ['api', 'scaling'],
    diag: {
      errors: [consoleError("Uncaught (in promise) HttpError: 503 Service Unavailable", 'https://shop.example.com/assets/cart.3d21ab.js', 88)],
      network: [networkFail('POST', 'https://api.example.com/v1/cart/sync', 503, 'Service Unavailable', 'critical')],
      warnings: [],
      mixed: [],
    },
    comments: [{ author: 'Dev', body: 'Suspect connection pool exhaustion on the cart service. Investigating.', createdAt: new Date(Date.now() - 3600000 * 2) }],
  },
  {
    title: 'Deprecated API warning on dashboard init',
    description: 'Chrome logs a deprecation warning about window.webkitStorageInfo being used by the metrics widget.',
    url: 'https://app.example.com/dashboard',
    pageTitle: 'Dashboard — Example App',
    project: 'app.example.com',
    priority: 'medium',
    status: 'open',
    reporter: 'Zoe',
    assignee: '',
    tags: ['tech-debt'],
    diag: {
      errors: [],
      network: [],
      warnings: [
        { level: 'warn', message: 'Deprecated API: window.webkitStorageInfo is deprecated. Use navigator.storage instead.', timestamp: new Date().toISOString() },
      ],
      mixed: [],
    },
    comments: [],
  },
  {
    title: 'Broken hero image on marketing site (404)',
    description: 'The hero image on the marketing homepage returns 404 after the assets migration.',
    url: 'https://example.com/',
    pageTitle: 'Example — The simplest way to…',
    project: 'example.com',
    priority: 'high',
    status: 'verified',
    reporter: 'Elena',
    assignee: 'Marcus',
    tags: ['assets'],
    box: { x: 200, y: 140, w: 420, h: 240 },
    diag: {
      errors: [],
      network: [networkFail('GET', 'https://example.com/assets/hero-2025.webp', 404, 'Not Found', 'high')],
      warnings: [],
      mixed: [],
    },
    comments: [{ author: 'Marcus', body: 'Fixed on staging; waiting for CDN flush to verify.', createdAt: new Date(Date.now() - 86400000) }],
  },
  {
    title: 'Dashboard chart not rendering on Safari',
    description: 'The revenue chart is blank on Safari 17. Works on Chrome and Firefox. Canvas issue suspected.',
    url: 'https://app.example.com/reports/revenue',
    pageTitle: 'Revenue — Example App',
    project: 'app.example.com',
    priority: 'high',
    status: 'open',
    reporter: 'Ayesha',
    assignee: 'Elena',
    tags: ['frontend', 'safari'],
    diag: {
      errors: [consoleError('TypeError: undefined is not an object (evaluating chart.scales.x)', 'https://app.example.com/assets/reports.7d0be2.js', 156)],
      network: [],
      warnings: [],
      mixed: [],
    },
    comments: [{ author: 'Elena', body: 'Chart.js v4 needs a polyfill here — patching this week.', createdAt: new Date(Date.now() - 3600000 * 20) }],
  },
  {
    title: 'Profile upload form double-submits',
    description: 'Clicking Save rapidly creates two profile updates; the second request races and overwrites the first.',
    url: 'https://app.example.com/settings/profile',
    pageTitle: 'Profile settings — Example App',
    project: 'app.example.com',
    priority: 'medium',
    status: 'in_progress',
    reporter: 'Nilay',
    assignee: 'Priya',
    tags: ['frontend', 'race-condition'],
    diag: {
      errors: [],
      network: [networkFail('PUT', 'https://api.example.com/v1/users/me', 409, 'Conflict', 'high')],
      warnings: [ { level: 'warn', message: 'Possible race condition: request #2 issued before #1 completed', timestamp: new Date().toISOString() } ],
      mixed: [],
    },
    comments: [{ author: 'Priya', body: 'Adding a submit lock + request id for idempotency.', createdAt: new Date(Date.now() - 3600000 * 8) }],
  },
  {
    title: 'Notification badge shows wrong count',
    description: 'Unread count is 3 but badge shows 7. Re-fetch after polling does not reconcile the counter.',
    url: 'https://app.example.com/notifications',
    pageTitle: 'Notifications — Example App',
    project: 'app.example.com',
    priority: 'low',
    status: 'open',
    reporter: 'Rohan',
    assignee: '',
    tags: ['ui'],
    diag: { errors: [], network: [], warnings: [], mixed: [] },
    comments: [],
  },
  {
    title: 'Password reset email never arrives',
    description: 'Reset emails are intermittently dropped. No error in UI — request completes but the mail queue loses the job.',
    url: 'https://app.example.com/forgot-password',
    pageTitle: 'Reset password — Example App',
    project: 'app.example.com',
    priority: 'critical',
    status: 'closed',
    reporter: 'Marcus',
    assignee: 'Dev',
    tags: ['email', 'backend'],
    diag: { errors: [], network: [], warnings: [], mixed: [] },
    comments: [
      { author: 'Dev', body: 'Root cause: mail worker crashed between ack and send. Added DLQ + retry with backoff.', createdAt: new Date(Date.now() - 86400000 * 6) },
      { author: 'Marcus', body: 'Verified on prod — emails arriving now. Closing.', createdAt: new Date(Date.now() - 86400000 * 4) },
    ],
  },
  {
    title: 'Fonts flash (FOUT) on slow networks',
    description: 'Custom display font swaps in late on 3G, causing layout shift on the marketing site.',
    url: 'https://example.com/pricing',
    pageTitle: 'Pricing — Example',
    project: 'example.com',
    priority: 'low',
    status: 'open',
    reporter: 'Zoe',
    assignee: '',
    tags: ['performance'],
    diag: { errors: [], network: [], warnings: [], mixed: [] },
    comments: [],
  },
];

const PRIORITY_MIX = [
  { title: 'Mobile nav overlaps the cookie banner', description: 'On iOS the burger menu renders under the cookie consent bar.', priority: 'medium', status: 'open', project: 'example.com', tags: ['mobile'] },
  { title: 'Search autocomplete returns stale results', description: 'Cached suggestions do not invalidate when products change.', priority: 'medium', status: 'open', project: 'shop.example.com', tags: ['search'] },
  { title: 'Dark-mode toggle not persisted', description: 'Theme resets to light on every navigation in the SPA.', priority: 'low', status: 'open', project: 'app.example.com', tags: ['ui'] },
  { title: 'Webhook retries duplicate invoices', description: 'Stripe webhook processed twice → duplicate invoice emails.', priority: 'high', status: 'open', project: 'api.example.com', tags: ['billing'] },
  { title: 'Table sort breaks with 10k+ rows', description: 'Sorting freezes the tab for several seconds.', priority: 'medium', status: 'in_progress', project: 'app.example.com', tags: ['performance'] },
  { title: 'PDF export missing images', description: 'Images render as blank boxes in exported reports.', priority: 'high', status: 'open', project: 'app.example.com', tags: ['export'] },
  { title: 'VAT field rejects non-EU customers', description: 'VAT number validation runs for non-EU addresses.', priority: 'low', status: 'closed', project: 'shop.example.com', tags: ['validation'] },
  { title: 'Session expires mid-checkout', description: 'Checkout loses cart when the session silently expires.', priority: 'critical', status: 'open', project: 'shop.example.com', tags: ['auth'] },
  { title: 'Admin CSV import silently drops rows', description: 'Rows with unknown currency are skipped without warning.', priority: 'medium', status: 'open', project: 'app.example.com', tags: ['import'] },
  { title: 'Timezone rendered twice in emails', description: 'Booking emails show the time with offset and a timezone label.', priority: 'low', status: 'open', project: 'api.example.com', tags: ['email'] },
];

async function main() {
  await connectDatabase();
  await ensureUploadDir();

  await Bug.deleteMany({});
  await Counter.deleteOne({ _id: 'bug' });
  await Counter.create({ _id: 'bug', seq: 1042 - 1 });

  let created = 0;
  for (const seed of SEEDS) {
    const bugId = `BUG-${1042 + created}`;
    const shot = seed.box
      ? await storeScreenshot(bugId, {
          mime: 'image/svg+xml',
          dataUrl: svgPage(seed.title, seed.url, seed),
          annotations: [{ type: 'rect', color: '#e6002e', x1: 60, y1: 60, x2: 1220, y2: 660 }],
        })
      : null;

    const diag = seed.diag || { errors: [], network: [], warnings: [], mixed: [] };
    const analysis = buildAnalysis({ diagnostics: diag, page: { url: seed.url } });
    const fingerprint = fingerprintDiagnostics(diag);
    const reproSteps =
      seed.reproSteps ||
      (seed.priority === 'high' && seed.status === 'open' && seed.tags && seed.tags.includes('auth')
        ? [
            { action: 'navigate', url: seed.url, at: new Date() },
            { action: 'input', selector: '#email', value: 'demo@example.com', type: 'email', at: new Date() },
            { action: 'input', selector: '#password', value: 'demo1234', type: 'password', at: new Date() },
            { action: 'click', selector: '#login', at: new Date() },
          ]
        : []);
    const playwright = reproSteps.length ? playwrightFromSteps(seed.url, reproSteps) : '';
    const health = seed.health || { scores: {}, issues: [] };

    const createdAt = new Date(Date.now() - (created % 12) * 86400000 - created * 3600000);
    const history = [
      { actor: seed.reporter, action: 'created', to: 'open', at: createdAt },
      ...(seed.assignee
        ? [{ actor: 'dashboard', action: 'updated', field: 'assignee', from: '', to: seed.assignee, at: new Date(createdAt.getTime() + 3600000) }]
        : []),
      ...(seed.status !== 'open'
        ? [{ actor: seed.assignee || 'system', action: 'updated', field: 'status', from: 'open', to: seed.status, at: new Date(createdAt.getTime() + 86400000) }]
        : []),
    ];

    await Bug.create({
      bugId,
      title: seed.title,
      description: seed.description || '',
      project: seed.project,
      url: seed.url,
      pageTitle: seed.pageTitle || seed.title,
      priority: seed.priority,
      status: seed.status,
      reporter: seed.reporter,
      assignee: seed.assignee,
      tags: seed.tags || [],
      browser: {
        browserName: seed.browser || 'Chrome',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/128.0 Safari/537.36',
        platform: 'Win32',
        language: 'en-US',
        screenResolution: '1920x1080',
        viewport: '1536x754',
        devicePixelRatio: 1,
      },
      diagnostics: diag,
      summary: {
        errorCount: diag.errors.length,
        networkCount: diag.network.length,
        warningCount: diag.warnings.length,
        mixedCount: diag.mixed.length,
      },
      screenshot: shot,
      fingerprint: fingerprint || '',
      occurrences: seed.occurrences || 1,
      occurrenceReporters: seed.occurrenceReporters || [seed.reporter],
      browsersSeen: seed.browsersSeen || [seed.browser || 'Chrome'],
      reproduction: { steps: reproSteps, playwright },
      analysis,
      health,
      comments: seed.comments || [],
      history,
      createdAt,
      updatedAt: new Date(createdAt.getTime() + 86400000),
    });
    created++;
  }

  for (const extra of PRIORITY_MIX) {
    const bugId = `BUG-${1042 + created}`;
    const reporter = REPORTERS[created % REPORTERS.length];
    const assignee = ASSIGNEES[created % ASSIGNEES.length];
    const createdAt = new Date(Date.now() - (created % 9) * 86400000 - created * 5400000);
    await Bug.create({
      bugId,
      title: extra.title,
      description: extra.description || '',
      project: extra.project,
      url: `https://${extra.project}`,
      pageTitle: extra.title,
      priority: extra.priority,
      status: extra.status,
      reporter,
      assignee,
      tags: extra.tags || [],
      summary: { errorCount: 0, networkCount: 0, warningCount: 0, mixedCount: 0 },
      comments: [],
      history: [{ actor: reporter, action: 'created', to: 'open', at: createdAt }],
      createdAt,
      updatedAt: createdAt,
    });
    created++;
  }

  const total = await Bug.countDocuments();
  await Counter.findOneAndUpdate({ _id: 'bug' }, { $max: { seq: 1041 + total } }, { upsert: true });
  logger.info(`Seed complete — ${total} bugs inserted (BUG-1042 → BUG-${1041 + total})`);
  await disconnectDatabase();
}

main().catch((err) => {
  logger.error('Seed failed:', err);
  process.exit(1);
});
