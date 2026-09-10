import { ITEMS, MAYOR, REGIONS, requestFor, type Save } from './game-data';

type Registry = {
  registerTool: (tool: {
    name: string;
    title: string;
    description: string;
    inputSchema: object;
    annotations: { readOnlyHint: boolean; untrustedContentHint: boolean };
    execute: (input: unknown) => unknown;
  }, options: { signal: AbortSignal }) => void | Promise<void>;
};

export function registerIslandJournal(getSave: () => Save) {
  const context = (document as Document & { modelContext?: Registry }).modelContext;
  if (!context?.registerTool) return;
  const lifecycle = new AbortController();
  try {
    void Promise.resolve(context.registerTool({
      name: 'read_island_journal',
      title: '섬 수첩 읽기',
      description: 'Read the current inventory and each friend’s picnic request to explain what the player can do next. Does not modify progress.',
      inputSchema: { type: 'object', properties: {}, additionalProperties: false },
      annotations: { readOnlyHint: true, untrustedContentHint: true },
      execute(input: unknown) {
        if (!input || typeof input !== 'object' || Array.isArray(input) || Object.keys(input).length) {
          throw new Error('Expected an empty object.');
        }
        const save = getSave();
        return {
          character: save.names[save.character],
          coins: save.coins,
          inventory: { ...save.bag },
          picnicComplete: save.picnic, mayor: {name:MAYOR.name, met:save.mayorMet, rewardClaimed:save.explorationReward}, exploration:REGIONS.map(r=>({name:r.name, visited:save.explored.includes(r.id)})),
          requests: save.names.flatMap((name, index) => {
            if (index === save.character) return [];
            const request = requestFor(save.character, index);
            return [{ name, item: ITEMS[request.item].name, required: request.count,
              collected: save.bag[request.item], accepted: save.accepted.includes(index),
              completed: save.done.includes(index) }];
          }),
        };
      },
    }, { signal: lifecycle.signal })).catch(() => lifecycle.abort());
  } catch {
    lifecycle.abort();
  }
  return () => lifecycle.abort();
}

