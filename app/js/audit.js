// The evidence audit: every figure on the strip is counted from the data
// file at runtime, never typed by hand, so the strip cannot drift from
// the guides it describes.

export function computeAudit(data) {
  const t = data.trophies;
  const byGrade = (g) => t.filter((x) => x.grade === g).length;
  const totalSteps = t.reduce((a, x) => a + x.steps.length, 0);
  const citedSteps = t.reduce((a, x) => a + x.steps.filter((s) => s.cites.length > 0).length, 0);
  return {
    total: t.length,
    platinum: byGrade('platinum'),
    gold: byGrade('gold'),
    silver: byGrade('silver'),
    bronze: byGrade('bronze'),
    hidden: t.filter((x) => x.hidden).length,
    guidesCiting: t.filter((x) => x.steps.some((s) => s.cites.length > 0)).length,
    totalSteps,
    citedSteps,
    sources: data.sources.length,
    sourcesRead: data.sourcesRead,
    missable: t.filter((x) => x.missable).length,
    watch: t.filter((x) => x.watch).length,
    single: t.filter((x) => x.confidence === 'single').length,
    differ: t.filter((x) => x.confidence === 'differ').length,
    open: t.filter((x) => x.confidence === 'open').length,
  };
}

export function auditText(a) {
  return `<b>Evidence audit</b> — counted from the data file: ${a.total} official · ` +
    `${a.platinum}P ${a.gold}G ${a.silver}S ${a.bronze}B · ${a.hidden} hidden · ` +
    `${a.guidesCiting}/${a.total} guides cite a source · ${a.citedSteps}/${a.totalSteps} steps cited · ` +
    `${a.sources} sources read ${a.sourcesRead} · ${a.missable} possibly missable · ${a.watch} watch · ` +
    `${a.single} single-source · ${a.differ} sources disagree · ${a.open} trigger open`;
}

export const CONFIDENCE_LABEL = { strong: 'OK', single: '1 SRC', differ: 'DIFFER', open: 'OPEN' };

export function confidenceBadge(trophy) {
  if (trophy.confidence === 'strong') return '';
  const label = CONFIDENCE_LABEL[trophy.confidence];
  return `<span class="badge conf-${trophy.confidence}" title="Evidence confidence for this guide">${label}</span>`;
}
