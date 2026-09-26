'use client';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { DownloadIcon, LayersIcon, PlusIcon } from '@/components/icons';
import { parseCents, dollars } from '@/lib/money';
import {
  createTemplate,
  updateTemplate,
  deleteTemplate,
  searchTemplates,
  type Template,
} from '@/lib/templates';
import {
  downloadTemplateBackup,
  readTemplateBackupFile,
  mergeTemplateBackup,
} from '@/lib/template-backups';
import { loadTemplates, saveTemplates } from '@/lib/template-storage';
export function TemplateManager({
  onInsert,
}: {
  onInsert: (template: Template) => void;
}) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const templatesRef = useRef<Template[]>([]);
  const importBusy = useRef(false);
  const [importing, setImporting] = useState(false);
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState('');
  const nameInput = useRef<HTMLInputElement>(null);
  const raw = useRef<string | null>(null);
  const readable = useRef(false);
  useEffect(() => {
    const loaded = loadTemplates({
      getItem: (key) => localStorage.getItem(key),
    });
    templatesRef.current = loaded.templates;
    setTemplates(loaded.templates);
    raw.current = loaded.raw;
    readable.current = loaded.readable;
    if (!loaded.readable)
      setMessage(
        'Saved templates could not be read. Changes will be session-only and leave saved data untouched.',
      );
    setReady(true);
  }, []);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [price, setPrice] = useState('');
  const [editing, setEditing] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [pending, setPending] = useState(false);
  useEffect(() => {
    function warn(e: BeforeUnloadEvent) {
      if (
        pending ||
        name ||
        description ||
        price ||
        quantity !== '1' ||
        editing !== null
      ) {
        e.preventDefault();
        e.returnValue = '';
      }
    }
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [pending, name, description, price, quantity, editing]);
  function persist(next: Template[]) {
    templatesRef.current = next;
    setTemplates(next);
    try {
      if (!readable.current)
        throw Error('Unreadable saved templates are protected.');
      raw.current = saveTemplates(localStorage, next, raw.current);
      setPending(false);
      setMessage('Service templates saved.');
    } catch (error) {
      setPending(true);
      setMessage((error as Error).message + ' Changes are session-only.');
    }
  }
  async function importFile(file: File) {
    if (importBusy.current) return;
    importBusy.current = true;
    setImporting(true);
    try {
      const incoming = await readTemplateBackupFile(file);
      if (incoming.length === 0) {
        setMessage('The template backup is empty. Nothing changed.');
        return;
      }
      const merged = mergeTemplateBackup(templatesRef.current, incoming);
      if (
        !window.confirm(
          'Import ' +
            incoming.length +
            ' service templates (' +
            (30 - merged.length) +
            ' spaces remain afterward)? Existing templates and unfinished edits are kept.',
        )
      ) {
        setMessage(
          'Template import cancelled. Templates and unfinished edits are unchanged.',
        );
        return;
      }
      persist(merged);
    } catch (error) {
      setMessage((error as Error).message);
    } finally {
      importBusy.current = false;
      setImporting(false);
    }
  }
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const cents = parseCents(price);
    try {
      if (cents === null)
        throw Error('Enter a price with at most two decimals.');
      const fields = {
        name: name.trim(),
        description: description.trim(),
        quantity: Number(quantity),
        cents,
      };
      persist(
        editing === null
          ? createTemplate(templates, fields)
          : updateTemplate(templates, { ...fields, id: editing }),
      );
      setName('');
      setDescription('');
      setQuantity('1');
      setPrice('');
      setEditing(null);
      nameInput.current?.focus();
    } catch (error) {
      setMessage((error as Error).message);
    }
  }
  const matches = searchTemplates(templates, search);
  return (
    <section
      aria-labelledby="templates-title"
      className="rounded-lg border bg-card shadow-sm print:hidden"
    >
      <details className="disclosure group">
        <summary className="px-4 py-3.5">
          <LayersIcon className="h-4 w-4 text-primary" />
          <span id="templates-title" className="font-semibold">
            Reusable service templates
          </span>
          <Badge variant="secondary" className="ml-auto tabular-nums">
            {templates.length}/30
          </Badge>
        </summary>
        <div className="space-y-4 border-t px-4 pb-4 pt-4">
          <form
            onSubmit={submit}
            className="grid gap-3 rounded-md bg-muted/50 p-3 sm:grid-cols-2"
          >
            <p className="eyebrow sm:col-span-2">
              {editing === null ? 'Create a template' : 'Edit template'}
            </p>
            <div>
              <label htmlFor="template-name">Template name</label>
              <Input
                ref={nameInput}
                id="template-name"
                value={name}
                maxLength={80}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div>
              <label htmlFor="template-description">Template description</label>
              <Input
                id="template-description"
                value={description}
                maxLength={120}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>
            <div>
              <label htmlFor="template-quantity">Template quantity</label>
              <Input
                id="template-quantity"
                inputMode="numeric"
                className="tabular-nums"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
              />
            </div>
            <div>
              <label htmlFor="template-price">Template unit price (USD)</label>
              <Input
                id="template-price"
                inputMode="decimal"
                className="tabular-nums"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
              />
            </div>
            <div className="flex flex-wrap gap-2 sm:col-span-2">
              <Button disabled={!ready} type="submit" size="sm">
                {editing === null ? 'Save template' : 'Update template'}
              </Button>
              {editing !== null ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditing(null);
                    setName('');
                    setDescription('');
                    setQuantity('1');
                    setPrice('');
                  }}
                >
                  Cancel template edit
                </Button>
              ) : null}
            </div>
          </form>
          {importing &&
            (name ||
              description ||
              price ||
              quantity !== '1' ||
              editing !== null) && (
              <p className="text-sm text-muted-foreground">
                Your unfinished template stays open during import. Save it
                separately when ready.
              </p>
            )}
          {pending && (
            <Alert as="p" variant="warning">
              Template changes are session-only. Export service templates
              before closing; unfinished form edits must be saved first.
            </Alert>
          )}
          <p role="status" className="status-line text-sm text-primary">
            {ready ? message : 'Loading templates…'}
          </p>
          <div>
            <label htmlFor="template-search">Find a service template</label>
            <Input
              id="template-search"
              type="search"
              placeholder="Search by name or description"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap justify-between gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <p>{matches.length} matching templates</p>
            <p>{30 - templates.length} service template spaces remaining.</p>
          </div>
          <ul className="divide-y rounded-md border">
            {matches.map((template) => (
              <li
                className="flex flex-wrap items-center gap-x-3 gap-y-2 px-3 py-2.5"
                key={template.id}
              >
                <div className="min-w-[12rem] flex-1">
                  <strong className="block font-medium [overflow-wrap:anywhere]">
                    {template.name}
                  </strong>
                  <p className="text-sm text-muted-foreground [overflow-wrap:anywhere]">
                    {template.description} ·{' '}
                    <span className="tabular-nums">
                      {template.quantity} × {dollars(template.cents)}
                    </span>
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1.5"
                    onClick={() => onInsert(template)}
                  >
                    <PlusIcon className="h-3.5 w-3.5" />
                    Use<span className="sr-only"> template {template.name}</span>
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8"
                    onClick={() => {
                      if (
                        (name ||
                          description ||
                          price ||
                          quantity !== '1' ||
                          editing !== null) &&
                        !window.confirm('Discard unfinished template edits?')
                      )
                        return;
                      setEditing(template.id);
                      setName(template.name);
                      setDescription(template.description);
                      setQuantity(String(template.quantity));
                      setPrice((template.cents / 100).toFixed(2));
                    }}
                  >
                    Edit
                    <span className="sr-only"> template {template.name}</span>
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    disabled={editing !== null}
                    onClick={() => {
                      if (
                        window.confirm(
                          'Delete service template ' + template.name + '?',
                        )
                      )
                        persist(deleteTemplate(templates, template.id));
                    }}
                  >
                    Delete
                    <span className="sr-only"> template {template.name}</span>
                  </Button>
                </div>
              </li>
            ))}
            {!templates.length ? (
              <li className="px-3 py-6 text-center text-sm text-muted-foreground">
                No service templates yet.
              </li>
            ) : null}
          </ul>
          <details className="disclosure">
            <summary className="text-sm font-medium">
              Import or export service templates
            </summary>
            <div className="mt-3 space-y-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-2"
                disabled={!ready}
                onClick={() => {
                  try {
                    downloadTemplateBackup(templates);
                    setMessage(
                      'Saved service templates exported. Unfinished edits are excluded.',
                    );
                  } catch {
                    setMessage(
                      'Template download could not start. Keep this page open and try again.',
                    );
                  }
                }}
              >
                <DownloadIcon />
                Export service templates
              </Button>
              <div>
                <label htmlFor="template-backup">
                  Import service-template backup
                </label>
                <input
                  id="template-backup"
                  className="file-input"
                  type="file"
                  accept=".json,application/json"
                  disabled={!ready || importing}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    event.target.value = '';
                    if (file) void importFile(file);
                  }}
                />
              </div>
              {importing && (
                <p role="status" className="text-sm text-muted-foreground">
                  Reading service-template backup…
                </p>
              )}
            </div>
          </details>
          <p className="text-xs text-muted-foreground">
            Template storage:{' '}
            {!ready
              ? 'loading'
              : pending
              ? 'session-only changes need export'
              : readable.current
              ? 'loaded successfully'
              : 'unreadable saved data protected'}
            .
          </p>
        </div>
      </details>
    </section>
  );
}
