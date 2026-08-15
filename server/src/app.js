import path from 'node:path';
import fs from 'node:fs';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import env from './config/env.js';
import apiRoutes from './routes/api.routes.js';
import { errorHandler, notFoundHandler } from './middleware/error-handler.js';
import { logger } from './utils/logger.js';

export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  app.use(
    helmet({
      crossOriginResourcePolicy: false,
      contentSecurityPolicy: false,
    })
  );

  const origins = env.corsOrigins.includes('*') ? true : env.corsOrigins;
  app.use(cors({ origin: origins }));

  app.use(express.json({ limit: env.maxBodyBytes }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  app.use(
    morgan(env.isProd ? 'combined' : 'dev', {
      stream: { write: (msg) => logger.info(msg.trimEnd()) },
    })
  );

  app.use('/api', apiRoutes);

  if (env.isProd) {
    const dist = path.resolve(process.cwd(), '../dashboard/dist');
    if (fs.existsSync(dist)) {
      app.use(express.static(dist));
      app.get('*', (req, res, next) => {
        if (req.path.startsWith('/api')) return next();
        res.sendFile(path.join(dist, 'index.html'));
      });
    }
  }

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
