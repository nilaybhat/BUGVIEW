import dotenv from 'dotenv';

dotenv.config();

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  isProd: process.env.NODE_ENV === 'production',
  port: parseInt(process.env.PORT || '8787', 10),
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/bugtrack',
  corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:5173')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  uploadDir: process.env.UPLOAD_DIR || 'uploads/screenshots',
  apiKey: process.env.BUGTRACK_API_KEY || null,
  maxBodyBytes: (parseInt(process.env.MAX_BODY_MB || '20', 10) || 20) * 1024 * 1024,
  githubToken: process.env.GITHUB_TOKEN || null,
  githubRepo: process.env.GITHUB_REPO || null,
};

export default env;
