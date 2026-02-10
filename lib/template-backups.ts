import { parseTemplates, type Template } from './templates';
export const templateBackupBytes = 512000;
export function parseTemplateBackup(raw: string): Template[] {
  if (new TextEncoder().encode(raw).length > templateBackupBytes) throw new Error('Choose a template backup no larger than 512 KB.');
  const value = JSON.parse(raw);
  if (!value || value.kind !== 'quote-builder-templates' || value.version !== 1) throw new Error('This is not a supported service-template backup.');
  return parseTemplates(JSON.stringify({ version: 1, templates: value.templates }));
}

export function serializeTemplateBackup(templates: Template[]): string {
  const raw = JSON.stringify({ kind: 'quote-builder-templates', version: 1, templates }, null, 2);
  parseTemplateBackup(raw);
  return raw;
}
