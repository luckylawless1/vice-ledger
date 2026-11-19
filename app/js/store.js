// Progress store for Vice Ledger: earned stamps, counters and notes,
// kept in localStorage; export / import move the same shape as a file.

import { roadmapOrder } from './data.js';

const STORAGE_KEY = 'vice-ledger-progress-v1';

export function emptyState() {
  return { earned: {}, counts: {}, notes: {} };
}

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.earned && parsed.counts && parsed.notes) return parsed;
    }
  } catch {
    /* a corrupt save falls back to a clean ledger */
  }
  return emptyState();
}

export function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function clearState() {
  localStorage.removeItem(STORAGE_KEY);
}

export function isEarned(state, trophy) {
  return Boolean(state.earned[trophy.id]);
}

export function earnedDate(state, trophy) {
  return state.earned[trophy.id]?.date ?? null;
}

export function countOf(state, trophy) {
  if (!trophy.psnTarget) return null;
  if (isEarned(state, trophy)) return trophy.psnTarget;
  return state.counts[trophy.id] ?? 0;
}

// Part-way counters for the demo seed: believable mid-grind numbers.
const SEED_COUNTS = {
  15: 96, 16: 5, 17: 19, 18: 6, 19: 8, 25: 3, 30: 1, 31: 41, 32: 22,
  35: 38, 40: 2, 42: 21, 43: 4, 48: 210, 52: 97500, 53: 41200, 54: 3, 55: 4,
};

// A deterministic lived-in state for screenshots: the first N trophies in
// roadmap order earned across 19–20 Nov 2026, counters part-way elsewhere.
// Kept in memory only — it never touches the player's real save.
export function buildSeed(data, howMany) {
  const state = emptyState();
  const ordered = roadmapOrder(data.trophies);
  ordered.slice(0, howMany).forEach((trophy, i) => {
    state.earned[trophy.id] = { date: i < 6 ? '2026-11-19' : '2026-11-20' };
  });
  for (const [id, n] of Object.entries(SEED_COUNTS)) {
    if (!state.earned[id]) state.counts[id] = n;
  }
  return state;
}

export function exportFilename() {
  return 'vice-ledger-progress.json';
}

export function serializeState(state) {
  return JSON.stringify({ app: 'vice-ledger', version: 1, ...state }, null, 2);
}

export function parseImported(text) {
  const parsed = JSON.parse(text);
  if (!parsed || typeof parsed !== 'object') throw new Error('not a progress file');
  const state = emptyState();
  for (const key of ['earned', 'counts', 'notes']) {
    if (parsed[key] && typeof parsed[key] === 'object') state[key] = parsed[key];
  }
  return state;
}
