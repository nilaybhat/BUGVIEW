import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const dashboardDir = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'dashboard');
const require = createRequire(join(dashboardDir, 'vite-resolve.cjs'));
const { build } = require('vite');

await build({ root: dashboardDir });
