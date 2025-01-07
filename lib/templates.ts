import { type Item, unusedItemId } from './drafts';
export type Template = { id: number; name: string; description: string; quantity: number; cents: number };
export function validTemplate(value: unknown): value is Template {
  if (!value || typeof value !== 'object') return false;
  const t = value as Template;
  return Number.isSafeInteger(t.id) && t.id > 0 && typeof t.name === 'string' && t.name.trim().length > 0 && t.name.length <= 80 && typeof t.description === 'string' && t.description.trim().length > 0 && t.description.length <= 120 && Number.isInteger(t.quantity) && t.quantity >= 1 && t.quantity <= 999 && Number.isInteger(t.cents) && t.cents >= 0 && t.cents <= 99999999;
}
