import { parseRevisions, type Revision } from './revisions';
export const revisionKey = 'quote-builder-revisions-v1';
export function loadRevisions(storage: Pick<Storage, 'getItem'>) {
  try {
    const raw = storage.getItem(revisionKey);
    return { revisions: raw === null ? [] : parseRevisions(raw), raw, readable: true };
  } catch {
    return { revisions: [] as Revision[], raw: null, readable: false };
  }
}

export function saveRevisions(storage: Pick<Storage, 'getItem' | 'setItem'>, revisions: Revision[], expected: string | null) {
  const raw = JSON.stringify({ version: 1, revisions });
  parseRevisions(raw);
  if (storage.getItem(revisionKey) !== expected) throw new Error('Revision history changed in another tab. Reload before saving.');
  storage.setItem(revisionKey, raw);
  return raw;
}
