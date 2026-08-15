import { Router } from 'express';
import * as bugs from '../controllers/bugs.controller.js';
import { validate } from '../middleware/error-handler.js';
import { apiKeyAuth, writeLimiter } from '../middleware/security.js';
import {
  createBugSchema,
  updateBugSchema,
  commentSchema,
} from '../validators/bug.validator.js';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'bugtrack-api', uptime: process.uptime() });
});

router.get('/stats', bugs.getStats);

router.get('/bugs', bugs.listBugs);

router.post('/bugs', writeLimiter, apiKeyAuth, validate(createBugSchema), bugs.createBug);

router.get('/bugs/:id', bugs.getBug);

router.patch('/bugs/:id', writeLimiter, apiKeyAuth, validate(updateBugSchema), bugs.updateBug);

router.delete('/bugs/:id', writeLimiter, apiKeyAuth, bugs.deleteBug);

router.post(
  '/bugs/:id/comments',
  writeLimiter,
  apiKeyAuth,
  validate(commentSchema),
  bugs.addComment
);

router.post('/bugs/:id/github', writeLimiter, apiKeyAuth, bugs.exportToGitHub);

router.post('/explain', writeLimiter, bugs.explain);

router.get('/screenshots/:filename', bugs.serveScreenshot);

export default router;
