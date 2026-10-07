# Pickem-bball

NBA 2026-27 over/under win-total pick'em for a small group of friends.

- All 30 teams with their 2025-26 record and 2026-27 BetMGM win total
- Picks: Lean over/under (1), Strong over/under (3), Bet the house over/under (5), Stay away (0), plus a short note on each pick
- Live tracking from ESPN standings: current record, pace (win % × 82), pace vs line, on/off pace, and clinched over/under
- A scoreboard per player: count of each pick type, points clinched, points on pace, max possible
- Filters: East/West, disagreements only, and sorting by pace vs line, line, team or last season
- **Picks lock at tip-off (Tue Oct 20 2026, 3:00pm ET)**, enforced on the server. Notes stay editable all season.
- No passwords: anyone with the link can pick, write notes and add players. Tap your name in the "Picking as" bar.
- Two views: **Pick** (big tap targets, the default on phones) and **Board** (the full comparison table, the default on desktop)
- A short preseason **Outlook** per team: roster moves behind big line swings

## Deploy (about 10 minutes, free)

1. **Import the repo in Vercel**: vercel.com → *Add New… → Project* → pick `Pickem-bball`. Framework preset: **Other**. Leave the build settings empty.
2. **Add a database**: in the project, go to *Storage → Create Database → Upstash for Redis* (free plan) and connect it to the project. This adds `KV_REST_API_URL` and `KV_REST_API_TOKEN` automatically.
3. **Redeploy** (*Deployments → ⋯ → Redeploy*) so the new variables take effect.
4. Open the site, open **Players** at the bottom and add everyone. Then tap a name in the "Picking as" bar and make picks.

Until a database is connected the site shows a red banner and keeps picks only in memory. If you created the database directly on upstash.com, add `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` under *Settings → Environment Variables* instead.

## Run locally

```sh
npm install
npm run dev                        # http://localhost:3000, in-memory storage
npm test                           # scoring + ESPN parser tests
```

Optional environment variables:
- `LOCK_AT`: override the pick lock time (ISO 8601), e.g. `LOCK_AT=2020-01-01T00:00:00Z` to test the locked state.
- Upstash variables (`KV_REST_API_URL`/`KV_REST_API_TOKEN`, or `UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN`) to use a real database.

## Changing data

- **Lines / last season's records**: edit `public/shared/teams.js` and push. Vercel redeploys automatically.
- **Scoring rules**: `public/shared/scoring.js` (used by both the page and the tests).
- **Standings**: `api/standings.js` fetches ESPN's free standings feed (`season=2027`, regular season only) and caches it for 15 minutes at Vercel's edge. Before tip-off it returns no records. Add `?season=2026` to the URL to check it against last season's final records.
- **Outlooks**: the `OUTLOOKS` map in `public/shared/teams.js` (as of Oct 7, 2026, compiled from NBA.com, ESPN, Hoops Rumors and Yahoo Sports offseason coverage).

## Layout

```
public/            static site (index.html, app.js, style.css)
public/shared/     teams + scoring, imported by the page and the API
api/               Vercel serverless functions: state, pick, players, standings
lib/               storage (Upstash Redis / in-memory), HTTP helpers, ESPN parser
dev-server.js      local server that mimics Vercel
test/              node:test unit tests
```
