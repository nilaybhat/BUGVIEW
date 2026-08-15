import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = path.join(root, 'dashboard', 'dist');
const out = path.join(root, 'dist-vercel');

fs.rmSync(out, { recursive: true, force: true });
fs.cpSync(src, out, { recursive: true });
console.log(`Staged dashboard build -> ${path.relative(root, out)}`);
