// The secondary views: roadmap, missables, the Next Up planner, the
// Journey log, the Sources view (with the disagreement cards) and the
// trophy × source matrix.

import { KIND_LABELS, STAGE_BLURBS, roadmapOrder, stepsCiting, formatDate, formatMinutes } from './data.js';
import { CONFIDENCE_LABEL } from './audit.js';
import { isEarned, earnedDate } from './store.js';
import { esc, medalHtml } from './bits.js';

function chipFor(trophy, state) {
  const done = isEarned(state, trophy);
  const flag = trophy.missable ? '<span class="flag m">MISSABLE</span>'
    : trophy.watch ? '<span class="flag w">WATCH</span>' : '';
  return `<button type="button" class="s-chip${done ? ' done' : ''}" data-open="${trophy.id}">` +
    medalHtml(trophy, true) + `<span class="s-name">${esc(trophy.name)}</span>${flag}</button>`;
}

export function roadmapHtml(data, state) {
  const ordered = roadmapOrder(data.trophies);
  const stages = [1, 2, 3, 4, 5, 6, 7].map((stage) => {
    const inStage = ordered.filter((t) => t.roadmapStage === stage);
    const done = inStage.filter((t) => isEarned(state, t)).length;
    const pct = Math.round((done / inStage.length) * 100);
    const flags = inStage.filter((t) => t.missable || t.watch)
      .map((t) => `<div class="s-chip" style="cursor:default"><span class="flag ${t.missable ? 'm' : 'w'}">${t.missable ? 'MISSABLE' : 'WATCH'}</span><span>${esc(t.name)} — stage ${stage}, before you leave it</span></div>`).join('');
    return `<div class="stage"><div class="s-head"><h3>Stage ${stage}</h3><span class="s-blurb">${esc(STAGE_BLURBS[stage])}</span>` +
      `<span class="s-prog">${done} / ${inStage.length} earned</span></div>` +
      `<div class="s-bar"><div style="width:${pct}%"></div></div>` +
      `<div class="s-chips">${inStage.map((t) => chipFor(t, state)).join('')}</div>` +
      (flags ? `<div class="s-chips" style="margin-top:8px">${flags}</div>` : '') + `</div>`;
  }).join('');
  return `<h2 class="vtitle">Roadmap to the platinum</h2>` +
    `<p class="vsub">Seven stages, built from the official descriptions: story first with its set-pieces caught on the way past, then side chains, collectibles, activities, and the crime / money / 100% cleanup. Missable and watch flags are pinned at the stage where they bite.</p>` + stages;
}

export function missablesHtml(data, state) {
  const miss = data.trophies.filter((t) => t.missable);
  const watch = data.trophies.filter((t) => t.watch && !t.missable);
  const card = (t, note) => `<div class="card" data-open="${t.id}"><h3>${medalHtml(t, true)} ${esc(t.name)}</h3>` +
    `<p>${esc(KIND_LABELS[t.kind])} · Stage ${t.roadmapStage} · ${esc(t.timeEstimate)}${isEarned(state, t) ? ' · <span style="color:var(--teal)">earned</span>' : ''}</p>` +
    `<p class="ponr">${esc(note)}</p></div>`;
  const watchNote = (t) => t.id === 7
    ? 'The finale locks some partner free-roam options — bank the partner trophies first.'
    : t.id === 14
      ? 'The 100% counter is a marathon, not a moment — track it from day one so nothing is stranded at 99%.'
      : t.id === 33
        ? 'Needs a partner session at 4 stars — plan it while a partner is available.'
        : 'The last areas are offshore — leave the final sweep until your boat options are open.';
  return `<h2 class="vtitle">Missables &amp; ones to watch</h2>` +
    `<p class="vsub">Every trophy our evidence flags as possibly missable, with its point of no return, followed by the watch list — not missable, just easy to strand.</p>` +
    `<h3 class="serif" style="color:#ff9a9d">Possibly missable (${miss.length})</h3>` +
    `<div class="cards">${miss.map((t) => card(t, t.missableNote ?? '')).join('')}</div>` +
    `<h3 class="serif" style="color:var(--amber);margin-top:20px">Watch (${watch.length})</h3>` +
    `<div class="cards">${watch.map((t) => card(t, watchNote(t))).join('')}</div>`;
}

export function nextUpList(data, state, limit = 5) {
  return roadmapOrder(data.trophies).filter((t) => !isEarned(state, t)).slice(0, limit);
}

export function plannerHtml(data, state) {
  const next = nextUpList(data, state, 5);
  const quick = roadmapOrder(data.trophies)
    .filter((t) => !isEarned(state, t) && t.id !== 1)
    .sort((a, b) => a.timeMinutes - b.timeMinutes).slice(0, 5);
  const card = (t, tag) => `<div class="card" data-open="${t.id}"><h3>${medalHtml(t, true)} ${esc(t.name)}</h3>` +
    `<p>${esc(KIND_LABELS[t.kind])} · Stage ${t.roadmapStage} · ${esc(t.timeEstimate)}${t.missable ? ' · <span style="color:#ff9a9d">MISSABLE</span>' : ''}</p>` +
    (tag ? `<span class="quick">${tag}</span>` : '') + `</div>`;
  return `<h2 class="vtitle">Next up</h2>` +
    `<p class="vsub">The next five trophies in roadmap order — the run stays honest if you simply work down this list — plus the quickest wins still on the table.</p>` +
    `<div class="cards">${next.map((t) => card(t, '')).join('')}</div>` +
    `<h3 class="serif" style="color:var(--gold);margin-top:20px">Quick wins</h3>` +
    `<div class="cards">${quick.map((t) => card(t, `Quick win · ${esc(formatMinutes(t.timeMinutes))}`)).join('')}</div>`;
}

export function journeyHtml(data, state) {
  const earned = data.trophies
    .filter((t) => isEarned(state, t))
    .sort((a, b) => (earnedDate(state, b) ?? '').localeCompare(earnedDate(state, a) ?? '') || a.roadmapStage - b.roadmapStage);
  if (!earned.length) {
    return `<h2 class="vtitle">Journey</h2><div class="empty">Nothing earned yet. The day you check your first trophy off, its date is stamped here — your road to the platinum, in the order it actually happened.</div>`;
  }
  const rows = earned.map((t) => `<div class="journey-row" data-open="${t.id}">` +
    `<span class="jdate">${esc(formatDate(earnedDate(state, t)))}</span>${medalHtml(t, true)}` +
    `<span>${esc(t.name)}</span><span class="jstage">${esc(t.grade)} · stage ${t.roadmapStage}</span></div>`).join('');
  return `<h2 class="vtitle">Journey</h2>` +
    `<p class="vsub">Every trophy you have earned, stamped with the day it popped — ${earned.length} of 55 so far. No other guide keeps your history; this one does.</p>` + rows;
}

const DISAGREEMENT_CARDS = [
  {
    title: '28 vs 27 hidden trophies',
    body: 'The two official-list mirrors disagree by one hidden flag: the Exophase list marks 28 of the 55 hidden, the PSNProfiles presentation shows 27. Vice Ledger follows the 28-count, and the audit strip counts hidden trophies from our data file, so you can check our arithmetic.',
    cites: 'Lists: [2] PSNProfiles · [3] Exophase',
  },
  {
    title: 'Triggers not yet known',
    body: 'Three trophies — Challenging Tank, Personal Best and The Truth Is Out There — have official descriptions too vague to pin a trigger to. Their guides are flagged OPEN in the matrix, say plainly what is and is not confirmed, and will firm up as sources publish methods.',
    cites: 'Flagged OPEN in the Source Matrix',
  },
];

export function sourcesHtml(data) {
  const rows = data.sources.map((s) => {
    const citing = data.trophies.filter((t) => stepsCiting(t, s.n) > 0).length;
    const steps = data.trophies.reduce((a, t) => a + stepsCiting(t, s.n), 0);
    return `<tr><td><b>[${s.n}]</b></td><td><a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.label)} ↗</a></td>` +
      `<td>${esc(s.role)}</td><td>${esc(s.backs)}</td><td>${esc(data.sourcesRead)}</td><td>${citing} trophies · ${steps} steps</td></tr>`;
  }).join('');
  const disputes = data.trophies.filter((t) => t.dispute).map((t) =>
    `<div class="card" style="cursor:default"><h3>${esc(t.dispute.topic)} — ${esc(t.name)}</h3>` +
    `<p>“${esc(t.dispute.a)}” — ${esc(t.dispute.aFrom)}</p><p>“${esc(t.dispute.b)}” — ${esc(t.dispute.bFrom)}</p>` +
    `<p>Both versions are shown in ${esc(t.name)}'s guide pane; we do not silently pick one.</p></div>`).join('');
  const extra = DISAGREEMENT_CARDS.map((c) =>
    `<div class="card" style="cursor:default"><h3>${esc(c.title)}</h3><p>${esc(c.body)}</p><p>${esc(c.cites)}</p></div>`).join('');
  return `<h2 class="vtitle">Sources</h2>` +
    `<p class="vsub">Seven sources, all read ${esc(data.sourcesRead)}. Official facts (names, descriptions, grades, PSN counts) come from the list sources [2][3]; methods cite the guide whose method the step follows; reasoning from a description itself is labelled Vice Ledger advice in the pane. Nothing here is copied — sources are cited, never pasted.</p>` +
    `<table class="grid"><thead><tr><th>#</th><th>Source</th><th>Role</th><th>What it backs</th><th>Read</th><th>Cited by</th></tr></thead><tbody>${rows}</tbody></table>` +
    `<h3 class="serif" style="color:var(--gold);margin-top:22px">Where sources disagree</h3>` +
    `<div class="cards">${disputes}${extra}</div>`;
}

export function matrixHtml(data) {
  const head = data.sources.map((s) => `<th class="c" title="${esc(s.label)}">[${s.n}]</th>`).join('');
  const rows = data.trophies.map((t) => {
    const cells = data.sources.map((s) => {
      const n = stepsCiting(t, s.n);
      return `<td class="c ${n ? 'hit' : 'miss'}">${n || '·'}</td>`;
    }).join('');
    const flag = CONFIDENCE_LABEL[t.confidence];
    const cls = t.confidence === 'strong' ? '' : `badge conf-${t.confidence}`;
    return `<tr><td><span class="tname">${medalHtml(t, true)} ${esc(t.name)}</span></td>${cells}` +
      `<td class="c">${cls ? `<span class="${cls}">${flag}</span>` : flag}</td></tr>`;
  }).join('');
  const legend = data.sources.map((s) => `<span><b>[${s.n}]</b> ${esc(s.label)}</span>`).join('');
  return `<h2 class="vtitle">Source matrix</h2>` +
    `<p class="vsub">Every trophy × every source: the number is how many of that trophy's guide steps cite the source. A blank means the source is not used for that trophy — the gaps are shown, not hidden.</p>` +
    `<div class="legend">${legend}</div>` +
    `<table class="grid matrix"><thead><tr><th>Trophy</th>${head}<th class="c">Confidence</th></tr></thead><tbody>${rows}</tbody></table>` +
    `<div class="legend"><span><b>OK</b> guide + list backing</span><span><b>1 SRC</b> single-source method</span><span><b>DIFFER</b> sources disagree</span><span><b>OPEN</b> trigger not yet known</span></div>`;
}
