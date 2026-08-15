const BASE = '/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(body.error || body.message || `Request failed (${res.status})`);
    err.status = res.status;
    err.details = body.details;
    throw err;
  }
  return body.data;
}

export const api = {
  stats: () => request('/stats'),
  listBugs: (params = {}) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') qs.set(k, v);
    });
    return request(`/bugs?${qs.toString()}`);
  },
  getBug: (id) => request(`/bugs/${id}`),
  createBug: (payload) =>
    request('/bugs', { method: 'POST', body: JSON.stringify(payload) }),
  updateBug: (id, patch) =>
    request(`/bugs/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }),
  deleteBug: (id) => request(`/bugs/${id}`, { method: 'DELETE' }),
  addComment: (id, payload) =>
    request(`/bugs/${id}/comments`, { method: 'POST', body: JSON.stringify(payload) }),
  exportGithub: (id) => request(`/bugs/${id}/github`, { method: 'POST' }),
};

export function timeAgo(date) {
  if (!date) return '';
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(date).toLocaleDateString();
}

export const PRIORITY_META = {
  critical: { label: 'Critical', color: 'var(--red)', dot: '#e6002e' },
  high: { label: 'High', color: 'var(--amber)', dot: '#ff7a00' },
  medium: { label: 'Medium', color: 'var(--yellow)', dot: '#c99a00' },
  low: { label: 'Low', color: 'var(--teal)', dot: '#00856f' },
};

export const STATUS_META = {
  open: { label: 'Open' },
  in_progress: { label: 'In Progress' },
  verified: { label: 'Verified' },
  closed: { label: 'Closed' },
};
