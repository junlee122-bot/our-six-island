import { freshSave, hydrate, type Save } from './game-data.ts';

export const SAVE_KEY = 'our-six-island-v1';
type SaveStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

// All delayed writers share this gate, so a reset takes effect synchronously.
export function createSavePersistence(getStorage: () => SaveStorage) {
  let enabled = false;
  let importGeneration = 0;
  return {
    get enabled() { return enabled; },
    read() {
      const save = hydrate(getStorage().getItem(SAVE_KEY));
      enabled = save !== null;
      return save;
    },
    activate() { enabled = true; },
    write(save: Save) {
      if (!enabled) return false;
      getStorage().setItem(SAVE_KEY, JSON.stringify(save));
      return true;
    },
    reset() {
      const wasEnabled = enabled;
      enabled = false;
      try {
        getStorage().removeItem(SAVE_KEY);
      } catch (error) {
        enabled = wasEnabled;
        throw error;
      }
      importGeneration++;
      return freshSave();
    },
    beginImport() { return ++importGeneration; },
    isCurrentImport(generation: number) { return generation === importGeneration; },
  };
}
