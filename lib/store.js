// Persistence: Upstash Redis when configured, otherwise an in-memory store
// (for local development only — data is lost on restart).
import { Redis } from '@upstash/redis';

const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

const PLAYERS = 'pickem:players'; // list of player names, in join order
const PICKS = 'pickem:picks';     // hash: "<player>|<TEAM>" -> {"pick","note"}

function memoryStore() {
  const lists = new Map();
  const hashes = new Map();
  const hash = (k) => hashes.get(k) || hashes.set(k, new Map()).get(k);
  return {
    async lrange(k) { return [...(lists.get(k) || [])]; },
    async rpush(k, v) { lists.set(k, [...(lists.get(k) || []), v]); },
    async lrem(k, _n, v) { lists.set(k, (lists.get(k) || []).filter((x) => x !== v)); },
    async hgetall(k) { return Object.fromEntries(hash(k)); },
    async hget(k, f) { return hash(k).get(f) ?? null; },
    async hset(k, obj) { for (const [f, v] of Object.entries(obj)) hash(k).set(f, v); },
    async hdel(k, ...fs) { for (const f of fs) hash(k).delete(f); },
  };
}

export const usingRedis = Boolean(url && token);
const db = usingRedis ? new Redis({ url, token }) : memoryStore();
if (!usingRedis) console.warn('[pickem] No Redis env vars found; using in-memory store.');

// Upstash may hand back JSON already parsed; accept either form.
const parse = (v) => (typeof v === 'string' ? JSON.parse(v) : v);

export async function getPlayers() {
  return (await db.lrange(PLAYERS, 0, -1)) || [];
}

export async function addPlayer(name) {
  const players = await getPlayers();
  if (players.some((p) => p.toLowerCase() === name.toLowerCase())) return false;
  await db.rpush(PLAYERS, name);
  return true;
}

export async function removePlayer(name) {
  await db.lrem(PLAYERS, 0, name);
  const all = (await db.hgetall(PICKS)) || {};
  const fields = Object.keys(all).filter((f) => f.startsWith(`${name}|`));
  if (fields.length) await db.hdel(PICKS, ...fields);
}

/** { player: { TEAM: { pick, note } } } */
export async function getAllPicks() {
  const all = (await db.hgetall(PICKS)) || {};
  const out = {};
  for (const [field, value] of Object.entries(all)) {
    const [player, team] = field.split('|');
    (out[player] ||= {})[team] = parse(value);
  }
  return out;
}

export async function getPick(player, team) {
  const v = await db.hget(PICKS, `${player}|${team}`);
  return v == null ? { pick: null, note: '' } : parse(v);
}

export async function setPick(player, team, entry) {
  await db.hset(PICKS, { [`${player}|${team}`]: JSON.stringify(entry) });
}
