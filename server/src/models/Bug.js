import mongoose from 'mongoose';

const { Schema } = mongoose;

export const PRIORITIES = ['critical', 'high', 'medium', 'low'];
export const STATUSES = ['open', 'in_progress', 'verified', 'closed'];

const diagEntrySchema = new Schema(
  {
    level: String,
    message: { type: String, maxlength: 4000 },
    source: String,
    lineno: Number,
    colno: Number,
    stack: String,
    url: { type: String, maxlength: 2000 },
    method: String,
    status: Number,
    statusText: String,
    durationMs: Number,
    initiator: String,
    error: String,
    priorityHint: String,
  },
  { _id: false }
);

const shapeSchema = new Schema(
  {
    type: { type: String, enum: ['rect', 'arrow', 'highlight', 'blur', 'text'] },
    color: String,
    x1: Number,
    y1: Number,
    x2: Number,
    y2: Number,
    w: Number,
    text: String,
  },
  { _id: false }
);

const reproStepSchema = new Schema(
  {
    action: String,
    selector: String,
    value: String,
    type: String,
    url: String,
    at: { type: Date, default: Date.now },
  },
  { _id: false }
);

const healthIssueSchema = new Schema(
  {
    severity: String,
    category: String,
    message: String,
    detail: String,
  },
  { _id: false }
);

const bugSchema = new Schema(
  {
    bugId: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, default: '', maxlength: 20000 },
    project: { type: String, default: 'unknown', index: true },
    url: { type: String, default: '', maxlength: 2000 },
    pageTitle: { type: String, default: '' },
    priority: { type: String, enum: PRIORITIES, default: 'medium', index: true },
    status: { type: String, enum: STATUSES, default: 'open', index: true },
    reporter: { type: String, default: 'Anonymous', maxlength: 100 },
    assignee: { type: String, default: '', maxlength: 100 },
    tags: { type: [String], default: [] },
    browser: {
      browserName: String,
      userAgent: { type: String, maxlength: 2000 },
      platform: String,
      language: String,
      screenResolution: String,
      viewport: String,
      devicePixelRatio: Number,
    },
    diagnostics: {
      errors: { type: [diagEntrySchema], default: [] },
      network: { type: [diagEntrySchema], default: [] },
      warnings: { type: [diagEntrySchema], default: [] },
      mixed: { type: [diagEntrySchema], default: [] },
    },
    summary: {
      errorCount: { type: Number, default: 0 },
      networkCount: { type: Number, default: 0 },
      warningCount: { type: Number, default: 0 },
      mixedCount: { type: Number, default: 0 },
    },
    screenshot: {
      mime: String,
      filename: String,
      sizeBytes: Number,
      annotations: { type: [shapeSchema], default: [] },
    },
    comments: [
      {
        author: { type: String, required: true, maxlength: 100 },
        body: { type: String, required: true, maxlength: 5000 },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    history: [
      {
        actor: { type: String, default: 'system' },
        action: { type: String, required: true },
        field: String,
        from: String,
        to: String,
        at: { type: Date, default: Date.now },
      },
    ],
    fingerprint: { type: String, default: '', index: true },
    occurrences: { type: Number, default: 1 },
    occurrenceReporters: { type: [String], default: [] },
    browsersSeen: { type: [String], default: [] },
    duplicateOf: { type: String, default: '' },
    reproduction: {
      steps: { type: [reproStepSchema], default: [] },
      playwright: { type: String, default: '' },
    },
    analysis: {
      issue: String,
      endpoint: String,
      status: Number,
      console: String,
      analysis: String,
      cause: String,
      confidence: Number,
      likelyLocation: { file: String, fileName: String, line: Number },
      suggestions: { type: [String], default: [] },
      kind: String,
    },
    health: {
      scores: {
        performance: Number,
        accessibility: Number,
        security: Number,
        seo: Number,
        javascript: Number,
      },
      issues: { type: [healthIssueSchema], default: [] },
    },
    github: {
      issueNumber: Number,
      issueUrl: String,
      exportedAt: Date,
    },
    element: { type: Schema.Types.Mixed, default: null },
  },
  { timestamps: true }
);

bugSchema.index({ project: 1, status: 1 });
bugSchema.index({ priority: 1, status: 1 });
bugSchema.index({ createdAt: -1 });
bugSchema.index({ title: 'text', description: 'text' });

export const Bug = mongoose.model('Bug', bugSchema);
