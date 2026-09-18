import { parseTemplates, type Template } from './templates';
export const templateBackupBytes = 512000;
export function parseTemplateBackup(raw: string): Template[] {
  if (new TextEncoder().encode(raw).length > templateBackupBytes)
    throw new Error('Choose a template backup no larger than 512 KB.');
  const value = JSON.parse(raw);
  if (!value || value.kind !== 'quote-builder-templates' || value.version !== 1)
    throw new Error('This is not a supported service-template backup.');
  return parseTemplates(
    JSON.stringify({ version: 1, templates: value.templates }),
  );
}

export function serializeTemplateBackup(templates: Template[]): string {
  const raw = JSON.stringify(
    { kind: 'quote-builder-templates', version: 1, templates },
    null,
    2,
  );
  parseTemplateBackup(raw);
  return raw;
}

export function mergeTemplateBackup(
  existing: Template[],
  incoming: Template[],
): Template[] {
  parseTemplates(JSON.stringify({ version: 1, templates: existing }));
  parseTemplates(JSON.stringify({ version: 1, templates: incoming }));
  if (existing.length + incoming.length > 30)
    throw new Error('Keep at most 30 templates after importing.');
  const result = existing.map((template) => ({ ...template }));
  for (const template of incoming) {
    let id = 1;
    while (result.some((item) => item.id === id)) id += 1;
    let name = template.name;
    let suffix = 1;
    while (result.some((item) => item.name === name)) {
      const ending = ' (import ' + suffix++ + ')';
      name = template.name.slice(0, 80 - ending.length) + ending;
    }
    result.push({ ...template, id, name });
  }
  return result;
}

export async function readTemplateBackupFile(
  file: Pick<File, 'size' | 'text'>,
): Promise<Template[]> {
  if (file.size > templateBackupBytes)
    throw new Error('Choose a template backup no larger than 512 KB.');
  try {
    return parseTemplateBackup(await file.text());
  } catch (error) {
    throw new Error(
      'Template backup could not be read: ' + (error as Error).message,
    );
  }
}

export function downloadTemplateBackup(templates: Template[]): void {
  const url = URL.createObjectURL(
    new Blob([serializeTemplateBackup(templates)], {
      type: 'application/json',
    }),
  );
  try {
    const link = document.createElement('a');
    link.href = url;
    link.download = 'quote-builder-templates.json';
    document.body.appendChild(link);
    link.click();
    link.remove();
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}
