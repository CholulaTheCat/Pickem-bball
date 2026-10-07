import { PICKS, PICK_ORDER, teamStatus, pickResult, playerTotals, isDisagreement } from './shared/scoring.js';
import { OUTLOOKS_AS_OF } from './shared/teams.js';

const $ = (sel) => document.querySelector(sel);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const fmt1 = (n) => (n == null ? '—' : n.toFixed(1));
const signed = (n) => (n == null ? '—' : (n > 0 ? '+' : '') + n.toFixed(1));

const store = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch { /* private mode */ } },
};

const narrow = () => window.matchMedia('(max-width: 899px)').matches;

const state = {
  teams: [], players: [], picks: {}, records: {}, lockAt: null, clockSkew: 0, preseason: true,
  me: store.get('pickem:me') || '',
  view: store.get('pickem:view') || (narrow() ? 'cards' : 'table'),
  conf: store.get('pickem:conf') || 'All',
  sort: store.get('pickem:sort') || 'team',
  disagree: store.get('pickem:disagree') === '1',
  unpicked: store.get('pickem:unpicked') === '1',
};

const now = () => Date.now() + state.clockSkew;
const locked = () => state.lockAt && now() >= state.lockAt.getTime();

function statusLabel(s) {
  return {
    clinchedOver: 'Over ✔', clinchedUnder: 'Under ✔', paceOver: 'On pace O', paceUnder: 'On pace U',
    pending: state.preseason ? 'Preseason' : 'No games yet',
  }[s.state];
}

// ---------- data ----------

async function api(path, body) {
  const r = await fetch(path, body ? {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  } : undefined);
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.error || `Request failed (${r.status})`);
  return data;
}

async function loadState() {
  const s = await api('/api/state');
  state.teams = s.teams;
  state.players = s.players;
  state.picks = s.picks;
  state.lockAt = new Date(s.lockAt);
  state.clockSkew = new Date(s.now).getTime() - Date.now();
  if (!s.persistent) banner('No database connected — picks are only kept in memory. See README to add Upstash Redis.');
}

async function loadStandings() {
  const note = $('#standings-note');
  try {
    const s = await api('/api/standings');
    state.preseason = Boolean(s.preseason);
    state.records = s.records || {};
    if (s.preseason) note.textContent = 'Season tips off Oct 20 — records start then';
    else if (s.error) note.textContent = `⚠ ${s.error}`;
    else note.textContent = `Records from ESPN · ${new Date(s.updated).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
  } catch {
    note.textContent = '⚠ Standings unavailable';
  }
}

// ---------- helpers ----------

function banner(msg) {
  const b = $('#banner');
  b.textContent = msg;
  b.hidden = !msg;
}

let toastTimer;
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
}

const entryFor = (player, team) => state.picks[player]?.[team] || { pick: null, note: '' };
const isMe = (p) => p === state.me && state.players.includes(p);

function statuses() {
  return Object.fromEntries(state.teams.map((t) => [t.abbr, teamStatus(t.line, state.records[t.abbr])]));
}

function chip(code, result) {
  if (!code) return '<span class="chip blank">—</span>';
  const p = PICKS[code];
  return `<span class="chip ${p.dir || ''} r-${result}" title="${esc(p.label)} (${p.pts})">${esc(p.short)}</span>`;
}

function noteButton(player, abbr, note) {
  return note ? `<button class="note-btn" data-note="${esc(player)}|${abbr}" title="${esc(note)}" aria-label="Read ${esc(player)}'s note">📝</button>` : '';
}

function recordText(abbr) {
  const r = state.records[abbr];
  return r && r.w + r.l ? `${r.w}-${r.l}` : '—';
}

function showDialog(title, body) {
  $('#note-title').textContent = title;
  $('#note-body').textContent = body;
  $('#note-dialog').showModal();
}

// ---------- render: header bits ----------

function renderLock() {
  const el = $('#lock-status');
  if (!state.lockAt) return;
  if (locked()) {
    el.textContent = '🔒 Picks locked — notes still editable';
    el.classList.add('locked');
    return;
  }
  const ms = state.lockAt.getTime() - now();
  const d = Math.floor(ms / 86400000);
  const h = Math.floor((ms % 86400000) / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const when = state.lockAt.toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York' }) + ' ET';
  el.textContent = `Picks lock ${when} · ${d}d ${h}h ${m}m left`;
  el.classList.remove('locked');
}

function renderPlayerBar() {
  if (state.me && !state.players.includes(state.me)) state.me = '';
  const total = state.teams.length;
  const chips = state.players.map((p) => {
    const made = Object.values(state.picks[p] || {}).filter((e) => PICKS[e?.pick]).length;
    return `<button class="pchip" data-me="${esc(p)}" aria-pressed="${p === state.me}">${esc(p)} <small>${made}/${total}</small></button>`;
  }).join('');
  $('#player-chips').innerHTML = state.players.length
    ? `${chips}<button class="pchip" data-me="" aria-pressed="${!state.me}">Everyone</button>`
    : '<a href="#admin" class="muted small">Add players to start ↓</a>';

  $('#player-list').innerHTML = state.players.length
    ? state.players.map((p) => `<li>${esc(p)}${locked() ? '' : ` <button data-remove="${esc(p)}">Remove</button>`}</li>`).join('')
    : '<li class="muted">No players yet.</li>';
}

const BREAKDOWN = [
  ['LO', 'Lean over'], ['SO', 'Strong over'], ['BO', 'House over'],
  ['LU', 'Lean under'], ['SU', 'Strong under'], ['BU', 'House under'], ['SA', 'Stay away'],
];

// One horizontal bar per pick type. All players share one scale so the cards compare.
function breakdownChart(player, counts, max) {
  return `<div class="breakdown" role="table" aria-label="${esc(player)}'s picks by type">
    ${BREAKDOWN.map(([code, label]) => {
      const n = counts[code];
      const pct = max ? (n / max) * 100 : 0;
      const tip = `${player}: ${PICKS[code].label} (${PICKS[code].pts}) — ${n} pick${n === 1 ? '' : 's'}`;
      return `<div class="brow" role="row" title="${esc(tip)}">
        <span class="blabel" role="rowheader">${label}</span>
        <span class="btrack" role="cell"><span class="bar ${PICKS[code].dir || 'none'}" style="width:${pct}%"></span></span>
        <span class="bnum" role="cell">${n}</span>
      </div>`;
    }).join('')}
  </div>`;
}

function renderScoreboard(st) {
  const totals = Object.fromEntries(state.players.map((p) => [p, playerTotals(state.picks[p], st)]));
  const max = Math.max(1, ...Object.values(totals).flatMap((t) => Object.values(t.counts)));
  $('#scoreboard').innerHTML = state.players.length ? state.players.map((p) => {
    const t = totals[p];
    const overs = t.counts.LO + t.counts.SO + t.counts.BO;
    const unders = t.counts.LU + t.counts.SU + t.counts.BU;
    const points = state.preseason
      ? `<div><b>${t.wagered}</b><span>pts in play</span></div>`
      : `<div><b>${t.won}</b><span>clinched</span></div><div><b>${t.onPace}</b><span>on pace</span></div><div><b>${t.maxPossible}</b><span>max possible</span></div>`;
    return `<div class="card ${p === state.me ? 'me-card' : ''}">
      <h3><span>${esc(p)}</span><span class="muted small">${t.made}/${state.teams.length} picked</span></h3>
      <div class="pts">
        <div><b class="tot-over">${overs}</b><span>overs</span></div>
        <div><b class="tot-under">${unders}</b><span>unders</span></div>
        ${points}
      </div>
      ${breakdownChart(p, t.counts, max)}
    </div>`;
  }).join('') : '<p class="muted">No players yet — add them at the bottom of the page.</p>';
}

function renderControls() {
  document.querySelectorAll('[data-conf]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.conf === state.conf)));
  document.querySelectorAll('[data-view]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.view === state.view)));
  $('#sort').value = state.sort;
  $('#disagree').checked = state.disagree;
  $('#unpicked').checked = state.unpicked;
  $('#unpicked-wrap').hidden = !isMe(state.me);
}

// ---------- render: teams ----------

function visibleTeams(st) {
  let rows = state.teams.slice();
  if (state.conf !== 'All') rows = rows.filter((t) => t.conf === state.conf);
  if (state.disagree) rows = rows.filter((t) => isDisagreement(state.players.map((p) => entryFor(p, t.abbr).pick)));
  if (state.unpicked && isMe(state.me)) rows = rows.filter((t) => !PICKS[entryFor(state.me, t.abbr).pick]);
  const by = {
    team: (a, b) => a.name.localeCompare(b.name),
    conf: (a, b) => a.conf.localeCompare(b.conf) || a.name.localeCompare(b.name),
    line: (a, b) => b.line - a.line,
    swing: (a, b) => Math.abs(b.line - b.last[0]) - Math.abs(a.line - a.last[0]),
    diff: (a, b) => (st[b.abbr].diff ?? -Infinity) - (st[a.abbr].diff ?? -Infinity) || b.line - a.line,
    last: (a, b) => b.last[0] - a.last[0],
  }[state.sort] || ((a, b) => a.name.localeCompare(b.name));
  return rows.sort(by);
}

function emptyMessage() {
  if (state.unpicked && isMe(state.me)) return `🎉 ${esc(state.me)} has picked every team${state.conf !== 'All' ? ` in the ${state.conf}` : ''}.`;
  return 'No teams match these filters.';
}

function pickGrid(t, e) {
  const btn = (code) => {
    const p = PICKS[code];
    const label = { LO: 'Lean', LU: 'Lean', SO: 'Strong', SU: 'Strong', BO: 'House', BU: 'House', SA: 'Stay away' }[code];
    return `<button class="pick ${p.dir || 'none'}" data-team="${t.abbr}" data-code="${code}" aria-pressed="${e.pick === code}"
      aria-label="${esc(p.label)} for ${esc(t.name)}">${label}${p.pts ? ` <small>+${p.pts}</small>` : ''}</button>`;
  };
  return `<div class="pickgrid" role="group" aria-label="Your pick for ${esc(t.name)}">
    <span class="rowlabel over">Over</span>${btn('LO')}${btn('SO')}${btn('BO')}
    <span class="rowlabel under">Under</span>${btn('LU')}${btn('SU')}${btn('BU')}
    ${btn('SA')}
  </div>`;
}

function noteInput(t, e) {
  return `<input class="note" data-notefor="${t.abbr}" value="${esc(e.note)}" maxlength="280" placeholder="Note…" enterkeyhint="done" aria-label="Your note for ${esc(t.name)}">`;
}

function renderCards(st, rows) {
  const editing = isMe(state.me);
  $('#cards').innerHTML = rows.length ? rows.map((t) => {
    const s = st[t.abbr];
    const mine = entryFor(state.me, t.abbr);
    const swing = t.line - t.last[0];
    const others = state.players.filter((p) => !editing || p !== state.me).map((p) => {
      const e = entryFor(p, t.abbr);
      return `<span class="who">${esc(p)} ${chip(e.pick, pickResult(e.pick, s.state))}${noteButton(p, t.abbr, e.note)}</span>`;
    }).join('');
    const live = s.gp ? `<span>${recordText(t.abbr)}</span><span>Pace ${fmt1(s.pace)}</span><span class="${s.diff > 0 ? 'pos' : s.diff < 0 ? 'neg' : ''}">${signed(s.diff)}</span>` : '';
    let mineUi = '';
    if (editing) {
      mineUi = locked()
        ? `<div class="mine-locked">Your pick: ${chip(mine.pick, pickResult(mine.pick, s.state))}</div>`
        : pickGrid(t, mine);
      mineUi += noteInput(t, mine);
    }
    return `<article class="tcard ${isDisagreement(state.players.map((p) => entryFor(p, t.abbr).pick)) ? 'disagree' : ''}">
      <header>
        <div class="tname"><b>${t.abbr}</b> ${esc(t.name)}<small>${t.conf} · 2025-26: ${t.last[0]}-${t.last[1]} · <span class="${swing > 0 ? 'pos' : 'neg'}">${signed(swing)}</span> vs last year</small></div>
        <div class="tline"><span>Line</span><b>${t.line}</b></div>
      </header>
      ${s.state === 'pending' && state.preseason ? '' : `<div class="tstatus"><span class="status ${s.state}">${statusLabel(s)}</span>${live}</div>`}
      ${t.outlook ? `<p class="outlook">${esc(t.outlook)}</p>` : ''}
      ${mineUi}
      ${others ? `<div class="others">${others}</div>` : ''}
    </article>`;
  }).join('') : `<p class="muted empty-msg">${emptyMessage()}</p>`;
}

function renderTable(st, rows) {
  const editing = isMe(state.me);
  $('#board thead').innerHTML = `<tr>
    <th class="team">Team</th><th class="num">2025-26</th><th class="num">Line</th>
    <th class="num">2026-27</th><th class="num">Pace</th><th class="num">vs line</th><th>Status</th>
    ${state.players.map((p) => `<th class="player ${p === state.me ? 'mine' : ''}">${esc(p)}${p === state.me ? ' (you)' : ''}</th>`).join('')}
  </tr>`;

  $('#board tbody').innerHTML = rows.length ? rows.map((t) => {
    const s = st[t.abbr];
    const dis = isDisagreement(state.players.map((p) => entryFor(p, t.abbr).pick));
    const cells = state.players.map((p) => {
      const e = entryFor(p, t.abbr);
      const result = pickResult(e.pick, s.state);
      if (editing && p === state.me) return `<td>${editorCell(t, e, result)}</td>`;
      return `<td><div class="row">${chip(e.pick, result)}${noteButton(p, t.abbr, e.note)}</div></td>`;
    }).join('');
    return `<tr class="${dis ? 'disagree' : ''}">
      <td class="team"><b>${t.abbr}${t.outlook ? ` <button class="info-btn" data-outlook="${t.abbr}" aria-label="${esc(t.name)} outlook">ⓘ</button>` : ''}</b><small>${esc(t.name)} · ${t.conf}</small></td>
      <td class="num">${t.last[0]}-${t.last[1]}</td>
      <td class="num"><b>${t.line}</b></td>
      <td class="num">${recordText(t.abbr)}</td>
      <td class="num">${fmt1(s.pace)}</td>
      <td class="num ${s.diff > 0 ? 'pos' : s.diff < 0 ? 'neg' : ''}">${signed(s.diff)}</td>
      <td><span class="status ${s.state}">${statusLabel(s)}</span></td>
      ${cells}
    </tr>`;
  }).join('') : `<tr><td colspan="${7 + state.players.length}" class="muted">${emptyMessage()}</td></tr>`;
}

function editorCell(t, e, result) {
  if (locked()) return `<div class="cell">${chip(e.pick, result)}${noteInput(t, e)}</div>`;
  const dir = PICKS[e.pick]?.dir || '';
  const options = ['<option value="">— pick —</option>']
    .concat(PICK_ORDER.map((c) => `<option value="${c}" ${c === e.pick ? 'selected' : ''}>${esc(PICKS[c].label)} (${PICKS[c].pts})</option>`))
    .join('');
  return `<div class="cell">
    <select class="${dir}" data-pick="${t.abbr}" aria-label="Your pick for ${esc(t.name)}">${options}</select>
    ${noteInput(t, e)}
  </div>`;
}

function render() {
  const st = statuses();
  const rows = visibleTeams(st);
  renderLock();
  renderPlayerBar();
  renderScoreboard(st);
  renderControls();
  $('#cards').hidden = state.view !== 'cards';
  $('#table-wrap').hidden = state.view !== 'table';
  if (state.view === 'cards') renderCards(st, rows);
  else renderTable(st, rows);
}

// Re-render without clobbering a note someone is typing.
function safeRender() {
  const a = document.activeElement;
  if (a && a.matches('input.note, #new-player')) return;
  render();
}

// ---------- actions ----------

async function savePick(team, patch) {
  const before = entryFor(state.me, team);
  (state.picks[state.me] ||= {})[team] = { ...before, ...patch };
  if ('pick' in patch) render();
  try {
    const { entry } = await api('/api/pick', { player: state.me, team, ...patch });
    state.picks[state.me][team] = entry;
    toast('pick' in patch ? (patch.pick ? `${team}: ${PICKS[patch.pick].label}` : `${team}: pick cleared`) : 'Note saved');
  } catch (err) {
    state.picks[state.me][team] = before;
    toast(err.message);
  }
  if ('pick' in patch) render(); else safeRender();
}

async function playerAction(action, name) {
  try {
    const r = await api('/api/players', { action, name });
    state.players = r.players;
    if (action === 'remove') delete state.picks[name];
    if (action === 'add' && !state.me) { state.me = name; store.set('pickem:me', name); }
    toast(action === 'add' ? `Added ${name}` : `Removed ${name}`);
    render();
  } catch (err) {
    toast(err.message);
  }
}

// ---------- wiring ----------

const setPref = (key, value, storeKey, stored = value) => { state[key] = value; store.set(storeKey, stored); render(); };

$('#player-chips').addEventListener('click', (e) => {
  const b = e.target.closest('[data-me]');
  if (b) setPref('me', b.dataset.me, 'pickem:me');
});
document.querySelector('.views').addEventListener('click', (e) => {
  const v = e.target.closest('[data-view]')?.dataset.view;
  if (v) setPref('view', v, 'pickem:view');
});
document.querySelector('.seg.conf').addEventListener('click', (e) => {
  const c = e.target.closest('[data-conf]')?.dataset.conf;
  if (c) setPref('conf', c, 'pickem:conf');
});
$('#sort').addEventListener('change', (e) => setPref('sort', e.target.value, 'pickem:sort'));
$('#disagree').addEventListener('change', (e) => setPref('disagree', e.target.checked, 'pickem:disagree', e.target.checked ? '1' : '0'));
$('#unpicked').addEventListener('change', (e) => setPref('unpicked', e.target.checked, 'pickem:unpicked', e.target.checked ? '1' : '0'));

const teamsEl = $('#teams');

// Card view: tap a pick button; tap the selected one again to clear it.
teamsEl.addEventListener('click', (e) => {
  const pick = e.target.closest('button.pick');
  if (pick) {
    const current = entryFor(state.me, pick.dataset.team).pick;
    savePick(pick.dataset.team, { pick: current === pick.dataset.code ? null : pick.dataset.code });
    return;
  }
  const note = e.target.closest('[data-note]');
  if (note) {
    const [player, team] = note.dataset.note.split('|');
    showDialog(`${player} on ${team}`, entryFor(player, team).note);
    return;
  }
  const info = e.target.closest('[data-outlook]');
  if (info) {
    const t = state.teams.find((x) => x.abbr === info.dataset.outlook);
    showDialog(`${t.name} outlook`, `${t.outlook}\n\nAs of ${OUTLOOKS_AS_OF}.`);
  }
});

// Table view: dropdown.
teamsEl.addEventListener('change', (e) => {
  const sel = e.target.closest('select[data-pick]');
  if (sel) savePick(sel.dataset.pick, { pick: sel.value || null });
});

// Notes save when you leave the field or press Enter.
teamsEl.addEventListener('focusout', (e) => {
  const inp = e.target.closest('input[data-notefor]');
  if (!inp) return;
  const team = inp.dataset.notefor;
  if (inp.value !== (entryFor(state.me, team).note || '')) savePick(team, { note: inp.value });
  else setTimeout(safeRender);
});
teamsEl.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && e.target.matches('input[data-notefor]')) e.target.blur();
});

$('#add-player').addEventListener('submit', (e) => {
  e.preventDefault();
  const name = $('#new-player').value.trim();
  if (name) playerAction('add', name).then(() => { $('#new-player').value = ''; });
});
$('#player-list').addEventListener('click', (e) => {
  const name = e.target.dataset.remove;
  if (name && confirm(`Remove ${name} and all of their picks?`)) playerAction('remove', name);
});

// ---------- boot ----------

async function refresh() {
  try {
    await loadState();
    safeRender();
  } catch (err) {
    banner(`Couldn't reach the server: ${err.message}`);
  }
}

(async () => {
  await Promise.all([refresh(), loadStandings()]);
  render();
  setInterval(refresh, 60_000);                                    // shared picks
  setInterval(() => loadStandings().then(safeRender), 15 * 60_000); // records
  let wasLocked = locked();
  setInterval(() => {
    renderLock();
    if (locked() !== wasLocked) { wasLocked = locked(); render(); } // swap pick buttons for chips at tip-off
  }, 30_000);
})();
