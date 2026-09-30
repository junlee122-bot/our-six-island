// Coverage is part of the regression result: an absent/erroring capture must
// not look like a screen whose issue count improved to zero.
const GROUPS = {
  login: ['login'], room: ['room'], menu: ['menu'], 'esc-menu': ['esc-menu'],
  'room-editor': ['room-editor'], wallet: ['wallet'], settings: ['settings'],
  controls: ['controls'], credits: ['credits'], friends: ['friends'], invite: ['invite'],
  bank: ['bank', 'bank-portrait'], 'bank-notes': ['bank-notes'], 'bank-casino': ['bank-casino'],
  'bank-rob': ['bank-rob'], npc: ['npc'],
  village: ['village'], map: ['map'], bag: ['bag'], shop: ['shop'], ledger: ['ledger'],
  'farm-layout': ['farm-layout'], 'farm-works': ['farm-works'], 'farm-market': ['farm-market'],
  growth: ['growth', 'growth-research'], bonds: ['bonds'], collection: ['collection'],
  'ui-kit': ['ui-kit', 'ui-kit-panels', 'ui-kit-glyphs'],
};
export const UI_METRICS = ['lowCount', 'smallCount', 'narrowCount', 'cutCount', 'overlapCount', 'coveredCount'];

export function reportFailures(report, { views, only = [], withGames = false, baseline } = {}) {
  const groups = { ...GROUPS, ...(withGames ? {
    'game-blackjack': ['sheet-blackjack', 'game-blackjack'],
    'game-seotda': ['sheet-seotda', 'game-seotda'],
  } : {}) };
  const selected = only.length ? only : Object.keys(groups);
  const issues = selected.filter((key) => !groups[key]).map((key) => `unknown screen group: ${key}`);
  const expected = selected.flatMap((key) => groups[key] ?? []);
  if (!views?.length) issues.push('no viewports selected');
  for (const view of views ?? []) {
    const v = report.views?.[view];
    if (!v) { issues.push(`${view}: missing viewport`); continue; }
    // Baseline additions must not disappear merely because the capture list
    // forgot them. Deliberate --only runs compare only the selected groups.
    const names = new Set([...expected, ...(!only.length ? Object.keys(baseline?.views?.[view]?.screens ?? {}) : [])]);
    for (const name of names) {
      const m = v.screens?.[name];
      if (!m) { issues.push(`${view}/${name}: missing screen`); continue; }
      if (m.err) issues.push(`${view}/${name}: measurement error: ${m.err}`);
      for (const metric of UI_METRICS)
        if (!Number.isFinite(m[metric]) || m[metric] < 0) issues.push(`${view}/${name}: invalid ${metric}`);
      if (!m.file) issues.push(`${view}/${name}: missing screenshot`);
      if (m.escExits === false) issues.push(`${view}/${name}: Esc did not close the editor`);
      if (m.dialog?.close && (m.dialog.close.w < 44 || m.dialog.close.h < 44)) issues.push(`${view}/${name}: close button below 44px`);
    }
    for (const note of [...(v.notes ?? []), ...(v.errors ?? [])]) issues.push(`${view}: ${note}`);
  }
  return issues;
}
