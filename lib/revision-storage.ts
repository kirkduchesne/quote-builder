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
