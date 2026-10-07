// 2026-27 NBA win totals (BetMGM) and 2025-26 final records.
// `espn` is ESPN's abbreviation where it differs from ours.
// To change a line, edit `line` here and redeploy.

export const SEASON = '2026-27';
export const LAST_SEASON = '2025-26';
export const GAMES = 82;

// Tip-off: Tue Oct 20 2026, 3:00pm ET (EDT, UTC-4).
export const DEFAULT_LOCK_AT = '2026-10-20T19:00:00Z';

export const TEAMS = [
  // East
  { abbr: 'ATL', name: 'Atlanta Hawks',          conf: 'East', last: [46, 36], line: 43.5 },
  { abbr: 'BOS', name: 'Boston Celtics',         conf: 'East', last: [56, 26], line: 51.5 },
  { abbr: 'BKN', name: 'Brooklyn Nets',          conf: 'East', last: [20, 62], line: 24.5 },
  { abbr: 'CHA', name: 'Charlotte Hornets',      conf: 'East', last: [44, 38], line: 39.5 },
  { abbr: 'CHI', name: 'Chicago Bulls',          conf: 'East', last: [31, 51], line: 29.5 },
  { abbr: 'CLE', name: 'Cleveland Cavaliers',    conf: 'East', last: [52, 30], line: 47.5 },
  { abbr: 'DET', name: 'Detroit Pistons',        conf: 'East', last: [60, 22], line: 49.5 },
  { abbr: 'IND', name: 'Indiana Pacers',         conf: 'East', last: [19, 63], line: 44.5 },
  { abbr: 'MIA', name: 'Miami Heat',             conf: 'East', last: [43, 39], line: 46.5 },
  { abbr: 'MIL', name: 'Milwaukee Bucks',        conf: 'East', last: [32, 50], line: 25.5 },
  { abbr: 'NYK', name: 'New York Knicks',        conf: 'East', last: [53, 29], line: 52.5, espn: 'NY' },
  { abbr: 'ORL', name: 'Orlando Magic',          conf: 'East', last: [45, 37], line: 45.5 },
  { abbr: 'PHI', name: 'Philadelphia 76ers',     conf: 'East', last: [45, 37], line: 50.5 },
  { abbr: 'TOR', name: 'Toronto Raptors',        conf: 'East', last: [46, 36], line: 46.5 },
  { abbr: 'WAS', name: 'Washington Wizards',     conf: 'East', last: [17, 65], line: 29.5, espn: 'WSH' },
  // West
  { abbr: 'DAL', name: 'Dallas Mavericks',       conf: 'West', last: [26, 56], line: 34.5 },
  { abbr: 'DEN', name: 'Denver Nuggets',         conf: 'West', last: [54, 28], line: 49.5 },
  { abbr: 'GSW', name: 'Golden State Warriors',  conf: 'West', last: [37, 45], line: 40.5, espn: 'GS' },
  { abbr: 'HOU', name: 'Houston Rockets',        conf: 'West', last: [52, 30], line: 47.5 },
  { abbr: 'LAC', name: 'LA Clippers',            conf: 'West', last: [42, 40], line: 30.5 },
  { abbr: 'LAL', name: 'Los Angeles Lakers',     conf: 'West', last: [53, 29], line: 46.5 },
  { abbr: 'MEM', name: 'Memphis Grizzlies',      conf: 'West', last: [25, 57], line: 29.5 },
  { abbr: 'MIN', name: 'Minnesota Timberwolves', conf: 'West', last: [49, 33], line: 48.5 },
  { abbr: 'NOP', name: 'New Orleans Pelicans',   conf: 'West', last: [26, 56], line: 25.5, espn: 'NO' },
  { abbr: 'OKC', name: 'Oklahoma City Thunder',  conf: 'West', last: [64, 18], line: 62.5 },
  { abbr: 'PHX', name: 'Phoenix Suns',           conf: 'West', last: [45, 37], line: 41.5 },
  { abbr: 'POR', name: 'Portland Trail Blazers', conf: 'West', last: [42, 40], line: 41.5 },
  { abbr: 'SAC', name: 'Sacramento Kings',       conf: 'West', last: [22, 60], line: 21.5 },
  { abbr: 'SAS', name: 'San Antonio Spurs',      conf: 'West', last: [62, 20], line: 60.5, espn: 'SA' },
  { abbr: 'UTA', name: 'Utah Jazz',              conf: 'West', last: [22, 60], line: 38.5, espn: 'UTAH' },
];

export const TEAM_BY_ABBR = Object.fromEntries(TEAMS.map((t) => [t.abbr, t]));

// ESPN abbreviation -> our abbreviation.
export const FROM_ESPN = Object.fromEntries(TEAMS.map((t) => [t.espn || t.abbr, t.abbr]));
