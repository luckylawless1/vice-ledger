// Shared HTML fragments: medals, badges, counters and the spoiler rule,
// used by the checklist, the guide pane and the secondary views.

import { KIND_LABELS, formatMinutes } from './data.js';
import { confidenceBadge } from './audit.js';
import { isEarned, countOf } from './store.js';

export function esc(text) {
  return String(text).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

export function medalHtml(trophy, small = false) {
  return `<span class="medal ${trophy.grade}${small ? ' sm' : ''}" title="${trophy.grade}"><span>★</span></span>`;
}

export function shieldMedalHtml(small = false) {
  return `<span class="medal shield${small ? ' sm' : ''}" title="spoiler shield"><span>▓</span></span>`;
}

// The spoiler rule: with the shield on, an unearned story or hidden trophy
// shows neither its name nor its description until it is earned.
export function isShielded(trophy, state, spoilersOn) {
  return spoilersOn && !isEarned(state, trophy) && (trophy.hidden || trophy.kind === 'story');
}

export function displayName(trophy, state, spoilersOn) {
  if (isShielded(trophy, state, spoilersOn)) {
    return trophy.kind === 'story' ? 'Story trophy — under the spoiler shield' : 'Hidden trophy — under the spoiler shield';
  }
  return trophy.name;
}

export function displayDescription(trophy, state, spoilersOn) {
  if (isShielded(trophy, state, spoilersOn)) return 'Name and description stay hidden until you earn it.';
  return trophy.description;
}

export function badgesHtml(trophy) {
  const parts = [`<span class="badge kind">${esc(KIND_LABELS[trophy.kind])}</span>`];
  if (trophy.missable) parts.push('<span class="badge missable">Missable</span>');
  if (trophy.watch) parts.push('<span class="badge watch">Watch</span>');
  if (trophy.hidden) parts.push('<span class="badge hiddenb">Hidden</span>');
  const conf = confidenceBadge(trophy);
  if (conf) parts.push(conf);
  return parts.join(' ');
}

export function difficultyHtml(trophy) {
  const dots = Array.from({ length: 5 }, (_, i) =>
    `<span class="${i < trophy.difficulty ? '' : 'off'}">●</span>`).join('');
  return `<span class="diffdots" title="Vice Ledger difficulty ${trophy.difficulty}/5">${dots}</span>`;
}

export function metaLineHtml(trophy) {
  return `<span>Stage ${trophy.roadmapStage}</span><span>Time <b>${esc(formatMinutes(trophy.timeMinutes))}</b></span>` +
    `<span>Difficulty ${difficultyHtml(trophy)}</span>`;
}

export function counterHtml(trophy, state) {
  if (!trophy.psnTarget) return '';
  const value = countOf(state, trophy);
  const pct = Math.min(100, Math.round((value / trophy.psnTarget) * 100));
  const shown = trophy.psnTarget >= 1000 ? `$${value.toLocaleString('en-US')} / $${trophy.psnTarget.toLocaleString('en-US')}` : `${value} / ${trophy.psnTarget}`;
  return `<div class="counter" data-counter="${trophy.id}">` +
    `<button type="button" data-act="dec" aria-label="Decrease counter">−</button>` +
    `<span class="cval">${shown}</span>` +
    `<span class="cbar"><div style="width:${pct}%"></div></span>` +
    `<button type="button" data-act="inc" aria-label="Increase counter">+</button></div>`;
}

// The increment a stepper moves by: dollars move in bigger steps.
export function counterStep(trophy) {
  if (!trophy.psnTarget) return 1;
  return trophy.psnTarget >= 10000 ? 5000 : 1;
}
