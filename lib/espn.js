import { FROM_ESPN } from '../public/shared/teams.js';

/**
 * Turn ESPN's standings payload into { ABBR: { w, l } }.
 * Shape: { children: [ { standings: { entries: [ { team: { abbreviation }, stats: [ { name, value } ] } ] } } ] }
 * Walks nested children in case ESPN groups by division.
 */
export function parseStandings(data) {
  const out = {};
  const walk = (node) => {
    for (const e of node?.standings?.entries || []) {
      const abbr = FROM_ESPN[e.team?.abbreviation];
      if (!abbr) continue;
      const stat = (n) => Number(e.stats?.find((s) => s.name === n || s.type === n)?.value ?? 0);
      out[abbr] = { w: stat('wins'), l: stat('losses') };
    }
    for (const c of node?.children || []) walk(c);
  };
  walk(data);
  return out;
}
