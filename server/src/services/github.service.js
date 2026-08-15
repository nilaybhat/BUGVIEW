import env from '../config/env.js';
import { Bug } from '../models/Bug.js';
import { ApiError } from '../utils/api-error.js';
import { logger } from '../utils/logger.js';
import { humanSteps } from './analysis.service.js';

function code(text) {
  return `\`\`\`\n${String(text || '').slice(0, 3000)}\n\`\`\``;
}

function buildBody(bug) {
  const lines = [];
  if (bug.description) lines.push(bug.description, '');
  if (bug.url) lines.push(`## URL`, bug.url, '');
  const steps = humanSteps(bug.reproduction?.steps || []);
  if (steps.length) {
    lines.push('## Reproduction');
    steps.forEach((s, i) => lines.push(`${i + 1}. ${s}`));
    lines.push('');
  }
  if (bug.diagnostics?.errors?.length) {
    lines.push('## Console', code(bug.diagnostics.errors[0].message));
    lines.push('');
  }
  if (bug.diagnostics?.network?.length) {
    const n = bug.diagnostics.network[0];
    lines.push('## Network', `\`${n.method || 'GET'} ${n.url} → ${n.status || 'error'}\``, '');
  }
  if (bug.analysis?.analysis) {
    lines.push('## Automatic Analysis', bug.analysis.analysis, '');
  }
  lines.push(
    '## Environment',
    `- Browser: ${bug.browser?.browserName || 'Unknown'} (${bug.browser?.platform || '?'})`,
    `- Screen: ${bug.browser?.screenResolution || '?'}`,
    `- Viewport: ${bug.browser?.viewport || '?'}`,
    `- Reporter: ${bug.reporter}`,
    ''
  );
  lines.push(`_Reported via BUGTRACK — BUG-${bug.bugId}_`);
  return lines.join('\n');
}

export async function exportToGithub(id) {
  if (!env.githubToken || !env.githubRepo) {
    throw ApiError.badRequest(
      'GitHub not configured — set GITHUB_TOKEN and GITHUB_REPO in server/.env'
    );
  }
  const bug = await Bug.findOne(
    /^[0-9a-f]{24}$/i.test(id) ? { $or: [{ _id: id }, { bugId: id }] } : { bugId: id }
  ).orFail(new ApiError(404, 'Bug not found'));

  if (bug.github && bug.github.issueUrl) {
    return { issueUrl: bug.github.issueUrl, issueNumber: bug.github.issueNumber, already: true };
  }

  const body = buildBody(bug);
  const res = await fetch(`https://api.github.com/repos/${env.githubRepo}/issues`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.githubToken}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
      'User-Agent': 'BUGTRACK',
    },
    body: JSON.stringify({
      title: `${bug.bugId}: ${bug.title}`,
      body,
      labels: [`priority:${bug.priority}`],
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    logger.error('GitHub export failed', res.status, text.slice(0, 500));
    throw new ApiError(502, `GitHub API error ${res.status} — ${text.slice(0, 200)}`);
  }

  const data = await res.json();
  bug.github = {
    issueNumber: data.number,
    issueUrl: data.html_url,
    exportedAt: new Date(),
  };
  bug.history.push({
    actor: 'dashboard',
    action: 'exported',
    field: 'github',
    to: `GitHub issue #${data.number}`,
    at: new Date(),
  });
  await bug.save();
  return { issueUrl: data.html_url, issueNumber: data.number, already: false };
}
