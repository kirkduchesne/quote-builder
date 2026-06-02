import { validDraft, type Draft } from './drafts';

export const revisionLimit = 40;
export const sourceRevisionLimit = 5;
export type Revision = {
  id: string;
  label: string;
  capturedAt: string;
  quote: Draft;
};

export function validRevision(value: unknown): value is Revision {
  if (!value || typeof value !== 'object') return false;
  const revision = value as Revision;
  return typeof revision.id === 'string' && revision.id.length > 0 &&
    revision.id.length <= 100 && typeof revision.label === 'string' &&
    revision.label.trim().length > 0 && revision.label.length <= 80 &&
    typeof revision.capturedAt === 'string' &&
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(revision.capturedAt) &&
    Number.isFinite(Date.parse(revision.capturedAt)) &&
    new Date(revision.capturedAt).toISOString() === revision.capturedAt &&
    validDraft(revision.quote);
}

export function parseRevisions(raw: string): Revision[] {
  const value = JSON.parse(raw);
  if (!value || value.version !== 1 || !Array.isArray(value.revisions) ||
    value.revisions.length > revisionLimit || !value.revisions.every(validRevision) ||
    new Set(value.revisions.map((r: Revision) => r.id)).size !== value.revisions.length) {
    throw new Error('Invalid revision history');
  }
  const counts = new Map<string, number>();
  for (const revision of value.revisions as Revision[]) {
    const count = (counts.get(revision.quote.id) || 0) + 1;
    if (count > sourceRevisionLimit) throw new Error('Too many revisions for one quote');
    counts.set(revision.quote.id, count);
  }
  return value.revisions;
}

export function snapshotQuote(quote: Draft, id: string, capturedAt: string): Revision {
  const revision = {
    id, label: quote.name, capturedAt,
    quote: { id: quote.id, name: quote.name, reference: quote.reference, notes: quote.notes,
      discount: quote.discount, items: quote.items.map(item => ({ ...item })) },
  };
  if (!validRevision(revision)) throw new Error('Invalid revision snapshot');
  return revision;
}

export function sameQuoteContents(left: Draft, right: Draft): boolean {
  return left.id === right.id && left.name === right.name && left.reference === right.reference &&
    left.notes === right.notes && left.discount === right.discount && left.items.length === right.items.length &&
    left.items.every((item, index) => {
      const other = right.items[index];
      return item.id === other.id && item.description === other.description &&
        item.quantity === other.quantity && item.cents === other.cents;
    });
}
export function latestRevision(history: Revision[], sourceId: string): Revision | undefined {
  return [...history].reverse().find(revision => revision.quote.id === sourceId);
}

export function retainSourceRevisions(history: Revision[], incoming: Revision): Revision[] {
  const source = history.filter(revision => revision.quote.id === incoming.quote.id);
  const removed = new Set(source.slice(0, Math.max(0, source.length - sourceRevisionLimit + 1)).map(revision => revision.id));
  return [...history.filter(revision => !removed.has(revision.id)), incoming];
}

export function captureRevision(history: Revision[], quote: Draft, id: string, capturedAt: string): Revision[] {
  parseRevisions(JSON.stringify({ version: 1, revisions: history }));
  if (history.some(revision => revision.id === id)) throw new Error('Revision identifier already exists');
  const previous = latestRevision(history, quote.id);
  if (previous && sameQuoteContents(previous.quote, quote)) throw new Error('This saved quote already matches its latest revision.');
  const next = retainSourceRevisions(history, snapshotQuote(quote, id, capturedAt));
  if (next.length > revisionLimit) throw new Error('Revision history is full. Export or delete a revision before capturing another.');
  return parseRevisions(JSON.stringify({ version: 1, revisions: next }));
}

export function renameRevision(history: Revision[], id: string, value: string): Revision[] {
  const label = value.trim();
  if (!history.some(revision => revision.id === id)) throw new Error('Revision no longer exists');
  if (!label || label.length > 80) throw new Error('Use a revision label of 1–80 characters.');
  return history.map(revision => revision.id === id ? { ...revision, label } : revision);
}

export function deleteRevision(history: Revision[], id: string): Revision[] {
  if (!history.some(revision => revision.id === id)) throw new Error('Revision no longer exists');
  return history.filter(revision => revision.id !== id);
}

export function restoredDraft(quote: Draft, saved: Draft[], historySourceIds: string[]): Draft {
  if (!validDraft(quote) || saved.length >= 20) throw new Error('Keep at most 20 saved drafts before restoring.');
  let suffix = 1;
  const reserved = new Set([...saved.map(draft => draft.id), ...historySourceIds, quote.id]);
  while (reserved.has('restored-' + suffix)) suffix += 1;
  return { ...quote, id: 'restored-' + suffix, name: quote.name.slice(0, 73) + ' (copy)', items: quote.items.map(item => ({ ...item })) };
}
