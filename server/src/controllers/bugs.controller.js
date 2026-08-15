import { asyncHandler } from '../utils/async-handler.js';
import { ApiError } from '../utils/api-error.js';
import * as bugService from '../services/bug.service.js';
import { exportToGithub } from '../services/github.service.js';
import { explainEntryPublic } from '../services/analysis.service.js';

export const createBug = asyncHandler(async (req, res) => {
  const result = await bugService.createBug(req.body);
  res.status(201).json({
    data: {
      ...bugService.serializeBug(result.bug),
      duplicate: result.duplicate,
      groupedWith: result.groupedWith,
      humanSteps: result.humanSteps,
    },
  });
});

export const listBugs = asyncHandler(async (req, res) => {
  const result = await bugService.listBugs(req.query);
  res.json({ data: result });
});

export const getBug = asyncHandler(async (req, res) => {
  const bug = await bugService.getBug(req.params.id);
  res.json({ data: bug });
});

export const updateBug = asyncHandler(async (req, res) => {
  const bug = await bugService.updateBug(req.params.id, req.body, req.body._actor || 'dashboard');
  res.json({ data: bug });
});

export const deleteBug = asyncHandler(async (req, res) => {
  const result = await bugService.deleteBug(req.params.id);
  res.json({ data: result });
});

export const addComment = asyncHandler(async (req, res) => {
  const bug = await bugService.addComment(req.params.id, req.body);
  res.status(201).json({ data: bugService.serializeBug(bug) });
});

export const exportToGitHub = asyncHandler(async (req, res) => {
  const result = await exportToGithub(req.params.id);
  res.json({ data: result });
});

export const explain = asyncHandler(async (req, res) => {
  const { kind, entry } = req.body || {};
  if (!entry) throw ApiError.badRequest('Missing diagnostic entry');
  const normalized = kind === 'network' ? { ...entry, url: entry.url, status: entry.status } : { ...entry };
  res.json({ data: explainEntryPublic(normalized) });
});

export const getStats = asyncHandler(async (_req, res) => {
  res.json({ data: await bugService.getStats() });
});

export const serveScreenshot = asyncHandler(async (req, res) => {
  const { readFile } = await import('node:fs/promises');
  const { readScreenshot } = await import('../services/screenshot.service.js');
  const result = await readScreenshot(req.params.filename);
  if (result.notFound) {
    return res.status(404).json({ error: 'Screenshot not found' });
  }
  if (result.blob) {
    return res.redirect(302, result.blob.url);
  }
  const buffer = await readFile(result.filePath);
  const mime = req.params.filename.endsWith('.svg')
    ? 'image/svg+xml'
    : req.params.filename.endsWith('.png')
      ? 'image/png'
      : req.params.filename.endsWith('.webp')
        ? 'image/webp'
        : 'image/jpeg';
  res.setHeader('Content-Type', mime);
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.send(buffer);
});
