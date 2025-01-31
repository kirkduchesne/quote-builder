import { parseDrafts, type Draft, validDraft } from './drafts';
export type QuoteBackup = { kind: 'quote-builder'; version: 1; drafts: Draft[] };
export function parseBackup(raw: string): Draft[] {
  if (typeof raw !== 'string' || new TextEncoder().encode(raw).length > 1000000) throw new Error('Choose a quote backup no larger than 1 MB.');
  const value = JSON.parse(raw);
  if (!value || value.kind !== 'quote-builder' || value.version !== 1) throw new Error('This is not a supported quote backup.');
  return parseDrafts(JSON.stringify({version:1,drafts:value.drafts}));
}
