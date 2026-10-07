import { FROM_ESPN } from '../public/shared/teams.js';

/**
 * Turn ESPN's standings payload into { ABBR: { w, l } }.
 * Shape: { children: [ { standings: { season, entries: [ { team: { abbreviation }, stats: [ { name, value } ] } ] } } ] }
 * Walks nested children in case ESPN groups by division.
 * If `season` is given and ESPN labels its standings with a different season
 * (it can fall back to last season's final table), returns {}.
 */
export function parseStandings(data, season) {
  const out = {};
  let wrongSeason = false;
  const walk = (node) => {
    const st = node?.standings;
    if (season && st?.season != null && Number(st.season) !== Number(season)) wrongSeason = true;
    for (const e of st?.entries || []) {
      const abbr = FROM_ESPN[e.team?.abbreviation];
      if (!abbr) continue;
      const stat = (n) => Number(e.stats?.find((s) => s.name === n || s.type === n)?.value ?? 0);
      out[abbr] = { w: stat('wins'), l: stat('losses') };
    }
    for (const c of node?.children || []) walk(c);
  };
  walk(data);
  return wrongSeason ? {} : out;
}
