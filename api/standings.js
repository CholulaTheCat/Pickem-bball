import { parseStandings } from '../lib/espn.js';
import { lockAt, send } from '../lib/http.js';

const SEASON = '2027'; // ESPN labels seasons by the year they end

export default async function handler(req, res) {
  const asked = /^\d{4}$/.test(req.query?.season) ? req.query.season : null;
  const season = asked || SEASON;

  // Before tip-off there are no regular-season games; don't let ESPN hand us
  // last season's table or preseason results.
  if (!asked && Date.now() < lockAt().getTime()) {
    res.setHeader('Cache-Control', 's-maxage=900');
    return send(res, 200, { season, records: {}, preseason: true, tipoff: lockAt().toISOString() });
  }

  const url = `https://site.api.espn.com/apis/v2/sports/basketball/nba/standings?season=${season}&seasontype=2`;
  try {
    const r = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!r.ok) throw new Error(`ESPN ${r.status}`);
    const records = parseStandings(await r.json(), season);
    // Cache at Vercel's edge for 15 minutes; serve stale for up to an hour while refreshing.
    res.setHeader('Cache-Control', 's-maxage=900, stale-while-revalidate=3600');
    send(res, 200, { season, records, updated: new Date().toISOString() });
  } catch (err) {
    console.error(err);
    res.setHeader('Cache-Control', 's-maxage=60');
    send(res, 200, { season, records: {}, error: 'Standings unavailable right now' });
  }
}
