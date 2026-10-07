import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pace, teamStatus, pickResult, playerTotals, isDisagreement } from '../public/shared/scoring.js';
import { TEAMS, FROM_ESPN } from '../public/shared/teams.js';
import { parseStandings } from '../lib/espn.js';

test('pace projects win % over 82 games', () => {
  assert.equal(pace(0, 0), null);
  assert.equal(pace(10, 10), 41);
  assert.equal(pace(3, 1), 61.5);
});

test('clinch boundaries on a 47.5 line', () => {
  assert.equal(teamStatus(47.5, { w: 47, l: 10 }).state, 'paceOver');
  assert.equal(teamStatus(47.5, { w: 48, l: 10 }).state, 'clinchedOver');
  // 34 losses: can still reach 48 wins
  assert.equal(teamStatus(47.5, { w: 20, l: 34 }).state, 'paceUnder');
  // 35 losses: max 47 wins
  assert.equal(teamStatus(47.5, { w: 20, l: 35 }).state, 'clinchedUnder');
});

test('no games yet is pending', () => {
  const s = teamStatus(40.5, { w: 0, l: 0 });
  assert.equal(s.state, 'pending');
  assert.equal(s.diff, null);
});

test('pick results follow team state', () => {
  assert.equal(pickResult('BO', 'clinchedOver'), 'won');
  assert.equal(pickResult('BU', 'clinchedOver'), 'lost');
  assert.equal(pickResult('LU', 'paceUnder'), 'on');
  assert.equal(pickResult('SO', 'paceUnder'), 'off');
  assert.equal(pickResult('SA', 'paceUnder'), 'none');
  assert.equal(pickResult(undefined, 'paceUnder'), 'none');
  assert.equal(pickResult('LO', 'pending'), 'pending');
});

test('player totals count picks and points', () => {
  const statuses = {
    OKC: teamStatus(62.5, { w: 63, l: 5 }),  // clinched over
    SAC: teamStatus(21.5, { w: 5, l: 61 }),  // clinched under
    BOS: teamStatus(51.5, { w: 10, l: 2 }),  // pace over
    MIA: teamStatus(46.5, { w: 2, l: 10 }),  // pace under
  };
  const t = playerTotals({
    OKC: { pick: 'BO' }, SAC: { pick: 'SO' }, BOS: { pick: 'LU' }, MIA: { pick: 'SA' }, DET: { note: 'no pick' },
  }, statuses);
  assert.equal(t.made, 4);
  assert.deepEqual(t.counts, { LO: 0, LU: 1, SO: 1, SU: 0, BO: 1, BU: 0, SA: 1 });
  assert.equal(t.wagered, 9);
  assert.equal(t.won, 5);
  assert.equal(t.lost, 3);
  assert.equal(t.onPace, 5);
  assert.equal(t.offPace, 4);
  assert.equal(t.maxPossible, 6);
});

test('disagreement ignores stay away and blanks', () => {
  assert.equal(isDisagreement(['LO', 'BO', 'SA', undefined]), false);
  assert.equal(isDisagreement(['LO', 'SU']), true);
});

test('team data is complete', () => {
  assert.equal(TEAMS.length, 30);
  assert.equal(TEAMS.filter((t) => t.conf === 'East').length, 15);
  assert.equal(Object.keys(FROM_ESPN).length, 30);
  for (const t of TEAMS) assert.equal(t.last[0] + t.last[1], 82, t.abbr);
});

test('parses ESPN standings payload', () => {
  const entry = (abbreviation, w, l) => ({
    team: { abbreviation },
    stats: [{ name: 'wins', value: w }, { name: 'losses', value: l }, { name: 'winPercent', value: 0.5 }],
  });
  const data = {
    children: [
      { name: 'Eastern Conference', standings: { entries: [entry('DET', 60, 22), entry('NY', 53, 29)] } },
      { name: 'Western Conference', standings: { entries: [entry('GS', 37, 45), entry('UTAH', 22, 60)] } },
    ],
  };
  assert.deepEqual(parseStandings(data), {
    DET: { w: 60, l: 22 }, NYK: { w: 53, l: 29 }, GSW: { w: 37, l: 45 }, UTA: { w: 22, l: 60 },
  });
});
