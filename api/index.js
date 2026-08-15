import { connectDatabase } from '../server/src/database/connection.js';
import { createApp } from '../server/src/app.js';

let app = null;
let pending = null;

async function getApp() {
  if (!app) {
    if (!pending) {
      pending = connectDatabase()
        .then(() => (app = createApp()))
        .finally(() => (pending = null));
    }
    await pending;
  }
  return app;
}

export default async function handler(req, res) {
  try {
    const server = await getApp();
    server(req, res);
  } catch (err) {
    res.status(500).json({ error: 'BUGTRACK API unavailable', message: err.message });
  }
}
