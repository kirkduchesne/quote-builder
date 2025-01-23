import { type Item, type Draft, unusedItemId, validDraft } from './drafts';
export function duplicateLine(items: Item[], id: number): Item[] {
  const index = items.findIndex(item => item.id === id);
  if (index < 0 || items.length >= 100) throw new Error('Select an existing line and keep at most 100 lines.');
  const next = [...items]; next.splice(index + 1, 0, { ...items[index], id: unusedItemId(items) }); return next;
}
export function moveLineUp(items: Item[], id: number): Item[] {
  const index = items.findIndex(item => item.id === id); const next = [...items];
  if (index > 0) [next[index-1], next[index]] = [next[index], next[index-1]];
  return next;
}
