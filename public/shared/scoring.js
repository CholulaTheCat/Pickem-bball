// Pure scoring logic shared by the browser and the tests.
import { GAMES } from './teams.js';

export const PICKS = {
  LO: { label: 'Lean over',           short: 'Lean O',   dir: 'over',  pts: 1 },
  LU: { label: 'Lean under',          short: 'Lean U',   dir: 'under', pts: 1 },
  SO: { label: 'Strong over',         short: 'Strong O', dir: 'over',  pts: 3 },
  SU: { label: 'Strong under',        short: 'Strong U', dir: 'under', pts: 3 },
  BO: { label: 'Bet the house over',  short: 'House O',  dir: 'over',  pts: 5 },
  BU: { label: 'Bet the house under', short: 'House U',  dir: 'under', pts: 5 },
  SA: { label: 'Stay away',           short: 'Stay away', dir: null,   pts: 0 },
};
export const PICK_ORDER = ['LO', 'LU', 'SO', 'SU', 'BO', 'BU', 'SA'];

/** Projected 82-game wins at the current win %, or null before any games. */
export function pace(w, l) {
  const gp = w + l;
  return gp ? (w / gp) * GAMES : null;
}

/**
 * Where a team stands against its line.
 * Returns { state, pace, diff, gp } where state is one of:
 *   'clinchedOver'  — wins already exceed the line
 *   'clinchedUnder' — even winning out can't reach the line
 *   'paceOver' / 'paceUnder' — tracking one way, nothing clinched
 *   'pending' — no games played yet
 */
export function teamStatus(line, record) {
  const w = record?.w ?? 0;
  const l = record?.l ?? 0;
  const gp = w + l;
  const p = pace(w, l);
  const diff = p == null ? null : p - line;
  let state;
  if (w > line) state = 'clinchedOver';
  else if (w + (GAMES - gp) < line) state = 'clinchedUnder';
  else if (p == null) state = 'pending';
  else state = p > line ? 'paceOver' : 'paceUnder';
  return { state, pace: p, diff, gp };
}

/**
 * How a pick is doing given the team's status:
 *   'won' / 'lost' (clinched), 'on' / 'off' (pace), 'pending', or 'none' (stay away / no pick).
 */
export function pickResult(pickCode, state) {
  const dir = PICKS[pickCode]?.dir;
  if (!dir) return 'none';
  switch (state) {
    case 'clinchedOver':  return dir === 'over' ? 'won' : 'lost';
    case 'clinchedUnder': return dir === 'under' ? 'won' : 'lost';
    case 'paceOver':      return dir === 'over' ? 'on' : 'off';
    case 'paceUnder':     return dir === 'under' ? 'on' : 'off';
    default:              return 'pending';
  }
}

/**
 * Per-player summary.
 * picks: { TEAM: { pick, note } }, statuses: { TEAM: teamStatus(...) }
 */
export function playerTotals(picks, statuses) {
  const counts = Object.fromEntries(PICK_ORDER.map((c) => [c, 0]));
  let made = 0, wagered = 0, won = 0, lost = 0, onPace = 0, offPace = 0;
  for (const [team, entry] of Object.entries(picks || {})) {
    const code = entry?.pick;
    if (!PICKS[code]) continue;
    counts[code]++;
    made++;
    const pts = PICKS[code].pts;
    wagered += pts;
    const r = pickResult(code, statuses[team]?.state);
    if (r === 'won') { won += pts; onPace += pts; }
    else if (r === 'lost') { lost += pts; offPace += pts; }
    else if (r === 'on') onPace += pts;
    else if (r === 'off') offPace += pts;
  }
  return { counts, made, wagered, won, lost, onPace, offPace, maxPossible: wagered - lost };
}

/** True when players' directional picks for a team don't all agree. */
export function isDisagreement(picksForTeam) {
  const dirs = new Set(picksForTeam.map((c) => PICKS[c]?.dir).filter(Boolean));
  return dirs.size > 1;
}
