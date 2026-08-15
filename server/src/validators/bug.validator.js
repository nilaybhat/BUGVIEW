import { z } from 'zod';
import { PRIORITIES, STATUSES } from '../models/Bug.js';

const diagEntry = z
  .record(z.unknown())
  .transform((e) => ({
    level: typeof e.level === 'string' ? e.level.slice(0, 20) : undefined,
    message: typeof e.message === 'string' ? e.message.slice(0, 4000) : undefined,
    source: typeof e.source === 'string' ? e.source.slice(0, 500) : undefined,
    lineno: typeof e.lineno === 'number' ? e.lineno : undefined,
    colno: typeof e.colno === 'number' ? e.colno : undefined,
    stack: typeof e.stack === 'string' ? e.stack.slice(0, 4000) : undefined,
    url: typeof e.url === 'string' ? e.url.slice(0, 2000) : undefined,
    method: typeof e.method === 'string' ? e.method.slice(0, 10) : undefined,
    status: typeof e.status === 'number' ? e.status : undefined,
    statusText: typeof e.statusText === 'string' ? e.statusText.slice(0, 100) : undefined,
    durationMs: typeof e.durationMs === 'number' ? e.durationMs : undefined,
    initiator: typeof e.initiator === 'string' ? e.initiator.slice(0, 50) : undefined,
    error: typeof e.error === 'string' ? e.error.slice(0, 500) : undefined,
    priorityHint: typeof e.priorityHint === 'string' ? e.priorityHint : undefined,
  }))
  .refine((e) => Object.values(e).some((v) => v !== undefined), 'Empty diagnostic entry');

const shape = z.object({
  type: z.enum(['rect', 'arrow', 'highlight', 'blur', 'text']),
  color: z.string().max(20).optional(),
  x1: z.number().optional(),
  y1: z.number().optional(),
  x2: z.number().optional(),
  y2: z.number().optional(),
  w: z.number().optional(),
  text: z.string().max(500).optional(),
});

export const createBugSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(200),
  description: z.string().max(20000).default(''),
  priority: z.enum(PRIORITIES).default('medium'),
  reporter: z.string().trim().max(100).default('Anonymous'),
  url: z.string().max(2000).default(''),
  page: z
    .object({
      url: z.string().max(2000).default(''),
      pageTitle: z.string().max(1000).default(''),
      hostname: z.string().max(200).default(''),
      favIconUrl: z.string().max(2000).optional(),
    })
    .default({}),
  browser: z.record(z.unknown()).default({}),
  diagnostics: z
    .object({
      errors: z.array(diagEntry).transform((arr) => arr.slice(0, 60)).default([]),
      network: z.array(diagEntry).transform((arr) => arr.slice(0, 60)).default([]),
      warnings: z.array(diagEntry).transform((arr) => arr.slice(0, 60)).default([]),
      mixed: z.array(diagEntry).transform((arr) => arr.slice(0, 60)).default([]),
    })
    .default({}),
  summary: z.record(z.unknown()).default({}),
  screenshot: z
    .object({
      mime: z.enum(['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']),
      dataUrl: z.string().max(18 * 1024 * 1024, 'Screenshot too large'),
      annotations: z.array(shape).max(200).default([]),
    })
    .optional(),
  reproduction: z
    .object({
      steps: z
        .array(
          z.object({
            action: z.string().max(20),
            selector: z.string().max(300).optional(),
            value: z.string().max(500).optional(),
            type: z.string().max(20).optional(),
            url: z.string().max(1000).optional(),
          })
        )
        .max(80)
        .default([]),
    })
    .default({}),
  health: z
    .object({
      scores: z.record(z.number()).default({}),
      issues: z
        .array(
          z.object({
            severity: z.enum(['critical', 'high', 'medium', 'low']),
            category: z.string().max(40),
            message: z.string().max(500),
            detail: z.string().max(1000),
          })
        )
        .max(60)
        .default([]),
    })
    .default({}),
  element: z.record(z.unknown()).nullish(),
});

export const updateBugSchema = z
  .object({
    title: z.string().trim().min(1).max(200).optional(),
    description: z.string().max(20000).optional(),
    priority: z.enum(PRIORITIES).optional(),
    status: z.enum(STATUSES).optional(),
    assignee: z.string().trim().max(100).optional(),
    tags: z.array(z.string().trim().max(40)).max(20).optional(),
  })
  .strict();

export const commentSchema = z.object({
  author: z.string().trim().min(1, 'Author is required').max(100),
  body: z.string().trim().min(1, 'Comment body is required').max(5000),
});
