// Vice Ledger boot: loads the data, restores (or seeds) progress, renders
// the header dashboard and the active view, and wires every control.

import { loadData, trophyById, KIND_LABELS, KIND_ORDER, GRADE_ORDER, formatMinutes } from './data.js';
import { emptyState, loadState, saveState, clearState, buildSeed, isEarned, serializeState, parseImported, exportFilename } from './store.js';
import { computeAudit } from './audit.js';
import { kindChipsHtml, matchesFilters, trophyRowHtml, guidePaneHtml, auditStripHtml, warnBannerHtml, nextUpBarHtml } from './list.js';
import { roadmapHtml, missablesHtml, plannerHtml, journeyHtml, sourcesHtml, matrixHtml, nextUpList } from './views.js';
import { counterStep } from './bits.js';

const VIEWS = ['checklist', 'roadmap', 'missables', 'planner', 'journey', 'sources', 'matrix'];

let data = null;
let state = emptyState();
let seeded = false;
let view = 'checklist';
let selectedId = 28; // Positive Mental Attitude: missable + disputed — the pane that shows everything
const filters = { kind: 'all', grade: 'all', query: '', hideEarned: false, spoilers: false };

const $ = (sel) => document.querySelector(sel);

function persist() {
  if (!seeded) saveState(state);
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function setEarned(trophy, on) {
  if (on) state.earned[trophy.id] = { date: todayIso() };
  else delete state.earned[trophy.id];
  persist();
  renderAll();
}

function bumpCounter(trophy, delta) {
  const step = counterStep(trophy);
  const current = state.counts[trophy.id] ?? 0;
  const next = Math.max(0, Math.min(trophy.psnTarget, current + delta * step));
  state.counts[trophy.id] = next;
  if (next >= trophy.psnTarget && !isEarned(state, trophy)) {
    state.earned[trophy.id] = { date: todayIso() };
  }
  persist();
  renderAll();
}

function renderHeader() {
  const earned = data.trophies.filter((t) => isEarned(state, t));
  $('#earned-count').textContent = String(earned.length);
  const pct = Math.round((earned.length / data.trophies.length) * 100);
  $('#bar-fill').style.width = `${pct}%`;
  $('#bar-pct').textContent = `${pct}% of the list — ${data.trophies.length - earned.length} to go`;
  $('#grade-counts').innerHTML = GRADE_ORDER.map((g) => {
    const total = data.trophies.filter((t) => t.grade === g).length;
    const got = earned.filter((t) => t.grade === g).length;
    return `<div class="gc ${g}"><b>${got} / ${total}</b><span>${g}</span></div>`;
  }).join('');
  const remaining = data.trophies.filter((t) => !isEarned(state, t)).reduce((a, t) => a + t.timeMinutes, 0);
  $('#forecast').innerHTML = earned.length === data.trophies.length
    ? `<b>Platinum earned</b><span>forecast complete</span>`
    : `<b>≈ ${formatMinutes(remaining).replace('~', '')}</b><span>platinum forecast</span>`;
  $('#kind-bars').innerHTML = KIND_ORDER.map((kind) => {
    const inKind = data.trophies.filter((t) => t.kind === kind);
    if (!inKind.length) return '';
    const got = inKind.filter((t) => isEarned(state, t)).length;
    return `<div class="kb"><div class="kb-top"><b>${KIND_LABELS[kind]}</b><span>${got}/${inKind.length}</span></div>` +
      `<div class="kb-bar"><div style="width:${Math.round((got / inKind.length) * 100)}%"></div></div></div>`;
  }).join('');
}

function renderChecklistExtras() {
  $('#audit-strip').innerHTML = auditStripHtml(computeAudit(data));
  $('#warn-banner').innerHTML = warnBannerHtml(data);
  $('#nextup-bar').innerHTML = nextUpBarHtml(nextUpList(data, state, 3));
  $('#kind-chips').innerHTML = kindChipsHtml(filters.kind);
}

function renderList() {
  const rows = data.trophies.filter((t) => matchesFilters(t, state, filters));
  $('#list').innerHTML = rows.length
    ? rows.map((t) => trophyRowHtml(t, state, filters, selectedId)).join('')
    : '<div class="empty">No trophies match those filters.</div>';
  const selected = trophyById(data, selectedId) ?? data.trophies[0];
  $('#guide-pane').innerHTML = guidePaneHtml(selected, data, state, filters);
}

function renderView() {
  for (const v of VIEWS) {
    const el = $(`#view-${v}`);
    if (el) el.hidden = v !== view;
  }
  document.querySelectorAll('#tabs button').forEach((b) => b.classList.toggle('on', b.dataset.view === view));
  if (view === 'checklist') { renderChecklistExtras(); renderList(); }
  if (view === 'roadmap') $('#view-roadmap').innerHTML = roadmapHtml(data, state);
  if (view === 'missables') $('#view-missables').innerHTML = missablesHtml(data, state);
  if (view === 'planner') $('#view-planner').innerHTML = plannerHtml(data, state);
  if (view === 'journey') $('#view-journey').innerHTML = journeyHtml(data, state);
  if (view === 'sources') $('#view-sources').innerHTML = sourcesHtml(data);
  if (view === 'matrix') $('#view-matrix').innerHTML = matrixHtml(data);
}

function renderAll() {
  renderHeader();
  renderView();
}

function openTrophy(id, goChecklist = true) {
  selectedId = id;
  if (goChecklist && view !== 'checklist') view = 'checklist';
  renderAll();
  const row = document.querySelector(`.row[data-id="${id}"]`);
  if (row) row.scrollIntoView({ block: 'nearest' });
}

function applyUrlParams() {
  const params = new URLSearchParams(location.search);
  if (params.has('seed')) {
    const n = Number.parseInt(params.get('seed'), 10);
    state = buildSeed(data, Number.isFinite(n) && n > 0 ? n : 13);
    seeded = true;
    $('#seed-tag').hidden = false;
  }
  if (params.get('spoilers') === '1') {
    filters.spoilers = true;
    $('#spoilers').checked = true;
  }
  if (params.has('grade')) {
    filters.grade = params.get('grade');
    $('#grade-filter').value = filters.grade;
  }
  if (params.has('view') && VIEWS.includes(params.get('view'))) view = params.get('view');
  if (params.has('open')) {
    const id = Number.parseInt(params.get('open'), 10);
    if (trophyById(data, id)) selectedId = id;
  }
}

function wireEvents() {
  $('#tabs').addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-view]');
    if (btn) { view = btn.dataset.view; renderView(); }
  });

  $('#kind-chips').addEventListener('click', (e) => {
    const chip = e.target.closest('[data-kind]');
    if (chip) { filters.kind = chip.dataset.kind; renderChecklistExtras(); renderList(); }
  });

  $('#grade-filter').addEventListener('change', (e) => { filters.grade = e.target.value; renderList(); });
  $('#search').addEventListener('input', (e) => { filters.query = e.target.value.trim(); renderList(); });
  $('#hide-earned').addEventListener('change', (e) => { filters.hideEarned = e.target.checked; renderList(); });
  $('#spoilers').addEventListener('change', (e) => { filters.spoilers = e.target.checked; renderList(); });

  document.querySelector('main').addEventListener('click', (e) => {
    const goto = e.target.closest('[data-goto]');
    if (goto) { view = goto.dataset.goto; renderView(); window.scrollTo({ top: 0 }); return; }
    const open = e.target.closest('[data-open]');
    if (open) { openTrophy(Number(open.dataset.open)); return; }

    const counterBtn = e.target.closest('[data-act="inc"], [data-act="dec"]');
    if (counterBtn) {
      const holder = counterBtn.closest('[data-counter]');
      const trophy = holder ? trophyById(data, Number(holder.dataset.counter)) : null;
      if (trophy) bumpCounter(trophy, counterBtn.dataset.act === 'inc' ? 1 : -1);
      return;
    }

    const row = e.target.closest('.row');
    if (row && !e.target.closest('[data-act="earn"]')) openTrophy(Number(row.dataset.id), false);
  });

  document.querySelector('main').addEventListener('change', (e) => {
    const box = e.target.closest('[data-act="earn"]');
    if (!box) return;
    const holder = box.closest('[data-id]');
    const pane = box.closest('#guide-pane');
    const id = holder ? Number(holder.dataset.id) : (pane ? selectedId : null);
    const trophy = id ? trophyById(data, id) : null;
    if (trophy) setEarned(trophy, box.checked);
  });

  document.querySelector('main').addEventListener('input', (e) => {
    const note = e.target.closest('[data-note]');
    if (note) {
      state.notes[Number(note.dataset.note)] = note.value;
      persist();
    }
  });

  $('#btn-export').addEventListener('click', () => {
    const blob = new Blob([serializeState(state)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = exportFilename();
    a.click();
    URL.revokeObjectURL(url);
  });

  $('#file-import').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      state = parseImported(await file.text());
      seeded = false;
      $('#seed-tag').hidden = true;
      persist();
      renderAll();
    } catch {
      window.alert('That file is not a Vice Ledger progress export.');
    }
    e.target.value = '';
  });

  // Keyboard shortcuts: "/" jumps to the trophy search from anywhere,
  // Escape clears a search in progress and hands focus back to the list.
  document.addEventListener('keydown', (e) => {
    const typing = /INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName ?? '');
    if (e.key === '/' && !typing) {
      e.preventDefault();
      if (view !== 'checklist') { view = 'checklist'; renderView(); }
      $('#search').focus();
    } else if (e.key === 'Escape' && document.activeElement === $('#search')) {
      filters.query = '';
      $('#search').value = '';
      renderList();
      $('#search').blur();
    }
  });

  $('#btn-reset').addEventListener('click', () => {
    if (!window.confirm('Clear all Vice Ledger progress, counters and notes?')) return;
    state = emptyState();
    seeded = false;
    $('#seed-tag').hidden = true;
    clearState();
    renderAll();
  });
}

async function boot() {
  data = await loadData();
  state = loadState();
  applyUrlParams();
  wireEvents();
  renderAll();
}

boot().catch((err) => {
  document.querySelector('main').innerHTML = `<div class="empty">Vice Ledger could not load its data file (${err.message}). Serve the app over HTTP — see serve.ts.</div>`;
});
