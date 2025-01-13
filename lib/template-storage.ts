import { parseTemplates, type Template } from './templates';
export const templateKey = 'quote-builder-templates-v1';
export function loadTemplates(storage: Pick<Storage, 'getItem'>) {
  try { const raw = storage.getItem(templateKey); return { templates: raw === null ? [] : parseTemplates(raw), raw, readable: true }; }
  catch { return { templates: [] as Template[], raw: null, readable: false }; }
}
export function saveTemplates(storage: Pick<Storage, 'getItem' | 'setItem'>, templates: Template[], expected: string | null) {
  const raw = JSON.stringify({version:1, templates});
  parseTemplates(raw);
  if (storage.getItem(templateKey) !== expected) throw new Error('Service templates changed in another tab. Reload before saving.');
  storage.setItem(templateKey, raw);
  return raw;
}
