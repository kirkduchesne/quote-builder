import { parseTemplates, type Template } from './templates';
export const templateKey = 'quote-builder-templates-v1';
export function loadTemplates(storage: Pick<Storage, 'getItem'>) {
  try { const raw = storage.getItem(templateKey); return { templates: raw === null ? [] : parseTemplates(raw), raw, readable: true }; }
  catch { return { templates: [] as Template[], raw: null, readable: false }; }
}
