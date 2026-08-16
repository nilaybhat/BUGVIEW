import { before, after, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { mkdirSync } from 'node:fs';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { connectDatabase, disconnectDatabase } from '../src/database/connection.js';
import { Bug } from '../src/models/Bug.js';
import { Counter } from '../src/models/Counter.js';
import { createApp } from '../src/app.js';
import request from 'supertest';

let mongod;
let app;

before(async () => {
  const tmpDir = path.join('D:\\', '.cache', 'mongodb-tmp');
  mkdirSync(tmpDir, { recursive: true });
  process.env.TMPDIR = tmpDir;
  process.env.TMP = tmpDir;
  process.env.TEMP = tmpDir;
  const cacheDir = path.join(process.env.MONGOMS_DOWNLOAD_DIR || 'D:\\', '.cache', 'mongodb-binaries');
  mkdirSync(cacheDir, { recursive: true });
  mongod = await MongoMemoryServer.create({ binary: { downloadDir: cacheDir } });
  await connectDatabase(mongod.getUri());
  await Bug.deleteMany({});
  await Counter.deleteMany({});
  await Counter.create({ _id: 'bug', seq: 1042 - 1 });
  app = createApp();
});

after(async () => {
  await disconnectDatabase();
  if (mongod) await mongod.stop();
});

let _unique = 0;

const basePayload = () => {
  _unique += 1;
  const token = `t${_unique}`;
  return {
    title: 'Login API returns 500',
    description: 'Submitting valid credentials returns HTTP 500.',
    priority: 'high',
    reporter: 'Nilay',
    page: { url: `https://app.example.com/login?r=${token}`, pageTitle: 'Sign in', hostname: 'app.example.com' },
    browser: { browserName: 'Chrome', platform: 'Win32', viewport: '1280x720' },
    diagnostics: {
      errors: [
        { level: 'error', message: `TypeError: Cannot read properties of undefined (reading '${token}')`, source: 'login.js', lineno: 12, stack: `TypeError\n    at loginComponent (https://app.example.com/assets/login.9f2c1e.js:214:12)\n    at HTMLButtonElement.onclick` },
      ],
      network: [{ url: `https://api.example.com/v1/login?r=${token}`, method: 'POST', status: 500, statusText: 'Internal Server Error' }],
      warnings: [],
      mixed: [],
    },
  };
};

describe('GET /api/health', () => {
  it('reports healthy', async () => {
    const res = await request(app).get('/api/health').expect(200);
    assert.equal(res.body.ok, true);
  });
});

describe('POST /api/bugs', () => {
  it('creates a bug with a sequential BUG id and derived summary', async () => {
    const res = await request(app).post('/api/bugs').send(basePayload()).expect(201);
    assert.equal(res.body.data.bugId, 'BUG-1042');
    assert.equal(res.body.data.project, 'app.example.com');
    assert.equal(res.body.data.summary.errorCount, 1);
    assert.equal(res.body.data.summary.networkCount, 1);
    assert.equal(res.body.data.priority, 'high');
    assert.equal(res.body.data.status, 'open');
    assert.deepEqual(res.body.data.history[0].action, 'created');
  });

  it('rejects missing title (400)', async () => {
    const res = await request(app).post('/api/bugs').send({ priority: 'low' }).expect(400);
    assert.match(res.body.error, /Validation failed/);
  });

  it('rejects invalid priority (400)', async () => {
    const res = await request(app)
      .post('/api/bugs')
      .send({ ...basePayload(), title: 'x', priority: 'urgent' })
      .expect(400);
    assert.match(res.body.error, /Validation failed/);
  });

  it('caps oversized diagnostic arrays', async () => {
    const payload = basePayload();
    payload.title = 'caps test';
    payload.diagnostics.errors = Array.from({ length: 500 }, (_, i) => ({ level: 'error', message: `err ${i}` }));
    const res = await request(app).post('/api/bugs').send(payload).expect(201);
    assert.ok(res.body.data.summary.errorCount <= 60);
  });
});

describe('GET /api/bugs', () => {
  it('lists bugs with pagination', async () => {
    const res = await request(app).get('/api/bugs?page=1&limit=5').expect(200);
    assert.equal(res.body.data.pagination.limit, 5);
    assert.ok(res.body.data.items.length >= 1);
    assert.ok(res.body.data.items.every((b) => b.bugId));
  });

  it('filters by status and search', async () => {
    const res = await request(app).get('/api/bugs?status=open&search=login').expect(200);
    assert.ok(res.body.data.items.length >= 1);
    assert.ok(res.body.data.items.every((b) => b.status === 'open'));
  });

  it('sorts by priority ascending (critical first)', async () => {
    const res = await request(app).get('/api/bugs?sort=priority-asc&limit=10').expect(200);
    const ranks = res.body.data.items.map((b) => b.priorityRank);
    assert.deepEqual(ranks, [...ranks].sort((a, b) => a - b));
  });
});

describe('GET /api/bugs/:id', () => {
  it('finds by bugId and by _id', async () => {
    const created = await request(app).post('/api/bugs').send({ ...basePayload(), title: 'detail test' }).expect(201);
    const byId = await request(app).get(`/api/bugs/${created.body.data.bugId}`).expect(200);
    assert.equal(byId.body.data.bugId, created.body.data.bugId);
    const byMongo = await request(app).get(`/api/bugs/${created.body.data._id}`).expect(200);
    assert.equal(byMongo.body.data._id, created.body.data._id);
  });

  it('404 for unknown id', async () => {
    await request(app).get('/api/bugs/BUG-999999').expect(404);
  });
});

describe('PATCH /api/bugs/:id', () => {
  it('updates status/priority/assignee and records history', async () => {
    const created = await request(app).post('/api/bugs').send({ ...basePayload(), title: 'patch test' }).expect(201);
    const res = await request(app)
      .patch(`/api/bugs/${created.body.data.bugId}`)
      .send({ status: 'in_progress', assignee: 'Ayesha', priority: 'critical' })
      .expect(200);
    assert.equal(res.body.data.status, 'in_progress');
    assert.equal(res.body.data.assignee, 'Ayesha');
    const events = res.body.data.history.filter((h) => h.action === 'updated');
    assert.ok(events.some((h) => h.field === 'status' && h.from === 'open' && h.to === 'in_progress'));
    assert.ok(events.some((h) => h.field === 'assignee'));
  });

  it('rejects unknown fields (400)', async () => {
    const created = await request(app).post('/api/bugs').send({ ...basePayload(), title: 'strict test' }).expect(201);
    await request(app)
      .patch(`/api/bugs/${created.body.data.bugId}`)
      .send({ evil: true })
      .expect(400);
  });
});

describe('POST /api/bugs/:id/comments', () => {
  it('adds a comment and a history event', async () => {
    const created = await request(app).post('/api/bugs').send({ ...basePayload(), title: 'comment test' }).expect(201);
    const res = await request(app)
      .post(`/api/bugs/${created.body.data.bugId}/comments`)
      .send({ author: 'Ayesha', body: 'Confirmed on staging too.' })
      .expect(201);
    assert.equal(res.body.data.comments.length, 1);
    assert.ok(res.body.data.history.some((h) => h.action === 'commented'));
  });

  it('rejects empty comment (400)', async () => {
    const created = await request(app).post('/api/bugs').send({ ...basePayload(), title: 'comment empty' }).expect(201);
    await request(app)
      .post(`/api/bugs/${created.body.data.bugId}/comments`)
      .send({ author: 'Ayesha', body: '   ' })
      .expect(400);
  });
});

describe('POST /api/bugs with screenshot', () => {
  it('stores a PNG screenshot and serves it back', async () => {
    const svg = Buffer.from(
      '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><rect width="10" height="10" fill="red"/></svg>'
    ).toString('base64');
    const payload = {
      ...basePayload(),
      title: 'screenshot test',
      screenshot: { mime: 'image/svg+xml', dataUrl: `data:image/svg+xml;base64,${svg}`, annotations: [{ type: 'rect', color: '#e6002e', x1: 1, y1: 1, x2: 9, y2: 9 }] },
    };
    const created = await request(app).post('/api/bugs').send(payload).expect(201);
    assert.ok(created.body.data.screenshotUrl);
    const img = await request(app).get(created.body.data.screenshotUrl).expect(200);
    assert.match(img.headers['content-type'], /image/);
  });

  it('rejects unsupported screenshot mime (400)', async () => {
    const payload = {
      ...basePayload(),
      title: 'bad mime',
      screenshot: { mime: 'image/gif', dataUrl: 'data:image/gif;base64,R0lGOD', annotations: [] },
    };
    await request(app).post('/api/bugs').send(payload).expect(400);
  });
});

describe('GET /api/stats', () => {
  it('returns priority/status aggregates', async () => {
    const res = await request(app).get('/api/stats').expect(200);
    const s = res.body.data;
    assert.ok('critical' in s.byPriority);
    assert.ok('open' in s.byStatus);
    assert.equal(typeof s.total, 'number');
    assert.ok(Array.isArray(s.last14Days));
  });
});

describe('DELETE /api/bugs/:id', () => {
  it('deletes a bug', async () => {
    const created = await request(app).post('/api/bugs').send({ ...basePayload(), title: 'delete test' }).expect(201);
    await request(app).delete(`/api/bugs/${created.body.data.bugId}`).expect(200);
    await request(app).get(`/api/bugs/${created.body.data.bugId}`).expect(404);
  });
});

describe('AI analysis on create', () => {
  it('attaches a root-cause analysis for a 500 login bug', async () => {
    const res = await request(app).post('/api/bugs').send(basePayload()).expect(201);
    const a = res.body.data.analysis;
    assert.ok(a.issue, 'analysis.issue present');
    assert.ok(a.confidence > 0.5);
    assert.ok(a.endpoint.startsWith('/v1/login'));
    assert.ok(a.likelyLocation && a.likelyLocation.fileName);
    assert.ok(Array.isArray(a.suggestions) && a.suggestions.length > 0);
    assert.match(a.analysis, /HTTP 500/);
  });
});

describe('Automatic deduplication', () => {
  function identicalPayload(project, title) {
    return {
      title,
      description: 'Same crash on every session.',
      priority: 'medium',
      reporter: 'Nilay',
      page: { url: `https://${project}/login`, pageTitle: 'Sign in', hostname: project },
      diagnostics: {
        errors: [
          { level: 'error', message: "TypeError: Cannot read properties of undefined (reading 'session')", source: 'login.js', lineno: 12 },
        ],
        network: [{ url: `https://api.${project}/v1/login`, method: 'POST', status: 500, statusText: 'Internal Server Error' }],
        warnings: [],
        mixed: [],
      },
    };
  }

  it('groups identical reports into the first bug and counts occurrences', async () => {
    const first = await request(app)
      .post('/api/bugs')
      .send(identicalPayload('dedupe.example.com', 'dup parent'))
      .expect(201);
    assert.equal(first.body.data.duplicate, false);

    const second = await request(app)
      .post('/api/bugs')
      .send(identicalPayload('dedupe.example.com', 'dup child'))
      .expect(201);
    assert.equal(second.body.data.duplicate, true);
    assert.equal(second.body.data.groupedWith, first.body.data.bugId);

    const parent = await request(app).get(`/api/bugs/${first.body.data.bugId}`).expect(200);
    assert.equal(parent.body.data.occurrences, 2);
    assert.ok(parent.body.data.occurrenceReporters.includes('Nilay'));
  });

  it('does not dedupe identical diagnostics for different projects', async () => {
    const a = await request(app)
      .post('/api/bugs')
      .send(identicalPayload('a.example.com', 'proj a'))
      .expect(201);
    const b = await request(app)
      .post('/api/bugs')
      .send(identicalPayload('b.example.com', 'proj b'))
      .expect(201);
    assert.equal(a.body.data.duplicate, false);
    assert.equal(b.body.data.duplicate, false);
  });
});

describe('Reproduction recorder payload', () => {
  it('stores steps and generates a Playwright test', async () => {
    const payload = {
      ...basePayload(),
      title: 'repro test',
      reproduction: {
        steps: [
          { action: 'navigate', url: 'https://app.example.com/login', at: new Date().toISOString() },
          { action: 'input', selector: '#email', value: 'a@b.com', type: 'email', at: new Date().toISOString() },
          { action: 'input', selector: '#password', value: 'secret', type: 'password', at: new Date().toISOString() },
          { action: 'click', selector: '#login', at: new Date().toISOString() },
        ],
      },
    };
    const res = await request(app).post('/api/bugs').send(payload).expect(201);
    assert.equal(res.body.data.reproduction.steps.length, 4);
    assert.match(res.body.data.reproduction.playwright, /page\.goto/);
    assert.match(res.body.data.reproduction.playwright, /page\.fill\("#email"/);
    assert.match(res.body.data.reproduction.playwright, /page\.click\("#login"\)/);
  });
});

describe('Health scan payload', () => {
  it('stores scores and issues', async () => {
    const payload = {
      ...basePayload(),
      title: 'health test',
      health: {
        scores: { performance: 82, accessibility: 71, security: 88, seo: 91, javascript: 76 },
        issues: [{ severity: 'critical', category: 'security', message: 'Missing Content-Security-Policy', detail: 'Header not present' }],
      },
    };
    const res = await request(app).post('/api/bugs').send(payload).expect(201);
    assert.equal(res.body.data.health.scores.security, 88);
    assert.equal(res.body.data.health.issues[0].severity, 'critical');
  });
});

describe('POST /api/explain', () => {
  it('explains a TypeError entry', async () => {
    const res = await request(app)
      .post('/api/explain')
      .send({ kind: 'console', entry: { message: "TypeError: Cannot read properties of undefined (reading 'session')", stack: 'at login.js:12:3' } })
      .expect(200);
    assert.match(res.body.data.summary, /undefined/);
    assert.ok(res.body.data.confidence > 0.8);
  });

  it('explains an HTTP 500 network entry', async () => {
    const res = await request(app)
      .post('/api/explain')
      .send({ kind: 'network', entry: { url: 'https://api.x/v1/login', method: 'POST', status: 500 } })
      .expect(200);
    assert.match(res.body.data.summary, /500/);
  });
});

describe('POST /api/bugs/:id/github', () => {
  it('returns 400 when GitHub is not configured', async () => {
    const created = await request(app).post('/api/bugs').send({ ...basePayload(), title: 'gh test' }).expect(201);
    const res = await request(app).post(`/api/bugs/${created.body.data.bugId}/github`).expect(400);
    assert.match(res.body.error, /GitHub not configured/);
  });
});
