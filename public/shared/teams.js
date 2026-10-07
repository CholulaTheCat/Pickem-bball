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

// Preseason outlooks (as of Oct 7, 2026), from offseason coverage on
// NBA.com, ESPN, Hoops Rumors and Yahoo Sports. Edit freely.
export const OUTLOOKS_AS_OF = 'Oct 7, 2026';
const OUTLOOKS = {
  ATL: 'Traded Trae Young to WAS at the deadline and went 27-14 with CJ McCollum. Now Jalen Johnson\'s team, built on defense: added Lu Dort and Aaron Wiggins from OKC, lost Jonathan Kuminga and Zaccharie Risacher.',
  BOS: 'Jaylen Brown went to PHI for Paul George. Jayson Tatum is fully healthy after returning from his Achilles tear late last season; added Mitchell Robinson and Mike Conley.',
  BKN: 'Still rebuilding. Drafted Mikel Brown Jr. at No. 6 and traded for Julius Randle. Line is +4.5 on last year\'s 20 wins.',
  CHA: 'Big reshuffle: LaMelo Ball to MIN and Miles Bridges to PHX. Added Naz Reid, Dennis Schröder, Grayson Allen, Royce O\'Neale and Dorian Finney-Smith. Line is down 4.5 from last year\'s 44 wins.',
  CHI: 'Added Norman Powell, Nic Claxton and Buddy Hield plus draft pick Caleb Wilson; lost Collin Sexton and Anfernee Simons. Priced right around last year\'s 31 wins.',
  CLE: 'Beat DET in Game 7 of the 2nd round. Lost depth (Max Strus, Dean Wade, Dennis Schröder, Larry Nance Jr.); added Peyton Watson. Line is 4.5 under last year\'s 52 wins.',
  DET: 'Last year\'s No. 1 seed at 60-22, but lost to CLE in the 2nd round. Line implies a 10-win regression: three-point shooting was a weakness, and Tobias Harris and Isaiah Stewart left; added John Collins and Isaiah Joe.',
  IND: 'The biggest swing up (+25.5): Tyrese Haliburton is back after missing all of last season with a torn Achilles, plus a full year of Ivica Zubac (acquired at the deadline). Added Kelly Oubre Jr. and Larry Nance Jr.',
  MIA: 'Traded Tyler Herro, Kel\'el Ware, Jaime Jaquez Jr. and three firsts to MIL for Giannis Antetokounmpo (plus Bobby Portis). Thinner roster, but a top-5 player.',
  MIL: 'Post-Giannis rebuild. Got Tyler Herro, Kel\'el Ware, Jaime Jaquez Jr., Kasparas Jakučionis and three firsts. Line is 6.5 below last year\'s 32 wins.',
  NYK: 'Defending champs: beat SAS 4-1 in the Finals, with Jalen Brunson as Finals MVP. Mostly running it back; lost Mitchell Robinson to BOS and added Andre Drummond.',
  ORL: 'New coach Sean Sweeney. Banchero, Wagner and Bane all missed time last year (Wagner played just 34 games). Added Nikola Vučević. The line is basically a "stay healthy" bet.',
  PHI: 'The splashiest summer: got Jaylen Brown for Paul George and signed LeBron James. Also added Anfernee Simons and Kentavious Caldwell-Pope. Line is +5.5 on last year\'s 45 wins.',
  TOR: 'Brought back Kawhi Leonard (27.9 ppg last year) from LAC for Brandon Ingram, Gradey Dick and picks; the deal wasn\'t finalized until mid-September. Kawhi\'s health is the swing factor.',
  WAS: 'Traded for Trae Young (then extended him) and Anthony Davis last season, and drafted AJ Dybantsa No. 1. The third-biggest swing up (+12.5), but AD has played 71 games in two years.',
  DAL: 'Cooper Flagg (Rookie of the Year) plus Kyrie Irving back from his ACL tear; AD was traded at the deadline. New front office under Masai Ujiri and new coach Dusty May. Line is +8.5.',
  DEN: 'Jokić, Murray and Gordon are intact. Added DeMar DeRozan; lost depth (Peyton Watson, Tim Hardaway Jr., Bruce Brown). Three straight early playoff exits; line is 4.5 under last year\'s 54 wins.',
  GSW: 'Curry is healthy and there\'s a full year of Kristaps Porziņģis, but Jimmy Butler (knee) is out until around early 2027. Added Yaxel Lendeborg and Georges Niang.',
  HOU: 'Fred VanVleet is back after missing all of last season (ACL), alongside Kevin Durant, Şengün and Amen Thompson. Added Marcus Smart and Bogdan Bogdanović. Line is 4.5 under last year\'s 52 wins.',
  LAC: 'The biggest swing down (-11.5): Kawhi went to TOR, and Harden was already gone. Got Brandon Ingram and Gradey Dick for him, plus Rui Hachimura and Max Strus. The NBA is investigating the team\'s salary-cap handling of Kawhi\'s contract.',
  LAL: 'LeBron left for PHI. Luka\'s team now, with new pieces Walker Kessler (sign-and-trade from UTA), Quentin Grimes, Collin Sexton and Sandro Mamukelashvili. Line is 6.5 below last year\'s 53 wins.',
  MEM: 'Ja Morant traded to POR for Jerami Grant and Kris Murray. Drafted Cameron Boozer No. 3 to pair with Zach Edey; added Isaiah Stewart and D\'Angelo Russell. Line is +4.5.',
  MIN: 'Traded for LaMelo Ball to pair with Anthony Edwards, and added Jonathan Kuminga. Lost Julius Randle (BKN) and Naz Reid (CHA). Line is basically flat on last year\'s 49 wins.',
  NOP: 'Barely changed: re-signed DeAndre Jordan and little else. Hoping for internal growth and a healthy Zion off a 26-win year.',
  OKC: 'Still the favorite at 62.5 off a 64-18 season. Lost wings Lu Dort, Aaron Wiggins and Isaiah Joe; added draft picks Aday Mara and Bennett Stirtz.',
  PHX: 'Booker, Jalen Green (who was limited by hamstring issues last year) and Dillon Brooks. Swapped Grayson Allen and Royce O\'Neale for Miles Bridges, and added Luke Kennard. Line is 3.5 below last year\'s 45 wins.',
  POR: 'Damian Lillard returns from his Achilles tear, and they traded for Ja Morant (Jerami Grant went to MEM). New coach Micah Nori has a crowded backcourt around All-Star Deni Avdija.',
  SAC: 'Lowest line in the league. Rookie Darius Acuff Jr. (No. 7 pick) runs the offense; DeMar DeRozan and Russell Westbrook are gone, and Ben Simmons was added.',
  SAS: 'Lost the Finals 4-1 to NYK. Wembanyama (reigning DPOY, early MVP favorite), Stephon Castle and Dylan Harper, plus veteran Tobias Harris. Highest Spurs win total in 30+ years.',
  UTA: 'Drafted Darryn Peterson No. 2, and Jaren Jackson Jr. is healthy alongside Lauri Markkanen. Traded Walker Kessler to LAL for two firsts. Line is +16.5, the second-biggest jump.',
};
for (const t of TEAMS) t.outlook = OUTLOOKS[t.abbr] || '';

export const TEAM_BY_ABBR = Object.fromEntries(TEAMS.map((t) => [t.abbr, t]));

// ESPN abbreviation -> our abbreviation.
export const FROM_ESPN = Object.fromEntries(TEAMS.map((t) => [t.espn || t.abbr, t.abbr]));
