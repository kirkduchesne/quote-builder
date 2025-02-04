import { parseDrafts, type Draft, validDraft } from './drafts';
export type QuoteBackup = { kind: 'quote-builder'; version: 1; drafts: Draft[] };
export function parseBackup(raw: string): Draft[] {
  if (typeof raw !== 'string' || new TextEncoder().encode(raw).length > 1000000) throw new Error('Choose a quote backup no larger than 1 MB.');
  const value = JSON.parse(raw);
  if (!value || value.kind !== 'quote-builder' || value.version !== 1) throw new Error('This is not a supported quote backup.');
  return parseDrafts(JSON.stringify({version:1,drafts:value.drafts}));
}
export function mergeBackup(existing: Draft[], incoming: Draft[]): Draft[] {
  if (existing.length + incoming.length > 20 || !existing.every(validDraft) || !incoming.every(validDraft)) throw new Error('The combined collection must contain at most 20 valid drafts.');
  const result = [...existing];
  for (const draft of incoming) { let id=draft.id; let n=1; while(result.some(d=>d.id===id))id='import-'+n++; result.push({...draft,id,items:draft.items.map(item=>({...item}))}); }
  return result;
}
