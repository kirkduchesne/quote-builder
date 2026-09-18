import { parseDrafts, type Draft, validDraft } from './drafts';
export type QuoteBackup = {
  kind: 'quote-builder';
  version: 1;
  drafts: Draft[];
};
export function parseBackup(raw: string): Draft[] {
  if (typeof raw !== 'string' || new TextEncoder().encode(raw).length > 5000000)
    throw new Error('Choose a quote backup no larger than 5 MB.');
  const value = JSON.parse(raw);
  if (!value || value.kind !== 'quote-builder' || value.version !== 1)
    throw new Error('This is not a supported quote backup.');
  return parseDrafts(JSON.stringify({ version: 1, drafts: value.drafts }));
}
export function mergeBackup(
  existing: Draft[],
  incoming: Draft[],
  reservedIds: string[] = [],
): Draft[] {
  if (
    existing.length + incoming.length > 20 ||
    !existing.every(validDraft) ||
    !incoming.every(validDraft)
  )
    throw new Error(
      'The combined collection must contain at most 20 valid drafts.',
    );
  const result = [...existing];
  for (const draft of incoming) {
    let id = draft.id;
    let n = 1;
    while (result.some((d) => d.id === id) || reservedIds.includes(id))
      id = 'import-' + n++;
    let name = draft.name;
    let copy = 1;
    while (result.some((d) => d.name === name)) {
      const suffix = ' (import ' + copy++ + ')';
      name = draft.name.slice(0, 80 - suffix.length) + suffix;
    }
    result.push({
      ...draft,
      id,
      name,
      items: draft.items.map((item) => ({ ...item })),
    });
  }
  return result;
}
export function serializeBackup(drafts: Draft[]) {
  const raw = JSON.stringify(
    { kind: 'quote-builder', version: 1, drafts },
    null,
    2,
  );
  parseBackup(raw);
  return raw;
}
export function downloadBackup(drafts: Draft[]) {
  const url = URL.createObjectURL(
    new Blob([serializeBackup(drafts)], { type: 'application/json' }),
  );
  try {
    const link = document.createElement('a');
    link.href = url;
    link.download = 'quote-builder-drafts.json';
    document.body.appendChild(link);
    link.click();
    link.remove();
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}
export async function readBackupFile(file: Pick<File, 'size' | 'text'>) {
  if (file.size > 5000000)
    throw new Error('Choose a quote backup no larger than 5 MB.');
  try {
    return parseBackup(await file.text());
  } catch (error) {
    throw new Error('Backup could not be read: ' + (error as Error).message);
  }
}
