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
