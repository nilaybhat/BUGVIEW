/**
 * BUGTRACK analysis engine.
 *
 * Deterministic, rule-based "AI" that turns raw diagnostics into
 * human-readable explanations, root-cause hypotheses and Playwright
 * reproduction tests. No external API or network calls — pure heuristics,
 * so it always runs and never leaks page data to a third party.
 */
import crypto from 'node:crypto';

/* ------------------------------------------------------------------ */
/* Explaining a single diagnostic entry                                */
/* ------------------------------------------------------------------ */

function classifyConsole(message) {
  const m = message || '';
  if (/cannot read propert\w+ of undefined/i.test(m)) {
    return {
      summary: 'Code reads a property on an undefined object',
      cause: 'An API response, selector result or optional chaining target was undefined when a property was accessed.',
      check: 'Log the object right before the failing line, or guard it with optional chaining (`?.`) and a fallback.',
      confidence: 0.87,
      suggestions: [
        'Validate the API response shape before accessing nested fields',
        'Use optional chaining: `data?.user?.email`',
        'Add a fallback default when the resource is missing',
      ],
    };
  }
  if (/cannot read propert\w+ of null/i.test(m)) {
    return {
      summary: 'Code reads a property on null',
      cause: 'A DOM lookup or data field returned null and a property was accessed on it.',
      check: 'Verify the element/data actually exists before use; treat null as a valid absence.',
      confidence: 0.85,
      suggestions: ['Guard with a null check before access', 'Use a safe getter that returns a default'],
    };
  }
  if (/is not defined/i.test(m)) {
    return {
      summary: 'ReferenceError — identifier not in scope',
      cause: 'A variable/function was used before declaration, or was never imported/loaded.',
      check: 'Confirm the import/bundle includes the identifier and it is not shadowed.',
      confidence: 0.9,
      suggestions: ['Add the missing import', 'Check the load order of scripts'],
    };
  }
  if (/is not a function/i.test(m)) {
    return {
      summary: 'TypeError — called a non-function value',
      cause: 'A method was expected but the value holds an object, string or undefined.',
      check: 'Confirm the dependency/polyfill that provides the method is loaded before use.',
      confidence: 0.86,
      suggestions: ['Verify the library version provides the method', 'Polyfill missing methods'],
    };
  }
  if (/failed to fetch|networkerror|network error/i.test(m)) {
    return {
      summary: 'Network request failed to reach the server',
      cause: 'CORS policy, offline state, an aborted request, or the endpoint is unreachable.',
      check: 'Inspect the Network tab for the CORS preflight and request status.',
      confidence: 0.78,
      suggestions: ['Verify CORS headers on the API origin', 'Check for offline / service worker interference'],
    };
  }
  if (/unhandled promise rejection/i.test(m)) {
    return {
      summary: 'A rejected promise was never caught',
      cause: 'An async operation failed and no `.catch` / try-catch handled the rejection.',
      check: 'Wrap the async call in try/catch and surface a user-facing error.',
      confidence: 0.82,
      suggestions: ['Add error handling around the async call', 'Show a friendly error state'],
    };
  }
  if (/deprecated/i.test(m)) {
    return {
      summary: 'Deprecated API in use',
      cause: 'The page calls a browser API that has been deprecated and will be removed.',
      check: 'Migrate to the replacement API listed in the warning.',
      confidence: 0.9,
      suggestions: ['Follow the migration path suggested by the warning'],
    };
  }
  return {
    summary: 'JavaScript exception detected',
    cause: 'An exception was thrown during script execution on the page.',
    check: 'Review the stack trace to locate the throwing frame.',
    confidence: 0.6,
    suggestions: ['Reproduce with the stack trace and step through the failing code'],
  };
}

function classifyNetwork(entry) {
  const status = entry && entry.status;
  if (status === 0) {
    return {
      summary: 'Request failed before a response',
      cause: 'CORS blocked the request, the connection was aborted, or the resource was unreachable (offline / DNS).',
      check: 'Inspect the request in the Network tab — look for CORS preflight failures.',
      confidence: 0.76,
      suggestions: ['Check server CORS configuration', 'Verify the endpoint is reachable and DNS resolves'],
    };
  }
  if (status >= 500) {
    return {
      summary: `Server error — HTTP ${status}`,
      cause: 'The server threw an unhandled error for this request. Frequently caused by missing input validation reaching database or service code.',
      check: 'Search server logs for this endpoint around the reported time; validate the request payload.',
      confidence: 0.87,
      suggestions: [
        'Add request validation before accessing nested payload fields',
        'Inspect server logs / error tracker for the stack',
        'Add an idempotency key to distinguish retries',
      ],
    };
  }
  if (status === 404) {
    return {
      summary: 'HTTP 404 — resource not found',
      cause: 'The endpoint or asset no longer exists, the route was renamed, or the file was moved.',
      check: 'Confirm the route/asset exists in the deployed revision.',
      confidence: 0.82,
      suggestions: ['Restore or redirect the missing resource', 'Update the client to the new path'],
    };
  }
  if (status === 401) {
    return {
      summary: 'HTTP 401 — authentication failed',
      cause: 'The request carried no valid token, or the session/token expired.',
      check: 'Verify token expiry and refresh flow.',
      confidence: 0.84,
      suggestions: ['Refresh the access token before the request', 'Redirect to login on 401'],
    };
  }
  if (status === 403) {
    return {
      summary: 'HTTP 403 — forbidden',
      cause: 'The user lacks permission for this action, or CSRF/authorization checks failed.',
      check: 'Review RBAC rules for the current user role.',
      confidence: 0.8,
      suggestions: ['Grant the required permission or adjust the request'],
    };
  }
  if (status === 429) {
    return {
      summary: 'HTTP 429 — rate limited',
      cause: 'The client exceeded the API rate limit and was throttled.',
      check: 'Add backoff/retry logic and respect Retry-After.',
      confidence: 0.85,
      suggestions: ['Implement exponential backoff', 'Reduce request frequency'],
    };
  }
  return {
    summary: `Failed request — HTTP ${status || 'unknown'}`,
    cause: 'The server returned an error status for this request.',
    check: 'Review the status code against the API contract.',
    confidence: 0.6,
    suggestions: ['Check the API contract for this status code'],
  };
}

export function explainEntry(entry) {
  if (!entry) return { summary: 'Unknown issue', confidence: 0.5, suggestions: [] };
  if (entry.url !== undefined && entry.status !== undefined) return classifyNetwork(entry);
  return classifyConsole(entry.message);
}

/* ------------------------------------------------------------------ */
/* Stack → likely file:line                                            */
/* ------------------------------------------------------------------ */

export function likelyLocation(stack) {
  if (!stack) return null;
  const frame = String(stack)
    .split('\n')
    .map((l) => l.trim())
    .find((l) => /at\s/.test(l) && !/^at\s+new\s/.test(l));
  if (!frame) return null;
  const match = frame.match(/([^ (]*\.(?:js|mjs|ts|jsx|tsx)):(\d+)(?::(\d+))?/);
  if (match) {
    const file = match[1].split('/').slice(-1)[0];
    return { file: match[1], fileName: file, line: parseInt(match[2], 10) };
  }
  return null;
}

function pathOnly(url) {
  try {
    const u = new URL(url);
    return u.pathname + u.search;
  } catch (_) {
    return String(url || '').slice(0, 200);
  }
}

/* ------------------------------------------------------------------ */
/* Root-cause analysis for a full bug                                  */
/* ------------------------------------------------------------------ */

export function buildAnalysis(bug) {
  const diag = bug.diagnostics || {};
  const errors = diag.errors || [];
  const network = diag.network || [];
  const mixed = diag.mixed || [];

  const primaryNetwork = network
    .slice()
    .sort((a, b) => (b.status >= 500 ? 1 : 0) - (a.status >= 500 ? 1 : 0))[0];
  const primaryError = errors.find((e) => e.stack) || errors[0];

  let endpoint = null;
  let status = null;
  if (primaryNetwork && primaryNetwork.url) {
    endpoint = pathOnly(primaryNetwork.url);
    status = primaryNetwork.status;
  }

  let consoleMsg = null;
  let location = null;
  if (primaryError) {
    consoleMsg = primaryError.message;
    location = likelyLocation(primaryError.stack || null);
  } else if (mixed.length) {
    consoleMsg = mixed[0].message || 'Mixed content detected';
  }

  const candidate =
    (primaryNetwork && primaryNetwork.status >= 400 && primaryNetwork.status !== 0)
      ? { kind: 'network', entry: primaryNetwork, explain: classifyNetwork(primaryNetwork) }
      : primaryError
        ? { kind: 'console', entry: primaryError, explain: classifyConsole(primaryError.message) }
        : mixed.length
          ? { kind: 'mixed', entry: mixed[0], explain: classifyConsole(mixed[0].message) }
          : null;

  if (!candidate) {
    return {
      issue: null,
      analysis: 'No automatic analysis — this report contains no captured errors.',
      confidence: 0,
    };
  }

  const cause = candidate.explain;
  const segments = [];
  if (candidate.kind === 'network' && status >= 400) {
    segments.push(
      `The frontend request ${candidate.entry.method || 'GET'} ${endpoint} failed with HTTP ${status}.`
    );
  }
  if (consoleMsg) segments.push(`Console reported: "${consoleMsg.slice(0, 160)}".`);
  segments.push(cause.cause);

  return {
    issue: cause.summary,
    endpoint,
    status,
    console: consoleMsg ? consoleMsg.slice(0, 400) : null,
    analysis: segments.join(' '),
    cause: cause.cause,
    confidence: cause.confidence,
    likelyLocation: location,
    suggestions: cause.suggestions,
    kind: candidate.kind,
  };
}

/* ------------------------------------------------------------------ */
/* Deduplication fingerprinting                                        */
/* ------------------------------------------------------------------ */

function normalizeStack(stack) {
  if (!stack) return '';
  return String(stack)
    .replace(/(:\d+)(?::\d+)?/g, ':')
    .replace(/https?:\/\/[^/\s]+\//g, '/')
    .replace(/\?[a-f0-9]{6,}/gi, '')
    .trim();
}

function normalizeMessage(message) {
  return String(message || '')
    .replace(/\d+/g, 'N')
    .replace(/https?:\/\/[^/\s]+/g, '')
    .slice(0, 240)
    .trim();
}

export function fingerprintDiagnostics(diag = {}) {
  const parts = [];
  for (const err of diag.errors || []) {
    parts.push(`E:${normalizeMessage(err.message)}|${normalizeStack(err.stack)}`);
  }
  for (const net of diag.network || []) {
    const p = pathOnly(net.url);
    parts.push(`N:${net.method || 'GET'}:${p}:${net.status || 0}`);
  }
  for (const mix of diag.mixed || []) {
    parts.push(`M:${normalizeMessage(mix.url)}`);
  }
  if (parts.length === 0) return null;
  const canonical = [...new Set(parts)].sort().join(';;');
  return crypto.createHash('sha256').update(canonical).digest('hex').slice(0, 20);
}

/* ------------------------------------------------------------------ */
/* Playwright reproduction generation                                  */
/* ------------------------------------------------------------------ */

const ESCAPE_RE = /["\\\n]/g;

function escapeJs(value) {
  return String(value).replace(ESCAPE_RE, (c) => (c === '\n' ? '\\n' : c === '"' ? '\\"' : '\\\\'));
}

export function playwrightFromSteps(url, steps = []) {
  const lines = [];
  lines.push(`import { test, expect } from '@playwright/test';`);
  lines.push('');
  lines.push(`test('bug reproduces', async ({ page }) => {`);
  lines.push(`  await page.goto(${JSON.stringify(url || '/')});`);
  for (const step of steps) {
    if (!step || !step.action) continue;
    const sel = step.selector ? `"${escapeJs(step.selector)}"` : null;
    if (step.action === 'click' && sel) lines.push(`  await page.click(${sel});`);
    else if (step.action === 'input' && sel) {
      const val = step.type === 'password' ? '"password"' : JSON.stringify(step.value || '');
      lines.push(`  await page.fill(${sel}, ${val});`);
    } else if (step.action === 'keydown' && sel) {
      const key = step.value === 'Enter' ? 'Enter' : step.value;
      lines.push(`  await page.press(${sel}, "${escapeJs(key)}");`);
    } else if (step.action === 'submit') {
      lines.push(`  await page.locator('form').first().evaluate((f) => f.requestSubmit());`);
    } else if (step.action === 'navigate') {
      lines.push(`  await page.goto(${JSON.stringify(step.value || '/')});`);
    }
  }
  lines.push('});');
  return lines.join('\n');
}

export function humanSteps(rawSteps = []) {
  const labels = {
    click: 'Clicked',
    input: 'Typed into',
    keydown: 'Pressed',
    submit: 'Submitted',
    navigate: 'Navigated to',
  };
  return rawSteps
    .filter((s) => s && s.action)
    .map((s) => {
      const verb = labels[s.action] || s.action;
      const target = s.selector ? ` ${s.selector}` : '';
      const value =
        s.action === 'input' ? ` → "${s.type === 'password' ? '••••••' : s.value}"` : '';
      return `${verb}${target}${value}`;
    });
}

export function explainEntryPublic(entry) {
  return explainEntry(entry);
}
