import { Bug } from '../models/Bug.js';
import { nextBugSequence } from '../models/Counter.js';
import { storeScreenshot } from './screenshot.service.js';
import { ApiError } from '../utils/api-error.js';
import {
  buildAnalysis,
  fingerprintDiagnostics,
  playwrightFromSteps,
  humanSteps,
} from './analysis.service.js';

const MAX_DIAG_PER_TYPE = 60;

function capEntries(entries, cap = MAX_DIAG_PER_TYPE) {
  if (!Array.isArray(entries)) return [];
  return entries.slice(0, cap);
}

function sanitizeDiag(diag = {}) {
  const clean = (entry) => {
    if (!entry || typeof entry !== 'object') return {};
    const out = {};
    for (const [k, v] of Object.entries(entry)) {
      if (k === 'stack' || k === 'message') out[k] = String(v || '').slice(0, 4000);
      else if (k === 'url') out[k] = String(v || '').slice(0, 2000);
      else if (typeof v === 'number' || typeof v === 'string' || typeof v === 'boolean' || v === null || v === undefined) {
        out[k] = v;
      }
    }
    return out;
  };
  return {
    errors: capEntries(diag.errors).map(clean),
    network: capEntries(diag.network).map(clean),
    warnings: capEntries(diag.warnings).map(clean),
    mixed: capEntries(diag.mixed).map(clean),
  };
}

function hostnameOf(url) {
  try {
    return new URL(url).hostname || 'unknown';
  } catch (_) {
    return String(url || 'unknown').slice(0, 120) || 'unknown';
  }
}

function sanitizeReproduction(raw = {}) {
  const steps = Array.isArray(raw.steps)
    ? raw.steps
        .slice(0, 80)
        .map((s) =>
          s && typeof s === 'object'
            ? {
                action: String(s.action || '').slice(0, 20),
                selector: String(s.selector || '').slice(0, 300),
                value: String(s.value || '').slice(0, 500),
                type: String(s.type || '').slice(0, 20),
                url: String(s.url || '').slice(0, 1000),
                at: s.at ? new Date(s.at) : new Date(),
              }
            : null
        )
        .filter(Boolean)
    : [];
  return steps;
}

function sanitizeHealth(raw = {}) {
  const clamp = (v, d) => (typeof v === 'number' && isFinite(v) ? Math.max(0, Math.min(100, Math.round(v))) : d);
  const issues = Array.isArray(raw.issues)
    ? raw.issues
        .slice(0, 60)
        .map((i) =>
          i && typeof i === 'object'
            ? {
                severity: ['critical', 'high', 'medium', 'low'].includes(i.severity) ? i.severity : 'medium',
                category: String(i.category || 'other').slice(0, 40),
                message: String(i.message || '').slice(0, 500),
                detail: String(i.detail || '').slice(0, 1000),
              }
            : null
        )
        .filter(Boolean)
    : [];
  return {
    scores: {
      performance: clamp(raw.scores && raw.scores.performance, null),
      accessibility: clamp(raw.scores && raw.scores.accessibility, null),
      security: clamp(raw.scores && raw.scores.security, null),
      seo: clamp(raw.scores && raw.scores.seo, null),
      javascript: clamp(raw.scores && raw.scores.javascript, null),
    },
    issues,
  };
}

export async function createBug(input) {
  const diagnostics = sanitizeDiag(input.diagnostics);
  const project = (input.page && (input.page.hostname || hostnameOf(input.page.url))) || hostnameOf(input.url) || 'unknown';
  const reporter = input.reporter || 'Anonymous';
  const browserName = (input.browser && input.browser.browserName) || 'unknown';

  const fingerprint = fingerprintDiagnostics(diagnostics);

  /* automatic deduplication — merge identical signatures into the open bug */
  if (fingerprint) {
    const existing = await Bug.findOne({
      fingerprint,
      project,
      status: { $in: ['open', 'in_progress'] },
      $or: [{ duplicateOf: '' }, { duplicateOf: { $exists: true } }],
    }).sort({ occurrences: -1, createdAt: 1 });

    if (existing) {
      existing.occurrences += 1;
      if (reporter && !existing.occurrenceReporters.includes(reporter)) {
        existing.occurrenceReporters.push(reporter);
      }
      if (browserName && !existing.browsersSeen.includes(browserName)) {
        existing.browsersSeen.push(browserName);
      }
      existing.history.push({
        actor: reporter,
        action: 'duplicate',
        to: `${existing.occurrences} occurrences`,
        at: new Date(),
      });
      await existing.save();
      return {
        bug: existing,
        duplicate: true,
        groupedWith: existing.bugId,
      };
    }
  }

  const bugId = `BUG-${await nextBugSequence()}`;
  const shot = input.screenshot
    ? await storeScreenshot(bugId, input.screenshot)
    : null;

  const reproSteps = sanitizeReproduction(input.reproduction);
  const health = sanitizeHealth(input.health);
  const analysis = buildAnalysis({
    diagnostics,
    page: input.page,
  });
  const playwright = reproSteps.length
    ? playwrightFromSteps((input.page && input.page.url) || input.url, reproSteps)
    : '';

  const bug = await Bug.create({
    bugId,
    title: input.title,
    description: input.description || '',
    project,
    url: (input.page && input.page.url) || input.url || '',
    pageTitle: (input.page && input.page.pageTitle) || '',
    priority: input.priority || 'medium',
    status: 'open',
    reporter,
    browser: input.browser || {},
    diagnostics,
    summary: {
      errorCount: diagnostics.errors.length,
      networkCount: diagnostics.network.length,
      warningCount: diagnostics.warnings.length,
      mixedCount: diagnostics.mixed.length,
    },
    screenshot: shot,
    fingerprint: fingerprint || '',
    occurrences: 1,
    occurrenceReporters: [reporter],
    browsersSeen: [browserName],
    reproduction: { steps: reproSteps, playwright },
    analysis,
    health,
    element: input.element || null,
    history: [
      {
        actor: reporter,
        action: 'created',
        to: 'open',
        at: new Date(),
      },
    ],
  });

  return { bug, duplicate: false, groupedWith: null, humanSteps: humanSteps(reproSteps) };
}

export function serializeBug(bug) {
  const doc = bug.toObject ? bug.toObject() : bug;
  const priorityRank = { critical: 0, high: 1, medium: 2, low: 3 };
  return {
    ...doc,
    id: doc._id,
    screenshotUrl: doc.screenshot && doc.screenshot.filename
      ? `/api/screenshots/${doc.screenshot.filename}`
      : null,
    priorityRank: priorityRank[doc.priority] ?? 2,
  };
}

const LIST_SORTS = {
  newest: { createdAt: -1 },
  oldest: { createdAt: 1 },
  'priority-asc': { priorityRank: 1, createdAt: -1 },
  'priority-desc': { priorityRank: -1, createdAt: 1 },
  updated: { updatedAt: -1 },
};

export async function listBugs({ page = 1, limit = 20, status, priority, project, search, sort = 'newest' }) {
  const p = Math.max(1, parseInt(page, 10) || 1);
  const l = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));

  const query = {};
  if (status) query.status = status;
  if (priority) query.priority = priority;
  if (project) query.project = project;

  let filter = null;
  if (search && search.trim()) {
    const q = search.trim();
    filter = {
      $or: [
        { title: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { bugId: { $regex: q, $options: 'i' } },
        { reporter: { $regex: q, $options: 'i' } },
        { url: { $regex: q, $options: 'i' } },
      ],
    };
  }

  const combined = { ...query, ...(filter || {}) };
  const sortSpec = LIST_SORTS[sort] || LIST_SORTS.newest;

  const [total, bugs] = await Promise.all([
    Bug.countDocuments(combined),
    Bug.find(combined)
      .sort(sortSpec)
      .skip((p - 1) * l)
      .limit(l)
      .select('-diagnostics -browser.userAgent -comments -history'),
  ]);

  return {
    items: bugs.map(serializeBug),
    pagination: { page: p, limit: l, total, pages: Math.max(1, Math.ceil(total / l)) },
  };
}

function findBugQuery(id) {
  if (/^[0-9a-f]{24}$/i.test(id)) return { $or: [{ _id: id }, { bugId: id }] };
  return { bugId: id };
}

export async function getBug(id) {
  const bug = await Bug.findOne(findBugQuery(id)).orFail(new ApiError(404, 'Bug not found'));
  return serializeBug(bug);
}

const UPDATE_FIELDS = ['title', 'description', 'priority', 'status', 'assignee', 'tags'];
const HISTORY_TRACKED = ['priority', 'status', 'assignee'];

export async function updateBug(id, patch, actor = 'dashboard') {
  const bug = await Bug.findOne(findBugQuery(id)).orFail(new ApiError(404, 'Bug not found'));

  const changes = {};
  for (const field of UPDATE_FIELDS) {
    if (field in patch && patch[field] !== undefined) {
      changes[field] = patch[field];
    }
  }

  const history = [];
  for (const field of HISTORY_TRACKED) {
    if (field in changes && changes[field] !== bug[field]) {
      history.push({
        actor,
        action: 'updated',
        field,
        from: String(bug[field] ?? ''),
        to: String(changes[field]),
        at: new Date(),
      });
    }
  }

  if (Object.keys(changes).length === 0 && history.length === 0) {
    return serializeBug(bug);
  }

  Object.assign(bug, changes);
  bug.history.push(...history);
  await bug.save();
  return serializeBug(bug);
}

export async function deleteBug(id) {
  const result = await Bug.findOneAndDelete(findBugQuery(id));
  if (!result) throw new ApiError(404, 'Bug not found');
  return { deleted: true, bugId: result.bugId };
}

export async function addComment(id, { author, body }) {
  const bug = await Bug.findOne(findBugQuery(id)).orFail(new ApiError(404, 'Bug not found'));

  const comment = { author, body, createdAt: new Date() };
  bug.comments.push(comment);
  bug.history.push({ actor: author, action: 'commented', to: body.slice(0, 80), at: new Date() });
  await bug.save();
  return serializeBug(bug);
}

export async function getStats() {
  const [byPriority, byStatus, byProject, total, last14, topErrors, topPages, browsers] = await Promise.all([
    Bug.aggregate([{ $group: { _id: '$priority', count: { $sum: 1 } } }]),
    Bug.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Bug.aggregate([{ $group: { _id: '$project', count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 12 }]),
    Bug.countDocuments(),
    Bug.aggregate([
      {
        $match: { createdAt: { $gte: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000) } },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    Bug.aggregate([
      { $unwind: '$diagnostics.errors' },
      {
        $group: {
          _id: { $substrBytes: [{ $ifNull: ['$diagnostics.errors.message', ''] }, 0, 80] },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 8 },
    ]),
    Bug.aggregate([
      {
        $group: {
          _id: { $substrBytes: [{ $ifNull: ['$url', ''] }, 0, 120] },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 8 },
    ]),
    Bug.aggregate([
      { $unwind: '$browsersSeen' },
      { $group: { _id: '$browsersSeen', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 8 },
    ]),
  ]);

  const empty = (keys) => Object.fromEntries(keys.map((k) => [k, 0]));
  return {
    total,
    byPriority: { ...empty(['critical', 'high', 'medium', 'low']), ...Object.fromEntries(byPriority.map((r) => [r._id, r.count])) },
    byStatus: { ...empty(['open', 'in_progress', 'verified', 'closed']), ...Object.fromEntries(byStatus.map((r) => [r._id, r.count])) },
    byProject,
    last14Days: last14.map((r) => ({ date: r._id, count: r.count })),
    openTotal: (byStatus.find((r) => r._id === 'open') || {}).count || 0,
    analytics: {
      topErrors: topErrors.map((r) => ({ message: r._id, count: r.count })),
      topPages: topPages.map((r) => ({ url: r._id, count: r.count })),
      browsers: browsers.map((r) => ({ name: r._id, count: r.count })),
    },
  };
}
