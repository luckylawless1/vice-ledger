// Data access for Vice Ledger: loads app/data/trophies.json and indexes it.

export const KIND_LABELS = {
  story: 'Story',
  side: 'Side chains',
  collectibles: 'Collectibles',
  activities: 'Activities',
  online: 'Online',
  crime: 'Crime',
  riddles: 'Riddles / Mystery',
  money: 'Money',
  feats: 'Feats',
};

export const KIND_ORDER = ['story', 'side', 'collectibles', 'activities', 'online', 'crime', 'riddles', 'money', 'feats'];

export const GRADE_ORDER = ['platinum', 'gold', 'silver', 'bronze'];

export const STAGE_BLURBS = {
  1: 'Chapters 1–2 — learn Leonida and bank the early one-offs',
  2: 'Chapters 3–4 & the finale — finish the story, catch the set-pieces',
  3: 'Side chains & strangers — finish every strand',
  4: 'Collectibles & exploration — cards, photo spots, vehicles, the whole map',
  5: 'Activities & feats — ranges, races, stunts and challenges',
  6: 'Crime, money & 100% cleanup — the long tail',
  7: 'Platinum — Vice Got a Price!',
};

export async function loadData() {
  const res = await fetch('data/trophies.json');
  if (!res.ok) throw new Error(`trophies.json: HTTP ${res.status}`);
  return res.json();
}

export function trophyById(data, id) {
  return data.trophies.find((t) => t.id === id) ?? null;
}

export function sourceByN(data, n) {
  return data.sources.find((s) => s.n === n) ?? null;
}

// The order the roadmap works in: stage first, then the official list order.
export function roadmapOrder(trophies) {
  return [...trophies].sort((a, b) => a.roadmapStage - b.roadmapStage || a.id - b.id);
}

// How many of a trophy's steps cite source n (0 = the source is not used for it).
export function stepsCiting(trophy, n) {
  return trophy.steps.filter((s) => s.cites.includes(n)).length;
}

// The distinct sources a trophy's guide cites, in source order.
export function sourcesUsedBy(data, trophy) {
  const used = new Set();
  for (const step of trophy.steps) for (const n of step.cites) used.add(n);
  return data.sources.filter((s) => used.has(s.n));
}

export function formatMinutes(min) {
  if (!min) return '—';
  if (min < 60) return `~${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `~${h} h ${m} min` : `~${h} h`;
}

export function formatDate(iso) {
  if (!iso) return '';
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const [y, mo, d] = iso.split('-').map(Number);
  return `${d} ${months[mo - 1]} ${y}`;
}
