import { TEAMS } from '../public/shared/teams.js';
import { getPlayers, getAllPicks, usingRedis } from '../lib/store.js';
import { lockAt, send } from '../lib/http.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return send(res, 405, { error: 'GET only' });
  try {
    const [players, picks] = await Promise.all([getPlayers(), getAllPicks()]);
    res.setHeader('Cache-Control', 'no-store');
    send(res, 200, {
      teams: TEAMS,
      players,
      picks,
      lockAt: lockAt().toISOString(),
      now: new Date().toISOString(),
      persistent: usingRedis,
    });
  } catch (err) {
    console.error(err);
    send(res, 500, { error: 'Could not load data' });
  }
}
