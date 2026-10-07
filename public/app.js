import { PICKS, PICK_ORDER, teamStatus, pickResult, playerTotals, isDisagreement } from './shared/scoring.js';

const $ = (sel) => document.querySelector(sel);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const fmt1 = (n) => (n == null ? '—' : n.toFixed(1));
const signed = (n) => (n == null ? '—' : (n > 0 ? '+' : '') + n.toFixed(1));

const store = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch { /* private mode */ } },
};

const state = {
  teams: [], players: [], picks: {}, records: {}, lockAt: null, clockSkew: 0,
  me: store.get('pickem:me') || '',
  conf: store.get('pickem:conf') || 'All',
  sort: store.get('pickem:sort') || 'team',
  disagree: store.get('pickem:disagree') === '1',
};

const STATUS_LABEL = {
  clinchedOver: 'Over ✔', clinchedUnder: 'Under ✔',
  paceOver: 'On pace O', paceUnder: 'On pace U', pending: 'Not started',
};

const now = () => Date.now() + state.clockSkew;
const locked = () => state.lockAt && now() >= state.lockAt.getTime();
const passcode = () => $('#passcode').value;

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
  try {
    const s = await api('/api/standings');
    state.records = s.records || {};
    $('#standings-note').textContent = s.error ? `⚠ ${s.error}` : `Records from ESPN · ${new Date(s.updated).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
  } catch {
    $('#standings-note').textContent = '⚠ Standings unavailable';
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
  toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
}

const entryFor = (player, team) => state.picks[player]?.[team] || { pick: null, note: '' };

function statuses() {
  return Object.fromEntries(state.teams.map((t) => [t.abbr, teamStatus(t.line, state.records[t.abbr])]));
}

function chip(code, result) {
  if (!code) return '<span class="chip blank">—</span>';
  const p = PICKS[code];
  return `<span class="chip ${p.dir || ''} r-${result}" title="${esc(p.label)} (${p.pts})">${esc(p.short)}</span>`;
}

// ---------- render ----------

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
  el.textContent = `Picks lock at tip-off, ${when} · ${d}d ${h}h ${m}m left`;
  el.classList.remove('locked');
}

function renderPlayers() {
  const sel = $('#me');
  sel.innerHTML = '<option value="">Just looking</option>' +
    state.players.map((p) => `<option ${p === state.me ? 'selected' : ''}>${esc(p)}</option>`).join('');
  if (state.me && !state.players.includes(state.me)) state.me = '';

  $('#player-list').innerHTML = state.players.length
    ? state.players.map((p) => `<li>${esc(p)}${locked() ? '' : ` <button data-remove="${esc(p)}">Remove</button>`}</li>`).join('')
    : '<li class="muted">No players yet — add some.</li>';
}

function renderScoreboard(st) {
  const total = state.teams.length;
  $('#scoreboard').innerHTML = state.players.length ? state.players.map((p) => {
    const t = playerTotals(state.picks[p], st);
    const counts = PICK_ORDER.filter((c) => t.counts[c])
      .map((c) => `<span class="chip ${PICKS[c].dir || ''}" title="${esc(PICKS[c].label)}">${esc(PICKS[c].short)} × ${t.counts[c]}</span>`)
      .join('') || '<span class="empty small">No picks yet</span>';
    return `<div class="card ${p === state.me ? 'me-card' : ''}">
      <h3><span>${esc(p)}</span><span class="muted small">${t.made}/${total} picked</span></h3>
      <div class="pts">
        <div><b>${t.won}</b><span>clinched</span></div>
        <div><b>${t.onPace}</b><span>on pace</span></div>
        <div><b>${t.maxPossible}</b><span>max possible</span></div>
      </div>
      <div class="counts">${counts}</div>
    </div>`;
  }).join('') : '<p class="muted">Add players in the Players section below.</p>';
}

function sortedTeams(st) {
  let rows = state.teams.slice();
  if (state.conf !== 'All') rows = rows.filter((t) => t.conf === state.conf);
  if (state.disagree) rows = rows.filter((t) => isDisagreement(state.players.map((p) => entryFor(p, t.abbr).pick)));
  const by = {
    team: (a, b) => a.name.localeCompare(b.name),
    conf: (a, b) => a.conf.localeCompare(b.conf) || a.name.localeCompare(b.name),
    line: (a, b) => b.line - a.line,
    diff: (a, b) => (st[b.abbr].diff ?? -Infinity) - (st[a.abbr].diff ?? -Infinity) || b.line - a.line,
    last: (a, b) => b.last[0] - a.last[0],
  }[state.sort] || ((a, b) => a.name.localeCompare(b.name));
  return rows.sort(by);
}

function renderTable(st) {
  const canEdit = state.me && state.players.includes(state.me);
  $('#board thead').innerHTML = `<tr>
    <th class="team">Team</th><th class="num">2025-26</th><th class="num">Line</th>
    <th class="num">2026-27</th><th class="num">Pace</th><th class="num">vs line</th><th>Status</th>
    ${state.players.map((p) => `<th class="player ${p === state.me ? 'mine' : ''}">${esc(p)}${p === state.me ? ' (you)' : ''}</th>`).join('')}
  </tr>`;

  const rows = sortedTeams(st);
  $('#board tbody').innerHTML = rows.length ? rows.map((t) => {
    const s = st[t.abbr];
    const rec = state.records[t.abbr];
    const dis = isDisagreement(state.players.map((p) => entryFor(p, t.abbr).pick));
    const cells = state.players.map((p) => {
      const e = entryFor(p, t.abbr);
      const result = pickResult(e.pick, s.state);
      if (canEdit && p === state.me) return `<td>${editorCell(t, e, result)}</td>`;
      const note = e.note ? `<button class="note-btn" data-note="${esc(p)}|${t.abbr}" title="${esc(e.note)}" aria-label="Read ${esc(p)}'s note">📝</button>` : '';
      return `<td><div class="row">${chip(e.pick, result)}${note}</div></td>`;
    }).join('');
    return `<tr class="${dis ? 'disagree' : ''}">
      <td class="team"><b>${t.abbr}</b><small>${esc(t.name)} · ${t.conf}</small></td>
      <td class="num">${t.last[0]}-${t.last[1]}</td>
      <td class="num"><b>${t.line}</b></td>
      <td class="num">${rec && rec.w + rec.l ? `${rec.w}-${rec.l}` : '0-0'}</td>
      <td class="num">${fmt1(s.pace)}</td>
      <td class="num ${s.diff > 0 ? 'pos' : s.diff < 0 ? 'neg' : ''}">${signed(s.diff)}</td>
      <td><span class="status ${s.state}">${STATUS_LABEL[s.state]}</span></td>
      ${cells}
    </tr>`;
  }).join('') : `<tr><td colspan="${7 + state.players.length}" class="muted">No teams match these filters.</td></tr>`;
}

function editorCell(t, e, result) {
  const dir = PICKS[e.pick]?.dir || '';
  const options = ['<option value="">— pick —</option>']
    .concat(PICK_ORDER.map((c) => `<option value="${c}" ${c === e.pick ? 'selected' : ''}>${esc(PICKS[c].label)} (${PICKS[c].pts})</option>`))
    .join('');
  const pickUi = locked()
    ? chip(e.pick, result)
    : `<select class="${dir}" data-pick="${t.abbr}" aria-label="Your pick for ${esc(t.name)}">${options}</select>`;
  return `<div class="cell">
    <div class="row">${pickUi}</div>
    <input class="note" data-notefor="${t.abbr}" value="${esc(e.note)}" maxlength="280" placeholder="Note…" aria-label="Your note for ${esc(t.name)}">
  </div>`;
}

function render() {
  const st = statuses();
  renderLock();
  renderPlayers();
  renderScoreboard(st);
  renderTable(st);
  document.querySelectorAll('.seg button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.conf === state.conf)));
  $('#sort').value = state.sort;
  $('#disagree').checked = state.disagree;
}

// Re-render without clobbering a note the user is typing.
function safeRender() {
  const a = document.activeElement;
  if (a && a.matches('input.note, #new-player, #passcode')) return;
  render();
}

// ---------- actions ----------

async function savePick(team, patch, el) {
  if (!passcode()) {
    toast('Enter the passcode first');
    $('#passcode').focus();
    render();
    return;
  }
  const before = entryFor(state.me, team);
  (state.picks[state.me] ||= {})[team] = { ...before, ...patch };
  el?.classList.add('saving');
  try {
    const { entry } = await api('/api/pick', { passcode: passcode(), player: state.me, team, ...patch });
    state.picks[state.me][team] = entry;
    toast('pick' in patch ? 'Pick saved' : 'Note saved');
  } catch (err) {
    state.picks[state.me][team] = before;
    toast(err.message);
  }
  el?.classList.remove('saving');
  if ('pick' in patch) render(); else safeRender();
}

async function playerAction(action, name) {
  if (!passcode()) { toast('Enter the passcode first'); $('#passcode').focus(); return; }
  try {
    const r = await api('/api/players', { passcode: passcode(), action, name });
    state.players = r.players;
    if (action === 'remove') delete state.picks[name];
    toast(action === 'add' ? `Added ${name}` : `Removed ${name}`);
    render();
  } catch (err) {
    toast(err.message);
  }
}

// ---------- wiring ----------

$('#passcode').value = store.get('pickem:pass') || '';
$('#passcode').addEventListener('change', (e) => store.set('pickem:pass', e.target.value));

$('#me').addEventListener('change', (e) => {
  state.me = e.target.value;
  store.set('pickem:me', state.me);
  render();
});

document.querySelector('.seg').addEventListener('click', (e) => {
  const c = e.target.closest('button')?.dataset.conf;
  if (!c) return;
  state.conf = c;
  store.set('pickem:conf', c);
  render();
});
$('#sort').addEventListener('change', (e) => { state.sort = e.target.value; store.set('pickem:sort', state.sort); render(); });
$('#disagree').addEventListener('change', (e) => { state.disagree = e.target.checked; store.set('pickem:disagree', state.disagree ? '1' : '0'); render(); });

$('#board').addEventListener('change', (e) => {
  const sel = e.target.closest('select[data-pick]');
  if (sel) savePick(sel.dataset.pick, { pick: sel.value || null }, sel);
});

// Notes save when you leave the field or press Enter.
$('#board').addEventListener('focusout', (e) => {
  const inp = e.target.closest('input[data-notefor]');
  if (!inp) return;
  const team = inp.dataset.notefor;
  if (inp.value !== (entryFor(state.me, team).note || '')) savePick(team, { note: inp.value }, inp);
  else setTimeout(safeRender);
});
$('#board').addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && e.target.matches('input[data-notefor]')) e.target.blur();
});

$('#board').addEventListener('click', (e) => {
  const btn = e.target.closest('[data-note]');
  if (!btn) return;
  const [player, team] = btn.dataset.note.split('|');
  $('#note-title').textContent = `${player} on ${team}`;
  $('#note-body').textContent = entryFor(player, team).note;
  $('#note-dialog').showModal();
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
  setInterval(refresh, 60_000);            // shared picks
  setInterval(() => loadStandings().then(safeRender), 15 * 60_000); // records
  let wasLocked = locked();
  setInterval(() => {
    renderLock();
    if (locked() !== wasLocked) { wasLocked = locked(); render(); } // swap dropdowns for chips at tip-off
  }, 30_000);
})();
