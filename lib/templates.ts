import { type Item, unusedItemId } from './drafts';
export type Template = {
  id: number;
  name: string;
  description: string;
  quantity: number;
  cents: number;
};
export function validTemplate(value: unknown): value is Template {
  if (!value || typeof value !== 'object') return false;
  const t = value as Template;
  return (
    Number.isSafeInteger(t.id) &&
    t.id > 0 &&
    typeof t.name === 'string' &&
    t.name.trim().length > 0 &&
    t.name.length <= 80 &&
    typeof t.description === 'string' &&
    t.description.trim().length > 0 &&
    t.description.length <= 120 &&
    Number.isInteger(t.quantity) &&
    t.quantity >= 1 &&
    t.quantity <= 999 &&
    Number.isInteger(t.cents) &&
    t.cents >= 0 &&
    t.cents <= 99999999
  );
}
export function parseTemplates(raw: string): Template[] {
  const value = JSON.parse(raw);
  if (
    !value ||
    value.version !== 1 ||
    !Array.isArray(value.templates) ||
    value.templates.length > 30 ||
    !value.templates.every(validTemplate) ||
    new Set(value.templates.map((t: Template) => t.id)).size !==
      value.templates.length
  )
    throw new Error('Invalid saved service templates');
  return value.templates;
}
export function createTemplate(
  templates: Template[],
  fields: Omit<Template, 'id'>
): Template[] {
  if (templates.length >= 30)
    throw new Error('Keep at most 30 service templates.');
  let id = 1;
  while (templates.some((t) => t.id === id)) id++;
  const template = { ...fields, id };
  if (!validTemplate(template))
    throw new Error(
      'Check the template name, description, quantity, and price.'
    );
  return [...templates, template];
}
export function updateTemplate(
  templates: Template[],
  template: Template
): Template[] {
  if (!validTemplate(template) || !templates.some((t) => t.id === template.id))
    throw new Error('Template no longer exists or has invalid values.');
  return templates.map((t) => (t.id === template.id ? template : t));
}
export function deleteTemplate(templates: Template[], id: number) {
  return templates.filter((t) => t.id !== id);
}
export function searchTemplates(templates: Template[], query: string) {
  const q = query.trim().toLocaleLowerCase('en-US');
  return templates.filter((t) =>
    (t.name + ' ' + t.description).toLocaleLowerCase('en-US').includes(q)
  );
}
export function templateItem(template: Template, items: Item[]): Item {
  if (!validTemplate(template) || items.length >= 100)
    throw new Error('Check the template and keep at most 100 line items.');
  return {
    id: unusedItemId(items),
    description: template.description,
    quantity: template.quantity,
    cents: template.cents,
  };
}
