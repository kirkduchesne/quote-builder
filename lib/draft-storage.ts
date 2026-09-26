import { parseDrafts, type Draft } from './drafts';
export function writeDrafts(
  storage: Pick<Storage, 'getItem' | 'setItem'>,
  key: string,
  drafts: Draft[],
  expected: string | null
) {
  const raw = JSON.stringify({ version: 1, drafts });
  parseDrafts(raw);
  if (storage.getItem(key) !== expected)
    throw new Error(
      'Saved drafts changed outside this page. Reload before saving.'
    );
  storage.setItem(key, raw);
  return raw;
}
