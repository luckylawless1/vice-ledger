// The checklist view: kind chips, the trophy rows and the guide pane
// that sits beside them showing one trophy's cited guide in full.

import { KIND_LABELS, KIND_ORDER, sourcesUsedBy, formatDate } from './data.js';
import { auditText } from './audit.js';
import { isEarned, earnedDate } from './store.js';
import {
  esc, medalHtml, shieldMedalHtml, isShielded, displayName, displayDescription,
  badgesHtml, metaLineHtml, counterHtml, difficultyHtml,
} from './bits.js';

export function kindChipsHtml(activeKind) {
  const chip = (value, label, cls = '') =>
    `<button type="button" class="chip ${cls} ${activeKind === value ? 'on' : ''}" data-kind="${value}">${label}</button>`;
  const parts = [chip('all', 'All'), chip('story', 'Story'), chip('missable', 'Missable', 'miss')];
  for (const kind of KIND_ORDER) {
    if (kind !== 'story') parts.push(chip(kind, KIND_LABELS[kind]));
  }
  return parts.join('');
}

export function matchesFilters(trophy, state, filters) {
  if (filters.kind === 'missable') {
    if (!trophy.missable) return false;
  } else if (filters.kind !== 'all' && trophy.kind !== filters.kind) {
    return false;
  }
  if (filters.grade !== 'all' && trophy.grade !== filters.grade) return false;
  if (filters.hideEarned && isEarned(state, trophy)) return false;
  if (filters.query) {
    const q = filters.query.toLowerCase();
    const hay = `${trophy.name} ${trophy.description} ${KIND_LABELS[trophy.kind]}`.toLowerCase();
    if (!hay.includes(q)) return false;
  }
  return true;
}

export function trophyRowHtml(trophy, state, filters, selectedId) {
  const earned = isEarned(state, trophy);
  const shielded = isShielded(trophy, state, filters.spoilers);
  const medal = shielded ? shieldMedalHtml() : medalHtml(trophy);
  return `<article class="row${earned ? ' earned' : ''}${trophy.id === selectedId ? ' sel' : ''}" data-id="${trophy.id}">` +
    `<label class="check"><input type="checkbox" data-act="earn" ${earned ? 'checked' : ''} aria-label="Mark earned"></label>` +
    medal +
    `<div class="row-main">` +
      `<div class="row-title"><h3>${esc(displayName(trophy, state, filters.spoilers))}</h3>${badgesHtml(trophy)}</div>` +
      `<p class="desc">${esc(displayDescription(trophy, state, filters.spoilers))}</p>` +
      `<div class="row-meta">${metaLineHtml(trophy)}</div>` +
      counterHtml(trophy, state) +
    `</div></article>`;
}

function citesHtml(cites) {
  const marks = cites.map((n) => `<a href="#sources" data-goto="sources" title="See source ${n}">[${n}]</a>`).join('');
  return `<sup class="cite">${marks}</sup>`;
}

export function guidePaneHtml(trophy, data, state, filters) {
  if (!trophy) return '<p class="vl-note">Pick a trophy to read its guide.</p>';
  const earned = isEarned(state, trophy);
  const shielded = isShielded(trophy, state, filters.spoilers);
  const used = sourcesUsedBy(data, trophy);
  const steps = trophy.steps.map((s) => `<li>${esc(s.text)} ${citesHtml(s.cites)}</li>`).join('');
  const srcs = used.map((s) =>
    `<li><b>[${s.n}] ${esc(s.label)}</b> — ${esc(s.role)} <a href="${esc(s.url)}" target="_blank" rel="noopener">visit ↗</a><br>${esc(s.backs)} Read ${esc(data.sourcesRead)}.</li>`).join('');

  let callouts = '';
  if (trophy.missable) {
    callouts += `<div class="callout miss"><h4>⚠ Possibly missable</h4><p>${esc(trophy.missableNote ?? '')}</p></div>`;
  }
  if (trophy.watch) {
    callouts += `<div class="callout watch"><h4>Ones to watch</h4><p>Not missable, but easy to strand: plan it while its window is open (see the Missables view).</p></div>`;
  }
  let disputeBox = '';
  if (trophy.dispute) {
    const d = trophy.dispute;
    disputeBox = `<div class="callout dispute"><h4>Sources disagree — both versions shown</h4>` +
      `<p><b>${esc(d.topic)}.</b></p><p>“${esc(d.a)}” — ${esc(d.aFrom)}</p><p>“${esc(d.b)}” — ${esc(d.bFrom)}</p></div>`;
  }

  const earnedLine = earned
    ? `<span class="earned-on">✓ Earned ${esc(formatDate(earnedDate(state, trophy)))}</span>`
    : '';

  return `<div class="p-head">${shielded ? shieldMedalHtml() : medalHtml(trophy)}<div>` +
      `<h2>${esc(displayName(trophy, state, filters.spoilers))}</h2>` +
      `<div class="p-grade">${esc(trophy.grade)} · ${esc(KIND_LABELS[trophy.kind])} · Roadmap stage ${trophy.roadmapStage}</div></div></div>` +
    `<p class="official">“${esc(displayDescription(trophy, state, filters.spoilers))}” — official description</p>` +
    `<div class="badges">${badgesHtml(trophy)}</div>` +
    `<div class="meta-line"><span>Time <b>${esc(trophy.timeEstimate)}</b></span><span>Difficulty ${difficultyHtml(trophy)}</span>` +
    (trophy.psnTarget ? `<span>PSN target <b>${trophy.psnTarget.toLocaleString('en-US')}</b></span>` : '') + `</div>` +
    callouts +
    `<h3 class="sec">The guide — in our words, every step cited</h3>` +
    `<ol class="steps">${steps}</ol>` +
    disputeBox +
    counterHtml(trophy, state) +
    `<h3 class="sec">Sources for this trophy</h3>` +
    `<ul class="srcs">${srcs}</ul>` +
    `<p class="vl-note">Steps reasoned from the official description itself are Vice Ledger advice, worked out from that description and cited to the list sources [2][3].</p>` +
    `<div class="earnline"><label><input type="checkbox" data-act="earn" ${earned ? 'checked' : ''}> Earned</label>${earnedLine}</div>` +
    `<h3 class="sec">Your notes</h3>` +
    `<textarea id="note-box" data-note="${trophy.id}" placeholder="Your own route notes for this trophy…">${esc(state.notes[trophy.id] ?? '')}</textarea>`;
}

export function auditStripHtml(audit) {
  return auditText(audit);
}

export function warnBannerHtml(data) {
  const names = data.trophies.filter((t) => t.missable)
    .map((t) => `<a href="#missables" data-goto="missables">${esc(t.name)}</a>`).join(' · ');
  return `<b>Missable warning</b> — possibly missable: ${names}. Each one's point of no return is in its guide and in the Missables view.`;
}

export function nextUpBarHtml(nextTrophies) {
  if (!nextTrophies.length) return '<span class="nu-label">Next up</span> <span>Everything is earned — the platinum is yours.</span>';
  const items = nextTrophies.map((t) =>
    `<button type="button" class="nu-item" data-open="${t.id}">${esc(t.name)} <em>${esc(t.timeEstimate)}</em></button>`).join('');
  return `<span class="nu-label">Next up</span>${items}`;
}
