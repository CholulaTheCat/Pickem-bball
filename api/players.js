import { addPlayer, removePlayer, getPlayers } from '../lib/store.js';
import { checkPasscode, isLocked, readBody, send, validName } from '../lib/http.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return send(res, 405, { error: 'POST only' });
  const { passcode, action, name } = readBody(req);
  if (!checkPasscode(passcode)) return send(res, 401, { error: 'Wrong passcode' });
  if (!validName(name)) return send(res, 400, { error: 'Names: 1-24 letters, numbers, spaces' });
  const clean = name.trim();

  if (action === 'add') {
    if (!(await addPlayer(clean))) return send(res, 409, { error: 'That player already exists' });
  } else if (action === 'remove') {
    if (isLocked()) return send(res, 403, { error: "Picks are locked — players can't be removed" });
    await removePlayer(clean);
  } else {
    return send(res, 400, { error: 'action must be add or remove' });
  }
  send(res, 200, { ok: true, players: await getPlayers() });
}
