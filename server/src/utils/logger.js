const LEVELS = { debug: 0, info: 1, warn: 2, error: 3 };

const level = process.env.LOG_LEVEL || 'info';

function ts() {
  return new Date().toISOString();
}

function write(lvl, args) {
  if (LEVELS[lvl] < (LEVELS[level] ?? 1)) return;
  const line = `[${ts()}] ${lvl.toUpperCase().padEnd(5)} ${args
    .map((a) => (typeof a === 'string' ? a : safeStringify(a)))
    .join(' ')}`;
  if (lvl === 'error' || lvl === 'warn') console.error(line);
  else console.log(line);
}

function safeStringify(value) {
  try {
    const s = JSON.stringify(value);
    return s === undefined ? String(value) : s;
  } catch (_) {
    return String(value);
  }
}

export const logger = {
  debug: (...args) => write('debug', args),
  info: (...args) => write('info', args),
  warn: (...args) => write('warn', args),
  error: (...args) => write('error', args),
};
