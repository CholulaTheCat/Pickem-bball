import { DEFAULT_LOCK_AT } from '../public/shared/teams.js';

export const lockAt = () => new Date(process.env.LOCK_AT || DEFAULT_LOCK_AT);
export const isLocked = () => Date.now() >= lockAt().getTime();

export function send(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

export function readBody(req) {
  const b = req.body;
  if (b && typeof b === 'object') return b;
  try { return JSON.parse(b || '{}'); } catch { return {}; }
}

/** Player names: 1-24 chars of letters, digits, spaces and . ' - */
export const validName = (n) => typeof n === 'string' && /^[\p{L}\p{N} .'-]{1,24}$/u.test(n.trim());
