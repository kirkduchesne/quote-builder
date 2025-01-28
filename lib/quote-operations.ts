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
export function moveLineDown(items: Item[], id: number): Item[] {
  const index = items.findIndex(item => item.id === id); const next = [...items];
  if (index >= 0 && index < next.length-1) [next[index], next[index+1]] = [next[index+1], next[index]];
  return next;
}
export function duplicateDraft(drafts: Draft[], source: Draft): Draft {
  if (!validDraft(source) || drafts.length >= 20) throw new Error('Check the quote and keep at most 20 saved drafts.');
  let suffix=1; while(drafts.some(d=>d.id==='copy-'+suffix))suffix++;
  return {...source,id:'copy-'+suffix,name:source.name.slice(0,73)+' (copy)',items:source.items.map(item=>({...item}))};
}
export function searchDrafts(drafts: Draft[], query: string) { const q=query.trim().toLowerCase(); return drafts.filter(d=>(d.name+' '+d.reference).toLowerCase().includes(q)); }
