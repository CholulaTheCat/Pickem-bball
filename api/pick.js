import { TEAM_BY_ABBR } from '../public/shared/teams.js';
import { PICKS } from '../public/shared/scoring.js';
import { getPlayers, getPick, setPick } from '../lib/store.js';
import { checkPasscode, isLocked, readBody, send } from '../lib/http.js';

const NOTE_MAX = 280;

export default async function handler(req, res) {
  if (req.method !== 'POST') return send(res, 405, { error: 'POST only' });
  const { passcode, player, team, pick, note } = readBody(req);
  if (!checkPasscode(passcode)) return send(res, 401, { error: 'Wrong passcode' });
  if (!TEAM_BY_ABBR[team]) return send(res, 400, { error: 'Unknown team' });
  if (!(await getPlayers()).includes(player)) return send(res, 400, { error: 'Unknown player' });

  const current = await getPick(player, team);
  const next = { ...current };

  if (pick !== undefined) {
    if (pick !== null && !PICKS[pick]) return send(res, 400, { error: 'Unknown pick' });
    if (pick !== current.pick) {
      if (isLocked()) return send(res, 403, { error: 'Picks are locked — notes can still be edited' });
      next.pick = pick;
    }
  }
  if (note !== undefined) {
    if (typeof note !== 'string') return send(res, 400, { error: 'Bad note' });
    next.note = note.slice(0, NOTE_MAX);
  }

  await setPick(player, team, next);
  send(res, 200, { ok: true, entry: next });
}
